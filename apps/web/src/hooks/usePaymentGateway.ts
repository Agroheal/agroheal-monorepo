import { useState, useCallback } from "react";
import { FLUTTERWAVE_KEYS } from "@/config/Index";

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
  onSuccess: (data: { reference: string; gateway: SupportedPaymentGateway; raw?: any }) => void;
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
              const confirmedRef = String(
                response.transaction_id || response.tx_ref || response.flw_ref || txRef
              );
              onSuccess({ reference: confirmedRef, gateway: "flutterwave", raw: response });
            } else {
              onError?.(new Error("Payment was not completed successfully."));
            }
          },
          onclose: () => {
            onClose?.();
          },
        });
      } else if (gateway === "nomba") {
        setIsInitializing(false);

        if (checkoutUrl) {
          // Nomba hosted checkout link
          window.location.href = checkoutUrl;
        } else {
          // Fallback if checkout link pending
          onSuccess({ reference: txRef, gateway: "nomba" });
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

