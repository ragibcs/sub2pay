import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = await prisma.paymentChannel.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        provider: true,
        description: true,
        badge: true,
        feeRate: true,
      },
    });

    return NextResponse.json({
      success: true,
      channels,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch payment channels" },
      { status: 500 }
    );
  }
}
