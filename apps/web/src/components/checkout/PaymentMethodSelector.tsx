import React from "react";
import { CreditCard, Zap, Wallet, Check, AlertCircle } from "lucide-react";

export type PaymentGatewayOption = "flutterwave" | "nomba" | "wallet";

export interface PaymentMethodSelectorProps {
  selectedMethod: PaymentGatewayOption;
  onSelectMethod: (method: PaymentGatewayOption) => void;
  amount: number;
  showWallet?: boolean;
  walletBalance?: number;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  amount,
  showWallet = false,
  walletBalance = 0,
  disabled = false,
}) => {
  const isWalletEligible = showWallet && walletBalance >= amount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Select Payment Method
        </label>
        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          256-Bit Encrypted
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* AgroHeal Wallet Option (Conditional) */}
        {showWallet && (
          <div
            onClick={() => {
              if (isWalletEligible && !disabled) {
                onSelectMethod("wallet");
              }
            }}
            className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
              !isWalletEligible
                ? "border-gray-200 bg-gray-50/60 opacity-75 cursor-not-allowed"
                : selectedMethod === "wallet"
                ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
                : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    selectedMethod === "wallet" && isWalletEligible
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">AgroHeal Wallet</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Zero Gateway Fee
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Available:{" "}
                    <span className="font-semibold text-gray-800">
                      ₦{walletBalance.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isWalletEligible && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertCircle className="w-3 h-3" /> Insufficient
                  </span>
                )}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedMethod === "wallet" && isWalletEligible
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {selectedMethod === "wallet" && isWalletEligible && (
                    <Check className="w-3 h-3 stroke-[3]" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flutterwave Option */}
        <div
          onClick={() => !disabled && onSelectMethod("flutterwave")}
          className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedMethod === "flutterwave"
              ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
              : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  selectedMethod === "flutterwave"
                    ? "bg-emerald-600 text-white"
                    : "bg-orange-50 text-orange-600 border border-orange-200"
                }`}
              >
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">Flutterwave</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                    Card • Transfer • USSD
                  </span>
                </div>
                <p className="text-xs text-gray-500">Pay via ATM Card, Bank Transfer, or USSD</p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                selectedMethod === "flutterwave"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-300 bg-white"
              }`}
            >
              {selectedMethod === "flutterwave" && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
        </div>

        {/* Nomba Option (UI commented out for now as requested) */}
        {/*
        <div
          onClick={() => !disabled && onSelectMethod("nomba")}
          className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedMethod === "nomba"
              ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
              : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  selectedMethod === "nomba"
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">Nomba</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Instant Bank Transfer • QR
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Instant Virtual Account, Transfer, Card, or QR
                </p>
              </div>
            </div>

            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                selectedMethod === "nomba"
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-300 bg-white"
              }`}
            >
              {selectedMethod === "nomba" && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
};

