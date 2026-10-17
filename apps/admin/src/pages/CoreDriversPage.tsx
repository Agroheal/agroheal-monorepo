import { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Award,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LEGACY_CUTOFF_DATE } from "@shared/businessRules";

export interface CoreDriver {
  id: string;
  name: string;
  email: string;
  roleTitle?: string;
  driverType: "operational" | "finance_partner";
  sharePerCard: number;
  termNotice?: string;
  profileId?: string;
  memberId?: string;
  totalCardsAttributed: number;
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  isEligibleForWithdrawal: boolean;
  portalAccessEnabled: boolean;
  role?: string;
}

const STATIC_CORE_PARTICIPANTS = [
  {
    id: "driver-1",
    name: "Elijah Ajibade",
    email: "developerelijah360@gmail.com",
    roleTitle: "Co-Founder & Lead Developer",
    driverType: "operational" as const,
    sharePerCard: 50,
  },
  {
    id: "driver-2",
    name: "Esther Adetayo",
    email: "estherbola888@gmail.com",
    roleTitle: "Core Operations Driver",
    driverType: "operational" as const,
    sharePerCard: 50,
  },
  {
    id: "driver-3",
    name: "Taiwo Oluwadahunsola",
    email: "ifoodeconomy@gmail.com",
    roleTitle: "Core Operations Driver",
    driverType: "operational" as const,
    sharePerCard: 50,
  },
  {
    id: "driver-4",
    name: "David Omokanye",
    email: "davidomokanye141@gmail.com",
    roleTitle: "Core Operations Driver",
    driverType: "operational" as const,
    sharePerCard: 50,
  },
  {
    id: "driver-5",
    name: "Fortune Etuk",
    email: "efortunefb@gmail.com",
    roleTitle: "Core Operations Driver",
    driverType: "operational" as const,
    sharePerCard: 50,
  },
  {
    id: "driver-6",
    name: "Tony Inyang",
    email: "tonyinyang118@gmail.com",
    roleTitle: "Core Operations Driver",
    driverType: "operational" as const,
    sharePerCard: 50,
  },
  {
    id: "driver-7",
    name: "Nathaniel Omokanye",
    email: "gkygmr56@gmail.com",
    roleTitle: "Core Operations Driver",
    driverType: "operational" as const,
    sharePerCard: 50,
  },
  {
    id: "driver-8",
    name: "Juliana Chikaodi Obinwanne",
    email: "shekinahexcellency@gmail.com",
    roleTitle: "Core Operations Driver",
    driverType: "operational" as const,
    sharePerCard: 25,
    termNotice: "Commenced from Oct 1, 2026 Launch",
  },
  {
    id: "driver-9",
    name: "Oluwafemi Olaleye",
    email: "femmaleye@gmail.com",
    roleTitle: "Core Partner (Finance)",
    driverType: "finance_partner" as const,
    sharePerCard: 100,
    termNotice: "3-Year Statutory Term (Sept 27, 2026 - Sept 27, 2029)",
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

  const flash = (fn: (v: string) => void, text: string) => {
    fn(text);
    setTimeout(() => fn(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get active green cards count cut off from LEGACY_CUTOFF_DATE
      const { count: greenCardsCount } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("plan", "green_card")
        .eq("status", "active")
        .gte("created_at", LEGACY_CUTOFF_DATE);

      const { count: profGreenCardCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .or("is_green_card_holder.eq.true,has_greencard.eq.true")
        .gte("created_at", LEGACY_CUTOFF_DATE);

      const totalCards = Math.max(greenCardsCount || 0, profGreenCardCount || 0);
      setActiveGreenCardsCount(totalCards);

      // 2. Load driver portal access configuration from system_configs
      const { data: configRow } = await supabase
        .from("system_configs")
        .select("value")
        .eq("key", "core_drivers_config")
        .maybeSingle();

      const configVal = configRow?.value || {};
      // Portal access defaults only to explicit admin accounts; NEVER auto-enabled for all regular core drivers
      const allowedEmails: string[] = Array.isArray(configVal?.enabled_emails)
        ? configVal.enabled_emails.map((e: string) => e.toLowerCase())
        : ["developerelijah360@gmail.com", "estherbola888@gmail.com", "davidomokanye141@gmail.com"];
      setEnabledEmails(allowedEmails);

      // 3. Fetch profiles for these emails to get actual IDs, member IDs & roles
      const emails = STATIC_CORE_PARTICIPANTS.map((d) => d.email.toLowerCase());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, member_id, wallet_balance, role")
        .in("email", emails);

      const profileMap = new Map((profiles || []).map((p) => [p.email?.toLowerCase(), p]));
      const profileIds = (profiles || []).map((p) => p.id).filter(Boolean);

      // 4. Fetch ledger entries for CORE_DRIVER_BONUS
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

      // 5. Fetch withdrawals for these drivers
      const withdrawalMap = new Map<string, number>();
      if (profileIds.length > 0) {
        const { data: withdrawals } = await supabase
          .from("withdrawals")
          .select("user_id, amount, status")
          .in("user_id", profileIds)
          .in("status", ["completed", "approved", "pending"]);

        (withdrawals || []).forEach((w) => {
          if (w.user_id) {
            const prev = withdrawalMap.get(w.user_id) || 0;
            withdrawalMap.set(w.user_id, prev + Number(w.amount || 0));
          }
        });
      }

      // 6. Build enriched driver list
      const enrichedDrivers: CoreDriver[] = STATIC_CORE_PARTICIPANTS.map((driver) => {
        const prof = profileMap.get(driver.email.toLowerCase());
        const totalEarned = (prof?.id && ledgerMap.has(prof.id))
          ? (ledgerMap.get(prof.id) || 0)
          : 0;
        const totalWithdrawn = (prof?.id && withdrawalMap.has(prof.id))
          ? (withdrawalMap.get(prof.id) || 0)
          : 0;
        const availableBalance = Number(prof?.wallet_balance ?? Math.max(0, totalEarned - totalWithdrawn));
        const isEligible = availableBalance >= MIN_WITHDRAWAL_THRESHOLD;
        const isPlatformAdminUser = prof?.role === "admin" || prof?.role === "super_admin";
        const portalAccess = allowedEmails.includes(driver.email.toLowerCase()) || isPlatformAdminUser;

        return {
          ...driver,
          role: prof?.role,
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

  const totalOperationalAccrued = drivers
    .filter((d) => d.driverType === "operational")
    .reduce((sum, d) => sum + d.totalEarned, 0);
  const totalFinancePartnerAccrued = drivers
    .filter((d) => d.driverType === "finance_partner")
    .reduce((sum, d) => sum + d.totalEarned, 0);

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Core Drivers &amp; Growth Hub
            </h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30">
              Super Admin View
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time tracking of the Green Card Growth Pool (8 Operational Drivers + 1 Core Finance Partner @ ₦100/card).
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
          label="Operational Growth Pool"
          value={`₦${totalOperationalAccrued.toLocaleString()}`}
          footer="Accrued statutory operational pool"
          icon={TrendingUp}
        />
        <StatCard
          label="Finance Partner Allocation"
          value={`₦${totalFinancePartnerAccrued.toLocaleString()}`}
          footer="₦100/card (3-year statutory term)"
          icon={Award}
        />
        <StatCard
          label="Active Participants"
          value={`${drivers.length} Total`}
          footer="8 Operational Drivers + 1 Finance Partner"
          icon={Users}
        />
      </div>

      {/* Roster & Distribution Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div>
            <h2 className="text-base font-semibold text-foreground">Core Drivers &amp; Financial Partners Roster</h2>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal threshold is ₦{MIN_WITHDRAWAL_THRESHOLD.toLocaleString()}. Portal access is restricted to authorized administrative seats.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search driver by name or email..."
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
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3 text-right">Share / Card</th>
                <th className="px-4 py-3 text-right">Total Accrued</th>
                <th className="px-4 py-3 text-right">Available Balance</th>
                <th className="px-4 py-3 text-center">Eligibility</th>
                <th className="px-4 py-3 text-center">Portal Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{driver.name}</span>
                      {driver.driverType === "finance_partner" ? (
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                          Core Partner (Finance)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          Operational
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{driver.email}</div>
                    {driver.termNotice && (
                      <div className="text-[10px] text-amber-500/90 font-medium mt-0.5">
                        {driver.termNotice}
                      </div>
                    )}
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
                    {driver.role === "admin" || driver.role === "super_admin" ? (
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/15 text-primary">
                        Admin Active
                      </span>
                    ) : (
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
