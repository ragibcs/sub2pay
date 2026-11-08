"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Settings,
  Shield,
  Coins,
  ToggleLeft,
  ToggleRight,
  Edit2,
  X,
  Plus,
} from "lucide-react";

interface PaymentChannel {
  id: string;
  code: string;
  name: string;
  provider: string;
  description?: string;
  badge?: string;
  isEnabled: boolean;
  sortOrder: number;
  feeRate: number;
  configJson?: string;
}

export default function PaymentChannelsPage() {
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<PaymentChannel | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/admin/payment-channels");
      const data = await res.json();
      if (data.success && data.channels) {
        setChannels(data.channels);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleToggle = async (channel: PaymentChannel) => {
    setTogglingId(channel.id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/payment-channels/${channel.id}/toggle`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.success && data.channel) {
        setChannels((prev) =>
          prev.map((ch) => (ch.id === channel.id ? { ...ch, isEnabled: data.channel.isEnabled } : ch))
        );
        setMessage(
          `Payment method "${channel.name}" is now ${
            data.channel.isEnabled ? "TURNED ON" : "TURNED OFF"
          }`
        );
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/payment-channels/${editingChannel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingChannel.name,
          description: editingChannel.description,
          badge: editingChannel.badge,
          feeRate: editingChannel.feeRate,
          sortOrder: editingChannel.sortOrder,
        }),
      });

      const data = await res.json();
      if (data.success && data.channel) {
        setChannels((prev) =>
          prev.map((ch) => (ch.id === editingChannel.id ? { ...ch, ...data.channel } : ch))
        );
        setEditingChannel(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-primary" />
            Payment Methods &amp; Channels
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Turn ON or OFF payment methods for your storefront with a single toggle. Only enabled
            methods will appear to customers at checkout.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Payment Channels Cards / List */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-base font-bold text-white">Configured Payment Gateways</h3>
          <span className="text-xs text-slate-400">
            {channels.filter((c) => c.isEnabled).length} of {channels.length} Methods Active
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading payment methods...</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {channels.map((ch) => {
              const isToggling = togglingId === ch.id;
              return (
                <div
                  key={ch.id}
                  className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl mt-0.5 ${
                        ch.isEnabled
                          ? "bg-primary/10 text-primary-light border border-primary/20"
                          : "bg-surface-raised text-slate-500 border border-border"
                      }`}
                    >
                      {ch.code.includes("BINANCE") ? (
                        <Zap className="w-5 h-5 text-warning" />
                      ) : (
                        <Coins className="w-5 h-5 text-accent" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{ch.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-slate-400">
                          {ch.code}
                        </span>
                        {ch.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-raised text-slate-300 uppercase">
                            {ch.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 max-w-xl">{ch.description}</p>
                    </div>
                  </div>

                  {/* Right: Toggle Switch & Actions */}
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          ch.isEnabled ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {ch.isEnabled ? "Active" : "Disabled"}
                      </span>

                      {/* Clean Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(ch)}
                        disabled={isToggling}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          ch.isEnabled ? "bg-emerald-500" : "bg-slate-700"
                        }`}
                        title={ch.isEnabled ? "Click to Turn OFF" : "Click to Turn ON"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            ch.isEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={() => setEditingChannel({ ...ch })}
                      className="p-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-border text-slate-300 hover:text-white"
                      title="Edit method info"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Channel Modal */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-white">Configure {editingChannel.name}</h3>
              <button
                onClick={() => setEditingChannel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Badge Label
                </label>
                <input
                  type="text"
                  value={editingChannel.badge || ""}
                  onChange={(e) => setEditingChannel({ ...editingChannel, badge: e.target.value })}
                  placeholder="e.g. Instant Auto Detect, 0% Fee"
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingChannel.description || ""}
                  onChange={(e) =>
                    setEditingChannel({ ...editingChannel, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-raised text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white flex items-center gap-1.5"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
