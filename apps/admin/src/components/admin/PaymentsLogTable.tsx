import { useMemo, useState } from "react";
import { Search, FileSpreadsheet, CreditCard, Landmark, Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import type { PaymentLog } from "@/types/admin";

const PAGE_SIZE = 25;

export type PaymentMethodFilter = "all" | "online" | "bank_transfer";
export type TransactionCategoryFilter = "all" | "green_card" | "slots" | "products" | "commissions";

function isOfflineMethod(p: PaymentLog): boolean {
  if (p.type === "other_payment") return true;
  const ref = (p.reference || p.id || "").toUpperCase();
  if (
    ref.startsWith("ADMIN_") ||
    ref.startsWith("MANUAL_") ||
    ref.startsWith("OFFLINE_") ||
    ref.startsWith("BT_") ||
    ref.startsWith("GC_OFFLINE") ||
    ref.startsWith("BANK_")
  ) {
    return true;
  }
  const cat = (p.project_category || "").toLowerCase();
  if (cat.includes("offline") || cat.includes("admin") || cat.includes("bank transfer")) {
    return true;
  }
  return false;
}

function resolveTransactionCategory(p: PaymentLog): "green_card" | "slots" | "products" | "commissions" | "other" {
  const cat = (p.project_category || "").toLowerCase();
  const amt = Number(p.amount) || 0;
  const ref = (p.reference || p.id || "").toLowerCase();

  if (cat.includes("green card") || cat.includes("membership") || amt === 2000 || ref.includes("gc-") || ref.includes("gc_")) {
    return "green_card";
  }
  if (
    cat.includes("slot") ||
    cat.includes("mushroom") ||
    cat.includes("ginger") ||
    cat.includes("foodnation") ||
    p.type === "slot_subscription" ||
    (p.slots && p.slots > 0)
  ) {
    return "slots";
  }
  if (cat.includes("product") || cat.includes("starter") || cat.includes("store") || ref.includes("ord-") || ref.includes("ord_")) {
    return "products";
  }
  if (cat.includes("commission") || cat.includes("bonus") || cat.includes("driver") || ref.includes("comm") || ref.includes("bonus")) {
    return "commissions";
  }
  return "other";
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "success" || s === "paid" || s === "successful") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
  }
  if (s === "pending") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/25";
  }
  if (s === "failed" || s === "cancelled" || s === "suspended") {
    return "bg-destructive/10 text-destructive border-destructive/25";
  }
  return "bg-muted text-muted-foreground border-border";
}

