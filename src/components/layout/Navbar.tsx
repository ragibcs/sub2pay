"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Search,
  ShieldCheck,
  Cpu,
  Menu,
  X,
  Coins,
  User,
  ShoppingBag,
  LogOut,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [currency, setCurrency] = useState<"USDT" | "VND">("USDT");
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);

  const checkUserAuth = () => {
    fetch("/api/user/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  };

  useEffect(() => {
    // Load stored currency
    const saved = localStorage.getItem("subxpress_currency");
    if (saved === "VND" || saved === "USDT") {
      setCurrency(saved);
    }

    // Fetch rate
    fetch("/api/public/rate")
      .then((r) => r.json())
      .then((data) => {
        if (data.usdt_vnd) setRate(data.usdt_vnd);
      })
      .catch(() => {});

    // Check user auth
    checkUserAuth();

    window.addEventListener("userAuthChange", checkUserAuth);
    return () => window.removeEventListener("userAuthChange", checkUserAuth);
  }, []);

  const toggleCurrency = () => {
    const next = currency === "USDT" ? "VND" : "USDT";
    setCurrency(next);
    localStorage.setItem("subxpress_currency", next);
    window.dispatchEvent(new Event("currencyChange"));
  };

  const handleUserLogout = async () => {
    await fetch("/api/user/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("userAuthChange"));
  };

  const isAdminRoute = pathname?.startsWith("/admin");
  if (isAdminRoute) return null; // Admin has its own layout

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SimpleCard
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-accent block -mt-1 uppercase">
                Instant Delivery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/" ? "text-white bg-surface-raised" : "text-slate-400 hover:text-white"
              }`}
            >
              Storefront
            </Link>
            <Link
              href="/products"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/products"
                  ? "text-white bg-surface-raised"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Subscriptions
            </Link>
            <Link
              href="/buff-muse"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/buff-muse"
                  ? "text-accent bg-accent/10 border border-accent/20"
                  : "text-slate-400 hover:text-accent"
              }`}
            >
              <Cpu className="w-4 h-4 text-accent" />
              Buff Muse AI
            </Link>
            <Link
              href="/orders"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                pathname === "/orders"
                  ? "text-white bg-surface-raised"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Search className="w-4 h-4" />
              Lookup Order
            </Link>
          </nav>

          {/* Right Action Tools */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Rate Pill */}
            {rate && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-card border border-border text-xs text-slate-400">
                <Coins className="w-3.5 h-3.5 text-warning" />
                <span>1 USDT = {rate.toLocaleString()} đ</span>
              </div>
            )}

            {/* Currency Switcher */}
            <button
              onClick={toggleCurrency}
              className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-border-light text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1"
              title="Toggle Display Currency"
            >
              <span className={currency === "USDT" ? "text-accent font-bold" : "text-slate-500"}>
                USDT
              </span>
              <span className="text-slate-600">/</span>
              <span className={currency === "VND" ? "text-success font-bold" : "text-slate-500"}>
                VND
              </span>
            </button>

            {/* Customer User Account */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/my/orders"
                  className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-raised border border-border text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-accent" />
                  <span>My Purchases</span>
                </Link>
                <button
                  onClick={handleUserLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-sm shadow-primary/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Admin Login Link */}
            <Link
              href="/admin/login"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-raised transition-colors"
              title="Admin Portal"
            >
              <ShieldCheck className="w-5 h-5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleCurrency}
              className="px-2 py-1 rounded-lg bg-surface border border-border text-xs font-semibold text-slate-300"
            >
              {currency}
            </button>

            {user ? (
              <Link
                href="/my/orders"
                className="p-1.5 rounded-lg bg-surface border border-border text-xs text-accent"
              >
                <ShoppingBag className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-2.5 py-1 rounded-lg bg-primary text-xs font-bold text-white"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-surface border border-border"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface-card px-4 pt-2 pb-4 space-y-2 animate-fade-in">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-raised"
          >
            Storefront
          </Link>
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-raised"
          >
            All Subscriptions
          </Link>
          <Link
            href="/buff-muse"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-accent hover:bg-accent/10"
          >
            Buff Muse AI Token
          </Link>
          <Link
            href="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-surface-raised"
          >
            Lookup Order
          </Link>

          {user ? (
            <Link
              href="/my/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-bold text-emerald-400 hover:bg-emerald-500/10"
            >
              My Purchases Dashboard
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-center text-xs font-semibold text-slate-200 bg-surface border border-border"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-center text-xs font-bold text-white bg-primary"
              >
                Register
              </Link>
            </div>
          )}

          <div className="pt-2 border-t border-border flex items-center justify-between">
            {rate && (
              <span className="text-xs text-slate-400">1 USDT = {rate.toLocaleString()} VND</span>
            )}
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Admin Login →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
