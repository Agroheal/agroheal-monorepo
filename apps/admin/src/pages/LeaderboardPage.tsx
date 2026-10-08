import { useMemo, useState } from "react";
import {
  Trophy,
  Users,
  Sprout,
  Award,
  Search,
  FileSpreadsheet,
  Loader2,
  Medal,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminMembers } from "@/hooks/useAdminMembers";
import { exportToExcel } from "@shared/excelExport";

export type RankingMetric = "referrals" | "slots" | "leadership_pool";

export default function LeaderboardPage() {
  const { members, loading } = useAdminMembers();
  const [metric, setMetric] = useState<RankingMetric>("referrals");
  const [tierFilter, setTierFilter] = useState<"all" | "live" | "legacy">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute direct referral counts for all members
  const referralCounts = useMemo(() => {
    const counts = new Map<string, number>();

    // Map id, referral_code, member_id, and email -> user_id
    const codeToId = new Map<string, string>();
    members.forEach((m) => {
      codeToId.set(m.id.toLowerCase(), m.id);
      if (m.referral_code) codeToId.set(m.referral_code.trim().toUpperCase(), m.id);
      if (m.member_id) codeToId.set(m.member_id.trim().toUpperCase(), m.id);
      if (m.email) codeToId.set(m.email.trim().toLowerCase(), m.id);
    });

    members.forEach((m) => {
      const ref = (m.raw_referred_by || m.referred_by || "").trim();
      if (!ref) return;

      const sponsorId =
        codeToId.get(ref.toLowerCase()) ||
        codeToId.get(ref.toUpperCase()) ||
        codeToId.get(ref);

      if (sponsorId) {
        counts.set(sponsorId, (counts.get(sponsorId) || 0) + 1);
      }
    });

    return counts;
  }, [members]);

  // Enriched & ranked members
  const rankedMembers = useMemo(() => {
    return members
      .map((m) => {
        const directRefs = referralCounts.get(m.id) || 0;
        const totalSlots = m.total_slots || 0;
        const isLeadershipQualified = directRefs >= 5;

        return {
          ...m,
          directRefs,
          totalSlots,
          isLeadershipQualified,
        };
      })
      .filter((m) => {
        if (tierFilter === "live" && m.is_legacy) return false;
        if (tierFilter === "legacy" && !m.is_legacy) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.full_name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.member_id?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (metric === "referrals") {
          return b.directRefs - a.directRefs || b.totalSlots - a.totalSlots;
        }
        if (metric === "slots") {
          return b.totalSlots - a.totalSlots || b.directRefs - a.directRefs;
        }
        if (metric === "leadership_pool") {
          if (a.isLeadershipQualified && !b.isLeadershipQualified) return -1;
          if (!a.isLeadershipQualified && b.isLeadershipQualified) return 1;
          return b.directRefs - a.directRefs || b.totalSlots - a.totalSlots;
        }
        return 0;
      });
  }, [members, referralCounts, metric, tierFilter, searchQuery]);

  // Aggregate stats
  const totalQualifiedLeaders = useMemo(
    () => members.filter((m) => (referralCounts.get(m.id) || 0) >= 5).length,
    [members, referralCounts]
  );

  const topReferrer = useMemo(() => {
    let top = { name: "None", count: 0 };
    members.forEach((m) => {
      const c = referralCounts.get(m.id) || 0;
      if (c > top.count) {
        top = { name: m.full_name || m.email || "Unknown", count: c };
      }
    });
    return top;
  }, [members, referralCounts]);

  const topSlotHolder = useMemo(() => {
    let top = { name: "None", count: 0 };
    members.forEach((m) => {
      if ((m.total_slots || 0) > top.count) {
        top = { name: m.full_name || m.email || "Unknown", count: m.total_slots };
      }
    });
    return top;
  }, [members]);

  const handleExport = () => {
    const rows = rankedMembers.map((m, idx) => ({
      Rank: idx + 1,
      "Member ID": m.member_id || "-",
      "Full Name": m.full_name || "",
      "Data Tier": m.is_legacy ? "Legacy Base" : "Live Platform",
      Email: m.email || "",
      Phone: m.phone || "",
      "Direct Referrals": m.directRefs,
      "Active Farm Slots": m.totalSlots,
      "Green Card Status": m.has_green_card ? "ACTIVE" : "INACTIVE",
      "Leadership Pool Qualified (>=5)": m.isLeadershipQualified ? "YES" : "NO",
    }));

    exportToExcel({
      filename: `AgroHeal_Leaderboard_${metric}_${new Date().toISOString().split("T")[0]}.xlsx`,
      sheets: [{ sheetName: "Leaderboard", data: rows }],
    });
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-24 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Calculating rankings &amp; performance metrics...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Performance Leaderboard &amp; Leadership Rankings
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Authoritative ranking of top network producers, slot holders, and 4% Leadership Bonus qualifiers.
          </p>
        </div>

        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 shrink-0">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export Leaderboard
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Leadership Qualifiers (≥5)</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalQualifiedLeaders}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Eligible for 4% quarterly pool</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Award className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Top Direct Sponsor</p>
            <p className="text-lg font-bold text-foreground mt-1 truncate max-w-[150px]">{topReferrer.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{topReferrer.count} direct recruits</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Top Slot Producer</p>
            <p className="text-lg font-bold text-foreground mt-1 truncate max-w-[150px]">{topSlotHolder.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{topSlotHolder.count} active farm slots</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Sprout className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Leadership Pool Reserve</p>
            <p className="text-2xl font-bold text-foreground mt-1">4.0%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Statutory product volume allocation</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={metric === "referrals" ? "default" : "ghost"}
            onClick={() => setMetric("referrals")}
            className="text-xs gap-1.5 h-8"
          >
            <Users className="w-3.5 h-3.5" />
            Top Direct Referrers
          </Button>

          <Button
            size="sm"
            variant={metric === "slots" ? "default" : "ghost"}
            onClick={() => setMetric("slots")}
            className="text-xs gap-1.5 h-8"
          >
            <Sprout className="w-3.5 h-3.5" />
            Top Slot Holders
          </Button>

          <Button
            size="sm"
            variant={metric === "leadership_pool" ? "default" : "ghost"}
            onClick={() => setMetric("leadership_pool")}
            className="text-xs gap-1.5 h-8"
          >
            <Award className="w-3.5 h-3.5" />
            Leadership Pool Qualifiers (≥5)
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as "all" | "live" | "legacy")}>
            <SelectTrigger className="w-[145px] h-8 text-xs bg-background">
              <SelectValue placeholder="All Ecosystems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 All Ecosystems</SelectItem>
              <SelectItem value="live">🟢 Live Platform</SelectItem>
              <SelectItem value="legacy">🟡 Legacy Base</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search leader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4 text-center">Direct Referrals</th>
                <th className="py-3 px-4 text-center">Active Slots</th>
                <th className="py-3 px-4 text-center">Green Card</th>
                <th className="py-3 px-4 text-right">Leadership Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankedMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No matching members found.
                  </td>
                </tr>
              ) : (
                rankedMembers.map((m, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        rank <= 3 ? "bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      {/* Rank badge */}
                      <td className="py-3 px-4 text-center font-bold">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs shadow-sm">
                            🥇
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400 text-white text-xs shadow-sm">
                            🥈
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-xs shadow-sm">
                            🥉
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">{rank}</span>
                        )}
                      </td>

                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground">{m.full_name || "Unnamed Member"}</span>
                            {m.is_legacy ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Legacy
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Live
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{m.email}</span>
                        </div>
                      </td>

                      {/* Member ID */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {m.member_id || <span className="text-muted-foreground">-</span>}
                      </td>

                      {/* Direct Referrals */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold ${
                            m.directRefs >= 5
                              ? "bg-emerald-500/10 text-emerald-600"
                              : m.directRefs > 0
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {m.directRefs}
                        </span>
                      </td>

                      {/* Active Slots */}
                      <td className="py-3 px-4 text-center font-semibold">
                        {m.totalSlots > 0 ? (
                          <span className="text-foreground">{m.totalSlots}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>

                      {/* Green Card Status */}
                      <td className="py-3 px-4 text-center">
                        {m.has_green_card ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Pending</span>
                        )}
                      </td>

                      {/* Leadership Status */}
                      <td className="py-3 px-4 text-right">
                        {m.isLeadershipQualified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 text-[11px] font-semibold">
                            <Medal className="w-3 h-3 text-amber-500" />
                            Qualified Leader
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            {5 - m.directRefs} more for pool
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
