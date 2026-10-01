import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ArrowDownToLine,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Sprout,
  Users,
  Coins,
  ShieldCheck,
  Building,
  Leaf,
  Calculator,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgrohealImages } from "@/constant/Image";

const MATRIX_TIERS = [
  { level: 1, members: 5, percentage: "5.0%", rewardPerSlot: 250, totalCeiling: 1250, requiredDirects: 0 },
  { level: 2, members: 25, percentage: "3.5%", rewardPerSlot: 175, totalCeiling: 4375, requiredDirects: 1 },
  { level: 3, members: 125, percentage: "3.0%", rewardPerSlot: 150, totalCeiling: 18750, requiredDirects: 2 },
  { level: 4, members: 625, percentage: "2.5%", rewardPerSlot: 125, totalCeiling: 78125, requiredDirects: 3 },
  { level: 5, members: 3125, percentage: "2.5%", rewardPerSlot: 125, totalCeiling: 390625, requiredDirects: 4 },
  { level: 6, members: 15625, percentage: "2.5%", rewardPerSlot: 125, totalCeiling: 1953125, requiredDirects: 5 },
  { level: 7, members: 78125, percentage: "2.5%", rewardPerSlot: 125, totalCeiling: 9765625, requiredDirects: 5 },
];

export default function PresentationGuide() {
  const [calculatorSlotsPerMember, setCalculatorSlotsPerMember] = useState<number>(1);
  const [calculatorActiveTier, setCalculatorActiveTier] = useState<number>(3);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Compute calculated commission based on selected tiers and slots per member
  const calculatedEarnings = MATRIX_TIERS.slice(0, calculatorActiveTier).reduce((acc, tier) => {
    return acc + tier.members * tier.rewardPerSlot * calculatorSlotsPerMember;
  }, 0);

  const totalMembersInTiers = MATRIX_TIERS.slice(0, calculatorActiveTier).reduce((acc, tier) => {
    return acc + tier.members;
  }, 0);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-sans pb-24">
      {/* ── HEADER BANNER ── */}
      <div className="bg-[#0c2415] text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/60 relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to How It Works
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-700/60 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            Official Text Presentation &amp; Compensation Guide
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            AgroHeal Green Card Ecosystem: The Plain-Language Presentation
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-3xl">
            This document delivers the full visual and operational text version of our official community
            presentation deck. It covers our Learn-Practice-Earn model, agricultural production clusters,
            the 5×7 matrix commission schedules, and our strict non-investment guardrails.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="/documents/AgroHeal_Green_Card_Presentation.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d1ef75] hover:bg-[#bce055] text-emerald-950 font-bold text-xs shadow-sm transition-all"
            >
              <span>Download Official Presentation (PDF)</span>
              <ArrowDownToLine className="w-4 h-4" />
            </a>

            <Link
              to="/how-it-works/locked-withdrawals"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              <span>Understanding Locked Reserves Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-12">
        {/* ── CHAPTER 1: THE CORE ARCHITECTURE ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Module 01
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
              The LEAP Framework: Learn, Practice, Earn
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Transforming traditional subsistence agriculture into an organized, high-yield community value chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-800">STEP 1</span>
              <h3 className="font-bold text-gray-900 text-base">Learn (Green Card)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Activate your lifetime <strong>₦2,000 digital Green Card</strong>. Access permanent video training
                modules covering organic biopesticides, substrate formulation, soil recovery, and agribusiness principles.
                Earn ₦1,000 instant referral bonus on direct invitations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-800">STEP 2</span>
              <h3 className="font-bold text-gray-900 text-base">Practice (Wealth Creation)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Activate production with the mandatory <strong>₦10,000 Starter Package</strong>: ₦5,000 Mushroom Power 100g
                welcome health product + ₦5,000 compulsory first farm slot (2 fruiting bags). Additional farm slots can be
                secured at ₦5,000 each with zero recurring maintenance fees.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-800">STEP 3</span>
              <h3 className="font-bold text-gray-900 text-base">Earn (Harvests &amp; Matrix)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                In Cycle 1 (Months 1–3), biological harvest proceeds double your capacity from 2 to 4 bags per slot.
                From Cycle 2 onward, receive up to <strong>40% quarterly surplus dividends</strong> based on realized
                supermarket off-take sales, alongside 7-tier community matrix commissions.
              </p>
            </div>
          </div>
        </div>

        {/* ── CHAPTER 2: FLAGSHIP PRODUCTION CLUSTERS ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Module 02
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
              Commercial Agricultural Clusters
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Practical, managed farm clusters backed by institutional off-take and supermarket agreements.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#0c2415] text-white border border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#d1ef75] uppercase tracking-wider">
                  Active Flagship Hub
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200">
                  Open For Slots
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">Mushroom Village (High-Frequency Produce)</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Commercial production of premium organic Oyster Mushrooms. Mushrooms have a 90-day rapid production
                cycle. In Cycle 1 (Months 1–3), starter bags double from 2 to 4 without extra capital. In Cycle 2 and beyond,
                4 bags produce ~4kg of fresh harvest per slot, delivering up to 40% estimated quarterly dividends
                derived from supermarket off-taker sales.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">
                  Cluster 02 · Funded via Mushroom Cycle 2
                </span>
                <h4 className="font-bold text-sm text-gray-900">Ginger Town (Export Spice Market)</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Commercial organic ginger cultivation utilizing advanced drip-irrigation infrastructure. Sustained
                  and financed directly from proceeds generated by Mushroom Village Cycle 2+.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                  Cluster 03 · Integrated Farm-to-Table
                </span>
                <h4 className="font-bold text-sm text-gray-900">Organic FoodNation</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Mass organic staple crop production (plantain, nutrient-dense grains, vegetables) engineered to
                  eliminate middlemen by routing farm outputs directly into retail consumer cooperative stores.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── CHAPTER 3: THE 5×7 COMMUNITY MATRIX & INTERACTIVE CALCULATOR ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Module 03
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
              The 5×7 Community Matrix Compensation Structure
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              A mathematically stable 7-tier pipeline distributing 40% statutory commission on every secured farm slot.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Every member position in the AgroHeal tree can directly hold 5 front-line partners (Legs 1 through 5).
              Any additional partner introduced by you or your upline spills over automatically into the next available
              position in your 7 tiers, ensuring collective downline progression.
            </p>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0c2415] text-white">
                  <tr>
                    <th className="p-3 font-semibold">Tier</th>
                    <th className="p-3 font-semibold">Max Members</th>
                    <th className="p-3 font-semibold">Statutory %</th>
                    <th className="p-3 font-semibold">Reward / Slot</th>
                    <th className="p-3 font-semibold text-right">Potential Tier Ceiling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {MATRIX_TIERS.map((t) => (
                    <tr key={t.level} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-3 font-bold text-emerald-950 font-mono">Tier {t.level}</td>
                      <td className="p-3 font-mono">{t.members.toLocaleString()}</td>
                      <td className="p-3 font-semibold text-emerald-800">{t.percentage}</td>
                      <td className="p-3 font-mono">₦{t.rewardPerSlot}</td>
                      <td className="p-3 font-mono font-bold text-right text-gray-900">
                        ₦{t.totalCeiling.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 font-bold text-emerald-950 border-t-2 border-emerald-300">
                    <td className="p-3" colSpan={4}>
                      Cumulative 7-Tier Total Potential Commission
                    </td>
                    <td className="p-3 font-mono text-right text-base font-black text-emerald-950">
                      ₦12,212,500
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Interactive Matrix Calculator */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-800" />
                <h3 className="font-bold text-sm text-gray-900">Interactive Community Matrix Calculator</h3>
              </div>
              <p className="text-xs text-gray-600">
                Adjust the tier depth and average slots held per member to preview illustrative community commissions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Calculate Up to Tier: <strong className="text-emerald-900">Tier {calculatorActiveTier}</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={calculatorActiveTier}
                    onChange={(e) => setCalculatorActiveTier(Number(e.target.value))}
                    className="w-full accent-emerald-800 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                    <span>Tier 1 (5)</span>
                    <span>Tier 4 (625)</span>
                    <span>Tier 7 (78,125)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Average Slots Held Per Member:{" "}
                    <strong className="text-emerald-900">{calculatorSlotsPerMember} Slot(s)</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={calculatorSlotsPerMember}
                    onChange={(e) => setCalculatorSlotsPerMember(Number(e.target.value))}
                    className="w-full accent-emerald-800 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                    <span>1 Slot (₦5k)</span>
                    <span>5 Slots</span>
                    <span>10 Slots</span>
                  </div>
                </div>
              </div>

              {/* Calculator Output */}
              <div className="p-4 rounded-xl bg-white border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Calculated Downline Pipeline
                  </span>
                  <p className="text-xs text-gray-700 mt-0.5">
                    {totalMembersInTiers.toLocaleString()} members across Tiers 1–{calculatorActiveTier}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Estimated Commissions
                  </span>
                  <p className="text-2xl font-black font-mono text-emerald-950">
                    ₦{calculatedEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CHAPTER 4: PRODUCT SALES WATERFALL (7 TIERS DEEP) ── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              Module 04
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
              Repeat Product Sales Waterfall (7 Levels Deep)
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Every repeat product order (e.g. Mushroom Power, Ginger powder, biopesticides) disburses across 7 tiers.
            </p>
          </div>

          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            Direct referral bonuses are not one-off events. Whenever any member anywhere in your 7-level deep downline
            repurchases retail health products or organic farm inputs, statutory commissions cascade up:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-mono font-bold text-emerald-800">LEVEL 1</span>
              <p className="text-base font-black text-gray-900 font-mono mt-0.5">5.0%</p>
              <span className="text-[10px] text-gray-500">₦250 on ₦5k product</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-mono font-bold text-emerald-800">LEVEL 2</span>
              <p className="text-base font-black text-gray-900 font-mono mt-0.5">3.5%</p>
              <span className="text-[10px] text-gray-500">₦175 on ₦5k product</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-mono font-bold text-emerald-800">LEVEL 3</span>
              <p className="text-base font-black text-gray-900 font-mono mt-0.5">3.0%</p>
              <span className="text-[10px] text-gray-500">₦150 on ₦5k product</span>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-[10px] font-mono font-bold text-emerald-800">LEVELS 4–7</span>
              <p className="text-base font-black text-gray-900 font-mono mt-0.5">2.5% each</p>
              <span className="text-[10px] text-gray-500">₦125 on ₦5k product</span>
            </div>
          </div>
        </div>

        {/* ── CHAPTER 5: CALL TO ACTION & STATUTORY DISCLAIMER ── */}
        <div className="bg-[#0c2415] text-white rounded-3xl p-6 sm:p-8 border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Ready to Begin Your Agribusiness Pathway?</h3>
            <p className="text-xs text-emerald-200/90 max-w-md">
              Activate your lifetime Green Card credential (₦2,000) or enroll directly with the ₦10,000 Starter Package.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-[#d1ef75] hover:bg-[#bce055] text-emerald-950 font-bold text-xs rounded-xl h-10 px-5 shadow-xs"
            >
              <Link to="/signup">
                <span>Register with AgroHeal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
