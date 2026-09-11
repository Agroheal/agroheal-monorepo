import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Shield, LoaderCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import { FLUTTERWAVE_KEYS } from "@/config/Index";
import * as Sentry from "@sentry/react";
import { Toaster } from "react-hot-toast";
import type { User } from "@supabase/supabase-js";
import { parsePositiveInt } from "@shared/dataSanitizers";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const MushroomVillage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [slots, setSlots] = useState(1);
  const navigate = useNavigate();

  const TOTAL_PER_SLOT = 5000;
  const SLOT_SUBSCRIPTION_FEE = 1000;
  const FARM_SUPPORT_FEE = 500;
  const FARM_SETUP_FEE = 3500;
  const MAX_SLOTS = 100;
  const projectCategory = "Mushroom Village";

  const totalAmount = slots * TOTAL_PER_SLOT;
  const slotSubscriptionAmount = slots * SLOT_SUBSCRIPTION_FEE;
  const farmSupportAmount = slots * FARM_SUPPORT_FEE;
  const farmSetupAmount = slots * FARM_SETUP_FEE;

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);
      setLoading(false);
    };

    loadUser();

    if (!document.getElementById("flutterwave-script")) {
      const script = document.createElement("script");
      script.id = "flutterwave-script";
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const increaseSlots = () =>
    setSlots((current) => Math.min(MAX_SLOTS, current + 1));
  const decreaseSlots = () => setSlots((current) => Math.max(1, current - 1));

  const isReadOnly = user?.email !== "developerelijah360@gmail.com";

  const handlePayment = async () => {
    if (!user) {
      showToast({
        title: "Login Required",
        description: "Please login to continue with Mushroom Village payment.",
        variant: "error",
      });
      return;
    }

    if (isReadOnly) {
      showToast({
        title: "System in Audit Mode",
        description:
          "Mushroom Village payments are temporarily paused during financial reconciliation. Only developerelijah360@gmail.com can test transactions.",
        variant: "error",
      });
      return;
    }

    const safeSlots = parsePositiveInt(slots, 1);
    if (safeSlots < 1 || safeSlots > MAX_SLOTS) {
      showToast({
        title: "Invalid Slots",
        description: `Please select between 1 and ${MAX_SLOTS} slots.`,
        variant: "error",
      });
      return;
    }

    if (!window.FlutterwaveCheckout) {
      showToast({
        title: "Payment Error",
        description: "Flutterwave is still loading. Please try again.",
        variant: "error",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const reference = `MV_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      window.FlutterwaveCheckout({
        public_key: FLUTTERWAVE_KEYS,
        tx_ref: reference,
        amount: totalAmount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: user.email ?? "",
          name: user.user_metadata?.full_name || user.email,
        },
        customizations: {
          title: "Mushroom Village Payment",
          description: "Mushroom Village Fee",
        },
        onclose: () => {
          setIsProcessing(false);
        },
        callback: async (response) => {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            const transactionRef =
              response.transaction_id ||
              response.id ||
              response.flw_ref ||
              reference;
            try {
              // Insert all records in parallel for speed
              const [slotRes, otherPaymentsRes] = await Promise.all([
                supabase.from("slot_subscriptions").insert([
                  {
                    user_id: user.id,
                    amount: slotSubscriptionAmount,
                    slotprice: SLOT_SUBSCRIPTION_FEE,
                    slots,
                    status: "active",
                    project_category: projectCategory,
                    last_payment_date: new Date().toISOString(),
                    next_payment_date: new Date(
                      new Date().setDate(new Date().getDate() + 30),
                    ).toISOString(),
                  },
                ]),
                supabase.from("other_payments").insert([
                  {
                    user_id: user.id,
                    payment_type: "farm_support",
                    amount: farmSupportAmount,
                    months: 1,
                    slots,
                    project_category: projectCategory,
                    status: "success",
                    transaction_ref: transactionRef,
                  },
                  {
                    user_id: user.id,
                    payment_type: "farm_setup",
                    amount: farmSetupAmount,
                    months: 1,
                    slots,
                    project_category: projectCategory,
                    status: "success",
                    transaction_ref: transactionRef,
                  },
                ]),
              ]);

              // Check for errors from both operations
              if (slotRes.error) {
                console.error("Slot subscription insert error:", slotRes.error);
                throw new Error(
                  `Slot subscription failed: ${slotRes.error.message}`,
                );
              }

              if (otherPaymentsRes.error) {
                console.error(
                  "Other payments insert error:",
                  otherPaymentsRes.error,
                );
                throw new Error(
                  `Other payments failed: ${otherPaymentsRes.error.message}`,
                );
              }

              // All records saved successfully
              setIsProcessing(false);
              showToast({
                title: "Payment Successful",
                description:
                  "Your Mushroom Village payment was recorded successfully.",
                variant: "success",
              });

              // Redirect after brief delay to ensure user sees the success message
              setTimeout(() => {
                navigate("/dashboard/slots-subscription");
              }, 1000);
            } catch (error) {
              console.error("Payment recording error:", error);
              Sentry.captureException(error);
              setIsProcessing(false);
              showToast({
                title: "Save Error",
                description:
                  "Payment completed, but saving records failed. Please contact support.",
                variant: "error",
              });
            }
          } else {
            setIsProcessing(false);
          }
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      setIsProcessing(false);
      showToast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to iniytialize payment.",
        variant: "error",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparing Mushroom Village..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mushroom Village
          </h1>
          <p className="text-gray-600">
            Pay the Mushroom Village fee all at once.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-green-700" />
                <h2 className="text-xl font-bold text-gray-900">
                  Fee Breakdown
                </h2>
              </div>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <p className="font-semibold">Slot & Admin Marketing</p>
                    <p className="text-xs text-gray-500">
                      Slot subscription + support fee
                    </p>
                  </div>
                  <p className="font-semibold">₦1,500</p>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <p className="font-semibold">Farm Setup</p>
                    <p className="text-xs text-gray-500">
                      Farm setup fee per slot
                    </p>
                  </div>
                  <p className="font-semibold">₦3,500</p>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-semibold text-gray-900">
                    Total per slot
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₦5,000
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-green-700" />
                <h2 className="text-xl font-bold text-gray-900">
                  Payment details
                </h2>
                +
              </div>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Slots to pay for</span>
                  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
                    <button
                      type="button"
                      onClick={decreaseSlots}
                      className="h-8 w-8 rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">
                      {slots}
                    </span>
                    <button
                      type="button"
                      onClick={increaseSlots}
                      className="h-8 w-8 rounded-full bg-white text-gray-700 shadow-sm hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Total Slot & Admin Marketing</span>
                  <span>
                    ₦
                    {(
                      slotSubscriptionAmount + farmSupportAmount
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Farm setup total</span>
                  <span>₦{farmSetupAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-base font-semibold text-gray-900">
                  <span>Total due</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {isReadOnly && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Audit Mode:</strong> Payments are temporarily paused during financial reconciliation.
                  </span>
                </div>
              )}

              <Button
                disabled={isProcessing || isReadOnly}
                onClick={handlePayment}
                className="mt-6 w-full"
              >
                {isProcessing
                  ? "Processing payment..."
                  : isReadOnly
                    ? "Payments Paused (Audit Mode)"
                    : "Pay Mushroom Village Fee"}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Why this payment is split
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 text-justify">
                <li>
                  <span className="font-semibold">Slot & Admin Marketing:</span>{" "}
                  ₦1,500 per slot. This covers your slot records, marketing, and
                  immediate administrative onboarding.
                </li>
                <li>
                  <span className="font-semibold">Farm Setup:</span> ₦3,500 per
                  slot. This funds seed, irrigation, land preparation, and farm
                  establishment.
                </li>
                <li>
                  <span className="font-semibold">
                    All records are saved at once:
                  </span>{" "}
                  slot subscription + farm support + farm setup.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MushroomVillage;
