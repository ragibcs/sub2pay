import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: admin.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Admin user not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        action: "CHANGE_ADMIN_PASSWORD",
        details: `Admin password updated for ${user.email}`,
        actor: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin password successfully updated",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to change password" },
      { status: 500 }
    );
  }
}
