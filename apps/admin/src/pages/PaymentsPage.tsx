import { useState } from "react";
import { Loader2, ArrowLeftRight, ShieldCheck, CreditCard } from "lucide-react";
import { useAdminMembers } from "@/hooks/useAdminMembers";
import { PaymentsLogTable } from "@/components/admin/PaymentsLogTable";
import { AdminAuditLogTable } from "@/components/admin/AdminAuditLogTable";
import { VerifyFlwPaymentModal } from "@/components/admin/VerifyFlwPaymentModal";
import { Button } from "@/components/ui/button";

export default function PaymentsPage() {
  const { paymentLogs, loading, refetch } = useAdminMembers();
  const [activeTab, setActiveTab] = useState<"logs" | "audit">("logs");
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  if (loading && paymentLogs.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={activeTab === "logs" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("logs")}
            className="gap-2 text-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Member Transactions &amp; Logs ({paymentLogs.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "audit" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("audit")}
            className="gap-2 text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Offline Bank Transfer Audit &amp; Receipts
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowVerifyModal(true)}
          className="gap-1.5 text-xs h-8 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 shrink-0"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Verify FLW Payment
        </Button>
      </div>

      {activeTab === "logs" ? (
        <PaymentsLogTable logs={paymentLogs} onRefresh={refetch} />
      ) : (
        <AdminAuditLogTable />
      )}

      <VerifyFlwPaymentModal
        open={showVerifyModal}
        onOpenChange={setShowVerifyModal}
      />
    </div>
  );
}

