import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, ExternalLink, ShieldCheck, FileSpreadsheet, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportToExcel } from "@shared/excelExport";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export interface AuditEventRecord {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: {
    admin_email?: string;
    target_user_id?: string;
    member_id?: string;
    slots?: number;
    project_category?: string;
    amount?: number;
    transaction_ref?: string;
    payment_date?: string;
    receipt_url?: string | null;
    notes?: string | null;
  };
  created_at: string;
}

const PAGE_SIZE = 20;

export function AdminAuditLogTable() {
  const [logs, setLogs] = useState<AuditEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_events")
        .select("*")
        .in("action", ["MANUAL_SLOT_CREDIT", "MANUAL_GREEN_CARD_ACTIVATION"])
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Failed to load audit events:", error);
      } else if (data) {
        setLogs(data as AuditEventRecord[]);
      }
    } catch (err) {
      console.error("Error fetching audit events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter((log) => {
      const p = log.payload || {};
      return (
        log.action.toLowerCase().includes(q) ||
        (p.admin_email && p.admin_email.toLowerCase().includes(q)) ||
        (p.target_user_id && p.target_user_id.toLowerCase().includes(q)) ||
        (p.member_id && p.member_id.toLowerCase().includes(q)) ||
        (p.project_category && p.project_category.toLowerCase().includes(q)) ||
        (p.transaction_ref && p.transaction_ref.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [logs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Admin_Offline_Audit_${dateStamp}.xlsx`;

    const rows = filtered.map((log, idx) => {
      const p = log.payload || {};
      return {
        "S/N": idx + 1,
        "Timestamp": log.created_at ? new Date(log.created_at).toLocaleString() : "",
        "Action": log.action === "MANUAL_SLOT_CREDIT" ? "Slot Credit" : "Green Card Activation",
        "Admin Email": p.admin_email || "System",
        "Target Member ID": p.member_id || p.target_user_id || "",
        "Category": p.project_category || "Green Card Membership",
        "Slots": p.slots || 0,
        "Amount (₦)": p.amount || 0,
        "Bank Reference": p.transaction_ref || "-",
        "Payment Date": p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "-",
        "Has Receipt": p.receipt_url ? "YES" : "NO",
        "Receipt URL": p.receipt_url || "-",
        "Audit Notes": p.notes || "-",
      };
    });

    exportToExcel({
      filename,
      sheets: [{ sheetName: "Offline Audit Trail", data: rows }],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Admin Offline &amp; Bank Transfer Audit Trail
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable log of all manual credits, receipts, bank references, and authorizing admins.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:max-w-md w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search ref, admin, or member..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 shrink-0 text-xs h-9"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Export Excel
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="h-9 px-2.5"
            title="Refresh logs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-xs">S/N</TableHead>
              <TableHead className="text-xs">Date &amp; Time</TableHead>
              <TableHead className="text-xs">Action Type</TableHead>
              <TableHead className="text-xs">Authorizing Admin</TableHead>
              <TableHead className="text-xs">Program / Details</TableHead>
              <TableHead className="text-xs">Bank Ref / Transaction ID</TableHead>
              <TableHead className="text-xs text-right">Amount (₦)</TableHead>
              <TableHead className="text-xs text-center">Receipt Proof</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading audit trail...
                  </div>
                </TableCell>
              </TableRow>
            ) : pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-xs">
                  No manual audit logs found matching your filter.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((log, idx) => {
                const p = log.payload || {};
                const isSlot = log.action === "MANUAL_SLOT_CREDIT";
                const serial = (currentPage - 1) * PAGE_SIZE + idx + 1;

                return (
                  <TableRow key={log.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono text-muted-foreground">{serial}</TableCell>
                    <TableCell className="font-mono whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {isSlot ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                          🌱 Slot Credit ({p.slots || 0})
                        </Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          💳 Green Card
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-foreground truncate max-w-[160px]">
                      {p.admin_email || "System"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {p.project_category || (isSlot ? "Farm Slots" : "Green Card Lifetime")}
                        </span>
                        {p.notes && (
                          <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]" title={p.notes}>
                            {p.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {p.transaction_ref || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      ₦{(p.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.receipt_url ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-primary hover:text-primary gap-1"
                            onClick={() => setSelectedReceiptUrl(p.receipt_url || null)}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                          <a
                            href={p.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No Receipt</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink isActive={currentPage === i + 1} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Receipt Viewer Modal */}
      <Dialog open={Boolean(selectedReceiptUrl)} onOpenChange={(open) => !open && setSelectedReceiptUrl(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Verified Bank Transfer Receipt</span>
              {selectedReceiptUrl && (
                <a
                  href={selectedReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-normal mr-6"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Full Image
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 bg-muted/40 rounded-lg max-h-[70vh] overflow-auto">
            {selectedReceiptUrl && (
              <img
                src={selectedReceiptUrl}
                alt="Payment Receipt"
                className="max-h-[65vh] w-auto object-contain rounded border border-border shadow-sm"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
