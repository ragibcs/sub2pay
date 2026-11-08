"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, Zap, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { formatUsdt, formatVnd } from "@/lib/utils";

export default function BuffMusePage() {
  const router = useRouter();
  const [ordersText, setOrdersText] = useState("ABBADJ 20\nABCDGD 15");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<"USDT" | "VND">("USDT");

  const [checking, setChecking] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const handleCalculatePrice = async () => {
    if (!ordersText.trim()) {
      setError("Please enter at least one invite code and token quantity");
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const res = await fetch("/api/public/buff/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordersText: ordersText.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to calculate quote");
      }

      setQuote(data);
    } catch (err: any) {
      setError(err.message || "Failed to validate codes");
      setQuote(null);
    } finally {
      setChecking(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }
    if (!quote) {
      setError("Please check pricing first");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/public/buff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordersText: ordersText.trim(),
          customerEmail: email.trim(),
          currency: currency.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create Buff order");
      }

      // Redirect to checkout with batchId
      router.push(`/checkout/${data.batchId}`);
    } catch (err: any) {
      setError(err.message || "Error placing Buff order");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent mb-3">
          <Cpu className="w-3.5 h-3.5" />
          <span>Muse AI Buff Token Top-up</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Automated Muse AI Token Credit
        </h1>
        <p className="text-sm text-slate-300 mt-2">
          Supply your Muse AI invite code and token quantity (in billions, 1–30B per code). Our
          system credits tokens automatically upon Binance payment verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Input box */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Invite Codes & Quantities
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Format: <code>INVITE_CODE QUANTITY</code> (one line per code, quantity 1-30 billion)
            </p>
            <textarea
              rows={6}
              value={ordersText}
              onChange={(e) => setOrdersText(e.target.value)}
              placeholder="ABBADJ 20&#10;ABCDGD 15"
              className="w-full p-3.5 rounded-xl bg-surface border border-border text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={handleCalculatePrice}
            disabled={checking}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-raised hover:bg-surface border border-border text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Validating with Muse AI...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-accent" />
                Validate & Calculate Price
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right: Breakdown & Checkout */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-3">Order Price Breakdown</h3>

            {quote ? (
              <div className="space-y-4">
                {/* Breakdown items */}
                <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2 max-h-40 overflow-y-auto">
                  {quote.orders_breakdown?.map((line: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-b-0"
                    >
                      <span className="font-mono text-slate-300">
                        Code: <strong>{line.invite_code}</strong>
                      </span>
                      <span className="text-accent font-bold">{line.quantity_b} Billion Tokens</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Price:</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {currency === "VND"
                      ? formatVnd(quote.sell_price_vnd)
                      : formatUsdt(quote.sell_price_usdt)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-border rounded-xl">
                Enter your invite codes on the left and click &quot;Validate &amp; Calculate Price&quot; to
                view quote.
              </div>
            )}
          </div>

          {/* Checkout form */}
          {quote && (
            <form onSubmit={handlePlaceOrder} className="space-y-3 pt-3 border-t border-border">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Delivery Email (for receipt &amp; status)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Proceed to Binance Auto-Payment
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
