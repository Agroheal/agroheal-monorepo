import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { CTASection } from "@/components/webComponents/CTASection";
import HowItWorksContent from "@/components/webComponents/HowItWorksContent";

export default function HowItWorks() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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

          {/* Reusable Core Content */}
          <div className="mb-20">
            <HowItWorksContent variant="public" />
          </div>
        </div>

        <CTASection />
      </main>
    </div>
  );
}
