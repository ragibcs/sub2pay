"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Hash,
} from "lucide-react";
import { formatUsdt, formatVnd } from "@/lib/utils";

interface CheckoutPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderNumber } = use(params);

  const [order, setOrder] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING");
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>("PENDING");
  const [deliveredItems, setDeliveredItems] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Manual Check & TxID states
  const [manualChecking, setManualChecking] = useState(false);
  const [manualTxOpen, setManualTxOpen] = useState(false);
  const [inputTxId, setInputTxId] = useState("");
  const [submittingTxId, setSubmittingTxId] = useState(false);
  const [txIdError, setTxIdError] = useState<string | null>(null);
  const [txIdSuccess, setTxIdSuccess] = useState<string | null>(null);

  const checkStatus = async (isManual = false) => {
    if (isManual) setManualChecking(true);
    try {
      const res = await fetch(`/api/public/orders/${orderNumber}/status`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Order not found");
        setLoading(false);
        return;
      }

      setOrder(data.order);
      setPaymentStatus(data.paymentStatus);
      setFulfillmentStatus(data.fulfillmentStatus);
      setMessage(data.message || "");

      if (data.deliveredItems && data.deliveredItems.length > 0) {
        setDeliveredItems(data.deliveredItems);
      }

      // Trigger celebratory confetti on delivery
      if (data.fulfillmentStatus === "DELIVERED") {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      console.error("Status polling error:", err);
    } finally {
      setLoading(false);
      if (isManual) setManualChecking(false);
    }
  };

  // Poll status every 3 seconds while pending
  useEffect(() => {
    let interval: NodeJS.Timeout;

    checkStatus();

    interval = setInterval(() => {
      if (fulfillmentStatus !== "DELIVERED" && paymentStatus !== "EXPIRED") {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderNumber, fulfillmentStatus, paymentStatus]);

  // Countdown timer
  useEffect(() => {
    if (!order?.paymentExpiresAt) return;

    const updateTimer = () => {
      const remaining = new Date(order.paymentExpiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft("Expired");
        setPaymentStatus("EXPIRED");
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [order?.paymentExpiresAt]);

  const copyToClipboard = (text: string, type: "address" | "amount" | "creds") => {
    navigator.clipboard.writeText(text);
    if (type === "address") {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else if (type === "creds") {
      setCopiedCredentials(true);
      setTimeout(() => setCopiedCredentials(false), 2000);
    }
  };

  const handleVerifyTxId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTxId.trim()) return;

    setSubmittingTxId(true);
    setTxIdError(null);
    setTxIdSuccess(null);

    try {
      const res = await fetch(`/api/public/orders/${orderNumber}/verify-txid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txId: inputTxId.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.verified) {
        throw new Error(data.error || "Transaction hash could not be confirmed yet.");
      }

      setTxIdSuccess("Transaction confirmed! Unlocking your credentials...");
      if (data.deliveredItems) {
        setDeliveredItems(data.deliveredItems);
      }
      setFulfillmentStatus("DELIVERED");
      setPaymentStatus("PAID");

      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      setTxIdError(err.message || "Verification failed");
    } finally {
      setSubmittingTxId(false);
    }
  };

  const downloadCredentials = () => {
    const content = `Sub2Pay Order: ${orderNumber}\nProduct: ${order?.productName}\nDelivered Items:\n${deliveredItems.join(
      "\n"
    )}\n\nDate: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sub2Pay_${orderNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Loading live checkout details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 rounded-2xl bg-surface-card border border-border text-center">
        <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">{error || "Could not retrieve order details."}</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-white"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const isDelivered = fulfillmentStatus === "DELIVERED";
  const isPaidPending = paymentStatus === "PAID" && !isDelivered;
  const isExpired = paymentStatus === "EXPIRED";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
        <div>
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
            Automated Crypto Checkout
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-0.5">{order.productName}</h1>
          <p className="text-xs text-slate-400">Order ID: #{orderNumber}</p>
        </div>

        <div className="flex items-center gap-2">
          {isDelivered ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 shadow-sm">
              <CheckCircle2 className="w-4 h-4" /> Paid &amp; Delivered
            </span>
          ) : isPaidPending ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 text-xs font-bold text-warning">
              <Loader2 className="w-4 h-4 animate-spin" /> Payment Confirmed (Fulfilling...)
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/10 border border-danger/20 text-xs font-bold text-danger">
              <AlertTriangle className="w-4 h-4" /> Payment Window Expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary-light">
              <Clock className="w-4 h-4 animate-pulse" /> Awaiting Transfer ({timeLeft})
            </span>
          )}
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div
          className={`p-2.5 rounded-xl border ${
            !isDelivered
              ? "bg-primary/10 border-primary text-white font-bold"
              : "bg-surface-card border-border text-slate-400"
          }`}
        >
          <span className="block text-[10px] text-slate-400">Step 1</span>
          1. Send Exact Crypto
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            !isDelivered
              ? "bg-warning/10 border-warning/30 text-warning font-bold animate-pulse-slow"
              : "bg-surface-card border-border text-slate-400"
          }`}
        >
          <span className="block text-[10px] text-slate-400">Step 2</span>
          2. Auto-Detect Blockchain
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            isDelivered
              ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold"
              : "bg-surface-card border-border text-slate-500"
          }`}
        >
          <span className="block text-[10px] text-slate-400">Step 3</span>
          3. Instant Delivery Reveal
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* State A: DELIVERED (Instant Credentials Reveal Box) */}
        {isDelivered && (
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-emerald-500/40 shadow-2xl space-y-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Payment Confirmed! Instant Delivery</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Your credentials have been generated and unlocked below. Please save them
                  immediately.
                </p>
              </div>
            </div>

            {/* Delivered Credentials Box */}
            <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Delivered Account Credentials / Key
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadCredentials}
                    className="p-1.5 rounded-lg bg-surface-card hover:bg-surface-raised text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                    title="Download as .txt file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download (.txt)
                  </button>
                  <button
                    onClick={() => copyToClipboard(deliveredItems.join("\n"), "creds")}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-primary/20 transition-all"
                  >
                    {copiedCredentials ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy All
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background border border-border font-mono text-sm text-emerald-300 whitespace-pre-wrap break-all select-all">
                {deliveredItems.map((item, idx) => (
                  <div key={idx} className="py-1 border-b border-border/40 last:border-b-0">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Warranty notice */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-surface-card border border-border text-xs text-slate-400 gap-3">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Receipt sent to your email. You can also retrieve these anytime via Order Lookup.
              </span>
              <Link
                href="/orders"
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                Go to Order Lookup <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* State B: PENDING PAYMENT (QR Code, Transfer Details & Auto-Verify) */}
        {!isDelivered && !isExpired && (
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-border shadow-xl space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-warning" />
                  Transfer Payment Instructions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send the exact crypto amount below. Our system matches deposits automatically on-chain.
                </p>
              </div>

              {/* Countdown badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface border border-border text-xs font-mono font-bold text-warning self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Expires: {timeLeft}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* QR Code column */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border border-slate-200">
                <QRCodeSVG
                  value={order.paymentAddress || ""}
                  size={165}
                  level="M"
                  includeMargin={false}
                />
                <span className="text-[11px] font-extrabold text-slate-800 mt-2.5 uppercase tracking-wider">
                  Network: BEP20 (BSC)
                </span>
              </div>

              {/* Details column */}
              <div className="md:col-span-2 space-y-4">
                {/* Exact Amount */}
                <div className="p-3.5 rounded-xl bg-surface border border-border">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Send EXACT Amount (including decimals):</span>
                    <button
                      onClick={() =>
                        copyToClipboard((order.exactPayAmount || order.totalAmount).toString(), "amount")
                      }
                      className="text-primary font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedAmount ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedAmount ? "Copied" : "Copy Amount"}
                    </button>
                  </div>
                  <div className="text-2xl font-black text-warning font-mono">
                    {order.exactPayAmount || order.totalAmount} USDT
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="p-3.5 rounded-xl bg-surface border border-border">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Deposit Address (BEP20 / BSC):</span>
                    <button
                      onClick={() => copyToClipboard(order.paymentAddress || "", "address")}
                      className="text-primary font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedAddress ? "Copied" : "Copy Address"}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-slate-200 break-all bg-surface-card p-2 rounded-lg border border-border/80 select-all">
                    {order.paymentAddress}
                  </div>
                </div>

                {/* Important notice */}
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Auto-Detection Rule:</strong> You must transfer exactly{" "}
                    <strong>{order.exactPayAmount} USDT</strong> via <strong>BEP20</strong> network.
                    The system will detect and fulfill the order automatically within 1–2 minutes.
                  </span>
                </div>
              </div>
            </div>

            {/* Live Auto-Verify Status Bar & Manual Check Button */}
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                <span>
                  Auto-scanning Binance blockchain for incoming transfer...{" "}
                  <span className="text-[11px] text-slate-500 font-mono">(Polls every 3s)</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => checkStatus(true)}
                disabled={manualChecking}
                className="px-3.5 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-card border border-border text-xs text-white font-semibold flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${manualChecking ? "animate-spin" : ""}`} />
                Check Payment Now
              </button>
            </div>

            {/* Manual TxID Verification Accordion */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setManualTxOpen(!manualTxOpen)}
                className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-accent" />
                  Transferred already? Paste your Transaction Hash (TxID) to verify immediately
                </span>
                {manualTxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {manualTxOpen && (
                <form
                  onSubmit={handleVerifyTxId}
                  className="mt-3 p-4 rounded-xl bg-surface border border-border space-y-3 animate-fade-in"
                >
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Enter Blockchain Transaction Hash (TxID):
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      required
                      value={inputTxId}
                      onChange={(e) => setInputTxId(e.target.value)}
                      placeholder="e.g. 0x1234567890abcdef..."
                      className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-xs font-mono text-white focus:outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={submittingTxId}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                    >
                      {submittingTxId ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                        </>
                      ) : (
                        "Verify TxID"
                      )}
                    </button>
                  </div>

                  {txIdError && (
                    <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger">
                      {txIdError}
                    </div>
                  )}

                  {txIdSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                      {txIdSuccess}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {/* State C: EXPIRED */}
        {isExpired && (
          <div className="p-8 rounded-2xl bg-surface-card border border-danger/30 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
            <h3 className="text-xl font-bold text-white">Payment Window Expired</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              This order has expired. If you have already transferred funds, please contact support
              or look up your order with your transaction hash.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-xs font-bold text-white"
            >
              Start New Order
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
