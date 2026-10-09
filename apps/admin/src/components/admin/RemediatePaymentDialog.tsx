import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  CheckCircle2,
  Loader2,
  CreditCard,
  Package,
  Sprout,
  Users,
  Award,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import { adminApiClient } from "@/lib/apiClient";
import type { PaymentLog } from "@/types/admin";

interface Props {
  transaction: PaymentLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onRefresh: () => void;
}

export function RemediatePaymentDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
  onError,
  onRefresh,
}: Props) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [notes, setNotes] = useState(
    "Confirmed valid payment via Flutterwave / Bank statement; manually force settled and allotted."
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && transaction?.id) {
      setPreviewData(null);
      setPreviewError(null);
      setLoadingPreview(true);

      // Extract transaction ID
      const cleanTxId = transaction.id;

      adminApiClient.transactions
        .getAllotmentPreview(cleanTxId)
        .then((res) => {
          setPreviewData(res);
        })
        .catch((err) => {
          console.error("[AllotmentPreview] Failed to compute preview:", err);
          setPreviewError(err.message || "Failed to calculate allotment preview");
        })
        .finally(() => {
          setLoadingPreview(false);
        });
    }
  }, [open, transaction]);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      onError("Please provide an audit note describing the reason for force settlement.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanTxId = transaction.id;
      const res = await adminApiClient.transactions.forceSettle(cleanTxId, notes.trim());

      onSuccess(res.message || `Transaction #${cleanTxId} force settled and all statutory benefits provisioned!`);
      onRefresh();
      onOpenChange(false);
    } catch (err: any) {
      onError(err.message || "Failed to force settle transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  const plan = previewData?.allotment;
  const member = previewData?.member;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Force Settle &amp; Allotment Preview
              </DialogTitle>
              <DialogDescription className="text-xs">
                Double-check statutory asset allocations before committing to database &amp; financial ledger.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingPreview ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Computing statutory allotments preview...</span>
          </div>
        ) : previewError ? (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Could not compute allotment preview</span>
            </div>
            <p>{previewError}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Transaction & Member Overview */}
            <div className="p-3 rounded-xl border border-border bg-muted/40 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                  Transaction
                </span>
                <span className="font-bold text-foreground block">
                  #{transaction.id} — ₦{Number(transaction.amount).toLocaleString()}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground truncate block">
                  {transaction.reference || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                  Member
                </span>
                <span className="font-bold text-foreground block">
                  {member?.fullName || transaction.user_email || "Member"}
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  {member?.email || transaction.user_email}
                </span>
                {member?.sponsorName && (
                  <span className="text-[10px] text-primary block mt-0.5">
                    Sponsor: {member.sponsorName}
                  </span>
                )}
              </div>
            </div>

            {/* Itemized Allotment Checklist */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Statutory Allotment Checklist (Double Confirmation)
              </span>

              <div className="space-y-2 text-xs">
                {/* 1. Green Card */}
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">
                        Green Card Membership
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {plan?.greenCard?.plan || "Annual Membership Pass"}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      plan?.greenCard?.action === "ACTIVATE"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {plan?.greenCard?.action === "ACTIVATE" ? "Will Activate" : "Already Active"}
                  </span>
                </div>

                {/* 2. Wealth Creation / Starter Pack */}
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">
                        Wealth Creation (Starter Pack)
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {plan?.wealthCreation?.productName || "Mushroom Power 100g (SP-MUSH-100G)"} — 5,000 PV
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      plan?.wealthCreation?.action === "ACTIVATE"
                        ? "bg-primary/10 text-primary border-primary/25"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {plan?.wealthCreation?.action === "ACTIVATE" ? "Will Order & Activate" : "Already Active"}
                  </span>
                </div>

                {/* 3. Farm Slots */}
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">
                        Practical Farm Slots
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {plan?.farmSlots?.count || 0} Slot(s) in {plan?.farmSlots?.farmGroup || "Mushroom Village"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-foreground">
                    ₦{(plan?.farmSlots?.totalSlotValue || 0).toLocaleString()}
                  </span>
                </div>

                {/* 4. Sponsor Commission */}
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">
                        Direct Sponsor Referral Bonus
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {member?.sponsorName ? `Credited to ${member.sponsorName}` : "No Sponsor Linked"} ({plan?.sponsorCommission?.bonusCategory || "NONE"})
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-emerald-500">
                    +₦{(plan?.sponsorCommission?.amount || 0).toLocaleString()}
                  </span>
                </div>

                {/* 5. Core Drivers Pool */}
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">
                        Core Driver Growth Pool
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        7 Core Drivers credited ₦{plan?.coreDriversBonus?.amountPerDriver || 0} each
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-indigo-400">
                    ₦{(plan?.coreDriversBonus?.totalPool || 0).toLocaleString()} pool
                  </span>
                </div>

                {/* 6. Matrix Placement */}
                <div className="p-2.5 rounded-xl border border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GitBranch className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">
                        Universal FIFO Matrix
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Placement queue in 3×2 Spillover Matrix
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/25 uppercase">
                    Queue Enqueued
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Trail Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="audit-notes" className="text-xs font-semibold">
                Admin Audit Notes <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="audit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Confirmed payment on Flutterwave statement; manual force settlement"
                className="text-xs h-9"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Settling &amp; Allotting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Allot Everything</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
