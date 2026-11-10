import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame,
  Check,
  Copy,
  MessageCircle,
  Users,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { showToast } from "@/components/ui/ToastComponent";

export interface MatrixLevelMember {
  id: string;
  fullName: string;
  memberId?: string;
  directsCount: number;
}

export interface MatrixLevelsData {
  level1: MatrixLevelMember[];
  level2: MatrixLevelMember[];
  level3: MatrixLevelMember[];
  level4: MatrixLevelMember[];
  level5: MatrixLevelMember[];
  level6: MatrixLevelMember[];
  level7: MatrixLevelMember[];
}

export interface Tier4MemberInfo {
  id: string;
  fullName: string;
  memberId?: string;
  directsCount?: number;
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
  isActivated?: boolean;
}

interface GreenCardFirst5CardProps {
  directReferralsCount: number;
  referralCode?: string;
  hasGreenCard: boolean;
  className?: string;
  referralsList?: DirectReferralInfo[];
  matrixLevels?: MatrixLevelsData;
}

export const GreenCardFirst5Card: React.FC<GreenCardFirst5CardProps> = ({
  directReferralsCount = 0,
  referralCode = "",
  hasGreenCard = true,
  className = "",
  referralsList = [],
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // ── 1. CORE RECRUITS & DUPLICATION DATA ──
  // Separate verified active cardholders from pending unactivated registrations
  const activatedLeaders = useMemo(() => {
    return referralsList.filter(
      (r) => r.isActivated !== false && (r.isActivated || Boolean(r.memberId))
    );
  }, [referralsList]);

  const pendingLeaders = useMemo(() => {
    return referralsList.filter(
      (r) => r.isActivated === false || (!r.isActivated && !r.memberId)
    );
  }, [referralsList]);

  // The 5 key frontline leaders (slots 1 to 5): Active leaders take front seats, followed by pending recruits
  const directLeaders = useMemo(() => {
    return [...activatedLeaders, ...pendingLeaders].slice(0, 5);
  }, [activatedLeaders, pendingLeaders]);

  // ONLY verified active cardholders count towards First 5 completion
  const completedDirects = Math.min(
    5,
    Math.max(directReferralsCount, activatedLeaders.length)
  );
  const hasCompletedFirst5 = completedDirects >= 5;

  // Active view level toggle: Level 1 (First 5) vs Level 2 (Team 25 Duplication)
  const [activeLevelTab, setActiveLevelTab] = useState<"L1" | "L2">(
    hasCompletedFirst5 ? "L2" : "L1"
  );

  // Calculate total Tier 2 duplication across verified direct leaders (Capacity: 25)
  const totalTier2Count = useMemo(() => {
    return activatedLeaders.slice(0, 5).reduce((acc, r) => {
      return acc + (r.tier2Members?.length || r.directsCount || 0);
    }, 0);
  }, [activatedLeaders]);

  const leadersWith5 = useMemo(() => {
    return activatedLeaders.slice(0, 5).filter((m) => (m.directsCount || 0) >= 5).length;
  }, [activatedLeaders]);

  // Referral links & sharing
  const origin = typeof window !== "undefined" ? window.location.origin : "https://agroheal.solutions";
  const inviteLink = `${origin}/signup?ref=${referralCode || "356FV1"}`;
  const generalShareText = `🌱 Join my AgroHeal organic farming cooperative team with my Green Card invite: ${inviteLink}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      showToast({
        variant: "success",
        title: "Invite Link Copied!",
        description: "Your referral link is copied to your clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsAppGeneral = () => {
    const encoded = encodeURIComponent(generalShareText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  // WhatsApp Nudge for specific direct partner
  const handleNudgePartner = (member: DirectReferralInfo, e: React.MouseEvent, isL1View: boolean) => {
    e.stopPropagation();
    const firstName = member.fullName ? member.fullName.trim().split(" ")[0] : "Partner";
    const directs = member.directsCount || 0;
    const remaining = Math.max(0, 5 - directs);
    const isMemberActive = member.isActivated !== false && (member.isActivated || Boolean(member.memberId));

    let message = "";
    if (!isMemberActive) {
      message = `Hi ${firstName}! I noticed you started your registration on AgroHeal. Complete your Green Card activation now so we can activate your benefits and welcome you to our farming cooperative team! 🌾🌱`;
    } else if (isL1View) {
      message = `Hi ${firstName}! Great having you on my AgroHeal frontline! Let's connect on your progress and growing your farming cooperative team! 🌾🌱`;
    } else {
      message = remaining === 0
        ? `Hi ${firstName}! Huge congratulations on completing all 5 of your direct partners on AgroHeal! 🎉 Let's keep supporting your team to duplicate!`
        : `Hi ${firstName}! Checking in on your AgroHeal Green Card progress. You currently have ${directs}/5 direct partners active (${remaining} to go to complete your First 5). Let me know how I can support you or if you'd like me to join an onboarding chat with your prospects! 🌾🌱`;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const isL1Active = !hasCompletedFirst5 || activeLevelTab === "L1";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#02180e] via-[#052615] to-[#011108] shadow-lg p-3.5 sm:p-4 text-white flex flex-col justify-between ${className}`}
    >
      {/* ── HEADER ROW ── */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Flame className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight whitespace-nowrap">
              GREEN CARD FIRST 5™
            </h3>

            {/* Level Switcher: Toggle between L1 (First 5) and L2 (Team 25 Duplication) */}
            {hasCompletedFirst5 ? (
              <div className="inline-flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveLevelTab("L1")}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeLevelTab === "L1"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-white/60 hover:text-white"
                  }`}
                  title="Switch to Level 1 (First 5) view"
                >
                  <Check className="w-2.5 h-2.5 text-emerald-200" />
                  <span>L1: First 5 (5/5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLevelTab("L2")}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeLevelTab === "L2"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-white/60 hover:text-white"
                  }`}
                  title="Switch to Level 2 (Team 25 Duplication) view"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  <span>L2: Duplication ({totalTier2Count}/25)</span>
                </button>
              </div>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                L1: Build Your 5
              </span>
            )}
          </div>
        </div>

        {/* Strategic Link to Full Interactive Network */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/dashboard/my-network"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/10 transition-all cursor-pointer"
            title="Open complete interactive organogram tree and directory"
          >
            <Users className="w-3 h-3 text-emerald-400" />
            <span>View Network</span>
            <ArrowUpRight className="w-2.5 h-2.5 text-white/50" />
          </Link>
        </div>
      </div>

      {/* ── PROGRESS & TARGET SUMMARY BAR ── */}
      <div className="mb-2.5 bg-black/45 rounded-xl px-3 py-2 border border-white/10 flex items-center justify-between gap-2 text-[10px]">
        {isL1Active ? (
          <>
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-white uppercase tracking-wider">
                Level 1:
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {completedDirects}/5
              </span>
              <span className="text-white/30 hidden sm:inline">•</span>
              <span className="text-emerald-200/80 truncate hidden sm:inline">
                {hasCompletedFirst5
                  ? "All 5 direct frontline seats completed! Full matrix bonuses unlocked 🎉"
                  : `${5 - completedDirects} more direct recruits to unlock full matrix commissions`}
              </span>
            </div>

            <div className="w-24 sm:w-36 bg-white/10 rounded-full h-1.5 overflow-hidden shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (completedDirects / 5) * 100)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-white uppercase tracking-wider">
                Level 2:
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {totalTier2Count}/25
              </span>
              <span className="text-white/30 hidden sm:inline">•</span>
              <span className="text-emerald-200/80 truncate hidden sm:inline">
                {leadersWith5} of 5 direct leaders recruited their 5
                {totalTier2Count < 25 && ` (${25 - totalTier2Count} to go for full L2)`}
              </span>
            </div>

            <div className="w-24 sm:w-36 bg-white/10 rounded-full h-1.5 overflow-hidden shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalTier2Count / 25) * 100)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
              />
            </div>
          </>
        )}
      </div>

      {/* ── 5 DIRECT LEADERS CARDS (ACCOUNTABILITY & NUDGE TRACK) ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-700/60 scrollbar-track-white/5">
        {[1, 2, 3, 4, 5].map((slotIdx) => {
          const leader = directLeaders[slotIdx - 1];

          if (leader) {
            const isLeaderActive =
              leader.isActivated !== false &&
              (leader.isActivated || Boolean(leader.memberId));
            const directs = leader.directsCount || leader.tier2Members?.length || 0;
            const isDone5 = directs >= 5;

            return (
              <div
                key={leader.id || slotIdx}
                className={`p-2 rounded-xl transition-all border flex flex-col justify-between min-h-[58px] min-w-[155px] w-[170px] shrink-0 ${
                  !isLeaderActive
                    ? "bg-amber-950/20 border-amber-500/30 text-amber-200/90"
                    : isDone5
                    ? "bg-emerald-500/20 border-emerald-400/50 text-white shadow-xs"
                    : directs > 0
                    ? "bg-white/10 border-emerald-500/30 text-white"
                    : "bg-white/5 border-white/10 text-emerald-200/80"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[11px] font-bold truncate flex-1 ${
                      !isLeaderActive ? "text-amber-200" : "text-white"
                    }`}
                    title={leader.fullName}
                  >
                    {leader.fullName}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                      !isLeaderActive
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                        : isL1Active
                        ? "bg-emerald-400 text-emerald-950 font-black"
                        : isDone5
                        ? "bg-emerald-400 text-emerald-950 font-black"
                        : directs > 0
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {!isLeaderActive
                      ? "⏳ Pending"
                      : isL1Active
                      ? "✓ Active"
                      : `${directs}/5`}
                  </span>
                </div>

                {/* Mini Progress Bar on card */}
                <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      !isLeaderActive
                        ? "bg-amber-400/40"
                        : isL1Active || isDone5
                        ? "bg-emerald-300"
                        : "bg-emerald-400/80"
                    }`}
                    style={{
                      width: !isLeaderActive
                        ? "0%"
                        : isL1Active
                        ? "100%"
                        : `${Math.min(100, (directs / 5) * 100)}%`,
                    }}
                  />
                </div>

                {/* 1-Tap Nudge / Follow-up Action */}
                <button
                  type="button"
                  onClick={(e) => handleNudgePartner(leader, e, isL1Active)}
                  className={`w-full inline-flex items-center justify-center gap-1 py-0.5 rounded-md text-[9.5px] font-medium border transition-all cursor-pointer ${
                    !isLeaderActive
                      ? "bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 hover:text-white border-amber-500/30 hover:border-amber-400/50"
                      : "bg-white/5 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border-white/10 hover:border-emerald-400/40"
                  }`}
                  title={
                    !isLeaderActive
                      ? `Remind ${leader.fullName} to complete Green Card activation on WhatsApp`
                      : isL1Active
                      ? `Chat with ${leader.fullName} on WhatsApp`
                      : `Follow up with ${leader.fullName} on WhatsApp`
                  }
                >
                  <MessageCircle className={`w-2.5 h-2.5 ${!isLeaderActive ? "text-amber-400" : "text-emerald-400"}`} />
                  <span>
                    {!isLeaderActive
                      ? "Nudge to Activate"
                      : isL1Active
                      ? "Chat Partner"
                      : isDone5
                      ? "Congratulate"
                      : "Follow Up"}
                  </span>
                </button>
              </div>
            );
          }

          // Open Slot Placeholder (when leader has fewer than 5 directs)
          return (
            <div
              key={`open-slot-${slotIdx}`}
              onClick={handleCopyLink}
              className="p-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col justify-between min-h-[58px] min-w-[155px] w-[170px] shrink-0 text-white/30 transition-all cursor-pointer group"
              title="Click to copy invite link and fill this slot"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-semibold text-white/50 group-hover:text-emerald-300 transition-colors truncate">
                  Open Slot #{slotIdx}
                </span>
                <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-white/5 text-white/40">
                  0/5
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden mb-1.5" />
              <div className="inline-flex items-center justify-center gap-1 text-[9px] text-emerald-400/70 group-hover:text-emerald-300">
                <Copy className="w-2.5 h-2.5" />
                <span>Copy Invite Link</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── STATUTORY QUALIFICATION FOOTNOTE ── */}
      <p className="text-[9px] text-emerald-300/70 italic mb-2 leading-tight line-clamp-1">
        {isL1Active
          ? "* Level 1: Direct recruits with active Green Card, Starter Pack (100g), and 1 Farm Slot count toward First 5 qualification."
          : "* Level 2 Duplication: Help each of your 5 direct frontline leaders enroll their 5 to complete your 25 Level 2 seats."}
      </p>

      {/* ── COMPACT ACTION ROW (WHATSAPP SHARE & COPY LINK) ── */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10">
        <button
          type="button"
          onClick={handleShareWhatsAppGeneral}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Invite on WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[11px] font-semibold transition-all cursor-pointer"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-emerald-300" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GreenCardFirst5Card;
