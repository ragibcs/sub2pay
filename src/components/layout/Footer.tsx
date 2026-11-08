"use client";

import React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-border bg-surface-card/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">SubXpress</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Automated digital subscription and AI token delivery. Powered by instant Binance BEP20
              blockchain auto-verification and 24/7 API fulfillment.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Binance Auto-Detected
              </span>
              <span className="flex items-center gap-1 text-accent">
                <Lock className="w-4 h-4" /> 100% Guaranteed Stock
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Storefront
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Featured Products
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/buff-muse" className="hover:text-white transition-colors">
                  Muse AI Buff Token
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Lookup Order / Warranty
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Admin */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Payment & Security
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                Binance USDT (BEP20)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                Binance Pay Merchant
              </li>
              <li className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-light font-medium"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Store Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SubXpress. Digital Delivery Platform.</p>
          <p>Direct API integration with Shop Bot & Binance blockchain.</p>
        </div>
      </div>
    </footer>
  );
}
