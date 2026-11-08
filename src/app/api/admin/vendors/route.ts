import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      vendors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, code, type = "SHOPBOT", baseUrl, apiKey, apiSecret, notes } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "Vendor name and unique code are required" },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        code: code.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        type,
        baseUrl: (baseUrl || "").trim(),
        apiKey: (apiKey || "").trim(),
        apiSecret: (apiSecret || "").trim(),
        notes: (notes || "").trim(),
        isEnabled: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE_VENDOR",
        details: `Added new vendor: ${vendor.name} (${vendor.type})`,
        actor: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create vendor" },
      { status: 500 }
    );
  }
}
