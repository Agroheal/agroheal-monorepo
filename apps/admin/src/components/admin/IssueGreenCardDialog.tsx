import { useState } from "react";
import { IdCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemberCombobox } from "@/components/admin/MemberCombobox";
import { GreenCardBadge } from "@/components/admin/MemberBadges";
import { ReceiptUploadField } from "@/components/admin/ReceiptUploadField";
import { uploadPaymentReceipt } from "@/lib/receiptUpload";
import { isLegacyMember, getGreenCardFee } from "@/lib/pricing";
import type { Member } from "@/types/admin";

export interface GreenCardOfflinePayload {
  transactionRef?: string;
  paymentDate?: string;
  receiptUrl?: string;
  notes?: string;
  amount?: number;
  isLegacy?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  activatingMemberId: string | null;
  onConfirm: (member: Member, details?: GreenCardOfflinePayload) => void;
}

export function IssueGreenCardDialog({ open, onOpenChange, members, activatingMemberId, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selected = members.find((m) => m.id === selectedId);
  const isLegacy = selected ? isLegacyMember(selected.created_at) : false;
  const offlineFee = selected ? getGreenCardFee(selected.created_at) : 2000;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedId("");
      setTransactionRef("");
      setReceiptFile(null);
      setNotes("");
      setUploadError(null);
      setUploading(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!selected) return;

    if (!transactionRef.trim() && !receiptFile) {
      setUploadError("Please provide proof of payment: enter a Bank Reference / NIP Session ID or upload a transfer receipt.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      let receiptUrl: string | undefined;
      if (receiptFile) {
        receiptUrl = await uploadPaymentReceipt(receiptFile, selected.id);
      }

      onConfirm(selected, {
        transactionRef: transactionRef.trim() || undefined,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
        receiptUrl,
        notes: notes.trim() || undefined,
        amount: offlineFee,
        isLegacy,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload receipt.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-primary" /> Issue Green Card to Member
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Select a registered member who has made an offline payment (cash or direct bank transfer) to assign their
          official Member ID and activate permanent lifetime Green Card benefits.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Select Member (Search by Name, Email, Phone, or ID)
            </label>
            <MemberCombobox
              members={members}
              value={selectedId}
              onChange={setSelectedId}
              placeholder="Search member..."
              renderBadge={(m) => <GreenCardBadge active={m.has_green_card} size="xs" />}
            />
          </div>

          {selected && (
            <>
              <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-sm text-muted-foreground">
                <span className="block text-xs font-semibold text-primary">Confirmation Summary:</span>
                <p className="leading-relaxed">
                  &bull; <strong className="text-foreground">Member:</strong> {selected.full_name} ({selected.email})
                  <br />&bull; <strong className="text-foreground">Subscription:</strong> Lifetime Permanent Agroheal Green Card Membership
                  <br />&bull; <strong className="text-foreground">Offline Fee:</strong> {isLegacy ? "₦1,000 (Legacy Member Rate - Registered before Sep 6)" : "₦2,000 (Standard Rate - Registered from Sep 6)"}
                  <br />&bull; <strong className="text-foreground">Action:</strong> Assigns sequential Member ID &amp; enables
                  community benefits
                </p>
              </div>

              <div className="border-t border-border pt-3 space-y-3.5">
                <span className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                  Offline Bank Transfer Proof
                </span>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Bank Reference / NIP Session ID
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. TRF-10293847"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground">
                      Payment Date
                    </label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <ReceiptUploadField
                    label="Upload Bank Transfer Receipt"
                    helperText="Strictly JPEG or PNG only &bull; Max 5MB"
                    selectedFile={receiptFile}
                    onFileSelect={setReceiptFile}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Admin Notes / Remarks (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Paid via direct transfer; verified by Admin"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {uploadError && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {uploadError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selected || activatingMemberId === selected?.id || uploading}
            onClick={handleConfirm}
            className="gap-2"
          >
            {(activatingMemberId === selected?.id || uploading) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <IdCard className="h-4 w-4" />
            {uploading
              ? "Uploading Receipt..."
              : activatingMemberId === selected?.id
              ? "Issuing Green Card..."
              : "Confirm & Issue Green Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
