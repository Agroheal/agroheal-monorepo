import { useState } from "react";
import { UserCheck, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (role: string) => Promise<void>;
  loading: boolean;
}

import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Lock } from "lucide-react";

export function MassAssignRoleDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  loading,
}: Props) {
  const { canAssignRoles, allowedAssignableRoles } = useAdminAuth();
  const [selectedRole, setSelectedRole] = useState<string>("member");

  const availableRoleOptions = allowedAssignableRoles.map((r) => {
    switch (r) {
      case "super_admin":
        return { value: "super_admin", label: "Super Administrator" };
      case "admin":
        return { value: "admin", label: "Administrator" };
      case "reviewer":
        return { value: "reviewer", label: "Reviewer / Auditor" };
      case "coordinator":
        return { value: "coordinator", label: "Farm Coordinator" };
      case "support":
        return { value: "support", label: "Support Specialist" };
      case "user":
      default:
        return { value: "member", label: "Standard Member" };
    }
  });

  const handleApply = async () => {
    if (!selectedRole || !canAssignRoles) return;
    await onConfirm(selectedRole);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Mass Assign Role</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update account role for {selectedCount} selected member{selectedCount !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {!canAssignRoles ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              Role creation and assignment is restricted to Super Admin and authorized delegation.
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Select New Role <span className="text-rose-500">*</span>
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                Roles are strictly filtered based on your delegation authority tier.
              </p>
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
            disabled={loading || !selectedRole}
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
