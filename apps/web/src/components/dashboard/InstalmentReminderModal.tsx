import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  X,
  CreditCard,
  Wallet,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type InstalmentPlanData } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { PaymentMethodSelector } from "../checkout/PaymentMethodSelector";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";

export const InstalmentReminderModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<InstalmentPlanData | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<{ id: string; email: string; full_name?: string; phone?: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"wallet" | "flutterwave" | "nomba">("wallet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { launchPayment } = usePaymentGateway();
  const { toast } = useToast();

  const markModalShown = (userId?: string) => {
    try {
      const suffix = userId || "member";
      sessionStorage.setItem(`agroheal_instalment_modal_seen_${suffix}`, "true");
      localStorage.setItem(`agroheal_instalment_modal_last_shown_${suffix}`, Date.now().toString());
    } catch {}
  };

  const shouldAutoPrompt = (planData: InstalmentPlanData, userId?: string): boolean => {
    const dDate = planData.nextPaymentDueDate ? new Date(planData.nextPaymentDueDate) : null;
    const diffDays = dDate ? Math.ceil((dDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    const planOverdue = planData.status === "OVERDUE" || planData.isOverdue || Number(planData.overdueSurcharge || 0) > 0;
    const isDueToday = !planOverdue && diffDays <= 0;

    // Rule 1: Never auto-popup if upcoming in the future (e.g. 4-5 days away) and not overdue
    if (!planOverdue && !isDueToday) {
      return false;
    }

    const suffix = userId || "member";

    // Rule 2: Fresh Sign-in / Session Prompt
    // If user just signed in or opened a fresh browser session, show the reminder once!
    const sessionSeen = sessionStorage.getItem(`agroheal_instalment_modal_seen_${suffix}`);
    if (!sessionSeen) {
      return true;
    }

    // Rule 3: Revisit / Reload After Some Time (Cooldown window)
    // If overdue: re-prompt if 6 hours have passed since last dismissal
    // If due today: re-prompt if 12 hours have passed since last dismissal
    // Prevents aggressive popups across normal dashboard tab navigation or page refreshes.
    const cooldownMs = planOverdue ? 6 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const lastShownRaw = localStorage.getItem(`agroheal_instalment_modal_last_shown_${suffix}`);
    if (lastShownRaw) {
      const lastShown = Number(lastShownRaw);
      if (!isNaN(lastShown) && Date.now() - lastShown < cooldownMs) {
        return false;
      }
    }

    return true;
  };

  const handleClose = () => {
    markModalShown(userProfile?.id);
    setIsOpen(false);
  };

  const fetchPlanData = async (isManualTrigger = false) => {
    try {
      const res = await apiClient.instalments.getMyPlan();
      if (res.hasPlan && res.plan && res.plan.status !== "FULLY_PAID") {
        setPlan(res.plan);

        if (isManualTrigger) {
          setIsOpen(true);
        } else {
          const userObj = (await supabase.auth.getUser()).data.user;
          const autoPrompt = shouldAutoPrompt(res.plan, userObj?.id);
          if (autoPrompt) {
            markModalShown(userObj?.id);
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        }
      } else {
        setPlan(null);
        setIsOpen(false);
      }

      // Live profile & wallet balance
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, phone, wallet_balance")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setWalletBalance(Number(profile.wallet_balance) || 0);
        }
      }
    } catch (err: any) {
      console.warn("[InstalmentReminderModal] Error loading plan:", err.message);
    }
  };

  useEffect(() => {
    fetchPlanData(false);

    const handleOpen = () => {
      fetchPlanData(true);
    };

    window.addEventListener("agroheal:open_instalment_modal", handleOpen);
    window.addEventListener("agroheal:instalment_updated", () => fetchPlanData(false));
    return () => {
      window.removeEventListener("agroheal:open_instalment_modal", handleOpen);
      window.removeEventListener("agroheal:instalment_updated", () => fetchPlanData(false));
    };
  }, []);

  if (!plan || plan.status === "FULLY_PAID" || !isOpen) {
    return null;
  }

  const currentAmountDue = Number(plan.currentAmountDue ?? (plan as any).scheduledAmountDue ?? 1000);
  const standardAmountDue = Number(plan.standardAmountDue ?? 1000);
  const overdueSurcharge = Number(plan.overdueSurcharge ?? (plan as any).unpaidOverdueCharges ?? 0);
  const remainingBalance = Number(plan.remainingBalance ?? (plan as any).totalOutstandingBalance ?? (plan as any).outstandingPrincipal ?? 0);
  const cumulativePaid = Number(plan.cumulativePaid ?? 0);
  const totalRegistrationFee = Number(plan.totalRegistrationFee ?? 15000);
  const currentWeek = Number(plan.currentWeek ?? 1);
  const percentComplete = Math.min(100, Math.round(((cumulativePaid) / (totalRegistrationFee || 15000)) * 100));

  const dueDate = plan.nextPaymentDueDate ? new Date(plan.nextPaymentDueDate) : null;
  const now = new Date();
  const msDiff = dueDate ? dueDate.getTime() - now.getTime() : 0;
  const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
  const isOverdue = plan.status === "OVERDUE" || plan.isOverdue || overdueSurcharge > 0 || (dueDate ? msDiff < 0 && daysDiff < 0 : false);
  const isDueToday = !isOverdue && daysDiff <= 0;
  const isUpcoming = !isOverdue && !isDueToday;

  const dueDateFormatted = dueDate
    ? dueDate.toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Immediate";

  const handlePayWithWallet = async () => {
    if (isSubmitting) return;
    if (walletBalance < currentAmountDue) {
      toast({
        title: "Insufficient Wallet Balance",
        description: `Your available balance (₦${walletBalance.toLocaleString()}) is less than the required amount (₦${currentAmountDue.toLocaleString()}). Please choose an online payment gateway.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.instalments.payWithWallet(currentAmountDue);
      toast({
        title: "Payment Confirmed! 🎉",
        description: `₦${currentAmountDue.toLocaleString()} paid successfully from your wallet balance.`,
      });
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("agroheal:instalment_updated"));
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "Failed to process wallet payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayOnline = async () => {
    if (isSubmitting || !userProfile) return;

    const gateway = selectedMethod === "nomba" ? "nomba" : "flutterwave";
    const txRef = `INST_REPAY_${plan.id}_${Date.now()}`;
    const amountToPay = currentAmountDue;

    setIsSubmitting(true);

    try {
      await launchPayment({
        gateway,
        amount: amountToPay,
        txRef,
        customerEmail: userProfile.email,
        customerName: userProfile.full_name || userProfile.email,
        customerPhone: userProfile.phone || "",
        title: `AgroHeal GreenCard Instalment (₦${amountToPay.toLocaleString()})`,
        description: isOverdue
          ? `Weekly Instalment + Overdue Surcharge (Week ${currentWeek})`
          : `Weekly Instalment (Week ${currentWeek})`,
        onSuccess: async (payRes) => {
          try {
            await apiClient.instalments.recordGatewayPayment({
              amount: amountToPay,
              paymentMethod: gateway,
              reference: payRes.reference,
            });

            toast({
              title: "Payment Confirmed! 🎉",
              description: `Your payment of ₦${amountToPay.toLocaleString()} has been confirmed.`,
            });

            setIsOpen(false);
            window.dispatchEvent(new CustomEvent("agroheal:instalment_updated"));
          } catch (recordErr: any) {
            console.warn("[InstalmentModal] Repayment settlement record notice:", recordErr.message);
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent("agroheal:instalment_updated"));
          } finally {
            setIsSubmitting(false);
          }
        },
        onClose: () => {
          setIsSubmitting(false);
        },
        onError: (err) => {
          setIsSubmitting(false);
          toast({
            title: "Payment Error",
            description: err.message || "Failed to initialize payment gateway.",
            variant: "destructive",
          });
        },
      });
    } catch (err: any) {
      setIsSubmitting(false);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initialize payment gateway.",
        variant: "destructive",
      });
    }
  };

  const handlePayNow = () => {
    if (isSubmitting) return;
    if (selectedMethod === "wallet") {
      handlePayWithWallet();
    } else {
      handlePayOnline();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto"
        >
          {/* Top Header */}
          <div className={`p-5 sm:p-6 text-white flex items-start justify-between gap-4 ${
            isOverdue
              ? "bg-gradient-to-r from-amber-700 via-rose-700 to-red-800"
              : isDueToday
              ? "bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800"
              : "bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950"
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isOverdue
                  ? "bg-white/20 text-amber-200"
                  : isDueToday
                  ? "bg-white/20 text-amber-200"
                  : "bg-white/15 text-emerald-200"
              }`}>
                {isOverdue ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : isDueToday ? (
                  <Clock className="w-6 h-6" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isOverdue
                      ? "bg-amber-300 text-amber-950 font-black"
                      : isDueToday
                      ? "bg-amber-400 text-amber-950 font-black"
                      : "bg-emerald-300 text-emerald-950 font-bold"
                  }`}>
                    {isOverdue
                      ? "Overdue Notice"
                      : isDueToday
                      ? `Week ${currentWeek} • Due Today`
                      : `Week ${currentWeek} of 14 • On Track`}
                  </span>
                  <span className="text-white/80 text-xs font-medium">
                    {isOverdue
                      ? `Due: ${dueDateFormatted} (${Math.abs(daysDiff)} days late)`
                      : isDueToday
                      ? `Due Today (${dueDateFormatted})`
                      : `Due in ${daysDiff} day${daysDiff === 1 ? "" : "s"} (${dueDateFormatted})`}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {isOverdue
                    ? "Weekly Instalment Overdue"
                    : isDueToday
                    ? "Weekly Instalment Due Today"
                    : "Upcoming Instalment"}
                </h3>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Status / Urgency Description Callout */}
            {isOverdue ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Late Fee Applied: ₦{overdueSurcharge.toLocaleString()} Surcharge</span>
                </p>
                <p className="text-amber-900/90">
                  Standard weekly payment of ₦{standardAmountDue.toLocaleString()} plus ₦{overdueSurcharge.toLocaleString()} surcharge. Total amount payable today: <strong className="font-bold text-amber-950">₦{currentAmountDue.toLocaleString()}</strong>. Settle now to prevent forfeiture.
                </p>
              </div>
            ) : isDueToday ? (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 text-xs leading-relaxed space-y-1">
                <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Due Today: Week {currentWeek} Instalment</span>
                </p>
                <p className="text-amber-900/90 mt-0.5">
                  Your regular ₦{currentAmountDue.toLocaleString()} weekly instalment is due today. Settle today to maintain your on-time streak!
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 text-xs leading-relaxed space-y-1">
                <p className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>You're On Track!</span>
                </p>
                <p className="text-emerald-800/90 mt-0.5">
                  Your next scheduled ₦{currentAmountDue.toLocaleString()} instalment is due on <strong>{dueDateFormatted}</strong> (in {daysDiff} days). You can pay ahead anytime to stay in front of your schedule.
                </p>
              </div>
            )}

            {/* Progress Bar & Milestone Status */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-600">Total Settled</span>
                <span className="font-mono text-gray-900 font-bold">
                  ₦{cumulativePaid.toLocaleString()} / ₦{totalRegistrationFee.toLocaleString()} ({percentComplete}%)
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverdue ? "bg-amber-600" : "bg-emerald-600"
                  }`}
                  style={{ width: `${percentComplete}%` }}
                />
              </div>

              {/* Next Milestone Lock Callout */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-gray-600">
                <span>Remaining: <strong className="text-gray-900 font-mono">₦{remainingBalance.toLocaleString()}</strong></span>
                <span className="text-emerald-700 font-medium">
                  {cumulativePaid < 5000
                    ? "Next: ₦5,000 (Sponsor Bonus)"
                    : cumulativePaid < 10000
                    ? "Next: ₦10,000 (Starter Pack Released)"
                    : "Final: ₦15,000 (Farm Slot & Full Withdrawals)"}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Select Payment Channel
              </label>
              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onSelectMethod={setSelectedMethod}
                amount={currentAmountDue}
                showWallet={true}
                walletBalance={walletBalance}
                disabled={isSubmitting}
              />
            </div>

            {/* CTAs */}
            <div className="pt-2 space-y-2.5">
              <Button
                type="button"
                onClick={handlePayNow}
                disabled={isSubmitting || (selectedMethod === "wallet" && walletBalance < currentAmountDue)}
                className={`w-full h-12 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none ${
                  isOverdue
                    ? "bg-rose-700 hover:bg-rose-800"
                    : isDueToday
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-800 hover:bg-emerald-900"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isOverdue
                        ? `Pay ₦${currentAmountDue.toLocaleString()} (Overdue Surcharge Included)`
                        : isDueToday
                        ? `Pay ₦${currentAmountDue.toLocaleString()} Due Today`
                        : `Pay ₦${currentAmountDue.toLocaleString()} Early`}
                    </span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2 text-center text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Dismiss / Remind Me Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InstalmentReminderModal;

