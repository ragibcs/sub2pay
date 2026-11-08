"use client";

import React, { useEffect, useState } from "react";
import {
  Server,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Edit2,
  Trash2,
  Coins,
  X,
  Zap,
} from "lucide-react";
import { formatUsdt, formatVnd } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  code: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  balanceUsdt: number;
  balanceVnd: number;
  isEnabled: boolean;
  isDefault: boolean;
  notes?: string;
  _count?: { products: number };
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string; success: boolean } | null>(
    null
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "",
    code: "",
    type: "SHOPBOT",
    baseUrl: "",
    apiKey: "",
    notes: "",
  });
  const [adding, setAdding] = useState(false);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/admin/vendors");
      const data = await res.json();
      if (data.success && data.vendors) {
        setVendors(data.vendors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleTestConnection = async (vendor: Vendor) => {
    setTestingId(vendor.id);
    setTestResult(null);

    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/test`, {
        method: "POST",
      });
      const data = await res.json();
      setTestResult({
        id: vendor.id,
        msg: data.message || (data.success ? "Connection successful" : "Failed"),
        success: data.success,
      });
      if (data.success) {
        fetchVendors();
      }
    } catch (err: any) {
      setTestResult({ id: vendor.id, msg: err.message, success: false });
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncVendor = async (vendor: Vendor) => {
    setSyncingId(vendor.id);
    setTestResult(null);

    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      setTestResult({
        id: vendor.id,
        msg: data.message || data.error,
        success: data.success,
      });
      if (data.success) {
        fetchVendors();
      }
    } catch (err: any) {
      setTestResult({ id: vendor.id, msg: err.message, success: false });
    } finally {
      setSyncingId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVendor),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create vendor");
      }

      setAddModalOpen(false);
      setNewVendor({
        name: "",
        code: "",
        type: "SHOPBOT",
        baseUrl: "",
        apiKey: "",
        notes: "",
      });
      fetchVendors();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchVendors();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Server className="w-7 h-7 text-accent" />
            Multi-Vendor API Support
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect and orchestrate multiple wholesale APIs, digital card suppliers, and internal
            card key pools.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Supplier / Vendor
        </button>
      </div>

      {/* Vendors Cards */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-base font-bold text-white">Active Wholesale Suppliers &amp; Pools</h3>
          <span className="text-xs text-slate-400">{vendors.length} Vendors Registered</span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
            <p className="text-sm">Loading multi-vendor configurations...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => {
              const isTesting = testingId === vendor.id;
              const isSyncing = syncingId === vendor.id;
              const thisTest = testResult?.id === vendor.id ? testResult : null;

              return (
                <div
                  key={vendor.id}
                  className="p-5 rounded-2xl bg-surface border border-border hover:border-border-light transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10 text-accent mt-0.5">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{vendor.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-raised border border-border text-slate-300">
                            Driver: {vendor.type}
                          </span>
                          {vendor.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary-light uppercase">
                              Primary Default
                            </span>
                          )}
                        </div>

                        {vendor.baseUrl && (
                          <div className="text-xs text-slate-400 font-mono mt-1">
                            Endpoint: {vendor.baseUrl}
                          </div>
                        )}

                        <div className="text-xs text-slate-400 mt-1">
                          {vendor._count?.products || 0} Products linked to this vendor
                          {vendor.notes ? ` • ${vendor.notes}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Balance & Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {vendor.balanceUsdt > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-surface-card border border-border text-right">
                          <span className="text-[10px] text-slate-500 uppercase block">Balance</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {vendor.balanceUsdt.toFixed(2)} USDT
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => handleTestConnection(vendor)}
                        disabled={isTesting}
                        className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-raised border border-border text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
                      >
                        {isTesting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Test API
                      </button>

                      {vendor.type === "SHOPBOT" && (
                        <button
                          onClick={() => handleSyncVendor(vendor)}
                          disabled={isSyncing}
                          className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-xs text-white flex items-center gap-1 font-bold shadow-sm shadow-accent/20"
                        >
                          {isSyncing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          Sync Catalog
                        </button>
                      )}

                      {!vendor.isDefault && (
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="p-1.5 rounded-lg bg-surface-card hover:bg-danger/10 border border-border text-slate-400 hover:text-danger"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {thisTest && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                        thisTest.success
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-danger/10 border-danger/20 text-danger"
                      }`}
                    >
                      {thisTest.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{thisTest.msg}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-white">Add New Supplier / Vendor API</h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  required
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Partner Wholesale API 2"
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unique Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newVendor.code}
                    onChange={(e) => setNewVendor({ ...newVendor, code: e.target.value })}
                    placeholder="e.g. vendor_partner_2"
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-mono text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    API Driver Type
                  </label>
                  <select
                    value={newVendor.type}
                    onChange={(e) => setNewVendor({ ...newVendor, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-semibold text-white focus:outline-none focus:border-accent"
                  >
                    <option value="SHOPBOT">Shop Bot Protocol (tunvnmmo compatible)</option>
                    <option value="GENERIC_API">Generic Webhook / REST</option>
                    <option value="LOCAL">Local Card Key Pool</option>
                  </select>
                </div>
              </div>

              {newVendor.type !== "LOCAL" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Base URL
                    </label>
                    <input
                      type="url"
                      value={newVendor.baseUrl}
                      onChange={(e) => setNewVendor({ ...newVendor, baseUrl: e.target.value })}
                      placeholder="https://api.partner.com"
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-mono text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      API Key / Token (Header <code>X-API-Key</code> or Bearer)
                    </label>
                    <input
                      type="text"
                      value={newVendor.apiKey}
                      onChange={(e) => setNewVendor({ ...newVendor, apiKey: e.target.value })}
                      placeholder="API Key"
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-mono text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                  placeholder="Optional internal notes"
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-raised text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-xs font-bold text-white flex items-center gap-1.5"
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
