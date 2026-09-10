import { useMemo, useState } from "react";
import { Search, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import type { PaymentLog } from "@/types/admin";

const PAGE_SIZE = 25;

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "success") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
  if (s === "pending") return "bg-amber-500/10 text-amber-400 border-amber-500/25";
  if (s === "failed" || s === "cancelled" || s === "suspended") return "bg-destructive/10 text-destructive border-destructive/25";
  return "bg-muted text-muted-foreground border-border";
}

export function PaymentsLogTable({ logs }: { logs: PaymentLog[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter((p) => p.user_email.toLowerCase().includes(q) || p.project_category.toLowerCase().includes(q));
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changePage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Payment_Logs_${dateStamp}.xlsx`;

    const logRows = filtered.map((p, idx) => ({
      "S/N": idx + 1,
      "User Email": p.user_email || "",
      "Project Category": p.project_category || "",
      "Payment Type": p.type === "slot_subscription" ? "Slot Subscription" : "Other Payment",
      "Slots": p.slots || 0,
      "Amount (₦)": p.amount || 0,
      "Status": (p.status || "").toUpperCase(),
      "Date": p.created_at ? new Date(p.created_at).toLocaleString() : "",
      "Log ID": p.id,
    }));

    const totalAmount = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalSlots = filtered.reduce((sum, p) => sum + (p.slots || 0), 0);

    const summaryRows = [
      { "Metric": "Total Log Entries", "Value": filtered.length },
      { "Metric": "Total Amount (₦)", "Value": totalAmount },
      { "Metric": "Total Slots Counted", "Value": totalSlots },
      { "Metric": "Search Query", "Value": search || "None" },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Payment Logs", data: logRows },
        { sheetName: "Log Summary", data: summaryRows },
      ],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          All Operations &amp; Payment Logs (<strong className="text-foreground">{filtered.length}</strong>)
        </span>
        <div className="flex items-center gap-2 sm:max-w-md w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by email or category..."
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 whitespace-nowrap text-xs border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record ID</TableHead>
              <TableHead>Customer Email</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Operation Type</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs font-medium">{p.id}</TableCell>
                <TableCell className="text-xs">{p.user_email}</TableCell>
                <TableCell className="text-xs">{p.project_category}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px]",
                      p.type === "slot_subscription" ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {p.type === "slot_subscription" ? "Slot Subscription" : "Setup / Support"}
                  </span>
                </TableCell>
                <TableCell className="text-xs">{p.slots}</TableCell>
                <TableCell className="text-xs font-semibold">₦{p.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", statusClass(p.status))}>
                    {p.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No payment operations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
