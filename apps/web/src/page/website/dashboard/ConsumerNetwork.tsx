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
  Award,
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
  TOTAL_POTENTIAL_MATRIX_COMMISSIONS,
  isLegacyMember,
} from "@shared/businessRules";

export const MATRIX_COMMISSIONS = MATRIX_COMMISSIONS_TIERS;
export { getUnlockedMatrixLevel };

const UPCOMING_PRODUCTS = [
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
  const [hasGreenCard, setHasGreenCard] = useState<boolean>(true);
  const [hasStarterPack, setHasStarterPack] = useState<boolean>(true);
  const [isLegacyNeedsMushroomPower, setIsLegacyNeedsMushroomPower] = useState<boolean>(false);
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

      // Check Green Card & Slot Status
      const [{ data: prof }, { data: greenCardSub }, { count: slotCount }] = await Promise.all([
        supabase
          .from("profiles")
          .select("member_id, is_legacy, has_purchased_starter_pack, created_at")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("subscriptions")
          .select("expires_at")
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("plan", "green_card")
          .maybeSingle(),
        supabase
          .from("slot_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "ACTIVE"),
      ]);

      const isCardActive = Boolean(
        prof?.member_id ||
          (greenCardSub &&
            (!greenCardSub.expires_at ||
              new Date(greenCardSub.expires_at).getTime() > Date.now())),
      );
      setHasGreenCard(isCardActive);

      const isLegacy = Boolean(prof?.is_legacy || isLegacyMember(prof?.created_at));
      const hasPurchasedStarter = Boolean(prof?.has_purchased_starter_pack);
      const slotsHeld = slotCount || 0;

      if (isLegacy && slotsHeld > 0 && !hasPurchasedStarter) {
        setIsLegacyNeedsMushroomPower(true);
        setHasStarterPack(false);
      } else {
        setIsLegacyNeedsMushroomPower(false);
        setHasStarterPack(slotsHeld > 0 || hasPurchasedStarter);
      }

      // 1. Check API qualifications if available (fast-fail)
      try {
        const apiQuals = await apiClient.genealogy.getQualifications({ timeout: 2500 });
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
    return <NetworkSkeleton title="Consumer Network" />;
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
                <Award className="w-3.5 h-3.5" /> 40% Commission Ceiling
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Consumer Network &amp; Retail Commissions
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Distribute value-added agricultural produce to verified consumers. Earn up to <strong>12% direct retail margins</strong> plus recurring <strong>21.5% multilevel upline bonuses across 7 network tiers</strong> on every retail purchase.
            </p>
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

      {/* ── 7-LEVEL PRODUCT COMMISSION BANNER (LEADS TO HOW IT WORKS) ── */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#0c2415] to-[#041d0f] rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 border border-emerald-700/50">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-400/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              7-Level Product Commission Engine
            </span>
            <span className="text-xs text-emerald-200/80 font-medium">• 40% Maximum Payout Ceiling</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Multilevel Product Commission Structure
          </h2>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            Every product sale and starter pack feeds into the 7-level commission engine (21.5% distributed upline). Review the complete compensation architecture and tier progression rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            to="/how-it-works/presentation"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d1ef75] hover:bg-[#c3e35d] text-emerald-950 font-bold text-xs transition-all shadow-sm"
          >
            <Info className="w-4 h-4 text-emerald-900" />
            <span>Read How It Works</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/dashboard/my-network"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>Producer Matrix</span>
          </Link>
        </div>
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
