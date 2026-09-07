import { motion } from "framer-motion";
import { Check, Crown, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

// import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { benefits, included } from "@/helpers/dashboard.helpers";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { FLUTTERWAVE_KEYS } from "@/config/Index";
import * as Sentry from "@sentry/react";
import PaymentGuidancePopup from "@/components/webComponents/PaymentGuidancePopup";
import type { User } from "@supabase/supabase-js";

const GREEN_CARD_FEE = 2000;
const LIFETIME_YEARS = 100;

const Subscribe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activationError, setActivationError] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    getUser();

    // Load Flutterwave inline script
    if (!document.getElementById("flutterwave-script")) {
      const script = document.createElement("script");
      script.id = "flutterwave-script";
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [navigate]);

  const handleFlutterwavePayment = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const flwKey = FLUTTERWAVE_KEYS;
    if (!flwKey) {
      alert("Flutterwave key missing.");
      return;
    }
    if (!window.FlutterwaveCheckout) {
      alert("Payment is loading. Try again.");
      return;
    }

    Sentry.metrics.count("payment_initiated", 1);
    setLoading(true);

    const reference = `SUB_${Date.now()}_${user.id.slice(0, 8)}`;
    localStorage.setItem("pending_payment_ref", reference);
    localStorage.setItem("pending_payment_provider", "flutterwave");
    localStorage.setItem("pending_payment_userId", user.id);
    localStorage.setItem(
      "pending_payment_referral_code",
      user.user_metadata?.referral_code || "",
    );

    try {
      window.FlutterwaveCheckout({
        public_key: FLUTTERWAVE_KEYS,
        tx_ref: reference,
        amount: GREEN_CARD_FEE,
        currency: "NGN",
        payment_options: "card, banktransfer, ussd",
        customer: {
          email: user.email ?? "",
          name: user.user_metadata?.full_name || user.email,
        },
        meta: {
          user_id: user.id,
          plan: "green_card",
        },
        customizations: {
          title: "Agroheal Green Card",
          description: "Green Card — join the LEAP Community & platform",
          logo: "https://ptowfacejneezksyhntk.supabase.co/storage/v1/object/sign/agroheal-%20buckets/logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZGE2NjM1ZS00NTAzLTRkZDktOTdmOS0zYWExY2Y5NzNiOGQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhZ3JvaGVhbC0gYnVja2V0cy9sb2dvLnBuZyIsImlhdCI6MTc3NDAwODY3OCwiZXhwIjo0OTI3NjA4Njc4fQ.fuwva3-hMj5KmMRqElcclgJqzA5d4aigxCIlHVHgMak",
        },
        onclose: () => setLoading(false),
        callback: function (response) {
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            Sentry.metrics.count("payment_success", 1);

            // Flutterwave returns transaction_id, use as reference for server-side verify
            const txRef = response.tx_ref || reference;
            const txId = response.transaction_id;
            setPaymentReference(String(txId));

            localStorage.setItem("pending_payment_ref", String(txId));
            localStorage.setItem("pending_payment_provider", "flutterwave");
            localStorage.setItem("pending_payment_userId", user.id);

            const run = async () => {
              const now = new Date();
              const expiresAt = new Date();
              expiresAt.setFullYear(expiresAt.getFullYear() + LIFETIME_YEARS);

              const { error: subError } = await supabase
                .from("subscriptions")
                .upsert(
                  [
                    {
                      user_id: user.id,
                      plan: "green_card",
                      status: "active",
                      started_at: now.toISOString(),
                      expires_at: expiresAt.toISOString(),
                    },
                  ],
                  { onConflict: "user_id" },
                );

              if (subError) {
                Sentry.captureException(subError, {
                  extra: {
                    action: "direct_payment_upsert",
                    userId: user.id,
                    txRef,
                  },
                });
                throw subError;
              }

              const { data, error: verifyError } =
                await supabase.functions.invoke("verify-payment", {
                  body: {
                    reference: txId || txRef,
                    provider: "flutterwave",
                    userId: user.id,
                    referralCode:
                      user.user_metadata?.referral_code || undefined,
                  },
                });

              if (verifyError || !data?.success) {
                Sentry.captureException(
                  verifyError || new Error("verify-payment failed"),
                  {
                    extra: {
                      action: "edge_verify_payment",
                      userId: user.id,
                      txRef,
                    },
                  },
                );
                throw (
                  verifyError ||
                  new Error(data?.message || "verify-payment failed")
                );
              }

              localStorage.removeItem("pending_payment_ref");
              localStorage.removeItem("pending_payment_provider");
              localStorage.removeItem("pending_payment_userId");
              localStorage.removeItem("pending_payment_referral_code");

              await supabase.auth.refreshSession();
              setShowSuccess(true);
            };

            run()
              .catch((err) => {
                Sentry.captureException(err, {
                  extra: { action: "post_payment", userId: user.id },
                });
                setActivationError(true);
              })
              .finally(() => setLoading(false));
          } else {
            // Payment was not successful
            setLoading(false);
          }
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      Sentry.metrics.count("payment_failed", 1);
      alert(`Failed to initialize payment: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const pendingRef = localStorage.getItem("pending_payment_ref");
        const pendingProvider = localStorage.getItem(
          "pending_payment_provider",
        );
        const pendingUserId = localStorage.getItem("pending_payment_userId");

        if (!pendingRef || !pendingProvider || !pendingUserId) return;

        setLoading(true);
        try {
          const pendingReferralCode =
            localStorage.getItem("pending_payment_referral_code") || undefined;
          const now = new Date();
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + LIFETIME_YEARS);

          const { error: subError } = await supabase
            .from("subscriptions")
            .upsert(
              [
                {
                  user_id: pendingUserId,
                  plan: "green_card",
                  status: "active",
                  started_at: now.toISOString(),
                  expires_at: expiresAt.toISOString(),
                },
              ],
              { onConflict: "user_id" },
            );

          if (subError) {
            console.error(
              "Subscription upsert failed on visibility return",
              subError,
            );
          }

          const { data, error } = await supabase.functions.invoke(
            "verify-payment",
            {
              body: {
                reference: pendingRef,
                provider: pendingProvider,
                userId: pendingUserId,
                referralCode: pendingReferralCode,
              },
            },
          );

          if (!error && data?.success) {
            localStorage.removeItem("pending_payment_ref");
            localStorage.removeItem("pending_payment_provider");
            localStorage.removeItem("pending_payment_userId");
            localStorage.removeItem("pending_payment_referral_code");
            await supabase.auth.refreshSession();
            setShowSuccess(true);
          }
        } catch (err) {
          console.error("Auto-verify on return failed", err);
        } finally {
          setLoading(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  // const retryActivation = async () => {
  //   setActivationError(false);
  //   setLoading(true);
  //   try {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();
  //     if (!session) {
  //       navigate("/login");
  //       return;
  //     }

  //     if (!paymentReference) {
  //       navigate("/subscribe");
  //       return;
  //     }

  //     const { data, error } = await supabase.functions.invoke(
  //       "verify-payment",
  //       {
  //         body: {
  //           reference: paymentReference,
  //           provider: "flutterwave",
  //           userId: session.user.id,
  //         },
  //       },
  //     );

  //     if (error || !data?.success) {
  //       Sentry.captureException(error, {
  //         extra: { action: "retry_activation", userId: user?.id },
  //       });
  //       setActivationError(true);
  //       return;
  //     }

  //     await supabase.auth.refreshSession();
  //     setShowSuccess(true);
  //   } catch (err) {
  //     Sentry.captureException(err, {
  //       extra: { action: "retry_activation", userId: user?.id },
  //     });
  //     setActivationError(true);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // 3. Fix retryActivation to read from localStorage if state is null
  const retryActivation = async () => {
    setActivationError(false);
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Read from localStorage as fallback if state was lost
      const ref =
        paymentReference || localStorage.getItem("pending_payment_ref");
      if (!ref) {
        navigate("/subscribe");
        return;
      }

      const referralCode =
        localStorage.getItem("pending_payment_referral_code") || undefined;
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + LIFETIME_YEARS);

      const { error: subError } = await supabase.from("subscriptions").upsert(
        [
          {
            user_id: session.user.id,
            plan: "green_card",
            status: "active",
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          },
        ],
        { onConflict: "user_id" },
      );

      if (subError) {
        Sentry.captureException(subError, {
          extra: {
            action: "retry_direct_payment_upsert",
            userId: session.user.id,
          },
        });
      }

      const { data, error: verifyError } = await supabase.functions.invoke(
        "verify-payment",
        {
          body: {
            reference: ref,
            provider: "flutterwave",
            userId: session.user.id,
            referralCode,
          },
        },
      );

      if (verifyError || !data?.success) {
        Sentry.captureException(
          verifyError || new Error("verify-payment failed"),
          {
            extra: {
              action: "retry_edge_verify_payment",
              userId: session.user.id,
            },
          },
        );
        setActivationError(true);
        return;
      }

      localStorage.removeItem("pending_payment_ref");
      localStorage.removeItem("pending_payment_provider");
      localStorage.removeItem("pending_payment_userId");
      localStorage.removeItem("pending_payment_referral_code");
      await supabase.auth.refreshSession();
      setShowSuccess(true);
    } catch {
      setActivationError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PaymentSuccess
        isOpen={showSuccess}
        userName={user?.user_metadata?.full_name || user?.email}
      />
      <ActivationErrorModal
        isOpen={activationError}
        onRetry={retryActivation}
        loading={loading}
      />
      <PaymentGuidancePopup />
      {/* <div className="min-h-screen bg-background">
        <main className="pt-10 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 text-[#d17547] font-semibold text-sm uppercase tracking-wider mb-4">
                <span
                  className="h-2 w-2 rounded-full bg-accent"
                  aria-hidden="true"
                />
                Platform Access
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Unlock Your Learning Journey
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Get full access to your personalized dashboard and start
                mastering organic farming today.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-md mx-auto mb-16"
            >
              <Card className="relative overflow-hidden border-2 border-primary/20 shadow-elevated">
                <div className="absolute top-0 right-0 bg-gradient-cta text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-bl-lg">
                  Yearly subscription Payment
                </div>

                <CardContent className="p-8 pt-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-6">
                    <Crown className="w-8 h-8 text-primary-foreground" />
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-muted-foreground text-sm mb-1">
                      Full Platform Access
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl md:text-5xl font-display font-bold text-foreground">
                        ₦2,000
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">
                      Yearly subscription
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {included.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-foreground"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleFlutterwavePayment}
                    disabled={loading}
                    className="w-full bg-green-800 text-white hover:bg-green-900 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Get Started Now"
                    )}
                  </Button>

                  <p className="text-center text-muted-foreground text-xs mt-4">
                    Secure payment via Flutterwave
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
                What You'll Get
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="h-full bg-card/70 backdrop-blur-sm border-border/50 shadow-soft hover:shadow-elevated transition-shadow duration-300">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-green-800/20 flex items-center justify-center mx-auto mb-4">
                          <benefit.icon className="w-6 h-6 text-green-800" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-center mt-12"
            >
              <p className="text-muted-foreground">
                Have questions?{" "}
                <a
                  href="https://wa.link/5ff5ww"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Contact us
                </a>
              </p>
            </motion.div>
          </div>
        </main>
      </div> */}
      <div className="min-h-screen bg-gray-50">
        <main className="pt-8 pb-16">
          <div className="container px-4">
            {/* ── Page header ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-10"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-700" />
                <span className="text-xs font-semibold text-green-700 uppercase tracking-widest">
                  Platform Access
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Unlock Your Learning Journey
              </h1>
              <p className="text-gray-500 text-sm max-w-lg">
                Get full access to your personalized dashboard and start
                mastering organic farming today.
              </p>
            </motion.div>

            {/* ── Pricing card ── */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="lg:col-span-2"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                  {/* Card top accent */}
                  <div className="h-1 w-full bg-green-700" />

                  <div className="p-6">
                    {/* Badge */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-5">
                      <Crown className="w-3 h-3" />
                      Green Card
                    </span>

                    {/* Price */}
                    <div className="mb-6">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                        Full platform access
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          ₦2,000
                        </span>
                        <span className="text-sm text-gray-400">
                          one-time
                        </span>
                      </div>
                    </div>

                    {/* Included list */}
                    <ul className="space-y-2.5 mb-6 pb-6 border-b border-gray-100">
                      {included.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2.5 text-sm text-gray-600"
                        >
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-green-700" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={handleFlutterwavePayment}
                      disabled={loading}
                      className="w-full h-11 bg-green-800 text-white hover:bg-green-700 disabled:opacity-50 rounded-xl font-semibold text-sm"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Get Started Now
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      <Shield className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-400">
                        Secure payment via Flutterwave
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Benefits grid ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="lg:col-span-3"
              >
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">
                      What you'll get
                    </h2>
                  </div>

                  <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={benefit.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.2 + index * 0.07,
                        }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-green-50/60 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 group-hover:border-green-100 flex items-center justify-center flex-shrink-0 transition-colors shadow-sm">
                          <benefit.icon className="w-4.5 h-4.5 text-green-800" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-0.5">
                            {benefit.title}
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Footer note ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-center"
            >
              <p className="text-sm text-gray-400">
                Have questions?{" "}
                <a
                  href="https://wa.link/5ff5ww"
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-800 hover:underline font-medium"
                >
                  Contact us on WhatsApp
                </a>
              </p>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

// ─── PaymentSuccess modal — unchanged ─────────────────────────────────────────
interface PaymentSuccessProps {
  isOpen: boolean;
  userName?: string;
}

const PaymentSuccess = ({ isOpen, userName }: PaymentSuccessProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, navigate]);

  const handleGoNow = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative bg-green-800 px-8 pt-10 pb-16 text-center overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                  <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
                  <div className="absolute top-4 left-1/3 w-2 h-2 rounded-full bg-white/20" />
                  <div className="absolute bottom-8 right-1/4 w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center gap-2 mb-4"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <Sparkles className="w-3 h-3 text-yellow-200 mt-1" />
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.15,
                  }}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg"
                >
                  <CheckCircle className="w-11 h-11 text-green-700" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Payment Successful!
                  </h2>
                  <p className="text-green-200 text-sm">
                    Welcome to Agroheal
                    {userName ? `, ${userName.split(" ")[0]}` : ""}! 🌱
                  </p>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="relative -mt-8 mx-4 bg-white rounded-2xl border border-gray-100 shadow-md p-5 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Platform access activated
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your Green Card is now active. Explore courses, manage
                      your farm slot, and start building your community.
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="px-6 pb-8 space-y-3"
              >
                <button
                  onClick={handleGoNow}
                  className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-xs text-gray-400">
                  Redirecting automatically in{" "}
                  <span className="font-bold text-green-700">{countdown}s</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── ActivationErrorModal — unchanged ─────────────────────────────────────────
interface ActivationErrorModalProps {
  isOpen: boolean;
  onRetry: () => void;
  loading: boolean;
}

const ActivationErrorModal = ({
  isOpen,
  onRetry,
  loading,
}: ActivationErrorModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-8 pt-10 pb-6 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Account Activation
                </h2>
                <p className="text-sm text-gray-600">
                  Your payment was received, but we had trouble activating your
                  subscription. Please retry or contact support.
                </p>
              </div>
              <div className="px-6 pb-8 space-y-3">
                <button
                  onClick={onRetry}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition-all active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Retrying...
                    </span>
                  ) : (
                    "Retry Activation"
                  )}
                </button>
                <a
                  href="https://wa.link/5ff5ww"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center text-sm font-medium text-green-800 hover:underline py-2"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Subscribe;
