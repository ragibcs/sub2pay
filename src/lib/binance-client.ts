import crypto from "node:crypto";
import { getSystemSettings } from "./settings-service";

export interface BinanceDepositRecord {
  id: string;
  amount: string;
  coin: string;
  network: string;
  status: number; // 0:pending, 6:credited but cannot withdraw, 1:success
  address: string;
  addressTag: string;
  txId: string;
  insertTime: number;
  transferType: number;
  unlockConfirm: number;
  confirmTimes: string;
}

export interface MatchPaymentResult {
  matched: boolean;
  txId?: string;
  amount?: number;
  network?: string;
  insertTime?: number;
  rawDeposit?: BinanceDepositRecord;
  message?: string;
}

export class BinanceClient {
  private apiKey: string;
  private apiSecret: string;
  private depositAddress: string;
  private depositNetwork: string;
  private baseUrl = "https://api.binance.com";

  // Binance Pay
  private bpayBaseUrl = "https://bpay.binanceapi.com";
  private bpayApiKey: string;
  private bpaySecretKey: string;
  private bpayMerchantId: string;

  constructor(config: {
    apiKey?: string;
    apiSecret?: string;
    depositAddress?: string;
    depositNetwork?: string;
    bpayApiKey?: string;
    bpaySecretKey?: string;
    bpayMerchantId?: string;
  } = {}) {
    this.apiKey = config.apiKey || "";
    this.apiSecret = config.apiSecret || "";
    this.depositAddress = config.depositAddress || "";
    this.depositNetwork = config.depositNetwork || "BSC";

    this.bpayApiKey = config.bpayApiKey || "";
    this.bpaySecretKey = config.bpaySecretKey || "";
    this.bpayMerchantId = config.bpayMerchantId || "";
  }

  static async create(): Promise<BinanceClient> {
    const settings = await getSystemSettings();
    return new BinanceClient({
      apiKey: settings.binanceApiKey,
      apiSecret: settings.binanceApiSecret,
      depositAddress: settings.binanceDepositAddress,
      depositNetwork: settings.binanceDepositNetwork,
      bpayApiKey: settings.binancePayApiKey,
      bpaySecretKey: settings.binancePaySecretKey,
      bpayMerchantId: settings.binancePayMerchantId,
    });
  }

  private sign(queryString: string): string {
    return crypto.createHmac("sha256", this.apiSecret).update(queryString).digest("hex");
  }

