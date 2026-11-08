# SimpleCard — Digital Goods Platform with Multi-Vendor API & Binance Auto-Payment

Full-stack digital goods and subscription delivery platform inspired by **SimpleCard**, upgraded with:
1. **Customer User Portal** (Sign In, Register, My Purchases dashboard with delivered account credentials).
2. **Multi-Vendor API Support** (Shop Bot Protocol, Generic Webhook APIs, and Local Card Key Inventory Pools).
3. **Turn ON / OFF Payment Methods** (Single-click toggle switches in the admin panel).
4. **Binance Auto Payment Verification** (Instant on-chain matching via BEP20 deposit history and Binance Pay).
5. **Full English Localization** across Storefront, Checkout, and Admin Panel.

---

## 🌐 Local Access URLs

| Portal | Local URL | Description |
|---|---|---|
| **Storefront** | **`http://localhost:3002`** | Public digital store |
| **Customer Sign In** | **`http://localhost:3002/login`** | **Customer / Buyer User Login** |
| **Customer Register** | **`http://localhost:3002/register`** | Customer Account Registration |
| **My Purchases** | **`http://localhost:3002/my/orders`** | Customer's purchased credentials dashboard |
| **All Products** | **`http://localhost:3002/products`** | Complete catalog |
| **Buff Muse AI** | **`http://localhost:3002/buff-muse`** | Muse AI token calculator & top-up |
| **Guest Order Lookup** | **`http://localhost:3002/orders`** | Instant search by Order # or Email |
| **Admin Login** | **`http://localhost:3002/admin/login`** | Store administrator login |
| **Payment Channels (ON/OFF)** | **`http://localhost:3002/admin/payment-channels`** | **Turn ON / OFF payment methods** |
| **Multi-Vendor APIs** | **`http://localhost:3002/admin/vendors`** | **Add & test external wholesale APIs** |
| **Card Key Pools** | **`http://localhost:3002/admin/card-keys`** | Bulk import & manage local keys |
| **Gateway Credentials** | **`http://localhost:3002/admin/settings`** | Binance API Key, Secret & Deposit Address |

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
