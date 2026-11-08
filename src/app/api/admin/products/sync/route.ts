import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShopBotClient } from "@/lib/shopbot-client";
import { getSystemSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shopbot = await ShopBotClient.create();
    const botProducts = await shopbot.getProducts();

    const settings = await getSystemSettings();
    const markupFactor = 1 + settings.globalMarkupPercent / 100;

    let syncedCount = 0;

    for (const p of botProducts) {
      const retailVnd = Math.round(p.price_vnd * markupFactor);
      const retailUsdt = parseFloat((p.price_usdt * markupFactor).toFixed(2));

      await prisma.product.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          name: p.name,
          category: p.category || "Subscription",
          description: p.description || `Instant delivery for ${p.name}`,
          costPriceVnd: p.price_vnd,
          costPriceUsdt: p.price_usdt,
          retailPriceVnd: retailVnd,
          retailPriceUsdt: retailUsdt,
          stock: p.stock,
          bonus: p.bonus || 0,
          isActive: true,
        },
        update: {
          name: p.name,
          costPriceVnd: p.price_vnd,
          costPriceUsdt: p.price_usdt,
          retailPriceVnd: retailVnd,
          retailPriceUsdt: retailUsdt,
          stock: p.stock,
          bonus: p.bonus || 0,
        },
      });
      syncedCount++;
    }

    await prisma.auditLog.create({
      data: {
        action: "SYNC_PRODUCTS",
        details: `Synced ${syncedCount} products from Shop Bot wholesale API`,
        actor: admin.email,
      },
    });

    const products = await prisma.product.findMany({
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} products`,
      products,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to sync products" },
      { status: 500 }
    );
  }
}
