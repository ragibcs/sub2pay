import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId, keysText } = await req.json();

    if (!productId || !keysText || typeof keysText !== "string") {
      return NextResponse.json(
        { success: false, error: "productId and keysText (one card key per line) are required" },
        { status: 400 }
      );
    }

    const lines = keysText
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    if (lines.length === 0) {
      return NextResponse.json({ success: false, error: "No valid keys found" }, { status: 400 });
    }

    const created = await prisma.cardKey.createMany({
      data: lines.map((cardContent: string) => ({
        productId: parseInt(productId),
        cardContent,
        status: "AVAILABLE",
      })),
    });

    // Update product stock count
    const availableCount = await prisma.cardKey.count({
      where: { productId: parseInt(productId), status: "AVAILABLE" },
    });

    await prisma.product.update({
      where: { id: parseInt(productId) },
      data: { stock: availableCount, deliveryType: "CARD_KEY" },
    });

    await prisma.auditLog.create({
      data: {
        action: "IMPORT_CARD_KEYS",
        details: `Imported ${created.count} card keys for product #${productId}`,
        actor: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      importedCount: created.count,
      newStock: availableCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to import card keys" },
      { status: 500 }
    );
  }
}
