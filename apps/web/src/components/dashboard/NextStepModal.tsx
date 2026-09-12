import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IdCard,
  Sprout,
  Users,
  CheckCircle2,
  Lock,
  ArrowRight,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { SITE_URL } from "@/config/Index";
import { toast } from "react-hot-toast";

export interface NextStepConfig {
  enabled: boolean;
  broadcastNotice?: string;
  steps: {
    step1: {
      title: string;
      subtitle: string;
      priceText: string;
      badgeText: string;
      benefits: string[];
      buttonText: string;
      targetRoute: string;
    };
    step2: {
      title: string;
      subtitle: string;
      priceText: string;
      badgeText: string;
      benefits: string[];
      buttonText: string;
      targetRoute: string;
    };
    step3: {
      title: string;
      subtitle: string;
      targetCount: number;
      badgeText: string;
      benefits: string[];
      buttonText: string;
      targetRoute: string;
    };
  };
}

export const DEFAULT_NEXT_STEP_CONFIG: NextStepConfig = {
  enabled: true,
  broadcastNotice: "",
  steps: {
    step1: {
      title: "Activate Your AgroHeal Green Card",
      subtitle:
        "Your official key to organic farming education, verified digital membership, and community dividends.",
      priceText: "₦2,000 One-Time Lifetime Membership",
      badgeText: "Milestone 1 of 3 · Foundation",
      benefits: [
        "Lifetime access to Organic Farming Academy & practical masterclasses",
        "Official AgroHeal Digital Green Card ID with instant QR verification",
        "Earn ₦1,000 instant direct sponsor bounty on every referred member",
        "Unlocks eligibility to purchase commercial mushroom farm slots",
      ],
      buttonText: "Activate Green Card Now (₦2,000)",
      targetRoute: "/subscribe",
    },
    step2: {
      title: "Secure Your First Mushroom Farm Slot",
      subtitle:
        "Activate biological production in our climate-controlled grow-houses with automated commercial management.",
      priceText: "₦5,000 Per Slot · Mushroom Village Flagship",
      badgeText: "Milestone 2 of 3 · Production",
      benefits: [
        "2 physical fruiting bags allocated directly to your member account",
        "Cycle 1 biological doubling (2 bags produce 4 bags retained in farm)",
        "Up to 40% projected quarterly cooperative harvest dividends from Cycle 2 onward",
        "Secures your locked placement in the 5×7 Cooperative Matrix",
      ],
      buttonText: "Secure Farm Slot (₦5,000)",
      targetRoute: "/dashboard/slots",
    },
    step3: {
      title: "Unlock 7-Level Matrix Harvest Dividends",
      subtitle:
        "Sponsor 5 direct partners to expand your payout depth and maximize cooperative spillover.",
      targetCount: 5,
      badgeText: "Milestone 3 of 3 · Expansion",
      benefits: [
        "1 Direct Partner unlocks Level 1 matrix dividends",
        "5 Direct Partners unlocks all 7 matrix levels (up to 97,655 network positions)",
        "Earn ₦1,000 Green Card bounty + 10% (₦500) per slot leased by direct partners",
        "Qualify for AgroHeal Cooperative Community Leadership & bonus pools",
      ],
      buttonText: "Copy Referral Link & Share",
      targetRoute: "/dashboard/compound-referrals",
    },
  },
};

const SESSION_DISMISS_KEY = "agroheal_next_step_dismissed_session";

export interface NextStepModalProps {
  hasGreenCard: boolean;
  totalSlots: number;
  directReferralsCount: number;
  referralCode?: string;
  forceOpen?: boolean;
  onCloseExternal?: () => void;
}

