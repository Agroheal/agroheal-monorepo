import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Clock,
  Users,
  Store,
  Tag,
  ChevronDown,
  Lock,
  PlusCircle,
  Award,
  AlertCircle,
  FileCheck,
  Scale,
  Calendar,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NetworkSkeleton from "@/components/dashboard/NetworkSkeleton";
import NetworkCalculatorCard from "@/components/network/NetworkCalculatorCard";
import RegulatoryNotice from "@/components/webComponents/RegulatoryNotice";
import {
  MATRIX_COMMISSIONS_TIERS,
  getUnlockedMatrixLevel,
  formatNaira,
  BASE_SLOT_PRICE,
  CLUSTER_SETUP_FEE,
  STARTER_SLOT_TOTAL,
  SUBSEQUENT_SLOT_PRICE,
  BAGS_PER_SLOT_CYCLE_1,
  TOTAL_POTENTIAL_MATRIX_COMMISSIONS,
  SLOT_DIRECT_SPONSOR_PERCENT,
} from "@shared/businessRules";

export const MATRIX_COMMISSIONS = MATRIX_COMMISSIONS_TIERS;
export { getUnlockedMatrixLevel };

export const ProducerNetwork: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [directReferralsCount, setDirectReferralsCount] = useState<number>(0);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(0);
  const [slotsHeld, setSlotsHeld] = useState<number>(0);
  const [approvedProductions, setApprovedProductions] = useState<any[]>([]);
  const [commissionTableOpen, setCommissionTableOpen] = useState(false);
  const [calcDirects, setCalcDirects] = useState<number>(5);
  const [calcSlotsPerDirect, setCalcSlotsPerDirect] = useState<number>(2);

  useEffect(() => {
    loadProducerData();
  }, []);

  const loadProducerData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch user qualifications (fast-fail)
      try {
        const apiQuals = await apiClient.genealogy.getQualifications({ timeout: 2500 });
        if (apiQuals?.matrixSpilloverWallet?.directReferralsCount !== undefined) {
          const cnt = Number(apiQuals.matrixSpilloverWallet.directReferralsCount);
          setDirectReferralsCount(cnt);
          setUnlockedLevel(getUnlockedMatrixLevel(cnt));
        }
      } catch {
        const { data: directRefs } = await supabase
          .from("profiles")
          .select("id")
          .eq("referred_by", user.id);
        const cnt = directRefs ? directRefs.length : 0;
        setDirectReferralsCount(cnt);
        setUnlockedLevel(getUnlockedMatrixLevel(cnt));
      }

      // 2 & 3. Fetch slots held by user and approved productions in parallel
      const [{ data: subs }, { data: productions }] = await Promise.all([
        supabase
          .from("slot_subscriptions")
          .select("slots, status")
          .eq("user_id", user.id),
        supabase
          .from("farm_records")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .limit(10),
      ]);

      const totalSlots = (subs || []).reduce((acc: number, curr: any) => {
        if (curr.status === "active" || curr.status === "paid" || curr.status === "completed") {
          return acc + (Number(curr.slots) || 0);
        }
        return acc;
      }, 0);
      setSlotsHeld(totalSlots);
      setApprovedProductions(productions || []);
    } catch (err) {
      console.error("[ProducerNetwork] Failed to load producer data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <NetworkSkeleton title="Producer Network" />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-16 font-sans">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-slate-950 text-white p-7 sm:p-10 shadow-xl border border-emerald-700/30">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                <Sprout className="w-3.5 h-3.5" /> Producer Network &amp; Commercial Production
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Physical Biological Assets
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Producer Network &amp; Harvest Pipelines
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Participate directly in smallholder mushroom cluster production. Secure commercial farm slots, track biological fruiting batches, earn <strong>{SLOT_DIRECT_SPONSOR_PERCENT}% direct sponsor bounties</strong>, and unlock <strong>7-level community production commissions</strong>.
            </p>
          </div>

          {/* Qualification & Potential Matrix Dividends Card (Integrated) */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 w-full lg:max-w-md shrink-0 shadow-lg text-white space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
                  Your Matrix Tier Qualification
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/25 text-amber-200 border border-amber-400/40">
                Level {unlockedLevel}/7 Active
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-2.5">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Level {unlockedLevel} <span className="text-sm font-semibold text-emerald-200">of 7</span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  {directReferralsCount} Direct Partners Sponsored
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                  Potential Matrix Pool
                </span>
                <span className="text-base sm:text-lg font-mono font-black text-amber-300">
                  {formatNaira(TOTAL_POTENTIAL_MATRIX_COMMISSIONS)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-200">
                Potential Matrix Dividends Notice
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-relaxed">
                Up to <strong className="text-white font-semibold">{formatNaira(TOTAL_POTENTIAL_MATRIX_COMMISSIONS)}</strong> in potential community commissions are accessible across your 7 matrix tiers. Sponsoring 5 active direct partners unlocks all 7 tiers simultaneously. Commissions credit directly into your Member Wallet.
              </p>
            </div>

            <div className="pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-[11px] text-emerald-100/90">
                {directReferralsCount < 5 ? (
                  <span>
                    Sponsor <strong className="text-amber-300">{5 - directReferralsCount} more direct partner(s)</strong> (total 5) to unlock all 7 matrix tiers.
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold">✓ All 7 Matrix Levels Unlocked!</span>
                )}
              </div>

              <Link
                to="/dashboard/transactions"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-white underline underline-offset-2 transition-colors shrink-0"
              >
                <span>View Wallet Details</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── UNIFIED COMMERCIAL FARM PRODUCTION & HARVEST ALLOCATIONS CARD ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Farm Production &amp; Harvest Records
              </span>
              <span className="text-xs text-gray-500 font-medium">• Verified Allocations &amp; Yield Logs</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
              {slotsHeld === 0
                ? "Secure Your Starter Commercial Farm Slot"
                : "Commercial Farm Production & Harvest Allocations"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
              {slotsHeld === 0 ? (
                <>
                  Your starter package is <strong>{formatNaira(STARTER_SLOT_TOTAL)} ({formatNaira(BASE_SLOT_PRICE)} biological farm slot + {formatNaira(CLUSTER_SETUP_FEE)} cluster setup &amp; onboarding)</strong>. This establishes your first {BAGS_PER_SLOT_CYCLE_1} verified biological oyster mushroom fruiting bags managed within our community cluster farms. Subsequent slots scale at <strong>{formatNaira(SUBSEQUENT_SLOT_PRICE)} each</strong> with zero recurring monthly fees.
                </>
              ) : (
                <>
                  Live biological production records and audited harvest batches tied to your <strong>{slotsHeld} active commercial farm slot(s)</strong> ({slotsHeld * BAGS_PER_SLOT_CYCLE_1} fruiting bags under managed cluster care).
                </>
              )}
            </p>
          </div>

          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-3 py-1 self-start sm:self-auto shrink-0">
            {slotsHeld === 0
              ? "0 Active Production Slots"
              : approvedProductions.length === 0
              ? `${slotsHeld} Active Slot(s) • In Cultivation`
              : `${approvedProductions.length} Approved Harvest Record(s)`}
          </Badge>
        </div>

        {/* Dynamic State Handling */}
        {slotsHeld === 0 ? (
          /* STATE 1: User has NO slots secured yet */
          <div className="rounded-2xl border-2 border-dashed border-emerald-200/90 bg-emerald-50/40 p-6 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-lg mx-auto">
              <h4 className="text-base font-bold text-gray-900">
                Production Not Started · No Commercial Farm Slots Secured
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                You do not hold any active commercial farm slots yet. Secure your starter package to allocate your first {BAGS_PER_SLOT_CYCLE_1} biological fruiting bags. Once active, your bags are managed on-site by resident cluster agronomists, and audited harvest weights and approved yields will be recorded and credited right here.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                asChild
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Link to="/dashboard/checkout?category=Mushroom%20Village&slots=1">
                  <PlusCircle className="w-4 h-4" />
                  <span>Secure Complete Starter ({formatNaira(STARTER_SLOT_TOTAL)})</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto h-11 px-5 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs transition-all"
              >
                <Link to="/dashboard/farm-operations/my-slots">
                  <span>View Slot Management</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : approvedProductions.length === 0 ? (
          /* STATE 2: User holds slots, biological cultivation is actively in progress */
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
                      {slotsHeld} Active Slot{slotsHeld > 1 ? "s" : ""} ({slotsHeld * BAGS_PER_SLOT_CYCLE_1} Fruiting Bags)
                    </Badge>
                    <span className="text-xs text-amber-800 font-semibold">• Biological Cycle in Progress</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Your {slotsHeld * BAGS_PER_SLOT_CYCLE_1} fruiting bags are actively being cared for by cluster coordinators. Cycle 1 doubles capacity from 2 to 4 bags per slot.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <Button
                  asChild
                  size="sm"
                  className="rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs flex-1 md:flex-none"
                >
                  <Link to="/dashboard/farm-operations/buy-slots" className="flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Buy Slots</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs flex-1 md:flex-none"
                >
                  <Link to="/dashboard/farm-operations/my-slots">
                    <span>My Slots</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* STATE 3: User has approved harvest records */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Active Farm Allocations</span>
                <span className="text-xs text-emerald-700">
                  {slotsHeld} Slot{slotsHeld > 1 ? "s" : ""} ({slotsHeld * BAGS_PER_SLOT_CYCLE_1} Fruiting Bags) • {approvedProductions.length} Approved Harvest Batch{approvedProductions.length > 1 ? "es" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  asChild
                  size="sm"
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl"
                >
                  <Link to="/dashboard/farm-operations/buy-slots" className="flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Slots ({formatNaira(SUBSEQUENT_SLOT_PRICE)})</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs h-9 px-3 rounded-xl"
                >
                  <Link to="/dashboard/farm-operations/my-slots">
                    <span>Manage Slots</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedProductions.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 space-y-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">{prod.crop_type || "Oyster Mushroom Flush"}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Approved
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-emerald-700" /> Weight:
                      </span>
                      <span className="font-bold font-mono text-gray-900">
                        {prod.weight_kg ? `${prod.weight_kg} kg` : "Weigh-in Verified"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date Approved:
                      </span>
                      <span className="font-mono text-gray-700">
                        {new Date(prod.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Audit Status:
                      </span>
                      <span className="font-semibold text-emerald-700">Coordinator Verified</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 pt-2 border-t border-emerald-200/60">
                    {prod.notes || "Verified Harvest Batch"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── INTELLIGENT GENEALOGY DISPATCH CARD ── */}
      <div className="bg-gradient-to-r from-[#0c2415] via-emerald-950 to-[#041d0f] rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700/40">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              5×7 Producer Organogram
            </span>
            <span className="text-xs text-emerald-200/80 font-medium">• 7-Level Spillover Capacity</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Explore Your Interactive Downline Genealogy
          </h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            Inspect placements, monitor direct sponsor growth, and visualize community spillovers across all 7 matrix levels in real time.
          </p>
        </div>

        <Link
          to="/dashboard/my-network"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#d1ef75] hover:bg-[#c3e35d] text-emerald-950 font-bold text-xs transition-all shadow-sm shrink-0 font-mono tracking-tight cursor-pointer"
        >
          <Users className="w-4 h-4 text-emerald-950" />
          <span>Launch Genealogy Tree</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── SECTION: INTERACTIVE PRODUCTION HARVEST FORECASTER ── */}
      <NetworkCalculatorCard
        eyebrowIcon={Calculator}
        eyebrowText="Producer Harvest Forecaster"
        title="Interactive Producer Direct & Slot Forecaster"
        description="Simulate your direct sponsorship commissions and biological fruiting bag allocations based on active direct producer partners."
        controls={
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="space-y-1">
              <label className="text-[10px] text-emerald-200 font-semibold block">Direct Partners:</label>
              <select
                value={calcDirects}
                onChange={(e) => setCalcDirects(Number(e.target.value))}
                className="bg-emerald-950 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-emerald-500/40 cursor-pointer w-full"
              >
                {[1, 2, 5, 10, 15, 20, 35].map((num) => (
                  <option key={num} value={num}>
                    {num} Directs
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-emerald-200 font-semibold block">Slots / Partner:</label>
              <select
                value={calcSlotsPerDirect}
                onChange={(e) => setCalcSlotsPerDirect(Number(e.target.value))}
                className="bg-emerald-950 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl border border-emerald-500/40 cursor-pointer w-full"
              >
                {[1, 2, 5, 10, 20].map((num) => (
                  <option key={num} value={num}>
                    {num} Slots (₦{(num * 5000).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
        metrics={[
          {
            label: "Green Card Commission",
            value: `₦${(calcDirects * 1000).toLocaleString()}`,
            subtext: `₦1,000 × ${calcDirects} Directs`,
          },
          {
            label: "Farm-Slot Commissions",
            value: `₦${(calcDirects * calcSlotsPerDirect * 500).toLocaleString()}`,
            subtext: "10% (₦500) per slot",
          },
          {
            label: "Total Direct Cashflow",
            value: `₦${(calcDirects * 1000 + calcDirects * calcSlotsPerDirect * 500).toLocaleString()}`,
            subtext: "Immediate Referral Payout",
            isHighlight: true,
          },
          {
            label: "Cluster Production",
            value: `${calcDirects * calcSlotsPerDirect * 2} Bags`,
            subtext: `${calcDirects * calcSlotsPerDirect} Active Slots`,
          },
        ]}
      />

      {/* Statutory Regulatory & Non-Investment Notice */}
      <RegulatoryNotice linkHref="/dashboard/legal#terms" />
    </div>
  );
};

export default ProducerNetwork;
