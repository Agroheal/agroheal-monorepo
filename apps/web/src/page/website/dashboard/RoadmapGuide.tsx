import { motion } from "framer-motion";
import { Sparkles, HelpCircle } from "lucide-react";
import HowItWorksContent from "@/components/webComponents/HowItWorksContent";

export default function RoadmapGuide() {
  return (
    <div className="min-h-screen bg-gray-50/60 pb-16">
      {/* Top Banner */}
      <div className="bg-emerald-900 px-4 md:px-8 pt-8 pb-14 text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-6xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-xs font-semibold text-emerald-100">
              LEAP Operational Guide
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            How Agroheal Works
          </h1>
          <p className="text-emerald-200 mt-2 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
            Your comprehensive guide to agribusiness education, Wealth Creation farm slots, and commercial quarterly harvest returns.
          </p>
        </motion.div>
      </div>

      {/* Main Content Viewport */}
      <div className="px-4 md:px-8 -mt-6 max-w-6xl mx-auto">
        <HowItWorksContent variant="dashboard" />
      </div>
    </div>
  );
}
