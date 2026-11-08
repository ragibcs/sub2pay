import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query string is required (Order ID or Email)" },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { equals: cleanQuery } },
          { customerEmail: { equals: cleanQuery } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const sanitized = orders.map((o) => {
      let items: string[] = [];
      try {
        items = o.deliveredItems ? JSON.parse(o.deliveredItems) : [];
      } catch {
        items = o.deliveredItems ? [o.deliveredItems] : [];
      }

      return {
        orderNumber: o.orderNumber,
        productName: o.productName,
        quantity: o.quantity,
        currency: o.currency,
        totalAmount: o.totalAmount,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        deliveredItems: o.fulfillmentStatus === "DELIVERED" ? items : [],
        createdAt: o.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      orders: sanitized,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to lookup orders" },
      { status: 500 }
    );
  }
}
