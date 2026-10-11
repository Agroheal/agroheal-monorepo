import React from "react";
import { Sparkles, CheckCircle2, Lock, ShieldCheck, Users } from "lucide-react";
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
  // Milestone 2 is unlocked if member has recruited 5+ qualified allies (or points >= 30,000)
  const milestone2Unlocked = directAlliesCount >= 5 || currentPoints >= 30000;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-emerald-500/25 bg-gradient-to-br from-[#041a0d] via-[#062c16] to-[#03150a] shadow-md p-3 sm:p-3.5 text-white flex flex-col justify-between ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row with Title & Points Chip */}
      <div className="relative z-10 flex items-start justify-between gap-2 mb-2 pb-2 border-b border-white/10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              Points
            </span>
            <h3 className="text-xs sm:text-sm font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-100 to-white uppercase truncate">
              GREEN CARD POINTS: MORE POWER TO THE REVOLUTION!
            </h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-100/75 font-medium mt-0.5 line-clamp-1">
            Get 30,000 Green Card Points to fuel your momentum.
          </p>
        </div>

        {/* Compact Points Chip */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-black/45 border border-emerald-500/25 shrink-0">
          <span className="text-xs sm:text-sm font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-100">
            {currentPoints.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-emerald-300/70 font-mono">
            / 30k
          </span>
          <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/25 px-1 py-0.2 rounded">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Thin Micro-Progress Bar */}
      <div className="relative z-10 mb-2">
        <div className="w-full h-1.5 rounded-full bg-black/40 border border-emerald-500/20 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400"
          />
        </div>
      </div>

      {/* 2 Milestone Compact Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 items-stretch">
        {/* Milestone 1: WHEN YOU JOIN */}
        <div
          className={`rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col justify-between ${
            milestone1Unlocked
              ? "bg-emerald-950/40 border-emerald-400/40 shadow-sm"
              : "bg-black/30 border-white/10 opacity-75"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    milestone1Unlocked ? "text-emerald-300" : "text-gray-400"
                  }`}
                />
                <span className="font-bold text-[10.5px] uppercase tracking-wide text-amber-200">
                  WHEN YOU JOIN:
                </span>
              </div>

              {milestone1Unlocked ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  15,000 PTS
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/5 text-gray-400 border border-white/10 font-mono">
                  <Lock className="w-2.5 h-2.5" />
                  15,000 PTS
                </span>
              )}
            </div>

            <p className="text-[10px] text-emerald-100/85 leading-tight font-normal">
              Unlock 15,000 Points to accelerate your movement on schedule from Mushroom Village to Organic FoodNation in your locality.
            </p>
          </div>

          <div className="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[9px]">
            <span className="text-emerald-300/70 font-medium">Status</span>
            <span className="font-bold text-emerald-300">
              {milestone1Unlocked ? "Unlocked & Active" : "Pending Activation"}
            </span>
          </div>
        </div>

        {/* Milestone 2: WHEN YOU RECRUIT 5 ALLIES */}
        <div
          className={`rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col justify-between ${
            milestone2Unlocked
              ? "bg-emerald-950/40 border-amber-400/40 shadow-sm"
              : "bg-black/30 border-white/10"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5">
                <Users
                  className={`w-3.5 h-3.5 ${
                    milestone2Unlocked ? "text-amber-300" : "text-gray-400"
                  }`}
                />
                <span className="font-bold text-[10.5px] uppercase tracking-wide text-amber-200">
                  WHEN YOU RECRUIT 5 ALLIES:
                </span>
              </div>

              {milestone2Unlocked ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono">
                  <CheckCircle2 className="w-2.5 h-2.5 text-amber-400" />
                  15,000 PTS
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/5 text-gray-400 border border-white/10 font-mono">
                  <Lock className="w-2.5 h-2.5" />
                  15,000 PTS
                </span>
              )}
            </div>

            <p className="text-[10px] text-emerald-100/85 leading-tight font-normal">
              Unlock 15,000 Points to claim fresh Organic rewards on the Marketplace during designated windows.
            </p>
          </div>

          <div className="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[9px]">
            <span className="text-emerald-300/70 font-medium">Allies Recruited</span>
            <span className="font-bold text-amber-300 font-mono">
              {directAlliesCount} / 5 Allies {milestone2Unlocked ? "✓" : `(${5 - Math.min(directAlliesCount, 5)} left)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