export const NextStepModal: React.FC<NextStepModalProps> = ({
  hasGreenCard,
  totalSlots,
  directReferralsCount,
  referralCode = "",
  forceOpen = false,
  onCloseExternal,
}) => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<NextStepConfig>(DEFAULT_NEXT_STEP_CONFIG);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch admin-programmed configuration from system_configs
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("system_configs")
          .select("value")
          .eq("key", "next_step_modal_config")
          .maybeSingle();

        if (data?.value && isMounted) {
          setConfig({
            ...DEFAULT_NEXT_STEP_CONFIG,
            ...data.value,
            steps: {
              step1: { ...DEFAULT_NEXT_STEP_CONFIG.steps.step1, ...(data.value.steps?.step1 || {}) },
              step2: { ...DEFAULT_NEXT_STEP_CONFIG.steps.step2, ...(data.value.steps?.step2 || {}) },
              step3: { ...DEFAULT_NEXT_STEP_CONFIG.steps.step3, ...(data.value.steps?.step3 || {}) },
            },
          });
        }
      } catch (err) {
        console.warn("Could not load dynamic next_step_modal_config, using default", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine current active milestone (1, 2, 3, or 4 for completed)
  const currentStep = useMemo(() => {
    if (!hasGreenCard) return 1;
    if (totalSlots === 0) return 2;
    const targetDirects = config.steps.step3.targetCount || 5;
    if (directReferralsCount < targetDirects) return 3;
    return 4; // All key milestones achieved!
  }, [hasGreenCard, totalSlots, directReferralsCount, config.steps.step3.targetCount]);

  // Handle persistent stubborn display logic
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!config.enabled) {
      setIsOpen(false);
      return;
    }

    // If user has completed all 3 milestones, don't auto-popup
    if (currentStep >= 4) {
      setIsOpen(false);
      return;
    }

    // Check session storage for "Remind Me Later"
    const isDismissedThisSession = sessionStorage.getItem(SESSION_DISMISS_KEY);
    if (!isDismissedThisSession) {
      // Stubborn prompt: Automatically show modal on session start
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [forceOpen, config.enabled, currentStep]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, "true");
    setIsOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  const handlePrimaryAction = async () => {
    if (currentStep === 1) {
      navigate(config.steps.step1.targetRoute || "/subscribe");
      handleDismiss();
    } else if (currentStep === 2) {
      navigate(config.steps.step2.targetRoute || "/dashboard/slots");
      handleDismiss();
    } else if (currentStep === 3) {
      // Step 3: Copy referral link
      const referralUrl = `${SITE_URL}/signup?ref=${referralCode}`;
      try {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        toast.success("Referral link copied! Share with your prospective partners.");
        setTimeout(() => setCopied(false), 2500);
      } catch {
        toast.error("Could not copy link to clipboard");
      }
    }
  };

  if (!isOpen) return null;

  const step1Data = config.steps.step1;
  const step2Data = config.steps.step2;
  const step3Data = config.steps.step3;

  const currentData =
    currentStep === 1
      ? step1Data
      : currentStep === 2
      ? step2Data
      : step3Data;

  const targetDirects = step3Data.targetCount || 5;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-white text-gray-900 rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-7 overflow-hidden my-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Next Step Modal"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Optional Broadcast Notice from Admin */}
          {config.broadcastNotice && (
            <div className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
              <Megaphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-medium leading-tight">{config.broadcastNotice}</p>
            </div>
          )}

          {/* Roadmap Step Indicator */}
          <div className="mb-6 pb-5 border-b border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Member Progression Roadmap
            </p>

            <div className="grid grid-cols-3 gap-2 relative">
              {/* Step 1 Node */}
              <div
                className={`flex flex-col items-center text-center p-2 rounded-2xl transition-all ${
                  currentStep === 1
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold shadow-xs"
                    : currentStep > 1
                    ? "bg-gray-50 border border-gray-200 text-gray-700"
                    : "bg-gray-50/50 border border-gray-100 text-gray-400 opacity-60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    currentStep > 1
                      ? "bg-emerald-600 text-white"
                      : currentStep === 1
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : <IdCard className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-semibold line-clamp-1">1. Green Card</span>
              </div>

              {/* Step 2 Node */}
              <div
                className={`flex flex-col items-center text-center p-2 rounded-2xl transition-all ${
                  currentStep === 2
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold shadow-xs"
                    : currentStep > 2
                    ? "bg-gray-50 border border-gray-200 text-gray-700"
                    : "bg-gray-50/50 border border-gray-100 text-gray-400 opacity-60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    currentStep > 2
                      ? "bg-emerald-600 text-white"
                      : currentStep === 2
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > 2 ? <Check className="w-4 h-4" /> : <Sprout className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-semibold line-clamp-1">2. Farm Slot</span>
              </div>

              {/* Step 3 Node */}
              <div
                className={`flex flex-col items-center text-center p-2 rounded-2xl transition-all ${
                  currentStep === 3
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold shadow-xs"
                    : currentStep > 3
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-gray-50/50 border border-gray-100 text-gray-400 opacity-60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    currentStep > 3
                      ? "bg-emerald-600 text-white"
                      : currentStep === 3
                      ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > 3 ? <Check className="w-4 h-4" /> : <Users className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-semibold line-clamp-1">3. 5 Directs</span>
              </div>
            </div>
          </div>

          {/* Active Step Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase px-3 py-1">
                {currentData.badgeText}
              </Badge>

              {currentStep === 3 && (
                <span className="text-xs font-bold text-amber-700">
                  {directReferralsCount} of {targetDirects} Directs Registered
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                {currentData.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                {currentData.subtitle}
              </p>
            </div>

            {/* Price Tag or Progress Bar */}
            {currentStep === 3 ? (
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-700">
                  <span>Level 7 Matrix Depth Progress</span>
                  <span className="text-emerald-700">{Math.min(100, Math.round((directReferralsCount / targetDirects) * 100))}% Unlocked</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (directReferralsCount / targetDirects) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Each direct member unlocks an additional matrix tier. Sponsor {targetDirects} directs to unlock all 7 levels.
                </p>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{"priceText" in currentData ? currentData.priceText : ""}</span>
              </div>
            )}

            {/* Verified Benefit List */}
            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                What you receive upon completion:
              </p>
              <div className="grid gap-2">
                {currentData.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-snug"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={handlePrimaryAction}
                className="flex-1 h-12 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                {currentStep === 3 ? (
                  copied ? (
                    <>
                      <Check className="w-4 h-4 text-white" /> Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" /> Copy Referral Link
                    </>
                  )
                ) : (
                  <>
                    <span>{currentData.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {currentStep === 3 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate("/dashboard/compound-referrals");
                    handleDismiss();
                  }}
                  className="h-12 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 border-gray-200 text-xs font-semibold px-4"
                >
                  View Matrix
                </Button>
              )}

              <button
                type="button"
                onClick={handleDismiss}
                className="h-12 px-4 rounded-2xl text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors text-center"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NextStepModal;
