"use client";

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Wallet,
  Coins,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { formatUsdt, formatVnd } from "@/lib/utils";

export default function AdminWalletPage() {
  const [balance, setBalance] = useState<{ balance_vnd: number; balance_usdt: number } | null>(
    null
  );
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Deposit creation states
  const [depositAmount, setDepositAmount] = useState<number>(10);
  const [creatingDeposit, setCreatingDeposit] = useState(false);
  const [depositData, setDepositData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/admin/wallet/balance");
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        if (data.rate?.usdt_vnd) setRate(data.rate.usdt_vnd);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDeposit(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: depositAmount, currency: "usdt" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create deposit request");
      }

      setDepositData(data);
    } catch (err: any) {
      setError(err.message || "Failed to create deposit");
    } finally {
      setCreatingDeposit(false);
    }
  };

  const copyText = (text: string, type: "addr" | "amt") => {
    navigator.clipboard.writeText(text);
    if (type === "addr") {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    } else {
      setCopiedAmt(true);
      setTimeout(() => setCopiedAmt(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Connecting to Shop Bot wallet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bot Master Wallet
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supplier account balance on tunvnmmo.duckdns.org used to fulfill customer orders.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchWallet();
          }}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Balance
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Available USDT Balance
            </span>
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-warning">
            {balance?.balance_usdt !== undefined ? `${balance.balance_usdt.toFixed(2)} USDT` : "0.00 USDT"}
          </div>
          <p className="text-xs text-slate-400">
            Deducted automatically when fulfilling customer subscriptions via <code>/api/buy</code>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Available VND Balance
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {balance?.balance_vnd !== undefined ? formatVnd(balance.balance_vnd) : "0 VND"}
          </div>
          <p className="text-xs text-slate-400">
            Rate: 1 USDT = {rate?.toLocaleString() || "25,658"} VND
          </p>
        </div>
      </div>

      {/* Create Deposit Request */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-border space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Top Up Bot Master Wallet
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Create an official BEP20 deposit request to recharge the supplier wallet balance.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateDeposit} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="w-full sm:w-60">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deposit Amount (USDT)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm font-bold text-white focus:outline-none focus:border-accent"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                USDT
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={creatingDeposit}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creatingDeposit ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Address...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Create Deposit Request
              </>
            )}
          </button>
        </form>

        {/* Deposit Result with QR */}
        {depositData && depositData.deposit && (
          <div className="mt-6 p-6 rounded-2xl bg-surface border border-accent/40 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[10px] font-bold text-accent uppercase">
                  Deposit Request Created
                </span>
                <h4 className="text-base font-bold text-white">
                  Payment Code: {depositData.deposit.payment_code}
                </h4>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Expires in: {depositData.deposit.expires_in_minutes}m
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white">
                <QRCodeSVG
                  value={depositData.deposit.wallet_transfer?.address || ""}
                  size={150}
                  level="M"
                />
                <span className="text-[10px] font-bold text-slate-800 mt-2 uppercase">
                  Network: {depositData.deposit.wallet_transfer?.network || "BEP20"}
                </span>
              </div>

              <div className="md:col-span-2 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-surface-card border border-border">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Send EXACT Amount:</span>
                    <button
                      onClick={() =>
                        copyText(
                          depositData.deposit.wallet_transfer.exact_amount.toString(),
                          "amt"
                        )
                      }
                      className="text-accent font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedAmt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedAmt ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="text-xl font-black text-warning font-mono">
                    {depositData.deposit.wallet_transfer?.exact_amount} USDT
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-card border border-border">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span>Supplier Deposit Address (BEP20):</span>
                    <button
                      onClick={() =>
                        copyText(depositData.deposit.wallet_transfer.address, "addr")
                      }
                      className="text-accent font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedAddr ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedAddr ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-slate-200 break-all select-all">
                    {depositData.deposit.wallet_transfer?.address}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-card border border-border text-[11px] text-slate-400">
                  {depositData.note ||
                    "Payment will be auto-detected within 1-2 minutes. Balance will be credited automatically."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
