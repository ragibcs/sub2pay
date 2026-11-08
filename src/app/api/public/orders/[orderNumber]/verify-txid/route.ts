import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BinanceClient } from "@/lib/binance-client";
import { FulfillmentService } from "@/lib/fulfillment-service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`verify_txid_${ip}`, { limit: 10, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "Too many verification requests. Please wait." },
        { status: 429 }
      );
    }

    const { orderNumber } = await params;
    const { txId } = await req.json();

    if (!txId || typeof txId !== "string" || txId.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Transaction Hash / TxID" },
        { status: 400 }
      );
    }

    const cleanTxId = txId.trim();

    // Check if txId already used on another completed order
    const existingTx = await prisma.order.findFirst({
      where: {
        paymentTxId: cleanTxId,
        orderNumber: { not: orderNumber },
        paymentStatus: "PAID",
      },
    });

    if (existingTx) {
      return NextResponse.json(
        { success: false, error: "This Transaction Hash has already been used on another order." },
        { status: 409 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.fulfillmentStatus === "DELIVERED") {
      let items: string[] = [];
      try {
        items = order.deliveredItems ? JSON.parse(order.deliveredItems) : [];
      } catch {
        items = order.deliveredItems ? [order.deliveredItems] : [];
      }
      return NextResponse.json({
        success: true,
        verified: true,
        delivered: true,
        deliveredItems: items,
        message: "Order already delivered",
      });
    }

    // Query Binance deposit records
    let matched = false;
    try {
      const binance = await BinanceClient.create();
      const deposits = await binance.getDepositHistory({
        coin: "USDT",
        status: 1,
        limit: 50,
      });

      for (const dep of deposits) {
        if (
          dep.txId.toLowerCase() === cleanTxId.toLowerCase() ||
          cleanTxId.toLowerCase().includes(dep.txId.toLowerCase())
        ) {
          matched = true;
          break;
        }
      }
    } catch (e: any) {
      console.warn("[VerifyTxId] Binance check exception:", e.message);
    }

    // If verified or test mode, record payment and fulfill
    if (matched) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentTxId: cleanTxId,
        },
      });

      const fulfillRes = await FulfillmentService.checkAndFulfillOrder(order.orderNumber);

      return NextResponse.json({
        success: true,
        verified: true,
        delivered: fulfillRes.fulfilled,
        deliveredItems: fulfillRes.deliveredItems || [],
        message: "Transaction verified successfully on blockchain!",
      });
    }

    // If not found in confirmed Binance deposits yet
    return NextResponse.json({
      success: false,
      verified: false,
      error:
        "Transaction Hash was not found in confirmed Binance deposits yet. Please ensure you sent USDT via BEP20 to the correct address, or wait 1-2 minutes for blockchain confirmations.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify transaction hash" },
      { status: 500 }
    );
  }
}
