import { NextResponse } from "next/server";
import { ShopBotClient } from "@/lib/shopbot-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shopbot = await ShopBotClient.create();
    const rateData = await shopbot.getRate();
    return NextResponse.json(rateData);
  } catch (err: any) {
    // Fallback rate if external API is temporarily down
    return NextResponse.json({
      success: true,
      usdt_vnd: 25650.0,
      description: "Fallback 1 USDT = 25,650 VND",
      fallback: true,
    });
  }
}
