import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Wallet,
  CreditCard,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { FLUTTERWAVE_KEYS } from "@/config/Index";
import { supabase } from "@/lib/supabaseClient";

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
  history: Array<{
    id: string;
    amount: number;
    principalAmount: number;
    overdueChargeAmount: number;
    paymentMethod: string;
    reference: string;
    createdAt: string;
  }>;
}

interface InstalmentTrackerWidgetProps {
  onPlanUpdated?: () => void;
}

export function InstalmentTrackerWidget({ onPlanUpdated }: InstalmentTrackerWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<InstalmentPlanData | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<{ id: string; email: string; full_name?: string; phone?: string } | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"wallet" | "flutterwave">("wallet");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchPlanData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.instalments.getMyPlan();
      if (res.hasPlan && res.plan) {
        setPlan(res.plan);
      } else {
        setPlan(null);
      }

      // Fetch live wallet balance and profile for checkout
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
      console.warn("[InstalmentTrackerWidget] Error loading plan:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, []);

  if (loading || !plan) {
    return null; // Do not render if member has no instalment plan
  }

  // If already fully paid, we only render a subtle completion badge or skip
  if (plan.status === "FULLY_PAID") {
    return (
      <div className="w-full bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4 sm:p-5 flex items-center justify-between mb-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-emerald-950">GreenCard Registration Plan</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Fully Paid
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              ₦15,000 total settled. 1 Farm Slot allocated & all withdrawal restrictions lifted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const percentComplete = Math.min(100, Math.round((plan.cumulativePaid / plan.totalRegistrationFee) * 100));
  const isOverdue = plan.status === "OVERDUE" || plan.isOverdue;
  const dueDateFormatted = plan.nextPaymentDueDate
    ? new Date(plan.nextPaymentDueDate).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Immediate";

  const handlePayWithWallet = async () => {
    if (walletBalance < plan.currentAmountDue) {
      toast({
        title: "Insufficient Wallet Balance",
        description: `Your available balance (₦${walletBalance.toLocaleString()}) is less than the required amount (₦${plan.currentAmountDue.toLocaleString()}). Please pay via Flutterwave.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient.instalments.payWithWallet(plan.currentAmountDue);
      toast({
        title: "Payment Successful! 🎉",
        description: `₦${plan.currentAmountDue.toLocaleString()} paid successfully from your wallet balance.`,
      });
      setShowPayModal(false);
      await fetchPlanData();
      if (onPlanUpdated) onPlanUpdated();
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

  const handlePayWithFlutterwave = async () => {
    if (!userProfile) return;

    if (typeof window !== "undefined" && !(window as any).FlutterwaveCheckout) {
      toast({
        title: "Payment Gateway Loading",
        description: "Flutterwave is still loading. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    const flwKey =
      (typeof FLUTTERWAVE_KEYS === "string" ? FLUTTERWAVE_KEYS : (FLUTTERWAVE_KEYS as any)?.publicKey) ||
      import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
      "FLWPUBK-20fafa986173a9b4507c82992f53055b-X";

    const txRef = `INST_REPAY_${plan.id}_${Date.now()}`;
    const amountToPay = plan.currentAmountDue;

    setIsSubmitting(true);

    try {
      (window as any).FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: txRef,
        amount: amountToPay,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: userProfile.email,
          phone_number: userProfile.phone || "",
          name: userProfile.full_name || userProfile.email,
        },
        meta: {
          plan_id: plan.id,
          user_id: userProfile.id,
          isInstalmentRepayment: true,
          type: "instalment_repayment",
        },
        customizations: {
          title: `AgroHeal GreenCard Instalment (₦${amountToPay.toLocaleString()})`,
          description: isOverdue
            ? `Weekly Instalment + Overdue Surcharge (Week ${plan.currentWeek})`
            : `Weekly Instalment (Week ${plan.currentWeek})`,
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png",
        },
        onclose: () => {
          setIsSubmitting(false);
        },
        callback: async (response: any) => {
          if (response.status === "successful" || response.status === "completed") {
            const flwTransactionId = response.transaction_id || response.id || response.flw_ref;
            try {
              await apiClient.instalments.recordGatewayPayment({
                amount: amountToPay,
                paymentMethod: "flutterwave",
                reference: String(flwTransactionId || txRef),
              });

              toast({
                title: "Instalment Paid! 🎉",
                description: `Your payment of ₦${amountToPay.toLocaleString()} has been confirmed.`,
              });

              setShowPayModal(false);
              await fetchPlanData();
              if (onPlanUpdated) onPlanUpdated();
            } catch (recordErr: any) {
              console.warn("[Instalment] Repayment settlement record notice:", recordErr.message);
              // Fallback verification
              await fetchPlanData();
              setShowPayModal(false);
            }
          }
          setIsSubmitting(false);
        },
      });
    } catch (err: any) {
      setIsSubmitting(false);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initialize Flutterwave.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
        {/* Top Status Header */}
        <div className={`px-5 sm:px-7 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isOverdue ? "bg-amber-50/60 border-amber-100" : "bg-emerald-50/50 border-emerald-100/60"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOverdue ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {isOverdue ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">GreenCard Registration Payment Plan</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isOverdue ? "bg-amber-200/80 text-amber-900" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {isOverdue ? "Payment Overdue" : `Active · Week ${plan.currentWeek}`}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {isOverdue
                  ? `Overdue since ${dueDateFormatted}. Late fee of ₦500 applied.`
                  : `Next instalment due on ${dueDateFormatted}.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowPayModal(true)}
              size="sm"
              className={`rounded-xl px-4 font-bold text-xs shadow-sm transition-all ${
                isOverdue
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              Pay ₦{plan.currentAmountDue.toLocaleString()}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Core Progress & Metrics */}
        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100/80">
              <span className="text-xs text-gray-500 font-medium">Cumulative Paid</span>
              <div className="text-xl font-black text-gray-900 font-mono mt-1">
                ₦{plan.cumulativePaid.toLocaleString()}
                <span className="text-xs text-gray-400 font-normal ml-1">/ ₦15,000</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                ₦{plan.remainingBalance.toLocaleString()} remaining
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100/80">
              <span className="text-xs text-gray-500 font-medium">Current Amount Due</span>
              <div className={`text-xl font-black font-mono mt-1 ${isOverdue ? "text-amber-700" : "text-emerald-700"}`}>
                ₦{plan.currentAmountDue.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {isOverdue
                  ? "₦1,000 weekly + ₦500 late surcharge"
                  : "Standard weekly instalment"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100/80">
              <span className="text-xs text-gray-500 font-medium">Due Date</span>
              <div className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm sm:text-base">{dueDateFormatted}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {isOverdue ? "Strict 0-hour grace period" : "7 days between instalments"}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-2">
              <span>Overall Registration Progress</span>
              <span className="font-mono text-emerald-700 font-bold">{percentComplete}% Complete</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentComplete}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isOverdue ? "bg-amber-500" : "bg-emerald-600"
                }`}
              />
            </div>
          </div>

          {/* Milestone Badges Visualizer */}
          <div className="border-t border-gray-100 pt-5">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Registration Milestones
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Milestone 1: ₦2,000 */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">₦2,000 · Registration</div>
                  <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                    GreenCard ID, Training platform, & 5×7 Matrix activated.
                  </p>
                </div>
              </div>

              {/* Milestone 2: ₦5,000 */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                plan.milestones.sponsorBonus5kPaid
                  ? "bg-emerald-50/60 border-emerald-100"
                  : "bg-gray-50/80 border-gray-100 opacity-80"
              }`}>
                {plan.milestones.sponsorBonus5kPaid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-xs font-bold ${plan.milestones.sponsorBonus5kPaid ? "text-emerald-950" : "text-gray-700"}`}>
                    ₦5,000 · Sponsor Bonus
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                    ₦1,000 Starter Pack commission released to referrer.
                  </p>
                </div>
              </div>

              {/* Milestone 3: ₦10,000 */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                plan.milestones.starterPack10kReleased
                  ? "bg-emerald-50/60 border-emerald-100"
                  : "bg-gray-50/80 border-gray-100 opacity-80"
              }`}>
                {plan.milestones.starterPack10kReleased ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-xs font-bold ${plan.milestones.starterPack10kReleased ? "text-emerald-950" : "text-gray-700"}`}>
                    ₦10,000 · Starter Pack
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                    Physical Mushroom Power (SP-MUSH-100G) released.
                  </p>
                </div>
              </div>

              {/* Milestone 4: ₦15,000 */}
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                plan.milestones.farmSlot15kAllocated
                  ? "bg-emerald-50/60 border-emerald-100"
                  : "bg-gray-50/80 border-gray-100 opacity-80"
              }`}>
                {plan.milestones.farmSlot15kAllocated ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-xs font-bold ${plan.milestones.farmSlot15kAllocated ? "text-emerald-950" : "text-gray-700"}`}>
                    ₦15,000 · Farm Slot
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight mt-0.5">
                    1 compulsory slot allocated & cash withdrawals unlocked.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Callout Banner */}
          <div className="mt-5 p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 flex items-start gap-2.5 text-xs text-gray-600">
            <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-800">Withdrawal Notice: </span>
              External cash withdrawals are locked until your full ₦15,000 fee is settled. However, you may use your internal wallet earnings at any time to pay subsequent weekly instalments.
            </div>
          </div>
        </div>
      </div>

      {/* Pay Instalment Modal */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Pay Weekly Instalment</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Week {plan.currentWeek} · Total Due: ₦{plan.currentAmountDue.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {isOverdue && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Overdue Surcharge Included:</span> This payment includes ₦1,000 weekly principal and ₦500 late surcharge.
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Select Payment Method
                  </label>

                  {/* Wallet Balance Option */}
                  <div
                    onClick={() => setSelectedMethod("wallet")}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedMethod === "wallet"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Available Wallet Balance</div>
                        <div className="text-xs text-gray-500 font-mono">
                          Balance: ₦{walletBalance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedMethod === "wallet" ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                    }`}>
                      {selectedMethod === "wallet" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Flutterwave Option */}
                  <div
                    onClick={() => setSelectedMethod("flutterwave")}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedMethod === "flutterwave"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Flutterwave</div>
                        <div className="text-xs text-gray-500">
                          Debit Card, Bank Transfer, or USSD
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedMethod === "flutterwave" ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                    }`}>
                      {selectedMethod === "flutterwave" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>

                {selectedMethod === "wallet" && walletBalance < plan.currentAmountDue && (
                  <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                    Your available balance (₦{walletBalance.toLocaleString()}) is insufficient for this ₦{plan.currentAmountDue.toLocaleString()} payment. Please choose Flutterwave.
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPayModal(false)}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmitting || (selectedMethod === "wallet" && walletBalance < plan.currentAmountDue)}
                  onClick={selectedMethod === "wallet" ? handlePayWithWallet : handlePayWithFlutterwave}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₦${plan.currentAmountDue.toLocaleString()} Now`
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
