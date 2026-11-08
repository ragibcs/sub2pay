import { prisma } from "./prisma";

export interface SystemSettings {
  shopbotBaseUrl: string;
  shopbotApiKey: string;
  binanceApiKey: string;
  binanceApiSecret: string;
  binanceDepositAddress: string;
  binanceDepositNetwork: string;
  binancePayMerchantId: string;
  binancePayApiKey: string;
  binancePaySecretKey: string;
  storeName: string;
  storeTagline: string;
  globalMarkupPercent: number;
  defaultCurrency: string;
  telegramNotification: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const dbSetting = await prisma.adminSetting.findUnique({
    where: { id: "default" },
  });

  return {
    shopbotBaseUrl:
      dbSetting?.shopbotBaseUrl || process.env.SHOPBOT_BASE_URL || "https://tunvnmmo.duckdns.org",
    shopbotApiKey: dbSetting?.shopbotApiKey || process.env.SHOPBOT_API_KEY || "",
    binanceApiKey: dbSetting?.binanceApiKey || process.env.BINANCE_API_KEY || "",
    binanceApiSecret: dbSetting?.binanceApiSecret || process.env.BINANCE_API_SECRET || "",
    binanceDepositAddress:
      dbSetting?.binanceDepositAddress || process.env.BINANCE_DEPOSIT_ADDRESS || "",
    binanceDepositNetwork:
      dbSetting?.binanceDepositNetwork || process.env.BINANCE_DEPOSIT_NETWORK || "BSC",
    binancePayMerchantId:
      dbSetting?.binancePayMerchantId || process.env.BINANCE_PAY_MERCHANT_ID || "",
    binancePayApiKey: dbSetting?.binancePayApiKey || process.env.BINANCE_PAY_API_KEY || "",
    binancePaySecretKey:
      dbSetting?.binancePaySecretKey || process.env.BINANCE_PAY_SECRET_KEY || "",
    storeName: dbSetting?.storeName || "SubXpress Store",
    storeTagline: dbSetting?.storeTagline || "Instant Digital Subscriptions & AI Tokens",
    globalMarkupPercent: dbSetting?.globalMarkupPercent ?? 15.0,
    defaultCurrency: dbSetting?.defaultCurrency || "USDT",
    telegramNotification: dbSetting?.telegramNotification || "",
  };
}

export async function updateSystemSettings(
  data: Partial<SystemSettings>,
  actor = "ADMIN"
): Promise<SystemSettings> {
  const updated = await prisma.adminSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...data,
    },
    update: {
      ...data,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_SETTINGS",
      details: `Updated settings fields: ${Object.keys(data).join(", ")}`,
      actor,
    },
  });

  return getSystemSettings();
}
