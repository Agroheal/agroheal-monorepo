import { useState, useEffect } from "react";
import { CreditCard, ShieldCheck, Sprout, Users } from "lucide-react";
import { useAdminMembers } from "@/hooks/useAdminMembers";
import { StatCard } from "@/components/admin/StatCard";
import { SlotCreditorForm } from "@/components/admin/SlotCreditorForm";
import { OfflineRegistrationForm } from "@/components/admin/OfflineRegistrationForm";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { adminApiClient } from "@/lib/apiClient";

export default function DashboardPage() {
  const { members, paymentLogs, refetch } = useAdminMembers();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [serverStats, setServerStats] = useState<{
    totalMembers: number;
    activeSlots: number;
    activeGreenCards: number;
    farmGroupsCount: number;
  } | null>(null);

  useEffect(() => {
    adminApiClient.admin
      .getStats()
      .then((data) => setServerStats(data))
      .catch((err) =>
        console.info(
          "[DashboardPage] Express Admin API not reached, using direct database stats:",
          err.message
        )
      );
  }, []);

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4000);
  };

  const activeSlots = paymentLogs
    .filter((p) => p.type === "slot_subscription" && p.status === "active")
    .reduce((sum, p) => sum + p.slots, 0);

  return (
    <div className="flex flex-col gap-5">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registered Members"
          value={serverStats ? serverStats.totalMembers : members.length}
          footer="Total member profiles"
          icon={Users}
        />
        <StatCard
          label="Green Card Holders"
          value={serverStats ? serverStats.activeGreenCards : members.filter((m) => m.has_green_card).length}
          footer={`${(serverStats ? serverStats.totalMembers : members.length) - (serverStats ? serverStats.activeGreenCards : members.filter((m) => m.has_green_card).length)} unpaid / pending`}
          icon={ShieldCheck}
        />
        <StatCard
          label="Active Farm Slots"
          value={serverStats ? serverStats.activeSlots : activeSlots}
          footer="Total active leased slots"
          icon={Sprout}
        />
        <StatCard
          label="Total Operations Logs"
          value={paymentLogs.length}
          footer="Payments & manual credits"
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SlotCreditorForm
          members={members}
          onCredited={refetch}
          onSuccess={(msg) => flash(setSuccessMessage, msg)}
          onError={(msg) => flash(setErrorMessage, msg)}
        />
        <OfflineRegistrationForm
          onRegistered={refetch}
          onSuccess={(msg) => flash(setSuccessMessage, msg)}
          onError={(msg) => flash(setErrorMessage, msg)}
        />
      </div>
    </div>
  );
}
