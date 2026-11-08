import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed default admin setting if not exists
  const existingSetting = await prisma.adminSetting.findUnique({
    where: { id: "default" },
  });

  if (!existingSetting) {
    await prisma.adminSetting.create({
      data: {
        id: "default",
        shopbotBaseUrl: process.env.SHOPBOT_BASE_URL || "https://tunvnmmo.duckdns.org",
        shopbotApiKey: process.env.SHOPBOT_API_KEY || "",
        binanceApiKey: process.env.BINANCE_API_KEY || "",
        binanceApiSecret: process.env.BINANCE_API_SECRET || "",
        binanceDepositAddress: process.env.BINANCE_DEPOSIT_ADDRESS || "",
        binanceDepositNetwork: process.env.BINANCE_DEPOSIT_NETWORK || "BSC",
        binancePayMerchantId: process.env.BINANCE_PAY_MERCHANT_ID || "",
        binancePayApiKey: process.env.BINANCE_PAY_API_KEY || "",
        binancePaySecretKey: process.env.BINANCE_PAY_SECRET_KEY || "",
        storeName: "SubXpress Store",
        storeTagline: "Instant Digital Subscriptions & AI Tokens",
        globalMarkupPercent: 15.0,
        defaultCurrency: "USDT",
      },
    });
    console.log("Created default AdminSetting");
  }

  // Seed default admin user if not exists
  const defaultEmail = "admin@subxpress.com";
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: defaultEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123456", 10);
    await prisma.adminUser.create({
      data: {
        email: defaultEmail,
        passwordHash,
        name: "Admin",
        role: "ADMIN",
      },
    });
    console.log(`Created default AdminUser: ${defaultEmail} (password: admin123456)`);
  }

  // Seed default customer user
  const sampleCustomerEmail = "customer@example.com";
  const existingCustomer = await prisma.user.findUnique({
    where: { email: sampleCustomerEmail },
  });

  if (!existingCustomer) {
    const customerHash = await bcrypt.hash("customer123", 10);
    await prisma.user.create({
      data: {
        email: sampleCustomerEmail,
        passwordHash: customerHash,
        name: "Test Customer",
      },
    });
    console.log(`Created default Customer User: ${sampleCustomerEmail} (password: customer123)`);
  }

  // Seed Default Vendors
  const shopbotVendor = await prisma.vendor.upsert({
    where: { code: "shopbot_main" },
    create: {
      name: "Shop Bot Wholesale API (tunvnmmo)",
      code: "shopbot_main",
      type: "SHOPBOT",
      baseUrl: process.env.SHOPBOT_BASE_URL || "https://tunvnmmo.duckdns.org",
      apiKey: process.env.SHOPBOT_API_KEY || "",
      isEnabled: true,
      isDefault: true,
      notes: "Primary digital subscription & Muse AI token supplier",
    },
    update: {
      baseUrl: process.env.SHOPBOT_BASE_URL || "https://tunvnmmo.duckdns.org",
    },
  });

  await prisma.vendor.upsert({
    where: { code: "local_stock" },
    create: {
      name: "Local Card Key Inventory Pool",
      code: "local_stock",
      type: "LOCAL",
      baseUrl: "",
      apiKey: "",
      isEnabled: true,
      isDefault: false,
      notes: "Internal card keys and account inventory managed in admin",
    },
    update: {},
  });
  console.log("Seeded default Vendors (Multi-Vendor support)");

  // Seed Payment Channels (Turn ON / OFF methods)
  const defaultChannels = [
    {
      code: "BINANCE_DEPOSIT",
      name: "Binance USDT (BEP20) Auto-Verify",
      provider: "binance",
      description: "Send exact USDT to your Binance BEP20 deposit address. Auto-detected on blockchain in 1-2 mins.",
      badge: "Instant Auto Detect",
      isEnabled: true,
      sortOrder: 1,
    },
    {
      code: "BINANCE_PAY",
      name: "Binance Pay",
      provider: "binance_pay",
      description: "Official Binance Pay QR code & mobile app instant checkout.",
      badge: "App QR Code",
      isEnabled: true,
      sortOrder: 2,
    },
    {
      code: "SHOPBOT_DEPOSIT",
      name: "Shop Bot Auto-Deposit (BEP20)",
      provider: "shopbot",
      description: "Supplier wallet auto-detected deposit.",
      badge: "Direct Wallet",
      isEnabled: false,
      sortOrder: 3,
    },
    {
      code: "USDT_TRC20",
      name: "USDT (TRC-20 Network)",
      provider: "crypto_manual",
      description: "Fast Tron TRC20 transfer with manual/auto TxID matching.",
      badge: "Tron Network",
      isEnabled: false,
      sortOrder: 4,
    },
  ];

  for (const ch of defaultChannels) {
    await prisma.paymentChannel.upsert({
      where: { code: ch.code },
      create: { ...ch },
      update: {
        name: ch.name,
        provider: ch.provider,
        description: ch.description,
        badge: ch.badge,
      },
    });
  }
  console.log("Seeded Payment Channels with toggle support");

  // Seed sample popular products for immediate testing
  const sampleProducts = [
    {
      id: 85,
      name: "Netflix Premium 1 Month (Ultra HD 4K)",
      category: "Streaming",
      description: "Private 4K UHD Profile, all devices supported, 30 days instant warranty.",
      customImage: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80",
      costPriceVnd: 50000,
      costPriceUsdt: 2.0,
      retailPriceVnd: 60000,
      retailPriceUsdt: 2.4,
      stock: 35,
      bonus: 0,
      isFeatured: true,
    },
    {
      id: 86,
      name: "ChatGPT Plus 1 Month (GPT-4o Access)",
      category: "AI & Tools",
      description: "Full OpenAI ChatGPT Plus private subscription with Advanced Voice & DALL-E 3.",
      customImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80",
      costPriceVnd: 250000,
      costPriceUsdt: 10.0,
      retailPriceVnd: 285000,
      retailPriceUsdt: 11.5,
      stock: 20,
      bonus: 0,
      isFeatured: true,
    },
    {
      id: 87,
      name: "Spotify Premium 1 Year (Individual)",
      category: "Music",
      description: "Ad-free high-fidelity streaming, offline downloads, upgrade on your own email.",
      customImage: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=600&auto=format&fit=crop&q=80",
      costPriceVnd: 180000,
      costPriceUsdt: 7.2,
      retailPriceVnd: 210000,
      retailPriceUsdt: 8.4,
      stock: 15,
      bonus: 1,
      isFeatured: true,
    },
    {
      id: 88,
      name: "YouTube Premium 6 Months (Family Slot)",
      category: "Streaming",
      description: "Zero ads on YouTube & YouTube Music, background playback, 4K quality.",
      customImage: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80",
      costPriceVnd: 120000,
      costPriceUsdt: 4.8,
      retailPriceVnd: 140000,
      retailPriceUsdt: 5.6,
      stock: 40,
      bonus: 0,
      isFeatured: false,
    },
    {
      id: 89,
      name: "NordVPN Ultimate 1 Year (10 Devices)",
      category: "VPN & Security",
      description: "Fast wireguard servers worldwide, threat protection, and private dedicated IP.",
      customImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
      costPriceVnd: 150000,
      costPriceUsdt: 6.0,
      retailPriceVnd: 180000,
      retailPriceUsdt: 7.2,
      stock: 25,
      bonus: 0,
      isFeatured: false,
    },
    {
      id: 90,
      name: "Claude Pro / Anthropic Workspace 1 Month",
      category: "AI & Tools",
      description: "Unlimited high-speed reasoning with Opus, Sonnet, and Projects artifacts.",
      customImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      costPriceVnd: 260000,
      costPriceUsdt: 10.5,
      retailPriceVnd: 300000,
      retailPriceUsdt: 12.0,
      stock: 18,
      bonus: 0,
      isFeatured: true,
    },
  ];

  for (const prod of sampleProducts) {
    await prisma.product.upsert({
      where: { id: prod.id },
      create: {
        ...prod,
        vendorId: shopbotVendor.id,
        vendorProductRef: prod.id.toString(),
        isActive: true,
      },
      update: {
        ...prod,
        vendorId: shopbotVendor.id,
        vendorProductRef: prod.id.toString(),
      },
    });
  }
  console.log(`Seeded ${sampleProducts.length} sample subscription products`);

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
