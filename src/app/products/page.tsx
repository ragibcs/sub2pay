"use client";

import React, { useEffect, useState } from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Search, Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [currency, setCurrency] = useState<"USDT" | "VND">("USDT");

  useEffect(() => {
    fetch("/api/public/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .finally(() => setLoading(false));

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Subscription Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse our full catalog with live stock status and instant Binance payment verification.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all subscriptions..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
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

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface-card border border-border p-8">
          <p className="text-slate-400 text-sm">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((prod) => (
            <ProductCard key={prod.id} product={prod} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
