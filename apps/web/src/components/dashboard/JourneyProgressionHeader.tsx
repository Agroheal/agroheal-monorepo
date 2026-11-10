import React, { useState, useEffect } from "react";
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
  CreditCard,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLegacyMember, formatNaira, isGreenCardHolder, hasPurchasedStarterPack as checkHasPurchasedStarterPack, isThreeStepQualified } from "@shared/businessRules";
import { getEntryPricing } from "@shared/cutover";
import { apiClient } from "@/lib/apiClient";

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

interface InstalmentPlanData {
  id: string;
  status: "ACTIVE" | "OVERDUE" | "FULLY_PAID" | "DEFAULTED";
  totalRegistrationFee: number;
  cumulativePaid: number;
  remainingBalance: number;
  totalOverdueCharges: number;
  overdueChargesPaid: number;
  currentWeek: number;
  nextPaymentDueDate: string;
  isOverdue: boolean;
  currentAmountDue: number;
  standardAmountDue: number;
  overdueSurcharge: number;
  milestones: {
    day1Active: boolean;
    sponsorBonus5kPaid: boolean;
    starterPack10kReleased: boolean;
    farmSlot15kAllocated: boolean;
  };
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
  const [instalmentPlan, setInstalmentPlan] = useState<InstalmentPlanData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPlan = async () => {
      try {
        const res = await apiClient.instalments.getMyPlan();
        if (isMounted) {
          if (res.hasPlan && res.plan && res.plan.status !== "FULLY_PAID") {
            setInstalmentPlan(res.plan);
          } else {
            setInstalmentPlan(null);
          }
        }
      } catch (err) {
        // silent fallback for non-instalment or network issue
      }
    };

    fetchPlan();

    const handleUpdate = () => {
      fetchPlan();
    };

