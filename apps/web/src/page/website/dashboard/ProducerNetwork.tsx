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
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Users,
  Store,
  Tag,
  ChevronRight,
  ChevronDown,
  Lock,
  PlusCircle,
  Award,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NetworkCalculatorCard from "@/components/network/NetworkCalculatorCard";
import RegulatoryNotice from "@/components/webComponents/RegulatoryNotice";

export const MATRIX_COMMISSIONS = [
  { level: 1, percentage: 5.0, amount: 250, maxMembers: 5, potential: 1250, requiredDirects: 5 },
  { level: 2, percentage: 3.5, amount: 175, maxMembers: 25, potential: 4375, requiredDirects: 10 },
  { level: 3, percentage: 3.0, amount: 150, maxMembers: 125, potential: 18750, requiredDirects: 15 },
  { level: 4, percentage: 2.5, amount: 125, maxMembers: 625, potential: 78125, requiredDirects: 20 },
  { level: 5, percentage: 2.5, amount: 125, maxMembers: 3125, potential: 390625, requiredDirects: 25 },
  { level: 6, percentage: 2.5, amount: 125, maxMembers: 15625, potential: 1953125, requiredDirects: 30 },
  { level: 7, percentage: 2.5, amount: 125, maxMembers: 78125, potential: 9765625, requiredDirects: 35 },
];

