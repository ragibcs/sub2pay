import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShopBotClient } from "@/lib/shopbot-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const localBuffOrders = await prisma.buffOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    let externalHistory: any[] = [];
    try {
      const shopbot = await ShopBotClient.create();
      const hist = await shopbot.getBuffOrders(30);
      if (hist.success && Array.isArray(hist.orders)) {
        externalHistory = hist.orders;
      }
    } catch {
      // If external history fetch fails, return local only
    }

    return NextResponse.json({
      success: true,
      localOrders: localBuffOrders,
      externalHistory,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch Buff token orders" },
      { status: 500 }
    );
  }
}
