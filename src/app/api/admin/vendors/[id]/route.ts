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

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        type: body.type !== undefined ? body.type : undefined,
        baseUrl: body.baseUrl !== undefined ? body.baseUrl : undefined,
        apiKey: body.apiKey !== undefined ? body.apiKey : undefined,
        apiSecret: body.apiSecret !== undefined ? body.apiSecret : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      vendor: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    if (!vendor) return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });

    if (vendor.isDefault) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the default primary vendor" },
        { status: 400 }
      );
    }

    await prisma.vendor.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: "DELETE_VENDOR",
        details: `Deleted vendor: ${vendor.name}`,
        actor: admin.email,
      },
    });

    return NextResponse.json({ success: true, message: "Vendor deleted" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
