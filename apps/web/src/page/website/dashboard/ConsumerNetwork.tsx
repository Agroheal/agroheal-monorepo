import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
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
  Sprout,
  Users,
  ExternalLink,
  Store,
  Tag,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NetworkCalculatorCard from "@/components/network/NetworkCalculatorCard";

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

const UPCOMING_PRODUCTS = [
  {
    id: "prod-1",
    name: "Mushroom Power (500g)",
    category: "Functional Nutrition",
    price: 5000,
    directCommission: 600,
    uplinePool: 1075,
    tag: "Welcome Product",
    desc: "Premium organic Oyster Mushroom powder rich in plant proteins, beta-glucans, and essential micronutrients. Included in Wealth Creation Activation.",
    inStock: "Flagship Ready",
  },
  {
    id: "prod-2",
    name: "AgroHeal Dried Oyster Mushrooms (250g)",
    category: "Culinary Harvest",
    price: 4500,
    directCommission: 540,
    uplinePool: 967.5,
    tag: "Grown in Clusters",
    desc: "Sun-dried gourmet culinary oyster mushrooms grown sustainably across our community fruiting farms. Superior culinary shelf life.",
    inStock: "Coming Soon",
  },
  {
    id: "prod-3",
    name: "Fortified Ginger & Mushroom Elixir Tea",
    category: "Wellness Infusion",
    price: 3500,
    directCommission: 420,
    uplinePool: 752.5,
    tag: "Herbal Synergy",
    desc: "Synergistic blend of organically harvested gingertown root extract and vitality oyster mushrooms for daily immune defense.",
    inStock: "Coming Soon",
  },
];