  // Test Binance Spot API Connection
  async testSpotConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.apiKey || !this.apiSecret) {
      return { success: false, message: "Binance API Key or Secret is missing" };
    }

    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}&recvWindow=60000`;
      const signature = this.sign(queryString);
      const url = `${this.baseUrl}/sapi/v1/account/status?${queryString}&signature=${signature}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": this.apiKey,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.msg || `Binance API error HTTP ${res.status}`,
        };
      }

      return {
        success: true,
        message: "Successfully authenticated with Binance Spot API",
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to reach Binance API",
      };
    }
  }

  // Get Deposit History from Binance Spot
  async getDepositHistory(params: {
    coin?: string;
    status?: number;
    startTime?: number;
    endTime?: number;
    limit?: number;
  } = {}): Promise<BinanceDepositRecord[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("Binance API credentials are not configured");
    }

    const timestamp = Date.now();
    const queryParts: string[] = [`timestamp=${timestamp}`, "recvWindow=60000"];

    if (params.coin) queryParts.push(`coin=${params.coin.toUpperCase()}`);
    if (params.status !== undefined) queryParts.push(`status=${params.status}`);
    if (params.startTime) queryParts.push(`startTime=${params.startTime}`);
    if (params.endTime) queryParts.push(`endTime=${params.endTime}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);

    const queryString = queryParts.join("&");
    const signature = this.sign(queryString);
    const url = `${this.baseUrl}/sapi/v1/capital/deposit/hisrec?${queryString}&signature=${signature}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": this.apiKey,
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || `Binance API error: ${res.statusText}`);
    }

    return Array.isArray(data) ? data : [];
  }

  // Match Payment Automatically by Exact Amount + Address + Timestamp window
  async matchDeposit(params: {
    exactAmount: number;
    targetAddress?: string;
    coin?: string;
    orderCreatedAt: Date;
    maxAgeMinutes?: number;
  }): Promise<MatchPaymentResult> {
    const { exactAmount, orderCreatedAt } = params;
    const coin = params.coin || "USDT";
    const maxAgeMinutes = params.maxAgeMinutes || 35;
    const targetAddress = (params.targetAddress || this.depositAddress).trim().toLowerCase();

    // Look for deposits starting 2 minutes before order creation until now
    const startTime = Math.max(0, orderCreatedAt.getTime() - 2 * 60 * 1000);
    const endTime = Date.now();

    // Check if order expired
    if (Date.now() - orderCreatedAt.getTime() > maxAgeMinutes * 60 * 1000) {
      return { matched: false, message: "Order payment window has expired" };
    }

    try {
      const deposits = await this.getDepositHistory({
        coin,
        status: 1, // 1 = success confirmed
        startTime,
        endTime,
        limit: 50,
      });

      for (const dep of deposits) {
        const depAmount = parseFloat(dep.amount);
        const amountDiff = Math.abs(depAmount - exactAmount);

        // Check if amount matches (within 0.0001 precision)
        const amountMatches = amountDiff < 0.0001;

        // Check address match if address is configured
        const addressMatches =
          !targetAddress || dep.address.trim().toLowerCase() === targetAddress;

        if (amountMatches && addressMatches) {
          return {
            matched: true,
            txId: dep.txId,
            amount: depAmount,
            network: dep.network,
            insertTime: dep.insertTime,
            rawDeposit: dep,
            message: "Deposit matched and confirmed on Binance",
          };
        }
      }

      return {
        matched: false,
        message: "No matching confirmed deposit found on Binance yet",
      };
    } catch (err: any) {
      return {
        matched: false,
        message: `Error checking Binance deposits: ${err.message}`,
      };
    }
  }

  // --- Binance Pay Merchant API ---

  private signBinancePay(payload: string, nonce: string, timestamp: number): string {
    const dataToSign = `${timestamp}\n${nonce}\n${payload}\n`;
    return crypto
      .createHmac("sha512", this.bpaySecretKey)
      .update(dataToSign)
      .digest("hex")
      .toUpperCase();
  }

  async createBinancePayOrder(params: {
    merchantTradeNo: string;
    orderAmount: number;
    currency?: string;
    goodsName: string;
    goodsDetail?: string;
  }): Promise<any> {
    if (!this.bpayApiKey || !this.bpaySecretKey) {
      throw new Error("Binance Pay credentials are not configured");
    }

    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString("hex");

    const bodyObj = {
      env: { terminalType: "WEB" },
      merchantTradeNo: params.merchantTradeNo,
      orderAmount: params.orderAmount.toFixed(2),
      currency: params.currency || "USDT",
      goods: {
        goodsType: "02", // Virtual goods
        goodsCategory: "Z000",
        referenceGoodsId: params.merchantTradeNo,
        goodsName: params.goodsName,
        goodsDetail: params.goodsDetail || params.goodsName,
      },
    };

    const payload = JSON.stringify(bodyObj);
    const signature = this.signBinancePay(payload, nonce, timestamp);

    const res = await fetch(`${this.bpayBaseUrl}/binancepay/openapi/v2/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "BinancePay-Timestamp": timestamp.toString(),
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": this.bpayApiKey,
        "BinancePay-Signature": signature,
      },
      body: payload,
    });

    const data = await res.json();
    return data;
  }

  async queryBinancePayOrder(merchantTradeNo: string): Promise<any> {
    if (!this.bpayApiKey || !this.bpaySecretKey) {
      throw new Error("Binance Pay credentials are not configured");
    }

    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString("hex");
    const payload = JSON.stringify({ merchantTradeNo });
    const signature = this.signBinancePay(payload, nonce, timestamp);

    const res = await fetch(`${this.bpayBaseUrl}/binancepay/openapi/v2/order/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "BinancePay-Timestamp": timestamp.toString(),
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": this.bpayApiKey,
        "BinancePay-Signature": signature,
      },
      body: payload,
    });

    return res.json();
  }
}
