import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Sprout,
  Coins,
  Sparkles,
  CheckCircle2,
  Building,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgrohealImages } from "@/constant/Image";

interface HowItWorksContentProps {
  variant?: "public" | "dashboard" | "modal";
  onNavigate?: () => void;
}

export default function HowItWorksContent({
  variant = "public",
  onNavigate,
}: HowItWorksContentProps) {
  const [activeTab, setActiveTab] = useState<"pillars" | "clusters" | "tiers">(
    "pillars",
  );

  const isModal = variant === "modal";
  const isDashboard = variant === "dashboard" || isModal;

  const pillars = [
    {
      step: "01",
      icon: BookOpen,
      title: "1. Learn",
      tagline: "Master Organic Production",
      description:
        "Activate your lifetime digital Green Card (₦2,000) to unlock comprehensive organic farming curricula. Learn soil regeneration, biopesticides, and commercial techniques from proven agronomists.",
      highlights: [
        "Lifetime Green Card Membership",
        "Step-by-Step Video Blueprints",
        "Direct Referral Commission Rights",
      ],
      accent: "border-green-600/30 bg-white",
      badge: "bg-green-100 text-green-800",
      actionText: isDashboard ? "Explore LEAP Courses" : "Get Started (₦2,000)",
      actionLink: isDashboard
        ? "/dashboard/courses"
        : "/signup?redirect=/dashboard/green-card",
    },
    {
      step: "02",
      icon: Sprout,
      title: "2. Practice",
      tagline: "Wealth Creation & Farm Slots",
      description:
        "Activate Wealth Creation membership with our ₦10,000 dual activation package: ₦5,000 Mushroom Power welcome product + ₦5,000 compulsory first farm slot. Add more slots at ₦5,000 each with zero recurring maintenance fees.",
      highlights: [
        "₦10,000 Dual Activation (₦5k Product + ₦5k Slot)",
        "Optional Additional Slots at ₦5,000 Each",
        "Zero Ongoing Monthly Utility Dues",
      ],
      accent: "border-amber-500/30 bg-white",
      badge: "bg-amber-100 text-amber-800",
      actionText: isDashboard ? "Manage Farm Slots" : "Activate Wealth (₦10,000)",
      actionLink: isDashboard
        ? "/dashboard/slots-subscription"
        : "/signup?redirect=/dashboard/checkout",
    },
    {
      step: "03",
      icon: Coins,
      title: "3. Earn",
      tagline: "Harvest Distributions & Dividends",
      description:
        "In Cycle 1 (Months 1–3), harvest is reinvested to double biological capacity (2 to 4 mature fruiting bags per slot). From Cycle 2 onward, receive up to 40% quarterly harvest surplus distributions credited directly to your withdrawable wallet.",
      highlights: [
        "Cycle 1 Capacity Doubling (2 ➔ 4 Bags in 3 Months)",
        "Up to 40% Projected Quarterly Harvest Returns (Cycle 2 Onward)",
        "Established Institutional & Supermarket Off-Takers",
      ],
      accent: "border-emerald-600/30 bg-white",
      badge: "bg-emerald-100 text-emerald-800",
      actionText: isDashboard ? "View Wallet & Ledger" : "Join Cooperative",
      actionLink: isDashboard
        ? "/dashboard/transactions"
        : "/signup",
    },
  ];

  const clusters = [
    {
      title: "Mushroom Village",
      tag: "High-Frequency Produce",
      image: AgrohealImages.Mushroom,
      description:
        "Commercial production of high-value Oyster Mushrooms. Activated via the ₦10,000 Wealth Creation package (₦5,000 Mushroom Power product + ₦5,000 first slot; additional slots ₦5,000 each). Starter bags double from 2 to 4 in Cycle 1 (Months 1–3), delivering up to 40% estimated quarterly dividends from Cycle 2 onward based on realized harvest sales.",
      stat: "Cycle 1 Doubling + Up to 40% Quarterly Dividends",
      icon: TrendingUp,
    },
    {
      title: "Organic FoodNation",
      tag: "Integrated Food Cluster",
      image: AgrohealImages.HowItWorksOne,
      description:
        "Mass organic food production combining nutrient-dense vegetables, grains, plantain, and on-farm biopesticides. Eliminates middlemen by routing produce directly to Farm-to-Table supermarket networks.",
      stat: "Direct Middleman-Free Off-Taker Channels",
      icon: Building,
    },
    {
      title: "Pioneers Gingertown",
      tag: "Funded via Mushroom Cycle 2",
      image: AgrohealImages.HowItWorksTwo,
      description:
        "The active Pioneers Gingertown Group Farm is sustained and financed directly through proceeds from Cycle 2 onwards of our Mushroom Flagship project. Cultivates commercial ginger with drip irrigation for export spice markets.",
      stat: "Cycle 2 Mushroom Reinvestment",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="w-full">
      {/* If in modal mode or compact dashboard view, show responsive navigation tabs */}
      {isModal && (
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("pillars")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "pillars"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            The 3 Pillars
          </button>
          <button
            onClick={() => setActiveTab("clusters")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "clusters"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Farm Clusters
          </button>
          <button
            onClick={() => setActiveTab("tiers")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "tiers"
                ? "bg-white text-emerald-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Membership Tiers
          </button>
        </div>
      )}

      {/* ── Section 1: The 3 Core Pillars (Learn, Practice, Earn) ── */}
      {(!isModal || activeTab === "pillars") && (
        <div className={isModal ? "" : "mb-16"}>
          {!isModal && (
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                The LEAP Model
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Learn, Practice, Earn
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                A transparent, step-by-step cooperative pathway from practical agribusiness learning to harvesting returns.
              </p>
            </div>
          )}

          <div
            className={`grid gap-4 sm:gap-6 ${
              isModal
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className={`rounded-2xl p-5 sm:p-6 border shadow-xs transition-all flex flex-col justify-between ${pillar.accent}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-800">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-gray-400">
                        STEP {pillar.step}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${pillar.badge} inline-block mb-2`}
                    >
                      {pillar.tagline}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
                      {pillar.description}
                    </p>

                    <ul className="space-y-2 mb-6 pt-3 border-t border-gray-100">
                      {pillar.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="text-xs text-gray-700 flex items-center gap-2 font-medium"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link to={pillar.actionLink} onClick={onNavigate}>
                    <Button
                      variant={isDashboard ? "outline" : "default"}
                      className={`w-full text-xs font-semibold rounded-xl h-10 ${
                        isDashboard
                          ? "border-emerald-800 text-emerald-900 hover:bg-emerald-50"
                          : "bg-emerald-850 hover:bg-emerald-900 text-white"
                      }`}
                    >
                      <span>{pillar.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 2: Flagship Production Clusters ── */}
      {(!isModal || activeTab === "clusters") && (
        <div className={isModal ? "" : "mb-16"}>
          {!isModal && (
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-emerald-900 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-2">
                Production Clusters
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                3 Flagship Agricultural Clusters
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Practical, managed farm clusters backed by professional off-taker agreements.
              </p>
            </div>
          )}

          <div
            className={`grid gap-4 sm:gap-6 ${
              isModal
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {clusters.map((cluster) => {
              const Icon = cluster.icon;
              return (
                <div
                  key={cluster.title}
                  className="bg-[#051f12] text-white rounded-2xl p-5 sm:p-6 border border-emerald-800/40 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-36 sm:h-40 rounded-xl overflow-hidden mb-4 bg-emerald-950">
                      <img
                        src={cluster.image}
                        alt={cluster.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#d1ef75] bg-[#d1ef75]/10 px-2.5 py-0.5 rounded-full mb-2 inline-block">
                      {cluster.tag}
                    </span>
                    <h3 className="text-lg font-bold mb-2">{cluster.title}</h3>
                    <p className="text-emerald-100/80 text-xs leading-relaxed mb-4">
                      {cluster.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-emerald-900/60 text-[11px] text-[#d1ef75] font-semibold flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cluster.stat}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section 3: Transparent Membership Tiers (₦2,000 vs ₦10,000) ── */}
      {(!isModal || activeTab === "tiers") && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              Membership Structure
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm">
              Distinguishing our educational Green Card from commercial Wealth Creation farm slots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Green Card Card */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-850 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Digital Credential
                  </span>
                  <span className="text-lg font-extrabold text-gray-900">
                    ₦2,000 <span className="text-[11px] font-normal text-gray-500">one-time</span>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Digital Green Card</h3>
                <p className="text-gray-600 text-xs leading-relaxed mb-4">
                  Lifetime educational membership granting full access to digital agribusiness curricula and referral bonuses.
                </p>

                <ul className="space-y-2 text-xs text-gray-700 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Lifetime access to all digital LEAP modules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Instant ₦1,000 referral bonus per direct invite</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Unique verified digital member ID with QR code</span>
                  </li>
                </ul>
              </div>

              <Link
                to={isDashboard ? "/dashboard/green-card" : "/signup?redirect=/dashboard/green-card"}
                onClick={onNavigate}
              >
                <Button
                  variant="outline"
                  className="w-full border-emerald-800 text-emerald-900 hover:bg-emerald-50 text-xs font-semibold rounded-xl h-10"
                >
                  {isDashboard ? "View My Green Card" : "Get Green Card (₦2,000)"}
                </Button>
              </Link>
            </div>

            {/* Wealth Creation & Farm Slot */}
            <div className="bg-[#051f12] text-white rounded-xl p-5 border border-emerald-800 flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 bg-[#d1ef75] px-2 py-0.5 rounded-md">
                    Wealth Creation
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-white">
                      ₦10,000
                    </span>
                    <span className="block text-[10px] text-emerald-200">
                      ₦5k product + ₦5k slot
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Wealth Creation Activation</h3>
                <p className="text-emerald-100/80 text-xs leading-relaxed mb-4">
                  Full production enrollment with welcome product and first practical farm slot.
                </p>

                <ul className="space-y-2 text-xs text-emerald-100 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d1ef75] shrink-0 mt-0.5" />
                    <span>₦5,000 Mushroom Power health welcome product</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d1ef75] shrink-0 mt-0.5" />
                    <span>₦5,000 compulsory first farm slot (2 fruiting bags)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d1ef75] shrink-0 mt-0.5" />
                    <span>Optional additional slots at ₦5,000 each</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d1ef75] shrink-0 mt-0.5" />
                    <span>Cycle 1 biological doubling + up to 40% projected quarterly harvest returns</span>
                  </li>
                </ul>
              </div>

              <Link
                to={isDashboard ? "/dashboard/checkout" : "/signup?redirect=/dashboard/checkout"}
                onClick={onNavigate}
              >
                <Button className="w-full bg-[#d1ef75] hover:bg-[#bce055] text-emerald-950 font-bold text-xs rounded-xl h-10">
                  {isDashboard ? "Subscribe Farm Slots" : "Activate Wealth (₦10,000)"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* Statutory Cooperative & Non-Investment Notice */}
      <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/90 text-gray-600 text-xs sm:text-sm leading-relaxed shadow-xs flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <strong className="text-gray-900 block mb-0.5 font-bold">Non-Investment Policy &amp; Regulatory Notice:</strong>
          AgroHeal Solutions Ltd is an agricultural cooperative and practical agro-education ecosystem, <strong>not an investment platform or financial scheme</strong>. Slot acquisitions directly fund physical biological inputs and managed grow infrastructure. Projected surplus distributions (e.g. <em>&quot;up to 40%&quot;</em>) represent estimated commodity dividends derived from real biological harvests and supermarket/off-taker sales, not guaranteed fixed financial interest.
        </div>
      </div>
    </div>
  );
}
