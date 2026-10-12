import { useEffect, useState, useMemo } from "react";
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
  UserCheck,
  Search,
  ArrowUpDown,
  Filter,
  MapPin,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { useFarmAssignmentGaps, type FarmAssignmentGap } from "@/hooks/useFarmAssignmentGaps";
import { type FarmGroup } from "@/lib/farmAssignment";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminTierFilter } from "@/context/AdminTierContext";
import { exportToExcel } from "@shared/excelExport";
import { formatWATDateTime } from "@/lib/dateTimeFormat";
import { adminApiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { AssignSlotModal } from "@/components/admin/AssignSlotModal";

function gapKey(gap: FarmAssignmentGap) {
  return `${gap.memberId}::${gap.category}`;
}

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

interface RealCluster {
  id: string;
  name: string;
  project_category: string;
  targetSlots: number;
  boughtSlots: number;
  modernSlots: number;
  legacySlots: number;
  totalBags: number;
  isLgaCluster?: boolean;
  state?: string;
  lga?: string;
}

export default function FarmAssignmentsPage() {
  const { profile, isReadOnly, isAdmin, isSuperDeveloper, isCoordinator } = useAdminAuth();
  const { tier } = useAdminTierFilter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"cycles" | "gaps">("cycles");

  // Notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4500);
  };

  // ── TAB 1: REAL FARM CLUSTERS & PRODUCTION CYCLES ──
  const [modernClusters, setModernClusters] = useState<RealCluster[]>([]);
  const [legacyClusters, setLegacyClusters] = useState<RealCluster[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [cyclesByFarm, setCyclesByFarm] = useState<Record<string, LiveCycle>>({});
  const [updatingStageClusterId, setUpdatingStageClusterId] = useState<string | null>(null);

  // Approval Modal State
  const [approveModalCycle, setApproveModalCycle] = useState<LiveCycle | null>(null);
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Distribution State
  const [distributingId, setDistributingId] = useState<string | null>(null);

  // ── TAB 2: GAPS & ASSIGNMENTS STATE ──
  const { gaps, loading: gapsLoading, error: gapsError, refetch: refetchGaps } = useFarmAssignmentGaps();
  const [farmGroups, setFarmGroups] = useState<FarmGroup[]>([]);
  const [assignModalGap, setAssignModalGap] = useState<FarmAssignmentGap | null>(null);

  // Gap Filtering & Intelligent Sorting
  const [gapSearch, setGapSearch] = useState("");
  const [gapStateFilter, setGapStateFilter] = useState("all");
  const [gapSortBy, setGapSortBy] = useState<
    "shortfall_desc" | "shortfall_asc" | "state_asc" | "state_desc" | "name_asc" | "name_desc" | "purchased_desc"
  >("shortfall_desc");

  // Dynamically select clusters based on the active admin tier
  const displayedClusters = useMemo(() => {
    if (tier === "live") return modernClusters;
    if (tier === "legacy") return legacyClusters;
    return [...modernClusters, ...legacyClusters];
  }, [tier, modernClusters, legacyClusters]);

  // Extract unique states for gap filtering
  const availableGapStates = useMemo(() => {
    const set = new Set<string>();
    gaps.forEach((g) => {
      if (g.state && g.state.trim() && g.state !== "Unassigned") {
        set.add(g.state.trim());
      }
    });
    return Array.from(set).sort();
  }, [gaps]);

  // Filter and sort gaps
  const filteredGaps = useMemo(() => {
    return gaps
      .filter((g) => {
        const term = gapSearch.toLowerCase().trim();
        const matchesSearch =
          !term ||
          g.fullName?.toLowerCase().includes(term) ||
          g.email?.toLowerCase().includes(term) ||
          g.phone?.toLowerCase().includes(term) ||
          g.category?.toLowerCase().includes(term) ||
          g.state?.toLowerCase().includes(term) ||
          g.lga?.toLowerCase().includes(term);

        const matchesState =
          gapStateFilter === "all" ||
          (g.state && g.state.toLowerCase() === gapStateFilter.toLowerCase());

        return matchesSearch && matchesState;
      })
      .sort((a, b) => {
        if (gapSortBy === "shortfall_desc") return b.shortfall - a.shortfall;
        if (gapSortBy === "shortfall_asc") return a.shortfall - b.shortfall;
        if (gapSortBy === "state_asc") return (a.state || "").localeCompare(b.state || "");
        if (gapSortBy === "state_desc") return (b.state || "").localeCompare(a.state || "");
        if (gapSortBy === "name_asc") return (a.fullName || "").localeCompare(b.fullName || "");
        if (gapSortBy === "name_desc") return (b.fullName || "").localeCompare(a.fullName || "");
        if (gapSortBy === "purchased_desc") return b.slotsPurchased - a.slotsPurchased;
        return 0;
      });
  }, [gaps, gapSearch, gapStateFilter, gapSortBy]);

  const loadFarmData = async () => {
    setClustersLoading(true);
    try {
      // 1. Fetch real farm groups, active subscriptions, profiles, and legacy records
      const [groupsRes, subsRes, profRes, recordsRes, lgRecordsRes] = await Promise.all([
        supabase
          .from("farm_groups")
          .select("id, name, project_category")
          .order("name"),
        supabase
          .from("slot_subscriptions")
          .select("id, user_id, farm_group_id, slots, is_legacy, project_category, state, lga, status")
          .eq("status", "active"),
        supabase
          .from("profiles")
          .select("id, full_name, email, state, lga"),
        supabase
          .from("farm_records")
          .select("farm_id, farm_slots"),
        supabase
          .from("lg_farm_records")
          .select("farm_id, farm_slots"),
      ]);

      if (groupsRes.error) throw groupsRes.error;

      const profMap = new Map((profRes.data || []).map((p: any) => [p.id, p]));
      const modernSlotsByFarm: Record<string, number> = {};
      const lgaClustersMap = new Map<
        string,
        {
          name: string;
          project_category: string;
          state: string;
          lga: string;
          slots: number;
        }
      >();

      (subsRes.data || []).forEach((s: any) => {
        const slotCount = Number(s.slots) || 0;
        if (s.is_legacy) {
          if (s.farm_group_id) {
            modernSlotsByFarm[s.farm_group_id] =
              (modernSlotsByFarm[s.farm_group_id] || 0) + slotCount;
          }
        } else {
          // Modern slot: authoritative grouping by LGA and State
          const prof = profMap.get(s.user_id);
          const rawState = (s.state || prof?.state || "Unassigned").trim();
          const rawLga = (s.lga || prof?.lga || "General Unit").trim();
          const state = rawState ? rawState.charAt(0).toUpperCase() + rawState.slice(1) : "Unassigned";
          const lga = rawLga ? rawLga.charAt(0).toUpperCase() + rawLga.slice(1) : "General Unit";
          const key = `${state}::${lga}`;

          if (!lgaClustersMap.has(key)) {
            lgaClustersMap.set(key, {
              name: `${lga} Community Unit [${state}]`,
              project_category: s.project_category || "Mushroom Village",
              state,
              lga,
              slots: 0,
            });
          }
          const item = lgaClustersMap.get(key)!;
          item.slots += slotCount;
        }
      });

      const legacySlotsByFarm: Record<string, number> = {};
      (recordsRes.data || []).forEach((r: any) => {
        if (r.farm_id) {
          legacySlotsByFarm[r.farm_id] =
            (legacySlotsByFarm[r.farm_id] || 0) + (Number(r.farm_slots) || 0);
        }
      });
      (lgRecordsRes.data || []).forEach((r: any) => {
        if (r.farm_id) {
          legacySlotsByFarm[r.farm_id] =
            (legacySlotsByFarm[r.farm_id] || 0) + (Number(r.farm_slots) || 0);
        }
      });

      // Build Legacy Commercial Clusters
      const loadedLegacyClusters: RealCluster[] = (groupsRes.data || []).map((g: any) => {
        const modern = modernSlotsByFarm[g.id] || 0;
        const legacy = legacySlotsByFarm[g.id] || 0;
        const total = modern + legacy;
        return {
          id: g.id,
          name: g.name,
          project_category: g.project_category || "Mushroom Village",
          targetSlots: 1000,
          boughtSlots: total,
          modernSlots: modern,
          legacySlots: legacy,
          totalBags: total * 2, // 2 bags per slot statutory translation
          isLgaCluster: false,
        };
      });

      // Build Modern Local Government (LGA) Community Production Units
      const loadedModernClusters: RealCluster[] = Array.from(lgaClustersMap.entries()).map(([key, item]) => ({
        id: `LGA-${key}`,
        name: item.name,
        project_category: item.project_category,
        targetSlots: 1000,
        boughtSlots: item.slots,
        modernSlots: item.slots,
        legacySlots: 0,
        totalBags: item.slots * 2,
        isLgaCluster: true,
        state: item.state,
        lga: item.lga,
      })).sort((a, b) => b.boughtSlots - a.boughtSlots);

      setModernClusters(loadedModernClusters);
      setLegacyClusters(loadedLegacyClusters);
      setFarmGroups(groupsRes.data || []);
    } catch (err: any) {
      console.warn("Could not load real farm clusters:", err);
    } finally {
      setClustersLoading(false);
    }
  };

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
          map[c.farm_group_id] = {
            ...c,
            yield_kg: Number(c.yield_kg ?? c.total_yield_kg ?? 0),
            total_revenue: Number(c.total_revenue ?? c.gross_revenue ?? 0),
            distributable_revenue: Number(c.distributable_revenue ?? c.distributable_balance ?? 0),
            continuation_cost: Number(c.continuation_cost ?? 0),
            total_bags: Number(c.total_bags ?? c.total_bags_fruiting ?? 0),
            member_dividend_per_slot: Number(c.member_dividend_per_slot ?? 0),
          };
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
    loadFarmData();
    loadFarmCycles();
  }, []);

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

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Farm_Assignment_Gaps_${dateStamp}.xlsx`;

    const gapRows = filteredGaps.map((gap, idx) => ({
      "S/N": idx + 1,
      "Member Name": gap.fullName,
      "Email": gap.email,
      "Phone": gap.phone,
      "State": gap.state || "Unassigned",
      "LGA": gap.lga || "Unassigned",
      "Project Category": gap.category,
      "Slots Purchased": gap.slotsPurchased,
      "Slots Assigned": gap.slotsAssigned,
      "Shortfall (Unassigned)": gap.shortfall,
    }));

    const totalPurchased = filteredGaps.reduce((sum, g) => sum + g.slotsPurchased, 0);
    const totalAssigned = filteredGaps.reduce((sum, g) => sum + g.slotsAssigned, 0);
    const totalShortfall = filteredGaps.reduce((sum, g) => sum + g.shortfall, 0);

    const summaryRows = [
      { Metric: "Total Members with Gaps", Value: filteredGaps.length },
      { Metric: "Total Purchased Slots", Value: totalPurchased },
      { Metric: "Total Assigned Slots", Value: totalAssigned },
      { Metric: "Total Unassigned Shortfall", Value: totalShortfall },
      { Metric: "Active Tier Filter", Value: tier.toUpperCase() },
      { Metric: "Generated Date", Value: formatWATDateTime(new Date()) },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Assignment Gaps", data: gapRows },
        { sheetName: "Gaps Summary", data: summaryRows },
      ],
    });

    flash(setSuccessMessage, `Exported ${filteredGaps.length} gap records to ${filename}`);
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
            Authoritative commercial clusters, biological crop progress &amp; member slot allocations.
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
            Commercial Clusters &amp; Cycles ({displayedClusters.length})
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
              {tier === "live"
                ? `${displayedClusters.length} Modern LGA Community Production Units (Target: 1,000 slots/unit • 2 bags/slot)`
                : tier === "legacy"
                ? `${displayedClusters.length} Legacy Commercial Farm Clusters (Target: 1,000 slots/cluster • 2 bags/slot)`
                : `${displayedClusters.length} Authoritative Farm Production Units & Clusters`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                loadFarmData();
                loadFarmCycles();
              }}
              disabled={cyclesLoading || clustersLoading}
              className="gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cyclesLoading || clustersLoading ? "animate-spin" : ""}`} />
              Refresh Clusters
            </Button>
          </div>

          {clustersLoading && displayedClusters.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading commercial clusters...
            </div>
          ) : displayedClusters.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
              No farm clusters configured yet in the database.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedClusters.map((cluster) => {
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

                return (
                  <Card key={cluster.id} className="border-border/60 bg-card overflow-hidden flex flex-col justify-between">
                    <div className="p-5 space-y-4">
                      {/* Top Row: Cluster Title & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
                              {cluster.project_category}
                            </span>
                            {cluster.isLgaCluster ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] rounded font-semibold bg-primary/10 text-primary border border-primary/20">
                                <MapPin className="w-2.5 h-2.5" /> LGA Unit
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] rounded font-semibold bg-muted text-muted-foreground border border-border">
                                <Building2 className="w-2.5 h-2.5" /> Legacy Group
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-foreground text-sm">
                            {cluster.name}
                          </h3>
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

                      {/* Reconciled Key Metrics: Slots Bought vs Target & Biological Bags */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-background/50 border border-border/50">
                          <span className="text-muted-foreground block text-[10px]">Slots Bought</span>
                          <span className="font-mono font-bold text-foreground text-sm">
                            {cluster.boughtSlots.toLocaleString()}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              / {cluster.targetSlots.toLocaleString()}
                            </span>
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {cluster.isLgaCluster
                              ? `${cluster.modernSlots.toLocaleString()} Modern LGA Slots`
                              : `${cluster.modernSlots.toLocaleString()} Modern • ${cluster.legacySlots.toLocaleString()} Legacy`}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-background/50 border border-border/50">
                          <span className="text-muted-foreground block text-[10px]">Biological Bags</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {cluster.totalBags.toLocaleString()} bags
                          </span>
                          <span className="text-[9px] text-muted-foreground block">
                            (2 bags / slot)
                          </span>
                        </div>
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
                      {/* Approve Action (Reviewer / Maker-Checker) */}
                      {(status === "HARVESTED" || cycle?.stage === "HARVESTING") && (
                        <Button
                          size="sm"
                          onClick={() => setApproveModalCycle(cycle)}
                          className="text-xs h-8 flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          Approve Harvest Audit
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
          )}

          {/* ── MODAL: MAKER-CHECKER APPROVAL MODAL ── */}
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
      {/* ── TAB 2: SLOT ALLOCATIONS & GAPS ── */}
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

          {/* Search, Filter & Sort Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-3 rounded-xl bg-card border border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search member, email, phone, category, state, LGA..."
                value={gapSearch}
                onChange={(e) => setGapSearch(e.target.value)}
                className="pl-9 h-8 text-xs bg-muted/40 border-border"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* State Filter Dropdown */}
              <div className="w-44">
                <Select value={gapStateFilter} onValueChange={setGapStateFilter}>
                  <SelectTrigger className="h-8 text-xs bg-muted/40 border-border">
                    <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Filter by State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All States ({gaps.length})
                    </SelectItem>
                    {availableGapStates.map((st) => {
                      const count = gaps.filter((g) => g.state?.toLowerCase() === st.toLowerCase()).length;
                      return (
                        <SelectItem key={st} value={st} className="text-xs">
                          {st} ({count})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By Dropdown */}
              <div className="w-52">
                <Select value={gapSortBy} onValueChange={(val: any) => setGapSortBy(val)}>
                  <SelectTrigger className="h-8 text-xs bg-muted/40 border-border">
                    <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Sort gaps" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shortfall_desc" className="text-xs">
                      Shortfall (Highest first)
                    </SelectItem>
                    <SelectItem value="shortfall_asc" className="text-xs">
                      Shortfall (Lowest first)
                    </SelectItem>
                    <SelectItem value="state_asc" className="text-xs">
                      State (A → Z)
                    </SelectItem>
                    <SelectItem value="state_desc" className="text-xs">
                      State (Z → A)
                    </SelectItem>
                    <SelectItem value="name_asc" className="text-xs">
                      Member Name (A → Z)
                    </SelectItem>
                    <SelectItem value="name_desc" className="text-xs">
                      Member Name (Z → A)
                    </SelectItem>
                    <SelectItem value="purchased_desc" className="text-xs">
                      Purchased Slots (Highest first)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <span className="font-semibold text-foreground">{filteredGaps.length}</span> of{" "}
              <span className="font-semibold text-foreground">{gaps.length}</span> recorded gaps
            </span>
            {(gapSearch || gapStateFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setGapSearch("");
                  setGapStateFilter("all");
                }}
                className="text-primary hover:underline font-medium text-xs"
              >
                Reset filters
              </button>
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
          ) : filteredGaps.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
              {gaps.length === 0 ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  Every purchased slot is accounted for on a farm record.
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  No gap records match the selected search or state filter.
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member &amp; Location</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Purchased</th>
                    <th className="px-4 py-3 font-medium">Assigned</th>
                    <th className="px-4 py-3 font-medium">Shortfall</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredGaps.map((gap) => {
                    const key = gapKey(gap);
                    return (
                      <tr key={key} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{gap.fullName}</div>
                          <div className="text-xs text-muted-foreground">{gap.email}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border/60 font-medium">
                              <MapPin className="w-2.5 h-2.5 text-primary" />
                              {gap.state || "Unassigned"}
                              {gap.lga ? ` • ${gap.lga}` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{gap.category}</td>
                        <td className="px-4 py-3 font-mono">{gap.slotsPurchased}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">{gap.slotsAssigned}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-500 font-mono">
                            <AlertTriangle className="h-3.5 w-3.5" /> {gap.shortfall}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            disabled={isReadOnly || isCoordinator}
                            onClick={() => setAssignModalGap(gap)}
                            className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
                          >
                            {isCoordinator ? <Lock className="h-3 w-3" /> : <UserCheck className="h-3.5 w-3.5" />}
                            {isCoordinator ? "Admin Only" : "Assign Slots"}
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

      {/* Modal for Assigning Slots */}
      <AssignSlotModal
        gap={assignModalGap}
        farmGroups={farmGroups}
        open={Boolean(assignModalGap)}
        onOpenChange={(open) => !open && setAssignModalGap(null)}
        onAssigned={() => {
          refetchGaps();
          loadFarmData();
        }}
        onSuccess={(msg) => flash(setSuccessMessage, msg)}
        onError={(msg) => flash(setErrorMessage, msg)}
      />
    </div>
  );
}
