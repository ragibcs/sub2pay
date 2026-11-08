"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Package,
  ShoppingCart,
  Wallet,
  Cpu,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Coins,
  Menu,
  X,
  Zap,
  CreditCard,
  Server,
  Key,
} from "lucide-react";
import { formatUsdt, formatVnd } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balance, setBalance] = useState<{ balance_vnd: number; balance_usdt: number } | null>(
    null
  );

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    // Check auth
    fetch("/api/admin/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });

    // Fetch live bot balance
    fetch("/api/admin/wallet/balance")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.balance) {
          setBalance(data.balance);
        }
      })
      .catch(() => {});
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Payment Channels (ON/OFF)", href: "/admin/payment-channels", icon: CreditCard },
    { label: "Multi-Vendor APIs", href: "/admin/vendors", icon: Server },
    { label: "Products & Pricing", href: "/admin/products", icon: Package },
    { label: "Card Key Pools", href: "/admin/card-keys", icon: Key },
    { label: "Customer Orders", href: "/admin/orders", icon: ShoppingCart },
    { label: "Gateway Credentials", href: "/admin/settings", icon: Settings },
    { label: "Bot Master Wallet", href: "/admin/wallet", icon: Wallet },
    { label: "Buff Muse AI", href: "/admin/buff", icon: Cpu },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-surface-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">SubXpress Admin</span>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-surface text-slate-300 border border-border"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-64 bg-surface border-r border-border flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white">SubXpress</span>
                <span className="text-[10px] font-semibold text-accent block -mt-1 uppercase">
                  Admin Panel
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-400 hover:text-white hover:bg-surface-raised"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Live Bot Balance Widget */}
          {balance && (
            <div className="p-3 rounded-xl bg-surface-card border border-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-warning" /> Bot Master Balance
              </span>
              <div className="text-sm font-extrabold text-emerald-400 font-mono">
                {balance.balance_usdt.toFixed(2)} USDT
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {formatVnd(balance.balance_vnd)}
              </div>
            </div>
          )}

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-raised transition-colors"
          >
            <span>View Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl">{children}</main>
    </div>
  );
}
