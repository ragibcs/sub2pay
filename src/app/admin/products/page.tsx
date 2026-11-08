"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Package,
  RefreshCw,
  Edit2,
  Check,
  X,
  Loader2,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
} from "lucide-react";
import { formatUsdt, formatVnd } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/public/products");
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/products/sync", { method: "POST" });
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      const nextActive = !product.isActive;
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;

    setUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image");
      }

      setEditingProduct((prev: any) => ({
        ...prev,
        customImage: data.url,
      }));
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingProduct.name,
          category: editingProduct.category,
          description: editingProduct.description,
          retailPriceUsdt: editingProduct.retailPriceUsdt,
          retailPriceVnd: editingProduct.retailPriceVnd,
          isFeatured: editingProduct.isFeatured,
          customImage: editingProduct.customImage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...editingProduct } : p))
        );
        setEditingProduct(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-primary" />
            Product Catalog &amp; Cover Images
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your subscription catalog, upload high-converting cover images, set wholesale
            markups, and toggle active status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync from Shop Bot API
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or categories..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} products listed</span>
      </div>

      {/* Products Table with Cover Thumbnails */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading product catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No products found. Click &quot;Sync from Shop Bot API&quot; to fetch inventory.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-border/80">
                  <th className="pb-3 font-semibold">Cover</th>
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Cost (Wholesale)</th>
                  <th className="pb-3 font-semibold">Retail Price</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="py-3">
                      {p.customImage ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border bg-surface shrink-0 group relative shadow-sm">
                          <img
                            src={p.customImage}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-surface-raised via-surface to-primary/20 border border-border/80 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isFeatured && (
                          <span className="p-0.5 rounded bg-warning/10 text-warning" title="Featured">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500">ID: #{p.id}</span>
                        {p.bonus > 0 && (
                          <span className="text-[10px] text-warning font-semibold">
                            +{p.bonus} bonus
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-[11px]">
                        {p.category || "Subscription"}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-400">
                      {p.costPriceUsdt?.toFixed(2)} USDT ({formatVnd(p.costPriceVnd)})
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-400">
                      {p.retailPriceUsdt?.toFixed(2)} USDT ({formatVnd(p.retailPriceVnd)})
                    </td>
                    <td className="py-3 font-mono">
                      <span
                        className={
                          p.stock > 0 ? "text-emerald-400 font-bold" : "text-danger font-semibold"
                        }
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-700/40 text-slate-400"
                        }`}
                      >
                        {p.isActive ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingProduct({ ...p });
                          setUploadError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white inline-flex items-center gap-1.5 font-bold text-[11px] shadow-sm shadow-primary/20 transition-all"
                      >
                        <Edit2 className="w-3 h-3" /> Edit / Cover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product & Cover Image Upload Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-accent">Edit Product</span>
                <h3 className="text-base font-bold text-white">#{editingProduct.id} — {editingProduct.name}</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Cover Image Upload Section */}
              <div className="p-4 rounded-xl bg-surface-card border border-border space-y-3">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Product Cover Image
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden border border-border bg-surface shrink-0 flex items-center justify-center shadow-inner group">
                    {editingProduct.customImage ? (
                      <>
                        <img
                          src={editingProduct.customImage}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({ ...editingProduct, customImage: null })
                          }
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 hover:bg-danger text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-3 text-slate-500">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px] block">No cover set</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="product-cover-upload"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="product-cover-upload"
                        className="cursor-pointer px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-primary/20 transition-all"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" /> Upload Image from PC
                          </>
                        )}
                      </label>

                      {editingProduct.customImage && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({ ...editingProduct, customImage: null })
                          }
                          className="px-3 py-2 rounded-xl bg-surface hover:bg-danger/10 border border-border text-xs text-slate-300 hover:text-danger font-medium transition-colors"
                        >
                          Clear Cover
                        </button>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">
                        Or paste external image URL:
                      </span>
                      <input
                        type="url"
                        value={editingProduct.customImage || ""}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, customImage: e.target.value })
                        }
                        placeholder="https://images.unsplash.com/... or CDN URL"
                        className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Featured Item
                  </label>
                  <select
                    value={editingProduct.isFeatured ? "true" : "false"}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        isFeatured: e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-semibold text-white focus:outline-none focus:border-primary"
                  >
                    <option value="false">Standard</option>
                    <option value="true">Featured (Pinned)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Retail Price USDT (Wholesale: {editingProduct.costPriceUsdt})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.retailPriceUsdt}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        retailPriceUsdt: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Retail Price VND (Wholesale: {editingProduct.costPriceVnd})
                  </label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={editingProduct.retailPriceVnd}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        retailPriceVnd: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-raised text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                  {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
