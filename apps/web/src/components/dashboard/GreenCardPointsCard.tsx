import React from "react";
import { Sparkles, CheckCircle, Lock, ArrowUpRight, ShieldCheck, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

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
  // Milestone 2 is unlocked if member has recruited 5+ allies (or points >= 30,000)
  const milestone2Unlocked = directAlliesCount >= 5 || currentPoints >= 30000;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-[#041a0d] via-[#062c16] to-[#03150a] shadow-xl p-5 sm:p-7 text-white ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Green Card Points</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-100 to-white uppercase">
            GREEN CARD POINTS: MORE POWER TO THE REVOLUTION!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 font-medium">
            Get 30,000 Green Card Points to fuel your momentum.
          </p>
        </div>

        {/* Total Points HUD Badge */}
        <div className="flex flex-col items-end sm:items-end p-3 sm:p-4 rounded-2xl bg-black/40 border border-emerald-500/20 backdrop-blur-md shrink-0">
          <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-emerald-300/80">
            Points Balance
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-100">
              {currentPoints.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-400/80 font-mono">
              / 30,000
            </span>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-200/80 mb-2">
          <span>Revolution Progress</span>
          <span className="font-mono">{percentage}% Unlocked</span>
        </div>
        <div className="w-full h-3 rounded-full bg-black/50 border border-emerald-500/20 p-0.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 shadow-sm"
          />
        </div>
      </div>

      {/* 2 Milestone Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Milestone 1: WHEN YOU JOIN */}
        <div
          className={`relative rounded-2xl p-4 sm:p-5 border transition-all ${
            milestone1Unlocked
              ? "bg-emerald-950/40 border-emerald-400/40 shadow-emerald-950/50"
              : "bg-black/30 border-white/10 opacity-75"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  milestone1Unlocked
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : "bg-white/5 text-gray-400 border border-white/10"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-amber-200">
                WHEN YOU JOIN:
              </span>
            </div>

            {milestone1Unlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                15,000 PTS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 text-gray-400 border border-white/10 font-mono">
                <Lock className="w-3 h-3" />
                15,000 PTS
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
            Unlock 15,000 Points to accelerate your movement on schedule from Mushroom Village to Organic FoodNation in your locality.
          </p>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-emerald-300/80 font-medium">Status</span>
            <span className="font-bold text-emerald-300">
              {milestone1Unlocked ? "Unlocked & Active" : "Pending Green Card Activation"}
            </span>
          </div>
        </div>

        {/* Milestone 2: WHEN YOU RECRUIT 5 ALLIES */}
        <div
          className={`relative rounded-2xl p-4 sm:p-5 border transition-all ${
            milestone2Unlocked
              ? "bg-emerald-950/40 border-amber-400/40 shadow-amber-950/50"
              : "bg-black/30 border-white/10"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  milestone2Unlocked
                    ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                    : "bg-white/5 text-gray-400 border border-white/10"
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm tracking-wide uppercase text-amber-200">
                WHEN YOU RECRUIT 5 ALLIES:
              </span>
            </div>

            {milestone2Unlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono">
                <CheckCircle className="w-3 h-3 text-amber-400" />
                15,000 PTS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 text-gray-400 border border-white/10 font-mono">
                <Lock className="w-3 h-3" />
                15,000 PTS
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
            Unlock 15,000 Points to claim fresh Organic rewards on the Marketplace during designated windows.
          </p>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-emerald-300/80 font-medium">Allies Recruited</span>
            <span className="font-bold text-amber-300 font-mono">
              {directAlliesCount} / 5 Allies {milestone2Unlocked ? "✓ (Unlocked)" : `(${5 - Math.min(directAlliesCount, 5)} to unlock)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
