import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Sprout,
  Coins,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Building,
  TrendingUp,
  CreditCard,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/webComponents/CTASection";
import { AgrohealImages } from "@/constant/Image";

export default function HowItWorks() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Banner */}
          <motion.div
            {...fadeUp(0.1)}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green-100 text-green-850 text-xs font-semibold tracking-wide uppercase mb-4 border border-green-200">
              <Sparkles className="w-3.5 h-3.5 text-green-750" />
              The LEAP Framework
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-green-950 tracking-tight mb-6"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              How Agroheal Works
            </h1>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
              We bring practical agribusiness education, collaborative group
              farming, and commercial off-taker networks together into one seamless
              platform: <strong>Learn, Practice, Earn</strong>.
            </p>
          </motion.div>

          {/* 3 Pillars: Learn, Practice, Earn */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {[
              {
                step: "01",
                icon: BookOpen,
                title: "1. Learn",
                tagline: "Master Organic Production",
                description:
                  "Activate your lifetime digital Green Card (₦2,000) to access comprehensive digital curriculum. Learn organic compost formulation, biopesticides, and crop management directly from practical agronomists.",
                highlights: [
                  "Lifetime Green Card Membership",
                  "Video Blueprints & Practical Guides",
                  "Direct Referral Commission Rights",
                ],
                accent: "border-green-600/30 bg-white",
                badge: "bg-green-100 text-green-800",
              },
              {
                step: "02",
                icon: Sprout,
                title: "2. Practice",
                tagline: "Wealth Creation & Farm Slots",
                description:
                  "Activate Wealth Creation membership with our ₦10,000 dual activation package: ₦5,000 Mushroom Power welcome product + ₦5,000 compulsory first farm slot. Additional slots are ₦5,000 each with zero recurring maintenance fees.",
                highlights: [
                  "₦10,000 Dual Activation (₦5k Product + ₦5k Slot)",
                  "Optional Additional Slots at ₦5,000 Each",
                  "Zero Ongoing Monthly Utility Dues",
                ],
                accent: "border-amber-500/30 bg-white",
                badge: "bg-amber-100 text-amber-800",
              },
              {
                step: "03",
                icon: Coins,
                title: "3. Earn",
                tagline: "Harvest Distributions & Dividends",
                description:
                  "In Cycle 1 (Months 1–3), harvest is reinvested to double capacity (from 2 bags to 4 mature fruiting bags per slot). From Cycle 2 onward, receive 40% quarterly harvest distributions credited directly to your withdrawable wallet.",
                highlights: [
                  "Cycle 1 Capacity Doubling (2 ➔ 4 Bags in 3 Months)",
                  "40% Quarterly Harvest Returns (Cycle 2 Onward)",
                  "Guaranteed Supermarket & Institutional Off-Takers",
                ],
                accent: "border-emerald-600/30 bg-white",
                badge: "bg-emerald-100 text-emerald-800",
              },
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  {...fadeUp(0.2 + idx * 0.1)}
                  className={`rounded-3xl p-8 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${pillar.accent}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-800">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-xs font-bold text-gray-400">
                        STEP {pillar.step}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${pillar.badge} inline-block mb-2`}
                    >
                      {pillar.tagline}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {pillar.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {pillar.description}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-gray-100">
                    {pillar.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-700 flex items-center gap-2 font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Core Agricultural Hubs */}
          <div className="mb-24">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-green-800 border border-green-200 bg-green-50 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-3">
                Production Clusters
              </span>
              <h2
                className="text-3xl md:text-4xl font-extrabold text-gray-900"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Our 3 Flagship Production Models
              </h2>
              <p className="text-gray-600 text-base mt-3">
                Every member chooses from specialized agricultural clusters
                backed by proven agronomic protocols and verified off-taker contracts.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Mushroom Village */}
              <div className="bg-[#031d0f] text-white rounded-3xl p-8 border border-green-800/40 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 bg-slate-900">
                    <img
                      src={AgrohealImages.Mushroom}
                      alt="Mushroom Village"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-[#d1ef75] bg-[#d1ef75]/10 px-3 py-1 rounded-full mb-3 inline-block">
                    High-Frequency Produce
                  </span>
                  <h3 className="text-2xl font-bold mb-3">Mushroom Village</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 font-light">
                    Commercial production of high-value Oyster Mushrooms. Activated via the
                    ₦10,000 Wealth Creation package (₦5,000 Mushroom Power product + ₦5,000
                    first slot; additional slots ₦5,000 each). Starter bags double from 2 to 4
                    mature bags in Cycle 1 (Months 1–3), delivering continuous 40% quarterly
                    harvest distributions from Cycle 2 onward.
                  </p>
                </div>
                <div className="pt-4 border-t border-green-900/60 text-xs text-[#d1ef75] font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Cycle 1 (M1–3) Doubling + 40% Quarterly Dividends</span>
                </div>
              </div>

              {/* Organic FoodNation */}
              <div className="bg-[#031d0f] text-white rounded-3xl p-8 border border-green-800/40 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 bg-slate-900">
                    <img
                      src={AgrohealImages.HowItWorksOne}
                      alt="Organic FoodNation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-[#d1ef75] bg-[#d1ef75]/10 px-3 py-1 rounded-full mb-3 inline-block">
                    Integrated Food Cluster
                  </span>
                  <h3 className="text-2xl font-bold mb-3">Organic FoodNation</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 font-light">
                    Mass organic food production combining vegetables, grains,
                    plantain, and on-farm biopesticides. Eliminates middlemen by
                    routing produce directly to Farm-to-Table supermarket networks.
                  </p>
                </div>
                <div className="pt-4 border-t border-green-900/60 text-xs text-[#d1ef75] font-semibold flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>Direct Middleman-Free Off-Taker Channels</span>
                </div>
              </div>

              {/* Gingertown */}
              <div className="bg-[#031d0f] text-white rounded-3xl p-8 border border-green-800/40 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 bg-slate-900">
                    <img
                      src={AgrohealImages.HowItWorksTwo}
                      alt="Gingertown"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold tracking-wider uppercase text-[#d1ef75] bg-[#d1ef75]/10 px-3 py-1 rounded-full mb-3 inline-block">
                    Export-Grade Spices
                  </span>
                  <h3 className="text-2xl font-bold mb-3">Gingertown</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 font-light">
                    1-Hectare commercial ginger clusters cultivated with drip
                    irrigation and premium organic soil management. Cured,
                    processed, and supplied directly to export and industrial spice markets.
                  </p>
                </div>
                <div className="pt-4 border-t border-green-900/60 text-xs text-[#d1ef75] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Export-Certified Industrial Processing</span>
                </div>
              </div>
            </div>
          </div>

          {/* Membership Tiers Comparison */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-8 md:p-12 shadow-xs mb-24 max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Clear, Transparent Participation
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Understand exactly how Green Card membership differs from practical farm slots.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Green Card Card */}
              <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-2.5 py-1 rounded-md">
                      Digital Credential
                    </span>
                    <span className="text-xl font-extrabold text-gray-900">
                      ₦2,000 <span className="text-xs font-normal text-gray-500">one-time</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Digital Green Card</h3>
                  <p className="text-gray-600 text-xs leading-relaxed mb-6">
                    Lifetime learning membership granting full educational access and referral rights.
                  </p>

                  <ul className="space-y-2.5 text-xs text-gray-700 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Lifetime access to all digital LEAP modules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Instant ₦1,000 bonus per direct Green Card enrollee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Unique verified digital member ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Reinvest earned referral wallet credit into farm slots</span>
                    </li>
                  </ul>
                </div>

                <Link to="/signup?redirect=/dashboard/green-card">
                  <Button variant="outline" className="w-full border-green-800 text-green-900 hover:bg-green-50 font-semibold rounded-xl">
                    Get Green Card
                  </Button>
                </Link>
              </div>

              {/* Wealth Creation & Farm Slot */}
              <div className="bg-green-950 text-white rounded-2xl p-6 border border-green-800 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-950 bg-[#d1ef75] px-2.5 py-1 rounded-md">
                      Wealth Creation
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-white">
                        ₦10,000
                      </span>
                      <span className="block text-[11px] text-gray-300">
                        ₦5k product + ₦5k slot
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Wealth Creation Activation</h3>
                  <p className="text-gray-300 text-xs leading-relaxed mb-6">
                    Full commercial production activation with welcome health product and first practical farm slot.
                  </p>

                  <ul className="space-y-2.5 text-xs text-gray-200 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#d1ef75] shrink-0 mt-0.5" />
                      <span>₦5,000 Mushroom Power welcome health beverage (₦6k retail value)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#d1ef75] shrink-0 mt-0.5" />
                      <span>₦5,000 compulsory first farm slot (2 starter fruiting bags)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#d1ef75] shrink-0 mt-0.5" />
                      <span>Optional additional farm slots at ₦5,000 each (unlimited)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#d1ef75] shrink-0 mt-0.5" />
                      <span>Cycle 1 (Months 1–3) biological doubling from 2 to 4 bags</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#d1ef75] shrink-0 mt-0.5" />
                      <span>40% quarterly harvest returns credited to wallet from Cycle 2</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#d1ef75] shrink-0 mt-0.5" />
                      <span>Flat ₦500 direct referral bonus on every slot referred</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#d1ef75] shrink-0 mt-0.5" />
                      <span>Zero monthly maintenance dues or recurring utility fees</span>
                    </li>
                  </ul>
                </div>

                <Link to="/signup?redirect=/dashboard/checkout">
                  <Button className="w-full bg-[#d1ef75] hover:bg-[#bce055] text-green-950 font-bold rounded-xl">
                    Activate Wealth Creation (₦10,000)
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <CTASection />
      </main>
    </div>
  );
}
