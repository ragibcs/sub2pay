"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck, CheckCircle2, Copy, Check, Loader2, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function OrderLookupPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to search orders");
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || "Failed to lookup orders");
      setOrders(null);
    } finally {
      setLoading(false);
    }
  };

  const copyCreds = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Lookup Your Orders</h1>
        <p className="text-xs text-slate-400 mt-2">
          Enter your Order Number or Delivery Email to retrieve credentials and check fulfillment
          status anytime.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Order ID (e.g. SUB-...) or Email"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-surface-card border border-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger text-center mb-6">
          {error}
        </div>
      )}

      {/* Orders Result List */}
      {orders && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Results ({orders.length} found)
          </h2>

          {orders.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-card border border-border text-center text-xs text-slate-400">
              No orders found matching &quot;{query}&quot;. Please verify your spelling or order ID.
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.orderNumber}
                className="p-5 rounded-2xl bg-surface-card border border-border space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/80 gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-primary-light">
                      #{o.orderNumber}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{o.productName}</h3>
                    <span className="text-[11px] text-slate-400">
                      Date: {formatDate(o.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {o.fulfillmentStatus === "DELIVERED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 border border-warning/20 text-xs font-bold text-warning">
                        {o.paymentStatus}
                      </span>
                    )}

                    <Link
                      href={`/checkout/${o.orderNumber}`}
                      className="px-3 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-xs text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      View Live <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Delivered Credentials */}
                {o.deliveredItems && o.deliveredItems.length > 0 && (
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Delivered Credentials
                      </span>
                      <button
                        onClick={() => copyCreds(o.orderNumber, o.deliveredItems.join("\n"))}
                        className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-xs text-slate-300 hover:text-white flex items-center gap-1"
                      >
                        {copiedId === o.orderNumber ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-background font-mono text-xs text-emerald-400 select-all whitespace-pre-wrap break-all">
                      {o.deliveredItems.join("\n")}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
