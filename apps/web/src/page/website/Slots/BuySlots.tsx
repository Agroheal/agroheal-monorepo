import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sprout,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  Minus,
  Plus,
  Calendar,
  Package,
  Shield,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  BASE_SLOT_PRICE,
  CLUSTER_SETUP_FEE,
  STARTER_SLOT_TOTAL,
  SUBSEQUENT_SLOT_PRICE,
  GREEN_CARD_FEE,
  calculateSlotSubtotal,
  formatNaira,
} from "@shared/businessRules";
import RegulatoryNotice from "@/components/webComponents/RegulatoryNotice";

export default function BuySlots() {
  const navigate = useNavigate();
  const [slotQuantity, setSlotQuantity] = useState(1);
  const [hasPriorSlots, setHasPriorSlots] = useState<boolean | null>(null);
  const [hasGreenCard, setHasGreenCard] = useState<boolean | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Check user's active Green Card & prior slots
  useEffect(() => {
    let isMounted = true;
    const checkUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setLoadingProfile(false);
          return;
        }

        // 1. Check prior slots
        const { count, data: slotsData } = await supabase
          .from("slot_subscriptions")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "active");

        const userOwnsSlots = Boolean(
          (count && count > 0) || (slotsData && slotsData.length > 0)
        );

        // 2. Check active Green Card subscription across all plans
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("expires_at, status, plan")
          .eq("user_id", user.id)
          .eq("status", "active");

        const userHasGreenCard = Boolean(
          subs &&
            subs.some(
              (s) => !s.expires_at || new Date(s.expires_at).getTime() > Date.now()
            )
        );

        if (isMounted) {
          setHasPriorSlots(userOwnsSlots);
          setHasGreenCard(userHasGreenCard);
          setLoadingProfile(false);
        }
      } catch (err) {
        console.error("Error checking user slots and green card:", err);
        if (isMounted) setLoadingProfile(false);
      }
    };

    checkUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  const isEligibleForSubsequentRate = hasPriorSlots === true;
  const { subtotal: slotsSubtotal, setupFee, baseSlotCost } = calculateSlotSubtotal(
    slotQuantity,
    isEligibleForSubsequentRate,
  );

  // Only charge Green Card fee if we are sure the user doesn't have one
  const greenCardFee = !loadingProfile && hasGreenCard === false ? GREEN_CARD_FEE : 0;
  const estimatedOrderTotal = slotsSubtotal + greenCardFee;

  const incrementSlots = () => setSlotQuantity((prev) => Math.min(prev + 1, 50));
  const decrementSlots = () => setSlotQuantity((prev) => Math.max(prev - 1, 1));

  const handleProceedToCheckout = () => {
    navigate(
      `/dashboard/checkout?category=${encodeURIComponent(
        "Mushroom Village",
      )}&slots=${slotQuantity}`,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Direct Farm Asset Ownership</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Browse &amp; Buy Farm Slots
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-1 max-w-2xl">
              Acquire verified biological production units in fully managed farms.
              First-time slots are bundled with cluster onboarding, and all extra slots are ₦5,000 each. Zero recurring monthly maintenance fees.
            </p>
          </div>

          {/* Manage My Farm Slots button (ONLY shown when we are sure the user has slots) */}
          {!loadingProfile && hasPriorSlots === true && (
            <div className="flex items-center gap-3">
              <Link to="/dashboard/farm-operations/my-slots">
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-white text-gray-700 font-medium text-xs sm:text-sm"
                >
                  Manage My Farm Slots
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Green Card Membership Notice Banner (ONLY shown when we are sure user does not have a Green Card) */}
        {!loadingProfile && hasGreenCard === false && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-200/80 border border-amber-300 flex items-center justify-center shrink-0 text-amber-950 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-xs sm:text-sm space-y-1">
              <strong className="font-bold text-amber-950 block">
                Green Card Membership Required (₦2,000 / year)
              </strong>
              <p className="text-amber-900/90 leading-relaxed">
                To access production cluster oversight, farm transparency ledgers, and harvest distributions, an active Agroheal Green Card is required.
                If you don't have one active yet, <strong>the ₦2,000 Green Card fee will be automatically bundled at checkout</strong> so you can complete everything in a single step!
              </p>
            </div>
          </div>
        )}

        {/* Status Notice Banner if Returning Member */}
        {!loadingProfile && isEligibleForSubsequentRate && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-emerald-900">
                Returning Member Rate Unlocked!
              </span>
              <p className="text-emerald-700 text-xs mt-0.5">
                Because you have already completed your initial cluster onboarding, all additional
                slots are priced at the direct base rate of{" "}
                <strong>{formatNaira(SUBSEQUENT_SLOT_PRICE)} / slot</strong> with no cluster setup fee.
              </p>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Card 1: Organic Oyster Mushroom (ACTIVE) */}
          <div className="lg:col-span-1 rounded-2xl bg-white border-2 border-emerald-500/80 shadow-md hover:shadow-xl transition-all relative overflow-hidden flex flex-col">
            {/* Top Accent Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge className="bg-emerald-400/30 text-emerald-50 border-emerald-300/40 text-xs font-semibold px-2.5 py-0.5 backdrop-blur-sm">
                  Active Now 🟢
                </Badge>
                <span className="text-[11px] font-semibold text-emerald-200">
                  Immediate Allocation
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-300" />
                Mushroom Village
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                Commercial Oyster mushroom cultivation in climate-monitored fruiting houses.
              </p>
            </div>

            {/* Price HUD */}
            <div className="px-6 py-4 bg-emerald-50/40 border-b border-emerald-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-950">
                  {isEligibleForSubsequentRate
                    ? formatNaira(SUBSEQUENT_SLOT_PRICE)
                    : formatNaira(STARTER_SLOT_TOTAL)}
                </span>
                <span className="text-xs font-medium text-emerald-700">
                  {isEligibleForSubsequentRate
                    ? "per slot"
                    : "1st Slot Starter Package"}
                </span>
              </div>

              {!isEligibleForSubsequentRate && (
                <div className="mt-2 text-[11px] text-gray-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>1st Slot Bundled Cost:</span>
                    <span className="font-semibold text-gray-800">
                      {formatNaira(STARTER_SLOT_TOTAL)} (₦5k Slot + ₦5k Cluster Setup)
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-semibold pt-1">
                    <span>All Extra Slots:</span>
                    <span>{formatNaira(SUBSEQUENT_SLOT_PRICE)} each</span>
                  </div>
                </div>
              )}
            </div>

            {/* Specifications & Highlights */}
            <div className="p-6 space-y-4 flex-1">
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex items-start gap-2.5">
                  <Package className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">2 Inoculated Fruiting Bags</strong> per slot
                    at initiation.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Cycle 1 Doubling:</strong> Capacity doubles
                    to 4 bags per slot during the initial expansion cycle.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">60–90 Day Harvest:</strong> Continuous multi-flush
                    harvesting managed by verified cluster coordinators.
                  </div>
                </div>
              </div>

              {/* Slot Quantity Selector */}
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                  Select Number of Slots
                </label>
                <div className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={decrementSlots}
                      disabled={slotQuantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-gray-900 text-base">
                      {slotQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={incrementSlots}
                      disabled={slotQuantity >= 50}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-gray-500">
                      Total Production Units:
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      {slotQuantity * 2} Fruiting Bags
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Price Breakdown at Checkout */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-gray-700">
                  <span>
                    {isEligibleForSubsequentRate
                      ? `${slotQuantity} Slot${slotQuantity > 1 ? "s" : ""} (@ ₦5,000)`
                      : `1st Slot Bundled Starter (₦10,000)`}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatNaira(
                      isEligibleForSubsequentRate
                        ? slotQuantity * SUBSEQUENT_SLOT_PRICE
                        : STARTER_SLOT_TOTAL,
                    )}
                  </span>
                </div>

                {!isEligibleForSubsequentRate && slotQuantity > 1 && (
                  <div className="flex justify-between items-center text-gray-700">
                    <span>+ {slotQuantity - 1} Extra Slot{slotQuantity > 2 ? "s" : ""} (@ ₦5,000)</span>
                    <span className="font-semibold text-gray-900">
                      {formatNaira((slotQuantity - 1) * SUBSEQUENT_SLOT_PRICE)}
                    </span>
                  </div>
                )}

                {!loadingProfile && hasGreenCard === false && (
                  <div className="flex justify-between items-center text-amber-900 font-medium pt-1 border-t border-emerald-200/50">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-700" />
                      Green Card Membership (Auto-added):
                    </span>
                    <span>{formatNaira(GREEN_CARD_FEE)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between font-bold text-emerald-950 text-sm">
                  <span>Estimated Checkout Total:</span>
                  <span>{formatNaira(estimatedOrderTotal)}</span>
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-[#d17547] hover:bg-[#bd6336] text-white font-semibold h-11 rounded-xl shadow-sm hover:shadow"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Card 2: Ginger Town (COMING SOON) */}
          <div className="lg:col-span-1 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden flex flex-col opacity-90 hover:opacity-100 transition-all">
            {/* Top Header */}
            <div className="bg-gradient-to-r from-amber-700 to-orange-800 p-5 text-white">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge className="bg-amber-400/30 text-amber-50 border-amber-300/40 text-xs font-semibold px-2.5 py-0.5 backdrop-blur-sm">
                  Coming Soon 🟡
                </Badge>
                <span className="text-[11px] font-semibold text-amber-200">
                  Next Season Planting
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-300" />
                Ginger Town
              </h2>
              <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
                High-potency organic ginger rhizomes with chili pepper bio-protective intercrop.
              </p>
            </div>

            {/* Price Preview */}
            <div className="px-6 py-4 bg-amber-50/40 border-b border-amber-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-950">
                  {formatNaira(BASE_SLOT_PRICE)}
                </span>
                <span className="text-xs font-medium text-amber-700">
                  per farm slot
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Land preparation and solar drip-irrigation borehole installation in progress.
              </p>
            </div>

            {/* Highlights */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">6–8 Month Maturation:</strong> Deep root
                    organic cultivation with dedicated solar-powered borehole irrigation.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Sprout className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Intercrop Protection:</strong> Natural pest
                    deterrence using organic chili pepper perimeter hedging.
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 text-center font-medium">
                  Allocation opens once field irrigation tests are completed.
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Organic Food Nation (COMING SOON) */}
          <div className="lg:col-span-1 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden flex flex-col opacity-80 hover:opacity-100 transition-all">
            {/* Top Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-5 text-white">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge className="bg-slate-500/30 text-slate-100 border-slate-400/40 text-xs font-semibold px-2.5 py-0.5 backdrop-blur-sm">
                  Coming Soon ⚪
                </Badge>
                <span className="text-[11px] font-semibold text-slate-300">
                  Land Incubation
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Sprout className="w-5 h-5 text-slate-300" />
                Organic Food Nation
              </h2>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                1 Million Hectares Against Hunger — Broad-acre staple grains and organic produce.
              </p>
            </div>

            {/* Price Preview */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatNaira(BASE_SLOT_PRICE)}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  per production unit
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Phase 1 land aggregation and soil bio-enrichment currently underway.
              </p>
            </div>

            {/* Highlights */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Large-Scale Grain Reserves:</strong> Organic
                    maize, soya, and local grain production clusters.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Food Security Mandate:</strong> Strategic
                    commodity aggregation for direct wholesale and local processing.
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 text-center font-medium">
                  Acreage onboarding announcements will be posted on the dashboard.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory & Platform Compliance Notice */}
        <RegulatoryNotice linkHref="/dashboard/legal#terms" />
      </div>
    </div>
  );
}
