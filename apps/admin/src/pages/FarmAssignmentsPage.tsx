import { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  Sprout,
  MapPinned,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { useFarmAssignmentGaps, type FarmAssignmentGap } from "@/hooks/useFarmAssignmentGaps";
import { fetchFarmGroups, assignSlotsToFarmGroup, type FarmGroup } from "@/lib/farmAssignment";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { exportToExcel } from "@shared/excelExport";
import { adminApiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

function gapKey(gap: FarmAssignmentGap) {
  return `${gap.memberId}::${gap.category}`;
}

const AUTHORITATIVE_CLUSTERS = [
  {
    id: "OY-MUSH-01",
    name: "Mushroom Village 1",
    location: "Ibadan, Oyo State",
    category: "mushroom",
    targetSlots: 1000,
  },
  {
    id: "OG-POTA-01",
    name: "Sweet Potato Cluster 1",
    location: "Abeokuta, Ogun State",
    category: "sweet_potato",
    targetSlots: 1000,
  },
  {
    id: "KD-GING-01",
    name: "Ginger Town 1",
    location: "Kafanchan, Kaduna State",
    category: "ginger",
    targetSlots: 1000,
  },
  {
    id: "OG-CASS-01",
    name: "Cassava City 1",
    location: "Sagamu, Ogun State",
    category: "cassava",
    targetSlots: 1000,
  },
  {
    id: "OS-MAIZ-01",
    name: "Maize & Grain Reserve 1",
    location: "Osogbo, Osun State",
    category: "maize",
    targetSlots: 1000,
  },
  {
    id: "EN-VEGE-01",
    name: "Vegetable Greenhouses 1",
    location: "Nsukka, Enugu State",
    category: "vegetables",
    targetSlots: 1000,
  },
];

const CYCLE_STAGE_OPTIONS = [
  { value: "PLANNING", label: "Stage 1: Planning & Bagging (20%)" },
  { value: "GROWING", label: "Stage 2: Colonization / Incubation (50%)" },
  { value: "HARVESTING", label: "Stage 3: Fruiting & Harvest (80%)" },
  { value: "AUDITING", label: "Stage 4: Wholesale & Audit (95%)" },
  { value: "DISTRIBUTED", label: "Stage 5: Dividends Paid (100%)" },
];

interface LiveCycle {
  id: string;
  farm_group_id: string;
  cycle_number: number;
  stage?: "PLANNING" | "GROWING" | "HARVESTING" | "AUDITING" | "DISTRIBUTED";
  status: "PLANNING" | "GROWING" | "HARVESTED" | "AUDITED" | "DISTRIBUTED" | "pending_approval" | "approved" | "distributed" | "active" | string;
  start_date: string;
  projected_harvest_date: string;
  actual_harvest_date?: string;
  total_bags: number;
  yield_kg?: number;
  total_revenue?: number;
  continuation_cost?: number;
  distributable_revenue?: number;
  member_dividend_per_slot?: number;
  drafted_by?: string;
  approved_by?: string;
  distributed_at?: string;
  notes?: string;
}

export default function FarmAssignmentsPage() {
  const { profile, isReadOnly, isAdmin, isSuperDeveloper, isReviewer, isCoordinator } = useAdminAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"cycles" | "gaps">("cycles");

  // Notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4500);
  };

  // ── TAB 1: PRODUCTION & HARVEST CYCLES STATE ──
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [cyclesByFarm, setCyclesByFarm] = useState<Record<string, LiveCycle>>({});
  const [updatingStageClusterId, setUpdatingStageClusterId] = useState<string | null>(null);

  // Draft Modal State
  const [draftModalCluster, setDraftModalCluster] = useState<typeof AUTHORITATIVE_CLUSTERS[0] | null>(null);
  const [draftYieldKg, setDraftYieldKg] = useState<number>(4000);
  const [draftRevenue, setDraftRevenue] = useState<number>(10000000);
  const [draftContinuation, setDraftContinuation] = useState<number>(4000000);
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [submittingDraft, setSubmittingDraft] = useState(false);

  // Approval Modal State
  const [approveModalCycle, setApproveModalCycle] = useState<LiveCycle | null>(null);
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Distribution State
  const [distributingId, setDistributingId] = useState<string | null>(null);

  const loadFarmCycles = async () => {
    setCyclesLoading(true);
    try {
      const { data, error } = await supabase
        .from("farm_cycles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const map: Record<string, LiveCycle> = {};
      (data || []).forEach((c: any) => {
        if (!map[c.farm_group_id]) {
          map[c.farm_group_id] = c;
        }
      });
      setCyclesByFarm(map);
    } catch (err: any) {
      console.warn("Could not load farm cycles:", err);
    } finally {
      setCyclesLoading(false);
    }
  };

  useEffect(() => {
    loadFarmCycles();
  }, []);

  const handleOpenDraft = (cluster: typeof AUTHORITATIVE_CLUSTERS[0]) => {
    const existing = cyclesByFarm[cluster.id];
    const estimatedSlots = 1000;
    setDraftModalCluster(cluster);
    setDraftYieldKg(existing?.yield_kg || 4000);
    setDraftRevenue(existing?.total_revenue || estimatedSlots * 10000);
    setDraftContinuation(existing?.continuation_cost || estimatedSlots * 4000);
    setDraftNotes(existing?.notes || "");
  };

  const handleSubmitDraft = async () => {
    if (!draftModalCluster) return;
    setSubmittingDraft(true);
    setErrorMessage("");
    try {
      await adminApiClient.cycles.draftHarvestYield({
        farmGroupId: draftModalCluster.id,
        yieldKg: Number(draftYieldKg),
        totalHarvestRevenue: Number(draftRevenue),
        continuationCost: Number(draftContinuation),
        notes: draftNotes,
      });

      flash(
        setSuccessMessage,
        `Harvest report drafted for ${draftModalCluster.name}. Submitted for Maker-Checker audit.`
      );
      setDraftModalCluster(null);
      await loadFarmCycles();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Failed to submit harvest yield report.");
    } finally {
      setSubmittingDraft(false);
    }
  };

  const handleApproveCycle = async () => {
    if (!approveModalCycle) return;

    if (approveModalCycle.drafted_by === profile?.id && !isSuperDeveloper) {
      flash(setErrorMessage, "Maker-Checker violation: Draft author cannot approve their own report.");
      return;
    }

    setSubmittingApprove(true);
    setErrorMessage("");
    try {
      await adminApiClient.cycles.approveHarvestCycle(approveModalCycle.id);
      flash(
        setSuccessMessage,
        `Cycle #${approveModalCycle.cycle_number} approved. Ready for dividend distribution.`
      );
      setApproveModalCycle(null);
      await loadFarmCycles();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Failed to approve harvest cycle.");
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleDistributeDividends = async (cycle: LiveCycle) => {
    if (!isAdmin && !isSuperDeveloper) {
      flash(setErrorMessage, "Only Platform Admins and Super Developer can trigger dividend disbursements.");
      return;
    }

    const confirm = window.confirm(
      `Disburse 40% harvest dividends to all verified slot owners in ${cycle.farm_group_id}? This will post credits to member wallet ledgers and dispatch notifications.`
    );
    if (!confirm) return;

    setDistributingId(cycle.id);
    setErrorMessage("");
    try {
      const res = await adminApiClient.cycles.distributeDividends(cycle.id);
      flash(
        setSuccessMessage,
        `Distributed ₦${(res.totalDistributed || 0).toLocaleString()} to ${res.slotHoldersCredited || 0} slot owners. In-app and email notifications dispatched.`
      );
      await loadFarmCycles();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Dividend distribution failed.");
    } finally {
      setDistributingId(null);
    }
  };

  const handleStageChange = async (clusterId: string, newStage: string) => {
    if (!isAdmin && !isSuperDeveloper) {
      flash(setErrorMessage, "Only Platform Admins and Super Developers can advance cycle stages.");
      return;
    }

    setUpdatingStageClusterId(clusterId);
    setErrorMessage("");
    try {
      await adminApiClient.cycles.updateStage(clusterId, newStage);
      flash(setSuccessMessage, `Crop stage advanced to ${newStage} for cluster ${clusterId}.`);
      await loadFarmCycles();
    } catch (err: any) {
      console.warn("adminApiClient stage update failed, attempting direct Supabase update:", err);
      try {
        const existing = cyclesByFarm[clusterId];
        const statusMap: Record<string, string> = {
          PLANNING: "active",
          GROWING: "active",
          HARVESTING: "harvested",
          AUDITING: "approved",
          DISTRIBUTED: "distributed",
        };
        if (existing?.id) {
          const { error: updateErr } = await supabase
            .from("farm_cycles")
            .update({
              stage: newStage,
              status: statusMap[newStage] || existing.status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabase
            .from("farm_cycles")
            .insert({
              farm_group_id: clusterId,
              cycle_number: 1,
              stage: newStage,
              status: statusMap[newStage] || "active",
              total_bags: 2000,
              created_at: new Date().toISOString(),
            });
          if (insertErr) throw insertErr;
        }
        flash(setSuccessMessage, `Crop stage advanced to ${newStage} for cluster ${clusterId}.`);
        await loadFarmCycles();
      } catch (dbErr: any) {
        flash(setErrorMessage, dbErr.message || "Failed to update cycle stage.");
      }
    } finally {
      setUpdatingStageClusterId(null);
    }
  };

  // ── TAB 2: GAPS & ASSIGNMENTS STATE ──
  const { gaps, loading: gapsLoading, error: gapsError, refetch: refetchGaps } = useFarmAssignmentGaps();
  const [farmGroups, setFarmGroups] = useState<FarmGroup[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Record<string, string>>({});
  const [assigningKey, setAssigningKey] = useState<string | null>(null);

  useEffect(() => {
    fetchFarmGroups()
      .then(setFarmGroups)
      .catch((err) => console.error("Failed to load farm groups:", err));
  }, []);

  const handleAssign = async (gap: FarmAssignmentGap) => {
    if (isReadOnly) {
      flash(setErrorMessage, "Support role is Read-Only. Farm assignments require Platform Admin privileges.");
      return;
    }

    const key = gapKey(gap);
    const farmGroupId = selectedFarm[key];
    if (!farmGroupId) {
      flash(setErrorMessage, "Pick a farm group first.");
      return;
    }

    setAssigningKey(key);
    setErrorMessage("");
    try {
      await assignSlotsToFarmGroup({
        farmGroupId,
        category: gap.category,
        name: gap.fullName,
        email: gap.email,
        phone: gap.phone,
        slots: gap.shortfall,
      });
      flash(setSuccessMessage, `Assigned ${gap.shortfall} ${gap.category} slot(s) for ${gap.fullName}.`);
      await refetchGaps();
    } catch (err) {
      flash(setErrorMessage, err instanceof Error ? err.message : "Assignment failed.");
    } finally {
      setAssigningKey(null);
    }
  };

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Farm_Assignment_Gaps_${dateStamp}.xlsx`;

    const gapRows = gaps.map((gap, idx) => ({
      "S/N": idx + 1,
      "Member Name": gap.fullName,
      "Email": gap.email,
      "Phone": gap.phone,
      "Project Category": gap.category,
      "Slots Purchased": gap.slotsPurchased,
      "Slots Assigned": gap.slotsAssigned,
      "Shortfall (Unassigned)": gap.shortfall,
    }));

    const totalPurchased = gaps.reduce((sum, g) => sum + g.slotsPurchased, 0);
    const totalAssigned = gaps.reduce((sum, g) => sum + g.slotsAssigned, 0);
    const totalShortfall = gaps.reduce((sum, g) => sum + g.shortfall, 0);

    const summaryRows = [
      { Metric: "Total Members with Gaps", Value: gaps.length },
      { Metric: "Total Purchased Slots", Value: totalPurchased },
      { Metric: "Total Assigned Slots", Value: totalAssigned },
      { Metric: "Total Unassigned Shortfall", Value: totalShortfall },
      { Metric: "Generated Date", Value: new Date().toLocaleString() },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Assignment Gaps", data: gapRows },
        { sheetName: "Gaps Summary", data: summaryRows },
      ],
    });

    flash(setSuccessMessage, `Exported ${gaps.length} gap records to ${filename}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            Farm Management Hub
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor biological harvest cycles, coordinate crop off-taker revenue, and manage member slot allocations.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("cycles")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "cycles"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-primary" />
            Production &amp; Cycles
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gaps")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "gaps"
                ? "bg-card text-foreground shadow-xs border border-border/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPinned className="w-3.5 h-3.5 text-amber-400" />
            Slot Allocations ({gaps.length})
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: PRODUCTION & HARVEST CYCLES ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "cycles" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              6 Authoritative Commercial Clusters (Target: 1,000 slots • Launch: ≥250 slots)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadFarmCycles}
              disabled={cyclesLoading}
              className="gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cyclesLoading ? "animate-spin" : ""}`} />
              Refresh Cycles
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTHORITATIVE_CLUSTERS.map((cluster) => {
              const cycle = cyclesByFarm[cluster.id];
              const cycleNum = cycle?.cycle_number || 1;
              const status = cycle?.status || "PLANNING";

              const statusColor =
                status === "DISTRIBUTED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : status === "AUDITED"
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : status === "HARVESTED"
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                  : status === "GROWING"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-muted text-muted-foreground border-border";

              const isAuthor = cycle?.drafted_by === profile?.id;
              const canApprove = (isReviewer || isAdmin || isSuperDeveloper) && (!isAuthor || isSuperDeveloper);

              return (
                <Card key={cluster.id} className="border-border/60 bg-card overflow-hidden flex flex-col justify-between">
                  <div className="p-5 space-y-4">
                    {/* Top Row: Cluster ID & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase block">
                          {cluster.id}
                        </span>
                        <h3 className="font-bold text-foreground text-sm">
                          {cluster.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {cluster.location}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusColor}`}>
                        {status}
                      </span>
                    </div>

                    {/* Cycle Number & Rules Banner */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>Cycle #{cycleNum}</span>
                        <span className="text-[11px] text-primary">
                          {cycleNum === 1 ? "Capacity Doubling" : "Quarterly Distribution"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
                        {cycleNum === 1
                          ? "Cycle 1: 90% biological reinvestment (2→4 bags), ₦0 cash payout."
                          : "Cycle 2+: ₦10k revenue − ₦4k continuation = ₦6k distributable (40% to slot owners)."}
                      </p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Bags / Substrate</span>
                        <span className="font-mono font-bold text-foreground">
                          {(cycle?.total_bags || 2000).toLocaleString()} bags
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px]">Target Scale</span>
                        <span className="font-mono font-bold text-foreground">
                          {cluster.targetSlots} slots
                        </span>
                      </div>

                      {cycle?.yield_kg && (
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Harvest Yield</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {cycle.yield_kg.toLocaleString()} kg
                          </span>
                        </div>
                      )}

                      {cycle?.member_dividend_per_slot && (
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Return / Slot</span>
                          <span className="font-mono font-bold text-amber-300">
                            ₦{cycle.member_dividend_per_slot.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Season / Production Stage Selector */}
                    <div className="pt-3 border-t border-border/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Sprout className="w-3.5 h-3.5 text-primary" />
                          Crop Production Stage
                        </span>
                        {updatingStageClusterId === cluster.id ? (
                          <span className="text-[10px] text-primary flex items-center gap-1 font-medium">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Updating...
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {isAdmin || isSuperDeveloper ? "Admin Controlled" : "Live Status"}
                          </span>
                        )}
                      </div>

                      {isAdmin || isSuperDeveloper ? (
                        <Select
                          value={cycle?.stage || (status === "DISTRIBUTED" ? "DISTRIBUTED" : status === "AUDITED" ? "AUDITING" : status === "HARVESTED" ? "HARVESTING" : status === "GROWING" ? "GROWING" : "PLANNING")}
                          onValueChange={(val) => handleStageChange(cluster.id, val)}
                          disabled={updatingStageClusterId === cluster.id}
                        >
                          <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/60">
                            <SelectValue placeholder="Advance crop stage..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CYCLE_STAGE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40 text-xs font-medium text-foreground flex items-center justify-between">
                          <span>
                            {CYCLE_STAGE_OPTIONS.find(
                              (s) => s.value === (cycle?.stage || status)
                            )?.label || (cycle?.stage || status)}
                          </span>
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-2">
                    {/* Draft Action */}
                    {(isCoordinator || isAdmin || isSuperDeveloper) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDraft(cluster)}
                        className="text-xs h-8 flex-1 border-border"
                      >
                        Draft Yield
                      </Button>
                    )}

                    {/* Approve Action (Reviewer / Maker-Checker) */}
                    {(status === "HARVESTED" || cycle?.stage === "HARVESTING") && (
                      <Button
                        size="sm"
                        disabled={!canApprove}
                        onClick={() => setApproveModalCycle(cycle)}
                        title={!canApprove ? "Maker-Checker: Author cannot approve their own draft." : undefined}
                        className="text-xs h-8 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      >
                        Approve Yield
                      </Button>
                    )}

                    {/* Distribute Dividends Action */}
                    {(status === "AUDITED" || cycle?.stage === "AUDITING") && (
                      <Button
                        size="sm"
                        disabled={distributingId === cycle.id || (!isAdmin && !isSuperDeveloper)}
                        onClick={() => handleDistributeDividends(cycle)}
                        className="text-xs h-8 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1"
                      >
                        {distributingId === cycle.id ? "Posting..." : "Distribute 40%"}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── MODAL 1: DRAFT HARVEST YIELD DRAWER ── */}
          {draftModalCluster && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-bold text-foreground text-sm">
                      Draft Harvest Yield: {draftModalCluster.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {draftModalCluster.id} • {draftModalCluster.location}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftModalCluster(null)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="yieldKg">Harvest Yield Weight (kg)</Label>
                    <Input
                      id="yieldKg"
                      type="number"
                      value={draftYieldKg}
                      onChange={(e) => setDraftYieldKg(Number(e.target.value))}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="revenue">Gross Off-Taker Revenue (₦)</Label>
                    <Input
                      id="revenue"
                      type="number"
                      value={draftRevenue}
                      onChange={(e) => setDraftRevenue(Number(e.target.value))}
                      className="font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Standard: ₦10,000 per leased slot
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="continuation">Input Continuation &amp; Replenishment Cost (₦)</Label>
                    <Input
                      id="continuation"
                      type="number"
                      value={draftContinuation}
                      onChange={(e) => setDraftContinuation(Number(e.target.value))}
                      className="font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Standard: ₦4,000 per leased slot (leaves ₦6,000 net distributable)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="notes">Operational Notes &amp; Off-Taker References</Label>
                    <Input
                      id="notes"
                      placeholder="e.g. Sold to Shoprite / Spar off-takers"
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDraftModalCluster(null)}
                    className="text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={submittingDraft}
                    onClick={handleSubmitDraft}
                    className="text-xs h-9 font-semibold gap-1 bg-primary text-primary-foreground"
                  >
                    {submittingDraft ? "Submitting..." : "Submit for Maker-Checker Audit"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── MODAL 2: MAKER-CHECKER APPROVAL MODAL ── */}
          {approveModalCycle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
              <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Maker-Checker Harvest Audit
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      Cycle #{approveModalCycle.cycle_number} • {approveModalCycle.farm_group_id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApproveModalCycle(null)}
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Off-Taker Revenue:</span>
                    <span className="font-mono font-bold text-foreground">
                      ₦{(approveModalCycle.total_revenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Continuation Costs:</span>
                    <span className="font-mono text-muted-foreground">
                      -₦{(approveModalCycle.continuation_cost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/60">
                    <span className="font-semibold text-foreground">Net Distributable:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      ₦{(approveModalCycle.distributable_revenue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Statutory Waterfall Breakdown */}
                <div className="space-y-1.5 text-[11px] p-3 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground block mb-1">
                    Statutory Cycle 2+ Waterfall Splits:
                  </span>
                  <div className="flex justify-between text-amber-300 font-semibold">
                    <span>40% Slot Owners Dividend:</span>
                    <span>₦{((approveModalCycle.distributable_revenue || 0) * 0.4).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>20% Gingertown Reserve:</span>
                    <span>₦{((approveModalCycle.distributable_revenue || 0) * 0.2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>20% FoodNation Reserve:</span>
                    <span>₦{((approveModalCycle.distributable_revenue || 0) * 0.2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>10% Company Oversight:</span>
                    <span>₦{((approveModalCycle.distributable_revenue || 0) * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>10% Farm Coordinator:</span>
                    <span>₦{((approveModalCycle.distributable_revenue || 0) * 0.1).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setApproveModalCycle(null)}
                    className="text-xs h-9"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    disabled={submittingApprove}
                    onClick={handleApproveCycle}
                    className="text-xs h-9 font-semibold bg-primary text-primary-foreground"
                  >
                    {submittingApprove ? "Approving..." : "Confirm & Approve Harvest"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: SLOT ALLOCATIONS & GAPS (EXISTING RECONCILIATION) ── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "gaps" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Farm Assignment Gaps</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Members whose purchased slots exceed what's recorded on farm records. Detects and resolves allocation gaps.
              </p>
            </div>
            {gaps.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1.5 whitespace-nowrap text-xs border-emerald-600/30 text-emerald-500 hover:bg-emerald-500/10 font-semibold self-start sm:self-auto"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Export Gaps Report
              </Button>
            )}
          </div>

          {gapsLoading && gaps.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking farm assignments...
            </div>
          ) : gapsError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center text-sm text-destructive">
              {gapsError}
            </div>
          ) : gaps.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              Every purchased slot is accounted for on a farm record.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Purchased</th>
                    <th className="px-4 py-3 font-medium">Assigned</th>
                    <th className="px-4 py-3 font-medium">Shortfall</th>
                    <th className="px-4 py-3 font-medium">Assign to farm</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {gaps.map((gap) => {
                    const key = gapKey(gap);
                    const farmOptions = farmGroups.filter((g) => g.project_category === gap.category);
                    return (
                      <tr key={key} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{gap.fullName}</div>
                          <div className="text-xs text-muted-foreground">{gap.email}</div>
                        </td>
                        <td className="px-4 py-3">{gap.category}</td>
                        <td className="px-4 py-3 font-mono">{gap.slotsPurchased}</td>
                        <td className="px-4 py-3 font-mono">{gap.slotsAssigned}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-500 font-mono">
                            <AlertTriangle className="h-3.5 w-3.5" /> {gap.shortfall}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={selectedFarm[key] || ""}
                            onValueChange={(value) => setSelectedFarm((prev) => ({ ...prev, [key]: value }))}
                          >
                            <SelectTrigger className="w-48 text-xs">
                              <SelectValue placeholder="Select farm..." />
                            </SelectTrigger>
                            <SelectContent>
                              {farmOptions.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            disabled={isReadOnly || assigningKey === key || !selectedFarm[key]}
                            onClick={() => handleAssign(gap)}
                            className="text-xs h-8"
                          >
                            {assigningKey === key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isReadOnly ? (
                              <Lock className="h-3.5 w-3.5 mr-1" />
                            ) : null}
                            {isReadOnly ? "Locked" : "Assign"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
