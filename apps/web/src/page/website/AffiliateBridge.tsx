import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Exact authoritative commission schedule from formal brief & business logic
const matrixTiers = [
  { level: "Level 1", percent: "5.0%", reward: "₦250 / ₦5k product", members: "5 members", total: "₦1,250" },
  { level: "Level 2", percent: "3.5%", reward: "₦175 / ₦5k product", members: "25 members", total: "₦4,375" },
  { level: "Level 3", percent: "3.0%", reward: "₦150 / ₦5k product", members: "125 members", total: "₦18,750" },
  { level: "Level 4", percent: "2.5%", reward: "₦125 / ₦5k product", members: "625 members", total: "₦78,125" },
  { level: "Level 5", percent: "2.5%", reward: "₦125 / ₦5k product", members: "3,125 members", total: "₦390,625" },
  { level: "Level 6", percent: "2.5%", reward: "₦125 / ₦5k product", members: "15,625 members", total: "₦1,953,125" },
  { level: "Level 7", percent: "2.5%", reward: "₦125 / ₦5k product", members: "78,125 members", total: "₦9,765,625" },
];

export default function AffiliateBridge() {
  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 selection:bg-green-100 selection:text-green-900">
      {/* ── Hero Section (Clean deep forest, no artificial gradients) ── */}
      <section className="bg-[#031d0f] text-white pt-32 pb-20 md:pt-40 md:pb-24 border-b border-green-950">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#d1ef75] text-xs font-semibold tracking-wide uppercase mb-6"
          >
            <Share2 className="w-4 h-4" />
            <span>Agroheal Partner & Referral Network</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-display"
          >
            Promote Clean Food. <br />
            <span className="text-[#d1ef75]">Build Recurring Community Wealth.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8 font-sans font-light"
          >
            Earn an instant 50% reward (₦1,000) on every Green Card referral, a 10% (₦500) direct bonus on farm slots, and up to 40% across our 7-level product commission engine.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup?redirect=/dashboard/green-card">
              <Button size="lg" className="w-full sm:w-auto bg-[#d1ef75] text-green-950 hover:bg-[#bce055] font-bold h-12 px-8 rounded-full shadow-md">
                Get Green Card & Referral Link (₦2,000)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/signin?redirect=/dashboard/green-card">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium h-12 px-8 rounded-full backdrop-blur-xs transition-colors shadow-none"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 3 Pillars of Earnings ── */}
      <section className="py-16 md:py-24 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100/70 px-3 py-1 rounded-full">
              Compensation Architecture
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-3 font-display">
              How You Earn with Agroheal
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-2 font-light">
              Designed for immediate member liquidity and sustainable cooperative expansion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Direct Rewards */}
            <div className="rounded-3xl p-8 bg-green-50/50 border border-green-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-800 text-white flex items-center justify-center mb-6 shadow-sm">
                  <Zap className="w-6 h-6 text-[#d1ef75]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-green-800">Pillar 1 · Direct Referrals</span>
                <h3 className="text-xl font-bold text-gray-900 font-display mt-1 mb-3">
                  ₦1,000 + ₦500 Direct Bonuses
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-light mb-4">
                  Earn <strong>₦1,000 (50%)</strong> instantly on every ₦2,000 Green Card registration, plus a flat <strong>₦500 (10%)</strong> direct referral bonus on every ₦5,000 farm slot purchased by your invitees. Plus 12% on direct retail product sales.
                </p>
                <div className="space-y-2 pt-4 border-t border-green-200 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span>Instant wallet ledger credit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span>Green Card (₦2k) unlocks direct bonuses</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 2: 7-Level Product Commission Engine */}
            <div className="rounded-3xl p-8 bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-900 text-white flex items-center justify-center mb-6 shadow-sm">
                  <TrendingUp className="w-6 h-6 text-[#d1ef75]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-green-800">Pillar 2 · Product Network</span>
                <h3 className="text-xl font-bold text-gray-900 font-display mt-1 mb-3">
                  7-Level Product Engine
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-light mb-4">
                  Every ₦5,000 Mushroom Power welcome product (from ₦10,000 Wealth Creation Activation) and subsequent retail product sale distributes up to <strong>40% (₦2,000)</strong> across 7 upline tiers, retail seller, and leadership pools.
                </p>
                <div className="space-y-2 pt-4 border-t border-gray-100 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span>21.5% across 7 upline matrix tiers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span>4% leadership pool & 2% sustainability reserve</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar 3: Fast Settlement & Reinvestment */}
            <div className="rounded-3xl p-8 bg-white border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white flex items-center justify-center mb-6 shadow-sm">
                  <Wallet className="w-6 h-6 text-amber-100" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pillar 3 · Fluid Liquidity</span>
                <h3 className="text-xl font-bold text-gray-900 font-display mt-1 mb-3">
                  Bank Payout or Farm Slots
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-light mb-4">
                  Withdraw your accrued bonuses straight to any Nigerian bank account via NUBAN settlement (₦2,000 minimum), or use 1-click reinvestment to acquire productive farm slots without spending fresh capital.
                </p>
                <div className="space-y-2 pt-4 border-t border-gray-100 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span>₦2,000 minimum bank withdrawal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span>Seamless 1-click slot reinvestment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7-Level Product Commission Schedule Table ── */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100/70 px-3 py-1 rounded-full">
              Authoritative Schedule
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mt-3 font-display">
              7-Level Product Commission Schedule
            </h2>
            <p className="text-sm text-gray-600 mt-2 font-light">
              Applies to the ₦5,000 Mushroom Power welcome product and retail platform sales under the 40% payout ceiling.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-[#031d0f] text-white uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Level Depth</th>
                    <th className="py-3.5 px-5">Commission %</th>
                    <th className="py-3.5 px-5">Payout / ₦5k Product</th>
                    <th className="py-3.5 px-5">Max Capacity</th>
                    <th className="py-3.5 px-5 text-right">Potential Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matrixTiers.map((tier) => (
                    <tr key={tier.level} className="hover:bg-green-50/40 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">{tier.level}</td>
                      <td className="py-3.5 px-5 font-semibold text-green-800">{tier.percent}</td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">{tier.reward}</td>
                      <td className="py-3.5 px-5 text-gray-600">{tier.members}</td>
                      <td className="py-3.5 px-5 font-bold text-gray-900 text-right">{tier.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-black text-green-950 border-t-2 border-green-200">
                    <td className="py-4 px-5">UPLINE TOTALS (7 Levels)</td>
                    <td className="py-4 px-5">21.5%</td>
                    <td className="py-4 px-5">₦1,075 / sale</td>
                    <td className="py-4 px-5">97,655 members</td>
                    <td className="py-4 px-5 text-right text-green-900">₦12,212,500.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-green-100/50 p-4 border-t border-gray-100 text-xs text-green-900 text-center font-medium space-y-1">
              <p>
                <strong>Full 40% (₦2,000) Product Pool:</strong> 12% (₦600) Direct Retail Seller • 21.5% (₦1,075) 7 Upline Levels • 4% (₦200) Leadership Pool • 2% (₦100) Sustainability Reserve • 0.5% (₦25) Company Margin.
              </p>
              <p className="text-gray-600">
                Plus flat direct referral bonuses: <strong>₦1,000</strong> per ₦2,000 Green Card registration &amp; <strong>₦500 (10%)</strong> per ₦5,000 farm slot purchase.
              </p>
            </div>
          </div>

          {/* CTA Box (Clean deep forest, no harsh radial blob) */}
          <div className="mt-14 bg-[#031d0f] text-white rounded-3xl p-8 md:p-10 text-center shadow-xl border border-green-900">
            <h3 className="text-2xl font-bold font-display mb-3 text-white">
              Activate Your Partner Pass Today
            </h3>
            <p className="text-sm md:text-base text-gray-300 max-w-xl mx-auto mb-6 font-light">
              Get your personal referral link, full streaming access to all farming blueprints, and verified member credentials for just ₦2,000.
            </p>
            <Link to="/signup?redirect=/dashboard/green-card">
              <Button size="lg" className="bg-[#d1ef75] text-green-950 hover:bg-[#bce055] font-bold h-12 px-8 rounded-full">
                Join Community & Get Referral Link
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
