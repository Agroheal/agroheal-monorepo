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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getGreenCardFee,
  formatNaira,
  isLegacyMember,
} from "@shared/businessRules";

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
  const [isManuallyToggled, setIsManuallyToggled] = useState<boolean | null>(null);

  const activeFee = getGreenCardFee(createdAt);
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

  // Management Rule: Once Milestone 3 is COMPLETED, allow the milestone stuff to be there for 3 days open,
  // after which it folds on its own, but user can re-open/draw it down for another 18 days (21 days total),
  // after which it disappears completely on its own.
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

  // Disappears after 21 days total (3 days open + 18 days folded)
  if (isStep3Done && daysSinceCompleted >= 21) {
    return null;
  }

  // Auto-fold after 3 days
  const isAutoFolded = isStep3Done && daysSinceCompleted >= 3;
  const isFolded = isManuallyToggled !== null ? isManuallyToggled : isAutoFolded;

  // If folded, render the compact drawer
  if (isStep3Done && isFolded) {
    return (
      <div className="w-full bg-emerald-950/15 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              All 3 Milestones Completed! 🎉
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Day {Math.min(21, daysSinceCompleted + 1)} of 21
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Milestone pathway folded automatically. Tap to review your completed badges and earning progress.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsManuallyToggled(false)}
          className="rounded-xl text-xs h-8 px-3 shrink-0 flex items-center gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer self-start sm:self-auto"
        >
          <span>View Pathway</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-2xl border border-border/60 shadow-xs mb-8 overflow-hidden">
      {/* Header Banner Strip */}
      <div className="px-5 py-4 bg-muted/30 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
              Member Milestones &amp; Earning Pathway
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {isStep3Done
                  ? `All 3 Milestones Completed 🎉 (Day ${Math.min(21, daysSinceCompleted + 1)}/21)`
                  : currentStep === 3
                  ? `Milestone 3 of 3 Active (Day ${Math.min(21, Math.max(1, daysSinceMilestone3 + 1))}/21)`
                  : `Milestone ${currentStep} of 3 Active`}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Follow this 3-milestone pathway to unlock full commercial withdrawal rights, producer harvests, and 5×7 compound earnings.
            </p>
          </div>
        </div>

        {isStep3Done && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsManuallyToggled(true)}
            className="text-xs h-7 px-2.5 text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Fold Ribbon</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* 3-Milestone Infographic Ribbon */}
      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── MILESTONE 1: GREEN CARD ────────────────────────────────────────── */}
        <div
          className={`relative rounded-xl p-4 transition-all border flex flex-col justify-between ${
            isStep1Done
              ? "bg-muted/10 border-border/40 text-muted-foreground opacity-85"
              : currentStep === 1
              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30 text-foreground shadow-xs"
              : "bg-muted/10 border-border/40 text-muted-foreground opacity-70"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-muted-foreground">
                Milestone 01
              </span>
              {isStep1Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
                  Active Milestone
                </span>
              )}
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isStep1Done
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-primary text-primary-foreground font-bold shadow-xs"
                }`}
              >
                <IdCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  Agroheal Green Card
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ₦2,000 One-Time
                </span>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs mb-4">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Full platform &amp; verified digital access</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Personal Affiliate Link enabled immediately</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>₦1,000 instant referral commission</strong> into wallet</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-border/30">
            {isStep1Done ? (
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] font-semibold text-foreground">
                  ID: {memberId || "Active Member"}
                </span>
                <Link
                  to="/dashboard/profile/green-card"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  View Pass <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Button
                  size="sm"
                  onClick={() => navigate("/dashboard/checkout?bundle=starter")}
                  className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Activate Starter Package (₦12,000)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── MILESTONE 2: MUSHROOM VILLAGE STARTER PACKAGE ───────────────────── */}
        <div
          className={`relative rounded-xl p-4 transition-all border flex flex-col justify-between ${
            isStep2Done
              ? "bg-muted/10 border-border/40 text-muted-foreground opacity-85"
              : currentStep === 2
              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30 text-foreground shadow-xs"
              : "bg-muted/10 border-border/40 text-muted-foreground opacity-60"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-muted-foreground">
                Milestone 02
              </span>
              {isStep2Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              ) : currentStep === 2 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                  Unlock Withdrawals
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isStep2Done
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : currentStep === 2
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  Starter Package
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ₦10,000 Combo Package
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">
              Your starter package is ₦10,000 (₦5,000 Mushroom Group farm setup + ₦5,000 Mushroom Power 100g). Remember that a farm slot alone won't qualify without the Mushroom 100g product—we only sell it together as a combo.
            </p>

            <ul className="space-y-1.5 text-xs mb-4">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>₦5,000 Mushroom Group farm setup</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>₦5,000 Mushroom Power (100g) combo</span>
              </li>
              <li className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>🔓 <strong>Unlocks Full Bank Withdrawals</strong></span>
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                <span>Group Farm dividends &amp; 5×7 commissions</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-border/30">
            {isStep2Done ? (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {totalSlots} Farm Slot{totalSlots > 1 ? "s" : ""} Active
                </span>
                <Link
                  to="/dashboard/farm-operations/my-slots"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  Farm Account <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : currentStep === 2 ? (
              <Button
                size="sm"
                onClick={() =>
                  navigate(
                    isMemberLegacy && !hasPurchasedStarterPack
                      ? "/dashboard/checkout?product=SP-MUSH-100G"
                      : "/dashboard/checkout?bundle=starter_completion"
                  )
                }
                className="w-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                {isMemberLegacy && !hasPurchasedStarterPack
                  ? "Activate Mushroom Power (₦5,000)"
                  : "Secure Starter Package (₦10,000)"}
              </Button>
            ) : (
              <div className="text-center py-1 text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Complete Milestone 1 First
              </div>
            )}
          </div>
        </div>

        {/* ── MILESTONE 3: 5 DIRECTS & MATRIX ─────────────────────────────────── */}
        <div
          className={`relative rounded-xl p-4 transition-all border flex flex-col justify-between ${
            isStep3Done
              ? "bg-muted/10 border-border/40 text-muted-foreground opacity-85"
              : currentStep === 3
              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30 text-foreground shadow-xs"
              : "bg-muted/10 border-border/40 text-muted-foreground opacity-60"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-muted-foreground">
                Milestone 03
              </span>
              {isStep3Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> 5+ Directs Reached
                </span>
              ) : currentStep === 3 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {directReferralsCount}/5 Directs
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <Lock className="w-3 h-3" /> Milestone 2 Required
                </span>
              )}
            </div>

            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isStep3Done
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : currentStep === 3
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  Build &amp; Compound
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  Invite 5 Friends Goal
                </span>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs mb-4">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>Instant ₦1,000 Cash:</strong> You get ₦1,000 every time a friend signs up</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>₦500 per slot:</strong> Earn ₦500 whenever your direct referrals secure a slot.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>5 x 7 Commissions:</strong> Earn cash bonuses whenever anyone in your network makes food purchases.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>5 Friends Goal:</strong> Reach 5 friends to qualify for bank withdrawals</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 border-t border-border/30">
            {currentStep >= 3 ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenShareModal ? onOpenShareModal : () => navigate("/dashboard/my-network")}
                  className="flex-1 text-xs h-8"
                >
                  Share Link
                </Button>
                <Link
                  to="/dashboard/my-network"
                  className="text-xs font-medium text-primary hover:underline px-2 py-1"
                >
                  View Matrix →
                </Link>
              </div>
            ) : (
              <div className="text-center py-1 text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Complete Milestones 1 &amp; 2
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyProgressionHeader;
