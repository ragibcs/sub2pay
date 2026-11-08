"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Coins,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Wallet,
  Settings,
  Package,
  Loader2,
} from "lucide-react";
import { formatUsdt, formatVnd, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Loading admin dashboard metrics...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Store Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time sales overview, Binance payment detections, and supplier wallet status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <Link
            href="/admin/settings"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            Manage API Keys
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary-light">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{stats.totalOrders || 0}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400 font-semibold">{stats.deliveredOrders || 0} Delivered</span>
            <span className="text-slate-600">•</span>
            <span className="text-warning font-semibold">{stats.pendingOrders || 0} Pending</span>
          </div>
        </div>

        {/* Revenue USDT */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.totalRevenueUsdt?.toFixed(2) || "0.00"} USDT
          </div>
          <div className="text-xs text-slate-400">
            Est. Profit: ~{stats.estimatedProfitUsdt?.toFixed(2) || "0.00"} USDT
          </div>
        </div>

        {/* Bot Master Balance */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bot Master Balance
            </span>
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-warning">
            {stats.botBalance?.balance_usdt?.toFixed(2) || "0.00"} USDT
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>{formatVnd(stats.botBalance?.balance_vnd || 0)}</span>
            <Link href="/admin/wallet" className="text-primary hover:underline text-[11px]">
              Top Up →
            </Link>
          </div>
        </div>

        {/* Live Exchange Rate */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Exchange Rate
            </span>
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-accent">
            1 USDT = {stats.liveRate?.toLocaleString()} đ
          </div>
          <div className="text-xs text-slate-400">Source: tunvnmmo.duckdns.org</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/settings"
          className="p-4 rounded-xl bg-surface-card hover:bg-surface-raised border border-border hover:border-primary/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary-light">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-primary-light transition-colors">
                API Keys & Verification
              </h4>
              <p className="text-xs text-slate-400">Manage Shop Bot & Binance Keys</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          href="/admin/products"
          className="p-4 rounded-xl bg-surface-card hover:bg-surface-raised border border-border hover:border-accent/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors">
                Product Catalog & Pricing
              </h4>
              <p className="text-xs text-slate-400">Sync wholesale & set markups</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>

        <Link
          href="/admin/wallet"
          className="p-4 rounded-xl bg-surface-card hover:bg-surface-raised border border-border hover:border-warning/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning/10 text-warning">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-warning transition-colors">
                Bot Master Wallet
              </h4>
              <p className="text-xs text-slate-400">Deposit USDT to supplier balance</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-base font-bold text-white">Recent Customer Orders</h3>
          <Link
            href="/admin/orders"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No orders received yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-border/80">
                  <th className="pb-3 font-semibold">Order #</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Payment</th>
                  <th className="pb-3 font-semibold">Fulfillment</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-surface-raised/40">
                    <td className="py-3 font-mono font-bold text-primary-light">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 text-slate-300">{ord.customerEmail}</td>
                    <td className="py-3 text-white font-medium">{ord.productName}</td>
                    <td className="py-3 font-mono font-bold text-slate-200">
                      {ord.currency === "vnd"
                        ? formatVnd(ord.totalAmount)
                        : formatUsdt(ord.totalAmount)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.fulfillmentStatus === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : ord.fulfillmentStatus === "FAILED"
                            ? "bg-danger/10 text-danger"
                            : "bg-slate-700/50 text-slate-400"
                        }`}
                      >
                        {ord.fulfillmentStatus}
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

      {/* System Audit Logs */}
      {recentLogs.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-3">
          <h3 className="text-base font-bold text-white">Recent System Activity</h3>
          <div className="space-y-2">
            {recentLogs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface border border-border/80"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary-light">{log.action}</span>
                  <span className="text-slate-400">{log.details}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span className="font-mono text-slate-400">{log.actor}</span>
                  <span>{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
