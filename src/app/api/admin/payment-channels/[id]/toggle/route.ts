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
    const channel = await prisma.paymentChannel.findUnique({
      where: { id },
    });

    if (!channel) {
      return NextResponse.json({ success: false, error: "Channel not found" }, { status: 404 });
    }

    const nextState = !channel.isEnabled;

    const updated = await prisma.paymentChannel.update({
      where: { id },
      data: { isEnabled: nextState },
    });

    await prisma.auditLog.create({
      data: {
        action: "TOGGLE_PAYMENT_CHANNEL",
        details: `Turned ${nextState ? "ON" : "OFF"} payment method: ${channel.name} (${channel.code})`,
        actor: admin.email,
      },
    });

    return NextResponse.json({
      success: true,
      channel: updated,
      message: `Payment method ${channel.name} is now ${nextState ? "ENABLED" : "DISABLED"}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to toggle channel" },
      { status: 500 }
    );
  }
}