export const getUnlockedMatrixLevel = (directCount: number): number => {
  return Math.min(7, Math.floor(directCount / 5));
};

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

      // 1. Fetch user qualifications
      try {
        const apiQuals = await apiClient.genealogy.getQualifications();
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

      // 2. Fetch slots held by user
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("slots, status")
        .eq("user_id", user.id);

      const totalSlots = (subs || []).reduce((acc: number, curr: any) => {
        if (curr.status === "active" || curr.status === "paid" || curr.status === "completed") {
          return acc + (Number(curr.slots) || 0);
        }
        return acc;
      }, 0);
      setSlotsHeld(totalSlots);

      // 3. Fetch approved productions / harvest batches if any
      try {
        const { data: productions } = await supabase
          .from("farm_records")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .limit(10);
        setApprovedProductions(productions || []);
      } catch {
        setApprovedProductions([]);
      }
    } catch (err) {
      console.error("[ProducerNetwork] Failed to load producer data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Producer Network & Production Engine..." />;
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
                <Sprout className="w-3.5 h-3.5" /> Producer Network &amp; Cooperative Production
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Physical Biological Assets
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Producer Network &amp; Harvest Pipelines
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Participate directly in smallholder mushroom cluster production. Secure commercial farm slots, track biological fruiting batches, earn <strong>10% direct sponsor bounties</strong>, and unlock <strong>7-level community production commissions</strong>.
            </p>
          </div>

          {/* Qualification Summary Card */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[240px] text-center shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-1">
              Your Matrix Tier Qualification
            </span>
            <div className="text-3xl font-black text-white">
              Level {unlockedLevel} of 7
            </div>
            <p className="text-xs text-emerald-200 mt-1">
              {directReferralsCount} Direct Partners Sponsored
            </p>
            <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-emerald-100/80">
              {unlockedLevel < 7 ? (
                <span>
                  Sponsor <strong>{5 - (directReferralsCount % 5)} more</strong> to unlock Level {unlockedLevel + 1}
                </span>
              ) : (
                <span className="text-amber-300 font-bold">★ All 7 Matrix Levels Unlocked!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── LOCKED POTENTIAL COMMISSIONS SUB-CARD ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-emerald-600/10 rounded-2xl p-4 sm:p-5 border border-amber-300/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold shrink-0">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Potential Matrix Dividends Notice
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Level {unlockedLevel}/7 Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 mt-0.5 leading-relaxed">
              Up to <strong>₦12,212,500 in potential community commissions</strong> are accessible across your 7 matrix tiers. Unlocked dividends credit directly into your Member Wallet. Sponsor direct partners to expand your payout depth.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/transactions"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
        >
          <span>View Wallet Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── CARD TO BUY SLOTS (FIRST CARD / ACTION) ── */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs px-2.5 py-0.5">
              {slotsHeld > 0 ? `${slotsHeld} Active Farm Slots Held` : "No Farm Slots Yet"}
            </Badge>
            <span className="text-xs text-gray-500 font-medium">• Commercial Mushroom Production</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900">
            {slotsHeld > 0 ? "Secure Additional Production Slots" : "Secure Your First Commercial Farm Slot"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Each <strong>₦5,000 slot</strong> creates 2 verified biological oyster mushroom fruiting bags managed within our cooperative community farms. Earn projected harvest yields from Cycle 2 onward.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
          <Button
            asChild
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Link to="/dashboard/slots">
              <PlusCircle className="w-4 h-4" />
              <span>{slotsHeld > 0 ? "Buy More Slots (₦5,000)" : "Buy First Slot (₦5,000)"}</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto h-11 px-5 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs transition-all"
          >
            <Link to="/dashboard/slots-subscription">
              <span>View Slot Management</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── APPROVED PRODUCTION SECTION ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Certified Harvests
              </span>
              <span className="text-xs text-gray-500 font-medium">• Verified Biological Records</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mt-2">
              Approved Production Batches
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Live batch logs of fruiting bags, weight measurements, and quality inspections audited by farm coordinators.
            </p>
          </div>

          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-3 py-1 self-start sm:self-auto">
            {approvedProductions.length} Approved Batches
          </Badge>
        </div>

        {approvedProductions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-emerald-200/80 bg-emerald-50/30 p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <Sprout className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              No Approved Productions Yet
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              Your approved productions will feature here when approved by AgroHeal admin and your farm coordinator.
            </p>
            {slotsHeld === 0 && (
              <Button
                asChild
                size="sm"
                className="mt-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl"
              >
                <Link to="/dashboard/slots">Secure a Farm Slot to Begin</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedProductions.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900">{prod.crop_type || "Oyster Mushroom"}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Approved
                  </span>
                </div>
                <p className="text-xs text-gray-600">{prod.notes || "Cooperative Verified Harvest Batch"}</p>
                <div className="pt-2 border-t border-emerald-200/60 flex justify-between text-[11px]">
                  <span className="text-gray-500">Yield: {prod.weight_kg || 0} kg</span>
                  <span className="text-gray-500 font-mono">{new Date(prod.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION: 7-LEVEL PRODUCTION MATRIX STRUCTURE (FOLDABLE, FOLDED BY DEFAULT) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                7-Level Production Matrix Engine
              </span>
              <span className="text-xs text-gray-500 font-medium">• 5×7 Spillover Capacity</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
              Multilevel Producer Matrix Distribution
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
              Earn direct sponsor bounties and route 7-level community spillovers through your matrix tree. Qualified producers unlock deeper dividend channels down to 7 depths.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommissionTableOpen(!commissionTableOpen)}
              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs rounded-xl gap-1.5 h-9"
            >
              <span>{commissionTableOpen ? "Hide Matrix Structure" : "Show Matrix Structure"}</span>
              <ChevronDown
                className={`w-4 h-4 text-emerald-700 transition-transform duration-200 ${
                  commissionTableOpen ? "rotate-180" : ""
                }`}
              />
            </Button>

            <Link
              to="/dashboard/my-network"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors h-9"
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Genealogy Tree</span>
            </Link>
          </div>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {commissionTableOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden space-y-6 pt-2"
            >
              {/* 7-Level Distribution Table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-900 text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 rounded-tl-xl">Level Depth</th>
                      <th className="py-3.5 px-4">Commission %</th>
                      <th className="py-3.5 px-4">Payout Per ₦5k Product/Slot</th>
                      <th className="py-3.5 px-4">Max Capacity (5^L)</th>
                      <th className="py-3.5 px-4">Directs to Unlock</th>
                      <th className="py-3.5 px-4">Your Status</th>
                      <th className="py-3.5 px-4 rounded-tr-xl">Potential Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {MATRIX_COMMISSIONS.map((tier) => {
                      const isTierUnlocked = unlockedLevel >= tier.level;
                      return (
                        <tr key={tier.level} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900">Level {tier.level}</td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-800">{tier.percentage.toFixed(1)}%</td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">₦{tier.amount.toLocaleString()}</td>
                          <td className="py-3.5 px-4 font-mono">{tier.maxMembers.toLocaleString()} members</td>
                          <td className="py-3.5 px-4 font-semibold text-gray-800">
                            {tier.requiredDirects} Directs
                          </td>
                          <td className="py-3.5 px-4">
                            {isTierUnlocked ? (
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                                🔓 Unlocked
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-900 font-medium px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                                🔒 Locked ({Math.max(0, tier.requiredDirects - directReferralsCount)} needed)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-700">
                            ₦{tier.potential.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-emerald-50/90 font-black text-emerald-950">
                      <td className="py-4 px-4 font-black">UPLINE TOTALS (7 Levels)</td>
                      <td className="py-4 px-4">21.5%</td>
                      <td className="py-4 px-4">₦1,075.00</td>
                      <td className="py-4 px-4 font-mono">97,655 members</td>
                      <td className="py-4 px-4">35 Directs</td>
                      <td className="py-4 px-4">
                        {unlockedLevel >= 7 ? "✓ All Unlocked" : `Level ${unlockedLevel}/7 Active`}
                      </td>
                      <td className="py-4 px-4 text-emerald-900 text-sm">₦12,212,500.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Allocation Architecture Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200/80 text-xs text-emerald-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 block uppercase text-[11px] tracking-wider">
                      Farm-Slot Allocation (₦5,000/Slot — Physical Production)
                    </span>
                    <Badge className="bg-emerald-200 text-emerald-900 border-emerald-300 text-[10px]">
                      Biological Asset
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 shadow-xs">
                      <span className="text-gray-500 block text-[10px]">Direct Referrer</span>
                      <strong className="text-emerald-900 text-xs">10% (₦500)</strong>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 shadow-xs">
                      <span className="text-gray-500 block text-[10px]">Company Admin</span>
                      <strong className="text-emerald-900 text-xs">20% (₦1,000)</strong>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 shadow-xs">
                      <span className="text-gray-500 block text-[10px]">Two Fruiting Bags</span>
                      <strong className="text-emerald-900 text-xs">28% (₦1,400)</strong>
                    </div>
                    <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 shadow-xs">
                      <span className="text-gray-500 block text-[10px]">Fruiting House & Logistics</span>
                      <strong className="text-emerald-900 text-xs">42% (₦2,100)</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 block uppercase text-[11px] tracking-wider">
                      Green Card Membership Key (₦2,000 One-Time)
                    </span>
                    <Badge className="bg-slate-200 text-slate-800 border-slate-300 text-[10px]">
                      Identity & Curricula
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                      <span className="text-gray-500 block text-[10px]">Direct Sponsor Bounty</span>
                      <strong className="text-emerald-700 text-xs">50% (₦1,000)</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                      <span className="text-gray-500 block text-[10px]">Academy Curricula & System</span>
                      <strong className="text-emerald-700 text-xs">50% (₦1,000)</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 pt-2 border-t border-slate-200">
                    Unlocks permanent verified cooperative identity, QR credential, and lifelong curriculum access.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SECTION: INTERACTIVE PRODUCTION HARVEST FORECASTER ── */}
      <NetworkCalculatorCard
        eyebrowIcon={Calculator}
        eyebrowText="Producer Harvest Forecaster"
        title="Interactive Producer Direct & Slot Forecaster"
        description="Simulate your direct sponsorship bonuses and biological fruiting bag allocations based on active direct producer partners."
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
            label: "Green Card Bounty",
            value: `₦${(calcDirects * 1000).toLocaleString()}`,
            subtext: `₦1,000 × ${calcDirects} Directs`,
          },
          {
            label: "Farm-Slot Bounties",
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
