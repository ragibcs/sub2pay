import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { BinanceClient } from "@/lib/binance-client";
import { getSystemSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const settings = await getSystemSettings();

    const apiKey = body.apiKey !== undefined ? body.apiKey : settings.binanceApiKey;
    const apiSecret = body.apiSecret !== undefined ? body.apiSecret : settings.binanceApiSecret;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, message: "Please provide both Binance API Key and Secret to test" },
        { status: 400 }
      );
    }

    const client = new BinanceClient({
      apiKey,
      apiSecret,
    });

    const result = await client.testSpotConnection();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to test Binance connection",
      },
      { status: 400 }
    );
  }
}