export const ConsumerNetwork: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [directReferralsCount, setDirectReferralsCount] = useState<number>(0);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(0);
  const [calcOrdersPerMember, setCalcOrdersPerMember] = useState<number>(1);

  useEffect(() => {
    loadUserQualification();
  }, []);

  const loadUserQualification = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Check API qualifications if available
      try {
        const apiQuals = await apiClient.genealogy.getQualifications();
        if (apiQuals?.matrixSpilloverWallet?.directReferralsCount !== undefined) {
          const cnt = Number(apiQuals.matrixSpilloverWallet.directReferralsCount);
          setDirectReferralsCount(cnt);
          setUnlockedLevel(getUnlockedMatrixLevel(cnt));
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to database
      }

      // 2. Fetch direct referrals count from profiles
      const { data: directRefs } = await supabase
        .from("profiles")
        .select("id")
        .eq("referred_by", user.id);

      const cnt = directRefs ? directRefs.length : 0;
      setDirectReferralsCount(cnt);
      setUnlockedLevel(getUnlockedMatrixLevel(cnt));
    } catch (err) {
      console.error("[ConsumerNetwork] Failed to load user qualifications:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Consumer Network & Commission Engine..." />;
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
                <Store className="w-3.5 h-3.5" /> Consumer Marketplace &amp; Retail Engine
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" /> 40% Commission Ceiling
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Consumer Network &amp; Retail Commissions
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Distribute value-added agricultural produce to verified consumers. Earn up to <strong>12% direct retail margins</strong> plus recurring <strong>21.5% multilevel upline bonuses across 7 network tiers</strong> on every retail purchase.
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

      {/* ── 7-LEVEL COMMISSION ENGINE CARD ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                7-Level Product Commission Engine
              </span>
              <span className="text-xs text-gray-500 font-medium">• 40% Maximum Payout Ceiling</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
              Multilevel Product Commission Structure
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
              Applies to the <strong>₦5,000 Mushroom Power welcome product</strong> (included in the ₦10,000 Wealth Creation Activation) and every retail product sold across the platform. Multilevel commissions distribute across 7 upline tiers (<strong>21.5% subtotal, up to ₦1,075 per sale</strong>).
            </p>
          </div>

          <Link
            to="/dashboard/compound-referrals"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-200 transition-colors self-start md:self-auto"
          >
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>View Producer Matrix</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 7-Level Distribution Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 rounded-l-xl">Level Depth</th>
                <th className="py-3.5 px-4">Commission %</th>
                <th className="py-3.5 px-4">Payout Per ₦5k Product</th>
                <th className="py-3.5 px-4">Max Capacity (5^L)</th>
                <th className="py-3.5 px-4">Directs to Unlock</th>
                <th className="py-3.5 px-4">Your Status</th>
                <th className="py-3.5 px-4 rounded-r-xl">Potential Earnings</th>
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

        {/* ── ALLOCATION ARCHITECTURE CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Card A: Full 40% Product Commission Allocation */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px] tracking-wider">
                Full 40% Product Commission Allocation (Per ₦5,000 Sale)
              </span>
              <Badge className="bg-slate-200 text-slate-800 border-slate-300 text-[10px]">
                Retail Engine
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-gray-500 block text-[10px]">Direct Retail Seller</span>
                <strong className="text-emerald-700 text-xs">12.0% (₦600)</strong>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-gray-500 block text-[10px]">7-Level Upline Network</span>
                <strong className="text-emerald-700 text-xs">21.5% (₦1,075)</strong>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-gray-500 block text-[10px]">Leadership Pool</span>
                <strong className="text-emerald-700 text-xs">4.0% (₦200)</strong>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-xs">
                <span className="text-gray-500 block text-[10px]">Sustainability Reserve</span>
                <strong className="text-emerald-700 text-xs">2.0% (₦100)</strong>
              </div>
            </div>
            <div className="text-[11px] text-gray-600 pt-2 border-t border-slate-200 flex justify-between font-medium">
              <span>Allocated Subtotal: <strong>39.5% (₦1,975)</strong></span>
              <span>Company Retained Margin: <strong>0.5% (₦25)</strong></span>
            </div>
          </div>

          {/* Card B: Physical Farm-Slot Allocation Distinction */}
          <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200/80 text-xs text-emerald-950 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-900 block uppercase text-[11px] tracking-wider">
                Farm-Slot Allocation (₦5,000/Slot — No Multilevel MLM)
              </span>
              <Badge className="bg-emerald-200 text-emerald-900 border-emerald-300 text-[10px]">
                Physical Production Asset
              </Badge>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              Purchasing a farm slot creates a physical agricultural production asset and does <strong>not</strong> enter the 7-level multilevel commission engine.
            </p>
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
        </div>
      </div>

      {/* ── INTERACTIVE EARNINGS CALCULATOR ── */}
      <NetworkCalculatorCard
        eyebrowIcon={Calculator}
        eyebrowText="Consumer Earnings Forecaster"
        title="Interactive Multilevel Retail Forecaster"
        description="Estimate your monthly recurring harvest bonuses when your consumer community purchases eligible retail packages (such as Mushroom Power 500g)."
        controls={
          <div className="space-y-1">
            <label className="text-[10px] text-emerald-200 font-semibold block">Orders / Member:</label>
            <select
              value={calcOrdersPerMember}
              onChange={(e) => setCalcOrdersPerMember(Number(e.target.value))}
              className="bg-emerald-950 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/40 cursor-pointer w-full"
            >
              {[1, 2, 3, 4, 5, 10, 20].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? "Product" : "Products"} (₦{(num * 5000).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        }
        metrics={[
          {
            label: "Level 1 (5 Members)",
            value: `₦${(1250 * calcOrdersPerMember).toLocaleString()}`,
            subtext: "₦250/product",
          },
          {
            label: "Level 2 (25 Members)",
            value: `₦${(4375 * calcOrdersPerMember).toLocaleString()}`,
            subtext: "₦175/product",
          },
          {
            label: "Level 3 (125 Members)",
            value: `₦${(18750 * calcOrdersPerMember).toLocaleString()}`,
            subtext: "₦150/product",
          },
          {
            label: "Levels 1–3 Cumulative",
            value: `₦${((1250 + 4375 + 18750) * calcOrdersPerMember).toLocaleString()}`,
            subtext: "Across 155 members",
            isHighlight: true,
          },
        ]}
        complianceNotice="AgroHeal is an agricultural cooperative, not an investment platform. Multilevel retail simulations represent cooperative community purchase cashbacks and referral royalties on authentic farm produce, not fixed returns or guaranteed investment yields."
      />

      {/* ── CONSUMER MARKETPLACE PREVIEW (COMING SOON) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Coming Soon
              </span>
              <span className="text-xs text-gray-500 font-medium">• Consumer Produce Catalog</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mt-2">
              Retail Produce Marketplace Preview
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Direct-to-consumer store where public buyers order authentic mushroom and ginger health products.
            </p>
          </div>

          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-3 py-1 self-start sm:self-auto">
            40% Payout Ceiling Enabled
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {UPCOMING_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl p-5 border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-100/80 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {prod.tag}
                  </span>
                  <span className="text-[11px] font-medium text-gray-500">
                    {prod.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-gray-900 text-base">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {prod.desc}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-500">Retail Price</span>
                  <span className="text-lg font-black text-gray-900">
                    ₦{prod.price.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Direct Seller</span>
                    <strong className="text-emerald-800">₦{prod.directCommission.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">7-Tier Upline</span>
                    <strong className="text-emerald-800">₦{prod.uplinePool.toLocaleString()}</strong>
                  </div>
                </div>

                <Button
                  disabled
                  className="w-full h-9 bg-gray-100 text-gray-400 font-semibold text-xs rounded-xl cursor-not-allowed"
                >
                  Marketplace Launching Soon
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Regulatory & Non-Investment Notice */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3.5 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-amber-200/80 border border-amber-300 flex items-center justify-center shrink-0 text-amber-900">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <strong className="text-amber-950 block mb-0.5 font-bold">Regulatory Compliance Notice — We Are Not An Investment Platform:</strong>
          AgroHeal Solutions Ltd is an agricultural cooperative and direct consumer goods distribution network, <strong>not an investment company, financial institution, or collective investment scheme (CIS)</strong>. Projections and earnings calculations shown above are mathematical simulations for illustrative purposes based on verified consumer product retail sales and active member personal qualifying volume (PQV), not guaranteed passive income or fixed financial interest.
        </div>
      </div>
    </div>
  );
};

export default ConsumerNetwork;
