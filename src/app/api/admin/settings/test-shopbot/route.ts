import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ShopBotClient } from "@/lib/shopbot-client";
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

    const baseUrl = body.baseUrl || settings.shopbotBaseUrl;
    const apiKey = body.apiKey !== undefined ? body.apiKey : settings.shopbotApiKey;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Please provide a Shop Bot API Key to test" },
        { status: 400 }
      );
    }

    const client = new ShopBotClient(baseUrl, apiKey);
    const [balance, rate] = await Promise.all([client.getBalance(), client.getRate()]);

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
      data: {
        balance_usdt: balance.balance_usdt,
        balance_vnd: balance.balance_vnd,
        exchangeRate: rate.usdt_vnd,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to connect to Shop Bot API",
      },
      { status: 400 }
    );
  }
}
