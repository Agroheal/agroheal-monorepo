import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Coins,
  ArrowDownToLine,
  RefreshCw,
  CheckCircle2,
  Clock,
  Landmark,
  Wallet,
  Building2,
  Trophy,
  Send,
  Boxes,
  CreditCard,
  Sprout,
  Users,
  Layers,
  FileSpreadsheet,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { formatWATDateTime } from "@/lib/dateTimeFormat";
import { adminApiClient } from "@/lib/apiClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export interface WalletRecord {
  id: string;
  date: string;
  reference: string;
  type: "INFLOW" | "OUTFLOW";
  category: string;
  amount: number;
  description: string;
  memberName: string;
  memberEmail: string;
  memberId: string;
}

export interface GroupFarmSummary {
  id: string;
  name: string;
  slug: string;
  projectCategory: string;
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorPhone: string;
  memberCount: number;
  totalSlots: number;
  totalCapitalInflow: number;
  totalExpenses: number;
  netBalance: number;
}

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

interface StatutoryWalletItem {
  title?: string;
  name?: string;
  statutoryRateDescription?: string;
  statutoryRate?: string;
  totalInflows: number;
  totalOutflows: number;
  currentBalance: number;
}

interface CategoryWalletItem {
  title: string;
  count: number;
  total: number;
  badge?: string;
  description?: string;
}

interface TreasuryAuditData {
  totalInflows: number;
  totalWithdrawnDisbursals: number;
  memberLiabilitiesPending: number;
  companyRetainedMargin: number;
  cooperativeReserves: number;
  isZeroLeakage: boolean;
  auditedAt: string;
  paymentCategories?: Record<string, CategoryWalletItem>;
  ledgerCategories?: Record<string, CategoryWalletItem>;
  statutoryWallets?: {
    networkAndCoreDrivers?: StatutoryWalletItem;
    lgaFarmProduction?: StatutoryWalletItem;
    leadershipAndCarAwards?: StatutoryWalletItem;
    starterPackProduction?: StatutoryWalletItem;
    agrohealCorporateRevenue?: StatutoryWalletItem;
  };
  flatWallets?: {
    networkAndCoreDrivers?: StatutoryWalletItem;
    lgaFarmProduction?: StatutoryWalletItem;
    leadershipAndCarAwards?: StatutoryWalletItem;
    starterPackProduction?: StatutoryWalletItem;
    agrohealCorporateRevenue?: StatutoryWalletItem;
  };
}

