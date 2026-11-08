"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCw,
  Copy,
  Check,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatUsdt, formatVnd, formatDate } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchOrders = async () => {
    try {
      const url = new URL("/api/admin/orders", window.location.origin);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (search) url.searchParams.set("query", search);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    setRetryResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setRetryResult("Fulfillment succeeded!");
        fetchOrders();
      } else {
        setRetryResult(`Retry failed: ${data.buyResult?.error || data.error}`);
      }
    } catch (err: any) {
      setRetryResult(`Retry error: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const copyCreds = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Customer Orders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time payments, Binance deposit matches, and delivered credentials.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {["ALL", "PENDING", "PAID", "DELIVERED", "FAILED", "EXPIRED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-card border border-border text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order # or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </form>
      </div>

      {/* Orders Table */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading customer orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-border/80">
                  <th className="pb-3 font-semibold">Order Number</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Payment</th>
                  <th className="pb-3 font-semibold">Delivery</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-surface-raised/40">
                    <td className="py-3 font-mono font-bold text-primary-light">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 text-slate-300">{ord.customerEmail}</td>
                    <td className="py-3 text-white font-medium">
                      {ord.quantity}x {ord.productName}
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-200">
                      {ord.currency === "vnd"
                        ? formatVnd(ord.totalAmount)
                        : formatUsdt(ord.totalAmount)}
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ord.paymentMethod === "BINANCE_DEPOSIT" ? "USDT BEP20" : ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.paymentStatus === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : ord.paymentStatus === "EXPIRED"
                            ? "bg-danger/10 text-danger border border-danger/20"
                            : "bg-warning/10 text-warning border border-warning/20"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.fulfillmentStatus === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : ord.fulfillmentStatus === "FAILED"
                            ? "bg-danger/10 text-danger border border-danger/20"
                            : "bg-slate-700/50 text-slate-400"
                        }`}
                      >
                        {ord.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(ord.createdAt)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-slate-300 hover:text-white font-semibold text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent">Order Details</span>
                <h3 className="text-base font-bold text-white">#{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-card border border-border">
                <span className="text-slate-400 block">Customer Email:</span>
                <span className="font-bold text-white select-all">
                  {selectedOrder.customerEmail}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-card border border-border">
                <span className="text-slate-400 block">Product:</span>
                <span className="font-bold text-white">
                  {selectedOrder.quantity}x {selectedOrder.productName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-card border border-border">
                <span className="text-slate-400 block">Charged Amount:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {selectedOrder.currency === "vnd"
                    ? formatVnd(selectedOrder.totalAmount)
                    : formatUsdt(selectedOrder.totalAmount)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-card border border-border">
                <span className="text-slate-400 block">Exact Crypto Amount:</span>
                <span className="font-bold text-warning font-mono">
                  {selectedOrder.exactPayAmount || selectedOrder.totalAmount} USDT
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-card border border-border col-span-2">
                <span className="text-slate-400 block">Deposit Address:</span>
                <span className="font-mono text-slate-300 break-all select-all">
                  {selectedOrder.paymentAddress}
                </span>
              </div>

              {selectedOrder.paymentTxId && (
                <div className="p-3 rounded-xl bg-surface-card border border-border col-span-2">
                  <span className="text-slate-400 block">Blockchain TxID / Proof:</span>
                  <span className="font-mono text-accent break-all select-all">
                    {selectedOrder.paymentTxId}
                  </span>
                </div>
              )}
            </div>

            {/* Delivered Items */}
            {selectedOrder.deliveredItemsList && selectedOrder.deliveredItemsList.length > 0 && (
              <div className="p-4 rounded-xl bg-surface-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Delivered Account Credentials
                  </span>
                  <button
                    onClick={() => copyCreds(selectedOrder.deliveredItemsList.join("\n"))}
                    className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface border border-border text-xs text-slate-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-background font-mono text-xs text-emerald-400 select-all whitespace-pre-wrap break-all">
                  {selectedOrder.deliveredItemsList.join("\n")}
                </div>
              </div>
            )}

            {/* Error notice if fulfillment failed */}
            {selectedOrder.fulfillmentError && (
              <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
                <strong>Supplier error:</strong> {selectedOrder.fulfillmentError}
              </div>
            )}

            {retryResult && (
              <div className="p-3 rounded-xl bg-surface-card border border-border text-xs text-slate-300">
                {retryResult}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <a
                href={`/checkout/${selectedOrder.orderNumber}`}
                target="_blank"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                Open Customer View <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                {selectedOrder.fulfillmentStatus !== "DELIVERED" && (
                  <button
                    onClick={() => handleRetry(selectedOrder.id)}
                    disabled={retryingId === selectedOrder.id}
                    className="px-4 py-2 rounded-xl bg-warning hover:bg-amber-600 text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    {retryingId === selectedOrder.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="w-3.5 h-3.5" />
                    )}
                    Retry Fulfillment Now
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border text-xs font-semibold text-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
