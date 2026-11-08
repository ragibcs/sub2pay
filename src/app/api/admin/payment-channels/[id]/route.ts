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
    const body = await req.json();

    const updated = await prisma.paymentChannel.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        description: body.description !== undefined ? body.description : undefined,
        badge: body.badge !== undefined ? body.badge : undefined,
        feeRate: body.feeRate !== undefined ? parseFloat(body.feeRate) : undefined,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder) : undefined,
        configJson: body.configJson !== undefined ? body.configJson : undefined,
        isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      channel: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update channel" },
      { status: 500 }
    );
  }
}
