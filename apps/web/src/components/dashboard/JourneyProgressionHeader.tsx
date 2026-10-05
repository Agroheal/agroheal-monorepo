import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IdCard,
  Sprout,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLegacyMember } from "@shared/businessRules";

export interface JourneyProgressionHeaderProps {
  hasGreenCard: boolean;
  memberId?: string | null;
  totalSlots: number;
  directReferralsCount: number;
  referralCode?: string;
  walletBalance?: number;
  createdAt?: string | null;
  milestone3ActiveDate?: string | null;
  hasPurchasedStarterPack?: boolean;
  isLegacy?: boolean;
  onOpenShareModal?: () => void;
}

export const JourneyProgressionHeader: React.FC<JourneyProgressionHeaderProps> = ({
  hasGreenCard,
  memberId,
  totalSlots,
  directReferralsCount,
  referralCode,
  walletBalance = 0,
  createdAt,
  milestone3ActiveDate,
  hasPurchasedStarterPack = false,
  isLegacy = false,
  onOpenShareModal,
}) => {
  const navigate = useNavigate();
  // Folded by default per user specification
  const [isFolded, setIsFolded] = useState<boolean>(true);

  const isMemberLegacy = Boolean(isLegacy) || isLegacyMember(createdAt);

  // Determine current active milestone
  const isStep1Done = Boolean(hasGreenCard);
  const isStep2Done = isMemberLegacy
    ? Boolean(hasPurchasedStarterPack)
    : Boolean(hasGreenCard && totalSlots > 0 && hasPurchasedStarterPack);
  const isStep3Done = Boolean(hasGreenCard && isStep2Done && directReferralsCount >= 5);

  let currentStep = 1;
  if (isStep1Done && !isStep2Done) currentStep = 2;
  else if (isStep1Done && isStep2Done && !isStep3Done) currentStep = 3;
  else if (isStep3Done) currentStep = 4;

  // Management Rule: When Milestone 3 is active and in-progress, stop showing after 21 days
  const m3Date = milestone3ActiveDate || createdAt;
  const daysSinceMilestone3 = m3Date
    ? Math.floor((Date.now() - new Date(m3Date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (currentStep === 3 && m3Date && daysSinceMilestone3 > 21) {
    return null;
  }

  // Management Rule: Once Milestone 3 is COMPLETED, allow the milestone stuff to be there for 21 days total
  const m3CompletedKey = memberId ? `agroheal_m3_completed_${memberId}` : "agroheal_m3_completed_default";
  let completionTimestamp = 0;
  if (isStep3Done) {
    const stored = typeof window !== "undefined" ? localStorage.getItem(m3CompletedKey) : null;
    if (!stored) {
      const nowIso = new Date().toISOString();
      if (typeof window !== "undefined") {
        try { localStorage.setItem(m3CompletedKey, nowIso); } catch {}
      }
      completionTimestamp = Date.now();
    } else {
      completionTimestamp = new Date(stored).getTime();
    }
  }

  const daysSinceCompleted = isStep3Done && completionTimestamp
    ? Math.floor((Date.now() - completionTimestamp) / (1000 * 60 * 60 * 24))
    : 0;

  // Disappears after 21 days total
  if (isStep3Done && daysSinceCompleted >= 21) {
    return null;
  }

  // Determine concise folded status summary
  let statusBadge = "Starter Package Pending";
  let headline = "Activate ₦12,000 Starter Package";
  let shortSummary = "Includes Green Card (₦2,000), Mushroom Power 100g (₦5,000), and 1st Farm Slot (₦5,000) to lock your matrix node.";
  let ctaText = "Activate ₦12,000 Package";
  let onCtaClick = () => navigate("/dashboard/checkout?bundle=starter");
  let isWarning = true;

  if (isMemberLegacy && !hasPurchasedStarterPack) {
    statusBadge = "Founding Member";
    headline = "Activate Mushroom Power 100g (₦5,000)";
    shortSummary = "Green Card is free. Activate welcome product to unlock full withdrawals & 5×7 community tree.";
    ctaText = "Activate (₦5,000)";
    onCtaClick = () => navigate("/dashboard/checkout?product=SP-MUSH-100G");
    isWarning = true;
  } else if (!isMemberLegacy && (!isStep1Done || !isStep2Done)) {
    statusBadge = "Starter Package Pending";
    headline = "Activate ₦12,000 Starter Package";
    shortSummary = "Green Card (₦2k), Mushroom Power 100g (₦5k) & 1st Farm Slot (₦5k) to lock your permanent node.";
    ctaText = "Activate (₦12,000)";
    onCtaClick = () => navigate("/dashboard/checkout?bundle=starter");
    isWarning = true;
  } else if (directReferralsCount < 5) {
    statusBadge = `${directReferralsCount}/5 Directs`;
    headline = `Sponsor ${5 - directReferralsCount} More Direct Partner(s)`;
    shortSummary = `Refer 5 friends with the ₦12,000 package to unlock all 7 matrix commission tiers (${directReferralsCount}/5 reached).`;
    ctaText = "Share Link";
    onCtaClick = onOpenShareModal ? onOpenShareModal : () => navigate("/dashboard/my-network");
    isWarning = false;
  } else {
    statusBadge = "✓ All 3 Milestones Done";
    headline = "All 7 Matrix Commission Tiers Active";
    shortSummary = "Your 5×7 matrix placement node is fully qualified down 7 tiers. Share your link for community spillovers.";
    ctaText = "View Network";
    onCtaClick = () => navigate("/dashboard/my-network");
    isWarning = false;
  }

  return (
    <div
      className={`w-full rounded-2xl border-2 transition-all duration-200 shadow-md mb-8 overflow-hidden ${
        isWarning
          ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600/70"
          : "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600/70"
      }`}
    >
      {/* ── COMPACT FOLDED HEADER BAR ── */}
      <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          onClick={() => setIsFolded((prev) => !prev)}
          className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isStep3Done
                ? "bg-emerald-600 text-white shadow-xs"
                : isWarning
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-emerald-600 text-white shadow-xs"
            }`}
          >
            {isStep3Done ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Compass className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                What to do now?
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  isWarning
                    ? "bg-amber-200 text-amber-950 dark:bg-amber-900/80 dark:text-amber-200 border-amber-400 dark:border-amber-600"
                    : "bg-emerald-200 text-emerald-950 dark:bg-emerald-900/80 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600"
                }`}
              >
                {statusBadge}
              </span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5 font-medium">
              <strong className="text-slate-950 dark:text-white font-extrabold">{headline}</strong> • {shortSummary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            size="sm"
            onClick={onCtaClick}
            className={`text-xs h-7 sm:h-8 px-3 rounded-xl font-bold shadow-xs cursor-pointer ${
              isWarning
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {ctaText}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFolded((prev) => !prev)}
            className="h-7 sm:h-8 px-2.5 rounded-xl border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-2xs"
            title={isFolded ? "Expand pathway" : "Fold banner"}
          >
            <span className="hidden sm:inline text-[11px] font-bold">
              {isFolded ? "Details" : "Fold"}
            </span>
            {isFolded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── EXPANDABLE 3-MILESTONE PATHWAY DETAILS ── */}
      {!isFolded && (
        <div className="p-4 md:p-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3.5 animate-in fade-in duration-200">
          {/* MILESTONE 1: GREEN CARD */}
          <div
            className={`rounded-xl p-3.5 border-2 flex flex-col justify-between shadow-2xs ${
              isStep1Done
                ? "bg-white/95 dark:bg-slate-900/90 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white"
                : "bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-slate-950 dark:text-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase text-slate-600 dark:text-slate-400">
                  Milestone 01
                </span>
                {isStep1Done ? (
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">Pending</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <IdCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Agroheal Green Card
                </h4>
              </div>

              <p className="text-[11.5px] text-slate-700 dark:text-slate-200 leading-relaxed mb-2.5 font-medium">
                {isMemberLegacy
                  ? "Free lifetime pass for founding members. Enables personal AGC affiliate ID."
                  : "₦2,000 digital lifetime credentials included in ₦12,000 package. Unlocks personal AGC ID & ₦1,000 direct referral bounty."}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {memberId ? `ID: ${memberId}` : "₦2,000 Value"}
              </span>
              {isStep1Done ? (
                <Link
                  to="/dashboard/profile/green-card"
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px]"
                >
                  View Pass <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/checkout?bundle=starter")}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
                >
                  Activate <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* MILESTONE 2: STARTER PACKAGE & MUSHROOM VILLAGE */}
          <div
            className={`rounded-xl p-3.5 border-2 flex flex-col justify-between shadow-2xs ${
              isStep2Done
                ? "bg-white/95 dark:bg-slate-900/90 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white"
                : isStep1Done
                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-slate-950 dark:text-white"
                : "bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-80"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase text-slate-600 dark:text-slate-400">
                  Milestone 02
                </span>
                {isStep2Done ? (
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : isStep1Done ? (
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">
                    Next Step
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Mushroom Village &amp; Welcome Product
                </h4>
              </div>

              <p className="text-[11.5px] text-slate-700 dark:text-slate-200 leading-relaxed mb-2.5 font-medium">
                {isMemberLegacy
                  ? "Activate Mushroom Power 100g (₦5,000) to unlock full withdrawals & 5×7 matrix organogram."
                  : "Included in ₦12,000 package: Mushroom Power 100g (₦5,000) + 1st Farm Slot (₦5,000) locking your permanent matrix placement & bank withdrawals."}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                {totalSlots > 0 ? `${totalSlots} Farm Slot${totalSlots > 1 ? "s" : ""}` : "₦10,000 Value"}
              </span>
              {isStep2Done ? (
                <Link
                  to="/dashboard/farm-operations/my-slots"
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px]"
                >
                  My Slots <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      isMemberLegacy
                        ? "/dashboard/checkout?product=SP-MUSH-100G"
                        : "/dashboard/checkout?bundle=starter"
                    )
                  }
                  className="text-amber-700 dark:text-amber-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
                >
                  {isMemberLegacy ? "Activate ₦5k" : "Activate ₦12k"} <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* MILESTONE 3: 5 DIRECTS & 7-TIER MATRIX */}
          <div
            className={`rounded-xl p-3.5 border-2 flex flex-col justify-between shadow-2xs ${
              isStep3Done
                ? "bg-white/95 dark:bg-slate-900/90 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white"
                : isStep2Done
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-slate-950 dark:text-white"
                : "bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-80"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-black uppercase text-slate-600 dark:text-slate-400">
                  Milestone 03
                </span>
                {isStep3Done ? (
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All 7 Tiers Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                    {directReferralsCount}/5 Directs
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Sponsor 5 Direct Partners
                </h4>
              </div>

              <p className="text-[11.5px] text-slate-700 dark:text-slate-200 leading-relaxed mb-2.5 font-medium">
                Sponsor 5 active members with the ₦12,000 package to unlock all 7 tiers of community matrix commissions. Earn ₦1,000 bounty + ₦500 slot commission per partner.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                Tier {Math.min(7, Math.max(1, directReferralsCount + 2))} Active
              </span>
              <button
                type="button"
                onClick={onOpenShareModal ? onOpenShareModal : () => navigate("/dashboard/my-network")}
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Share2 className="w-3 h-3" /> Share Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyProgressionHeader;

