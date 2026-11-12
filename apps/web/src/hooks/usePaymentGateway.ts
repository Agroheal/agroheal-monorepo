import { useState, useCallback } from "react";
import { FLUTTERWAVE_KEYS } from "@/config/Index";
import { openNombaInlineModal } from "@/components/checkout/NombaInlineModal";
import { apiClient } from "@/lib/apiClient";

export type SupportedPaymentGateway = "flutterwave" | "nomba";

export interface LaunchPaymentOptions {
  gateway: SupportedPaymentGateway;
  amount: number;
  txRef: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  title?: string;
  description?: string;
  logoUrl?: string;
  publicKey?: string;
  checkoutUrl?: string; // Nomba hosted checkout link
  onSuccess: (data: { reference: string; gatewayRef?: string; gateway: SupportedPaymentGateway; raw?: any }) => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

function ensureFlutterwaveScript(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).FlutterwaveCheckout) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("flutterwave-script");
    if (existing) {
      if ((window as any).FlutterwaveCheckout) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load payment gateway script"))
      );
    }
    const script = document.createElement("script");
    script.id = "flutterwave-script";
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load payment gateway script"));
    document.body.appendChild(script);
  });
}

export function usePaymentGateway() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const launchPayment = useCallback(async (options: LaunchPaymentOptions) => {
    const {
      gateway,
      amount,
      txRef,
      customerEmail,
      customerName,
      customerPhone,
      title = "AgroHeal Payment",
      description = "AgroHeal Platform Activation",
      logoUrl = "https://agroheal.solutions/logo.png",
      publicKey,
      checkoutUrl,
      onSuccess,
      onClose,
      onError,
    } = options;

    setIsInitializing(true);
    setError(null);

    try {
      if (gateway === "flutterwave") {
        await ensureFlutterwaveScript();

        const activePublicKey =
          publicKey ||
          (typeof FLUTTERWAVE_KEYS === "string" ? FLUTTERWAVE_KEYS : (FLUTTERWAVE_KEYS as any)?.publicKey) ||
          (typeof window !== "undefined" && (window as any).FLUTTERWAVE_PUBLIC_KEY) ||
          import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
          "FLWPUBK-20fafa986173a9b4507c82992f53055b-X";

        if (!(window as any).FlutterwaveCheckout) {
          throw new Error("Flutterwave SDK failed to initialize. Please try again.");
        }

        setIsInitializing(false);

        (window as any).FlutterwaveCheckout({
          public_key: activePublicKey,
          tx_ref: txRef,
          amount,
          currency: "NGN",
          payment_options: "card,banktransfer,ussd",
          customer: {
            email: customerEmail,
            phone_number: customerPhone || "",
            name: customerName || "AgroHeal Member",
          },
          customizations: {
            title,
            description,
            logo: logoUrl,
          },
          callback: (response: any) => {
            const isSuccess =
              response.status === "successful" ||
              response.status === "completed" ||
              (response.data && response.data.status === "successful");

            if (isSuccess) {
              const flwNumericId = response.transaction_id || response.id || response.flw_ref;
              // Prioritize our business transaction reference (tx_ref) so downstream lookups and claim account find the pending transaction immediately
              const confirmedRef = String(
                response.tx_ref || txRef || flwNumericId
              );
              onSuccess({
                reference: confirmedRef,
                gatewayRef: flwNumericId ? String(flwNumericId) : undefined,
                gateway: "flutterwave",
                raw: response,
              });
            } else {
              onError?.(new Error("Payment was not completed successfully."));
            }
          },
          onclose: () => {
            onClose?.();
          },
        });
      } else if (gateway === "nomba") {
        let activeCheckoutUrl = checkoutUrl;

        if (!activeCheckoutUrl) {
          try {
            const initRes = await apiClient.checkout.guestInitiate({
              fullName: customerName || "AgroHeal Member",
              email: customerEmail,
              phone: customerPhone || "08000000000",
              amount,
              plan: "green_card",
              gateway: "nomba",
            });
            activeCheckoutUrl = initRes.checkoutUrl;
          } catch (initErr: any) {
            console.warn("[usePaymentGateway] Could not auto-generate Nomba session:", initErr);
          }
        }

        setIsInitializing(false);

        if (activeCheckoutUrl) {
          openNombaInlineModal({
            checkoutUrl: activeCheckoutUrl,
            txRef,
            amount,
            customerEmail,
            customerName,
            title,
            onSuccess: (res) => {
              onSuccess({
                reference: res.reference,
                gateway: "nomba",
                raw: res.raw,
              });
            },
            onClose: () => {
              onClose?.();
            },
            onError: (err) => {
              onError?.(err);
            },
          });
        } else {
          throw new Error("Unable to initialize Nomba checkout session. Please try again or use Flutterwave.");
        }
      } else {
        throw new Error(`Unsupported payment gateway: ${gateway}`);
      }
    } catch (err: any) {
      setIsInitializing(false);
      const errMsg = err.message || "Failed to launch payment gateway.";
      setError(errMsg);
      onError?.(err);
    }
  }, []);

  return {
    launchPayment,
    isInitializing,
    error,
  };
}

