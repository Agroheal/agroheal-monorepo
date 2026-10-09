import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  ShieldCheck,
  Sprout,
  Users,
  Trophy,
  Landmark,
  PlusCircle,
  UserPlus,
  ArrowRight,
  Clock,
  Layers,
} from "lucide-react";
import { useAdminMembers } from "@/hooks/useAdminMembers";
import { formatWATDateTime } from "@/lib/dateTimeFormat";
import { StatCard } from "@/components/admin/StatCard";
import { SlotCreditorForm } from "@/components/admin/SlotCreditorForm";
import { OfflineRegistrationForm } from "@/components/admin/OfflineRegistrationForm";
import { VerifyFlwPaymentModal } from "@/components/admin/VerifyFlwPaymentModal";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminApiClient } from "@/lib/apiClient";

export default function DashboardPage() {
  const { members, paymentLogs, loading, refetch } = useAdminMembers();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreditorModal, setShowCreditorModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showVerifyFlwModal, setShowVerifyFlwModal] = useState(false);
  const [showInlineForms, setShowInlineForms] = useState(false);

  const [serverStats, setServerStats] = useState<{
    totalMembers: number;
    liveMembers?: number;
    legacyMembers?: number;
    activeSlots: number;
    liveSlots?: number;
    legacySlots?: number;
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

  const recentMembers = members.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      {/* Top Header & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-bold text-foreground">Executive Command Center</h2>
          <p className="text-xs text-muted-foreground">
            Platform operations, community enrollment, and treasury control overview.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setShowCreditorModal(true)}
            className="text-xs gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Credit Slots
          </Button>

          <Button
            size="sm"
            onClick={() => setShowRegisterModal(true)}
            className="text-xs gap-1.5 h-8 bg-primary hover:bg-primary/90 text-white"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Member
          </Button>

          <Button
            size="sm"
            onClick={() => setShowVerifyFlwModal(true)}
            variant="outline"
            className="text-xs gap-1.5 h-8 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Verify FLW Payment
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8"
          >
            <Link to="/leaderboard">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Leaderboard
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-8"
          >
            <Link to="/treasury">
              <Landmark className="w-3.5 h-3.5 text-blue-500" />
              Treasury
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registered Members"
          value={serverStats ? serverStats.totalMembers : members.length}
          footer={
            serverStats?.liveMembers !== undefined && serverStats?.legacyMembers !== undefined
              ? `${serverStats.liveMembers.toLocaleString()} Live • ${serverStats.legacyMembers.toLocaleString()} Legacy`
              : `${members.filter((m) => !m.is_legacy).length} Live • ${members.filter((m) => m.is_legacy).length} Legacy`
          }
          icon={Users}
          loading={loading && !serverStats}
        />
        <StatCard
          label="Green Card Holders"
          value={serverStats ? serverStats.activeGreenCards : members.filter((m) => m.has_green_card).length}
          footer={`${(serverStats ? serverStats.totalMembers : members.length) - (serverStats ? serverStats.activeGreenCards : members.filter((m) => m.has_green_card).length)} pending activation`}
          icon={ShieldCheck}
          loading={loading && !serverStats}
        />
        <StatCard
          label="Active Farm Slots"
          value={serverStats ? serverStats.activeSlots : activeSlots}
          footer={
            serverStats?.liveSlots !== undefined && serverStats?.legacySlots !== undefined
              ? `${serverStats.liveSlots.toLocaleString()} Live • ${serverStats.legacySlots.toLocaleString()} Legacy`
              : "Active community production farm slots"
          }
          icon={Sprout}
          loading={loading && !serverStats}
        />
        <StatCard
          label="Platform Operations"
          value={paymentLogs.length}
          footer={`${paymentLogs.filter((p) => !p.is_legacy).length} Live • ${paymentLogs.filter((p) => p.is_legacy).length} Legacy`}
          icon={CreditCard}
          loading={loading}
        />
      </div>

      {/* Operations Quick Toggle & Inline Forms (Collapsible) */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span className="font-medium text-foreground">Operational Workflows</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInlineForms(!showInlineForms)}
          className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1.5"
        >
          <Layers className="w-3.5 h-3.5" />
          {showInlineForms ? "Hide Manual Forms" : "Show Manual Forms"}
        </Button>
      </div>

      {showInlineForms && (
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
      )}

      {/* Recent Enrolled Members Table */}
      <Card className="p-4 border-border">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Recent Member Enrollments</h3>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1 text-primary">
            <Link to="/members">
              View All Members
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-muted-foreground uppercase font-semibold border-b border-border bg-muted/40">
              <tr>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Member ID</th>
                <th className="py-2.5 px-3 text-center">Green Card</th>
                <th className="py-2.5 px-3 text-center">Active Slots</th>
                <th className="py-2.5 px-3 text-right">Joined (WAT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && members.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-2.5 px-3">
                      <div className="h-3.5 w-28 bg-muted rounded mb-1" />
                      <div className="h-3 w-36 bg-muted/60 rounded" />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="h-3.5 w-16 bg-muted rounded" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="h-4 w-12 bg-muted rounded mx-auto" />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="h-3.5 w-6 bg-muted rounded mx-auto" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="h-3.5 w-24 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : recentMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No members enrolled yet.
                  </td>
                </tr>
              ) : (
                recentMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{m.full_name || "Unnamed"}</span>
                        <span className="text-[11px] text-muted-foreground">{m.email}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {m.member_id || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {m.has_green_card ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold">
                      {m.total_slots || 0}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground text-[11px] whitespace-nowrap">
                      {m.created_at ? formatWATDateTime(m.created_at) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Quick Slot Creditor */}
      <Dialog open={showCreditorModal} onOpenChange={setShowCreditorModal}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Quick Farm Slot Allocation</DialogTitle>
            <DialogDescription>
              Allocate approved farm slots directly to an active member.
            </DialogDescription>
          </DialogHeader>
          <SlotCreditorForm
            members={members}
            onCredited={() => {
              refetch();
              setShowCreditorModal(false);
            }}
            onSuccess={(msg) => flash(setSuccessMessage, msg)}
            onError={(msg) => flash(setErrorMessage, msg)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Quick Offline Registration */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Offline Member Registration</DialogTitle>
            <DialogDescription>
              Register and activate a member who paid via offline bank transfer.
            </DialogDescription>
          </DialogHeader>
          <OfflineRegistrationForm
            onRegistered={() => {
              refetch();
              setShowRegisterModal(false);
            }}
            onSuccess={(msg) => flash(setSuccessMessage, msg)}
            onError={(msg) => flash(setErrorMessage, msg)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Verify Flutterwave Payment */}
      <VerifyFlwPaymentModal
        open={showVerifyFlwModal}
        onOpenChange={setShowVerifyFlwModal}
      />
    </div>
  );
}
