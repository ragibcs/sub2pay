import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/user-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return NextResponse.json({ success: false, error: "Please log in to view purchases" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: session.userId },
          { customerEmail: session.email },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((o) => {
      let items: string[] = [];
      try {
        items = o.deliveredItems ? JSON.parse(o.deliveredItems) : [];
      } catch {
        items = o.deliveredItems ? [o.deliveredItems] : [];
      }

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        productName: o.productName,
        quantity: o.quantity,
        totalAmount: o.totalAmount,
        currency: o.currency,
        paymentStatus: o.paymentStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        deliveredItems: o.fulfillmentStatus === "DELIVERED" ? items : [],
        createdAt: o.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      orders: formatted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
