import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ShopBotClient } from "@/lib/shopbot-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shopbot = await ShopBotClient.create();
    const [balance, rate] = await Promise.all([shopbot.getBalance(), shopbot.getRate()]);

    return NextResponse.json({
      success: true,
      balance,
      rate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch bot balance" },
      { status: 500 }
    );
  }
}
