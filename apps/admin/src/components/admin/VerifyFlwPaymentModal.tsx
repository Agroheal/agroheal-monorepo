import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApiClient } from "@/lib/apiClient";
import { formatWATDateTime } from "@/lib/dateTimeFormat";

interface VerifyFlwPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialReference?: string;
  onForceSettle?: (tx: any) => void;
}

export function VerifyFlwPaymentModal({
  open,
  onOpenChange,
  initialReference = "",
  onForceSettle,
}: VerifyFlwPaymentModalProps) {
  const [reference, setReference] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    gateway: {
      verified: boolean;
      status: "paid" | "failed" | "pending";
      amount?: number;
      gatewayRef?: string;
      provider: "flutterwave";
      customerEmail?: string;
      raw?: any;
    };
    localMatch?: {
      transaction?: any;
      order?: any;
      slotSubscription?: any;
    };
  } | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialReference) {
      setReference(initialReference);
      if (open) {
        handleVerify(initialReference);
      }
    } else if (!open) {
      setResult(null);
      setError(null);
      setShowRawJson(false);
    }
  }, [initialReference, open]);

  const handleVerify = async (refToQuery?: string) => {
    const targetRef = (refToQuery || reference).trim();
    if (!targetRef) {
      setError("Please enter a Flutterwave reference or transaction ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await adminApiClient.admin.verifyFlwPayment(targetRef);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to query Flutterwave. Verify network and credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const gateway = result?.gateway;
  const rawData = gateway?.raw?.data || gateway?.raw;
  const isPaid = gateway?.status === "paid";
  const isFailed = gateway?.status === "failed";

  const localTx = result?.localMatch?.transaction;
  const localOrder = result?.localMatch?.order;
  const localSlot = result?.localMatch?.slotSubscription;
  const hasLocalMatch = Boolean(localTx || localOrder || localSlot);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Verify Flutterwave Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Query Flutterwave API directly by Transaction Reference (tx_ref) or Gateway ID.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Input Box */}
        <div className="space-y-3 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. FLW-1728479201938 or 8920192 or GC-2026-..."
                className="pl-9 pr-3 text-xs font-mono h-9"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !reference.trim()}
              size="sm"
              className="h-9 px-4 text-xs font-semibold gap-1.5 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Status</span>
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Verification Error</span>
                <p className="text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Verification Results Display */}
          {gateway && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              {/* Primary Status Card */}
              <div
                className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isPaid
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100"
                    : isFailed
                    ? "bg-destructive/10 border-destructive/40 text-destructive"
                    : "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPaid
                        ? "bg-emerald-500 text-white"
                        : isFailed
                        ? "bg-destructive text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm uppercase tracking-wide">
                        {isPaid ? "Paid / Successful" : isFailed ? "Payment Failed" : "Pending Gateway Status"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isPaid
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : isFailed
                            ? "bg-destructive/20 text-destructive border-destructive/30"
                            : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {gateway.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isPaid
                        ? "Transaction confirmed authoritatively by Flutterwave API."
                        : isFailed
                        ? "Transaction was declined or cancelled by cardholder/bank."
                        : "Flutterwave has not marked this transaction successful yet."}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    Verified Amount
                  </div>
                  <div className="text-xl font-mono font-black text-foreground">
                    ₦{(gateway.amount ?? rawData?.amount ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {rawData?.currency || "NGN"}
                  </div>
                </div>
              </div>

              {/* Gateway Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wider flex items-center justify-between">
                    <span>Payment Information</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(gateway.gatewayRef || reference)}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[10px]"
                      title="Copy reference"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy Ref"}</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">FLW Trans ID:</span>
                      <span className="font-bold text-foreground">{rawData?.id || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">tx_ref:</span>
                      <span className="font-bold text-foreground truncate max-w-[170px]" title={rawData?.tx_ref}>
                        {rawData?.tx_ref || reference}
                      </span>
                    </div>
                    {rawData?.flw_ref && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">flw_ref:</span>
                        <span className="font-bold text-foreground truncate max-w-[170px]" title={rawData?.flw_ref}>
                          {rawData?.flw_ref}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Type:</span>
                      <span className="capitalize text-foreground font-semibold">
                        {rawData?.payment_type || "Card / Online"}
                      </span>
                    </div>
                    {rawData?.created_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date (WAT):</span>
                        <span className="text-foreground">
                          {formatWATDateTime(rawData.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card space-y-2">
                  <div className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                    Customer &amp; Gateway Feedback
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Email:</span>
                      <span className="font-semibold text-foreground truncate max-w-[170px]" title={gateway.customerEmail || rawData?.customer?.email}>
                        {gateway.customerEmail || rawData?.customer?.email || "N/A"}
                      </span>
                    </div>
                    {rawData?.customer?.name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer Name:</span>
                        <span className="font-semibold text-foreground truncate max-w-[170px]" title={rawData.customer.name}>
                          {rawData.customer.name}
                        </span>
                      </div>
                    )}
                    {rawData?.customer?.phone_number && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground font-mono">
                          {rawData.customer.phone_number}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processor Response:</span>
                      <span className="font-bold text-foreground">
                        {rawData?.processor_response || "Approved"}
                      </span>
                    </div>
                    {rawData?.narration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Narration:</span>
                        <span className="text-foreground truncate max-w-[170px]" title={rawData.narration}>
                          {rawData.narration}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Local Database Sync Card */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Database className="w-3.5 h-3.5 text-primary" />
                    <span>Platform Database Sync Status</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      hasLocalMatch
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {hasLocalMatch ? "Record Matched" : "Unlinked in DB"}
                  </span>
                </div>

                {hasLocalMatch ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    {localTx && (
                      <div className="p-2 rounded-lg bg-card border border-border space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-sans block">
                          Transaction Record
                        </span>
                        <div className="font-bold text-foreground truncate">₦{Number(localTx.amount).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-400 capitalize">{localTx.status}</div>
                      </div>
                    )}
                    {localOrder && (
                      <div className="p-2 rounded-lg bg-card border border-border space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-sans block">
                          Store Order
                        </span>
                        <div className="font-bold text-foreground truncate">₦{Number(localOrder.total_price).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-400 capitalize">{localOrder.status}</div>
                      </div>
                    )}
                    {localSlot && (
                      <div className="p-2 rounded-lg bg-card border border-border space-y-0.5">
                        <span className="text-[10px] text-muted-foreground font-sans block">
                          Farm Slot Sub
                        </span>
                        <div className="font-bold text-foreground truncate">₦{Number(localSlot.amount).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-400 capitalize">{localSlot.status}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    No corresponding record found in platform transactions, store orders, or slot subscriptions matching this reference. If this payment succeeded on Flutterwave, you can manually remediate or credit the member.
                  </p>
                )}
              </div>

              {/* 1-Click Force Settle & Allot Action */}
              {isPaid && onForceSettle && (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-0.5 text-left">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                      Ready for Statutory Allotment
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Authoritatively confirmed payment on Flutterwave. Launch allotment preview to credit Green Card, Starter Pack, Farm Slots, or bonuses.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onForceSettle(
                        localTx || {
                          id: String(localTx?.id || gateway.gatewayRef || reference),
                          reference: gateway.gatewayRef || reference,
                          amount: Number(gateway.amount || rawData?.amount || 0),
                          user_email: gateway.customerEmail || rawData?.customer?.email || "",
                          status: "pending",
                          project_category: "Farm Slots",
                          created_at: rawData?.created_at || new Date().toISOString(),
                        }
                      );
                    }}
                    className="w-full sm:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    Force Settle &amp; Allot Now
                  </Button>
                </div>
              )}

              {/* Raw JSON Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRawJson((prev) => !prev)}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showRawJson ? "Hide Raw Gateway Response" : "Inspect Raw Gateway Payload"}</span>
                </button>

                {showRawJson && (
                  <div className="mt-2 p-3 rounded-xl border border-border bg-slate-950 text-slate-100 font-mono text-[10px] max-h-48 overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(gateway.raw || gateway, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
