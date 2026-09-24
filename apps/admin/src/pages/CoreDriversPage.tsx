import { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Award,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface CoreDriver {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  sharePerCard: number;
  profileId?: string;
  memberId?: string;
  totalCardsAttributed: number;
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  isEligibleForWithdrawal: boolean;
  portalAccessEnabled: boolean;
}

const STATIC_CORE_DRIVERS = [
  {
    id: "driver-1",
    name: "Elijah Ajibade",
    email: "developerelijah360@gmail.com",
    roleTitle: "Chief Systems Architect & Co-founder",
    sharePerCard: 50,
  },
  {
    id: "driver-2",
    name: "Esther Adetayo",
    email: "estherbola888@gmail.com",
    roleTitle: "Founder & Commercial Lead",
    sharePerCard: 50,
  },
  {
    id: "driver-3",
    name: "Taiwo Oluwadahunsola",
    email: "ifoodeconomy@gmail.com",
    roleTitle: "Core Operations Driver",
    sharePerCard: 50,
  },
  {
    id: "driver-4",
    name: "David Omokanye",
    email: "davidomokanye141@gmail.com",
    roleTitle: "Core Agronomy & Field Operations",
    sharePerCard: 50,
  },
  {
    id: "driver-5",
    name: "Fortune Etuk",
    email: "efortunefb@gmail.com",
    roleTitle: "Regional Expansion & Community Growth",
    sharePerCard: 50,
  },
  {
    id: "driver-6",
    name: "Tony Inyang",
    email: "tonyinyang118@gmail.com",
    roleTitle: "Institutional Partnerships & Enterprise",
    sharePerCard: 50,
  },
];

const MIN_WITHDRAWAL_THRESHOLD = 2000;

export default function CoreDriversPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeGreenCardsCount, setActiveGreenCardsCount] = useState(0);
  const [drivers, setDrivers] = useState<CoreDriver[]>([]);
  const [enabledEmails, setEnabledEmails] = useState<string[]>([]);
  const [selectedDriverForPayout, setSelectedDriverForPayout] = useState<CoreDriver | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get active green cards count
      const { count: greenCardsCount } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("plan", "green_card")
        .eq("status", "active");

      const totalCards = greenCardsCount || 0;
      setActiveGreenCardsCount(totalCards);

      // 2. Load driver portal access configuration from system_configs
      const { data: configRow } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "core_drivers_config")
        .maybeSingle();

      const configVal = configRow?.value || {};
      const allowedEmails: string[] = Array.isArray(configVal?.enabled_emails)
        ? configVal.enabled_emails
        : STATIC_CORE_DRIVERS.map((d) => d.email.toLowerCase());
      setEnabledEmails(allowedEmails);

      // 3. Fetch profiles for these emails to get actual IDs & member IDs
      const emails = STATIC_CORE_DRIVERS.map((d) => d.email.toLowerCase());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, member_id, wallet_balance")
        .in("email", emails);

      const profileMap = new Map((profiles || []).map((p) => [p.email?.toLowerCase(), p]));

      // 4. Fetch ledger entries for CORE_DRIVER_BONUS if table exists
      const { data: ledgerEntries } = await supabase
        .from("wallet_ledger")
        .select("user_id, amount, category, status")
        .eq("category", "CORE_DRIVER_BONUS");

      const ledgerMap = new Map<string, number>();
      (ledgerEntries || []).forEach((entry) => {
        if (entry.user_id) {
          const prev = ledgerMap.get(entry.user_id) || 0;
          ledgerMap.set(entry.user_id, prev + Number(entry.amount || 0));
        }
      });

      // 5. Build enriched driver list
      const enrichedDrivers: CoreDriver[] = STATIC_CORE_DRIVERS.map((driver) => {
        const prof = profileMap.get(driver.email.toLowerCase());
        const totalEarned = (prof?.id && ledgerMap.has(prof.id))
          ? (ledgerMap.get(prof.id) || 0)
          : totalCards * driver.sharePerCard;
        const totalWithdrawn = 0; // Can be wired to withdrawal table when ready
        const availableBalance = Number(prof?.wallet_balance ?? (totalEarned - totalWithdrawn));
        const isEligible = availableBalance >= MIN_WITHDRAWAL_THRESHOLD;
        const portalAccess = allowedEmails.includes(driver.email.toLowerCase());

        return {
          ...driver,
          profileId: prof?.id,
          memberId: prof?.member_id || "Pending Sync",
          totalCardsAttributed: totalCards,
          totalEarned,
          totalWithdrawn,
          availableBalance,
          isEligibleForWithdrawal: isEligible,
          portalAccessEnabled: portalAccess,
        };
      });

      setDrivers(enrichedDrivers);
    } catch (err: any) {
      console.error("Error loading Core Drivers data:", err);
      flash(setErrorMessage, `Failed to load Core Drivers data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAccess = async (driverEmail: string, currentStatus: boolean) => {
    const emailNorm = driverEmail.toLowerCase();
    let updated: string[];
    if (currentStatus) {
      updated = enabledEmails.filter((e) => e !== emailNorm);
    } else {
      updated = [...enabledEmails, emailNorm];
    }

    try {
      const { error } = await supabase.from("system_configs").upsert({
        key: "core_drivers_config",
        value: {
          enabled_emails: updated,
          updated_at: new Date().toISOString(),
        },
      });

      if (error) throw error;

      setEnabledEmails(updated);
      setDrivers((prev) =>
        prev.map((d) =>
          d.email.toLowerCase() === emailNorm
            ? { ...d, portalAccessEnabled: !currentStatus }
            : d
        )
      );

      flash(
        setSuccessMessage,
        `Portal access for ${driverEmail} ${!currentStatus ? "ENABLED" : "RESTRICTED"}`
      );
    } catch (err: any) {
      flash(setErrorMessage, `Failed to update access: ${err.message}`);
    }
  };

  const handleTriggerPayout = async () => {
    if (!selectedDriverForPayout) return;
    setIsProcessingPayout(true);
    try {
      // Record payout to ledger
      if (selectedDriverForPayout.profileId) {
        await supabase.from("wallet_ledger").insert([
          {
            user_id: selectedDriverForPayout.profileId,
            amount: payoutAmount,
            entry_type: "DEBIT",
            category: "WITHDRAWAL",
            status: "PENDING",
            description: `Core Driver Growth Bonus Payout to ${selectedDriverForPayout.name}`,
          },
        ]);
      }

      flash(
        setSuccessMessage,
        `Disbursement of ₦${payoutAmount.toLocaleString()} queued successfully for ${selectedDriverForPayout.name}!`
      );
      setSelectedDriverForPayout(null);
      loadData();
    } catch (err: any) {
      flash(setErrorMessage, `Payout failed: ${err.message}`);
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const totalPoolAccrued = activeGreenCardsCount * 300; // ₦300 pool (15% of ₦2,000)
  const totalPerDriverShare = activeGreenCardsCount * 50;

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Core Drivers Growth Hub
            </h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30">
              Super Admin View
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time tracking and allocation of the 15% Green Card Growth Pool (₦300/card split across 6 core driver seats).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <StatusBanner variant="success" message={successMessage} />
      <StatusBanner variant="error" message={errorMessage} />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Verified Green Cards"
          value={activeGreenCardsCount.toLocaleString()}
          footer="Ecosystem membership base"
          icon={ShieldCheck}
        />
        <StatCard
          label="Total Growth Pool Accrued"
          value={`₦${totalPoolAccrued.toLocaleString()}`}
          footer="₦300/card statutory pool (15%)"
          icon={TrendingUp}
        />
        <StatCard
          label="Per-Driver Allocation"
          value={`₦${totalPerDriverShare.toLocaleString()}`}
          footer="₦50/card for each of the 6 seats"
          icon={Award}
        />
        <StatCard
          label="Core Driver Seats"
          value={`${drivers.length} Active`}
          footer="Esther, Taiwo, David, Elijah, Fortune, Tony"
          icon={Users}
        />
      </div>

      {/* Roster & Distribution Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div>
            <h2 className="text-base font-semibold text-foreground">6 Core Drivers Roster & Balances</h2>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal threshold is ₦{MIN_WITHDRAWAL_THRESHOLD.toLocaleString()}. Toggle portal view to allow individual driver visibility.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search driver by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3">Core Driver</th>
                <th className="px-4 py-3">Role / Designation</th>
                <th className="px-4 py-3 text-right">Share / Card</th>
                <th className="px-4 py-3 text-right">Total Accrued</th>
                <th className="px-4 py-3 text-right">Available Balance</th>
                <th className="px-4 py-3 text-center">Eligibility</th>
                <th className="px-4 py-3 text-center">Portal Access</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground">{driver.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{driver.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-muted-foreground">{driver.roleTitle}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs">
                    ₦{driver.sharePerCard}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    ₦{driver.totalEarned.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold font-mono text-foreground">
                    ₦{driver.availableBalance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {driver.isEligibleForWithdrawal ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        &lt; ₦2k Threshold
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAccess(driver.email, driver.portalAccessEnabled)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                        driver.portalAccessEnabled
                          ? "bg-primary/15 text-primary hover:bg-primary/25"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {driver.portalAccessEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!driver.isEligibleForWithdrawal}
                      onClick={() => {
                        setSelectedDriverForPayout(driver);
                        setPayoutAmount(driver.availableBalance);
                      }}
                      className="text-xs h-8 gap-1 text-primary border-primary/30 hover:bg-primary/10 disabled:opacity-40"
                    >
                      Disburse
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Confirmation Modal */}
      {selectedDriverForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-foreground">Trigger Driver Payout</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriverForPayout(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="text-xs text-muted-foreground">Recipient</div>
                <div className="font-semibold text-foreground">{selectedDriverForPayout.name}</div>
                <div className="text-xs text-muted-foreground">{selectedDriverForPayout.email}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Disbursement Amount (₦)</label>
                <Input
                  type="number"
                  min={MIN_WITHDRAWAL_THRESHOLD}
                  max={selectedDriverForPayout.availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="font-mono text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Available: ₦{selectedDriverForPayout.availableBalance.toLocaleString()} (Min: ₦{MIN_WITHDRAWAL_THRESHOLD.toLocaleString()})
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This action queues a payout record in the platform wallet ledger and flags it for treasury disbursement.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDriverForPayout(null)}
                disabled={isProcessingPayout}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTriggerPayout}
                disabled={isProcessingPayout || payoutAmount < MIN_WITHDRAWAL_THRESHOLD}
                className="bg-primary text-primary-foreground"
              >
                {isProcessingPayout ? "Processing..." : `Confirm ₦${payoutAmount.toLocaleString()} Payout`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