    window.addEventListener("agroheal:instalment_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("agroheal:instalment_updated", handleUpdate);
    };
  }, []);

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

  // User Specification: Once Step 2 is completed (Green Card + Starter Pack + Slot),
  // First 5 direct referrals & duplication are actively tracked by GreenCardFirst5Card above to avoid duplicate prompts.
  if (isStep2Done) {
    return null;
  }

  // Management Rule: When Milestone 3 is active and in-progress, stop showing after 21 days
  const m3Date = milestone3ActiveDate || createdAt;
  const daysSinceMilestone3 = m3Date
    ? Math.floor((Date.now() - new Date(m3Date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (currentStep === 3 && m3Date && daysSinceMilestone3 > 21) {
    return null;
  }

  // Dynamic pricing for cutover accuracy
  const entryPricing = getEntryPricing();
  const totalStarterFee = formatNaira(entryPricing.totalEntryFee);
  const starterPackFee = formatNaira(entryPricing.starterPackPrice);
  const farmSlotFee = formatNaira(entryPricing.farmSlotPrice);
  const greenCardFee = formatNaira(entryPricing.greenCardFee);
  const comboFee = formatNaira(entryPricing.comboPrice);

  // Instalment Calculations
  const isInstalmentActive = Boolean(instalmentPlan && instalmentPlan.status !== "FULLY_PAID");
  const isInstalmentOverdue = isInstalmentActive && Boolean(instalmentPlan?.isOverdue || instalmentPlan?.status === "OVERDUE");

  const dueDate = instalmentPlan?.nextPaymentDueDate ? new Date(instalmentPlan.nextPaymentDueDate) : null;
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isDueSoon = isInstalmentActive && !isInstalmentOverdue && daysUntilDue <= 2;
  const dueDateFormatted = dueDate
    ? dueDate.toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Soon";

  // Determine concise folded status summary
  let statusBadge = "Starter Package Pending";
  let headline = `Activate ${totalStarterFee} Starter Package`;
  let shortSummary = `Includes Green Card (${greenCardFee}), Mushroom Power 100g (${starterPackFee}), and 1st Farm Slot (${farmSlotFee}) to lock your matrix node.`;
  let ctaText = `Activate ${totalStarterFee} Package`;
  let onCtaClick = () => navigate("/dashboard/checkout?bundle=starter");
  let isWarning = true;

  const handleMilestone2Click = () => {
    if (isMemberLegacy) {
      navigate("/dashboard/checkout?product=SP-MUSH-100G");
    } else if (hasPurchasedStarterPack && totalSlots === 0) {
      navigate("/dashboard/farm-operations/buy-slots");
    } else if (totalSlots > 0 && !hasPurchasedStarterPack) {
      navigate("/dashboard/checkout?product=SP-MUSH-100G");
    } else {
      navigate("/dashboard/checkout?bundle=starter");
    }
  };

  if (isMemberLegacy && !hasPurchasedStarterPack) {
    statusBadge = "Founding Member";
    headline = `Activate Mushroom Power 100g (${starterPackFee})`;
    shortSummary = "Green Card is free. Activate welcome product to unlock full withdrawals & 5×7 community tree.";
    ctaText = `Activate (${starterPackFee})`;
    onCtaClick = () => navigate("/dashboard/checkout?product=SP-MUSH-100G");
    isWarning = true;
  } else if (isInstalmentActive && instalmentPlan) {
    // ── STAGED MESSAGING FOR ACTIVE INSTALMENT PLANS ──
    if (isInstalmentOverdue) {
      // Stage A: Overdue
      statusBadge = `⚠️ Overdue • Wk ${instalmentPlan.currentWeek}/13`;
      headline = `Pay Week ${instalmentPlan.currentWeek} Instalment (${formatNaira(instalmentPlan.currentAmountDue)})`;
      shortSummary = `Payment is overdue by ${Math.max(1, Math.abs(daysUntilDue))} day(s). Includes ₦200 surcharge. Pay now to protect your matrix node (${formatNaira(instalmentPlan.cumulativePaid)}/₦15,000 paid).`;
      ctaText = `Pay Overdue (${formatNaira(instalmentPlan.currentAmountDue)})`;
      onCtaClick = () => { window.dispatchEvent(new CustomEvent("agroheal:open_instalment_modal")); };
      isWarning = true;
    } else if (isDueSoon) {
      // Stage B: Due Today / Due in <= 2 Days
      const dueLabel = daysUntilDue <= 0 ? "Today" : daysUntilDue === 1 ? "Tomorrow" : `in ${daysUntilDue} days`;
      statusBadge = `⏰ Due ${dueLabel} • Wk ${instalmentPlan.currentWeek}/13`;
      headline = `Week ${instalmentPlan.currentWeek} Payment Due (${formatNaira(instalmentPlan.currentAmountDue)})`;
      shortSummary = `Due ${dueLabel} (${dueDateFormatted}). Pay ${formatNaira(instalmentPlan.currentAmountDue)} to maintain your active streak (${formatNaira(instalmentPlan.cumulativePaid)}/₦15,000 paid).`;
      ctaText = `Pay Week ${instalmentPlan.currentWeek} (${formatNaira(instalmentPlan.currentAmountDue)})`;
      onCtaClick = () => { window.dispatchEvent(new CustomEvent("agroheal:open_instalment_modal")); };
      isWarning = true;
    } else if (instalmentPlan.cumulativePaid < 5000) {
      // Stage C: Initial Stage (₦2,000 - ₦4,000 paid, targeting ₦5k milestone)
      const toMilestone1 = Math.max(0, 5000 - instalmentPlan.cumulativePaid);
      statusBadge = `Instalment Plan • Wk ${instalmentPlan.currentWeek}/13`;
      headline = `Next Instalment: Week ${instalmentPlan.currentWeek} (${formatNaira(instalmentPlan.currentAmountDue)})`;
      shortSummary = `Next ₦1,000 due ${dueDateFormatted}. Only ${formatNaira(toMilestone1)} to reach Milestone 1 (₦5,000) & unlock sponsor rewards (${formatNaira(instalmentPlan.cumulativePaid)}/₦15,000 paid).`;
      ctaText = `Pay Week ${instalmentPlan.currentWeek} (${formatNaira(instalmentPlan.currentAmountDue)})`;
      onCtaClick = () => { window.dispatchEvent(new CustomEvent("agroheal:open_instalment_modal")); };
      isWarning = false;
    } else if (instalmentPlan.cumulativePaid < 10000) {
      // Stage D: Mid-Plan (₦5,000 - ₦9,000 paid, targeting ₦10k welcome product unlock)
      const toProduct = Math.max(0, 10000 - instalmentPlan.cumulativePaid);
      statusBadge = `Product Pathway • Wk ${instalmentPlan.currentWeek}/13`;
      headline = `Unlock Welcome Product at ₦10,000 (${formatNaira(toProduct)} left)`;
      shortSummary = `Next ₦1,000 due ${dueDateFormatted}. ${formatNaira(toProduct)} remaining to unlock Mushroom Power 100g product delivery! (${formatNaira(instalmentPlan.cumulativePaid)}/₦15,000 paid).`;
      ctaText = `Pay Week ${instalmentPlan.currentWeek} (${formatNaira(instalmentPlan.currentAmountDue)})`;
      onCtaClick = () => { window.dispatchEvent(new CustomEvent("agroheal:open_instalment_modal")); };
      isWarning = false;
    } else {
      // Stage E: Final Stretch (₦10,000 - ₦14,000 paid, targeting ₦15k 1st Farm Slot & Withdrawals)
      const toFull = Math.max(0, 15000 - instalmentPlan.cumulativePaid);
      statusBadge = `Final Stretch • Wk ${instalmentPlan.currentWeek}/13`;
      headline = `Unlock 1st Farm Slot & Withdrawals (${formatNaira(toFull)} left)`;
      shortSummary = `Next ₦1,000 due ${dueDateFormatted}. ${formatNaira(toFull)} remaining to allocate your 1st Farm Slot & unlock full cash withdrawals! (${formatNaira(instalmentPlan.cumulativePaid)}/₦15,000 paid).`;
      ctaText = `Pay Week ${instalmentPlan.currentWeek} (${formatNaira(instalmentPlan.currentAmountDue)})`;
      onCtaClick = () => { window.dispatchEvent(new CustomEvent("agroheal:open_instalment_modal")); };
      isWarning = false;
    }
  } else if (!isMemberLegacy && !isStep1Done) {
    statusBadge = "Starter Package Pending";
    headline = `Activate ${totalStarterFee} Starter Package`;
    shortSummary = `Green Card (${greenCardFee}), Mushroom Power 100g (${starterPackFee}) & 1st Farm Slot (${farmSlotFee}) to lock your permanent node. Installments available from ₦2,000.`;
    ctaText = `Activate (${totalStarterFee})`;
    onCtaClick = () => navigate("/dashboard/checkout?bundle=starter");
    isWarning = true;
  } else if (!isMemberLegacy && isStep1Done && !isStep2Done) {
    if (hasPurchasedStarterPack && totalSlots === 0) {
      statusBadge = "1st Farm Slot Pending";
      headline = `Subscribe to 1st Farm Slot (${farmSlotFee})`;
      shortSummary = `Green Card & welcome product are active. Subscribe to your 1st Farm Slot (${farmSlotFee}) to lock your permanent matrix placement.`;
      ctaText = `Subscribe (${farmSlotFee})`;
      onCtaClick = () => navigate("/dashboard/farm-operations/buy-slots");
      isWarning = true;
    } else if (totalSlots > 0 && !hasPurchasedStarterPack) {
      statusBadge = "Welcome Product Pending";
      headline = `Activate Mushroom Power 100g (${starterPackFee})`;
      shortSummary = `Green Card & farm slot are active. Order Mushroom Power 100g (${starterPackFee}) to unlock matrix commissions & bank withdrawals.`;
      ctaText = `Order Now (${starterPackFee})`;
      onCtaClick = () => navigate("/dashboard/checkout?product=SP-MUSH-100G");
      isWarning = true;
    } else {
      statusBadge = "Milestone 2 Incomplete";
      headline = `Complete Starter Package Upgrade (${comboFee})`;
      shortSummary = `Green Card is active! Complete Milestone 2 with Mushroom Power 100g (${starterPackFee}) & 1st Farm Slot (${farmSlotFee}) to lock your matrix node. Installments available from ₦1,000/week.`;
      ctaText = `Complete Setup (${comboFee})`;
      onCtaClick = () => navigate("/dashboard/checkout?bundle=starter");
      isWarning = true;
    }
  } else if (directReferralsCount < 5) {
    statusBadge = `${directReferralsCount}/5 Directs`;
    headline = `Sponsor ${5 - directReferralsCount} More Direct Partner(s)`;
    shortSummary = `Refer 5 friends with the ${totalStarterFee} package to unlock all 7 matrix commission tiers (${directReferralsCount}/5 reached).`;
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
        isInstalmentOverdue
          ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600/70"
          : isWarning
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
              isInstalmentOverdue
                ? "bg-rose-600 text-white shadow-xs animate-pulse"
                : isDueSoon
                ? "bg-amber-600 text-white shadow-xs"
                : isStep3Done
                ? "bg-emerald-600 text-white shadow-xs"
                : isWarning
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-emerald-600 text-white shadow-xs"
            }`}
          >
            {isInstalmentOverdue ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isDueSoon ? (
              <Clock className="w-5 h-5" />
            ) : isStep3Done ? (
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
                  isInstalmentOverdue
                    ? "bg-rose-100 text-rose-950 dark:bg-rose-900/80 dark:text-rose-200 border-rose-400 dark:border-rose-600 font-black animate-pulse"
                    : isWarning
                    ? "bg-amber-200 text-amber-950 dark:bg-amber-900/80 dark:text-amber-200 border-amber-400 dark:border-amber-600"
                    : "bg-emerald-200 text-emerald-950 dark:bg-emerald-900/80 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600"
                }`}
              >
                {statusBadge}
              </span>
              {isInstalmentActive && instalmentPlan ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 hidden sm:inline-flex items-center gap-1 font-mono">
                  <span>💳</span> {formatNaira(instalmentPlan.cumulativePaid)} / ₦15k ({Math.min(100, Math.round((instalmentPlan.cumulativePaid / 15000) * 100))}%)
                </span>
              ) : (!isStep1Done || (!isStep2Done && !isMemberLegacy && totalSlots === 0 && !hasPurchasedStarterPack)) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 hidden sm:inline-flex items-center gap-1">
                  <span>⚡</span> Installment Plan Available
                </span>
              )}
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5 font-medium">
              <strong className="text-slate-950 dark:text-white font-extrabold">{headline}</strong> • {shortSummary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {!isInstalmentActive && (!isStep1Done || (!isStep2Done && !isMemberLegacy && totalSlots === 0 && !hasPurchasedStarterPack)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/dashboard/checkout?bundle=starter&plan=instalment");
              }}
              className="text-xs h-7 sm:h-8 px-2.5 rounded-xl border-amber-300 dark:border-amber-700 bg-white/90 dark:bg-slate-800 text-amber-950 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-700 font-bold shadow-2xs cursor-pointer"
              title="Pay in weekly installments"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Installments (from {!isStep1Done ? "₦2,000" : "₦1,000"})</span>
              <span className="md:hidden">Installment</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={onCtaClick}
            className={`text-xs h-7 sm:h-8 px-3 rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5 ${
              isInstalmentOverdue
                ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                : isWarning
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {isInstalmentActive && <CreditCard className="w-3.5 h-3.5" />}
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
          {/* Active Instalment Plan Progress & Reminder Card */}
          {isInstalmentActive && instalmentPlan ? (
            <div
              className={`col-span-1 md:col-span-3 p-3.5 sm:p-4 rounded-xl border flex flex-col gap-3 shadow-xs ${
                isInstalmentOverdue
                  ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800"
                  : isDueSoon
                  ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800"
                  : "bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-blue-50/80 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/30 border-emerald-300 dark:border-emerald-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs ${
                      isInstalmentOverdue
                        ? "bg-rose-600 text-white animate-pulse"
                        : isDueSoon
                        ? "bg-amber-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isInstalmentOverdue ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isDueSoon ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-950 dark:text-white text-xs sm:text-sm">
                        Weekly Instalment Plan • Week {instalmentPlan.currentWeek} of 13
                      </h4>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          isInstalmentOverdue
                            ? "bg-rose-100 text-rose-950 dark:bg-rose-900/80 dark:text-rose-200 border-rose-400"
                            : isDueSoon
                            ? "bg-amber-200 text-amber-950 dark:bg-amber-900/80 dark:text-amber-200 border-amber-400"
                            : "bg-emerald-200 text-emerald-950 dark:bg-emerald-900/80 dark:text-emerald-200 border-emerald-400"
                        }`}
                      >
                        {isInstalmentOverdue ? "OVERDUE" : isDueSoon ? "DUE SOON" : "ON TRACK"}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium mt-0.5">
                      {isInstalmentOverdue
                        ? `Overdue payment of ${formatNaira(instalmentPlan.currentAmountDue)} (includes ₦200 surcharge). Pay immediately to protect your matrix node.`
                        : `Next payment of ${formatNaira(instalmentPlan.currentAmountDue)} due on ${dueDateFormatted} (${
                            daysUntilDue <= 0 ? "today" : daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`
                          }).`}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => window.dispatchEvent(new CustomEvent("agroheal:open_instalment_modal"))}
                  className={`text-xs h-8 px-4 rounded-xl font-bold shadow-xs shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1.5 ${
                    isInstalmentOverdue
                      ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                      : isDueSoon
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Pay Week {instalmentPlan.currentWeek} ({formatNaira(instalmentPlan.currentAmountDue)})
                </Button>
              </div>

              {/* Multi-Step Visual Progress Bar */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    Cumulative Paid:{" "}
                    <strong className="text-slate-950 dark:text-white">
                      {formatNaira(instalmentPlan.cumulativePaid)}
                    </strong>{" "}
                    / ₦15,000
                  </span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                    {Math.min(100, Math.round((instalmentPlan.cumulativePaid / 15000) * 100))}% Completed
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isInstalmentOverdue
                        ? "bg-rose-500"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((instalmentPlan.cumulativePaid / 15000) * 100))}%`,
                    }}
                  />
                </div>

                {/* 4 Stage Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10.5px]">
                  <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-600 dark:text-slate-400 block">₦2,000 (Pass)</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400">✓ Unlocked</span>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg border ${
                      instalmentPlan.cumulativePaid >= 5000
                        ? "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                        : "bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    <span className="font-bold text-slate-600 dark:text-slate-400 block">₦5,000 (Bonus)</span>
                    <span
                      className={
                        instalmentPlan.cumulativePaid >= 5000
                          ? "font-black text-emerald-700 dark:text-emerald-400"
                          : "font-extrabold text-amber-700 dark:text-amber-400"
                      }
                    >
                      {instalmentPlan.cumulativePaid >= 5000
                        ? "✓ Reached"
                        : `${formatNaira(5000 - instalmentPlan.cumulativePaid)} left`}
                    </span>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg border ${
                      instalmentPlan.cumulativePaid >= 10000
                        ? "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                        : "bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    <span className="font-bold text-slate-600 dark:text-slate-400 block">₦10,000 (Product)</span>
                    <span
                      className={
                        instalmentPlan.cumulativePaid >= 10000
                          ? "font-black text-emerald-700 dark:text-emerald-400"
                          : "font-extrabold text-blue-700 dark:text-blue-400"
                      }
                    >
                      {instalmentPlan.cumulativePaid >= 10000
                        ? "✓ Unlocked"
                        : `${formatNaira(10000 - instalmentPlan.cumulativePaid)} left`}
                    </span>
                  </div>
                  <div
                    className={`p-1.5 rounded-lg border ${
                      instalmentPlan.cumulativePaid >= 15000
                        ? "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"
                        : "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    <span className="font-bold text-slate-600 dark:text-slate-400 block">₦15,000 (Slot &amp; Pay)</span>
                    <span
                      className={
                        instalmentPlan.cumulativePaid >= 15000
                          ? "font-black text-emerald-700 dark:text-emerald-400"
                          : "font-extrabold text-emerald-700 dark:text-emerald-400"
                      }
                    >
                      {instalmentPlan.cumulativePaid >= 15000
                        ? "✓ Qualified"
                        : `${formatNaira(15000 - instalmentPlan.cumulativePaid)} left`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (!isStep1Done || (!isStep2Done && !isMemberLegacy && totalSlots === 0 && !hasPurchasedStarterPack)) && (
            <div className="col-span-1 md:col-span-3 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-emerald-50/70 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-emerald-950/30 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-blue-950 dark:text-blue-100 text-xs sm:text-[12.5px]">
                    Flexible Weekly Installment Option Available
                  </p>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium mt-0.5">
                    {!isStep1Done
                      ? "Don't want to pay ₦15,000 upfront? Start your Starter Package with a ₦2,000 initial down payment and spread the rest over weekly payments."
                      : "Upgrade your Green Card to the full Starter Package with flexible weekly installments of ₦1,000."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/checkout?bundle=starter&plan=instalment")}
                className="text-xs h-7 sm:h-8 px-3 rounded-lg border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-200 hover:bg-blue-100 font-bold shrink-0 shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                Pay in Installments <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}

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
                {isInstalmentActive
                  ? "Active digital lifetime credentials unlocked via the ₦2,000 Instalment Plan down payment. Personal AGC ID active."
                  : isMemberLegacy
                  ? "Free lifetime pass for founding members. Enables personal AGC affiliate ID."
                  : `${greenCardFee} digital lifetime credentials included in ${totalStarterFee} package. Unlocks personal AGC ID & ₦1,000 direct referral bounty.`}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/checkout?bundle=starter&plan=instalment")}
                    className="text-blue-700 dark:text-blue-400 hover:underline font-bold text-[10.5px] cursor-pointer"
                    title="Start with ₦2,000 weekly installment"
                  >
                    Installment
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/checkout?bundle=starter")}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
                  >
                    Activate <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
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
                {isInstalmentActive && instalmentPlan
                  ? instalmentPlan.cumulativePaid < 10000
                    ? `Instalment Plan progress: ${formatNaira(instalmentPlan.cumulativePaid)} / ₦15,000 paid. Reach ₦10,000 (${formatNaira(
                        10000 - instalmentPlan.cumulativePaid
                      )} remaining) to unlock physical Mushroom Power 100g product delivery, and ₦15,000 for your 1st Farm Slot.`
                    : `Welcome product unlocked! Reach ₦15,000 (${formatNaira(
                        15000 - instalmentPlan.cumulativePaid
                      )} remaining) to allocate your 1st Farm Slot and unlock full cash withdrawals.`
                  : isMemberLegacy
                  ? `Activate Mushroom Power 100g (${starterPackFee}) to unlock full withdrawals & 5×7 matrix organogram.`
                  : hasPurchasedStarterPack && totalSlots === 0
                  ? `Welcome product is active! Subscribe to your 1st Farm Slot (${farmSlotFee}) to lock your permanent matrix placement & bank withdrawals.`
                  : totalSlots > 0 && !hasPurchasedStarterPack
                  ? `Farm slot is active! Order Mushroom Power 100g (${starterPackFee}) to unlock full matrix commissions & bank withdrawals.`
                  : `Included in ${totalStarterFee} package: Mushroom Power 100g (${starterPackFee}) + 1st Farm Slot (${farmSlotFee}) locking your permanent matrix placement & bank withdrawals.`}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                {isInstalmentActive && instalmentPlan
                  ? `${formatNaira(instalmentPlan.cumulativePaid)} / ₦15k Paid`
                  : totalSlots > 0
                  ? `${totalSlots} Farm Slot${totalSlots > 1 ? "s" : ""}`
                  : `${comboFee} Value`}
              </span>
              {isStep2Done ? (
                <Link
                  to="/dashboard/farm-operations/my-slots"
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px]"
                >
                  My Slots <ArrowRight className="w-3 h-3" />
                </Link>
              ) : isInstalmentActive && instalmentPlan ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("agroheal:open_instalment_modal"))}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
                >
                  Pay Week {instalmentPlan.currentWeek} ({formatNaira(instalmentPlan.currentAmountDue)}) <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMilestone2Click}
                  className="text-amber-700 dark:text-amber-400 hover:underline font-bold inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
                >
                  {isMemberLegacy
                    ? `Activate ${starterPackFee}`
                    : hasPurchasedStarterPack && totalSlots === 0
                    ? `Subscribe ${farmSlotFee}`
                    : totalSlots > 0 && !hasPurchasedStarterPack
                    ? `Activate ${starterPackFee}`
                    : `Activate ${comboFee}`}{" "}
                  <ArrowRight className="w-3 h-3" />
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
                Sponsor 5 active members with the ${totalStarterFee} package to unlock all 7 tiers of community matrix commissions. Earn ₦2,500 total direct sponsor rewards per partner.
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

