import React, { useState } from "react";
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
  ShieldCheck,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { showToast } from "@/components/ui/ToastComponent";

export interface DirectReferralInfo {
  id: string;
  fullName: string;
  memberId?: string;
  directsCount: number;
  tier2Members?: Array<{
    id: string;
    fullName: string;
    memberId?: string;
  }>;
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

  // Frontline: The first 5 direct recruits
  const frontline5 = referralsList.slice(0, 5);
  const effectiveCount = Math.max(directReferralsCount, referralsList.length);
  const level1Completed = frontline5.length >= 5 || effectiveCount >= 5;

  // Tier 2: 25 expansion slots across the 5 leaders
  const totalTier2Count = frontline5.reduce(
    (acc, r) => acc + (r.tier2Members?.length || r.directsCount || 0),
    0
  );
  const level2Completed = level1Completed && totalTier2Count >= 25;

  // Active level determination: Level 1 (First 5) -> Level 2 (25 Team Duplication) -> Level 3 (Expansion)
  const currentLevel: 1 | 2 | 3 = !level1Completed ? 1 : !level2Completed ? 2 : 3;

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

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950 via-[#0a2416] to-[#04150c] text-white shadow-xl shadow-emerald-950/20 ${className}`}
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-4 sm:p-6 lg:p-7">
        {/* Top Header Badge & Tagline */}
        <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3 mb-4">
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
                    {currentLevel === 1
                      ? "GREEN CARD FIRST 5™"
                      : currentLevel === 2
                      ? "TIER 2 DUPLICATION (25 SLOTS)"
                      : "TIER 3 EXPANSION (125 SLOTS)"}
                  </span>
                </h3>
                <span className="shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  Level {currentLevel} Target
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium truncate sm:whitespace-normal">
                {currentLevel === 1
                  ? "Activate your first 5 frontline partners to complete Level 1."
                  : currentLevel === 2
                  ? "Guide your 5 frontline leaders to each complete their 5."
                  : "All frontline leaders duplicated! Matrix expansion in full progress."}
              </p>
            </div>
          </div>

          {/* Level Progress Pill */}
          <div className="flex items-center gap-2 shrink-0">
            {currentLevel === 1 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-emerald-200 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{Math.min(5, effectiveCount)} of 5 Activated</span>
              </span>
            ) : currentLevel === 2 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold shadow-sm">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                <span>{totalTier2Count} of 25 Duplicated</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-emerald-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>🎉 Tier 2 Master Achieved!</span>
              </span>
            )}
          </div>
        </div>

        {/* ── STAGE 1: LEVEL 1 TARGET (FIRST 5 DIRECTS ONLY) ── */}
        {currentLevel === 1 && (
          <div className="bg-black/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-200/80 mb-2.5 gap-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <span>FIRST 5 FRONTLINE</span>
                <span className="text-emerald-400 text-xs">({Math.min(5, effectiveCount)}/5 Completed)</span>
              </span>
              <span className="text-white/70">
                {5 - Math.min(5, effectiveCount)} more needed to advance to Tier 2 Duplication
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
                      <span className="text-[10px] sm:text-xs font-bold tracking-tight block truncate max-w-full text-white" title={member?.fullName || firstName}>
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
                animate={{ width: `${(Math.min(5, effectiveCount) / 5) * 100}%` }}
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
        {currentLevel === 2 && (
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
                    {(activeLeader.tier2Members?.length || activeLeader.directsCount || 0)} of 5 Slots Filled
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((slotIdx) => {
                    const tier2Member = activeLeader.tier2Members?.[slotIdx - 1];
                    const isFilled = Boolean(tier2Member) || (activeLeader.directsCount >= slotIdx);
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
                          <span className="text-[10px] sm:text-xs font-bold tracking-tight block truncate max-w-full text-white" title={tier2Member?.fullName || memberName}>
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

            {/* Spillover note */}
            <p className="text-[10px] text-emerald-300/70 mt-2.5 italic">
              * Note: Spillovers do not count as direct recruits. Only direct, paid Green Card recruits count toward First 5 progression.
            </p>
          </div>
        )}

        {/* ── STAGE 3: LEVEL 3+ EXPANSION (ACHIEVEMENT CARD) ── */}
        {currentLevel === 3 && (
          <div className="bg-black/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 border border-amber-400/30 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tier 2 Completed (25/25 Duplicated)</span>
                </h4>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Your network is expanding through Tier 3 (125 Slots) and Tier 4 (625 Slots).
                </p>
              </div>
              <Link
                to="/dashboard/my-network"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-emerald-950 font-bold text-xs shadow-md hover:bg-emerald-400 transition-colors"
              >
                <span>View Full Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
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
