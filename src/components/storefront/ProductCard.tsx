"use client";

import React, { useState } from "react";
import { Zap, ShieldCheck, Check, Gift } from "lucide-react";
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
  };
  currency: "USDT" | "VND";
}

export function ProductCard({ product, currency }: ProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const inStock = product.stock > 0;

  return (
    <>
      <div className="group relative rounded-2xl bg-surface-card border border-border hover:border-primary/50 transition-all duration-300 p-5 flex flex-col justify-between hover:shadow-xl hover:shadow-primary/5">
        <div>
          {/* Top Badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-raised text-slate-300 border border-border">
              {product.category || "Subscription"}
            </span>

            {inStock ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                In Stock ({product.stock})
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white group-hover:text-primary-light transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description || "Instant digital access credentials delivered immediately upon payment."}
          </p>

          {/* Bonus Promo Pill */}
          {product.bonus && product.bonus > 0 ? (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-lg border border-warning/20">
              <Gift className="w-3.5 h-3.5" />
              <span>+{product.bonus} Bonus Unit(s) Included</span>
            </div>
          ) : null}
        </div>

        {/* Bottom Section: Price + CTA */}
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Instant Price
            </span>
            <span className="text-lg font-extrabold text-white">
              {currency === "VND"
                ? formatVnd(product.retailPriceVnd)
                : formatUsdt(product.retailPriceUsdt)}
            </span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            disabled={!inStock}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover disabled:bg-surface-raised disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Buy Now
          </button>
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