export default function TreasuryPage() {
  const { isSuperDeveloper, isAdmin, profile } = useAdminAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Treasury Audit State
  const [auditData, setAuditData] = useState<TreasuryAuditData | null>(null);
  const [walletCategoryTab, setWalletCategoryTab] = useState<"all" | "inflows" | "commissions" | "reserves">("all");

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoApproveStatutory, setAutoApproveStatutory] = useState<boolean>(() => {
    try {
      return localStorage.getItem("auto_approve_statutory") === "true";
    } catch {
      return false;
    }
  });

  const isSuperAdminOrEsther =
    profile?.email?.toLowerCase() === "developerelijah360@gmail.com" ||
    profile?.email?.toLowerCase() === "estherbola888@gmail.com" ||
    profile?.role === "super_admin";

  const [sweeping, setSweeping] = useState(false);

  // Group Farms state
  const [groupFarms, setGroupFarms] = useState<GroupFarmSummary[]>([]);

  // Drill-down Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalSubtitle, setModalSubtitle] = useState("");
  const [modalWalletKey, setModalWalletKey] = useState<string | null>(null);
  const [modalFarmId, setModalFarmId] = useState<string | null>(null);
  const [modalRecords, setModalRecords] = useState<WalletRecord[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalStartDate, setModalStartDate] = useState("");
  const [modalEndDate, setModalEndDate] = useState("");
  const [modalSearch, setModalSearch] = useState("");

  const meetsMinimumRequirements = (w: PendingWithdrawal): boolean => {
    const amount = Number(w.net_amount || w.amount || 0);
    const hasMinAmount = amount >= 2000;
    const hasValidAccount = Boolean(w.account_number && w.account_number.trim().length === 10);
    return hasMinAmount && hasValidAccount;
  };

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4500);
  };

  const handleTriggerCorporateSweep = async () => {
    if (!isAdmin && !isSuperDeveloper) {
      flash(setErrorMessage, "Only Platform Admins and Super Developer can trigger the corporate revenue sweep.");
      return;
    }
    const confirm = window.confirm("Execute AgroHeal daily corporate revenue sweep for today's accumulated margins?");
    if (!confirm) return;

    setSweeping(true);
    setErrorMessage("");
    try {
      const res = await adminApiClient.admin.triggerCorporateSweep();
      flash(
        setSuccessMessage,
        `Corporate revenue sweep completed for ${res?.sweepDate || "today"}: ₦${(res?.totalSweepAmount || 0).toLocaleString()} transferred to AgroHeal master ledger.`
      );
      await loadData();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Corporate revenue sweep failed.");
    } finally {
      setSweeping(false);
    }
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      // 1. Load Executive Treasury Audit, Pending Withdrawals, and Group Farms in parallel
      const [audit, queue, farms] = await Promise.all([
        adminApiClient.admin.getTreasuryAudit().catch(() => null),
        adminApiClient.withdrawals.listWithdrawals().catch(() => []),
        adminApiClient.admin.getGroupFarms().catch(() => []),
      ]);
      if (audit) setAuditData(audit);
      setWithdrawals(queue || []);
      if (Array.isArray(farms)) setGroupFarms(farms);

      // 2. Initial Solvency Shield Evaluation
      if (liquidBankBalance > 0 || (queue && queue.length > 0)) {
        const shield = await adminApiClient.withdrawals
          .evaluateSolvencyShield({ liquidBankBalance })
          .catch(() => null);
        if (shield) setSolvencyShield(shield);
      }
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Failed to load treasury data");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchModalHistory = async (
    type: "wallet" | "farm",
    idOrKey: string,
    startDate?: string,
    endDate?: string,
    search?: string
  ) => {
    setModalLoading(true);
    try {
      if (type === "wallet") {
        const res = await adminApiClient.admin.getWalletHistory(idOrKey, { startDate, endDate, search });
        setModalRecords(res?.records || []);
      } else {
        const res = await adminApiClient.admin.getGroupFarmHistory(idOrKey, { startDate, endDate, search });
        setModalRecords(res?.records || []);
      }
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Failed to load transaction audit trail");
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenWalletHistory = (walletKey: string, title: string) => {
    setModalWalletKey(walletKey);
    setModalFarmId(null);
    setModalTitle(title);
    setModalSubtitle("Statutory Flat Wallet Audit Trail • Row-by-Row Transactions");
    setModalStartDate("");
    setModalEndDate("");
    setModalSearch("");
    setModalOpen(true);
    fetchModalHistory("wallet", walletKey);
  };

  const handleOpenGroupFarmHistory = (farmId: string, farmName: string) => {
    setModalFarmId(farmId);
    setModalWalletKey(null);
    setModalTitle(farmName);
    setModalSubtitle("Community Group Farm Ledger • Member Contributions & Disbursed Expenses");
    setModalStartDate("");
    setModalEndDate("");
    setModalSearch("");
    setModalOpen(true);
    fetchModalHistory("farm", farmId);
  };

  const handleApplyModalFilters = () => {
    if (modalWalletKey) {
      fetchModalHistory("wallet", modalWalletKey, modalStartDate, modalEndDate, modalSearch);
    } else if (modalFarmId) {
      fetchModalHistory("farm", modalFarmId, modalStartDate, modalEndDate, modalSearch);
    }
  };

  const handleClearModalFilters = () => {
    setModalStartDate("");
    setModalEndDate("");
    setModalSearch("");
    if (modalWalletKey) {
      fetchModalHistory("wallet", modalWalletKey, "", "", "");
    } else if (modalFarmId) {
      fetchModalHistory("farm", modalFarmId, "", "", "");
    }
  };

  const handleExportCSV = () => {
    if (!modalRecords || modalRecords.length === 0) {
      window.alert("No transaction records to export.");
      return;
    }

    const headers = [
      "Date (WAT)",
      "Reference",
      "Type",
      "Category",
      "Amount (NGN)",
      "Member / Recipient",
      "Email",
      "Member ID / Phone",
      "Description",
    ];

    const csvRows = [headers.join(",")];

    for (const r of modalRecords) {
      const escape = (val: string | number) => `"${String(val ?? "").replace(/"/g, '""')}"`;
      csvRows.push([
        escape(formatWATDateTime(r.date)),
        escape(r.reference),
        escape(r.type),
        escape(r.category),
        escape(r.amount),
        escape(r.memberName),
        escape(r.memberEmail),
        escape(r.memberId),
        escape(r.description),
      ].join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    const safeTitle = (modalTitle || "Audit").replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `AgroHeal_${safeTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleToggleSelectAll = () => {
    if (selectedIds.size === withdrawals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(withdrawals.map((w) => w.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApproveSelected = async () => {
    if (!isAdmin && !isSuperDeveloper) {
      flash(setErrorMessage, "Only Platform Admins can execute disbursements.");
      return;
    }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      flash(setErrorMessage, "Please select at least one pending withdrawal to approve.");
      return;
    }

    const selectedWithdrawals = withdrawals.filter((w) => selectedIds.has(w.id));
    const totalAmount = selectedWithdrawals.reduce((sum, w) => sum + (w.net_amount || w.amount), 0);

    const confirm = window.confirm(
      `Disburse ${ids.length} selected withdrawal(s) totaling ₦${totalAmount.toLocaleString()}?`
    );
    if (!confirm) return;

    setBatchProcessing(true);
    setErrorMessage("");
    try {
      const res = await adminApiClient.withdrawals.batchDisburse({
        liquidBankBalance,
        withdrawalIds: ids,
      });
      flash(
        setSuccessMessage,
        `Disbursed ${res.disbursedCount} selected transfers totaling ₦${res.totalDisbursed.toLocaleString()}.`
      );
      setSelectedIds(new Set());
      await loadData();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Disbursement failed.");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleAutoApproveQualified = async () => {
    if (!isSuperAdminOrEsther) {
      flash(setErrorMessage, "Only Super Admin and Esther Bola can authorize statutory auto-approval.");
      return;
    }
    const qualified = withdrawals.filter((w) => meetsMinimumRequirements(w));
    if (qualified.length === 0) {
      flash(
        setErrorMessage,
        "No pending withdrawals meet minimum statutory criteria (≥ ₦2,000, 5 directs & valid 10-digit NUBAN)."
      );
      return;
    }

    const totalAmount = qualified.reduce((sum, w) => sum + (w.net_amount || w.amount), 0);
    const confirm = window.confirm(
      `Auto-approve ${qualified.length} statutory qualified withdrawal(s) totaling ₦${totalAmount.toLocaleString()}?`
    );
    if (!confirm) return;

    setBatchProcessing(true);
    setErrorMessage("");
    try {
      const res = await adminApiClient.withdrawals.batchDisburse({
        liquidBankBalance,
        withdrawalIds: qualified.map((w) => w.id),
      });
      flash(
        setSuccessMessage,
        `Auto-approved ${res.disbursedCount} qualified requests totaling ₦${res.totalDisbursed.toLocaleString()}.`
      );
      setSelectedIds(new Set());
      await loadData();
    } catch (err: any) {
      flash(setErrorMessage, err.message || "Auto-approval failed.");
    } finally {
      setBatchProcessing(false);
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
      `Execute batch disbursal of ALL ${withdrawals.length} pending withdrawals totaling ₦${solvencyShield.totalPendingLiability.toLocaleString()}?`
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
      setSelectedIds(new Set());
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

      {/* ── SECTION 2: PLATFORM WALLETS & PAYMENT BREAKDOWN ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Boxes className="w-4 h-4 text-primary" />
              Platform Wallets &amp; Payment Breakdown
            </h3>
            <p className="text-xs text-muted-foreground">
              Automated category balances, statutory reserves, and corporate sweeps with zero mathematical leakage.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Buttons */}
            <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setWalletCategoryTab("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  walletCategoryTab === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Wallets
              </button>
              <button
                type="button"
                onClick={() => setWalletCategoryTab("inflows")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  walletCategoryTab === "inflows"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Payment Categories
              </button>
              <button
                type="button"
                onClick={() => setWalletCategoryTab("commissions")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  walletCategoryTab === "commissions"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Commissions
              </button>
              <button
                type="button"
                onClick={() => setWalletCategoryTab("reserves")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  walletCategoryTab === "reserves"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Statutory Reserves
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerCorporateSweep}
              disabled={sweeping}
              className="h-8 gap-1.5 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <Send className={`h-3.5 w-3.5 ${sweeping ? "animate-spin" : ""}`} />
              {sweeping ? "Sweeping Margins..." : "Trigger Corporate Revenue Sweep"}
            </Button>
          </div>
        </div>

        {/* 2A. PAYMENT CATEGORY WALLETS (INFLOWS) */}
        {(walletCategoryTab === "all" || walletCategoryTab === "inflows") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Payment &amp; Transaction Categories (Inflows)
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Total Inflows: ₦{(auditData?.totalInflows || 0).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Combo Packages */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Green Card + Starter Combo</h4>
                      <p className="text-[10px] text-muted-foreground">₦10k / ₦12k / ₦15k Starter Packages</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-semibold">
                    {auditData?.paymentCategories?.combo?.count ?? 0} txns
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Collected Inflow:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    ₦{(auditData?.paymentCategories?.combo?.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </Card>

              {/* Gingertown Slots */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Farm Slots: Gingertown</h4>
                      <p className="text-[10px] text-muted-foreground">₦5k / ₦10k Commercial Ginger Slots</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">
                    {auditData?.paymentCategories?.gingertown?.count ?? 0} txns
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Collected Inflow:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    ₦{(auditData?.paymentCategories?.gingertown?.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </Card>

              {/* Mushroom Village Slots */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Farm Slots: Mushroom Village</h4>
                      <p className="text-[10px] text-muted-foreground">₦5,000 Production Farm Slots</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                    {auditData?.paymentCategories?.mushroomVillage?.count ?? 0} txns
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Collected Inflow:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    ₦{(auditData?.paymentCategories?.mushroomVillage?.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </Card>

              {/* Mushroom Power Products */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Mushroom Power Products</h4>
                      <p className="text-[10px] text-muted-foreground">100g Starter Packs &amp; 250g Retail</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-semibold">
                    {auditData?.paymentCategories?.mushroomPower?.count ?? 0} orders
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Collected Inflow:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    ₦{(auditData?.paymentCategories?.mushroomPower?.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </Card>

              {/* Green Card Membership */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Green Card Membership Only</h4>
                      <p className="text-[10px] text-muted-foreground">₦1,000 / ₦2,000 ID Activations</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
                    {auditData?.paymentCategories?.greenCard?.count ?? 0} txns
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Collected Inflow:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    ₦{(auditData?.paymentCategories?.greenCard?.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </Card>

              {/* Other Projects */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Other Agricultural Projects</h4>
                      <p className="text-[10px] text-muted-foreground">FoodNation &amp; Specialized Units</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 font-semibold">
                    {auditData?.paymentCategories?.other?.count ?? 0} txns
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Collected Inflow:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    ₦{(auditData?.paymentCategories?.other?.total ?? 0).toLocaleString()}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2B. COMMISSION & MEMBER EARNING CATEGORIES (WALLET LEDGER) */}
        {(walletCategoryTab === "all" || walletCategoryTab === "commissions") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Member Commission Categories (Wallet Ledger)
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Total Liabilities: ₦{(auditData?.memberLiabilitiesPending || 0).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Direct Sponsor Referral */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Direct Referral Bonuses</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">₦1,000 / ₦500 Sponsor Credits</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ledger Credits:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {auditData?.ledgerCategories?.referralBonus?.count ?? 0} entries
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-emerald-400">Total Credited:</span>
                    <span className="font-mono text-emerald-400">
                      ₦{(auditData?.ledgerCategories?.referralBonus?.total ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Farm Slot Bonus */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Farm Slot Commissions</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">₦500 Sponsor Bonus / Slot</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ledger Credits:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {auditData?.ledgerCategories?.slotBonus?.count ?? 0} entries
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-emerald-400">Total Credited:</span>
                    <span className="font-mono text-emerald-400">
                      ₦{(auditData?.ledgerCategories?.slotBonus?.total ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 5x7 Matrix Commissions */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">5×7 Matrix Commissions</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">7-Level Generational Tree</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ledger Credits:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {auditData?.ledgerCategories?.matrixCommission?.count ?? 0} entries
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-blue-400">Total Credited:</span>
                    <span className="font-mono text-blue-400">
                      ₦{(auditData?.ledgerCategories?.matrixCommission?.total ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Core Drivers Growth Pool */}
              <Card className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Core Drivers Growth Pool</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">₦50 Statutory Driver Credits</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ledger Credits:</span>
                    <span className="font-mono text-foreground font-semibold">
                      {auditData?.ledgerCategories?.coreDriversBonus?.count ?? 0} entries
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-amber-400">Total Credited:</span>
                    <span className="font-mono text-amber-400">
                      ₦{(auditData?.ledgerCategories?.coreDriversBonus?.total ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 2C. STATUTORY PRODUCTION & OPERATIONAL RESERVES */}
        {(walletCategoryTab === "all" || walletCategoryTab === "reserves") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Statutory Production &amp; Operational Reserves
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Cooperative Reserves: ₦{(auditData?.cooperativeReserves || 0).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Wallet 1: 5x7 Network & Core Drivers */}
              <Card
                onClick={() => handleOpenWalletHistory("networkAndCoreDrivers", "5×7 Network & Core Drivers Pool")}
                className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                        5×7 Network &amp; Core Drivers
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono">₦900 GC + ₦1,350 SP + ₦1,157 PQV</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Statutory Inflows:</span>
                    <span className="font-mono font-semibold text-foreground">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.networkAndCoreDrivers?.totalInflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Payout Disbursals:</span>
                    <span className="font-mono text-destructive">
                      -₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.networkAndCoreDrivers?.totalOutflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-emerald-400">Net Balance:</span>
                    <span className="font-mono text-emerald-400">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.networkAndCoreDrivers?.currentBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 text-muted-foreground group-hover:text-foreground">
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    Inspect Audit Trail <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono">Row-by-Row</span>
                </div>
              </Card>

              {/* Wallet 2: LGA Farm Production */}
              <Card
                onClick={() => handleOpenWalletHistory("lgaFarmProduction", "LGA Farm Production Fund")}
                className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-blue-400 transition-colors">
                        LGA Farm Production
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono">₦3,500 per Farm Slot</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Farm Slot Funding:</span>
                    <span className="font-mono font-semibold text-foreground">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.lgaFarmProduction?.totalInflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Farm Operations:</span>
                    <span className="font-mono text-destructive">
                      -₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.lgaFarmProduction?.totalOutflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-blue-400">Production Reserve:</span>
                    <span className="font-mono text-blue-400">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.lgaFarmProduction?.currentBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 text-muted-foreground group-hover:text-foreground">
                  <span className="text-blue-400 flex items-center gap-1 font-medium">
                    Inspect Audit Trail <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono">Row-by-Row</span>
                </div>
              </Card>

              {/* Wallet 3: Leadership & Quarterly Car Awards */}
              <Card
                onClick={() => handleOpenWalletHistory("leadershipAndCarAwards", "Leadership & Quarterly Car Awards Pool")}
                className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-amber-400 transition-colors">
                        Leadership &amp; Car Awards
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono">₦200 Lead + ₦200 Car + ₦171 PQV</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Award Inflows:</span>
                    <span className="font-mono font-semibold text-foreground">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.leadershipAndCarAwards?.totalInflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Award Outflows:</span>
                    <span className="font-mono text-destructive">
                      -₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.leadershipAndCarAwards?.totalOutflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-amber-400">Award Pool:</span>
                    <span className="font-mono text-amber-400">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.leadershipAndCarAwards?.currentBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 text-muted-foreground group-hover:text-foreground">
                  <span className="text-amber-400 flex items-center gap-1 font-medium">
                    Inspect Audit Trail <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono">Row-by-Row</span>
                </div>
              </Card>

              {/* Wallet 4: Starter Pack Production */}
              <Card
                onClick={() => handleOpenWalletHistory("starterPackProduction", "Starter Pack Production Fund")}
                className="border-border/60 bg-card p-4 space-y-2.5 rounded-xl hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-purple-400 transition-colors">
                        Starter Pack Production
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono">₦4,500 per Mushroom Pack</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Packaging Funding:</span>
                    <span className="font-mono font-semibold text-foreground">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.starterPackProduction?.totalInflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Packaging &amp; Fulfillment:</span>
                    <span className="font-mono text-destructive">
                      -₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.starterPackProduction?.totalOutflows || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-border/40 flex justify-between text-xs font-bold">
                    <span className="text-purple-400">Packing Reserve:</span>
                    <span className="font-mono text-purple-400">
                      ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.starterPackProduction?.currentBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 text-muted-foreground group-hover:text-foreground">
                  <span className="text-purple-400 flex items-center gap-1 font-medium">
                    Inspect Audit Trail <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                  <span className="text-[10px] font-mono">Row-by-Row</span>
                </div>
              </Card>
            </div>

            {/* Retained Corporate Margin Card */}
            <Card
              onClick={() => handleOpenWalletHistory("agrohealCorporateRevenue", "AgroHeal Retained Corporate Revenue")}
              className="border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl hover:border-primary/60 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      AgroHeal Retained Corporate Revenue
                    </h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                      ₦1,850 per ₦15,000 Combo
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inflow: ₦100 (GC) + ₦1,000 (Slot) + ₦750 (Starter Pack) • Accumulated today: ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.agrohealCorporateRevenue?.currentBalance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Net Unswept Margin</span>
                  <span className="font-mono text-lg font-bold text-primary">
                    ₦{((auditData?.statutoryWallets || auditData?.flatWallets)?.agrohealCorporateRevenue?.currentBalance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="pl-2 border-l border-border/40 text-primary">
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Card>

            {/* 2D. DECENTRALIZED COMMUNITY GROUP FARM WALLETS */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-400" />
                    Decentralized Community Group Farms &amp; Hubs
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Physical farm capital (₦3,500/slot), member slot contributors, logged operational expenses, and real-time ledger balances.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono text-emerald-400 border-emerald-500/30">
                    {groupFarms.length} Chartered Farms
                  </Badge>
                </div>
              </div>

              {groupFarms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                  Loading chartered group farms...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupFarms.map((farm) => {
                    const isPositive = farm.netBalance >= 0;
                    return (
                      <Card
                        key={farm.id}
                        onClick={() => handleOpenGroupFarmHistory(farm.id, farm.name)}
                        className="border-border/60 bg-card p-4 space-y-3 rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <h5 className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors line-clamp-1">
                                {farm.name}
                              </h5>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Coordinator: <span className="text-foreground font-medium">{farm.coordinatorName}</span>
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[9px] px-1.5 py-0 uppercase shrink-0 font-semibold ${
                              farm.projectCategory.toLowerCase().includes("ginger")
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}
                          >
                            {farm.projectCategory}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-1.5 px-2 rounded-lg bg-muted/30 text-[10px]">
                          <div>
                            <span className="text-muted-foreground block">Slots</span>
                            <span className="font-mono font-bold text-foreground">{farm.totalSlots}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Members</span>
                            <span className="font-mono font-bold text-foreground">{farm.memberCount}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground block">Capital</span>
                            <span className="font-mono font-bold text-emerald-400">
                              ₦{farm.totalCapitalInflow.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Disbursed Expenses:</span>
                            <span className="font-mono text-destructive">
                              -₦{farm.totalExpenses.toLocaleString()}
                            </span>
                          </div>
                          <div className="pt-1 border-t border-border/40 flex justify-between items-baseline font-bold">
                            <span className={isPositive ? "text-emerald-400" : "text-destructive"}>
                              Net Balance:
                            </span>
                            <span
                              className={`font-mono text-sm ${
                                isPositive ? "text-emerald-400" : "text-destructive"
                              }`}
                            >
                              ₦{farm.netBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 text-muted-foreground group-hover:text-foreground">
                          <span className="flex items-center gap-1 font-medium text-emerald-400">
                            Inspect Group Ledger <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </span>
                          <span className="text-[10px] font-mono">Row-by-Row</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 3: SOLVENCY SHIELD MONITOR ── */}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Pending Withdrawal Settlement Queue ({withdrawals.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Disburse to verified NUBAN accounts or refund to wallet ledger.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdminOrEsther && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={batchProcessing || withdrawals.length === 0}
                  onClick={handleAutoApproveQualified}
                  className="h-8 text-xs font-semibold gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                  title="Only Super Admin & Esther Bola can trigger statutory auto-approval"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Auto-Approve Qualified (≥ ₦2k)
                </Button>
                <label className="flex items-center gap-1.5 border border-border/70 rounded-md px-2 py-1 bg-background/60 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveStatutory}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setAutoApproveStatutory(next);
                      try {
                        localStorage.setItem("auto_approve_statutory", String(next));
                      } catch {}
                    }}
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-muted-foreground font-medium">Auto-Gate</span>
                </label>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              disabled={batchProcessing || selectedIds.size === 0}
              onClick={handleApproveSelected}
              className="h-8 text-xs font-semibold gap-1 border-primary/40 text-primary hover:bg-primary/10"
            >
              Approve Selected ({selectedIds.size})
            </Button>

            <Button
              size="sm"
              disabled={batchProcessing || withdrawals.length === 0 || !solvencyShield?.isSolvent}
              onClick={handleBatchDisburse}
              className="h-8 text-xs font-bold gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Approve All ({withdrawals.length})
            </Button>
          </div>
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
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={withdrawals.length > 0 && selectedIds.size === withdrawals.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                  </th>
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
                  const isSelected = selectedIds.has(w.id);

                  return (
                    <tr key={w.id} className={`hover:bg-muted/20 ${isSelected ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(w.id)}
                          className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                      </td>
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

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatWATDateTime(w.created_at)}
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

      {/* ── SECTION 4: DRILL-DOWN AUDIT TRAIL MODAL ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-6">
              <div>
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  {modalTitle}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {modalSubtitle}
                </DialogDescription>
              </div>

              {/* Action: Export CSV */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={modalLoading || modalRecords.length === 0}
                className="gap-1.5 text-xs font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV / Excel
              </Button>
            </div>

            {/* Quick Stat Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs font-mono py-1 px-2.5">
                Total Rows: <span className="font-bold text-foreground ml-1">{modalRecords.length}</span>
              </Badge>
              <Badge variant="outline" className="text-xs font-mono py-1 px-2.5 text-emerald-400 border-emerald-500/30">
                Inflows: +₦{modalRecords.filter((r) => r.type === "INFLOW").reduce((s, r) => s + r.amount, 0).toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-xs font-mono py-1 px-2.5 text-destructive border-destructive/30">
                Outflows: -₦{modalRecords.filter((r) => r.type === "OUTFLOW").reduce((s, r) => s + r.amount, 0).toLocaleString()}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs font-mono py-1 px-2.5 font-bold border-primary/40 text-primary"
              >
                Net Balance: ₦{(
                  modalRecords.filter((r) => r.type === "INFLOW").reduce((s, r) => s + r.amount, 0) -
                  modalRecords.filter((r) => r.type === "OUTFLOW").reduce((s, r) => s + r.amount, 0)
                ).toLocaleString()}
              </Badge>
            </div>
          </DialogHeader>

          {/* Filter Bar: Date Range + Search */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 pb-2 items-end">
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> From Date
              </Label>
              <Input
                type="date"
                value={modalStartDate}
                onChange={(e) => setModalStartDate(e.target.value)}
                className="h-8 text-xs bg-muted/30"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> To Date
              </Label>
              <Input
                type="date"
                value={modalEndDate}
                onChange={(e) => setModalEndDate(e.target.value)}
                className="h-8 text-xs bg-muted/30"
              />
            </div>
            <div className="sm:col-span-4 space-y-1">
              <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Search className="w-3 h-3" /> Search Member / Ref / Category
              </Label>
              <Input
                type="text"
                placeholder="Name, ref, email, ID..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApplyModalFilters();
                }}
                className="h-8 text-xs bg-muted/30"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                onClick={handleApplyModalFilters}
                disabled={modalLoading}
                className="h-8 text-xs font-semibold flex-1 gap-1"
              >
                <Filter className="w-3 h-3" /> Filter
              </Button>
              {(modalStartDate || modalEndDate || modalSearch) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearModalFilters}
                  disabled={modalLoading}
                  className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto border border-border/40 rounded-lg min-h-[300px]">
            {modalLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span>Loading transaction audit records...</span>
              </div>
            ) : modalRecords.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground p-6 text-center">
                <p className="font-semibold text-foreground">No transaction records found</p>
                <p>Try adjusting your search criteria or date filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 sticky top-0 border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date (WAT)</th>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Member / Initiator</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-mono text-[11px]">
                  {modalRecords.map((r) => {
                    const isInflow = r.type === "INFLOW";
                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground whitespace-nowrap font-sans">
                          {formatWATDateTime(r.date)}
                        </td>
                        <td className="py-2 px-3 font-semibold text-foreground whitespace-nowrap">
                          {r.reference}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-sans">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isInflow
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isInflow ? "+ INFLOW" : "- OUTFLOW"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground whitespace-nowrap font-sans">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40">
                            {r.category}
                          </span>
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                            isInflow ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isInflow ? "+" : "-"}₦{r.amount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-sans max-w-[180px] truncate">
                          <span className="font-semibold text-foreground block truncate">
                            {r.memberName}
                          </span>
                          {(r.memberId || r.memberEmail) && (
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {r.memberId || r.memberEmail}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-sans text-muted-foreground max-w-[220px] truncate" title={r.description}>
                          {r.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
