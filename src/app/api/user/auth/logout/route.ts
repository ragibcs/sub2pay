import { NextResponse } from "next/server";
import { USER_COOKIE_NAME } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });
  res.cookies.delete(USER_COOKIE_NAME);
  return res;
}
