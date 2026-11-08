import { NextResponse } from "next/server";
import { BackgroundPaymentReconciler } from "@/lib/background-worker";
import { getAuthenticatedAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const queryKey = url.searchParams.get("key");

  // If CRON_SECRET is configured, check bearer token or query key
  if (cronSecret) {
    if (authHeader && authHeader === `Bearer ${cronSecret}`) return true;
    if (queryKey && queryKey === cronSecret) return true;
    return false;
  }

  // If running locally (no CRON_SECRET set), allow localhost requests
  const host = req.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return true;
  }

  return false;
}

export async function GET(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin && !isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Provide CRON_SECRET or log in as Admin." },
      { status: 401 }
    );
  }

  try {
    const summary = await BackgroundPaymentReconciler.reconcile();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Reconciliation failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
