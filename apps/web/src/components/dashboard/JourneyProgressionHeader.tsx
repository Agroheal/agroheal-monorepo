import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IdCard,
  Sprout,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Gift,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  isLegacyMember,
  getGreenCardFee,
  formatNaira,
} from "@shared/businessRules";

export interface JourneyProgressionHeaderProps {
  hasGreenCard: boolean;
  memberId?: string | null;
  totalSlots: number;
  directReferralsCount: number;
  referralCode?: string;
  walletBalance?: number;
  createdAt?: string | null;
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
  onOpenShareModal,
}) => {
  const navigate = useNavigate();
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  const isLegacy = isLegacyMember(createdAt);
  const activeFee = getGreenCardFee(createdAt);

  // Determine current active milestone
  const isStep1Done = Boolean(hasGreenCard);
  const isStep2Done = Boolean(hasGreenCard && totalSlots > 0);
  const isStep3Done = Boolean(hasGreenCard && totalSlots > 0 && directReferralsCount >= 5);

  let currentStep = 1;
  if (isStep1Done && !isStep2Done) currentStep = 2;
  else if (isStep1Done && isStep2Done && !isStep3Done) currentStep = 3;
  else if (isStep3Done) currentStep = 4;

  return (
    <div className="w-full bg-card rounded-2xl border border-border/60 shadow-xs mb-8 overflow-hidden">
      {/* Header Banner Strip */}
      <div className="px-5 py-4 bg-muted/30 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
              Member Journey &amp; Earning Pathway
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {currentStep <= 3 ? `Milestone ${currentStep} of 3 Active` : "All Milestones Completed"}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Follow this 2-step journey to unlock full commercial withdrawal rights and 7-level compound earnings.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailsDrawer((v) => !v)}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showDetailsDrawer ? "Hide Journey Details" : "How Journey Works"}</span>
          {showDetailsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Intelligent Guidance Drawer */}
      {showDetailsDrawer && (
        <div className="p-5 bg-muted/15 border-b border-border/40 text-xs text-muted-foreground animate-in fade-in duration-200">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-background border border-border/50">
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <IdCard className="w-4 h-4 text-emerald-600" />
                <span>1. Agroheal Green Card ({formatNaira(activeFee)}{isLegacy ? " - Pioneer Rate" : ""})</span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2">
                Grants verified digital membership, immediate affiliate link, and pays ₦1,000 instant commission per referral into your wallet.
              </p>
              <Link
                to="/dashboard/profile/green-card"
                className="text-primary hover:underline text-[11px] font-semibold inline-flex items-center gap-1"
              >
                View Green Card &amp; Passes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border/50">
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>2. Producer-Consumer Package (₦10,000)</span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2">
                ₦5,000 Group Farm Slot + ₦5,000 Mushroom Power 100g Starter Pack. <strong>Crucial milestone:</strong> This unlocks full external bank withdrawals for all your accumulated wallet bonuses!
              </p>
              <Link
                to="/dashboard/mushroom-village"
                className="text-primary hover:underline text-[11px] font-semibold inline-flex items-center gap-1"
              >
                Mushroom Village Overview <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border/50">
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>3. Build &amp; Compound (5 Friends Goal)</span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2">
                Share with friends! Earn ₦1,000 cash for each friend who joins, earn 5×7 bonuses when your community gets farm slots, and connect 5 friends to unlock bank payouts.
              </p>
              <Link
                to="/dashboard/my-network"
                className="text-primary hover:underline text-[11px] font-semibold inline-flex items-center gap-1"
              >
                5×7 Community Network <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Infographic Stepper Ribbon */}
      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── STEP 1: GREEN CARD ──────────────────────────────────────────────── */}
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
                Step 01
              </span>
              {isStep1Done ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
                  Active Next Step
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
                <span><strong>₦1,000 instant referral bounty</strong> into wallet</span>
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
                  onClick={() => navigate("/subscribe")}
                  className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Get Green Card ({formatNaira(activeFee)})
                </Button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/checkout?slots=1&category=Mushroom%20Village")}
                  className="w-full text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 py-0.5 text-center transition-colors cursor-pointer"
                >
                  <Sprout className="w-3.5 h-3.5 shrink-0" />
                  <span>Afford both? Bundle Green Card + Slot</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2: MUSHROOM VILLAGE PACKAGE ───────────────────────────────── */}
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
                Step 02
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
                  Producer-Consumer Package
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ₦10,000 Combo Package
                </span>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs mb-4">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>₦5,000 Group Farm Slot</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>₦5,000 Mushroom Power 100g Starter Pack</span>
              </li>
              <li className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>🔓 <strong>Unlocks Full Bank Withdrawals</strong></span>
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                <span>Group Farm dividends &amp; 5×7 sale commissions</span>
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
                onClick={() => navigate("/dashboard/mushroom-village")}
                className="w-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                Upgrade to ₦10k Package
              </Button>
            ) : (
              <div className="text-center py-1 text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Complete Step 1 First
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 3: 5 DIRECTS & MATRIX ─────────────────────────────────────── */}
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
                Step 03
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
                  <Lock className="w-3 h-3" /> Step 2 Required
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
                <span><strong>5×7 Team Commissions:</strong> Earn cash bonuses whenever anyone in your community gets slots</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong>5 Friends Goal:</strong> Reach 5 friends to qualify for bank withdrawals</span>
              </li>
              <li className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                <span>Harvest payouts shared every 3 months</span>
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
                <Lock className="w-3 h-3" /> Complete Steps 1 &amp; 2
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyProgressionHeader;
