import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { ShopBotClient } from "@/lib/shopbot-client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { amount, currency = "usdt" } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json(
        { success: false, error: "Minimum deposit is 1 USDT" },
        { status: 400 }
      );
    }

    const shopbot = await ShopBotClient.create();
    const depositRes = await shopbot.createDeposit(parseFloat(amount), currency);

    await prisma.auditLog.create({
      data: {
        action: "CREATE_BOT_DEPOSIT",
        details: `Created bot deposit request for ${amount} USDT (Code: ${depositRes.deposit?.payment_code})`,
        actor: admin.email,
      },
    });

    return NextResponse.json(depositRes);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create deposit request" },
      { status: 500 }
    );
  }
}
