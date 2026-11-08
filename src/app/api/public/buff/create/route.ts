import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShopBotClient } from "@/lib/shopbot-client";
import { getSystemSettings } from "@/lib/settings-service";
import { generateOrderNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { ordersText, customerEmail, currency = "usdt" } = await req.json();

    if (!ordersText || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "ordersText and customerEmail are required" },
        { status: 400 }
      );
    }

    const shopbot = await ShopBotClient.create();
    const checkRes = await shopbot.checkBuff(ordersText);

    if (!checkRes.success || !checkRes.fundable) {
      return NextResponse.json(
        { success: false, error: checkRes.error || "Order cannot be processed at this time" },
        { status: 400 }
      );
    }

    const settings = await getSystemSettings();
    const markupFactor = 1 + settings.globalMarkupPercent / 100;
    const retailVnd = Math.round(checkRes.sell_price_vnd * markupFactor);
    const retailUsdt = parseFloat((checkRes.sell_price_usdt * markupFactor).toFixed(2));

    const totalTokensB = checkRes.orders_breakdown.reduce(
      (sum, item) => sum + (item.quantity_b || 0),
      0
    );

    const batchId = generateOrderNumber("BUFF");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const randomOffset = Math.floor(Math.random() * 89 + 11) / 10000;
    const exactPayAmount = parseFloat((retailUsdt + randomOffset).toFixed(4));

    const buffOrder = await prisma.buffOrder.create({
      data: {
        batchId,
        customerEmail,
        ordersText,
        totalTokensB,
        wholesaleCostVnd: checkRes.gross_cost_vnd,
        wholesaleCostUsdt: checkRes.sell_price_usdt,
        sellPriceVnd: retailVnd,
        sellPriceUsdt: retailUsdt,
        currency: currency.toLowerCase(),
        paymentMethod: "BINANCE_DEPOSIT",
        paymentStatus: "PENDING",
        paymentAddress: settings.binanceDepositAddress || "Connect Binance Deposit Address in Admin",
        exactPayAmount,
        paymentExpiresAt: expiresAt,
        status: "PENDING",
        ordersJson: JSON.stringify(checkRes.orders_breakdown),
      },
    });

    return NextResponse.json({
      success: true,
      batchId: buffOrder.batchId,
      totalTokensB: buffOrder.totalTokensB,
      sellPriceUsdt: buffOrder.sellPriceUsdt,
      sellPriceVnd: buffOrder.sellPriceVnd,
      exactPayAmount: buffOrder.exactPayAmount,
      paymentAddress: buffOrder.paymentAddress,
      network: settings.binanceDepositNetwork || "BEP20",
      expiresAt: buffOrder.paymentExpiresAt,
      ordersBreakdown: checkRes.orders_breakdown,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create Buff Token order" },
      { status: 500 }
    );
  }
}
