import { getSystemSettings } from "./settings-service";

export interface ShopBotRateResponse {
  success: boolean;
  usdt_vnd: number;
  description?: string;
}

export interface ShopBotProduct {
  id: number;
  name: string;
  price_vnd: number;
  price_usdt: number;
  stock: number;
  bonus?: number;
  category?: string;
  description?: string;
}

export interface ShopBotBalanceResponse {
  balance_vnd: number;
  balance_usdt: number;
  username?: string;
}

export interface ShopBotDepositResponse {
  success: boolean;
  deposit: {
    id: number;
    payment_code: string;
    status: string;
    amount_usdt: number;
    amount_vnd_equivalent: number;
    expires_in_minutes: number;
    wallet_transfer: {
      address: string;
      network: string;
      exact_amount: number;
      instruction: string;
    };
  };
  status_endpoint: string;
  note: string;
}

export interface ShopBotDepositStatusResponse {
  success: boolean;
  deposit: {
    id: number;
    currency: string;
    amount: number;
    payment_code: string;
    status: string; // 'pending' | 'confirmed'
    balance_vnd: number;
    balance_usdt: number;
  };
  paid: boolean;
  message: string;
}

export interface ShopBotBuyResponse {
  success: boolean;
  order?: {
    order_group: string;
    product: string;
    quantity: number;
    bonus: number;
    total_items: number;
    total_price: number;
    currency: string;
  };
  items?: string[];
  new_balance?: number;
  error?: string;
}

export interface ShopBotBuffCheckResponse {
  success: boolean;
  gross_cost_vnd: number;
  sell_price_vnd: number;
  sell_price_usdt: number;
  orders_breakdown: Array<{
    line_no: number;
    invite_code: string;
    quantity_b: number;
    valid: boolean;
    error?: string;
  }>;
  fundable: boolean;
  error?: string;
}

export interface ShopBotBuffOrderResponse {
  success: boolean;
  batch_id?: string;
  sell_price_vnd?: number;
  sell_price_usdt?: number;
  currency?: string;
  orders?: Array<{
    invite_code: string;
    quantity_b: number;
    sell_price_vnd?: number;
    order_code: string;
  }>;
  status_endpoint?: string;
  error?: string;
}

export interface ShopBotBuffStatusResponse {
  success: boolean;
  batch_id: string;
  orders: Array<{
    invite_code: string;
    quantity_b: number;
    sell_price_vnd: number;
    sell_price_usdt: number;
    currency: string;
    status: "pending" | "done" | "failed" | "needs_check";
    order_code: string;
    completed_at?: string;
  }>;
  is_done: boolean;
  error?: string;
}

export class ShopBotClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = (baseUrl || "https://tunvnmmo.duckdns.org").replace(/\/$/, "");
    this.apiKey = apiKey || "";
  }

  static async create(): Promise<ShopBotClient> {
    const settings = await getSystemSettings();
    return new ShopBotClient(settings.shopbotBaseUrl, settings.shopbotApiKey);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (requiresAuth && this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg =
        data.error ||
        data.message ||
        `Shop Bot API error ${res.status}: ${res.statusText}`;
      const error = new Error(errorMsg) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data as T;
  }

  // 1. Get Rate (Public)
  async getRate(): Promise<ShopBotRateResponse> {
    return this.request<ShopBotRateResponse>("/api/rate", { method: "GET" }, false);
  }

  // 2. Get Products
  async getProducts(): Promise<ShopBotProduct[]> {
    const data = await this.request<any>("/api/products", { method: "GET" });
    if (Array.isArray(data)) return data;
    if (data.products && Array.isArray(data.products)) return data.products;
    return [];
  }

  // 3. Get Wallet Balance
  async getBalance(): Promise<ShopBotBalanceResponse> {
    return this.request<ShopBotBalanceResponse>("/api/balance", { method: "GET" });
  }

  // 4. Create Deposit Request
  async createDeposit(amount: number, currency = "usdt"): Promise<ShopBotDepositResponse> {
    return this.request<ShopBotDepositResponse>("/api/deposit", {
      method: "POST",
      body: JSON.stringify({ amount, currency: currency.toLowerCase() }),
    });
  }

  // 4.1 Check Deposit Status
  async checkDepositStatus(paymentCode: string): Promise<ShopBotDepositStatusResponse> {
    return this.request<ShopBotDepositStatusResponse>(
      `/api/deposit/status?code=${encodeURIComponent(paymentCode)}`,
      { method: "GET" }
    );
  }

  // 5. Buy Product with Wallet Balance
  async buyProduct(
    productId: number,
    quantity = 1,
    currency: "vnd" | "usdt" = "usdt"
  ): Promise<ShopBotBuyResponse> {
    return this.request<ShopBotBuyResponse>("/api/buy", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        quantity,
        currency: currency.toLowerCase(),
      }),
    });
  }

  // 6. Order History
  async getOrders(): Promise<any> {
    return this.request<any>("/api/orders", { method: "GET" });
  }

  // 7.1 Check Buff Token Pricing
  async checkBuff(ordersText: string): Promise<ShopBotBuffCheckResponse> {
    return this.request<ShopBotBuffCheckResponse>("/api/buff/check", {
      method: "POST",
      body: JSON.stringify({ orders_text: ordersText }),
    });
  }

  // 7.2 Place Buff Token Order
  async orderBuff(
    ordersText: string,
    currency: "vnd" | "usdt" = "usdt"
  ): Promise<ShopBotBuffOrderResponse> {
    return this.request<ShopBotBuffOrderResponse>("/api/buff/order", {
      method: "POST",
      body: JSON.stringify({
        orders_text: ordersText,
        currency: currency.toLowerCase(),
      }),
    });
  }

  // 7.3 Check Buff Order Progress
  async getBuffStatus(batchId: string): Promise<ShopBotBuffStatusResponse> {
    return this.request<ShopBotBuffStatusResponse>(
      `/api/buff/status?batch_id=${encodeURIComponent(batchId)}`,
      { method: "GET" }
    );
  }

  // 7.4 Buff Order History
  async getBuffOrders(limit = 50): Promise<any> {
    return this.request<any>(`/api/buff/orders?limit=${limit}`, { method: "GET" });
  }
}
