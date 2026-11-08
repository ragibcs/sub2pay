"use client";

import React from "react";
import Link from "next/link";
import { Zap, Shield, Sparkles, Clock, ArrowRight, CheckCircle2, Coins } from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24 gradient-glow">
      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card/80 backdrop-blur-md border border-primary/30 text-xs font-semibold text-primary-light mb-6 shadow-lg shadow-primary/10">
          <Sparkles className="w-3.5 h-3.5 text-warning animate-pulse" />
          <span>Binance Blockchain Auto-Payment &amp; Instant License Delivery</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight sm:leading-none">
          Automated Digital Subscriptions &amp; Keys,{" "}
          <span className="bg-gradient-to-r from-accent via-primary-light to-primary bg-clip-text text-transparent">
            Delivered in Seconds.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Netflix, ChatGPT Plus, Claude, Spotify, VPNs, and Muse AI Buff Tokens. Pay securely via
          Binance USDT (BEP20). Our automated verification engine matches your transfer on the
          blockchain and delivers credentials instantly.
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/products"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold text-sm shadow-xl shadow-primary/25 transition-all flex items-center gap-2 hover:scale-[1.03]"
          >
            <Zap className="w-4 h-4 text-warning" />
            Explore All Subscriptions
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/buff-muse"
            className="px-6 py-3.5 rounded-xl bg-surface-card hover:bg-surface-raised border border-border hover:border-accent/40 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center gap-2"
          >
            <Coins className="w-4 h-4 text-accent" />
            Top-up Muse AI Tokens
          </Link>
        </div>

        {/* Trust Stats Bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              <strong className="text-white font-bold">100%</strong> Automated On-Chain Verification
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>
              <strong className="text-white font-bold">&lt; 60s</strong> Average Fulfillment Time
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-warning" />
            <span>
              <strong className="text-white font-bold">Zero</strong> Manual Approval Required
            </span>
          </div>
        </div>

        {/* 3 Core Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12 pt-8 border-t border-border/60">
          <div className="p-4.5 rounded-2xl bg-surface-card/60 backdrop-blur-md border border-border/70 text-left flex items-start gap-3.5 hover:border-primary/40 transition-colors">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant Screen Reveal</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Credentials and license keys appear directly on screen with 1-click copy and text
                file download.
              </p>
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-surface-card/60 backdrop-blur-md border border-border/70 text-left flex items-start gap-3.5 hover:border-warning/40 transition-colors">
            <div className="p-2.5 rounded-xl bg-warning/10 text-warning mt-0.5 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Binance Auto-Verify</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Direct Binance Spot API &amp; Binance Pay integration with automatic transaction
                matching.
              </p>
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-surface-card/60 backdrop-blur-md border border-border/70 text-left flex items-start gap-3.5 hover:border-primary/40 transition-colors">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary-light mt-0.5 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">30-Day Warranty</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                All digital subscriptions are backed by warranty with 24/7 self-service order lookup
                by email or ID.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
