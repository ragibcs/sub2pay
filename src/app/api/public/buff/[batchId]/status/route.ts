import { NextResponse } from "next/server";
import { FulfillmentService } from "@/lib/fulfillment-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    if (!batchId) {
      return NextResponse.json(
        { success: false, error: "batchId is required" },
        { status: 400 }
      );
    }

    const buffOrder = await prisma.buffOrder.findUnique({
      where: { batchId },
    });

    if (!buffOrder) {
      return NextResponse.json(
        { success: false, error: "Buff order not found" },
        { status: 404 }
      );
    }

    const result = await FulfillmentService.checkAndFulfillBuffOrder(batchId);

    return NextResponse.json({
      success: true,
      batchId: buffOrder.batchId,
      status: result.status,
      paymentStatus: result.paymentStatus,
      isDone: result.isDone,
      sellPriceUsdt: buffOrder.sellPriceUsdt,
      sellPriceVnd: buffOrder.sellPriceVnd,
      exactPayAmount: buffOrder.exactPayAmount,
      orders: result.ordersJson ? JSON.parse(result.ordersJson) : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to check Buff status" },
      { status: 500 }
    );
  }
}
