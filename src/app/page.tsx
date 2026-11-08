"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/storefront/Hero";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Search, Sparkles, Cpu, ArrowRight, Loader2 } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [currency, setCurrency] = useState<"USDT" | "VND">("USDT");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/public/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const saved = localStorage.getItem("subxpress_currency");
    if (saved === "VND" || saved === "USDT") setCurrency(saved);

    const handleCurrencyChange = () => {
      const current = localStorage.getItem("subxpress_currency");
      if (current === "VND" || current === "USDT") setCurrency(current);
    };

    window.addEventListener("currencyChange", handleCurrencyChange);
    return () => window.removeEventListener("currencyChange", handleCurrencyChange);
  }, []);

  const categories = [
    "ALL",
    ...Array.from(new Set(products.map((p) => p.category || "Subscription"))),
  ];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === "ALL" || (p.category || "Subscription") === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <Hero />

      {/* Product Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Available Subscriptions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any subscription to purchase with instant Binance auto-payment verification.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Netflix, GPT, Spotify..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-card border border-border text-slate-400 hover:text-white hover:border-slate-600"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading available subscriptions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-surface-card border border-border p-8">
            <p className="text-slate-400 text-sm">No subscriptions found matching your query.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("ALL");
              }}
              className="mt-3 text-xs text-primary font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((prod) => (
              <ProductCard key={prod.id} product={prod} currency={currency} />
            ))}
          </div>
        )}

        {/* Muse AI Buff Token Promo Banner */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-surface-raised via-surface-card to-surface-raised border border-border hover:border-accent/40 transition-all p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent">
              <Cpu className="w-3.5 h-3.5" />
              <span>Specialized AI Service</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Need Muse AI Token Top-up?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Supply your Muse AI invite codes and top up billions of tokens directly via automated
              wallet balance. Auto-completed within 1-2 minutes.
            </p>
          </div>

          <Link
            href="/buff-muse"
            className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg shadow-accent/20 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            Open Token Calculator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
