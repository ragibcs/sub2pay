"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Zap,
  DollarSign,
  HelpCircle,
  Coins,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [shopbotBaseUrl, setShopbotBaseUrl] = useState("https://tunvnmmo.duckdns.org");
  const [shopbotApiKey, setShopbotApiKey] = useState("");

  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceApiSecret, setBinanceApiSecret] = useState("");
  const [binanceDepositAddress, setBinanceDepositAddress] = useState("");
  const [binanceDepositNetwork, setBinanceDepositNetwork] = useState("BSC");

  const [binancePayMerchantId, setBinancePayMerchantId] = useState("");
  const [binancePayApiKey, setBinancePayApiKey] = useState("");
  const [binancePaySecretKey, setBinancePaySecretKey] = useState("");

  const [storeName, setStoreName] = useState("SubXpress Store");
  const [storeTagline, setStoreTagline] = useState("Instant Digital Subscriptions & AI Tokens");
  const [globalMarkupPercent, setGlobalMarkupPercent] = useState(15);
  const [defaultCurrency, setDefaultCurrency] = useState("USDT");
  const [telegramNotification, setTelegramNotification] = useState("");

  // Test states
  const [testingShopbot, setTestingShopbot] = useState(false);
  const [shopbotTestResult, setShopbotTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const [testingBinance, setTestingBinance] = useState(false);
  const [binanceTestResult, setBinanceTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          setShopbotBaseUrl(s.shopbotBaseUrl || "https://tunvnmmo.duckdns.org");
          setShopbotApiKey(s.shopbotApiKey || "");

          setBinanceApiKey(s.binanceApiKey || "");
          setBinanceApiSecret(s.binanceApiSecret || "");
          setBinanceDepositAddress(s.binanceDepositAddress || "");
          setBinanceDepositNetwork(s.binanceDepositNetwork || "BSC");

          setBinancePayMerchantId(s.binancePayMerchantId || "");
          setBinancePayApiKey(s.binancePayApiKey || "");
          setBinancePaySecretKey(s.binancePaySecretKey || "");

          setStoreName(s.storeName || "SubXpress Store");
          setStoreTagline(s.storeTagline || "Instant Digital Subscriptions & AI Tokens");
          setGlobalMarkupPercent(s.globalMarkupPercent ?? 15);
          setDefaultCurrency(s.defaultCurrency || "USDT");
          setTelegramNotification(s.telegramNotification || "");
        }
      })
      .catch((err) => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopbotBaseUrl,
          shopbotApiKey,
          binanceApiKey,
          binanceApiSecret,
          binanceDepositAddress,
          binanceDepositNetwork,
          binancePayMerchantId,
          binancePayApiKey,
          binancePaySecretKey,
          storeName,
          storeTagline,
          globalMarkupPercent,
          defaultCurrency,
          telegramNotification,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestShopbot = async () => {
    setTestingShopbot(true);
    setShopbotTestResult(null);

    try {
      const res = await fetch("/api/admin/settings/test-shopbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: shopbotBaseUrl,
          apiKey: shopbotApiKey,
        }),
      });

      const data = await res.json();
      setShopbotTestResult(data);
    } catch (err: any) {
      setShopbotTestResult({
        success: false,
        message: err.message || "Failed to connect to Shop Bot API",
      });
    } finally {
      setTestingShopbot(false);
    }
  };

  const handleTestBinance = async () => {
    setTestingBinance(true);
    setBinanceTestResult(null);

    try {
      const res = await fetch("/api/admin/settings/test-binance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: binanceApiKey,
          apiSecret: binanceApiSecret,
        }),
      });

      const data = await res.json();
      setBinanceTestResult(data);
    } catch (err: any) {
      setBinanceTestResult({
        success: false,
        message: err.message || "Failed to test Binance connection",
      });
    } finally {
      setTestingBinance(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            API Keys &amp; Gateway Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your Account API Key (Shop Bot API) and Binance Keys for automated payment
            verification.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Saved Successfully!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Configuration
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>All settings saved to database successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Shop Bot Account API Key */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary-light">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Shop Bot API Configuration (Account Key)
                </h3>
                <p className="text-xs text-slate-400">
                  External supplier API for inventory, automated purchases, and wallet balance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestShopbot}
              disabled={testingShopbot}
              className="px-3.5 py-1.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              {testingShopbot ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Test Shop Bot Connection
                </>
              )}
            </button>
          </div>

          {shopbotTestResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                shopbotTestResult.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-danger/10 border-danger/20 text-danger"
              }`}
            >
              {shopbotTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold">{shopbotTestResult.message}</span>
                {shopbotTestResult.data && (
                  <div className="mt-1 font-mono text-[11px] text-slate-300">
                    Bot Master Balance: {shopbotTestResult.data.balance_usdt} USDT (
                    {shopbotTestResult.data.balance_vnd?.toLocaleString()} VND) • Rate:{" "}
                    {shopbotTestResult.data.exchangeRate?.toLocaleString()} VND
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Shop Bot Base URL
              </label>
              <input
                type="text"
                value={shopbotBaseUrl}
                onChange={(e) => setShopbotBaseUrl(e.target.value)}
                placeholder="https://tunvnmmo.duckdns.org"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account API Key (<code>X-API-Key</code>)
              </label>
              <input
                type="text"
                value={shopbotApiKey}
                onChange={(e) => setShopbotApiKey(e.target.value)}
                placeholder="Paste your Shop Bot API Key here"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Binance Auto-Payment Verification API */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-warning/10 text-warning">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Binance Auto-Payment Verification (Spot Deposit API)
                </h3>
                <p className="text-xs text-slate-400">
                  Customer transfers USDT BEP20 directly to your Binance wallet. The system verifies
                  on-chain deposits via Binance API.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestBinance}
              disabled={testingBinance}
              className="px-3.5 py-1.5 rounded-xl bg-surface-raised hover:bg-surface border border-border text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              {testingBinance ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Test Binance Connection
                </>
              )}
            </button>
          </div>

          {binanceTestResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                binanceTestResult.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-danger/10 border-danger/20 text-danger"
              }`}
            >
              {binanceTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{binanceTestResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Binance API Key (Read-only / Enable Reading)
              </label>
              <input
                type="text"
                value={binanceApiKey}
                onChange={(e) => setBinanceApiKey(e.target.value)}
                placeholder="Binance API Key"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Binance API Secret
              </label>
              <input
                type="password"
                value={binanceApiSecret}
                onChange={(e) => setBinanceApiSecret(e.target.value)}
                placeholder="Binance API Secret"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Binance USDT Deposit Address (BEP20 / BSC)
              </label>
              <input
                type="text"
                value={binanceDepositAddress}
                onChange={(e) => setBinanceDepositAddress(e.target.value)}
                placeholder="0x... (Your Binance deposit wallet address)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Customers will send exact payment to this address when checking out.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deposit Network
              </label>
              <select
                value={binanceDepositNetwork}
                onChange={(e) => setBinanceDepositNetwork(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-semibold text-white focus:outline-none focus:border-primary"
              >
                <option value="BSC">BSC / BEP20 (Binance Smart Chain) - Recommended</option>
                <option value="ETH">ERC20 (Ethereum)</option>
                <option value="TRX">TRC20 (Tron)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Binance Pay Merchant API (Optional) */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Binance Pay Merchant API (Optional)
              </h3>
              <p className="text-xs text-slate-400">
                Official Binance Pay QR code and mobile app checkout for verified merchants.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Merchant ID
              </label>
              <input
                type="text"
                value={binancePayMerchantId}
                onChange={(e) => setBinancePayMerchantId(e.target.value)}
                placeholder="Binance Pay Merchant ID"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Binance Pay API Key (Certificate SN)
              </label>
              <input
                type="text"
                value={binancePayApiKey}
                onChange={(e) => setBinancePayApiKey(e.target.value)}
                placeholder="Certificate SN"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Secret Key
              </label>
              <input
                type="password"
                value={binancePaySecretKey}
                onChange={(e) => setBinancePaySecretKey(e.target.value)}
                placeholder="Binance Pay Secret Key"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Store & Profit Markup Rules */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pricing Markup &amp; Store Info</h3>
              <p className="text-xs text-slate-400">
                Set your retail profit margin over Shop Bot wholesale prices.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Global Markup Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.5"
                  value={globalMarkupPercent}
                  onChange={(e) => setGlobalMarkupPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-emerald-400 focus:outline-none focus:border-primary"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  % Profit
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                E.g. 15% means retail price = wholesale cost × 1.15.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store Display Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="SubXpress Store"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Storefront Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs font-semibold text-white focus:outline-none focus:border-primary"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="VND">VND (Vietnamese Dong)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Configuration...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Configuration
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
