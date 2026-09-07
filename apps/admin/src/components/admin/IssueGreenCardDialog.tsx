import { useState } from "react";
import { IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MemberCombobox } from "@/components/admin/MemberCombobox";
import { GreenCardBadge } from "@/components/admin/MemberBadges";
import type { Member } from "@/types/admin";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  activatingMemberId: string | null;
  onConfirm: (member: Member) => void;
}

export function IssueGreenCardDialog({ open, onOpenChange, members, activatingMemberId, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const selected = members.find((m) => m.id === selectedId);

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedId("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5 text-primary" /> Issue Green Card to Existing Member
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Select a registered member who has made an offline payment (cash or direct bank transfer) to assign their
          official Member ID and activate permanent lifetime Green Card benefits.
        </p>

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
          <div className="space-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-sm text-muted-foreground">
            <span className="block text-xs font-semibold text-primary">Confirmation Summary:</span>
            <p className="leading-relaxed">
              • <strong className="text-foreground">Member:</strong> {selected.full_name} ({selected.email})
              <br />• <strong className="text-foreground">Subscription:</strong> Lifetime Permanent Agroheal Green Card Membership
              <br />• <strong className="text-foreground">Offline Fee:</strong> ₦2,000 (Payment Confirmed)
              <br />• <strong className="text-foreground">Action:</strong> Assigns sequential Member ID &amp; enables
              community benefits
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selected || activatingMemberId === selected?.id}
            onClick={() => selected && onConfirm(selected)}
            className="gap-2"
          >
            <IdCard className="h-4 w-4" />
            {activatingMemberId === selected?.id ? "Issuing Green Card..." : "Confirm & Issue Green Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
