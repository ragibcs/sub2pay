import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getSystemSettings, updateSystemSettings } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSystemSettings();
  return NextResponse.json({
    success: true,
    settings,
  });
}

export async function PUT(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const allowedFields = [
      "shopbotBaseUrl",
      "shopbotApiKey",
      "binanceApiKey",
      "binanceApiSecret",
      "binanceDepositAddress",
      "binanceDepositNetwork",
      "binancePayMerchantId",
      "binancePayApiKey",
      "binancePaySecretKey",
      "storeName",
      "storeTagline",
      "globalMarkupPercent",
      "defaultCurrency",
      "telegramNotification",
    ];

    const toUpdate: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === "globalMarkupPercent") {
          toUpdate[key] = parseFloat(body[key]);
        } else {
          toUpdate[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
        }
      }
    }

    const updated = await updateSystemSettings(toUpdate, admin.email);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
