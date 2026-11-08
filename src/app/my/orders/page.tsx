"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { formatUsdt, formatVnd, formatDate } from "@/lib/utils";

export default function MyOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Check if customer is logged in
    fetch("/api/user/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);

        // Fetch user's orders
        return fetch("/api/user/orders")
          .then((r) => r.json())
          .then((ordData) => {
            if (ordData.success && ordData.orders) {
              setOrders(ordData.orders);
            }
          });
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/user/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event("userAuthChange"));
    router.push("/");
  };

  const copyCreds = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Loading your digital purchases...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white text-lg shadow-md shadow-primary/20">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-accent">Customer Dashboard</span>
            <h1 className="text-2xl font-extrabold text-white">{user?.name || "Customer"}</h1>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary/20"
          >
            Buy Subscriptions
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-danger/10 border border-border text-xs text-slate-400 hover:text-danger transition-colors flex items-center gap-1.5 font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent" />
            My Purchases ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 rounded-2xl bg-surface-card border border-border text-center space-y-3">
            <p className="text-sm text-slate-400">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/products"
              className="inline-block px-4 py-2 rounded-xl bg-primary text-xs font-bold text-white shadow-md shadow-primary/20"
            >
              Browse Subscriptions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
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
                      Date: {formatDate(o.createdAt)} • Amount:{" "}
                      <strong className="text-emerald-400">
                        {o.currency === "vnd"
                          ? formatVnd(o.totalAmount)
                          : formatUsdt(o.totalAmount)}
                      </strong>
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
                      View Live <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Delivered Credentials Box */}
                {o.deliveredItems && o.deliveredItems.length > 0 && (
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Delivered Account Credentials
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
