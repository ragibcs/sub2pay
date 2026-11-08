import { prisma } from "./prisma";
import { ShopBotClient, type ShopBotBuyResponse } from "./shopbot-client";
import { BinanceClient } from "./binance-client";
import { EmailService } from "./email-service";

export interface OrderVerificationResult {
  paid: boolean;
  fulfilled: boolean;
  status: string;
  deliveredItems?: string[];
  message: string;
}

export class FulfillmentService {
  /**
   * Verifies payment and executes automatic fulfillment for digital subscriptions
   */
  static async checkAndFulfillOrder(orderNumber: string): Promise<OrderVerificationResult> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return { paid: false, fulfilled: false, status: "NOT_FOUND", message: "Order not found" };
    }

    // Already delivered
    if (order.fulfillmentStatus === "DELIVERED") {
      let items: string[] = [];
      try {
        items = order.deliveredItems ? JSON.parse(order.deliveredItems) : [];
      } catch {
        items = order.deliveredItems ? [order.deliveredItems] : [];
      }
      return {
        paid: true,
        fulfilled: true,
        status: "DELIVERED",
        deliveredItems: items,
        message: "Order already delivered",
      };
    }

    // Check expiration
    if (order.paymentStatus === "PENDING" && new Date() > order.paymentExpiresAt) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "EXPIRED" },
      });
      return { paid: false, fulfilled: false, status: "EXPIRED", message: "Payment time expired" };
    }

    let isPaid = order.paymentStatus === "PAID";
    let detectedTxId = order.paymentTxId;

    // Verify payment if still pending
    if (!isPaid) {
      if (order.paymentMethod === "BINANCE_DEPOSIT") {
        const binance = await BinanceClient.create();
        const match = await binance.matchDeposit({
          exactAmount: order.exactPayAmount || order.totalAmount,
          orderCreatedAt: order.createdAt,
          targetAddress: order.paymentAddress || undefined,
        });

        if (match.matched) {
          isPaid = true;
          detectedTxId = match.txId || `BN-${Date.now()}`;
        }
      } else if (order.paymentMethod === "BINANCE_PAY" && order.paymentCode) {
        const binance = await BinanceClient.create();
        const payRes = await binance.queryBinancePayOrder(order.orderNumber);
        if (payRes?.data?.status === "PAID" || payRes?.data?.status === "SUCCESS") {
          isPaid = true;
          detectedTxId = payRes.data?.transactionId || `BPAY-${Date.now()}`;
        }
      } else if (order.paymentMethod === "SHOPBOT_DEPOSIT" && order.paymentCode) {
        const shopbot = await ShopBotClient.create();
        const depStatus = await shopbot.checkDepositStatus(order.paymentCode);
        if (depStatus.paid || depStatus.deposit?.status === "confirmed") {
          isPaid = true;
          detectedTxId = `DEP-${order.paymentCode}`;
        }
      }
    }

    // If payment just confirmed, update DB
    if (isPaid && order.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentTxId: detectedTxId,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_CONFIRMED",
          details: `Order ${order.orderNumber} confirmed via ${order.paymentMethod} (txId: ${detectedTxId})`,
          actor: "SYSTEM",
        },
      });
    }

    if (!isPaid) {
      return {
        paid: false,
        fulfilled: false,
        status: order.paymentStatus,
        message: "Payment not detected yet. Please transfer the exact amount.",
      };
    }

    // Payment is confirmed! Now fulfill product through Multi-Vendor Routing
    const product = await prisma.product.findUnique({
      where: { id: order.productId },
      include: { vendor: true },
    });

    try {
      // Route 1: Local Card Key Inventory (Atomic Transaction to prevent double-selling)
      if (product?.deliveryType === "CARD_KEY" || product?.vendor?.type === "LOCAL") {
        const delivered = await prisma.$transaction(async (tx) => {
          const availableKeys = await tx.cardKey.findMany({
            where: { productId: order.productId, status: "AVAILABLE" },
            take: order.quantity,
          });

          if (availableKeys.length < order.quantity) {
            return null; // Not enough stock right now
          }

          const items = availableKeys.map((k) => k.cardContent);
          const keyIds = availableKeys.map((k) => k.id);

          await tx.cardKey.updateMany({
            where: { id: { in: keyIds }, status: "AVAILABLE" },
            data: { status: "SOLD", orderId: order.id, soldAt: new Date() },
          });

          // Decrement product stock safely
          await tx.product.update({
            where: { id: order.productId },
            data: { stock: { decrement: order.quantity } },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              fulfillmentStatus: "DELIVERED",
              deliveredItems: JSON.stringify(items),
              vendorId: product.vendorId || null,
              vendorName: product.vendor?.name || "Local Card Pool",
              fulfillmentError: null,
            },
          });

          return items;
        });

        if (delivered && delivered.length > 0) {
          await prisma.auditLog.create({
            data: {
              action: "ORDER_FULFILLED_LOCAL",
              details: `Order ${order.orderNumber} delivered ${delivered.length} card key(s) from local pool`,
              actor: "SYSTEM",
            },
          });

          // Send transactional delivery email
          EmailService.sendOrderDeliveryEmail({
            toEmail: order.customerEmail,
            orderNumber: order.orderNumber,
            productName: order.productName,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            currency: order.currency,
            deliveredItems: delivered,
            txId: order.paymentTxId,
          }).catch((e) => console.warn("[Fulfillment] Email trigger warning:", e));

          return {
            paid: true,
            fulfilled: true,
            status: "DELIVERED",
            deliveredItems: delivered,
            message: "Payment confirmed and card keys delivered instantly!",
          };
        }
      }

      // Route 2: External Shop Bot API Vendor (Default or Specific)
      const vendor = product?.vendor;
      const targetBaseUrl = vendor?.baseUrl || undefined;
      const targetApiKey = vendor?.apiKey || undefined;
      const externalProdId = product?.vendorProductRef
        ? parseInt(product.vendorProductRef)
        : order.productId;

      const shopbot = targetBaseUrl
        ? new ShopBotClient(targetBaseUrl, targetApiKey)
        : await ShopBotClient.create();

      // Execute wholesale purchase on vendor API
      const buyRes = await shopbot.buyProduct(
        externalProdId,
        order.quantity,
        (order.currency.toLowerCase() === "vnd" ? "vnd" : "usdt") as "vnd" | "usdt"
      );

      if (buyRes.success && buyRes.items && buyRes.items.length > 0) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            fulfillmentStatus: "DELIVERED",
            vendorId: vendor?.id || null,
            vendorName: vendor?.name || "Shop Bot API",
            shopbotOrderGroup: buyRes.order?.order_group || null,
            deliveredItems: JSON.stringify(buyRes.items),
            fulfillmentError: null,
          },
        });

        await prisma.auditLog.create({
          data: {
            action: "ORDER_FULFILLED",
            details: `Order ${order.orderNumber} fulfilled via vendor [${vendor?.name || "ShopBot"}]: delivered ${buyRes.items.length} item(s)`,
            actor: "SYSTEM",
          },
        });

        // Send transactional delivery email
        EmailService.sendOrderDeliveryEmail({
          toEmail: order.customerEmail,
          orderNumber: order.orderNumber,
          productName: order.productName,
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          currency: order.currency,
          deliveredItems: buyRes.items,
          txId: order.paymentTxId,
        }).catch((e) => console.warn("[Fulfillment] Email trigger warning:", e));

        return {
          paid: true,
          fulfilled: true,
          status: "DELIVERED",
          deliveredItems: buyRes.items,
          message: "Payment confirmed and order fulfilled successfully!",
        };
      } else {
        const errMsg = buyRes.error || "No credentials returned by supplier";
        await prisma.order.update({
          where: { id: order.id },
          data: {
            fulfillmentStatus: "FAILED",
            fulfillmentError: errMsg,
          },
        });

        EmailService.sendAdminAlert(
          `Fulfillment Failed for Order #${order.orderNumber}`,
          `Order #${order.orderNumber} (${product?.name}) payment confirmed, but wholesale fulfillment returned: ${errMsg}`
        ).catch(() => {});

        return {
          paid: true,
          fulfilled: false,
          status: "FULFILLMENT_FAILED",
          message: `Payment confirmed but supplier error: ${errMsg}. Admin has been notified.`,
        };
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to call supplier buy endpoint";
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: "FAILED",
          fulfillmentError: errMsg,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "FULFILLMENT_ERROR",
          details: `Order ${order.orderNumber} fulfillment error: ${errMsg}`,
          actor: "SYSTEM",
        },
      });

      EmailService.sendAdminAlert(
        `Fulfillment Exception on Order #${order.orderNumber}`,
        `Exception: ${errMsg}`
      ).catch(() => {});

      return {
        paid: true,
        fulfilled: false,
        status: "FULFILLMENT_FAILED",
        message: `Payment confirmed but fulfillment pending: ${errMsg}.`,
      };
    }
  }

  /**
   * Admin manual retry fulfillment
   */
  static async retryFulfillment(orderId: string): Promise<ShopBotBuyResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error("Order not found");

    const product = await prisma.product.findUnique({
      where: { id: order.productId },
      include: { vendor: true },
    });

    // Check local card key
    if (product?.deliveryType === "CARD_KEY" || product?.vendor?.type === "LOCAL") {
      const availableKeys = await prisma.cardKey.findMany({
        where: { productId: order.productId, status: "AVAILABLE" },
        take: order.quantity,
      });

      if (availableKeys.length >= order.quantity) {
        const items = availableKeys.map((k) => k.cardContent);
        const keyIds = availableKeys.map((k) => k.id);

        await prisma.cardKey.updateMany({
          where: { id: { in: keyIds } },
          data: { status: "SOLD", orderId: order.id, soldAt: new Date() },
        });

        await prisma.product.update({
          where: { id: order.productId },
          data: { stock: { decrement: order.quantity } },
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            fulfillmentStatus: "DELIVERED",
            deliveredItems: JSON.stringify(items),
            vendorName: product.vendor?.name || "Local Card Pool",
            fulfillmentError: null,
          },
        });

        return { success: true, items };
      }
    }

    const vendor = product?.vendor;
    const targetBaseUrl = vendor?.baseUrl || undefined;
    const targetApiKey = vendor?.apiKey || undefined;
    const externalProdId = product?.vendorProductRef
      ? parseInt(product.vendorProductRef)
      : order.productId;

    const shopbot = targetBaseUrl
      ? new ShopBotClient(targetBaseUrl, targetApiKey)
      : await ShopBotClient.create();

    const buyRes = await shopbot.buyProduct(
      externalProdId,
      order.quantity,
      (order.currency.toLowerCase() === "vnd" ? "vnd" : "usdt") as "vnd" | "usdt"
    );

    if (buyRes.success && buyRes.items && buyRes.items.length > 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentStatus: "DELIVERED",
          vendorName: vendor?.name || "Shop Bot API",
          shopbotOrderGroup: buyRes.order?.order_group,
          deliveredItems: JSON.stringify(buyRes.items),
          fulfillmentError: null,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "RETRY_FULFILLMENT_SUCCESS",
          details: `Manual retry succeeded for ${order.orderNumber}`,
          actor: "ADMIN",
        },
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          fulfillmentError: buyRes.error || "Retry failed",
        },
      });
    }

    return buyRes;
  }

  /**
   * Check & fulfill Muse AI Buff Token orders
   */
  static async checkAndFulfillBuffOrder(batchId: string): Promise<any> {
    const buffOrder = await prisma.buffOrder.findUnique({
      where: { batchId },
    });

    if (!buffOrder) throw new Error("Buff order not found");
    if (buffOrder.isDone) return buffOrder;

    let isPaid = buffOrder.paymentStatus === "PAID";

    if (!isPaid) {
      const binance = await BinanceClient.create();
      const match = await binance.matchDeposit({
        exactAmount: buffOrder.exactPayAmount || buffOrder.sellPriceUsdt,
        orderCreatedAt: buffOrder.createdAt,
        targetAddress: buffOrder.paymentAddress || undefined,
      });

      if (match.matched) {
        isPaid = true;
        await prisma.buffOrder.update({
          where: { id: buffOrder.id },
          data: {
            paymentStatus: "PAID",
            paymentTxId: match.txId,
          },
        });
      }
    }

    if (!isPaid) {
      return { ...buffOrder, paid: false, message: "Awaiting payment" };
    }

    const shopbot = await ShopBotClient.create();

    // If order was not placed with external bot yet, place it
    if (!buffOrder.shopbotBatchId) {
      const orderRes = await shopbot.orderBuff(
        buffOrder.ordersText,
        (buffOrder.currency.toLowerCase() === "vnd" ? "vnd" : "usdt") as "vnd" | "usdt"
      );

      if (orderRes.success && orderRes.batch_id) {
        await prisma.buffOrder.update({
          where: { id: buffOrder.id },
          data: {
            shopbotBatchId: orderRes.batch_id,
            status: "PROCESSING",
          },
        });
        buffOrder.shopbotBatchId = orderRes.batch_id;
      }
    }

    // If placed with external bot, poll its status
    if (buffOrder.shopbotBatchId) {
      const statusRes = await shopbot.getBuffStatus(buffOrder.shopbotBatchId);
      if (statusRes.success) {
        await prisma.buffOrder.update({
          where: { id: buffOrder.id },
          data: {
            status: statusRes.is_done ? "DONE" : "PROCESSING",
            isDone: statusRes.is_done,
            ordersJson: JSON.stringify(statusRes.orders),
          },
        });
        return {
          ...buffOrder,
          status: statusRes.is_done ? "DONE" : "PROCESSING",
          isDone: statusRes.is_done,
          orders: statusRes.orders,
        };
      }
    }

    return buffOrder;
  }
}
