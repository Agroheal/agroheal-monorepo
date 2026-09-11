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
  ChevronDown,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/apiClient";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NetworkCalculatorCard from "@/components/network/NetworkCalculatorCard";
import RegulatoryNotice from "@/components/webComponents/RegulatoryNotice";
import {
  MATRIX_COMMISSIONS_TIERS,
  getUnlockedMatrixLevel,
  formatNaira,
  TOTAL_POTENTIAL_MATRIX_COMMISSIONS,
} from "@shared/businessRules";

export const MATRIX_COMMISSIONS = MATRIX_COMMISSIONS_TIERS;
export { getUnlockedMatrixLevel };

const UPCOMING_PRODUCTS = [
  {
    id: "prod-1",
    name: "AgroHeal Mushroom Break",
    subtitle: "Mushroom-Enriched Sweet-Corn Flakes",
    tagline: "Break Fast. Break Better.",
    category: "Functional Breakfast Cereals",
    image: "/products/mushroom-break.jpg",
    price: 4500,
    directCommission: 540,
    uplinePool: 967.5,
    tag: "Enriched Breakfast",
    desc: "Crispy sweet-corn flakes fortified with organically grown oyster mushroom extract. A nourishing, nutrient-dense breakfast for home, school, and work.",
    inStock: "Coming Soon",
  },
  {
    id: "prod-2",
    name: "AgroHeal Mushroom Power (100g)",
    subtitle: "100% Pure Oyster Mushroom Powder",
    tagline: "Nourish Every Meal",
    category: "Functional Superfood Nutrition",
    image: "/products/mushroom-power.jpg",
    price: 5000,
    directCommission: 600,
    uplinePool: 1075,
    tag: "Flagship Superfood",
    desc: "Pure, natural 100% oyster mushroom powder rich in essential beta-glucans, plant proteins, and immune-supporting antioxidants. Perfect for meals and smoothies.",
    inStock: "Welcome Product",
  },
  {
    id: "prod-3",
    name: "Fortified Ginger & Mushroom Elixir Tea",
    subtitle: "Synergistic Immune Defense Blend",
    tagline: "For Daily Immune Defense",
    category: "Wellness Herbal Infusions",
    image: "/products/ginger-mushroom-tea.jpg",
    price: 3500,
    directCommission: 420,
    uplinePool: 752.5,
    tag: "Herbal Synergy",
    desc: "Synergistic blend of organically harvested gingertown root extract and vitality oyster mushrooms for daily immune defense and vitality.",
    inStock: "Coming Soon",
  },
];

export const ConsumerNetwork: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [directReferralsCount, setDirectReferralsCount] = useState<number>(0);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(0);
  const [calcOrdersPerMember, setCalcOrdersPerMember] = useState<number>(1);
  const [commissionTableOpen, setCommissionTableOpen] = useState(false);

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

          {/* Qualification & Potential Matrix Dividends Card */}
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
                  ₦12,212,500
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-200">
                Potential Matrix Dividends Notice
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-relaxed">
                Up to <strong className="text-white font-semibold">₦12,212,500</strong> in potential community commissions are accessible across your 7 matrix tiers. Unlocked tiers credit directly into your Member Wallet. Sponsor direct partners to expand your payout depth.
              </p>
            </div>

            <div className="pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-[11px] text-emerald-100/90">
                {unlockedLevel < 7 ? (
                  <span>
                    Sponsor <strong className="text-amber-300">{5 - (directReferralsCount % 5)} more</strong> to unlock Level {unlockedLevel + 1}
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold">★ All 7 Matrix Levels Unlocked!</span>
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

      {/* ── SECTION 1: RETAIL PRODUCE MARKETPLACE PREVIEW (NOW FIRST SECTION!) ── */}
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
              className="rounded-2xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50/50 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Product Packaging Image */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-emerald-950/5 border-b border-gray-100">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-emerald-950/80 backdrop-blur-md text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                  {prod.tag}
                </span>
                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
                  {prod.inStock}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                      {prod.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base leading-snug">
                      {prod.name}
                    </h4>
                    {prod.subtitle && (
                      <p className="text-xs font-medium text-emerald-700 mt-0.5">
                        {prod.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
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
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: 7-LEVEL COMMISSION ENGINE (FOLDABLE, FOLDED BY DEFAULT) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/90 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
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

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommissionTableOpen(!commissionTableOpen)}
              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs rounded-xl gap-1.5 h-9"
            >
              <span>{commissionTableOpen ? "Hide Commission Structure" : "Show Commission Structure"}</span>
              <ChevronDown
                className={`w-4 h-4 text-emerald-700 transition-transform duration-200 ${
                  commissionTableOpen ? "rotate-180" : ""
                }`}
              />
            </Button>

            <Link
              to="/dashboard/compound-referrals"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors h-9"
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Producer Matrix</span>
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
                      <th className="py-3.5 px-4">Payout Per ₦5k Product</th>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SECTION 3: INTERACTIVE EARNINGS CALCULATOR ── */}
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
      />

      {/* Statutory Regulatory & Non-Investment Notice */}
      <RegulatoryNotice linkHref="/dashboard/legal#terms" />
    </div>
  );
};

export default ConsumerNetwork;
