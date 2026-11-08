"use client";

import React from "react";
import Link from "next/link";
import { Zap, Shield, Sparkles, Clock, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden py-14 sm:py-20 gradient-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary-light mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-spin-slow" />
          <span>Binance Auto-Payment & Instant Digital Delivery</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Premium Subscriptions & AI Tokens,{" "}
          <span className="bg-gradient-to-r from-accent via-primary-light to-primary bg-clip-text text-transparent">
            Delivered in Seconds.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Netflix, ChatGPT Plus, Spotify, VPNs, and Muse AI Buff Tokens. Pay securely via Binance
          USDT (BEP20). Our automated verification engine detects your transaction and displays
          credentials instantly.
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/products"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold text-sm shadow-lg shadow-primary/25 transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            Explore Subscriptions
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/buff-muse"
            className="px-6 py-3 rounded-xl bg-surface-card hover:bg-surface-raised border border-border hover:border-accent/40 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-accent" />
            Top-up Muse AI Tokens
          </Link>
        </div>

        {/* 3 Value props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mt-14 pt-8 border-t border-border/60">
          <div className="p-4 rounded-xl bg-surface-card/40 border border-border/50 text-left flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Instant Fulfillment</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                API credentials shown on screen the moment payment confirms.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card/40 border border-border/50 text-left flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Binance Auto-Verify</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero manual approval. Auto-detects on-chain Binance deposits.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card/40 border border-border/50 text-left flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary-light mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Full Warranty</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Lookup past orders anytime with your order ID or email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
