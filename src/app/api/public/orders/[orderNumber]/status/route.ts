import { NextResponse } from "next/server";
import { FulfillmentService } from "@/lib/fulfillment-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order number required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Trigger fulfillment verification cycle
    const result = await FulfillmentService.checkAndFulfillOrder(orderNumber);

    // Re-fetch latest order state
    const latestOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    return NextResponse.json({
      success: true,
      paid: result.paid,
      fulfilled: result.fulfilled,
      status: latestOrder?.fulfillmentStatus || latestOrder?.paymentStatus,
      paymentStatus: latestOrder?.paymentStatus,
      fulfillmentStatus: latestOrder?.fulfillmentStatus,
      deliveredItems: result.deliveredItems || [],
      message: result.message,
      order: {
        orderNumber: latestOrder?.orderNumber,
        productName: latestOrder?.productName,
        quantity: latestOrder?.quantity,
        totalAmount: latestOrder?.totalAmount,
        currency: latestOrder?.currency,
        exactPayAmount: latestOrder?.exactPayAmount,
        paymentAddress: latestOrder?.paymentAddress,
        paymentMethod: latestOrder?.paymentMethod,
        paymentExpiresAt: latestOrder?.paymentExpiresAt,
        createdAt: latestOrder?.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to check order status" },
      { status: 500 }
    );
  }
}
