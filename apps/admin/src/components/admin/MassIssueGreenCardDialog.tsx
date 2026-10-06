import { IdCard, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Member } from "@/types/admin";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMembers: Member[];
  onConfirm: (unpaidMembers: Member[]) => Promise<void>;
  loading: boolean;
  progress?: { current: number; total: number; currentName?: string } | null;
}

export function MassIssueGreenCardDialog({
  open,
  onOpenChange,
  selectedMembers,
  onConfirm,
  loading,
  progress,
}: Props) {
  const unpaidMembers = selectedMembers.filter((m) => !m.has_green_card);
  const alreadyActiveCount = selectedMembers.length - unpaidMembers.length;

  const handleApply = async () => {
    if (unpaidMembers.length === 0) return;
    await onConfirm(unpaidMembers);
  };

  return (
    <Dialog open={open} onOpenChange={loading ? () => {} : onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <IdCard className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Mass Issue Green Cards</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate official AGC Member IDs and activate memberships in bulk.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground block">Eligible to Activate</span>
              <span className="text-xl font-black text-amber-500 font-mono">
                {unpaidMembers.length}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground block">Already Active</span>
              <span className="text-xl font-black text-emerald-500 font-mono">
                {alreadyActiveCount}
              </span>
            </div>
          </div>

          {unpaidMembers.length === 0 ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-100 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>All {selectedMembers.length} selected members already hold active Green Cards. No activation needed.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-100 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This action will provision <strong>{unpaidMembers.length}</strong> official Green Cards, assign unique AGC Member IDs, credit statutory sponsor bonuses, and log double-entry ledger entries.
              </span>
            </div>
          )}

          {loading && progress && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground truncate">
                  Processing: {progress.currentName || "Member"}
                </span>
                <span className="font-mono font-bold text-foreground">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{
                    width: `${Math.round((progress.current / Math.max(1, progress.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={loading || unpaidMembers.length === 0}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <IdCard className="h-4 w-4" />}
            Activate {unpaidMembers.length} Green Card{unpaidMembers.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
