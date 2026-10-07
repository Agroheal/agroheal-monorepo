import { useState } from "react";
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
import { ArrowLeftRight, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
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
  const [targetPurpose, setTargetPurpose] = useState<"STARTER_PACK" | "FARM_SLOT">("STARTER_PACK");
  const [reason, setReason] = useState(
    "Customer intended Mushroom Power Starter Pack activation; payment misallocated to Farm Slot"
  );
  const [loading, setLoading] = useState(false);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      onError("Please provide a reason for the audit trail.");
      return;
    }

    setLoading(true);
    try {
      // Extract numeric transaction id if reference is in format SP_563_... or TX-563 or 563
      let cleanTxId = transaction.id;
      const match = (transaction.reference || transaction.id).match(/(\d+)/);
      if (match) cleanTxId = match[1];

      // Call API server or direct database remediation
      const apiUrl = import.meta.env.VITE_API_URL || "https://api.agroheal.solutions";
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      let apiSuccess = false;
      if (token) {
        try {
          const resp = await fetch(`${apiUrl}/api/v1/admin/transactions/${cleanTxId}/remediate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              targetPurpose,
              reason: reason.trim(),
            }),
          });
          if (resp.ok) {
            apiSuccess = true;
          }
        } catch {
          // Fallback to Supabase direct remediation if server endpoint is on different host
        }
      }

      if (!apiSuccess) {
        // Direct Supabase fallback
        // 1. Fetch transaction record
        const { data: tx } = await supabase
          .from("transactions")
          .select("id, user_id, amount, status, project_category")
          .eq("id", cleanTxId)
          .maybeSingle();

        const userId = tx?.user_id || transaction.user_id;

        if (userId) {
          // 2. Mark profile starter pack active
          await supabase
            .from("profiles")
            .update({
              has_purchased_starter_pack: true,
              is_wealth_creation_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          // 3. Create or update orders row
          await supabase.from("orders").insert({
            user_id: userId,
            transaction_id: cleanTxId,
            product_id: "11111111-1111-1111-1111-111111111101",
            product_code: "SP-MUSH-100G",
            quantity: 1,
            unit_price: 5000,
            total_price: 5000,
            pv_earned: 5000,
            status: "PAID",
            notes: `Admin Remediated from Tx #${cleanTxId}: ${reason}`,
          });

          // 4. Update transaction
          await supabase
            .from("transactions")
            .update({
              project_category: "Mushroom Power 100g",
              notes: `[Remediated to Starter Pack: ${reason}]`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", cleanTxId);

          // 5. Remove accidental slot subscription
          const { data: slots } = await supabase
            .from("slot_subscriptions")
            .select("id, slots")
            .eq("user_id", userId)
            .ilike("project_category", "%Mushroom%")
            .maybeSingle();

          if (slots) {
            if (slots.slots <= 1) {
              await supabase.from("slot_subscriptions").delete().eq("id", slots.id);
            } else {
              await supabase
                .from("slot_subscriptions")
                .update({ slots: slots.slots - 1, updated_at: new Date().toISOString() })
                .eq("id", slots.id);
            }
          }
        }
      }

      onSuccess(
        `Transaction #${cleanTxId} converted to Mushroom Power 100g Starter Pack! Product order created and wealth creation active.`
      );
      onRefresh();
      onOpenChange(false);
    } catch (err: any) {
      onError(err.message || "Failed to remediate transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold">Remediate Payment Purpose</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Correct misallocated member payments (e.g., website checkout created a Farm Slot instead of a
            Mushroom Power Starter Pack).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Transaction Summary Card */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference / ID:</span>
              <span className="font-mono font-medium text-foreground">
                {transaction.reference || transaction.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Email:</span>
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {transaction.user_email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-mono font-bold text-foreground">
                ₦{transaction.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Allocation:</span>
              <span className="font-medium text-amber-500">
                {transaction.project_category} ({transaction.slots} slot{transaction.slots !== 1 ? "s" : ""})
              </span>
            </div>
          </div>

          {/* Remediation Choice */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Remediate To:</Label>
            <div className="grid grid-cols-1 gap-2">
              <div
                className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                  targetPurpose === "STARTER_PACK"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:bg-muted/30"
                }`}
                onClick={() => setTargetPurpose("STARTER_PACK")}
              >
                <input
                  type="radio"
                  name="targetPurpose"
                  id="purpose-sp"
                  checked={targetPurpose === "STARTER_PACK"}
                  onChange={() => setTargetPurpose("STARTER_PACK")}
                  className="mt-0.5 h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <div>
                  <Label htmlFor="purpose-sp" className="text-xs font-semibold cursor-pointer">
                    📦 Mushroom Power 100g Starter Pack
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Creates compulsory product order, activates member's wealth creation status, adds them to
                    the 5x7 matrix, and removes the accidental farm slot.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Reason Input */}
          <div className="space-y-1.5">
            <Label htmlFor="audit-reason" className="text-xs font-semibold text-foreground">
              Audit Justification / Note <span className="text-destructive">*</span>
            </Label>
            <Input
              id="audit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Member intended to purchase Mushroom Power pack..."
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
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Execute Remediation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
