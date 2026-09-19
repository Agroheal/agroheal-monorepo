import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sprout,
  Clock,
  TrendingUp,
  CheckCircle2,
  Award,
  AlertCircle,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/apiClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export interface FarmAllocation {
  farmId: string;
  farmName: string;
  category: string;
  slots: number;
  currentStage?: string;
  cycleNumber?: number;
}

export interface MySlotsData {
  totalPurchasedSlots: number;
  totalAssignedSlots: number;
  unassignedSlots: number;
  farmAllocations: FarmAllocation[];
}

const CYCLE_STAGES = [
  { key: "PLANNING", label: "Planning & Bagging", desc: "Substrate prep & sterilization", percent: 20 },
  { key: "GROWING", label: "Colonization", desc: "Mycelium incubation in darkrooms", percent: 50 },
  { key: "HARVESTING", label: "Fruiting & Harvest", desc: "Daily harvest in humidity tents", percent: 80 },
  { key: "AUDITING", label: "Wholesale & Audit", desc: "Sales reconciliation & quality check", percent: 95 },
  { key: "DISTRIBUTED", label: "Dividends Paid", desc: "40% net margin credited to wallet", percent: 100 },
];

export const FarmCycleTracker: React.FC = () => {
  const [data, setData] = useState<MySlotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSlotData() {
      try {
        const res = await apiClient.cycles.getMySlots();
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn("[FarmCycleTracker] Could not load slots via API:", err.message);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadSlotData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-card rounded-2xl border border-border">
        <LoadingSpinner />
        <span className="ml-3 text-sm text-muted-foreground">Loading production cycles...</span>
      </div>
    );
  }

  const allocations = data?.farmAllocations || [];
  const totalSlots = data?.totalPurchasedSlots || 0;

  if (totalSlots === 0) {
    return (
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-card shadow-sm rounded-2xl">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Farm Production Slots Active</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You do not hold active production slots yet. Secure practical farm slots (₦5,000/slot) to sponsor commercial mushroom or ginger clusters and receive quarterly harvest dividends.
          </p>
          <a
            href="/dashboard/mushroom-village"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
          >
            Sponsor Mushroom Village Slots <ChevronRight className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {allocations.map((farm, idx) => {
        const slotsCount = farm.slots || 1;
        const grossEst = slotsCount * 10000;
        const netDividendEst = slotsCount * 2400; // 40% authoritative dividend

        // Dynamic stage resolution from live farm cycle
        const stageKey = (farm.currentStage || "GROWING").toUpperCase();
        const foundIndex = CYCLE_STAGES.findIndex((s) => s.key === stageKey);
        const currentStageIndex = foundIndex !== -1 ? foundIndex : 1;
        const currentStage = CYCLE_STAGES[currentStageIndex];

        return (
          <motion.div
            key={farm.farmId || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/10 via-card to-card shadow-md rounded-2xl overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">
                        {farm.farmName}
                      </CardTitle>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                        Cycle {farm.cycleNumber || 1} Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cluster: {farm.category} • Assigned Substrate Units
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Held Units</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {slotsCount} Production Slot{slotsCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-6">
                {/* Visual Step Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      Current Phase: <span className="text-foreground">{currentStage.label}</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {currentStage.percent}% Timeline Completed
                    </span>
                  </div>

                  <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden p-0.5 border border-border/50">
                    <motion.div
                      className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${currentStage.percent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>

                  {/* Desktop Step Badges */}
                  <div className="hidden sm:grid grid-cols-5 gap-2 pt-2 text-center">
                    {CYCLE_STAGES.map((s, sIdx) => {
                      const isPast = sIdx < currentStageIndex;
                      const isCurrent = sIdx === currentStageIndex;
                      return (
                        <div key={s.key} className="space-y-1">
                          <div
                            className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold ${
                              isPast
                                ? "bg-emerald-500 text-white"
                                : isCurrent
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500 ring-2 ring-emerald-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : sIdx + 1}
                          </div>
                          <p className={`text-[11px] font-medium leading-tight ${isCurrent ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                            {s.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Dividend Projections according to BUSINESS_LOGIC.md */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-background/60 border border-border/60">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Projected Cluster Revenue</span>
                    <span className="text-sm font-semibold text-foreground">
                      ₦{grossEst.toLocaleString()} <span className="text-[10px] text-muted-foreground">(₦10k/slot)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Input Continuation Reserve</span>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      ₦{(slotsCount * 4000).toLocaleString()} <span className="text-[10px] text-muted-foreground">(40% cost)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-500" />
                      40% Net Member Dividend
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ₦{netDividendEst.toLocaleString()} <span className="text-[10px] text-muted-foreground">(₦2,400/slot)</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Cycle Duration: 90 Days (Quarterly Commercial Harvest)
                  </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Auto-Disbursed on Cycle Close
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FarmCycleTracker;
