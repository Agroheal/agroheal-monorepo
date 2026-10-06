import { ShieldCheck } from "lucide-react";
import { AdminAuditLogTable } from "@/components/admin/AdminAuditLogTable";

export default function AuditTrailPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          System &amp; Financial Audit Trail
        </h2>
        <p className="text-xs text-muted-foreground">
          Immutable audit log of all administrative actions, ledger allocations, Green Card activations, and profile updates.
        </p>
      </div>

      <AdminAuditLogTable />
    </div>
  );
}
