import { useState, useEffect } from "react";
import {
  Gift,
  HandCoins,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MemberCombobox } from "@/components/admin/MemberCombobox";
import { GreenCardBadge } from "@/components/admin/MemberBadges";
import { adminApiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/admin";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  initialMember: Member | null;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
  onComplete?: () => void;
}

export function IssueCorporateProvisionDialog({
  open,
  onOpenChange,
  members,
  initialMember,
  onSuccess,
  onError,
  onComplete,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [provisionType, setProvisionType] = useState<"promo_gift" | "corporate_advance">("promo_gift");
  const [amount, setAmount] = useState<number>(15000);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedId(initialMember?.id || "");
      setProvisionType("promo_gift");
      setAmount(15000);
      setNotes("");
      setErrorMsg(null);
      setSubmitting(false);
    }
  }, [open, initialMember]);

  const selected = members.find((m) => m.id === selectedId) || (initialMember?.id === selectedId ? initialMember : null);

  const handleSubmit = async () => {
    if (!selected) {
      setErrorMsg("Please select a member to proceed.");
      return;
    }

    if (!amount || amount <= 0) {
      setErrorMsg("Please enter a valid provision amount (minimum ₦1,000).");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (provisionType === "corporate_advance") {
        await adminApiClient.members.issueAdvance({
          userId: selected.id,
          amount,
          notes: notes.trim() || undefined,
        });
        onSuccess?.(
          `Corporate Advance of ₦${amount.toLocaleString()} successfully issued to ${selected.full_name} (${selected.member_id || selected.email}). Debt balance and deliverables recorded.`
        );
      } else {
        await adminApiClient.members.issueGift({
          userId: selected.id,
          amount,
          notes: notes.trim() || undefined,
        });
        onSuccess?.(
          `Corporate Promotional Gift of ₦${amount.toLocaleString()} successfully provisioned for ${selected.full_name} (${selected.member_id || selected.email}). Deliverables and upline commissions credited.`
        );
      }

      onComplete?.();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.message || "Failed to process administrative provision";
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border sm:rounded-2xl">
        <DialogHeader className="p-5 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Administrative Provision & Grants
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Issue a recoverable Corporate Advance (loan) or an Executive Promotional Gift.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Member Picker / Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Target Member
            </label>
            {initialMember ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initialMember.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {initialMember.full_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {initialMember.email} &middot; {initialMember.phone || "No phone"}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <GreenCardBadge active={initialMember.has_green_card} />
                  {initialMember.member_id && (
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {initialMember.member_id}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <MemberCombobox
                members={members}
                value={selectedId}
                onChange={setSelectedId}
                placeholder="Search by name, email, or member ID..."
              />
            )}
          </div>

          {selected && (
            <>
              {/* Provision Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Provision Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProvisionType("promo_gift")}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                      provisionType === "promo_gift"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "border-border bg-card/60 hover:bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      Promotional Gift
                    </div>
                    <span className="text-[11px] text-emerald-400/90 font-medium mt-1">
                      ₦0 Debt &middot; Executive Comp
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      Honorary grant funded by company. Upline commissions credited immediately.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProvisionType("corporate_advance")}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                      provisionType === "corporate_advance"
                        ? "border-purple-500 bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/50"
                        : "border-border bg-card/60 hover:bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <HandCoins className="h-4 w-4 text-purple-400" />
                      Corporate Advance
                    </div>
                    <span className="text-[11px] text-purple-400 font-medium mt-1">
                      Loan on Credit &middot; 100% Sweep
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      Recoverable debt balance. Upline bonuses held in pending until recovery.
                    </span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Valuation / Provision Amount (₦)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAmount(12000)}
                      className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ₦12,000 Combo
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount(15000)}
                      className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ₦15,000 Standard
                    </button>
                  </div>
                </div>
                <Input
                  type="number"
                  min="1000"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="h-9 text-sm font-semibold"
                />
              </div>

              {/* Notes / Authorization Ref */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Administrative Notes / Board Authorization
                </label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    provisionType === "promo_gift"
                      ? "e.g. Executive promotional grant authorized for Project Consultant / Core Driver"
                      : "e.g. Authorized starter credit advance with 100% future earnings sweep"
                  }
                  className="text-xs resize-none"
                />
              </div>

              {/* Deliverables Breakdown Banner */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Statutory Deliverables Provisioned Automatically:
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
                  <li>
                    <strong className="text-foreground">Green Card Subscription:</strong> 10-year active status with unique AGC ID.
                  </li>
                  <li>
                    <strong className="text-foreground">Community Farm Slot:</strong> 1 slot allocated in Mushroom Village.
                  </li>
                  <li>
                    <strong className="text-foreground">Starter Pack Order:</strong> SP-MUSH-100G (Mushroom Power 100g) order created.
                  </li>
                  <li>
                    <strong className="text-foreground">5×7 Matrix Placement:</strong> Placed under team sponsor / fair rotational tree.
                  </li>
                  <li>
                    <strong className="text-foreground">Double-Entry Financial Ledger:</strong> Sponsor (₦1,000 ref + ₦500 slot) and Core Driver Pool (₦50/₦25/₦100) credited (
                    {provisionType === "promo_gift" ? (
                      <span className="text-emerald-400 font-semibold">AVAILABLE immediately</span>
                    ) : (
                      <span className="text-purple-400 font-semibold">PENDING until debt recovery</span>
                    )}
                    ).
                  </li>
                </ul>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/10 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selected || submitting}
            onClick={handleSubmit}
            className={cn(
              "text-xs font-semibold gap-1.5",
              provisionType === "promo_gift"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing Provision...
              </>
            ) : provisionType === "promo_gift" ? (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Issue Promotional Gift (₦0 Debt)
              </>
            ) : (
              <>
                <HandCoins className="h-3.5 w-3.5" /> Issue Corporate Advance (Loan)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
