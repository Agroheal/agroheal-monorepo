import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Coins,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const clusters = [
  {
    title: "Mushroom Village",
    subtitle: "High-Yield Indoor Mycology",
    badge: "Fast Turnaround",
    description:
      "Intensive indoor cultivation of oyster and specialty mushrooms in climate-monitored darkrooms. Rapid vegetative growth, continuous harvesting cycles, and direct off-take to premium culinary and health markets.",
    features: ["Zero chemical fertilizers", "High-density vertical bags", "Rapid harvest turnaround"],
  },
  {
    title: "Organic FoodNation",
    subtitle: "1 Million Hectares Against Hunger",
    badge: "Food Security",
    description:
      "Scalable open-field and greenhouse production of staples, vegetables, and indigenous nutrient-dense crops powered exclusively by biofertilizers, biopesticides, and indigenous microorganisms (IMO).",
    features: ["Soil regenerative biology", "Local market off-take", "Large-scale community acreage"],
  },
  {
    title: "Gingertown",
    subtitle: "Commercial Rhizome Clusters",
    badge: "High-Value Export",
    description:
      "High-value organic ginger and medicinal rhizome production with value-added drying, grading, and oil extraction processing for both domestic wholesale and export commodity channels.",
    features: ["Export-grade rhizomes", "Cooperative aggregation", "Premium market valuation"],
  },
];

