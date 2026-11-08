"use client";

import React, { useEffect, useState } from "react";
import { Key, Plus, Trash2, CheckCircle2, Clock, Loader2, X, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CardKeyItem {
  id: string;
  cardContent: string;
  status: string;
  orderId?: string | null;
  createdAt: string;
  soldAt?: string | null;
  product?: { name: string; category: string };
}

export default function AdminCardKeysPage() {
  const [keys, setKeys] = useState<CardKeyItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, available: 0, sold: 0 });

  const [importOpen, setImportOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  const fetchKeys = async () => {
    try {
      const [keysRes, prodsRes] = await Promise.all([
        fetch("/api/admin/card-keys"),
        fetch("/api/public/products"),
      ]);
      const keysData = await keysRes.json();
      const prodsData = await prodsRes.json();

      if (keysData.success) {
        setKeys(keysData.cardKeys || []);
        if (keysData.stats) setStats(keysData.stats);
      }
      if (prodsData.products) {
        setProducts(prodsData.products);
        if (prodsData.products.length > 0 && !selectedProductId) {
          setSelectedProductId(prodsData.products[0].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !importText.trim()) return;

    setImporting(true);
    try {
      const res = await fetch("/api/admin/card-keys/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          keysText: importText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import keys");
      }

      setImportOpen(false);
      setImportText("");
      fetchKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Key className="w-7 h-7 text-warning" />
            Card Key Stock Pools
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage local inventory of licenses, activation codes, and manual account credentials.
          </p>
        </div>

        <button
          onClick={() => setImportOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Bulk Import Card Keys
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface-card border border-border">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Card Keys
          </span>
          <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Available in Stock
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {stats.available}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Delivered &amp; Sold
          </span>
          <span className="text-2xl font-black text-slate-400 mt-1 block">{stats.sold}</span>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h3 className="text-base font-bold text-white">Recent Key Inventory</h3>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading card keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No local card keys imported yet. Click &quot;Bulk Import Card Keys&quot; to add stock.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-border/80">
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Card / Account Key</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Created</th>
                  <th className="pb-3 font-semibold">Sold At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-surface-raised/40">
                    <td className="py-3 font-bold text-white">{k.product?.name || `#${k.id}`}</td>
                    <td className="py-3 font-mono text-slate-300 max-w-xs truncate select-all">
                      {k.cardContent}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          k.status === "AVAILABLE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-700/50 text-slate-400"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(k.createdAt)}</td>
                    <td className="py-3 text-slate-500">{k.soldAt ? formatDate(k.soldAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-white">Bulk Import Card Keys</h3>
              <button
                onClick={() => setImportOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-semibold text-white focus:outline-none focus:border-primary"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id.toString()}>
                      {p.name} (Current stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Card Keys / Accounts (One per line)
                </label>
                <textarea
                  rows={8}
                  required
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="key-xxxx-xxxx-xxxx&#10;user1@email.com | pass123&#10;user2@email.com | pass456"
                  className="w-full p-3 rounded-xl bg-surface-card border border-border text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-raised text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white flex items-center gap-1.5"
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Import Keys"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
