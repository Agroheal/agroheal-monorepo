import { useState, useEffect } from "react";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminApiClient from "@/lib/apiClient";

interface AdminPlanItem {
  id: string;
  userId: string;
  memberName: string;
  memberId: string;
  email: string;
  status: "ACTIVE" | "OVERDUE" | "FULLY_PAID" | "DEFAULTED";
  cumulativePaid: number;
  totalRegistrationFee: number;
  remainingBalance: number;
  totalOverdueCharges: number;
  overdueChargesPaid: number;
  currentWeek: number;
  nextPaymentDueDate: string;
  isOverdue: boolean;
  milestones: {
    day1Active: boolean;
    sponsorBonus5kPaid: boolean;
    starterPack10kReleased: boolean;
    farmSlot15kAllocated: boolean;
  };
  createdAt: string;
}

interface AdminMetrics {
  totalPlans: number;
  activePlans: number;
  overduePlans: number;
  fullyPaidPlans: number;
  totalPrincipalCollected: number;
  totalOverdueChargesCollected: number;
  totalRevenueCollected: number;
  plans: AdminPlanItem[];
}

export default function InstalmentsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminApiClient.instalments.getAdminMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error("[InstalmentsAdmin] Error loading metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleTriggerOverdueScan = async () => {
    try {
      setIsScanning(true);
      setScanMessage(null);
      const res = await adminApiClient.instalments.triggerOverdueScan();
      setScanMessage(`Scan finished: ${res.scanned} checked, ${res.updated} updated.`);
      await fetchMetrics();
    } catch (err: any) {
      setScanMessage(`Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const filteredPlans = (metrics?.plans || []).filter((p) => {
    const matchesSearch =
      (p.memberName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.memberId || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || p.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            GreenCard Registration Instalment Plans
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track weekly ₦1,000 instalments, overdue surcharges, and progressive milestone clearances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleTriggerOverdueScan}
            disabled={isScanning}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
          >
            <Play className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning Overdue..." : "Trigger Overdue Scan"}
          </Button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-amber-700 font-bold ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Total Enrolled</span>
          <div className="text-xl font-black font-mono text-foreground mt-1">
            {metrics?.totalPlans ?? 0}
          </div>
          <span className="text-[11px] text-muted-foreground">All time plans</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Active In-Progress</span>
          <div className="text-xl font-black font-mono text-emerald-600 mt-1">
            {metrics?.activePlans ?? 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Paying on schedule</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Overdue Accounts</span>
          <div className="text-xl font-black font-mono text-amber-600 mt-1">
            {metrics?.overduePlans ?? 0}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">₦500 surcharge active</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Fully Paid</span>
          <div className="text-xl font-black font-mono text-emerald-700 mt-1">
            {metrics?.fullyPaidPlans ?? 0}
          </div>
          <span className="text-[11px] text-muted-foreground">100% completed</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Principal Collected</span>
          <div className="text-lg font-black font-mono text-foreground mt-1 truncate">
            ₦{(metrics?.totalPrincipalCollected ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">Towards ₦15k fee</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground font-medium">Overdue Surcharges</span>
          <div className="text-lg font-black font-mono text-amber-700 mt-1 truncate">
            ₦{(metrics?.totalOverdueChargesCollected ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">Late fees collected</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member, email, AGC ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Status:</span>
          {["ALL", "ACTIVE", "OVERDUE", "FULLY_PAID"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Paid / Total</th>
                <th className="py-3 px-4">Week &amp; Due Date</th>
                <th className="py-3 px-4">Overdue Fee</th>
                <th className="py-3 px-4">Milestones</th>
                <th className="py-3 px-4 text-right">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Loading instalment plans...
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No enrolment plans match your query.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p) => {
                  const dueDateFormatted = p.nextPaymentDueDate
                    ? new Date(p.nextPaymentDueDate).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  const enrolledDateFormatted = p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{p.memberName || "Member"}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{p.memberId || "Pending AGC"}</div>
                        <div className="text-[11px] text-muted-foreground">{p.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            p.status === "FULLY_PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "OVERDUE" || p.isOverdue
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {p.status === "FULLY_PAID" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : p.status === "OVERDUE" || p.isOverdue ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold font-mono text-foreground">
                          ₦{p.cumulativePaid.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          of ₦{p.totalRegistrationFee.toLocaleString()} (₦{p.remainingBalance.toLocaleString()} left)
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">Week {p.currentWeek}</div>
                        <div className={`text-[11px] ${p.isOverdue ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
                          Due: {dueDateFormatted}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className={`font-mono font-bold ${p.totalOverdueCharges > 0 ? "text-amber-700" : "text-muted-foreground"}`}>
                          ₦{p.totalOverdueCharges.toLocaleString()}
                        </div>
                        {p.overdueChargesPaid > 0 && (
                          <div className="text-[11px] text-emerald-600">
                            ₦{p.overdueChargesPaid.toLocaleString()} paid
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                          <span
                            title="₦2,000 Day 1 GreenCard Activation"
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800"
                          >
                            2k GC
                          </span>
                          <span
                            title="₦5,000 Sponsor Starter Pack Bonus (₦1,000)"
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              p.milestones.sponsorBonus5kPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-muted text-muted-foreground opacity-60"
                            }`}
                          >
                            5k SP
                          </span>
                          <span
                            title="₦10,000 Physical Starter Pack Released"
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              p.milestones.starterPack10kReleased
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-muted text-muted-foreground opacity-60"
                            }`}
                          >
                            10k Pack
                          </span>
                          <span
                            title="₦15,000 Farm Slot & Withdrawal Clearance"
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              p.milestones.farmSlot15kAllocated
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-muted text-muted-foreground opacity-60"
                            }`}
                          >
                            15k Slot
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right text-muted-foreground">
                        {enrolledDateFormatted}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