export default function FarmSlotsBridge() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 selection:bg-green-100 selection:text-green-900">
      {/* ── Hero Section (Clean deep forest, no artificial glowing blobs) ── */}
      <section className="bg-[#031d0f] text-white pt-32 pb-20 md:pt-40 md:pb-24 border-b border-green-950">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#d1ef75] text-xs font-semibold tracking-wide uppercase mb-6"
          >
            <Sprout className="w-4 h-4" />
            <span>Agroheal LEAP Shared Farm Clusters</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-display"
          >
            Own Commercial Farm Slots. <br />
            <span className="text-[#d1ef75]">No Land Purchase. No Daily Labor.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8 font-sans font-light"
          >
            Participate directly in real, productive organic agriculture. The cooperative handles land, organic inputs, agronomists, and security—while you earn quarterly harvest distributions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup?redirect=/dashboard/checkout">
              <Button size="lg" className="w-full sm:w-auto bg-[#d1ef75] text-green-950 hover:bg-[#bce055] font-bold h-12 px-8 rounded-full shadow-md">
                Secure Your Farm Slot
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium h-12 px-8 rounded-full backdrop-blur-xs transition-colors shadow-none"
              >
                How It Works
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Transparent Pricing & Kickoff Package ── */}
      <section className="py-16 md:py-24 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100/70 px-3 py-1 rounded-full">
              Transparent Economics
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-3 font-display">
              Wealth Creation Activation &amp; Slot Pricing
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-2 font-light">
              Clear itemization governed by our formal operational charter. Operating expenses are sustained via harvest yields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Wealth Creation Activation Package */}
            <div className="rounded-3xl p-8 bg-green-50/50 border border-green-200 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-green-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Wealth Creation Team
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Activation Package</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 font-display mb-2">
                  Wealth Creation Activation
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-green-950 font-display">₦10,000</span>
                  <span className="text-sm text-gray-500">one-time activation</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-6 font-light">
                  Activates both your product commission network account and your compulsory first biological mushroom farm slot.
                </p>

                <div className="space-y-3 pt-4 border-t border-green-200 text-sm">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">
                      <strong>₦5,000</strong> Welcome Product — Mushroom Power (feeds 7-level commission engine)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">
                      <strong>₦5,000</strong> Compulsory first mushroom farm slot (2 starter bags)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Dedicated supervision by resident agronomists</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700">Digital farm logbook &amp; quarterly harvest distributions</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-green-200">
                <Link to="/signup?redirect=/dashboard/checkout">
                  <Button className="w-full bg-green-800 hover:bg-green-900 text-white font-bold h-12 rounded-xl">
                    Join Wealth Creation Team (₦10,000)
                  </Button>
                </Link>
              </div>
            </div>

            {/* Additional Slots */}
            <div className="rounded-3xl p-8 bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Farm Expansion
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Additional Slots</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 font-display mb-2">
                  Additional Farm Slots
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold text-gray-900 font-display">₦5,000</span>
                  <span className="text-sm text-gray-500">per additional slot</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-6 font-light">
                  Multiply your harvest allocations by acquiring additional production slots. Deployed 100% into biological farm allocation.
                </p>

                <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      <strong>₦1,400 (28%)</strong> 2 mushroom fruiting bags per slot
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      <strong>₦2,100 (42%)</strong> Fruiting house, cold-chain, logistics &amp; HR
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      <strong>₦500 (10%)</strong> Flat direct sponsor referral bonus
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      <strong>₦1,000 (20%)</strong> Company admin &amp; technical oversight
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <Link to="/signup?redirect=/dashboard/checkout">
                  <Button variant="outline" className="w-full border-green-800 text-green-800 hover:bg-green-50 font-bold h-12 rounded-xl">
                    Add Slots in Dashboard (₦5,000/ea)
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Green Card Membership Notice */}
          <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-xs md:text-sm text-amber-900">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
            <span>
              <strong>Green Card Requirement:</strong> All participants must hold an active Agroheal Green Card (₦2,000 lifetime) for verified member ID, learning access, and dividend payouts. Automatically bundled at checkout if not yet active.
            </span>
          </div>
        </div>
      </section>

      {/* ── 3 Primary Production Clusters ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100/70 px-3 py-1 rounded-full">
              Production Models
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-3 font-display">
              Agroheal Practical Clusters
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-2 font-light">
              Select from specialized ecological models tailored for biological resilience and strong market demand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clusters.map((cluster, idx) => (
              <motion.div
                key={cluster.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-7 border border-gray-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                      {cluster.badge}
                    </span>
                    <Layers className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 font-display mb-1">
                    {cluster.title}
                  </h3>
                  <p className="text-xs font-semibold text-green-700 mb-3">{cluster.subtitle}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-6 font-light">
                    {cluster.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    {cluster.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Link to="/signup?redirect=/dashboard/checkout">
                    <Button variant="ghost" className="w-full text-green-800 hover:text-green-900 hover:bg-green-50 text-xs font-bold justify-between">
                      <span>Choose this cluster</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Harvest & Yield Economics (Clean dark, no harsh gradients) ── */}
      <section className="py-16 md:py-24 bg-[#031d0f] text-white border-t border-green-950">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d1ef75] bg-white/10 px-3 py-1 rounded-full">
              Harvest Distributions
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mt-3 font-display">
              How Harvest Revenue Is Distributed
            </h2>
            <p className="text-sm md:text-base text-gray-300 mt-2 font-light">
              Clear, transparent cooperative accounting governed by smart ledgers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cycle 1 Capacity Building */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#d1ef75] flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Cycle 1 (Months 1–3)</h4>
              <p className="text-xs text-gray-300 leading-relaxed font-light mb-3">
                Capacity-building season yielding 2kg fresh mushrooms per slot (₦5,000 revenue).
              </p>
              <ul className="text-[11px] text-gray-300 space-y-1.5 pt-2 border-t border-white/10">
                <li>• <strong>90% (₦4,500)</strong> Reinvested to double 2 → 4 fruiting bags &amp; facilities</li>
                <li>• <strong>10% (₦500)</strong> Company technical oversight</li>
                <li className="text-amber-300 font-semibold">• ₦0 cash payout in Cycle 1 (builds equity)</li>
              </ul>
            </div>

            {/* Cycle 2+ Distributable Balance */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#d1ef75] flex items-center justify-center mb-4">
                <Coins className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Cycle 2+ (Quarterly)</h4>
              <p className="text-xs text-gray-300 leading-relaxed font-light mb-3">
                4 mature bags yield ₦10,000 projected revenue less ₦4,000 input continuation = <strong>₦6,000 distributable</strong>.
              </p>
              <ul className="text-[11px] text-gray-300 space-y-1.5 pt-2 border-t border-white/10">
                <li>• <strong>40% (₦2,400)</strong> Distributed to Slot Owners</li>
                <li>• <strong>20% (₦1,200)</strong> Gingertown Expansion reserve</li>
                <li>• <strong>20% (₦1,200)</strong> Organic FoodNation Expansion</li>
                <li>• <strong>10% (₦600)</strong> Company &bull; <strong>10% (₦600)</strong> Coordinator</li>
              </ul>
            </div>

            {/* Mature Farm Ecosystem */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-[#d1ef75] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Mature 3-Farm Scale</h4>
              <p className="text-xs text-gray-300 leading-relaxed font-light mb-3">
                When Gingertown &amp; FoodNation clusters reach maturity, profit distribution transitions to:
              </p>
              <ul className="text-[11px] text-gray-300 space-y-1.5 pt-2 border-t border-white/10">
                <li>• <strong>80%</strong> Consolidated Farm Owners Pool</li>
                <li>• <strong>10%</strong> Farm Cluster Coordinator</li>
                <li>• <strong>10%</strong> Central Company Administration</li>
                <li className="text-[#d1ef75] font-semibold">• Target scale: 1,000 slots (≥250 to launch)</li>
              </ul>
            </div>
          </div>

          {/* Bottom Action CTA */}
          <div className="mt-14 text-center">
            <Link to="/signup?redirect=/dashboard/checkout">
              <Button size="lg" className="bg-[#d1ef75] text-green-950 hover:bg-[#bce055] font-bold h-12 px-10 rounded-full">
                Join Wealth Creation Team Today
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
