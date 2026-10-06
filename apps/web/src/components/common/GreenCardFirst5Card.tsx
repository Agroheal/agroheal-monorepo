import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  MessageCircle,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ArrowRight,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { showToast } from "@/components/ui/ToastComponent";

export interface Tier4MemberInfo {
  id: string;
  fullName: string;
  memberId?: string;
}

export interface Tier3MemberInfo {
  id: string;
  fullName: string;
  memberId?: string;
  directsCount?: number;
  tier4Members?: Tier4MemberInfo[];
}

export interface Tier2MemberInfo {
  id: string;
  fullName: string;
  memberId?: string;
  directsCount?: number;
  tier3Members?: Tier3MemberInfo[];
}

export interface DirectReferralInfo {
  id: string;
  fullName: string;
  memberId?: string;
  directsCount: number;
  tier2Members?: Tier2MemberInfo[];
}

interface GreenCardFirst5CardProps {
  directReferralsCount: number;
  referralCode?: string;
  hasGreenCard: boolean;
  className?: string;
  referralsList?: DirectReferralInfo[];
}

export const GreenCardFirst5Card: React.FC<GreenCardFirst5CardProps> = ({
  directReferralsCount = 0,
  referralCode = "",
  hasGreenCard = true,
  className = "",
  referralsList = [],
}) => {
  const [showChallenge, setShowChallenge] = useState(false);
  const [activeDay, setActiveDay] = useState<1 | 2 | 3>(1);
  const [copiedScript, setCopiedScript] = useState(false);
  const [selectedLeaderIndex, setSelectedLeaderIndex] = useState(0);
  const [selectedTeam3Index, setSelectedTeam3Index] = useState(0);
  const [selectedTeam4Index, setSelectedTeam4Index] = useState(0);
  const [viewMode, setViewMode] = useState<"stepper" | "carousel">("stepper");

  const carouselRef = useRef<HTMLDivElement>(null);

  // Frontline: The first 5 direct recruits (Level 1)
  const frontline5 = referralsList.slice(0, 5);
  const effectiveCount = Math.max(directReferralsCount, referralsList.length);
  const level1Count = Math.min(5, effectiveCount);
  const level1Completed = level1Count >= 5;

  // Level 2: 25 expansion slots across the 5 frontline leaders
  const totalTier2Count = frontline5.reduce(
    (acc, r) => acc + (r.tier2Members?.length || r.directsCount || 0),
    0
  );
  const level2Completed = level1Completed && totalTier2Count >= 25;

  // Level 3: 125 expansion slots across 25 Level 2 leaders
  const level3Teams = useMemo(() => {
    const teams: Array<{
      teamIndex: number;
      parentIdx: number;
      parentName: string;
      member: Tier2MemberInfo | null;
      memberName: string;
      isLeaderActive: boolean;
      slots: Array<{
        slotIdx: number;
        member: Tier3MemberInfo | null;
        isFilled: boolean;
        name: string;
      }>;
      filledCount: number;
    }> = [];

    for (let leaderIdx = 0; leaderIdx < 5; leaderIdx++) {
      const parentLeader = frontline5[leaderIdx] || null;
      const parentName = parentLeader ? parentLeader.fullName.split(" ")[0] : `Frontline #${leaderIdx + 1}`;

      for (let slotIdx = 0; slotIdx < 5; slotIdx++) {
        const teamIndex = leaderIdx * 5 + slotIdx;
        const tier2Member = parentLeader?.tier2Members?.[slotIdx] || null;
        const isLeaderActive = Boolean(tier2Member) || (parentLeader?.directsCount || 0) > slotIdx;
        const memberName = tier2Member
          ? tier2Member.fullName.split(" ")[0]
          : isLeaderActive
          ? `Partner #${slotIdx + 1}`
          : `Slot #${slotIdx + 1}`;

        const tier3List = tier2Member?.tier3Members || [];
        const t3Directs = tier2Member?.directsCount || 0;

        const teamSlots = [1, 2, 3, 4, 5].map((sNum) => {
          const t3Mem = tier3List[sNum - 1] || null;
          const isFilled = Boolean(t3Mem) || t3Directs >= sNum;
          const name = t3Mem
            ? t3Mem.fullName.split(" ")[0]
            : isFilled
            ? `Partner #${sNum}`
            : `Slot ${sNum}`;
          return { slotIdx: sNum, member: t3Mem, isFilled, name };
        });

        const filledCount = teamSlots.filter((s) => s.isFilled).length;

        teams.push({
          teamIndex,
          parentIdx: leaderIdx,
          parentName,
          member: tier2Member,
          memberName,
          isLeaderActive,
          slots: teamSlots,
          filledCount,
        });
      }
    }
    return teams;
  }, [frontline5]);

  const totalTier3Count = level3Teams.reduce((acc, t) => acc + t.filledCount, 0);
  const level3Completed = level2Completed && totalTier3Count >= 125;

  // Level 4: 625 expansion slots across 125 Level 3 leaders
  const totalTier4Count = 0;
  const level4Completed = level3Completed && totalTier4Count >= 625;

  // Determine current progression tier
  const activeLevel = !level1Completed ? 1 : !level2Completed ? 2 : !level3Completed ? 3 : 4;
  const [viewingLevel, setViewingLevel] = useState<number>(() => activeLevel);

  useEffect(() => {
    setViewingLevel(activeLevel);
  }, [activeLevel]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://agroheal.solutions";
  const inviteLink = `${origin}/signup?ref=${referralCode || "356FV1"}`;

  const day1Script = `🌱 *Hello!* I just activated my *AgroHeal Green Card* to take part in our Organic Food Ecosystem and cooperative farm production.

We are building a massive revolution in sustainable agriculture, healthy food, and passive farm income. 

Your Green Card journey begins with your *FIRST 5*. Check out the official Green Card presentation and join my team here:
🔗 ${inviteLink}

Let's build the revolution together! 🚀🌍`;

  const day2Script = `👋 *Hi there!* Following up on the AgroHeal Green Card invitation I shared yesterday. 

Have you had a chance to look at how the cooperative farm slots and organic mushroom production work?

Let's connect so I can answer your questions or invite you to our live Green Card ecosystem presentation today! 🌾💚`;

  const day3Script = `🎉 *Congratulations on getting your Green Card!* 

Your Green Card journey begins now. Don't wait—activate your *FIRST 5*, help them activate *THEIR 5*, and watch your food ecosystem grow from person to person!

Join our next onboarding session and let's help your first 5 get started immediately. 🚀`;

  const getActiveScript = () => {
    if (activeDay === 1) return day1Script;
    if (activeDay === 2) return day2Script;
    return day3Script;
  };

  const handleCopyScript = (scriptText: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(scriptText);
      setCopiedScript(true);
      showToast({
        variant: "success",
        title: "Script Copied!",
        description: `${label} copied to clipboard. Paste into WhatsApp or SMS.`,
      });
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  const handleShareWhatsApp = (scriptText: string) => {
    const encoded = encodeURIComponent(scriptText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const activeLeader = frontline5[selectedLeaderIndex] || frontline5[0] || null;
  const activeTeam3 = level3Teams[selectedTeam3Index] || level3Teams[0];

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const tierMeta = [
    { lvl: 1, label: "Level 1", target: 5, current: level1Count, isDone: level1Completed },
    { lvl: 2, label: "Level 2", target: 25, current: totalTier2Count, isDone: level2Completed },
    { lvl: 3, label: "Level 3", target: 125, current: totalTier3Count, isDone: level3Completed },
    { lvl: 4, label: "Level 4", target: 625, current: totalTier4Count, isDone: level4Completed },
  ];

  const currentMeta = tierMeta.find((t) => t.lvl === viewingLevel) || tierMeta[0];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-[#0a2416] to-[#04150c] text-white shadow-xl shadow-emerald-950/20 ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-4 sm:p-6 lg:p-7">
        {/* Top Header Badge & Tagline */}
        <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0a2416] rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
                <h3 className="text-sm sm:text-base lg:text-lg font-black tracking-tight text-white whitespace-nowrap">
                  <span>
                    {viewingLevel === 1
                      ? "GREEN CARD FIRST 5™"
                      : viewingLevel === 2
                      ? "TIER 2 DUPLICATION (25 SLOTS)"
                      : viewingLevel === 3
                      ? "TIER 3 EXPANSION (125 SLOTS)"
                      : "TIER 4 MOMENTUM (625 SLOTS)"}
                  </span>
                </h3>
                <span className="shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  Level {viewingLevel} Target
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium truncate sm:whitespace-normal">
                {viewingLevel === 1
                  ? "Activate your first 5 frontline partners to complete Level 1."
                  : viewingLevel === 2
                  ? "Guide your 5 frontline leaders to each complete their 5."
                  : viewingLevel === 3
                  ? "Duplicate matrix depth across 25 Level 2 leaders into Level 3."
                  : "Expand matrix momentum across 125 Level 3 leaders into Level 4."}
              </p>
            </div>
          </div>

          {/* Level Progress Pill */}
          <div className="flex items-center gap-2 shrink-0">
            {currentMeta.isDone ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-emerald-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Level {viewingLevel} Mastered!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-emerald-200 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {currentMeta.current} of {currentMeta.target} Completed
                </span>
              </span>
            )}
          </div>
        </div>

        {/* ── LEVEL SELECTOR NAVIGATION TABS ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {tierMeta.map((tier) => {
            const isSelected = viewingLevel === tier.lvl;
            const isCurrentActive = activeLevel === tier.lvl;

            return (
              <button
                key={tier.lvl}
                type="button"
                onClick={() => setViewingLevel(tier.lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-green-400 text-emerald-950 shadow-md font-extrabold ring-2 ring-emerald-300"
                    : "bg-white/10 text-emerald-100 hover:bg-white/15 border border-white/10"
                }`}
              >
                <span>
                  {tier.label} ({tier.target} Slots)
                </span>
                {tier.isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950 fill-emerald-300" />
                ) : isCurrentActive ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-900/80 text-emerald-300 border border-emerald-400/30">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-white/50 font-mono">
                    {tier.current}/{tier.target}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── STAGE 1: LEVEL 1 TARGET (FIRST 5 DIRECTS ONLY) ── */}
        {viewingLevel === 1 && (
          <div className="bg-black/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-200/80 mb-2.5 gap-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span>FIRST 5 FRONTLINE</span>
                <span className="text-emerald-400 text-xs">
                  ({level1Count}/5 Completed)
                </span>
              </span>
              <span className="text-white/70">
                {Math.max(0, 5 - level1Count)} more needed to advance to Tier 2 Duplication
              </span>
            </div>

            {/* Exactly 5 Slots Displayed */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
              {[1, 2, 3, 4, 5].map((slotNumber) => {
                const member = referralsList[slotNumber - 1];
                const isSlotDone = Boolean(member) || effectiveCount >= slotNumber;
                const firstName = member?.fullName
                  ? member.fullName.split(" ")[0]
                  : isSlotDone
                  ? `Direct #${slotNumber}`
                  : `Slot ${slotNumber}`;

                return (
                  <div
                    key={slotNumber}
                    className={`relative flex flex-col items-center justify-between py-2.5 sm:py-3 px-1.5 rounded-xl sm:rounded-2xl transition-all duration-300 min-h-[96px] sm:min-h-[110px] ${
                      isSlotDone
                        ? "bg-gradient-to-b from-emerald-500/25 to-emerald-600/15 border-2 border-emerald-400 text-white shadow-lg shadow-emerald-950/50"
                        : "bg-white/5 border border-dashed border-white/20 text-emerald-300/40"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                        isSlotDone
                          ? "bg-emerald-400 text-emerald-950 shadow-xs"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {isSlotDone ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      ) : (
                        <span>{slotNumber}</span>
                      )}
                    </div>

                    <div className="text-center w-full px-0.5 my-1">
                      <span
                        className="text-[10px] sm:text-xs font-bold tracking-tight block truncate max-w-full text-white"
                        title={member?.fullName || firstName}
                      >
                        {firstName}
                      </span>
                    </div>

                    <div className="w-full text-center">
                      {isSlotDone ? (
                        <span className="inline-block text-[8px] sm:text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-full">
                          Activated
                        </span>
                      ) : (
                        <span className="text-[8px] sm:text-[9px] text-white/40 font-mono">
                          Open Slot
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar line */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(level1Count / 5) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
              />
            </div>

            <p className="text-[10px] text-emerald-300/70 mt-2.5 italic">
              * Note: Spillovers do not count as direct recruits. Only direct, paid Green Card recruits count toward First 5 progression.
            </p>
          </div>
        )}

        {/* ── STAGE 2: LEVEL 2 TARGET (TIER 2 DUPLICATION — 25 SLOTS) ── */}
        {viewingLevel === 2 && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span>Tier 2 Duplication Team (25 Expansion Slots)</span>
                </h4>
                <p className="text-[10px] sm:text-[11px] text-emerald-200/80 mt-0.5">
                  Monitor each of your 5 frontline partners as they duplicate.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {totalTier2Count} / 25 Duplicated
                </span>
                <Link
                  to="/dashboard/my-network"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
                >
                  Full Network →
                </Link>
              </div>
            </div>

            {/* Direct Leader Selectors (The 5 Frontline Partners) */}
            <div className="flex items-center justify-between gap-1 mb-3">
              <button
                type="button"
                onClick={() => setSelectedLeaderIndex((prev) => Math.max(0, prev - 1))}
                disabled={selectedLeaderIndex === 0}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Previous leader"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-5 gap-1 sm:gap-1.5 flex-1 px-1">
                {frontline5.map((leader, idx) => {
                  const isSelected = selectedLeaderIndex === idx;
                  const leaderCount = leader.tier2Members?.length || leader.directsCount || 0;
                  const isDone = leaderCount >= 5;

                  return (
                    <button
                      key={leader.id || idx}
                      type="button"
                      onClick={() => setSelectedLeaderIndex(idx)}
                      className={`p-1.5 sm:p-2 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? "bg-emerald-500 text-emerald-950 shadow-md font-bold ring-2 ring-emerald-300"
                          : "bg-white/5 text-emerald-200 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs truncate max-w-full">
                        {leader.fullName.split(" ")[0]}
                      </span>
                      <span
                        className={`text-[9px] mt-0.5 px-1 py-0.2 rounded-full font-mono ${
                          isSelected
                            ? "bg-emerald-950/20 text-emerald-950 font-bold"
                            : isDone
                            ? "bg-amber-400/20 text-amber-300 font-bold"
                            : "bg-white/10 text-emerald-300"
                        }`}
                      >
                        {leaderCount}/5
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setSelectedLeaderIndex((prev) => Math.min(frontline5.length - 1, prev + 1))}
                disabled={selectedLeaderIndex >= frontline5.length - 1}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Next leader"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Leader's 5 Slots */}
            {activeLeader && (
              <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-200/80 mb-2.5 gap-1 font-medium">
                  <span className="font-semibold text-white">
                    {activeLeader.fullName}'s Direct 5 Team:
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    {activeLeader.tier2Members?.length || activeLeader.directsCount || 0} of 5 Slots Filled
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((slotIdx) => {
                    const tier2Member = activeLeader.tier2Members?.[slotIdx - 1];
                    const isFilled = Boolean(tier2Member) || activeLeader.directsCount >= slotIdx;
                    const memberName = tier2Member?.fullName
                      ? tier2Member.fullName.split(" ")[0]
                      : isFilled
                      ? `Partner #${slotIdx}`
                      : `Slot ${slotIdx}`;

                    return (
                      <div
                        key={slotIdx}
                        className={`relative flex flex-col items-center justify-between py-2.5 sm:py-3 px-1.5 rounded-xl sm:rounded-2xl transition-all duration-300 min-h-[96px] sm:min-h-[110px] ${
                          isFilled
                            ? "bg-gradient-to-b from-emerald-500/25 to-emerald-600/15 border-2 border-emerald-400 text-white shadow-lg shadow-emerald-950/50"
                            : "bg-white/5 border border-dashed border-white/20 text-emerald-300/40"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                            isFilled
                              ? "bg-emerald-400 text-emerald-950 shadow-xs"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {isFilled ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                          ) : (
                            <span>{slotIdx}</span>
                          )}
                        </div>

                        <div className="text-center w-full px-0.5 my-1">
                          <span
                            className="text-[10px] sm:text-xs font-bold tracking-tight block truncate max-w-full text-white"
                            title={tier2Member?.fullName || memberName}
                          >
                            {memberName}
                          </span>
                        </div>

                        <div className="w-full text-center">
                          {isFilled ? (
                            <span className="inline-block text-[8px] sm:text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-full">
                              Partner
                            </span>
                          ) : (
                            <span className="text-[8px] sm:text-[9px] text-white/40 font-mono">
                              Open Slot
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress bar line */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(Math.min(25, totalTier2Count) / 25) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
              />
            </div>

            <p className="text-[10px] text-emerald-300/70 mt-2.5 italic">
              * Note: Spillovers do not count as direct recruits. Only direct, paid Green Card recruits count toward First 5 progression.
            </p>
          </div>
        )}

        {/* ── STAGE 3: LEVEL 3 TARGET (TIER 3 EXPANSION — 125 SLOTS CAROUSEL / SCROLL LIST) ── */}
        {viewingLevel === 3 && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span>Tier 3 Duplication Matrix (125 Expansion Slots)</span>
                </h4>
                <p className="text-[10px] sm:text-[11px] text-emerald-200/80 mt-0.5">
                  25 Level 2 teams duplicating across Level 3 depth.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Stepper vs Scroll-All */}
                <div className="inline-flex p-0.5 bg-white/10 rounded-lg border border-white/10 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setViewMode("stepper")}
                    className={`px-2 py-1 rounded-md font-bold transition-all ${
                      viewMode === "stepper"
                        ? "bg-emerald-500 text-emerald-950 shadow-xs"
                        : "text-emerald-200 hover:text-white"
                    }`}
                  >
                    Stepper
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("carousel")}
                    className={`px-2 py-1 rounded-md font-bold transition-all ${
                      viewMode === "carousel"
                        ? "bg-emerald-500 text-emerald-950 shadow-xs"
                        : "text-emerald-200 hover:text-white"
                    }`}
                  >
                    Scroll All (25)
                  </button>
                </div>

                <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {totalTier3Count} / 125 Duplicated
                </span>
              </div>
            </div>

            {/* MODE A: STEPPER VIEW WITH 25-TEAM QUICK JUMP STRIP */}
            {viewMode === "stepper" && (
              <>
                {/* Stepper Navigation Bar */}
                <div className="flex items-center justify-between gap-2 mb-2 bg-black/30 p-2 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setSelectedTeam3Index((prev) => Math.max(0, prev - 1))}
                    disabled={selectedTeam3Index === 0}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    aria-label="Previous team"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="text-center min-w-0 flex-1 px-2">
                    <span className="text-xs font-bold text-white block truncate">
                      Team #{selectedTeam3Index + 1} of 25: {activeTeam3.memberName}
                    </span>
                    <span className="text-[10px] text-emerald-300/80 block truncate">
                      Frontline Branch: {activeTeam3.parentName} · {activeTeam3.filledCount}/5 Slots
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedTeam3Index((prev) => Math.min(level3Teams.length - 1, prev + 1))}
                    disabled={selectedTeam3Index >= level3Teams.length - 1}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    aria-label="Next team"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick-Jump 25-Team Strip */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 scrollbar-thin scrollbar-thumb-emerald-700/40">
                  {level3Teams.map((team, idx) => {
                    const isSelected = selectedTeam3Index === idx;
                    const isDone = team.filledCount >= 5;

                    return (
                      <button
                        key={team.teamIndex}
                        type="button"
                        onClick={() => setSelectedTeam3Index(idx)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-400 text-emerald-950 font-extrabold ring-1 ring-emerald-300"
                            : isDone
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            : "bg-white/5 text-emerald-200/70 hover:bg-white/10"
                        }`}
                        title={`Team ${idx + 1}: ${team.memberName} (${team.filledCount}/5)`}
                      >
                        T{idx + 1}: {team.filledCount}/5
                      </button>
                    );
                  })}
                </div>

                {/* Active Team's 5 Slots */}
                <div className="bg-black/30 rounded-xl p-3 border border-white/5 mb-3">
                  <div className="flex items-center justify-between text-xs text-emerald-200/80 mb-2.5 font-medium">
                    <span className="font-semibold text-white">
                      {activeTeam3.memberName}'s Level 3 Downline Slots:
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                      {activeTeam3.filledCount} of 5 Slots Filled
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-3 py-1">
                    {activeTeam3.slots.map((slot) => (
                      <div
                        key={slot.slotIdx}
                        className={`relative flex flex-col items-center justify-between py-2.5 sm:py-3 px-1.5 rounded-xl sm:rounded-2xl transition-all duration-300 min-h-[96px] sm:min-h-[110px] ${
                          slot.isFilled
                            ? "bg-gradient-to-b from-emerald-500/25 to-emerald-600/15 border-2 border-emerald-400 text-white shadow-lg shadow-emerald-950/50"
                            : "bg-white/5 border border-dashed border-white/20 text-emerald-300/40"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs transition-transform ${
                            slot.isFilled
                              ? "bg-emerald-400 text-emerald-950 shadow-xs"
                              : "bg-white/10 text-white/60"
                          }`}
                        >
                          {slot.isFilled ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                          ) : (
                            <span>{slot.slotIdx}</span>
                          )}
                        </div>

                        <div className="text-center w-full px-0.5 my-1">
                          <span
                            className="text-[10px] sm:text-xs font-bold tracking-tight block truncate max-w-full text-white"
                            title={slot.member?.fullName || slot.name}
                          >
                            {slot.name}
                          </span>
                        </div>

                        <div className="w-full text-center">
                          {slot.isFilled ? (
                            <span className="inline-block text-[8px] sm:text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-full">
                              Partner
                            </span>
                          ) : (
                            <span className="text-[8px] sm:text-[9px] text-white/40 font-mono">
                              Open Slot
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* MODE B: LONG HORIZONTAL SCROLL LIST / CAROUSEL (ALL 25 TEAMS SIDE-BY-SIDE) */}
            {viewMode === "carousel" && (
              <div className="relative mb-3">
                {/* Horizontal Scroll Controls */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] text-emerald-200/80 font-medium">
                    Scroll horizontally through all 25 teams (125 Slots):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollCarousel("left")}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel("right")}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-emerald-600/50 scrollbar-track-white/5"
                >
                  {level3Teams.map((team) => (
                    <div
                      key={team.teamIndex}
                      className="min-w-[270px] sm:min-w-[300px] snap-start bg-black/40 rounded-xl p-3 border border-white/10 flex flex-col justify-between shrink-0"
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Team #{team.teamIndex + 1}: {team.memberName}
                          </span>
                          <span className="text-[10px] text-emerald-300/80 block">
                            Under {team.parentName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {team.filledCount}/5
                        </span>
                      </div>

                      {/* 5 mini-slots */}
                      <div className="grid grid-cols-5 gap-1 py-1">
                        {team.slots.map((s) => (
                          <div
                            key={s.slotIdx}
                            className={`p-1 rounded-lg flex flex-col items-center justify-center text-center ${
                              s.isFilled
                                ? "bg-emerald-500/20 border border-emerald-400 text-emerald-200"
                                : "bg-white/5 border border-dashed border-white/10 text-white/40"
                            }`}
                          >
                            <span className="text-[9px] font-bold">#{s.slotIdx}</span>
                            <span className="text-[8px] truncate max-w-full block font-medium">
                              {s.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress bar line */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(Math.min(125, totalTier3Count) / 125) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
              />
            </div>

            <p className="text-[10px] text-emerald-300/70 mt-2.5 italic">
              * Note: Spillovers do not count as direct recruits. Only direct, paid Green Card recruits count toward First 5 progression.
            </p>
          </div>
        )}

        {/* ── STAGE 4: LEVEL 4 TARGET (TIER 4 MOMENTUM — 625 SLOTS) ── */}
        {viewingLevel === 4 && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 border border-white/10 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Tier 4 Momentum Matrix (625 Expansion Slots)</span>
                </h4>
                <p className="text-[10px] sm:text-[11px] text-emerald-200/80 mt-0.5">
                  125 Level 3 leaders duplicating across Level 4 depth.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {totalTier4Count} / 625 Duplicated
                </span>
                <Link
                  to="/dashboard/my-network"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 ml-1"
                >
                  Full Network →
                </Link>
              </div>
            </div>

            {/* Stepper Navigation Bar for 125 Teams */}
            <div className="flex items-center justify-between gap-2 mb-3 bg-black/30 p-2 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setSelectedTeam4Index((prev) => Math.max(0, prev - 1))}
                disabled={selectedTeam4Index === 0}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Previous Level 4 team"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center min-w-0 flex-1 px-2">
                <span className="text-xs font-bold text-white block truncate">
                  Team #{selectedTeam4Index + 1} of 125 (Level 4 Nodes)
                </span>
                <span className="text-[10px] text-emerald-300/80 block truncate">
                  Target: 5 Downline Duplications per node (625 Total)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTeam4Index((prev) => Math.min(124, prev + 1))}
                disabled={selectedTeam4Index >= 124}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Next Level 4 team"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Level 4 Team's 5 Slots */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
              {[1, 2, 3, 4, 5].map((slotNumber) => (
                <div
                  key={slotNumber}
                  className="relative flex flex-col items-center justify-between py-2.5 sm:py-3 px-1.5 rounded-xl sm:rounded-2xl bg-white/5 border border-dashed border-white/20 text-emerald-300/40 min-h-[96px] sm:min-h-[110px]"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs bg-white/10 text-white/60">
                    <span>{slotNumber}</span>
                  </div>
                  <div className="text-center w-full px-0.5 my-1">
                    <span className="text-[10px] sm:text-xs font-bold tracking-tight block truncate max-w-full text-white/60">
                      Slot {slotNumber}
                    </span>
                  </div>
                  <div className="w-full text-center">
                    <span className="text-[8px] sm:text-[9px] text-white/40 font-mono">
                      Open Slot
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar line */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(Math.min(625, totalTier4Count) / 625) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
              />
            </div>

            <p className="text-[10px] text-emerald-300/70 mt-2.5 italic">
              * Note: Spillovers do not count as direct recruits. Only direct, paid Green Card recruits count toward First 5 progression.
            </p>
          </div>
        )}

        {/* Total Direct Recruits Footnote (if user has enrolled > 5 directs) */}
        {referralsList.length > 5 && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs text-emerald-200">
            <span>
              Total Personal Directs: <strong>{referralsList.length}</strong> ({frontline5.length} in Level 1 + {referralsList.length - 5} spillovers placed downline)
            </span>
            <Link to="/dashboard/my-network" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
              View All in Organogram →
            </Link>
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleShareWhatsApp(getActiveScript())}
            className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-green-950/30 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>

          <button
            onClick={() => handleCopyScript(getActiveScript(), `Day ${activeDay} Invitation Script`)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            {copiedScript ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-300" />
                <span>Copy Script</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowChallenge(!showChallenge)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-200 text-xs sm:text-sm font-medium transition-all cursor-pointer"
          >
            <span>The 48-Hour Challenge</span>
            {showChallenge ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* ── EXPANDABLE: THE FIRST-48-HOURS CHALLENGE ACTION PLAN ── */}
        <AnimatePresence>
          {showChallenge && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-5 pt-4 border-t border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>The First-48-Hours Challenge Sequence</span>
                </h4>
                <span className="text-[11px] text-emerald-300 font-medium">Select a Day</span>
              </div>

              {/* Day Selection Tabs */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                <button
                  onClick={() => setActiveDay(1)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    activeDay === 1
                      ? "bg-emerald-500 text-emerald-950 shadow-sm"
                      : "bg-white/5 text-emerald-200/80 hover:bg-white/10"
                  }`}
                >
                  DAY 1: Find Your 5
                </button>
                <button
                  onClick={() => setActiveDay(2)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    activeDay === 2
                      ? "bg-emerald-500 text-emerald-950 shadow-sm"
                      : "bg-white/5 text-emerald-200/80 hover:bg-white/10"
                  }`}
                >
                  DAY 2: Help Join
                </button>
                <button
                  onClick={() => setActiveDay(3)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    activeDay === 3
                      ? "bg-emerald-500 text-emerald-950 shadow-sm"
                      : "bg-white/5 text-emerald-200/80 hover:bg-white/10"
                  }`}
                >
                  DAY 3: My 5 Build
                </button>
              </div>

              {/* Day Script Card */}
              <div className="bg-black/40 rounded-xl p-3 sm:p-4 border border-white/10 text-xs text-gray-200 space-y-2.5">
                {activeDay === 1 && (
                  <div>
                    <div className="font-bold text-emerald-300 text-xs sm:text-sm mb-1">
                      DAY 1 — Find Your 5 Contacts
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-2">
                      Think of 5 people who care about health, organic food, farming, or passive income. Send them your personal invitation script below.
                    </p>
                  </div>
                )}

                {activeDay === 2 && (
                  <div>
                    <div className="font-bold text-emerald-300 text-xs sm:text-sm mb-1">
                      DAY 2 — Help Your 5 Join
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-2">
                      Follow up with your five. Answer questions, clarify how slot subscriptions work, and invite interested prospects to the next live community presentation.
                    </p>
                  </div>
                )}

                {activeDay === 3 && (
                  <div>
                    <div className="font-bold text-emerald-300 text-xs sm:text-sm mb-1">
                      DAY 3 — “My 5 Are Building Their 5”
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-2">
                      Celebrate your 5 active Green Card holders. Now, mentor them to duplicate the exact same sequence with their prospects.
                    </p>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-200 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                  {getActiveScript()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
