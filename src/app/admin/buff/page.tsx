"use client";

import React, { useEffect, useState } from "react";
import { Cpu, RefreshCw, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { formatUsdt, formatVnd, formatDate } from "@/lib/utils";

export default function AdminBuffPage() {
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [externalHistory, setExternalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBuffOrders = async () => {
    try {
      const res = await fetch("/api/admin/buff");
      const data = await res.json();
      if (data.success) {
        setLocalOrders(data.localOrders || []);
        setExternalHistory(data.externalHistory || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuffOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
        <p className="text-sm">Loading Buff Muse AI token batches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Buff Muse AI Batches
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track token top-up batches placed through the Shop Bot API balance.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchBuffOrders();
          }}
          disabled={refreshing}
          className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Batches
        </button>
      </div>

      {/* Customer Buff Orders Table */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent" />
          Customer Store Orders ({localOrders.length})
        </h3>

        {localOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No customer Buff token orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-border/80">
                  <th className="pb-3 font-semibold">Batch ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Tokens</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Payment</th>
                  <th className="pb-3 font-semibold">Progress</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {localOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface-raised/40">
                    <td className="py-3 font-mono font-bold text-accent">#{ord.batchId}</td>
                    <td className="py-3 text-slate-300">{ord.customerEmail}</td>
                    <td className="py-3 font-bold text-white">{ord.totalTokensB} Billion</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">
                      {ord.sellPriceUsdt} USDT
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.paymentStatus === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.isDone
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(ord.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* External Wholesale History */}
      {externalHistory.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
          <h3 className="text-base font-bold text-white">Supplier Bot Batches History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-border/80">
                  <th className="pb-3 font-semibold">Supplier Batch #</th>
                  <th className="pb-3 font-semibold">Invite Code</th>
                  <th className="pb-3 font-semibold">Quantity</th>
                  <th className="pb-3 font-semibold">Wholesale Cost</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {externalHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-raised/40">
                    <td className="py-3 font-mono text-slate-400">{item.batch_id}</td>
                    <td className="py-3 font-mono font-bold text-white">{item.invite_code}</td>
                    <td className="py-3">{item.quantity_b} B</td>
                    <td className="py-3 font-mono text-slate-300">
                      {item.currency === "vnd"
                        ? formatVnd(item.sell_price_vnd)
                        : formatUsdt(item.sell_price_usdt)}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{item.completed_at || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
