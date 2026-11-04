import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Search,
  Lock,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import AgrohealLogo from "@/assets/Image/logo.png";

export const ClaimAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryRef =
    searchParams.get("ref") ||
    searchParams.get("txRef") ||
    searchParams.get("reference") ||
    searchParams.get("tx_ref") ||
    "";

  const [inputTxRef, setInputTxRef] = useState(queryRef);
  const [activeTxRef, setActiveTxRef] = useState(queryRef);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [txData, setTxData] = useState<{
    found: boolean;
    txId: number | string;
    txRef: string;
    isPaid: boolean;
    isClaimed: boolean;
    claimedUserId: string | null;
    amount: number;
    email: string;
    phone: string;
    fullName: string;
    plan: string;
    category: string;
    createdAt: string;
  } | null>(null);

  // Claim Form State
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [claimedMemberId, setClaimedMemberId] = useState<string | null>(null);

  // Auto-fetch if query param is present on mount
  useEffect(() => {
    if (queryRef) {
      handleLookup(queryRef);
    }
  }, [queryRef]);

  const handleLookup = async (refToLookup: string) => {
    const cleanRef = refToLookup.trim();
    if (!cleanRef) {
      setErrorMsg("Please enter a payment reference or transaction ID.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setTxData(null);
    setActiveTxRef(cleanRef);

    try {
      const data = await apiClient.checkout.claimStatus(cleanRef);
      setTxData(data);
      setEmail(data.email || "");
      setFullName(data.fullName || "");
      setPhone(data.phone || "");
    } catch (err: any) {
      console.error("[ClaimAccount] Status lookup error:", err);
      setErrorMsg(
        err.message || "Could not find a transaction matching that reference."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (cleanName.length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsClaiming(true);

    try {
      const claimRes = await apiClient.checkout.claimAccount({
        txRef: activeTxRef,
        email: cleanEmail,
        password,
        fullName: cleanName,
        phone: cleanPhone,
      });

      const memberId =
        claimRes.memberId ||
        claimRes.settlement?.memberId ||
        "GC-2026-MEMBER";
      setClaimedMemberId(memberId);

      // Auto sign-in
      try {
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
      } catch (authErr) {
        console.warn("[ClaimAccount] Auto-signin notice:", authErr);
      }

      showToast({
        variant: "success",
        title: "Account Activated! 🎉",
        description: `Welcome! Your Green Card ID is ${memberId}.`,
      });
    } catch (err: any) {
      console.error("[ClaimAccount] Claim error:", err);
      setErrorMsg(
        err.message || "Failed to claim account. Please verify details."
      );
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 flex flex-col justify-between">
      {/* Header */}
      <header className="p-6 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={AgrohealLogo} alt="Agroheal Logo" className="h-9 w-auto" />
            <div>
              <span className="font-black text-gray-950 text-base tracking-wider block">
                AGROHEAL
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-widest block">
                GREEN CARD REVOLUTION
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="text-xs font-bold text-gray-700 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
          >
            Member Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl w-full mx-auto p-6 my-8 flex-1">
        {/* Lookup Box (if no txData or wants to re-enter) */}
        {!txData && !claimedMemberId && (
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-black">
                🌿
              </div>
              <h1 className="text-2xl font-black text-gray-950">
                Claim Your Green Card Account
              </h1>
              <p className="text-sm text-gray-600 max-w-sm mx-auto">
                Completed your payment on Flutterwave or via Bank Transfer? Enter your payment reference to create your password and claim your membership.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(inputTxRef);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Payment Reference / Transaction ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={inputTxRef}
                    onChange={(e) => setInputTxRef(e.target.value)}
                    placeholder="e.g. GC_GUEST_1793... or Flutterwave Ref"
                    className="w-full px-4 py-3.5 pl-11 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all font-mono"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Claim Green Card</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-500 space-y-1">
              <span className="font-bold text-gray-700 block">Where do I find my reference?</span>
              <p>
                Check the debit alert from your bank or the Flutterwave confirmation email sent to you upon payment.
              </p>
            </div>
          </div>
        )}

        {/* Payment Found & Verified: Claim Account Form */}
        {txData && !claimedMemberId && (
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xl space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {txData.isPaid ? "PAYMENT VERIFIED" : "PENDING GATEWAY CONFIRMATION"}
                </span>
                <h2 className="text-xl font-black text-gray-950 mt-1">
                  {txData.isClaimed
                    ? "Payment Already Claimed"
                    : "Activate Your Account"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTxData(null)}
                className="text-xs text-gray-400 hover:text-gray-700 font-bold"
              >
                Change Ref
              </button>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {/* If Already Claimed */}
            {txData.isClaimed ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  This Green Card Has Already Been Claimed!
                </h3>
                <p className="text-sm text-gray-600">
                  The payment of ₦{txData.amount.toLocaleString()} for{" "}
                  <strong>{txData.email}</strong> is already connected to an active account.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
                  >
                    Go to Login Page
                  </button>
                </div>
              </div>
            ) : !txData.isPaid ? (
              /* If Payment Not Confirmed Yet */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Payment Awaiting Confirmation
                </h3>
                <p className="text-sm text-gray-600">
                  We have not yet received confirmation for reference{" "}
                  <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                    {txData.txRef}
                  </code>
                  . If you paid via bank transfer, it may take 1–3 minutes to settle.
                </p>
                <button
                  onClick={() => handleLookup(activeTxRef)}
                  disabled={isLoading}
                  className="py-3 px-6 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow flex items-center justify-center mx-auto space-x-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span>Re-check Gateway Now</span>
                </button>
              </div>
            ) : (
              /* If Payment Paid & Unclaimed: Claim Account Form */
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                {/* Summary Pill */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-emerald-800 font-semibold block">
                      Package: {txData.category || txData.plan}
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">
                      Ref: {txData.txRef}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-700 block">
                      ₦{txData.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">
                      PAID
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  💡 <strong>Typo Protection:</strong> You can confirm or correct your email and name below before your account is permanently registered.
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirmed Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                  {email !== txData.email && (
                    <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                      ✓ Email corrected from original payment entry ({txData.email}).
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirmed Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirmed Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isClaiming}
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {isClaiming ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Activating Green Card & Account...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Claim Account & Enter Dashboard</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Claimed Successfully Screen */}
        {claimedMemberId && (
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                OFFICIALLY ACTIVATED
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-3">
                Welcome to AgroHeal, {fullName}!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your Digital Green Card is active and ready to use.
              </p>
            </div>

            {/* Digital Card Preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-800 to-green-950 text-white shadow-xl text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-widest text-emerald-300 uppercase">
                  AGROHEAL GREEN CARD
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  ACTIVE
                </span>
              </div>
              <div>
                <span className="text-xs text-emerald-300 block">Member ID</span>
                <span className="text-xl font-mono font-black tracking-wider text-white">
                  {claimedMemberId}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-700/50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-emerald-400 block">MEMBER</span>
                  <span className="font-bold">{fullName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 block">EMAIL</span>
                  <span className="font-mono text-white">{email}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2"
            >
              <span>Continue to Member Dashboard</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-gray-500 border-t border-gray-100 bg-white">
        Need assistance claiming your card? Contact Support on WhatsApp{" "}
        <a
          href="https://wa.me/2349168055000"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-emerald-700 hover:underline"
        >
          +234 916 805 5000
        </a>
      </footer>
    </div>
  );
};

export default ClaimAccount;

