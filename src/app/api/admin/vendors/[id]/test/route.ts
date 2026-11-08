import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShopBotClient } from "@/lib/shopbot-client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({ where: { id } });

    if (!vendor) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.type === "LOCAL") {
      const cardCount = await prisma.cardKey.count({ where: { status: "AVAILABLE" } });
      return NextResponse.json({
        success: true,
        message: `Local card key storage is active (${cardCount} available keys)`,
        data: { availableCardKeys: cardCount },
      });
    }

    if (vendor.type === "SHOPBOT") {
      const client = new ShopBotClient(vendor.baseUrl, vendor.apiKey);
      const [balance, rate] = await Promise.all([client.getBalance(), client.getRate()]);

      // Update cached balance on vendor
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          balanceUsdt: balance.balance_usdt || 0,
          balanceVnd: balance.balance_vnd || 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Vendor API connection successful!",
        data: {
          balanceUsdt: balance.balance_usdt,
          balanceVnd: balance.balance_vnd,
          rate: rate.usdt_vnd,
        },
      });
    }

    // Generic API test
    if (vendor.baseUrl) {
      const testRes = await fetch(vendor.baseUrl, {
        headers: vendor.apiKey ? { Authorization: `Bearer ${vendor.apiKey}` } : {},
      });
      return NextResponse.json({
        success: testRes.ok,
        message: `Generic API responded with status ${testRes.status}`,
      });
    }

    return NextResponse.json({ success: true, message: "Vendor verified" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to connect to vendor API" },
      { status: 400 }
    );
  }
}
