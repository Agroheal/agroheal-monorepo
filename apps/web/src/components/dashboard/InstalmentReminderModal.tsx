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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { PaymentMethodSelector } from "../checkout/PaymentMethodSelector";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";

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

export const InstalmentReminderModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<InstalmentPlanData | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<{ id: string; email: string; full_name?: string; phone?: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"wallet" | "flutterwave" | "nomba">("wallet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { launchPayment } = usePaymentGateway();
  const { toast } = useToast();

  const fetchPlanData = async () => {
    try {
      const res = await apiClient.instalments.getMyPlan();
      if (res.hasPlan && res.plan && res.plan.status !== "FULLY_PAID") {
        setPlan(res.plan);
        setIsOpen(true);
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
    fetchPlanData();

    const handleOpen = () => {
      fetchPlanData();
      setIsOpen(true);
    };

    window.addEventListener("agroheal:open_instalment_modal", handleOpen);
    window.addEventListener("agroheal:instalment_updated", fetchPlanData);
    return () => {
      window.removeEventListener("agroheal:open_instalment_modal", handleOpen);
      window.removeEventListener("agroheal:instalment_updated", fetchPlanData);
    };
  }, []);

  if (!plan || plan.status === "FULLY_PAID" || !isOpen) {
    return null;
  }

  const isOverdue = plan.status === "OVERDUE" || plan.isOverdue;
  const percentComplete = Math.min(100, Math.round((plan.cumulativePaid / plan.totalRegistrationFee) * 100));
  const dueDateFormatted = plan.nextPaymentDueDate
    ? new Date(plan.nextPaymentDueDate).toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Immediate";

  const handlePayWithWallet = async () => {
    if (walletBalance < plan.currentAmountDue) {
      toast({
        title: "Insufficient Wallet Balance",
        description: `Your available balance (₦${walletBalance.toLocaleString()}) is less than the required amount (₦${plan.currentAmountDue.toLocaleString()}). Please choose an online payment gateway.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.instalments.payWithWallet(plan.currentAmountDue);
      toast({
        title: "Payment Confirmed! 🎉",
        description: `₦${plan.currentAmountDue.toLocaleString()} paid successfully from your wallet balance.`,
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
    if (!userProfile) return;

    const gateway = selectedMethod === "nomba" ? "nomba" : "flutterwave";
    const txRef = `INST_REPAY_${plan.id}_${Date.now()}`;
    const amountToPay = plan.currentAmountDue;

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
          ? `Weekly Instalment + Overdue Surcharge (Week ${plan.currentWeek})`
          : `Weekly Instalment (Week ${plan.currentWeek})`,
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
            isOverdue ? "bg-gradient-to-r from-amber-700 via-rose-700 to-red-800" : "bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950"
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isOverdue ? "bg-white/20 text-amber-200" : "bg-white/15 text-emerald-200"
              }`}>
                {isOverdue ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isOverdue ? "bg-amber-300 text-amber-950 font-black" : "bg-emerald-300 text-emerald-950"
                  }`}>
                    {isOverdue ? "Overdue Notice" : `Week ${plan.currentWeek} of 14`}
                  </span>
                  <span className="text-white/80 text-xs font-medium">
                    Due: {dueDateFormatted}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {isOverdue ? "Weekly Instalment Overdue" : "Next Instalment Due"}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Urgency Description Callout */}
            {isOverdue ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Late Fee Applied: ₦500 Surcharge</span>
                </p>
                <p className="text-amber-900/90">
                  Standard weekly payment of ₦{plan.standardAmountDue.toLocaleString()} plus ₦{plan.overdueSurcharge.toLocaleString()} surcharge. Total amount payable today: <strong className="font-bold text-amber-950">₦{plan.currentAmountDue.toLocaleString()}</strong>. Settle now to prevent forfeiture.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 text-xs leading-relaxed">
                <p className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Maintain Your On-Time Streak</span>
                </p>
                <p className="text-emerald-800/90 mt-0.5">
                  Your regular ₦{plan.currentAmountDue.toLocaleString()} weekly instalment is due. On-time payments unlock your sponsor bonuses, free starter pack, and commercial farm slot.
                </p>
              </div>
            )}

            {/* Progress Bar & Milestone Status */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-600">Total Settled</span>
                <span className="font-mono text-gray-900 font-bold">
                  ₦{plan.cumulativePaid.toLocaleString()} / ₦{plan.totalRegistrationFee.toLocaleString()} ({percentComplete}%)
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
                <span>Remaining: <strong className="text-gray-900 font-mono">₦{plan.remainingBalance.toLocaleString()}</strong></span>
                <span className="text-emerald-700 font-medium">
                  {plan.cumulativePaid < 5000
                    ? "Next: ₦5,000 (Sponsor Bonus)"
                    : plan.cumulativePaid < 10000
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
                amount={plan.currentAmountDue}
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
                disabled={isSubmitting}
                className={`w-full h-12 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isOverdue
                    ? "bg-rose-700 hover:bg-rose-800"
                    : "bg-emerald-800 hover:bg-emerald-900"
                }`}
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₦{plan.currentAmountDue.toLocaleString()} Now</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
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

