import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const status = searchParams.get("status");

  const where: Record<string, any> = {};
  if (productId) where.productId = parseInt(productId);
  if (status) where.status = status;

  try {
    const cardKeys = await prisma.cardKey.findMany({
      where,
      include: {
        product: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const [total, available, sold] = await Promise.all([
      prisma.cardKey.count({ where }),
      prisma.cardKey.count({ where: { ...where, status: "AVAILABLE" } }),
      prisma.cardKey.count({ where: { ...where, status: "SOLD" } }),
    ]);

    return NextResponse.json({
      success: true,
      cardKeys,
      stats: { total, available, sold },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch card keys" },
      { status: 500 }
    );
  }
}
