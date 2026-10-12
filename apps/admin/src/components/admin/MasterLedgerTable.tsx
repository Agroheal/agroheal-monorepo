import { useState, useEffect, useCallback } from "react";
import { useAdminTierFilter } from "@/context/AdminTierContext";
import { Search, FileSpreadsheet, Loader2, ArrowUpRight, ArrowDownLeft, Copy, Check, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel } from "@shared/excelExport";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { formatWATDateTime } from "@/lib/dateTimeFormat";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import adminApiClient from "@/lib/apiClient";

const PAGE_SIZE = 25;

export function MasterLedgerTable() {
  const { tier } = useAdminTierFilter();
  const apiTier = tier === "live" ? "modern" : tier;
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totals, setTotals] = useState({ totalCredits: 0, totalDebits: 0, netBalance: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entryType, setEntryType] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch entries
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApiClient.admin.getMasterLedger({
        page: currentPage,
        limit: PAGE_SIZE,
        entryType: entryType === "all" ? undefined : entryType,
        category: category === "all" ? undefined : category,
        tier: apiTier,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: debouncedSearch.trim() || undefined,
      });

      setEntries(res.entries || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
      setTotals(res.totals || { totalCredits: 0, totalDebits: 0, netBalance: 0 });
    } catch (err) {
      console.error("[MasterLedgerTable] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, entryType, category, apiTier, startDate, endDate, debouncedSearch]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleCopy = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleExport = () => {
    if (entries.length === 0) return;
    const exportData = entries.map((e) => ({
      "Date (WAT)": formatWATDateTime(e.created_at),
      "Member Name": e.user?.full_name || "N/A",
      "Member Email": e.user?.email || "N/A",
      "Member ID": e.user?.member_id || "N/A",
      "Entry Type": e.entry_type,
      "Category": e.category,
      "Amount (NGN)": Number(e.amount) || 0,
      "Balance After (NGN)": Number(e.balance_after) || 0,
      "Reference ID": e.reference_id,
    }));

    exportToExcel({
      filename: `AgroHeal_Master_Ledger_${apiTier}_${new Date().toISOString().slice(0, 10)}`,
      sheets: [
        { sheetName: "Master Ledger", data: exportData },
      ],
    });
  };

  const formatCurrency = (amt: number) => {
    return `₦${Number(amt || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
              Total Credits (+)
            </div>
            <div className="text-lg font-bold text-emerald-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              {formatCurrency(totals.totalCredits)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
              Total Debits (-)
            </div>
            <div className="text-lg font-bold text-rose-500 mt-1 flex items-center gap-1">
              <ArrowDownLeft className="w-4 h-4" />
              {formatCurrency(totals.totalDebits)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
              Net Flow Volume
            </div>
            <div
              className={cn(
                "text-lg font-bold mt-1",
                totals.netBalance >= 0 ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {formatCurrency(totals.netBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3.5">
            <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
              Ledger Records Count
            </div>
            <div className="text-lg font-bold text-foreground mt-1">
              {totalCount.toLocaleString()} Entries
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
              placeholder="Search member, email, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          <Select
            value={entryType}
            onValueChange={(val) => {
              setEntryType(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[125px] bg-background">
              <SelectValue placeholder="Entry Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CREDIT">Credits (+)</SelectItem>
              <SelectItem value="DEBIT">Debits (-)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={category}
            onValueChange={(val) => {
              setCategory(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[160px] bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="REFERRAL_BONUS">Referral Bonus</SelectItem>
              <SelectItem value="SLOT_BONUS">Farm Slot Bonus</SelectItem>
              <SelectItem value="MATRIX_COMMISSION">Matrix Commission</SelectItem>
              <SelectItem value="CORE_DRIVER_BONUS">Core Driver Bonus</SelectItem>
              <SelectItem value="DIVIDEND">Dividend Payout</SelectItem>
              <SelectItem value="WITHDRAWAL">Withdrawal Debit</SelectItem>
              <SelectItem value="SLOT_PURCHASE">Slot Purchase</SelectItem>
              <SelectItem value="ADMIN_CREDIT">Admin Credit</SelectItem>
              <SelectItem value="ADMIN_DEBIT">Admin Debit</SelectItem>
            </SelectContent>
          </Select>

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start || "");
              setEndDate(end || "");
              setCurrentPage(1);
            }}
            onClear={() => {
              setStartDate("");
              setEndDate("");
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLedger()}
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
            disabled={entries.length === 0}
            className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold">Date &amp; Time (WAT)</TableHead>
              <TableHead className="text-xs font-semibold">Member</TableHead>
              <TableHead className="text-xs font-semibold">Category</TableHead>
              <TableHead className="text-xs font-semibold">Type</TableHead>
              <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-right">Balance After</TableHead>
              <TableHead className="text-xs font-semibold">Reference ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    Querying Double-Entry Financial Ledger...
                  </div>
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                  No ledger transactions match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const isCredit = entry.entry_type === "CREDIT";
                return (
                  <TableRow key={entry.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {formatWATDateTime(entry.created_at)}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-foreground">
                        {entry.user?.full_name || "Unknown Member"}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span>{entry.user?.email || "No email"}</span>
                        {entry.user?.member_id && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 border-border">
                            {entry.user.member_id}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider">
                        {entry.category.replace(/_/g, " ")}
                      </Badge>
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

                    <TableCell
                      className={cn(
                        "text-right font-mono font-bold whitespace-nowrap",
                        isCredit ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(entry.amount)}
                    </TableCell>

                    <TableCell className="text-right font-mono text-muted-foreground whitespace-nowrap">
                      {formatCurrency(entry.balance_after)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 max-w-[200px]">
                        <span className="font-mono text-[11px] text-muted-foreground truncate" title={entry.reference_id}>
                          {entry.reference_id}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(entry.reference_id)}
                          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          {copiedRef === entry.reference_id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
          <div>
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} entries
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={cn("cursor-pointer h-7 text-xs", currentPage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink className="h-7 text-xs">{currentPage} / {totalPages}</PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={cn("cursor-pointer h-7 text-xs", currentPage === totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
