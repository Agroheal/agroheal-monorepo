import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminTierFilter } from "@/context/AdminTierContext";
import {
  Landmark,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ArrowDownLeft,
  CreditCard,
  Sprout,
  PackageCheck,
  Building2,
  ChevronLeft,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { exportToExcel } from "@shared/excelExport";
import { formatWATDateTime } from "@/lib/dateTimeFormat";
import { cn } from "@/lib/utils";
import adminApiClient from "@/lib/apiClient";

export default function CorporateRevenuePage() {
  const { tier } = useAdminTierFilter();
  const apiTier = tier === "live" ? "modern" : tier;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    balance: number;
    transactions: any[];
    summary: {
      gcMarginTotal: number;
      slotMarginTotal: number;
      starterPackMarginTotal: number;
      sweptTotal: number;
      netRetained: number;
      count: number;
    };
  }>({
    balance: 0,
    transactions: [],
    summary: {
      gcMarginTotal: 0,
      slotMarginTotal: 0,
      starterPackMarginTotal: 0,
      sweptTotal: 0,
      netRetained: 0,
      count: 0,
    },
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const fetchCorporateRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.admin.getWalletHistory("agrohealCorporateRevenue", {
        tier: apiTier,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
      });

      setData({
        balance: res.netBalance || res.balance || 0,
        transactions: res.records || res.transactions || [],
        summary: {
          gcMarginTotal: res.categories?.gcMarginTotal || 0,
          slotMarginTotal: res.categories?.slotMarginTotal || 0,
          starterPackMarginTotal: res.categories?.starterPackMarginTotal || 0,
          sweptTotal: res.categories?.sweptTotal || 0,
          netRetained: res.netBalance || 0,
          count: (res.records || res.transactions || []).length,
        },
      });
    } catch (err) {
      console.error("[CorporateRevenuePage] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiTier, startDate, endDate, search]);

  useEffect(() => {
    fetchCorporateRevenue();
  }, [fetchCorporateRevenue]);

  // Client-side category & type filtering
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter((tx) => {
      if (categoryFilter !== "all") {
        if (categoryFilter === "gc_margin" && tx.category !== "gc_margin" && tx.category !== "GC_CORPORATE_MARGIN") return false;
        if (categoryFilter === "slot_margin" && tx.category !== "slot_margin" && tx.category !== "SLOT_CORPORATE_MARGIN") return false;
        if (categoryFilter === "starter_pack_margin" && tx.category !== "starter_pack_margin" && tx.category !== "SP_CORPORATE_MARGIN") return false;
        if (categoryFilter === "swept" && tx.category !== "swept" && tx.category !== "CORPORATE_SWEEP") return false;
      }
      if (typeFilter !== "all") {
        const txType = String(tx.type || "").toLowerCase();
        if (typeFilter === "credit" && txType !== "credit" && txType !== "inflow") return false;
        if (typeFilter === "debit" && txType !== "debit" && txType !== "outflow") return false;
      }
      return true;
    });
  }, [data.transactions, categoryFilter, typeFilter]);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) return;
    const exportData = filteredTransactions.map((tx) => ({
      "Date (WAT)": formatWATDateTime(tx.date),
      "Entry Type": tx.type.toUpperCase(),
      "Category": tx.category ? tx.category.replace(/_/g, " ").toUpperCase() : "STATUTORY MARGIN",
      "Amount (NGN)": Number(tx.amount) || 0,
      "Reference ID": tx.reference,
      "Audit Notes": tx.notes || tx.description || "Statutory Retained Corporate Margin",
    }));

    exportToExcel({
      filename: `AgroHeal_Corporate_Revenue_Audit_${apiTier}_${new Date().toISOString().slice(0, 10)}`,
      sheets: [
        { sheetName: "Corporate Revenue Trail", data: exportData },
      ],
    });
  };

  const formatCurrency = (amt: number) => {
    return `₦${Number(amt || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/treasury"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Treasury
            </Link>
            <span className="text-muted-foreground/40">•</span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              corporate_margin wallet
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {apiTier === "modern" ? "Modern Tier (Sep 27+)" : apiTier === "legacy" ? "Legacy Tier (< Sep 27)" : "All Tiers"}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            AgroHeal Retained Corporate Revenue
          </h1>
          <p className="text-xs text-muted-foreground">
            Statutory Flat Wallet Audit Trail • Row-by-Row Transactions &amp; Margin Ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCorporateRevenue}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
            className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Audit Trail
          </Button>
        </div>
      </div>

      {/* 5 KPI Margin Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Net Corporate Retained
              <Landmark className="w-3.5 h-3.5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold text-foreground mt-1">
              {formatCurrency(data.balance)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Current liquid wallet balance
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              GC Margins (₦100)
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold text-emerald-500 mt-1">
              {formatCurrency(data.summary.gcMarginTotal)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              ₦100 statutory retention / Green Card
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Slot Margins (₦1,000)
              <Sprout className="w-3.5 h-3.5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold text-amber-500 mt-1">
              {formatCurrency(data.summary.slotMarginTotal)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              ₦1,000 statutory retention / Farm Slot
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Starter Pack (₦750)
              <PackageCheck className="w-3.5 h-3.5 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold text-blue-500 mt-1">
              {formatCurrency(data.summary.starterPackMarginTotal)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              ₦750 statutory retention / Combo Pack
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Swept / Transferred
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-bold text-rose-500 mt-1">
              {formatCurrency(data.summary.sweptTotal)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Swept to company bank accounts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reference or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 text-xs w-[170px] bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statutory Streams</SelectItem>
              <SelectItem value="gc_margin">Green Card Margin (₦100)</SelectItem>
              <SelectItem value="slot_margin">Slot Margin (₦1,000)</SelectItem>
              <SelectItem value="starter_pack_margin">Starter Pack Margin (₦750)</SelectItem>
              <SelectItem value="swept">Corporate Bank Sweeps</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 text-xs w-[125px] bg-background">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit">Credits (+)</SelectItem>
              <SelectItem value="debit">Debits (-)</SelectItem>
            </SelectContent>
          </Select>

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start || "");
              setEndDate(end || "");
            }}
            onClear={() => {
              setStartDate("");
              setEndDate("");
            }}
          />
        </div>

        <div className="text-xs text-muted-foreground shrink-0 font-medium">
          Showing {filteredTransactions.length} of {data.transactions.length} transactions
        </div>
      </div>

      {/* Live Audit Trail Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold">Date &amp; Time (WAT)</TableHead>
              <TableHead className="text-xs font-semibold">Type</TableHead>
              <TableHead className="text-xs font-semibold">Margin Category</TableHead>
              <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
              <TableHead className="text-xs font-semibold">Reference ID</TableHead>
              <TableHead className="text-xs font-semibold">Audit Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Loading Corporate Revenue Audit Trail...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                  No statutory margin transactions recorded for this period.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => {
                const isCredit = tx.type === "credit";
                const isGc = tx.category === "gc_margin";
                const isSlot = tx.category === "slot_margin";
                const isStarter = tx.category === "starter_pack_margin";
                const isSweep = tx.category === "swept";

                return (
                  <TableRow key={tx.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatWATDateTime(tx.date)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5",
                          isCredit
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                        )}
                      >
                        {isCredit ? "+ CREDIT" : "- DEBIT"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {isGc && (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Green Card Margin (₦100)
                        </Badge>
                      )}
                      {isSlot && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          Slot Margin (₦1,000)
                        </Badge>
                      )}
                      {isStarter && (
                        <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                          Starter Pack Margin (₦750)
                        </Badge>
                      )}
                      {isSweep && (
                        <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">
                          Corporate Bank Sweep
                        </Badge>
                      )}
                      {!isGc && !isSlot && !isStarter && !isSweep && (
                        <Badge variant="outline" className="text-[10px]">
                          Statutory Margin
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "text-right font-mono font-bold whitespace-nowrap",
                        isCredit ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 max-w-[200px]">
                        <span className="font-mono text-[11px] text-muted-foreground truncate" title={tx.reference}>
                          {tx.reference}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(tx.reference)}
                          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          {copiedRef === tx.reference ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {tx.notes || "Statutory Retained Margin Allocation"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
