import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Sprout, HeartHandshake, BellRing } from "lucide-react";
import { CTASection } from "../../components/webComponents/CTASection";

const perks = [
  {
    icon: Sprout,
    title: "Real Agricultural Impact",
    desc: "Every initiative, farm record, and field program directly empowers Nigerian farmers and strengthens domestic food security.",
  },
  {
    icon: Users,
    title: "High-Autonomy Culture",
    desc: "We value ownership, speed, and integrity. You have the freedom to execute ideas and create immediate tangible impact.",
  },
  {
    icon: HeartHandshake,
    title: "Collaborative Community",
    desc: "Work with a passionate, interdisciplinary team committed to modernizing commercial community agriculture.",
  },
];

export default function Careers() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
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
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header Banner */}
          <motion.div
            {...fadeUp(0.1)}
            className="text-center mb-14 max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold tracking-wide uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Careers at Agroheal
            </span>
            <h1
              className="text-4xl md:text-5xl font-extrabold text-green-950 tracking-tight mb-5"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Building the Future of Sustainable Agriculture
            </h1>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              We are on a mission to empower thousands of entrepreneurs and
              families across Nigeria through sustainable farming education and
              practical agricultural syndicates.
            </p>
          </motion.div>

          {/* Perks Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {perks.map((perk, idx) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={perk.title}
                  {...fadeUp(0.2 + idx * 0.1)}
                  className="bg-white rounded-2xl p-7 border border-gray-200/70 shadow-xs hover:shadow-sm transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mb-5 text-green-800">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {perk.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {perk.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Current Hiring Status Card */}
          <motion.div
            {...fadeUp(0.3)}
            className="bg-white rounded-3xl border border-gray-200/80 p-8 md:p-12 shadow-xs text-center mb-16 max-w-3xl mx-auto"
          >
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-700">
              <BellRing className="w-7 h-7" />
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              No Open Roles at This Time
            </h2>
            <p className="text-gray-600 text-base leading-relaxed max-w-xl mx-auto mb-6">
              We are not actively hiring for full-time roles right now. We
              encourage you to check back periodically as new positions and
              project opportunities become available.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Applications currently on hold • Check back soon
            </div>
          </motion.div>
        </div>

        <CTASection />
      </main>
    </div>
  );
}
