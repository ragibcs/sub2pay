"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Zap, Shield, Loader2, ArrowRight, Check, Coins } from "lucide-react";
import { formatVnd, formatUsdt } from "@/lib/utils";

interface BuyModalProps {
  product: {
    id: number;
    name: string;
    description?: string | null;
    retailPriceUsdt: number;
    retailPriceVnd: number;
    stock: number;
    bonus?: number;
    category?: string;
  };
  onClose: () => void;
  currency: "USDT" | "VND";
}

interface PaymentChannel {
  id: string;
  code: string;
  name: string;
  provider: string;
  description?: string;
  badge?: string;
}

export function BuyModal({ product, onClose, currency }: BuyModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("BINANCE_DEPOSIT");
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/payment-channels")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.channels && data.channels.length > 0) {
          setChannels(data.channels);
          setPaymentMethod(data.channels[0].code);
        }
      })
      .catch((err) => console.error("Error loading payment channels:", err))
      .finally(() => setLoadingChannels(false));
  }, []);

  const price =
    currency === "VND"
      ? product.retailPriceVnd * quantity
      : parseFloat((product.retailPriceUsdt * quantity).toFixed(2));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address for delivery");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerEmail: email.trim(),
          paymentMethod,
          currency: currency.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      // Redirect to the live checkout payment & delivery screen
      router.push(`/checkout/${data.order.orderNumber}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong creating order");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">
              Instant Order
            </span>
            <h3 className="text-lg font-bold text-white">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleCheckout} className="mt-5 space-y-4">
          {/* Quantity selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantity</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-xl bg-surface-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-surface-raised transition-colors font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-white min-w-[40px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-surface-raised transition-colors font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-400">
                {product.stock} units available
                {product.bonus && product.bonus > 0 ? (
                  <span className="ml-1 text-emerald-400 font-medium">
                    (+{product.bonus * quantity} bonus)
                  </span>
                ) : null}
              </span>
            </div>
          </div>

          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Delivery Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-card border border-border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Your credentials will be shown on screen &amp; saved to your order lookup.
            </p>
          </div>

          {/* Payment Method Selector (Dynamically Enabled by Admin) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Method (Select Enabled Gateway)
            </label>

            {loadingChannels ? (
              <div className="p-4 text-center text-xs text-slate-500 border border-border rounded-xl">
                Loading available payment methods...
              </div>
            ) : channels.length === 0 ? (
              <div className="p-4 text-center text-xs text-warning bg-warning/10 border border-warning/20 rounded-xl">
                No payment methods currently enabled. Please turn on at least one payment method in
                Admin Panel.
              </div>
            ) : (
              <div className="space-y-2">
                {channels.map((ch) => {
                  const isSelected = paymentMethod === ch.code;
                  return (
                    <button
                      key={ch.code}
                      type="button"
                      onClick={() => setPaymentMethod(ch.code)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 text-white shadow-sm"
                          : "border-border bg-surface-card text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            ch.code.includes("BINANCE")
                              ? "bg-warning/10 text-warning"
                              : "bg-accent/10 text-accent"
                          }`}
                        >
                          {ch.code.includes("BINANCE") ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <Coins className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{ch.name}</span>
                            {ch.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised border border-border text-slate-300 uppercase">
                                {ch.badge}
                              </span>
                            )}
                          </div>
                          {ch.description && (
                            <span className="text-[11px] text-slate-400 block mt-0.5 line-clamp-1">
                              {ch.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-primary bg-primary" : "border-slate-600"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price summary */}
          <div className="p-3.5 rounded-xl bg-surface-card border border-border flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Due:</span>
            <span className="text-base font-extrabold text-emerald-400">
              {currency === "VND" ? formatVnd(price) : formatUsdt(price)}
            </span>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || channels.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Preparing Payment...
              </>
            ) : (
              <>
                Proceed to Payment
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
