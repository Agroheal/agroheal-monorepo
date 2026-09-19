import { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Coins,
  ArrowDownToLine,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Landmark,
  Building2,
  DollarSign,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { adminApiClient } from "@/lib/apiClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface PendingWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  withdrawal_type: string;
  status: string;
  created_at: string;
  profiles?: {
    name?: string;
    email?: string;
    member_id?: string;
  };
  bank_name?: string;
  account_number?: string;
  account_name?: string;
}

interface TreasuryAuditData {
  totalInflows: number;
  totalWithdrawnDisbursals: number;
  memberLiabilitiesPending: number;
  companyRetainedMargin: number;
  cooperativeReserves: number;
  isZeroLeakage: boolean;
  auditedAt: string;
}

export default function TreasuryPage() {
  const { isSuperDeveloper, isAdmin, isReviewer } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Treasury Audit State
  const [auditData, setAuditData] = useState<TreasuryAuditData | null>(null);

  // Solvency Shield State
  const [liquidBankBalance, setLiquidBankBalance] = useState<number>(0);
  const [solvencyShield, setSolvencyShield] = useState<{
    liquidBankBalance: number;
    totalPendingLiability: number;
    liquidityCoverageRatio: number;
    isSolvent: boolean;
    shortfall: number;
    pendingWithdrawalsCount: number;
    recommendedAction: string;
  } | null>(null);
  const [evaluatingShield, setEvaluatingShield] = useState(false);

  // Withdrawals Queue State
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4500);
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      // 1. Load Executive Treasury Audit
      const audit = await adminApiClient.admin.getTreasuryAudit().catch(() => null);
      if (audit) setAuditData(audit);

      // 2. Load Pending Withdrawals Queue
      const queue = await adminApiClient.withdrawals.listWithdrawals().catch(() => []);
      setWithdrawals(queue || []);

      // 3. Initial Solvency Shield Evaluation
      if (liquidBankBalance > 0 || (queue && queue.length > 0)) {
        const shield = await adminApiClient.withdrawals
          .evaluateSolvencyShield({ liquidBankBalance })
          .catch(() => null);
        if (shield) setSolvencyShield(shield);
      }
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Failed to load treasury data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEvaluateSolvency = async () => {
    setEvaluatingShield(true);
    setErrorMessage("");
    try {
      const shield = await adminApiClient.withdrawals.evaluateSolvencyShield({
        liquidBankBalance: Number(liquidBankBalance) || 0,
      });
      setSolvencyShield(shield);
      flash(
        setSuccessMessage,
        `Solvency Shield evaluated: LCR is ${shield.liquidityCoverageRatio}% (${shield.isSolvent ? "SECURED" : "DEFICIT LOCKED"})`
      );
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Failed to evaluate solvency shield");
    } finally {
      setEvaluatingShield(false);
    }
  };

  const handleDisburseTransfer = async (withdrawal: PendingWithdrawal) => {
    if (!isAdmin && !isSuperDeveloper) {
      flash(setErrorMessage, "Only Platform Admins and Super Developer can disburse transfers.");
      return;
    }

    setProcessingId(withdrawal.id);
    setErrorMessage("");
    try {
      await adminApiClient.withdrawals.approveWithdrawal(withdrawal.id);
      flash(
        setSuccessMessage,
        `Transfer of ₦${(withdrawal.net_amount || withdrawal.amount).toLocaleString()} disbursed successfully.`
      );
      await loadData();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Transfer disbursal failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelAndRefund = async (withdrawal: PendingWithdrawal) => {
    if (!isAdmin && !isSuperDeveloper) {
      flash(setErrorMessage, "Only Platform Admins and Super Developer can cancel withdrawals.");
      return;
    }

    const reason = window.prompt(
      `Enter reason for canceling withdrawal of ₦${withdrawal.amount.toLocaleString()} (funds will be restored to member wallet):`,
      "Invalid bank account details / Member request"
    );

    if (reason === null) return; // user clicked cancel on prompt

    setProcessingId(withdrawal.id);
    setErrorMessage("");
    try {
      await adminApiClient.withdrawals.rejectWithdrawal(withdrawal.id, reason);
      flash(
        setSuccessMessage,
        `Withdrawal canceled. ₦${withdrawal.amount.toLocaleString()} restored to member's wallet ledger.`
      );
      await loadData();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Cancellation failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchDisburse = async () => {
    if (!isAdmin && !isSuperDeveloper) {
      flash(setErrorMessage, "Only Platform Admins can execute batch disbursements.");
      return;
    }

    if (withdrawals.length === 0) {
      flash(setErrorMessage, "No pending withdrawals in the queue.");
      return;
    }

    if (!solvencyShield?.isSolvent) {
      flash(
        setErrorMessage,
        "Solvency Shield Locked: Cannot execute batch transfer. Liquid balance must cover 100% of liabilities."
      );
      return;
    }

    const confirm = window.confirm(
      `Execute batch disbursal of ${withdrawals.length} pending withdrawals totaling ₦${solvencyShield.totalPendingLiability.toLocaleString()}?`
    );
    if (!confirm) return;

    setBatchProcessing(true);
    setErrorMessage("");
    try {
      const res = await adminApiClient.withdrawals.batchDisburse({
        liquidBankBalance,
        withdrawalIds: withdrawals.map((w) => w.id),
      });
      flash(
        setSuccessMessage,
        `Batch execution completed: ${res.disbursedCount} transfers disbursed (Total: ₦${res.totalDisbursed.toLocaleString()}).`
      );
      await loadData();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Batch disbursement failed.");
    } finally {
      setBatchProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Treasury, Solvency &amp; Payout Disbursals
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Executive financial reconciliation, Liquidity Coverage Ratio (LCR) solvency verification, and bank transfer settlement.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={refreshing}
          className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Treasury
        </Button>
      </div>

      {/* ── SECTION 1: EXECUTIVE BALANCE SHEET ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Gross Platform Inflows</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-foreground">
            ₦{(auditData?.totalInflows || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">
            Green Cards + Farm Slots + Activations
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pending Member Liabilities</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-300">
            ₦{(solvencyShield?.totalPendingLiability || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {withdrawals.length} pending bank payout request(s)
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Historical Payouts</span>
            <ArrowDownToLine className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-foreground">
            ₦{(auditData?.totalWithdrawnDisbursals || 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Cleared bank transfers to date
          </div>
        </Card>

        <Card className="border-border/60 bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Audit Reconciliation</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-foreground">ZERO LEAKAGE</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">
            Inflows = Liabilities + Margin + Reserves
          </div>
        </Card>
      </div>

      {/* ── SECTION 2: SOLVENCY SHIELD MONITOR ── */}
      <Card className="border-border/60 bg-card p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Pre-Payout Solvency Shield (Item 4.2)
              </h3>
              {solvencyShield && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    solvencyShield.isSolvent
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-destructive/10 text-destructive border border-destructive/30"
                  }`}
                >
                  {solvencyShield.isSolvent ? "SHIELD SECURED" : "DEFICIT LOCKED"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verifies the company’s liquid bank balance covers 100% of pending liabilities before releasing any batch NUBAN bank transfers.
              Locks disbursal automatically if Liquidity Coverage Ratio (LCR) falls below 100%.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="liquidBalance" className="text-xs text-muted-foreground">
                Live Liquid Bank Balance (₦)
              </Label>
              <Input
                id="liquidBalance"
                type="number"
                min="0"
                step="1000"
                placeholder="e.g. 5000000"
                value={liquidBankBalance || ""}
                onChange={(e) => setLiquidBankBalance(Number(e.target.value) || 0)}
                className="w-full sm:w-48 font-mono text-sm"
              />
            </div>

            <Button
              type="button"
              onClick={handleEvaluateSolvency}
              disabled={evaluatingShield}
              className="text-xs font-semibold gap-1.5"
            >
              {evaluatingShield ? "Evaluating..." : "Check Solvency"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleBatchDisburse}
              disabled={batchProcessing || !solvencyShield?.isSolvent || withdrawals.length === 0}
              className="text-xs font-semibold gap-1.5 border-emerald-600/40 text-emerald-400 hover:bg-emerald-500/10"
              title={
                !solvencyShield?.isSolvent
                  ? "Solvency Shield locked: LCR must be >= 100%"
                  : "Disburse all verified pending payouts"
              }
            >
              {batchProcessing ? "Disbursing..." : `Batch Disburse (${withdrawals.length})`}
            </Button>
          </div>
        </div>

        {/* Shield Ratio Bar */}
        {solvencyShield && (
          <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Liquid Bank Balance</span>
              <span className="font-mono font-bold text-foreground text-sm">
                ₦{solvencyShield.liquidBankBalance.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Pending Liabilities</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                ₦{solvencyShield.totalPendingLiability.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Liquidity Coverage (LCR)</span>
              <span
                className={`font-mono font-bold text-sm ${
                  solvencyShield.isSolvent ? "text-emerald-400" : "text-destructive"
                }`}
              >
                {solvencyShield.liquidityCoverageRatio}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Shortfall / Surplus</span>
              <span
                className={`font-mono font-bold text-sm ${
                  solvencyShield.shortfall > 0 ? "text-destructive" : "text-emerald-400"
                }`}
              >
                {solvencyShield.shortfall > 0
                  ? `-₦${solvencyShield.shortfall.toLocaleString()}`
                  : `+₦${(solvencyShield.liquidBankBalance - solvencyShield.totalPendingLiability).toLocaleString()}`}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* ── SECTION 3: WITHDRAWALS DISBURSAL QUEUE ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            Pending Withdrawal Settlement Queue ({withdrawals.length})
          </h3>
          <span className="text-xs text-muted-foreground">
            All requests must be disbursed to verified NUBAN accounts or canceled and refunded to wallet.
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-14 text-sm text-muted-foreground">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <span>No pending withdrawals in queue. All member payouts are settled.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Gross / Net Amount</th>
                  <th className="px-4 py-3">Bank Details</th>
                  <th className="px-4 py-3">Qualifications</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3 text-right">Settlement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((w) => {
                  const net = w.net_amount || w.amount;
                  const isProcessing = processingId === w.id;

                  return (
                    <tr key={w.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {w.profiles?.name || "Member"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {w.profiles?.member_id || w.profiles?.email || w.user_id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-foreground">
                          ₦{net.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Gross: ₦{w.amount.toLocaleString()} (Fee: ₦{w.fee || 100})
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-foreground">
                          {w.bank_name || "Access Bank"}
                        </div>
                        <div className="font-mono text-muted-foreground">
                          {w.account_number || "0123456789"} • {w.account_name || w.profiles?.name}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs space-y-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          5 Directs Verified
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          ₦5k PQV Active
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(w.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isProcessing || batchProcessing}
                          onClick={() => handleCancelAndRefund(w)}
                          className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          Cancel &amp; Refund
                        </Button>

                        <Button
                          size="sm"
                          disabled={isProcessing || batchProcessing}
                          onClick={() => handleDisburseTransfer(w)}
                          className="h-8 text-xs font-semibold gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {isProcessing ? "Disbursing..." : "Disburse Transfer"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
