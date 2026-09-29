import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, FileText, ArrowDownToLine, ShieldCheck, ArrowRight } from "lucide-react";
import { CTASection } from "@/components/webComponents/CTASection";
import HowItWorksContent from "@/components/webComponents/HowItWorksContent";

export default function HowItWorks() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

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
              <Leaf className="w-3.5 h-3.5 text-green-750" />
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

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/how-it-works/presentation"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-green-850 hover:bg-green-750 text-white font-semibold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg"
              >
                <FileText className="w-4 h-4 text-[#d1ef75]" />
                <span>Read Text Presentation Guide</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>

              <Link
                to="/how-it-works/locked-withdrawals"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold text-xs sm:text-sm transition-all shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Locked Reserves Guide</span>
              </Link>

              <a
                href="/documents/AgroHeal_Green_Card_Presentation.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs sm:text-sm transition-all border border-gray-200 shadow-xs"
              >
                <span>Download PDF</span>
                <ArrowDownToLine className="w-4 h-4" />
              </a>
            </div>
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
