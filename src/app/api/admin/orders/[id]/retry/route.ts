import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { FulfillmentService } from "@/lib/fulfillment-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const res = await FulfillmentService.retryFulfillment(id);

    return NextResponse.json({
      success: res.success,
      buyResult: res,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Retry failed" },
      { status: 500 }
    );
  }
}
