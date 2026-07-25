import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Shield, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import { FLUTTERWAVE_KEYS } from "@/config/Index";
import * as Sentry from "@sentry/react";
import { Toaster } from "react-hot-toast";

const MushroomVillage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [slots, setSlots] = useState(1);
  const navigate = useNavigate();

  const TOTAL_PER_SLOT = 5000;
  const SLOT_ADMIN_MARKETING = 1500;
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

  const handlePayment = async () => {
    if (!user) {
      showToast({
        title: "Login Required",
        description: "Please login to continue with Mushroom Village payment.",
        variant: "error",
      });
      return;
    }

    if (!(window as any).FlutterwaveCheckout) {
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

      (window as any).FlutterwaveCheckout({
        public_key: FLUTTERWAVE_KEYS,
        tx_ref: reference,
        amount: totalAmount,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
        },
        customizations: {
          title: "Mushroom Village Payment",
          description: "Mushroom Village Fee",
        },
        onclose: () => {
          setIsProcessing(false);
        },
        callback: async (response: any) => {
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
            } catch (error: any) {
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
    } catch (error: any) {
      Sentry.captureException(error);
      setIsProcessing(false);
      showToast({
        title: "Payment Error",
        description: error.message || "Failed to iniytialize payment.",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-800/10 flex items-center justify-center animate-pulse">
            <LoaderCircle className="w-6 h-6 text-green-800" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Preparing Mushroom Village payment...
          </p>
        </div>
      </div>
    );
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

              <Button
                disabled={isProcessing}
                onClick={handlePayment}
                className="mt-6 w-full"
              >
                {isProcessing
                  ? "Processing payment..."
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
