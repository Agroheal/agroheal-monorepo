import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Users,
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
  matrixLevels,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // ── 1. PREPARE MEMBER DATA FOR MATRIX LEVELS 1 TO 7 ──
  // If authoritative matrixLevels prop is provided, use exact 5x7 matrix placement nodes!
  // Otherwise, fall back to referralsList hierarchy.
  const level1Members: MatrixLevelMember[] = useMemo(() => {
    if (matrixLevels?.level1) {
      return matrixLevels.level1;
    }
    return referralsList.slice(0, 5).map((r) => ({
      id: r.id,
      fullName: r.fullName,
      memberId: r.memberId,
      directsCount: r.directsCount || r.tier2Members?.length || 0,
    }));
  }, [matrixLevels, referralsList]);

  const level1Filled = matrixLevels
    ? level1Members.length
    : (level1Members.length > 0 ? level1Members.length : Math.min(5, Math.max(directReferralsCount, referralsList.length)));
  const level1Done = level1Filled >= 5;

  const level2Members: MatrixLevelMember[] = useMemo(() => {
    if (matrixLevels?.level2) {
      return matrixLevels.level2;
    }
    const list: MatrixLevelMember[] = [];
    referralsList.slice(0, 5).forEach((leader) => {
      (leader.tier2Members || []).forEach((m) => {
        list.push({
          id: m.id,
          fullName: m.fullName,
          memberId: m.memberId,
          directsCount: m.directsCount || m.tier3Members?.length || 0,
        });
      });
    });
    return list;
  }, [matrixLevels, referralsList]);

  const level2Filled = level2Members.length;
  const level2Done = level1Done && level2Filled >= 25;

  const level3Members: MatrixLevelMember[] = useMemo(() => {
    if (matrixLevels?.level3) {
      return matrixLevels.level3;
    }
    const list: MatrixLevelMember[] = [];
    referralsList.slice(0, 5).forEach((leader) => {
      (leader.tier2Members || []).forEach((t2) => {
        (t2.tier3Members || []).forEach((t3) => {
          list.push({
            id: t3.id,
            fullName: t3.fullName,
            memberId: t3.memberId,
            directsCount: t3.directsCount || t3.tier4Members?.length || 0,
          });
        });
      });
    });
    return list;
  }, [matrixLevels, referralsList]);

  const level3Filled = level3Members.length;
  const level3Done = level2Done && level3Filled >= 125;

  const level4Members: MatrixLevelMember[] = useMemo(() => {
    if (matrixLevels?.level4) {
      return matrixLevels.level4;
    }
    const list: MatrixLevelMember[] = [];
    referralsList.slice(0, 5).forEach((leader) => {
      (leader.tier2Members || []).forEach((t2) => {
        (t2.tier3Members || []).forEach((t3) => {
          (t3.tier4Members || []).forEach((t4) => {
            list.push({
              id: t4.id,
              fullName: t4.fullName,
              memberId: t4.memberId,
              directsCount: t4.directsCount || 0,
            });
          });
        });
      });
    });
    return list;
  }, [matrixLevels, referralsList]);

  const level4Filled = level4Members.length;
  const level4Done = level3Done && level4Filled >= 625;

  const level5Members: MatrixLevelMember[] = useMemo(() => {
    return matrixLevels?.level5 || [];
  }, [matrixLevels]);

  const level5Filled = level5Members.length;
  const level5Done = level4Done && level5Filled >= 3125;

  const level6Members: MatrixLevelMember[] = useMemo(() => {
    return matrixLevels?.level6 || [];
  }, [matrixLevels]);

  const level6Filled = level6Members.length;
  const level6Done = level5Done && level6Filled >= 15625;

  const level7Members: MatrixLevelMember[] = useMemo(() => {
    return matrixLevels?.level7 || [];
  }, [matrixLevels]);

  const level7Filled = level7Members.length;
  const level7Done = level6Done && level7Filled >= 78125;

  // ── 2. ACTIVELY FILLING LEVEL CALCULATION ──
  // The default level is the level the user is currently actively filling
  const activelyFillingLevel = useMemo(() => {
    if (!level1Done) return 1;
    if (!level2Done) return 2;
    if (!level3Done) return 3;
    if (!level4Done) return 4;
    if (!level5Done) return 5;
    if (!level6Done) return 6;
    return 7;
  }, [level1Done, level2Done, level3Done, level4Done, level5Done, level6Done]);

  // Controls stop at the level currently being filled up (highest level yet to be filled)
  const maxViewableLevel = activelyFillingLevel;

  // Current level selected by user (defaults to actively filling level)
  const [viewingLevel, setViewingLevel] = useState<number>(activelyFillingLevel);

  useEffect(() => {
    setViewingLevel(activelyFillingLevel);
  }, [activelyFillingLevel]);

  // Tier metadata up to Level 7
  const tierConfig = useMemo(() => [
    {
      lvl: 1,
      title: "Level 1: Frontline 5",
      capacity: 5,
      current: level1Filled,
      isDone: level1Done,
      members: level1Members,
    },
    {
      lvl: 2,
      title: "Level 2: Duplication",
      capacity: 25,
      current: level2Filled,
      isDone: level2Done,
      members: level2Members,
    },
    {
      lvl: 3,
      title: "Level 3: Expansion",
      capacity: 125,
      current: level3Filled,
      isDone: level3Done,
      members: level3Members,
    },
    {
      lvl: 4,
      title: "Level 4: Momentum",
      capacity: 625,
      current: level4Filled,
      isDone: level4Done,
      members: level4Members,
    },
    {
      lvl: 5,
      title: "Level 5: Leadership",
      capacity: 3125,
      current: level5Filled,
      isDone: level5Done,
      members: level5Members,
    },
    {
      lvl: 6,
      title: "Level 6: Enterprise",
      capacity: 15625,
      current: level6Filled,
      isDone: level6Done,
      members: level6Members,
    },
    {
      lvl: 7,
      title: "Level 7: Apex Crown",
      capacity: 78125,
      current: level7Filled,
      isDone: level7Done,
      members: level7Members,
    },
  ], [
    level1Filled, level1Done, level1Members,
    level2Filled, level2Done, level2Members,
    level3Filled, level3Done, level3Members,
    level4Filled, level4Done, level4Members,
    level5Filled, level5Done, level5Members,
    level6Filled, level6Done, level6Members,
    level7Filled, level7Done, level7Members,
  ]);

  const currentTier = tierConfig.find((t) => t.lvl === viewingLevel) || tierConfig[0];

  // Referral links & sharing
  const origin = typeof window !== "undefined" ? window.location.origin : "https://agroheal.solutions";
  const inviteLink = `${origin}/signup?ref=${referralCode || "356FV1"}`;
  const shareText = `🌱 Join my AgroHeal organic farming cooperative team with my Green Card invite: ${inviteLink}`;

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

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const displayedMembers = currentTier.members;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#062115] via-[#04170e] to-[#020e07] text-white shadow-md p-3 sm:p-3.5 flex flex-col justify-between ${className}`}
    >
      {/* ── HEADER ROW WITH COMPACT NAVIGATION & VIEW FULL NETWORK LINK ── */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Flame className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              GREEN CARD FIRST 5™
            </h3>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              L{viewingLevel}
            </span>
            {viewingLevel === activelyFillingLevel && (
              <span className="text-[8.5px] font-semibold uppercase px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Filling
              </span>
            )}
          </div>
        </div>

        {/* Strategic Link: View Full Network & Level Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/dashboard/my-network"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-white/10 transition-all cursor-pointer"
            title="View complete interactive network organogram"
          >
            <Users className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Network</span>
            <ArrowUpRight className="w-2.5 h-2.5 text-white/50" />
          </Link>

          {/* Level Switcher (< Back / Next >) */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setViewingLevel((prev) => Math.max(1, prev - 1))}
              disabled={viewingLevel <= 1}
              className="px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center text-[10px] font-semibold"
              title="Go back to previous level"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            <div className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono font-bold text-emerald-300">
              {currentTier.current}/{currentTier.capacity}
            </div>

            <button
              type="button"
              onClick={() => setViewingLevel((prev) => Math.min(maxViewableLevel, prev + 1))}
              disabled={viewingLevel >= maxViewableLevel}
              className="px-1.5 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center text-[10px] font-semibold"
              title="Go to next level"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── LEVEL SUMMARY & METRICS BAR ── */}
      {(() => {
        const recruitsWith5 = displayedMembers.filter((m) => (m.directsCount || 0) >= 5).length;
        const remainingSlots = Math.max(0, currentTier.capacity - currentTier.current);

        return (
          <div className="mb-2 bg-black/35 rounded-lg px-2.5 py-1.5 border border-white/5 flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-white uppercase">
                L{viewingLevel}:
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {currentTier.current}/{currentTier.capacity}
              </span>
              <span className="text-white/30 hidden sm:inline">•</span>
              <span className="text-emerald-200/80 truncate hidden sm:inline">
                {recruitsWith5} of {currentTier.current} recruited direct 5
                {remainingSlots > 0 && ` (${remainingSlots} to go)`}
              </span>
            </div>

            <div className="w-24 sm:w-36 bg-white/10 rounded-full h-1 overflow-hidden shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (currentTier.current / currentTier.capacity) * 100)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-full"
              />
            </div>
          </div>
        );
      })()}

      {/* ── MEMBER CARDS (HORIZONTAL SCROLL TRACK) ── */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 mb-1.5 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-700/60 scrollbar-track-white/5">
        {displayedMembers.map((member, idx) => {
          const directs = member.directsCount || 0;
          const isFull5 = directs >= 5;

          return (
            <div
              key={member.id || idx}
              className={`p-1.5 sm:p-2 rounded-lg transition-all border flex flex-col justify-between min-h-[46px] min-w-[150px] w-[165px] shrink-0 ${
                isFull5
                  ? "bg-emerald-500/15 border-emerald-400/50 text-white"
                  : directs > 0
                  ? "bg-white/10 border-emerald-500/30 text-white"
                  : "bg-white/5 border-white/10 text-emerald-200/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className="text-[11px] font-semibold text-white truncate flex-1"
                  title={member.fullName}
                >
                  {member.fullName}
                </span>

                <span
                  className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                    isFull5
                      ? "bg-emerald-400 text-emerald-950 font-black"
                      : directs > 0
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {directs}/5
                </span>
              </div>

              {/* Mini progress bar on card */}
              <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${
                    isFull5 ? "bg-emerald-300" : "bg-emerald-400/80"
                  }`}
                  style={{ width: `${Math.min(100, (directs / 5) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Level 1 Open Slot Placeholders */}
        {viewingLevel === 1 &&
          Array.from({ length: Math.max(0, 5 - displayedMembers.length) }).map((_, idx) => (
            <div
              key={`open-l1-${idx}`}
              className="p-1.5 sm:p-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] flex flex-col justify-between min-h-[46px] min-w-[150px] w-[165px] shrink-0 text-white/30"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-medium truncate">
                  Open Slot #{displayedMembers.length + idx + 1}
                </span>
                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-white/5 text-white/40">
                  0/5
                </span>
              </div>
              <span className="text-[8.5px] text-white/30 italic">Awaiting recruit</span>
            </div>
          ))}

        {/* Unfilled Level Empty State */}
        {viewingLevel > 1 && displayedMembers.length === 0 && (
          <div className="w-full py-2.5 px-3 rounded-lg bg-white/[0.03] border border-dashed border-white/10 text-center">
            <p className="text-[10px] text-emerald-200/70">
              Level {viewingLevel} slots will unlock as Level {viewingLevel - 1} partners recruit their direct 5.
            </p>
          </div>
        )}
      </div>

      {/* ── STATUTORY QUALIFICATION FOOTNOTE ── */}
      <p className="text-[9px] text-emerald-300/70 italic mb-2 leading-tight line-clamp-1">
        * Note: Direct recruits with active Green Card, Starter Pack (100g), and 1 Farm Slot count toward First 5 progression.
      </p>

      {/* ── COMPACT ACTION ROW (WHATSAPP SHARE & COPY LINK) ── */}
      <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold transition-all cursor-pointer"
        >
          <MessageCircle className="w-3 h-3" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[11px] font-semibold transition-all cursor-pointer"
        >
          {copiedLink ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-emerald-300" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
