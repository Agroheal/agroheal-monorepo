import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Share2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  MessageCircle,
  ExternalLink,
  Flame,
  Check,
} from "lucide-react";
import { showToast } from "@/components/ui/ToastComponent";

interface GreenCardFirst5CardProps {
  directReferralsCount: number;
  referralCode?: string;
  hasGreenCard: boolean;
  className?: string;
}

export const GreenCardFirst5Card: React.FC<GreenCardFirst5CardProps> = ({
  directReferralsCount = 0,
  referralCode = "",
  hasGreenCard = true,
  className = "",
}) => {
  const [showChallenge, setShowChallenge] = useState(false);
  const [activeDay, setActiveDay] = useState<1 | 2 | 3>(1);
  const [copiedScript, setCopiedScript] = useState(false);

  const completedCount = Math.min(Math.max(directReferralsCount, 0), 5);
  const isCompleted = completedCount >= 5;
  const progressPercent = (completedCount / 5) * 100;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://agroheal.org";
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
                  <span>GREEN CARD FIRST 5™</span>
                </h3>
                <span className="shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  Culture
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium truncate sm:whitespace-normal">
                Get 5. Help your 5 get 5. Build the Revolution.
              </p>
            </div>
          </div>

          {/* Completion Status Pill */}
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-emerald-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>🎉 I HAVE MY 5!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-emerald-200 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{completedCount} of 5 Activated</span>
              </span>
            )}
          </div>
        </div>

        {/* Core Progress Indicator (1 to 5) */}
        <div className="bg-black/30 backdrop-blur-md rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-white/10 mb-5">
          <div className="flex items-center justify-between text-xs text-emerald-200/80 mb-2.5 font-medium">
            <span className="flex items-center gap-1.5 text-white font-semibold">
              <span>FIRST 5 PROGRESS</span>
              <span className="text-emerald-400 text-xs">({completedCount}/5 Completed)</span>
            </span>
            <span>{isCompleted ? "Goal Achieved — Duplicate Your 5!" : `${5 - completedCount} more to unlock badge`}</span>
          </div>

          {/* 5 Step Progress Nodes */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-3">
            {[1, 2, 3, 4, 5].map((slotNumber) => {
              const isSlotDone = completedCount >= slotNumber;
              return (
                <div
                  key={slotNumber}
                  className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                    isSlotDone
                      ? "bg-gradient-to-b from-emerald-500/25 to-emerald-600/15 border-2 border-emerald-400 text-white shadow-lg shadow-emerald-950/50"
                      : "bg-white/5 border border-dashed border-white/20 text-emerald-300/40"
                  }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-transform ${
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
                  <span className="text-[10px] sm:text-xs font-semibold tracking-tight text-center truncate max-w-full">
                    {isSlotDone ? "Active" : `Slot ${slotNumber}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
            />
          </div>
        </div>

        {/* Motivational Callout */}
        <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-100 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            {isCompleted ? (
              <p>
                <strong className="text-white">Next Mission: Help your 5 build their 5!</strong> When each of your 5 introduces their 5, your Tier 2 expands to 25 members, multiplying your team's agricultural production and passive weekly bonuses.
              </p>
            ) : (
              <p>
                <strong className="text-white">“The moment you receive your Green Card, don't wait:</strong> activate your FIRST 5, help them activate THEIR 5, and watch the Green Card Organic Food Ecosystem grow from person to person, community to community.”
              </p>
            )}
          </div>
        </div>

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
                      Think of 5 people who care about health, organic food, farming, or passive income. Send them your personal invitation script below. Don't try to explain everything yourself—let the official presentation do the heavy lifting!
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
                      The moment someone joins your team, their next instruction is immediately: <em>“Congratulations! Your Green Card is active. Your next mission is to help 5 people get theirs.”</em> That creates the chain reaction!
                    </p>
                  </div>
                )}

                {/* Pre-formatted Script Box */}
                <div className="relative p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/20 font-mono text-[11px] leading-relaxed text-emerald-200 whitespace-pre-wrap">
                  {getActiveScript()}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-400">
                    Pre-loaded with your sponsor code: <strong className="text-emerald-300">{referralCode || "356FV1"}</strong>
                  </span>
                  <button
                    onClick={() => handleCopyScript(getActiveScript(), `Day ${activeDay} Script`)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy This Script</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
