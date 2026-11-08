import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ success: false, error: "Invalid product ID" }, { status: 400 });
    }

    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        category: body.category !== undefined ? body.category : undefined,
        customImage: body.customImage !== undefined ? body.customImage : undefined,
        retailPriceVnd: body.retailPriceVnd !== undefined ? parseInt(body.retailPriceVnd) : undefined,
        retailPriceUsdt:
          body.retailPriceUsdt !== undefined ? parseFloat(body.retailPriceUsdt) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated",
      product: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update product" },
      { status: 500 }
    );
  }
}
