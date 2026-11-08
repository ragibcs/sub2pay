import { NextResponse } from "next/server";
import { ShopBotClient } from "@/lib/shopbot-client";
import { getSystemSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { ordersText } = await req.json();

    if (!ordersText || typeof ordersText !== "string") {
      return NextResponse.json(
        { success: false, error: "ordersText is required (one INVITE_CODE QUANTITY per line)" },
        { status: 400 }
      );
    }

    const shopbot = await ShopBotClient.create();
    const checkRes = await shopbot.checkBuff(ordersText);

    if (!checkRes.success) {
      return NextResponse.json(
        { success: false, error: checkRes.error || "Failed to validate invite codes" },
        { status: 400 }
      );
    }

    const settings = await getSystemSettings();
    const markupFactor = 1 + settings.globalMarkupPercent / 100;

    const retailPriceVnd = Math.round(checkRes.sell_price_vnd * markupFactor);
    const retailPriceUsdt = parseFloat((checkRes.sell_price_usdt * markupFactor).toFixed(2));

    return NextResponse.json({
      success: true,
      fundable: checkRes.fundable,
      gross_cost_vnd: checkRes.gross_cost_vnd,
      sell_price_vnd: retailPriceVnd,
      sell_price_usdt: retailPriceUsdt,
      orders_breakdown: checkRes.orders_breakdown,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to price buff token order" },
      { status: 500 }
    );
  }
}
