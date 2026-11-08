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
  const status = searchParams.get("status");
  const query = searchParams.get("query");
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const skip = (page - 1) * limit;

  const where: Record<string, any> = {};

  if (status && status !== "ALL") {
    if (status === "DELIVERED" || status === "FAILED") {
      where.fulfillmentStatus = status;
    } else {
      where.paymentStatus = status;
    }
  }

  if (query) {
    where.OR = [
      { orderNumber: { contains: query } },
      { customerEmail: { contains: query } },
      { productName: { contains: query } },
    ];
  }

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    const formatted = orders.map((o) => {
      let items: string[] = [];
      try {
        items = o.deliveredItems ? JSON.parse(o.deliveredItems) : [];
      } catch {
        items = o.deliveredItems ? [o.deliveredItems] : [];
      }
      return {
        ...o,
        deliveredItemsList: items,
      };
    });

    return NextResponse.json({
      success: true,
      orders: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
