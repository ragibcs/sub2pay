import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: admin.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    success: true,
    user,
  });
}
