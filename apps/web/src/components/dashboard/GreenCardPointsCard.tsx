import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Lock, ShieldCheck, Users, Recycle, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface GreenCardPointsCardProps {
  points?: number;
  hasGreenCard?: boolean;
  directAlliesCount?: number;
  className?: string;
}

export const GreenCardPointsCard: React.FC<GreenCardPointsCardProps> = ({
  points = 0,
  hasGreenCard = false,
  directAlliesCount = 0,
  className = "",
}) => {
  const maxPoints = 30000;
  const currentPoints = Math.min(points, maxPoints);
  const percentage = Math.round((currentPoints / maxPoints) * 100);

  // Milestone 1 is unlocked if member has a Green Card (or >= 15,000 points)
  const milestone1Unlocked = hasGreenCard || currentPoints >= 15000;
  // Milestone 2 is unlocked if member has onboarded 5+ qualified allies (or points >= 30,000)
  const milestone2Unlocked = directAlliesCount >= 5 || currentPoints >= 30000;

  const slides = [
    {
      id: "join",
      title: "WHEN YOU JOIN:",
      badge: milestone1Unlocked ? "15,000 PTS (UNLOCKED)" : "15,000 PTS",
      isUnlocked: milestone1Unlocked,
      icon: ShieldCheck,
      content: "Get 15,000 Green Points to accelerate your movement on schedule from Mushroom Village to Organic FoodNation.",
      footerLabel: "Status",
      footerValue: milestone1Unlocked ? "Active & Unlocked" : "Pending Green Card Activation",
      accent: "emerald",
    },
    {
      id: "first5",
      title: "WHEN YOU ONBOARD YOUR FIRST 5:",
      badge: milestone2Unlocked ? "15,000 PTS (UNLOCKED)" : "15,000 PTS",
      isUnlocked: milestone2Unlocked,
      icon: Users,
      content: "Get 15,000 Points to claim fresh Organic rewards on the Marketplace during designated windows.",
      footerLabel: "Allies Onboarded",
      footerValue: `${directAlliesCount} / 5 Allies ${milestone2Unlocked ? "✓" : `(${5 - Math.min(directAlliesCount, 5)} left)`}`,
      accent: "amber",
    },
    {
      id: "waste",
      title: "WHEN YOU DROP YOUR KITCHEN WASTES AT DESIGNATED RECYCLE CENTRES:",
      badge: "ORGANIC WASTE IS WEALTH!",
      isUnlocked: true,
      icon: Recycle,
      content: "Increase your Green Points networth daily! Organic Waste is Wealth! Organic wastes are recycled into Organic farm inputs including Frass enriched Compost, Container Garden Media, Organic fertilizers and BSFL protein feed for Chicken & Fish. Product sales help fund your Green Points!",
      footerLabel: "Recycle Rewards",
      footerValue: "Daily Points Multiplier",
      accent: "teal",
    },
    {
      id: "redeem",
      title: "🛒 REDEEM. SHOP. SAVE!",
      badge: "FOOD SECURITY",
      isUnlocked: true,
      icon: ShoppingBag,
      content: "Exchange your Green Points for Organic food to reduce your household food expenses! GREEN POINTS: MORE POWER TO THE REVOLUTION! Imagine an ecosystem where your participation creates value, earns you Green Points, and expands your access to organic food!",
      footerLabel: "Marketplace Exchange",
      footerValue: "Direct Organic Food Access",
      accent: "yellow",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-[#02180e] via-[#052615] to-[#011108] shadow-lg p-3.5 sm:p-5 text-white flex flex-col justify-between ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row with Title & Points Chip */}
      <div className="relative z-10 flex items-start justify-between gap-2 mb-2 pb-2.5 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              Green Points
            </span>
            <h3 className="text-xs sm:text-sm font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-100 to-white uppercase truncate">
              GREEN POINTS: MORE POWER TO THE REVOLUTION!
            </h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-100/75 font-medium mt-0.5 line-clamp-1">
            Imagine an Ecosystem where your participation creates value rewarded with Green Points to increase your access to Organic food!
          </p>
        </div>

        {/* Compact Points Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/50 border border-emerald-500/30 shrink-0 shadow-inner">
          <span className="text-xs sm:text-sm font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-100">
            {currentPoints.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-emerald-300/70 font-mono">
            / 30k
          </span>
          <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/25 px-1.5 py-0.5 rounded">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Micro-Progress Bar */}
      <div className="relative z-10 mb-3">
        <div className="w-full h-1.5 rounded-full bg-black/50 border border-emerald-500/20 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400"
          />
        </div>
      </div>

      {/* Carousel Active Slide Card */}
      <div className="relative z-10 flex-1 min-h-[140px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl p-3 sm:p-4 border bg-emerald-950/40 border-emerald-400/30 shadow-sm flex flex-col justify-between flex-1"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <IconComponent className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="font-bold text-[11px] sm:text-xs uppercase tracking-wide text-amber-200">
                    {slide.title}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                  {slide.isUnlocked ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-gray-400" />
                  )}
                  {slide.badge}
                </span>
              </div>

              <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-relaxed font-normal">
                {slide.content}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
              <span className="text-emerald-300/70 font-medium">{slide.footerLabel}</span>
              <span className="font-bold text-amber-300 font-mono">{slide.footerValue}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel Navigation Footer */}
      <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
        {/* Slide Indicators / Dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all rounded-full ${
                idx === currentSlide
                  ? "w-6 h-1.5 bg-gradient-to-r from-emerald-400 to-amber-300"
                  : "w-2 h-1.5 bg-white/20 hover:bg-white/40"
              }`}
              title={`Slide ${idx + 1}: ${s.title}`}
            />
          ))}
          <span className="text-[10px] text-emerald-200/60 font-mono ml-1.5">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevSlide}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-emerald-200 hover:text-white transition-all cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-emerald-200 hover:text-white transition-all cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
