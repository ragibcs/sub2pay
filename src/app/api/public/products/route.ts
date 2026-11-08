import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShopBotClient } from "@/lib/shopbot-client";
import { getSystemSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });

    const settings = await getSystemSettings();
    const markupFactor = 1 + settings.globalMarkupPercent / 100;

    // If local database has no products yet, auto-sync from Shop Bot wholesale API
    if (products.length === 0) {
      try {
        const shopbot = await ShopBotClient.create();
        const botProducts = await shopbot.getProducts();

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
              costPriceVnd: p.price_vnd,
              costPriceUsdt: p.price_usdt,
              stock: p.stock,
              bonus: p.bonus || 0,
            },
          });
        }

        products = await prisma.product.findMany({
          where: { isActive: true },
          orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        });
      } catch (syncErr) {
        console.warn("Could not auto-sync products from external shopbot:", syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      products,
      markupPercent: settings.globalMarkupPercent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
