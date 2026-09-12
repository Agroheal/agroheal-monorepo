import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  Minus,
  Plus,
  Shield,
  Sprout,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import * as Sentry from "@sentry/react";
import { PROJECT_CATEGORIES, DEFAULT_CATEGORY } from "@/constant/projectCategories";
import { cleanName, cleanEmail, normalizePhoneNumber, parsePositiveInt } from "@shared/dataSanitizers";
import {
  BASE_SLOT_PRICE as SLOT_UNIT_PRICE,
  CLUSTER_SETUP_FEE,
  GREEN_CARD_FEE,
  calculateSlotSubtotal,
} from "@shared/businessRules";

const Checkout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlCategory = searchParams.get("category");
  const urlSlots = parseInt(searchParams.get("slots") || "1", 10);

  const [slotQuantity, setSlotQuantity] = useState(
    !isNaN(urlSlots) && urlSlots > 0 ? urlSlots : 1,
  );
  const [category, setCategory] = useState(
    urlCategory && PROJECT_CATEGORIES.includes(urlCategory)
      ? urlCategory
      : DEFAULT_CATEGORY,
  );

  const [hasGreenCard, setHasGreenCard] = useState<boolean>(true); // assume true while loading
  const [hasPriorSlots, setHasPriorSlots] = useState<boolean>(false);

  const isFirstSlotPurchase = !hasPriorSlots;
  const { subtotal: slotsSubtotal } = calculateSlotSubtotal(slotQuantity, hasPriorSlots);

  const greenCardFee = hasGreenCard ? 0 : GREEN_CARD_FEE;
  const totalPrice = slotsSubtotal + greenCardFee;
  const isOrganicFoodNation =
    category === "Organic FoodNation (1 Million Hectares against Hunger)";
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"flutterwave" | "wallet" | "split">("flutterwave");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletAmountToUse, setWalletAmountToUse] = useState<number>(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load Flutterwave script ───────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("flutterwave-script")) return;
    const script = document.createElement("script");
    script.id = "flutterwave-script";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ── Auto-prefill logged in member details & check subscriptions ──────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, email, referral_earnings, wallet_balance")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFormData((prev) => ({
            firstName: prev.firstName || profile.first_name || "",
            lastName: prev.lastName || profile.last_name || "",
            phone: prev.phone || profile.phone || "",
            email: prev.email || profile.email || user.email || "",
          }));
          const bal = Number(profile.referral_earnings ?? profile.wallet_balance ?? 0);
          setWalletBalance(bal);
          setWalletAmountToUse(Math.min(bal, totalPrice));
        }

        // Check active Green Card subscription across all plans
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("expires_at, status, plan")
          .eq("user_id", user.id)
          .eq("status", "active");

        const userHasGreenCard = Boolean(
          subs &&
            subs.some(
              (s) => !s.expires_at || new Date(s.expires_at).getTime() > Date.now()
            )
        );
        setHasGreenCard(userHasGreenCard);

        // Check if user already owns any slots
        const { count, data: slotsData } = await supabase
          .from("slot_subscriptions")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "active");

        setHasPriorSlots(Boolean((count && count > 0) || (slotsData && slotsData.length > 0)));
      } catch (err) {
        console.error("Error loading profile in checkout:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // Sync wallet amount to use if total price changes
  useEffect(() => {
    if (walletBalance > 0) {
      setWalletAmountToUse((prev) => {
        if (prev <= 0) return Math.min(walletBalance, totalPrice);
        return Math.min(prev, Math.min(walletBalance, totalPrice));
      });
    }
  }, [totalPrice, walletBalance]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const incrementSlot = () => setSlotQuantity((q) => Math.min(q + 1, 100));
  const decrementSlot = () => setSlotQuantity((q) => Math.max(q - 1, 1));

  const createCheckout = async (method: "flutterwave" | "wallet" | "split" = "flutterwave") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Login required",
        description: "You must be logged in to make payment.",
        variant: "destructive",
      });
      return null;
    }

    const cleanFirstName = cleanName(formData.firstName);
    const cleanLastName = cleanName(formData.lastName);
    const normalizedEmail = cleanEmail(formData.email);
    const normalizedPhone = normalizePhoneNumber(formData.phone);

    const { data, error } = await supabase
      .from("checkout")
      .insert([
        {
          user_id: user.id,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          email: normalizedEmail,
          phone: normalizedPhone,
          amount: totalPrice,
          payment_method: method,
          status: "pending",
          project_category: category,
        },
      ])
      .select()
      .single();

    if (error) {
      Sentry.captureException(error);
      toast({
        title: "Database Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    return data;
  };

  const handleWalletPayment = async () => {
    const cleanFirstName = cleanName(formData.firstName);
    const cleanLastName = cleanName(formData.lastName);
    const normalizedEmail = cleanEmail(formData.email);
    const normalizedPhone = normalizePhoneNumber(formData.phone);

    const newErrors: Record<string, string> = {};
    if (!cleanFirstName) newErrors.firstName = "First name is required";
    if (!cleanLastName) newErrors.lastName = "Last name is required";
    if (!normalizedEmail) newErrors.email = "Email address is required";
    if (!normalizedPhone || normalizedPhone.length < 10) {
      newErrors.phone = "Enter a valid phone number (at least 10 digits)";
    }
    if (!category) newErrors.category = "Please select a project category";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields marked in red.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < totalPrice) {
      toast({
        title: "Insufficient Balance",
        description: `Your available wallet balance is ₦${walletBalance.toLocaleString()}, but this order requires ₦${totalPrice.toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const order = await createCheckout("wallet");
      if (!order) {
        setIsProcessing(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User session expired");
      }

      // Invoke atomic PostgreSQL stored procedure
      const { data: rpcRes, error: rpcErr } = await supabase.rpc(
        "pay_checkout_with_wallet",
        {
          p_user_id: user.id,
          p_checkout_id: order.id,
          p_amount: totalPrice,
          p_slots: slotQuantity,
          p_slot_price: SLOT_UNIT_PRICE,
          p_category: category,
        }
      );

      if (rpcErr) {
        throw rpcErr;
      }

      if (!rpcRes?.success) {
        throw new Error(rpcRes?.message || "Failed to process wallet payment.");
      }

      // If user did not previously hold a Green Card, activate it now as bundled
      if (!hasGreenCard) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
        await supabase.from("subscriptions").upsert(
          [
            {
              user_id: user.id,
              plan: "green_card",
              status: "active",
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
            },
          ],
          { onConflict: "user_id" },
        );
      }

      Sentry.metrics.count("wallet_reinvestment_success", 1);
      toast({
        title: "Slot Secured Successfully!",
        description: `₦${totalPrice.toLocaleString()} paid from wallet balance. ${slotQuantity} slot(s) activated!`,
      });

      setWalletBalance((prev) => Math.max(0, prev - totalPrice));
      navigate("/dashboard/my-slots");
    } catch (err: any) {
      console.error("Wallet payment failed:", err);
      Sentry.captureException(err);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to complete wallet payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlutterwave = async () => {
    const cleanFirstName = cleanName(formData.firstName);
    const cleanLastName = cleanName(formData.lastName);
    const normalizedEmail = cleanEmail(formData.email);
    const normalizedPhone = normalizePhoneNumber(formData.phone);

    const newErrors: Record<string, string> = {};
    if (!cleanFirstName) newErrors.firstName = "First name is required";
    if (!cleanLastName) newErrors.lastName = "Last name is required";
    if (!normalizedEmail) newErrors.email = "Email address is required";
    if (!normalizedPhone || normalizedPhone.length < 10) {
      newErrors.phone = "Enter a valid phone number (at least 10 digits)";
    }
    if (!category) newErrors.category = "Please select a project category";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields marked in red.",
        variant: "destructive",
      });
      return;
    }

    setErrors({}); // Clear errors if valid

    // Read-only audit mode guard
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser && currentUser.email !== "developerelijah360@gmail.com") {
      toast({
        title: "System in Audit Mode",
        description:
          "Slot purchases are temporarily paused during financial reconciliation. Only developerelijah360@gmail.com can test transactions.",
        variant: "destructive",
      });
      return;
    }

    if (!window.FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Flutterwave is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const flwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
    if (!flwKey) {
      toast({
        title: "Payment Error",
        description: "Flutterwave key missing.",
        variant: "destructive",
      });
      return;
    }

    Sentry.metrics.count("payment_initiated", 1);
    setIsProcessing(true);

    const order = await createCheckout();
    if (!order) {
      setIsProcessing(false);
      return;
    }

    try {
      const txRef = `SLOT_${order.id}_${Date.now()}`;

      window.FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: txRef,
        amount: totalPrice,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: order.email,
          phone_number: order.phone,
          name: `${formData.firstName} ${formData.lastName}`,
        },
        meta: {
          user_id: order.user_id,
          order_id: order.id,
          plan: "slot",
          project_category: category,
        },
        customizations: {
          title: "Agroheal Farm Slot",
          description: `${slotQuantity} slot${slotQuantity > 1 ? "s" : ""} — ₦${totalPrice.toLocaleString()}`,
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZGE2NjM1ZS00NTAzLTRkZDktOTdmOS0zYWExY2Y5NzNiOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhZ3JvaGVhbC0gYnVja2V0cy9sb2dvLnBuZyIsImlhdCI6MTc3NDAwODY3OCwiZXhwIjo0OTI3NjA4Njc4fQ.fuwva3-hMj5KmMRqElcclgJqzA5d4aigxCIlHVHgMak",
        },
        onclose: () => {
          toast({
            title: "Payment cancelled",
            description: "You closed the payment window.",
          });
          setIsProcessing(false);
        },
        callback: function (response) {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            Sentry.metrics.count("payment_success", 1);

            const reference = `SUB_${Date.now()}_${order.user_id.slice(0, 8)}`;
            localStorage.setItem("pending_payment_ref", reference);
            localStorage.setItem("pending_payment_provider", "flutterwave");
            localStorage.setItem("pending_payment_userId", order.user_id);

            const flwTransactionId =
              response.transaction_id || response.id || response.flw_ref;
            console.log("Payment successful. Activating slot directly...");

            const activateSlot = async () => {
              try {
                // 1. Update checkout status
                const { error: checkoutErr } = await supabase
                  .from("checkout")
                  .update({
                    status: "paid",
                    transaction_ref: String(flwTransactionId),
                  })
                  .eq("id", order.id);

                if (checkoutErr) throw checkoutErr;

                // 2. Create the subscription
                const nextPaymentDate = new Date();
                nextPaymentDate.setDate(nextPaymentDate.getDate() + 365);

                const { error: subErr } = await supabase
                  .from("slot_subscriptions")
                  .insert([
                    {
                      user_id: order.user_id,
                      checkout_id: order.id,
                      amount: totalPrice,
                      slotprice: SLOT_UNIT_PRICE,
                      status: "active",
                      slots: slotQuantity,
                      last_payment_date: new Date().toISOString(),
                      next_payment_date: nextPaymentDate.toISOString(),
                      project_category: category,
                    },
                  ]);

                if (subErr) throw subErr;

                // 3. If user did not previously hold a Green Card, activate it now
                if (!hasGreenCard) {
                  const expiresAt = new Date();
                  expiresAt.setFullYear(expiresAt.getFullYear() + 100);
                  await supabase.from("subscriptions").upsert(
                    [
                      {
                        user_id: order.user_id,
                        plan: "green_card",
                        status: "active",
                        started_at: new Date().toISOString(),
                        expires_at: expiresAt.toISOString(),
                      },
                    ],
                    { onConflict: "user_id" },
                  );
                }

                toast({
                  title: "Payment successful",
                  description: "Your slot has been secured!",
                });

                navigate("/dashboard/my-slots");
              } catch (err) {
                console.error("Direct activation failed:", err);
                toast({
                  title: "Activation Error",
                  description:
                    "Payment received but failed to update record. Please contact support.",
                  variant: "destructive",
                });
              } finally {
                setIsProcessing(false);
              }
            };

            activateSlot();
          } else {
            setIsProcessing(false);
          }
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      toast({
        title: "Payment Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initialize payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleSplitPayment = async () => {
    const cleanFirstName = cleanName(formData.firstName);
    const cleanLastName = cleanName(formData.lastName);
    const normalizedEmail = cleanEmail(formData.email);
    const normalizedPhone = normalizePhoneNumber(formData.phone);

    const newErrors: Record<string, string> = {};
    if (!cleanFirstName) newErrors.firstName = "First name is required";
    if (!cleanLastName) newErrors.lastName = "Last name is required";
    if (!normalizedEmail) newErrors.email = "Email address is required";
    if (!normalizedPhone || normalizedPhone.length < 10) {
      newErrors.phone = "Enter a valid phone number (at least 10 digits)";
    }
    if (!category) newErrors.category = "Please select a project category";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields marked in red.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});

    const usableWallet = Math.min(walletBalance, Math.max(1, walletAmountToUse));
    const cardAmountToPay = totalPrice - usableWallet;

    if (usableWallet <= 0) {
      toast({
        title: "No Wallet Balance Applied",
        description: "Please apply a wallet amount or choose Flutterwave for full card payment.",
        variant: "destructive",
      });
      return;
    }

    if (cardAmountToPay <= 0) {
      await handleWalletPayment();
      return;
    }

    // Read-only audit mode guard
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser && currentUser.email !== "developerelijah360@gmail.com") {
      toast({
        title: "System in Audit Mode",
        description:
          "Slot purchases are temporarily paused during financial reconciliation. Only developerelijah360@gmail.com can test transactions.",
        variant: "destructive",
      });
      return;
    }

    if (!window.FlutterwaveCheckout) {
      toast({
        title: "Payment Error",
        description: "Flutterwave is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const flwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
    if (!flwKey) {
      toast({
        title: "Payment Error",
        description: "Flutterwave key missing.",
        variant: "destructive",
      });
      return;
    }

    Sentry.metrics.count("split_payment_initiated", 1);
    setIsProcessing(true);

    const order = await createCheckout("split");
    if (!order) {
      setIsProcessing(false);
      return;
    }

    try {
      const txRef = `SPLIT_${order.id}_${Date.now()}`;

      window.FlutterwaveCheckout({
        public_key: flwKey,
        tx_ref: txRef,
        amount: cardAmountToPay,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: order.email,
          phone_number: order.phone,
          name: `${formData.firstName} ${formData.lastName}`,
        },
        meta: {
          user_id: order.user_id,
          order_id: order.id,
          plan: "slot_split",
          wallet_used: usableWallet,
          card_paid: cardAmountToPay,
          project_category: category,
        },
        customizations: {
          title: "Agroheal Farm Slot (Split Payment)",
          description: `₦${usableWallet.toLocaleString()} wallet + ₦${cardAmountToPay.toLocaleString()} card (${slotQuantity} slots)`,
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZGE2NjM1ZS00NTAzLTRkZDktOTdmOS0zYWExY2Y5NzNiOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhZ3JvaGVhbC0gYnVja2V0cy9sb2dvLnBuZyIsImlhdCI6MTc3NDAwODY3OCwiZXhwIjo0OTI3NjA4Njc4fQ.fuwva3-hMj5KmMRqElcclgJqzA5d4aigxCIlHVHgMak",
        },
        onclose: () => {
          toast({
            title: "Payment cancelled",
            description: "You closed the payment window. No charges were made.",
          });
          setIsProcessing(false);
        },
        callback: function (response) {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            Sentry.metrics.count("split_payment_success", 1);
            const flwTransactionId =
              response.transaction_id || response.id || response.flw_ref;

            const finalizeSplit = async () => {
              try {
                // Call atomic split procedure
                const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                  "pay_checkout_with_split",
                  {
                    p_user_id: order.user_id,
                    p_checkout_id: order.id,
                    p_wallet_amount: usableWallet,
                    p_card_amount: cardAmountToPay,
                    p_slots: slotQuantity,
                    p_slot_price: SLOT_UNIT_PRICE,
                    p_category: category,
                    p_flw_ref: String(flwTransactionId),
                  }
                );

                if (rpcErr) throw rpcErr;
                if (!rpcRes?.success) {
                  throw new Error(rpcRes?.message || "Failed to finalize split payment.");
                }

                // If user did not previously hold a Green Card, activate it
                if (!hasGreenCard) {
                  const expiresAt = new Date();
                  expiresAt.setFullYear(expiresAt.getFullYear() + 100);
                  await supabase.from("subscriptions").upsert(
                    [
                      {
                        user_id: order.user_id,
                        plan: "green_card",
                        status: "active",
                        started_at: new Date().toISOString(),
                        expires_at: expiresAt.toISOString(),
                      },
                    ],
                    { onConflict: "user_id" },
                  );
                }

                toast({
                  title: "Split Payment Successful!",
                  description: `₦${usableWallet.toLocaleString()} deducted from wallet & ₦${cardAmountToPay.toLocaleString()} paid via card. ${slotQuantity} slot(s) activated!`,
                });

                setWalletBalance((prev) => Math.max(0, prev - usableWallet));
                navigate("/dashboard/my-slots");
              } catch (finalizeErr: any) {
                console.error("Error finalizing split payment:", finalizeErr);
                toast({
                  title: "Activation Notice",
                  description:
                    "Card payment succeeded. If your slots do not appear immediately, support will reconcile with ref: " +
                    flwTransactionId,
                });
                navigate("/dashboard/my-slots");
              } finally {
                setIsProcessing(false);
              }
            };

            finalizeSplit();
          } else {
            toast({
              title: "Payment Unsuccessful",
              description: "Card payment was not completed.",
              variant: "destructive",
            });
            setIsProcessing(false);
          }
        },
      });
    } catch (err: any) {
      console.error("Flutterwave split launch error:", err);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initialize payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-0 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/dashboard/slots"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Slots
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Secure Your Farm Slot
            </h1>
            <p className="text-muted-foreground mb-8">
              Pay securely via Flutterwave.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Billing Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-soft border border-border/50">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Billing Details
                </h2>

                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => {
                          handleInputChange(e);
                          if (errors.firstName)
                            setErrors((prev) => ({ ...prev, firstName: "" }));
                        }}
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => {
                          handleInputChange(e);
                          if (errors.lastName)
                            setErrors((prev) => ({ ...prev, lastName: "" }));
                        }}
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (errors.email)
                          setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (errors.phone)
                          setErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Project Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (errors.category)
                          setErrors((prev) => ({ ...prev, category: "" }));
                      }}
                      className={`w-full h-10 px-3 rounded-md border bg-background text-sm mb-4 ${errors.category ? "border-red-500" : "border-input"}`}
                      required
                    >
                      <option value="" disabled>
                        Select Project Category
                      </option>
                      {PROJECT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs text-red-500 mt-0.5 mb-4">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Slots</Label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={decrementSlot}
                        disabled={slotQuantity <= 1}
                        className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 text-center">
                        <span className="text-3xl font-bold text-foreground">
                          {slotQuantity}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {slotQuantity === 1 ? "slot" : "slots"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={incrementSlot}
                        disabled={slotQuantity >= 100}
                        className="w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 mt-3"
                    >
                      <div className="bg-green-50/80 border border-green-200/80 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-green-900 font-semibold text-sm">
                          <span>
                            {isFirstSlotPurchase
                              ? "First Slot & Cluster Setup"
                              : `${slotQuantity} Farm Slot${slotQuantity > 1 ? "s" : ""}`}
                          </span>
                          <span>
                            ₦{(isFirstSlotPurchase ? 10000 : slotQuantity * SLOT_UNIT_PRICE).toLocaleString()}
                          </span>
                        </div>

                        {isFirstSlotPurchase && (
                          <div className="text-[11px] text-green-700 space-y-0.5">
                            <p>• ₦5,000 Farm Slot (Biological asset allocation)</p>
                            <p>• ₦5,000 Practical Cluster Setup & Onboarding</p>
                          </div>
                        )}

                        {isFirstSlotPurchase && slotQuantity > 1 && (
                          <div className="flex items-center justify-between text-green-800 pt-1 border-t border-green-200/60 font-medium">
                            <span>+ {slotQuantity - 1} Additional slot{slotQuantity > 2 ? "s" : ""} (@ ₦5,000)</span>
                            <span>₦{((slotQuantity - 1) * SLOT_UNIT_PRICE).toLocaleString()}</span>
                          </div>
                        )}

                        {!hasGreenCard && (
                          <div className="flex items-center justify-between text-amber-900 pt-1.5 border-t border-green-200/60 font-semibold">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-amber-700" />
                              Green Card Lifetime Pass (Auto-bundled)
                            </span>
                            <span>₦{GREEN_CARD_FEE.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 bg-muted/30 rounded-xl p-3.5 border border-border/50">
                        <div className="flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-green-700 shrink-0" />
                          <span className="text-xs font-bold text-green-900 uppercase tracking-wider">
                            LEAP Practical Cluster Model
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {isFirstSlotPurchase
                            ? "Your starter slot package covers biological materials, physical cluster preparation, and resident supervision (₦10,000). Subsequent slots scale at ₦5,000 each with zero recurring monthly fees."
                            : "Subsequent slots scale at ₦5,000 each with zero recurring monthly fees. Ongoing operations are sustained via harvest yields."}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold text-foreground block">
                      Select Payment Method
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* Flutterwave Card */}
                      <div
                        onClick={() => setPaymentMethod("flutterwave")}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          paymentMethod === "flutterwave"
                            ? "border-green-800 bg-green-50/50 shadow-sm"
                            : "border-border hover:border-gray-300 bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                paymentMethod === "flutterwave"
                                  ? "bg-green-800 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                Flutterwave
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Card, Transfer, USSD
                              </p>
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "flutterwave"}
                            onChange={() => setPaymentMethod("flutterwave")}
                            className="mt-1 text-green-800 focus:ring-green-800"
                          />
                        </div>
                      </div>

                      {/* Wallet Balance Card */}
                      <div
                        onClick={() => setPaymentMethod("wallet")}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                          paymentMethod === "wallet"
                            ? "border-green-800 bg-green-50/50 shadow-sm"
                            : "border-border hover:border-gray-300 bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                paymentMethod === "wallet"
                                  ? "bg-green-800 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-sm text-foreground">
                                  Wallet Balance
                                </p>
                                {walletBalance >= totalPrice && (
                                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Ready
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-green-700">
                                ₦{walletBalance.toLocaleString()} available
                              </p>
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === "wallet"}
                            onChange={() => setPaymentMethod("wallet")}
                            className="mt-1 text-green-800 focus:ring-green-800"
                          />
                        </div>
                      </div>

                      {/* Split Payment Card (Combination) */}
                      {walletBalance > 0 && (
                        <div
                          onClick={() => {
                            setPaymentMethod("split");
                            if (walletAmountToUse <= 0) {
                              setWalletAmountToUse(Math.min(walletBalance, totalPrice));
                            }
                          }}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                            paymentMethod === "split"
                              ? "border-green-800 bg-green-50/50 shadow-sm"
                              : "border-border hover:border-gray-300 bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                  paymentMethod === "split"
                                    ? "bg-green-800 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <Coins className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-sm text-foreground">
                                    Wallet + Card
                                  </p>
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Split
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Use ₦{Math.min(walletBalance, totalPrice).toLocaleString()} balance
                                </p>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === "split"}
                              onChange={() => setPaymentMethod("split")}
                              className="mt-1 text-green-800 focus:ring-green-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Wallet Guidance Message */}
                    {paymentMethod === "wallet" && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl p-3.5 border text-sm ${
                          walletBalance >= totalPrice
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-amber-50 border-amber-200 text-amber-900"
                        }`}
                      >
                        {walletBalance >= totalPrice ? (
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-xs">
                                Instant Balance Reinvestment
                              </p>
                              <p className="text-xs mt-0.5 text-emerald-800">
                                ₦{totalPrice.toLocaleString()} will be deducted from your earnings balance. Remaining: ₦{(walletBalance - totalPrice).toLocaleString()}.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-xs">
                                Insufficient Wallet Balance
                              </p>
                              <p className="text-xs mt-0.5 text-amber-800">
                                This order requires ₦{totalPrice.toLocaleString()}, but you have ₦{walletBalance.toLocaleString()}. Select Flutterwave to pay with card/bank transfer, or choose Split Payment to combine your balance with card.
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Split Payment Guidance & Amount Adjuster */}
                    {paymentMethod === "split" && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 border bg-emerald-50/80 border-emerald-200 text-emerald-950 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Order Total:</span>
                          <span className="text-sm font-bold text-gray-900">₦{totalPrice.toLocaleString()}</span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-medium text-emerald-900">Apply from Wallet Balance:</label>
                            <span className="font-bold text-emerald-800">
                              ₦{walletAmountToUse.toLocaleString()} (of ₦{walletBalance.toLocaleString()})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={Math.min(walletBalance, totalPrice)}
                              value={walletAmountToUse}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(Number(e.target.value) || 0, Math.min(walletBalance, totalPrice)));
                                setWalletAmountToUse(val);
                              }}
                              className="h-9 text-xs bg-white rounded-lg font-mono font-bold"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setWalletAmountToUse(Math.min(walletBalance, totalPrice))}
                              className="h-9 text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-semibold"
                            >
                              Use Max
                            </Button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs font-semibold">
                          <span className="text-gray-700">Remaining to Pay via Card / Transfer:</span>
                          <span className="text-sm font-black text-emerald-900">
                            ₦{Math.max(0, totalPrice - walletAmountToUse).toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {paymentMethod === "flutterwave" ? (
                    <Button
                      onClick={handleFlutterwave}
                      disabled={isProcessing}
                      className="w-full h-12 bg-green-800 hover:bg-green-900 text-white font-semibold"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing Flutterwave...
                        </span>
                      ) : (
                        `Pay ₦${totalPrice.toLocaleString()} with Flutterwave`
                      )}
                    </Button>
                  ) : paymentMethod === "wallet" ? (
                    <Button
                      onClick={handleWalletPayment}
                      disabled={isProcessing || walletBalance < totalPrice}
                      className="w-full h-12 bg-green-800 hover:bg-green-900 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deducting Balance & Securing Slot...
                        </span>
                      ) : walletBalance >= totalPrice ? (
                        `Pay ₦${totalPrice.toLocaleString()} from Wallet Balance`
                      ) : (
                        `Insufficient Wallet Balance (₦${walletBalance.toLocaleString()})`
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSplitPayment}
                      disabled={isProcessing || walletAmountToUse <= 0}
                      className="w-full h-12 bg-green-800 hover:bg-green-900 text-white font-semibold"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing Split Payment...
                        </span>
                      ) : (
                        `Pay ₦${Math.max(0, totalPrice - walletAmountToUse).toLocaleString()} via Card (+ ₦${walletAmountToUse.toLocaleString()} from Wallet)`
                      )}
                    </Button>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Your payment information is secure and encrypted.</span>
                </div>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-card rounded-2xl overflow-hidden shadow-soft border border-border/50 sticky top-28">
                <div className="bg-gradient-hero p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-3">
                    <Sprout className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-primary-foreground">
                    Practicals Farm Slot
                  </h3>
                  <p className="text-primary-foreground/80 text-sm">
                    One growing season
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {isFirstSlotPurchase ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Starter Slot & Cluster Setup</span>
                        <span className="text-foreground font-semibold">₦10,000</span>
                      </div>
                      {slotQuantity > 1 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {slotQuantity - 1} Additional Slot{slotQuantity > 2 ? "s" : ""}
                          </span>
                          <span className="text-foreground font-semibold">
                            ₦{((slotQuantity - 1) * SLOT_UNIT_PRICE).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {slotQuantity} Farm Slot{slotQuantity > 1 ? "s" : ""}
                      </span>
                      <span className="text-foreground font-semibold">
                        ₦{(slotQuantity * SLOT_UNIT_PRICE).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {!hasGreenCard && (
                    <div className="flex justify-between items-start text-xs bg-amber-50 border border-amber-200/80 p-3 rounded-xl">
                      <div>
                        <span className="text-amber-950 font-bold block">
                          Green Card Lifetime Pass
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Auto-bundled (Required for payouts & ID)
                        </span>
                      </div>
                      <span className="text-amber-950 font-bold">
                        ₦{GREEN_CARD_FEE.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between font-semibold">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground text-xl font-bold">
                        ₦{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <ul className="text-xs text-muted-foreground space-y-2 pt-4 border-t border-border">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Practice slot in shared commercial cluster
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Resident agronomist supervision
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Up to 40% projected quarterly harvest distributions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Zero recurring monthly maintenance fees
                    </li>
                  </ul>

                  <div className="mt-5 p-3.5 rounded-xl bg-muted/60 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground block mb-0.5 font-semibold">Production & Risk Notice:</strong>
                    AgroHeal is an agribusiness enablement and commercial production platform, not an investment company. Slot contributions finance physical biological inputs and farm grow-houses. Projected surplus returns (up to 40%) depend on biological crop yields and realized commodity market sales.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