export function PaymentsLogTable({ logs }: { logs: PaymentLog[] }) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return logs.filter((p) => {
      // 1. Text Search (email, reference, category, ID)
      if (q) {
        const emailMatch = p.user_email?.toLowerCase().includes(q);
        const catMatch = p.project_category?.toLowerCase().includes(q);
        const refMatch = p.reference?.toLowerCase().includes(q);
        const idMatch = p.id?.toLowerCase().includes(q);
        if (!emailMatch && !catMatch && !refMatch && !idMatch) {
          return false;
        }
      }

      // 2. Method Filter (All, Online, Bank Transfer)
      const isOffline = isOfflineMethod(p);
      if (methodFilter === "online" && isOffline) return false;
      if (methodFilter === "bank_transfer" && !isOffline) return false;

      // 3. Category Filter
      if (categoryFilter !== "all") {
        const resolved = resolveTransactionCategory(p);
        if (resolved !== categoryFilter) return false;
      }

      return true;
    });
  }, [logs, search, methodFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changePage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Transactions_${dateStamp}.xlsx`;

    const logRows = filtered.map((p, idx) => {
      const isOffline = isOfflineMethod(p);
      const cat = resolveTransactionCategory(p);
      return {
        "S/N": idx + 1,
        "Customer Email": p.user_email || "",
        "Payment Channel": isOffline ? "Bank Transfer / Offline" : "Online Checkout",
        "Category":
          cat === "green_card"
            ? "Green Card Membership"
            : cat === "slots"
            ? "Farm Slots"
            : cat === "products"
            ? "Product Purchases"
            : cat === "commissions"
            ? "Commissions & Bonuses"
            : p.project_category,
        "Reference": p.reference || p.id,
        "Slots": p.slots || 0,
        "Amount (₦)": p.amount || 0,
        "Status": (p.status || "").toUpperCase(),
        "Date": p.created_at ? formatWATDateTime(p.created_at) : "",
      };
    });

    const totalAmount = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalSlots = filtered.reduce((sum, p) => sum + (p.slots || 0), 0);

    const summaryRows = [
      { Metric: "Total Transactions", Value: filtered.length },
      { Metric: "Total Amount (₦)", Value: totalAmount },
      { Metric: "Total Farm Slots", Value: totalSlots },
      { Metric: "Channel Filter", Value: methodFilter },
      { Metric: "Category Filter", Value: categoryFilter },
      { Metric: "Search Query", Value: search || "None" },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Transactions", data: logRows },
        { sheetName: "Summary", data: summaryRows },
      ],
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Smart Control & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        {/* Row 1: Spacious Search & Method / Category Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Spacious Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search customer email, reference, category..."
              className="pl-9 h-9 text-xs w-full"
            />
          </div>

          {/* Two-Tier Filters & Export */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Filter 1: Channel */}
            <Select
              value={methodFilter}
              onValueChange={(v) => {
                setMethodFilter(v as PaymentMethodFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  🌐 All Channels
                </SelectItem>
                <SelectItem value="online" className="text-xs">
                  💳 Online Checkout
                </SelectItem>
                <SelectItem value="bank_transfer" className="text-xs">
                  🏦 Bank Transfer / Offline
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filter 2: Category */}
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v as TransactionCategoryFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[175px] h-9 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  📁 All Categories
                </SelectItem>
                <SelectItem value="green_card" className="text-xs">
                  🪪 Green Card Membership
                </SelectItem>
                <SelectItem value="slots" className="text-xs">
                  🌱 Farm Slot Purchases
                </SelectItem>
                <SelectItem value="products" className="text-xs">
                  📦 Product Purchases
                </SelectItem>
                <SelectItem value="commissions" className="text-xs">
                  💰 Commissions &amp; Bonuses
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Export Excel Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-9 gap-1.5 whitespace-nowrap text-xs border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 font-semibold"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export
            </Button>
          </div>
        </div>

        {/* Counter Summary Strip */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            Showing <strong className="text-foreground">{filtered.length}</strong> matching transaction record{filtered.length !== 1 ? "s" : ""}
          </span>
          <span>
            Total Volume:{" "}
            <strong className="text-foreground font-mono">
              ₦{filtered.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
            </strong>
          </span>
        </div>
      </div>

      {/* Responsive Transaction Table (Prevents Page Horizontal Scroll) */}
      <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
        <Table className="w-full text-xs">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/40">
              <TableHead className="py-2.5 px-3 font-semibold">Customer / Email</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Category &amp; Program</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Method</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Amount &amp; Units</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold">Status</TableHead>
              <TableHead className="py-2.5 px-3 font-semibold text-right">Date (WAT)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {pageItems.map((p) => {
              const isOffline = isOfflineMethod(p);
              const cat = resolveTransactionCategory(p);
              const ref = p.reference || p.id;
              const isCopied = copiedId === p.id;

              return (
                <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                  {/* Customer / Email */}
                  <TableCell className="py-2.5 px-3 max-w-[200px]">
                    <div className="font-medium text-foreground truncate" title={p.user_email}>
                      {p.user_email}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground mt-0.5">
                      <span className="truncate max-w-[120px]">{ref}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(ref, p.id)}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center"
                        title="Copy Reference"
                      >
                        {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  </TableCell>

                  {/* Category & Program */}
                  <TableCell className="py-2.5 px-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border",
                        cat === "green_card"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : cat === "slots"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : cat === "products"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : cat === "commissions"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {cat === "green_card"
                        ? "Green Card"
                        : cat === "slots"
                        ? "Farm Slot"
                        : cat === "products"
                        ? "Product"
                        : cat === "commissions"
                        ? "Commission"
                        : p.project_category}
                    </span>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                      {p.project_category}
                    </div>
                  </TableCell>

                  {/* Channel / Method */}
                  <TableCell className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      {isOffline ? (
                        <>
                          <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Bank Transfer</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Online Pay</span>
                        </>
                      )}
                    </span>
                  </TableCell>

                  {/* Amount & Units */}
                  <TableCell className="py-2.5 px-3 font-mono">
                    <div className="font-bold text-foreground">₦{p.amount.toLocaleString()}</div>
                    {p.slots > 0 && (
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {p.slots} slot{p.slots > 1 ? "s" : ""} ({p.slots * 2} bags)
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2.5 px-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        statusBadge(p.status),
                      )}
                    >
                      {p.status}
                    </span>
                  </TableCell>

                  {/* Date (WAT) */}
                  <TableCell className="py-2.5 px-3 text-right text-muted-foreground whitespace-nowrap text-[11px]">
                    {formatWATDateTime(p.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}

            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No transaction records match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  changePage(currentPage - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    changePage(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  changePage(currentPage + 1);
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
