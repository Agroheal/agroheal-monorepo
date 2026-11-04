import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  UserCheck,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { adminApiClient } from "@/lib/apiClient";
import type { PaymentLog } from "@/types/admin";

interface Props {
  transaction: PaymentLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onRefresh?: () => void;
}

export function ReassignPaymentDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
  onError,
  onRefresh,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [matchedMember, setMatchedMember] = useState<{
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    member_id: string | null;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const isAlreadySettled = [
    "paid",
    "success",
    "successful",
    "completed",
    "settled",
  ].includes((transaction?.status || "").toLowerCase());

  const [triggerSettlement, setTriggerSettlement] = useState(!isAlreadySettled);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setMatchedMember(null);
      setSearchError(null);
      setSubmitting(false);
    } else {
      setTriggerSettlement(!isAlreadySettled);
    }
  }, [open, isAlreadySettled]);

  if (!transaction) return null;

  const handleSearchMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Please enter an email, member ID, or phone number.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setMatchedMember(null);

    try {
      const cleanQ = query.toUpperCase();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, member_id")
        .or(
          `email.ilike.%${query}%,member_id.ilike.%${cleanQ}%,phone.ilike.%${query}%,referral_code.ilike.%${cleanQ}%`
        )
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setSearchError("No member found matching that search query.");
      } else {
        setMatchedMember(data);
      }
    } catch (err: any) {
      setSearchError(err.message || "Failed to search member.");
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!matchedMember) return;
    setSubmitting(true);

    try {
      await adminApiClient.transactions.reassignPayment({
        transactionId: transaction.id,
        targetUserId: matchedMember.id,
        triggerSettlement,
      });

      onSuccess(
        `Payment #${transaction.id} successfully reassigned to ${matchedMember.full_name} (${matchedMember.email})!`
      );
      onRefresh?.();
      onOpenChange(false);
    } catch (err: any) {
      onError(err.message || "Failed to reassign payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-bold text-foreground">
              Reassign Transaction to Member
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Attach this transaction to the correct member profile and optionally trigger statutory Green Card / Farm Slot provisioning.
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Summary Card */}
        <div className="p-3.5 rounded-xl border border-border bg-muted/30 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tx ID / Ref:</span>
            <span className="font-bold text-foreground">
              #{transaction.id} • {transaction.reference || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original Email:</span>
            <span className="text-foreground">{transaction.user_email || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount &amp; Category:</span>
            <span className="font-bold text-emerald-400">
              ₦{Number(transaction.amount).toLocaleString()} • {transaction.project_category}
            </span>
          </div>
        </div>

        {/* Member Search Form */}
        <form onSubmit={handleSearchMember} className="space-y-3">
          <Label className="text-xs font-bold">
            Search Target Member (Email, Member ID, or Phone)
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. GC-2026-00010 or member@gmail.com"
                className="text-xs pr-8 h-9"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <Button type="submit" size="sm" disabled={searching} className="h-9 text-xs">
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
            </Button>
          </div>
          {searchError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </form>

        {/* Matched Member Card */}
        {matchedMember && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Target Member Confirmed
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                {matchedMember.member_id || "NO MEMBER ID"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">NAME</span>
                <span className="font-semibold text-foreground">{matchedMember.full_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">EMAIL</span>
                <span className="font-mono text-foreground">{matchedMember.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Options */}
        {matchedMember && (
          <div className="p-3 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold block">
                  Trigger Automatic Statutory Settlement
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Provisions Green Card, Farm Slots, and Core Driver / Sponsor referral bonuses.
                </span>
              </div>
              <Switch
                checked={triggerSettlement}
                onCheckedChange={setTriggerSettlement}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!matchedMember || submitting}
            onClick={handleConfirmReassign}
            className="text-xs gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reassigning...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Confirm Reassignment</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReassignPaymentDialog;

