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
    const [totalOrders, pendingOrders, deliveredOrders, failedOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "PENDING" } }),
      prisma.order.count({ where: { fulfillmentStatus: "DELIVERED" } }),
      prisma.order.count({ where: { fulfillmentStatus: "FAILED" } }),
    ]);

    const deliveredRecords = await prisma.order.findMany({
      where: { fulfillmentStatus: "DELIVERED" },
      select: { totalAmount: true, currency: true, wholesalePrice: true },
    });

    let totalRevenueUsdt = 0;
    let totalRevenueVnd = 0;
    let estimatedProfitUsdt = 0;

    for (const r of deliveredRecords) {
      if (r.currency.toLowerCase() === "vnd") {
        totalRevenueVnd += r.totalAmount;
      } else {
        totalRevenueUsdt += r.totalAmount;
        estimatedProfitUsdt += Math.max(0, r.totalAmount - r.wholesalePrice);
      }
    }

    // Fetch live Shop Bot master balance
    let botBalance = { balance_vnd: 0, balance_usdt: 0 };
    let liveRate = 25658;
    try {
      const shopbot = await ShopBotClient.create();
      const [bal, rate] = await Promise.all([shopbot.getBalance(), shopbot.getRate()]);
      botBalance = bal;
      liveRate = rate.usdt_vnd || 25658;
    } catch {
      // If external API key is not configured yet, display 0
    }

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        failedOrders,
        totalRevenueUsdt,
        totalRevenueVnd,
        estimatedProfitUsdt,
        botBalance,
        liveRate,
      },
      recentOrders,
      recentLogs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
