import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShopBotClient } from "@/lib/shopbot-client";
import { getSystemSettings } from "@/lib/settings-service";

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

    if (vendor.type !== "SHOPBOT") {
      return NextResponse.json(
        { success: false, error: "Automated catalog sync is currently supported for Shop Bot APIs" },
        { status: 400 }
      );
    }

    const client = new ShopBotClient(vendor.baseUrl, vendor.apiKey);
    const botProducts = await client.getProducts();

    const settings = await getSystemSettings();
    const markupFactor = 1 + settings.globalMarkupPercent / 100;

    let synced = 0;
    for (const p of botProducts) {
      const retailVnd = Math.round(p.price_vnd * markupFactor);
      const retailUsdt = parseFloat((p.price_usdt * markupFactor).toFixed(2));

      await prisma.product.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          name: p.name,
          category: p.category || "Subscription",
          description: p.description || `Instant automated delivery for ${p.name}`,
          costPriceVnd: p.price_vnd,
          costPriceUsdt: p.price_usdt,
          retailPriceVnd: retailVnd,
          retailPriceUsdt: retailUsdt,
          stock: p.stock,
          bonus: p.bonus || 0,
          isActive: true,
          vendorId: vendor.id,
          vendorProductRef: p.id.toString(),
        },
        update: {
          name: p.name,
          costPriceVnd: p.price_vnd,
          costPriceUsdt: p.price_usdt,
          retailPriceVnd: retailVnd,
          retailPriceUsdt: retailUsdt,
          stock: p.stock,
          bonus: p.bonus || 0,
          vendorId: vendor.id,
          vendorProductRef: p.id.toString(),
        },
      });
      synced++;
    }

    await prisma.auditLog.create({
      data: {
        action: "SYNC_VENDOR_PRODUCTS",
        details: `Synced ${synced} products from vendor ${vendor.name}`,
        actor: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${synced} products from ${vendor.name}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync from vendor" },
      { status: 500 }
    );
  }
}
