"use client";

import React, { useState } from "react";
import { Zap, ShieldCheck, Gift, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { formatVnd, formatUsdt } from "@/lib/utils";
import { BuyModal } from "./BuyModal";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description?: string | null;
    retailPriceUsdt: number;
    retailPriceVnd: number;
    stock: number;
    bonus?: number;
    category?: string;
    customImage?: string | null;
    isFeatured?: boolean;
  };
  currency: "USDT" | "VND";
}

export function ProductCard({ product, currency }: ProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const inStock = product.stock > 0;

  // Category based theme colors when no custom image is uploaded
  const getGradientForCategory = (cat: string = "") => {
    const c = cat.toLowerCase();
    if (c.includes("ai") || c.includes("tool")) {
      return "from-indigo-600/40 via-purple-600/30 to-surface-card";
    }
    if (c.includes("stream") || c.includes("video") || c.includes("netflix")) {
      return "from-rose-600/40 via-red-600/30 to-surface-card";
    }
    if (c.includes("music") || c.includes("spotify")) {
      return "from-emerald-600/40 via-teal-600/30 to-surface-card";
    }
    if (c.includes("vpn") || c.includes("security")) {
      return "from-cyan-600/40 via-blue-600/30 to-surface-card";
    }
    return "from-primary/40 via-accent/30 to-surface-card";
  };

  return (
    <>
      <div className="group relative rounded-2xl bg-surface-card border border-border hover:border-primary/50 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
        {/* Top Cover Image Box */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface border-b border-border/80">
          {product.customImage ? (
            <img
              src={product.customImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-tr ${getGradientForCategory(
                product.category
              )} flex items-center justify-center p-6 text-center relative overflow-hidden`}
            >
              {/* Abstract futuristic grid pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.2),transparent_70%)]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-surface/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase mt-2">
                  {product.category || "Subscription"}
                </span>
              </div>
            </div>
          )}

          {/* Floating Category Pill */}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-full bg-surface-card/85 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white shadow-md uppercase tracking-wider">
              {product.category || "Subscription"}
            </span>
          </div>

          {/* Floating Stock Pill */}
          <div className="absolute top-3 right-3 z-10">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-[10px] font-bold text-emerald-300 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {product.stock} Available
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-[10px] font-medium text-slate-400 shadow-md">
                Sold Out
              </span>
            )}
          </div>

          {/* Featured Ribbon */}
          {product.isFeatured && (
            <div className="absolute bottom-2 left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning/90 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-primary-light transition-colors line-clamp-1">
              {product.name}
            </h3>

            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {product.description ||
                "Instant digital credentials delivered immediately upon automated blockchain payment confirmation."}
            </p>

            {/* Badges / Bonuses */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                <CheckCircle2 className="w-3 h-3" /> Auto-Delivery
              </span>

              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-surface-raised px-2 py-0.5 rounded-md border border-border">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Warranty
              </span>

              {product.bonus && product.bonus > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-md border border-warning/20">
                  <Gift className="w-3 h-3" /> +{product.bonus} Bonus
                </span>
              ) : null}
            </div>
          </div>

          {/* Bottom Section: Price + CTA */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                Instant Price
              </span>
              <span className="text-lg font-black text-emerald-400">
                {currency === "VND"
                  ? formatVnd(product.retailPriceVnd)
                  : formatUsdt(product.retailPriceUsdt)}
              </span>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              disabled={!inStock}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary disabled:from-surface-raised disabled:to-surface-raised disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 group-hover:scale-105"
            >
              <Zap className="w-3.5 h-3.5 text-warning" />
              <span>Buy Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <BuyModal
          product={product}
          currency={currency}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
