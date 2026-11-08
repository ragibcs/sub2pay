# SimpleCard / Sub2Pay — Production-Grade Digital Goods & Subscription Platform

Full-stack digital goods and subscription delivery platform inspired by **SimpleCard**, upgraded with:
1. **Production-Grade Reliability**:
   - **Background Asynchronous Payment Reconciler** (`/api/cron/reconcile-payments` & `BackgroundPaymentReconciler`): Automatically verifies pending Binance on-chain deposits and fulfills orders even if the buyer closes their browser.
   - **Atomic Concurrency Protection**: Multi-item stock reservation and card key allocation wrapped in `prisma.$transaction` to guarantee zero double-selling under traffic spikes.
   - **Automated Transactional Emails** (`EmailService`): Auto-sends HTML receipts, delivered credentials, and blockchain TxIDs to customers via SMTP or Resend API upon payment confirmation.
   - **Security & Anti-Brute-Force Rate Limiting** (`checkRateLimit`): Protects login, registration, and order creation endpoints against brute-force attacks.
   - **Dual Database Architecture**: Easy 1-command switch between **Neon Serverless PostgreSQL** for production (`pnpm db:postgres`) and **SQLite** for zero-setup local dev (`pnpm db:sqlite`).
2. **Customer User Portal**:
   - Customer Sign In (`/login`), Registration (`/register`), and My Purchases Dashboard (`/my/orders`) with delivered credentials and copy buttons.
3. **Multi-Vendor API Support** (`/admin/vendors`):
   - Shop Bot Protocol (`https://tunvnmmo.duckdns.org`), Generic Webhook/REST APIs, and Local Card Key Inventory Pools.
4. **Turn ON / OFF Payment Methods** (`/admin/payment-channels`):
   - Instant toggle switches in the admin panel. Only enabled methods appear to buyers at checkout.
5. **Binance Auto Payment Verification**:
   - Instant on-chain matching via BEP20 USDT deposit history (signed with HMAC-SHA256) and Binance Pay.
6. **Full English Localization** across Storefront, Checkout, and Admin Panel.

---

## 🌐 Local Access URLs

| Portal | Local URL | Description |
|---|---|---|
| **Storefront** | **`http://localhost:3002`** | Public digital goods store |
| **Customer Sign In** | **`http://localhost:3002/login`** | **Customer / Buyer User Login** |
| **Customer Register** | **`http://localhost:3002/register`** | Customer Account Registration |
| **My Purchases** | **`http://localhost:3002/my/orders`** | Customer's purchased credentials dashboard |
| **All Products** | **`http://localhost:3002/products`** | Complete catalog with category filters |
| **Buff Muse AI** | **`http://localhost:3002/buff-muse`** | Muse AI token calculator & automated top-up |
| **Guest Order Lookup** | **`http://localhost:3002/orders`** | Instant search by Order # or Email |
| **Admin Login** | **`http://localhost:3002/admin/login`** | Store administrator login |
| **Payment Channels (ON/OFF)** | **`http://localhost:3002/admin/payment-channels`** | **Turn ON / OFF payment methods** |
| **Multi-Vendor APIs** | **`http://localhost:3002/admin/vendors`** | **Add & test external wholesale APIs** |
| **Card Key Pools** | **`http://localhost:3002/admin/card-keys`** | Bulk import & manage local keys |
| **Gateway Credentials & Cron** | **`http://localhost:3002/admin/settings`** | Binance API Keys, password change & manual reconciler trigger |
| **Reconciler Cron Endpoint** | **`http://localhost:3002/api/cron/reconcile-payments`** | Background cron payment check |

---

## 🔑 Login Credentials

### 1. Customer User Login (For Buyers)
- **URL**: `http://localhost:3002/login`
- **Email**: `customer@example.com`
- **Password**: `customer123`
*(Customers can also register new accounts at `/register` or purchase as guest)*

### 2. Admin Login (For Store Owner)
- **URL**: `http://localhost:3002/admin/login`
- **Email**: `admin@subxpress.com`
- **Password**: `admin123456`
*(You can change your admin password anytime under Admin Settings)*

---

## ⚙️ Production Deployment & Database Switch

### 1. Database Configuration
To switch from SQLite to **Neon Serverless PostgreSQL** (or managed PostgreSQL):
```bash
# 1. Set your Neon DATABASE_URL and DIRECT_DATABASE_URL in .env
# 2. Run the switch script:
pnpm db:postgres

# 3. Push schema to PostgreSQL:
pnpm prisma:push

# 4. Seed initial admin user and default vendors/channels:
node prisma/seed.mjs
```
*(To switch back to SQLite for offline dev, simply run `pnpm db:sqlite`)*

### 2. Setting up the Background Reconciler Cron
In production (e.g. on Vercel, Railway, Render, or a VPS):
- Set `CRON_SECRET=your_strong_secret` in `.env`.
- Set up an automated HTTP GET ping every 1 minute to:
  `https://yourdomain.com/api/cron/reconcile-payments?key=your_strong_secret`
  *(or pass `Authorization: Bearer your_strong_secret` in header)*.
- If running on Vercel, `vercel.json` crons are supported automatically.
