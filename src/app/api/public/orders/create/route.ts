import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { getSystemSettings } from "@/lib/settings-service";
import { BinanceClient } from "@/lib/binance-client";
import { ShopBotClient } from "@/lib/shopbot-client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`order_create_${ip}`, { limit: 15, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Order creation rate limit reached. Please wait ${rateCheck.resetInSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { productId, quantity = 1, customerEmail, paymentMethod = "BINANCE_DEPOSIT", currency = "usdt" } = body;

    if (!productId || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "Product ID and customer email are required" },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { success: false, error: "Quantity must be between 1 and 100" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: "Product not found or currently unavailable" },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: `Only ${product.stock} units available in stock` },
        { status: 400 }
      );
    }

    // Verify payment method is enabled
    const channel = await prisma.paymentChannel.findUnique({
      where: { code: paymentMethod },
    });
    if (channel && !channel.isEnabled) {
      return NextResponse.json(
        { success: false, error: `Payment method ${channel.name} is currently disabled` },
        { status: 400 }
      );
    }

    const settings = await getSystemSettings();
    const orderNumber = generateOrderNumber("SUB");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes payment window

    let totalAmount = 0;
    let wholesalePrice = 0;
    let exactPayAmount = 0;
    let paymentAddress = settings.binanceDepositAddress;
    let paymentCode: string | null = null;
    let binancePayData: any = null;

    if (currency.toLowerCase() === "vnd") {
      totalAmount = (product.retailPriceVnd || product.costPriceVnd) * quantity;
      wholesalePrice = product.costPriceVnd * quantity;
    } else {
      totalAmount = (product.retailPriceUsdt || product.costPriceUsdt) * quantity;
      wholesalePrice = product.costPriceUsdt * quantity;
    }

    // Generate unique fractional offset for USDT auto-detection (e.g. 10.0123)
    if (paymentMethod === "BINANCE_DEPOSIT") {
      // Offset between 0.0011 and 0.0099
      const randomOffset = Math.floor(Math.random() * 89 + 11) / 10000;
      const baseUsdt = currency.toLowerCase() === "usdt" ? totalAmount : totalAmount / 25650;
      exactPayAmount = parseFloat((baseUsdt + randomOffset).toFixed(4));
    }

    // Mode B: Binance Pay Merchant Gateway
    if (paymentMethod === "BINANCE_PAY" && settings.binancePayApiKey) {
      try {
        const binance = await BinanceClient.create();
        const baseUsdt = currency.toLowerCase() === "usdt" ? totalAmount : totalAmount / 25650;
        const bpayRes = await binance.createBinancePayOrder({
          merchantTradeNo: orderNumber,
          orderAmount: baseUsdt,
          goodsName: product.name,
          goodsDetail: `${quantity}x ${product.name}`,
        });

        if (bpayRes?.status === "SUCCESS" && bpayRes.data) {
          binancePayData = bpayRes.data;
          paymentCode = bpayRes.data.prepayId;
        }
      } catch (payErr: any) {
        console.warn("Binance Pay order creation failed, fallback to direct deposit:", payErr.message);
      }
    }

    // Mode C: Shop Bot Native Deposit Backup
    if (paymentMethod === "SHOPBOT_DEPOSIT") {
      try {
        const shopbot = await ShopBotClient.create();
        const baseUsdt = currency.toLowerCase() === "usdt" ? totalAmount : totalAmount / 25650;
        const depRes = await shopbot.createDeposit(Math.ceil(baseUsdt), "usdt");
        if (depRes.success && depRes.deposit) {
          paymentAddress = depRes.deposit.wallet_transfer.address;
          exactPayAmount = depRes.deposit.wallet_transfer.exact_amount;
          paymentCode = depRes.deposit.payment_code;
        }
      } catch (depErr: any) {
        console.warn("Shop Bot deposit call failed:", depErr.message);
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerEmail,
        productId: product.id,
        productName: product.name,
        quantity,
        currency: currency.toLowerCase(),
        wholesalePrice,
        totalAmount,
        paymentMethod,
        paymentStatus: "PENDING",
        paymentAddress: paymentAddress || "Connect Binance Deposit Address in Admin",
        exactPayAmount: exactPayAmount > 0 ? exactPayAmount : totalAmount,
        paymentCode,
        paymentExpiresAt: expiresAt,
        fulfillmentStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        productName: order.productName,
        quantity: order.quantity,
        currency: order.currency,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentAddress: order.paymentAddress,
        exactPayAmount: order.exactPayAmount,
        network: settings.binanceDepositNetwork || "BEP20",
        expiresAt: order.paymentExpiresAt,
        binancePay: binancePayData,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
