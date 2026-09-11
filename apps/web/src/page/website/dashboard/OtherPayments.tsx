import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Minus,
  Plus,
  Shield,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/ToastComponent";
import { supabase } from "@/lib/supabaseClient";
import { FLUTTERWAVE_KEYS } from "@/config/Index";
import * as Sentry from "@sentry/react";
import { Toaster } from "react-hot-toast";
import { PROJECT_CATEGORIES } from "@/constant/projectCategories";
import type { User } from "@supabase/supabase-js";
import { parsePositiveInt } from "@shared/dataSanitizers";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type PaymentType = "farm_setup" | "farm_support" | "absentee_fine" | "";

interface SlotSubscriptionRow {
  id: string;
  slots: number;
  project_category?: string;
  last_payment_date: string;
}

const OtherPayments = () => {
  const [paymentType, setPaymentType] = useState<PaymentType>("");
  const [months, setMonths] = useState(1);
  const [category, setCategory] = useState("");
  const [totalSlots, setTotalSlots] = useState(0);
  const [subscriptions, setSubscriptions] = useState<SlotSubscriptionRow[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] =
    useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const FEES = {
    farm_setup: 5000,
    farm_support: 500,
    absentee_fine: 500,
  };

  const getFee = (
    type: "farm_setup" | "farm_support" | "absentee_fine" | "",
  ) => {
    if (!type) return 0;
    if (category === "Organic FoodNation (1 Million Hectares against Hunger)") {
      if (type === "farm_setup") {
        return 10000;
      }
      if (type === "farm_support") {
        return 200;
      }
    }
    return FEES[type];
  };

  const MAX_MONTHS = {
    farm_setup: 5,
    farm_support: 12,
    absentee_fine: 12,
  };

  const getMaxMonths = (type: PaymentType, forCategory: string = category) => {
    if (!type) return 1;
    if (
      forCategory === "Organic FoodNation (1 Million Hectares against Hunger)" &&
      type === "farm_setup"
    ) {
      return 1;
    }
    return MAX_MONTHS[type];
  };

  const totalPrice = paymentType
    ? getFee(paymentType) * months * totalSlots
    : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        // Fetch total slots
        const { data: subs } = await supabase
          .from("slot_subscriptions")
          .select("*")
          .eq("user_id", user.id);

        setSubscriptions(subs || []);

        const slotsCount = (subs || []).reduce((total, item) => {
          const slotValue = Number(item?.slots ?? 0);
          return total + (Number.isNaN(slotValue) ? 0 : slotValue);
        }, 0);

        setTotalSlots(slotsCount);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Load Flutterwave script
    if (!document.getElementById("flutterwave-script")) {
      const script = document.createElement("script");
      script.id = "flutterwave-script";
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const incrementMonths = () => {
    if (!paymentType) return;
    setMonths((m) => Math.min(m + 1, getMaxMonths(paymentType)));
  };
  const decrementMonths = () => setMonths((m) => Math.max(m - 1, 1));

  const computeSlotsForCategory = (cat: string) => {
    const filtered = subscriptions.filter(
      (s) => (s.project_category || "Gingertown") === cat,
    );
    return filtered.reduce((total, item) => {
      const slotValue = Number(item?.slots ?? 0);
      return total + (Number.isNaN(slotValue) ? 0 : slotValue);
    }, 0);
  };

  const isReadOnly = user?.email !== "developerelijah360@gmail.com";

  const handlePayment = async () => {
    if (!user) {
      showToast({
        title: "Login Required",
        description: "Please log in to continue.",
        variant: "error",
      });
      return;
    }

    if (isReadOnly) {
      showToast({
        title: "System in Audit Mode",
        description:
          "Payments are temporarily paused during financial reconciliation. Only developerelijah360@gmail.com can test transactions.",
        variant: "error",
      });
      return;
    }

    if (!category) {
      showToast({
        title: "Category Required",
        description: "Please select a project category.",
        variant: "error",
      });
      return;
    }

    const safeSlots = parsePositiveInt(totalSlots, 0);
    if (safeSlots <= 0) {
      showToast({
        title: "No Slots Found",
        description: "You must have purchased farm slots to use this feature.",
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
      // 1. Create a record in our new other_payments table
      const { data: paymentRecord, error: dbError } = await supabase
        .from("other_payments")
        .insert([
          {
            user_id: user.id,
            payment_type: paymentType,
            months: months,
            slots: totalSlots,
            subscription_id: selectedSubscriptionId || null,
            amount: totalPrice,
            status: "pending",
            project_category: category,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      const reference = `OTH_${paymentRecord.id}_${Date.now()}`;

      window.FlutterwaveCheckout({
        public_key: FLUTTERWAVE_KEYS,
        tx_ref: reference,
        amount: totalPrice,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: user.email ?? "",
          name: user.user_metadata?.full_name || user.email,
        },
        meta: {
          user_id: user.id,
          payment_id: paymentRecord.id,
          subscription_id: selectedSubscriptionId || null,
          type: paymentType,
          project_category: category,
        },
        customizations: {
          title: `${paymentType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} Payment`,
          description: `${paymentType.replace("_", " ").toUpperCase()} - ${months} months for ${totalSlots} slots`,
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZGE2NjM1ZS00NTAzLTRkZDktOTdmOS0zYWExY2Y5NzNiOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhZ3JvaGVhbC0gYnVja2V0cy9sb2dvLnBuZyIsImlhdCI6MTc3NDAwODY3OCwiZXhwIjo0OTI3NjA4Njc4fQ.fuwva3-hMj5KmMRqElcclgJqzA5d4aigxCIlHVHgMak",
        },
        onclose: () => {
          setIsProcessing(false);
        },
        callback: async (response) => {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            // Update the record in other_payments
            await supabase
              .from("other_payments")
              .update({
                status: "success",
                transaction_ref: response.transaction_id,
              })
              .eq("id", paymentRecord.id);

            showToast({
              title: "Payment Successful",
              description: `Your ${paymentType.replace("_", " ")} payment has been recorded.`,
              variant: "success",
            });

            // Optional: Redirect or refresh
            setIsProcessing(false);
            setTimeout(() => {
              navigate("/dashboard/slots-subscription");
            }, 1000);
          } else {
            setIsProcessing(false);
          }
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      showToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment.",
        variant: "error",
      });
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading payment details..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <PaymentGuidancePopup />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Other Payments
          </h1>
          <p className="text-gray-600">
            Pay for Farm Setup, Support, or Absentee Fines.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-700" />
                Payment Details
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Project Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setCategory(newCategory);
                      setSelectedSubscriptionId(""); // Reset batch when category changes

                      let nextPaymentType = paymentType;
                      if (
                        newCategory ===
                          "Organic FoodNation (1 Million Hectares against Hunger)" &&
                        paymentType === "absentee_fine"
                      ) {
                        setPaymentType("");
                        nextPaymentType = "";
                      }

                      if (
                        nextPaymentType &&
                        months > getMaxMonths(nextPaymentType, newCategory)
                      ) {
                        setMonths(getMaxMonths(nextPaymentType, newCategory));
                      }

                      if (!selectedSubscriptionId) {
                        setTotalSlots(computeSlotsForCategory(newCategory));
                      }
                    }}
                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    required
                  >
                    <option value="" disabled>
                      Select Project Category
                    </option>
                    {PROJECT_CATEGORIES.filter(
                      (cat) => cat !== "Mushroom Village",
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    What are you paying for?
                  </label>
                  <select
                    value={paymentType || ""}
                    onChange={(e) => {
                      const newType = e.target.value as PaymentType;
                      setPaymentType(newType);
                      if (newType && months > getMaxMonths(newType)) {
                        setMonths(getMaxMonths(newType));
                      }
                    }}
                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  >
                    <option value="" disabled>
                      Select payment type
                    </option>
                    <option value="farm_setup">Farm Setup Fee</option>
                    {category !==
                      "Organic FoodNation (1 Million Hectares against Hunger)" && (
                      <option value="absentee_fine">Absentee Fine</option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Select Slot Batch (Optional)
                  </label>
                  <select
                    value={selectedSubscriptionId}
                    onChange={(e) => {
                      const subId = e.target.value;
                      setSelectedSubscriptionId(subId);
                      if (subId) {
                        const sub = subscriptions.find((s) => s.id === subId);
                        if (sub) setTotalSlots(Number(sub.slots));
                      } else {
                        // Filtered Slots selected, recalculate total
                        setTotalSlots(computeSlotsForCategory(category));
                      }
                    }}
                    className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  >
                    <option value="">
                      All Slots (Total:{" "}
                      {subscriptions
                        .filter(
                          (s) =>
                            (s.project_category || "Gingertown") === category,
                        )
                        .reduce((s, b) => s + Number(b.slots), 0)}
                      )
                    </option>
                    {subscriptions
                      .filter(
                        (s) =>
                          (s.project_category || "Gingertown") === category,
                      )
                      .map((sub, idx, arr) => (
                        <option key={sub.id} value={sub.id}>
                          Batch #{arr.length - idx} ({sub.slots} slots) -{" "}
                          {new Date(sub.last_payment_date).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Number of Slots to pay for
                  </label>
                  <div className="w-full h-12 rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      {totalSlots}
                    </span>
                    <span className="text-xs font-bold text-green-700 uppercase">
                      Slots
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    {selectedSubscriptionId
                      ? "Calculated based on selected batch."
                      : "Calculated based on total active slots."}
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-700">
                    Number of Months
                  </label>
                  <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={decrementMonths}
                      disabled={months <= 1}
                      className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <div className="flex-1 text-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {months}
                      </span>
                      <p className="text-xs text-gray-500 font-medium">
                        {months === 1 ? "month" : "months"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={incrementMonths}
                      disabled={
                        !paymentType || months >= getMaxMonths(paymentType)
                      }
                      className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-xs text-gray-400">
                      Maximum allowed for this type:{" "}
                      {paymentType ? getMaxMonths(paymentType) : "0"} months
                    </p>
                    {paymentType && (
                      <div className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
                        {months} month{months > 1 ? "s" : ""} × {totalSlots}{" "}
                        slot{totalSlots > 1 ? "s" : ""} × ₦
                        {getFee(paymentType).toLocaleString()} = ₦
                        {totalPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  {isReadOnly && (
                    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Audit Mode:</strong> Fee payments are temporarily paused during financial reconciliation.
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={handlePayment}
                    disabled={
                      isProcessing ||
                      totalSlots <= 0 ||
                      !paymentType ||
                      isReadOnly
                    }
                    className="w-full h-12 bg-green-800 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    {isProcessing
                      ? "Processing..."
                      : isReadOnly
                        ? "Payments Paused (Audit Mode)"
                        : "Pay with Flutterwave"}
                  </Button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Shield className="w-3.5 h-3.5" />
                    Secure payment via Flutterwave
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 sticky top-24"
            >
              <div className="bg-green-800 p-6 text-white text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Payment Summary</h3>
                <p className="text-green-100 text-xs opacity-80 uppercase tracking-widest">
                  Review your selection
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {paymentType
                      ? paymentType.replace("_", " ")
                      : "Not selected"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate (per slot/month)</span>
                  <span className="font-semibold text-gray-900">
                    ₦{paymentType ? getFee(paymentType).toLocaleString() : "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Slots</span>
                  <span className="font-semibold text-gray-900">
                    {totalSlots}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold text-gray-900">
                    {months} month{months > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-gray-900">
                      Total to Pay
                    </span>
                    <span className="text-2xl font-bold text-green-800">
                      ₦{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {totalSlots <= 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <p className="text-xs text-red-700 leading-tight">
                      You don't have any active farm slots. Please purchase
                      slots first to pay for setup or support fees.
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    Automated record keeping
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    Instant confirmation
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherPayments;
