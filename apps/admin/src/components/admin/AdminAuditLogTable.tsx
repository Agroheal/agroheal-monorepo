import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Eye,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    admin_id?: string;
    admin_email?: string;
    admin_name?: string;
    admin_role?: string;
    target_user_id?: string;
    target_email?: string;
    target_name?: string;
    target_phone?: string;
    member_id?: string;
    slots?: number;
    slots_assigned?: number;
    project_category?: string;
    category?: string;
    amount?: number;
    setup_fee?: number;
    support_fee?: number;
    is_legacy?: boolean;
    rate_type?: string;
    transaction_ref?: string;
    payment_date?: string;
    receipt_url?: string | null;
    notes?: string | null;
    updated_fields?: Record<string, unknown>;
    previous_state?: Record<string, unknown>;
    config_key?: string;
    new_value?: Record<string, unknown>;
    is_update?: boolean;
  };
  created_at: string;
}

const PAGE_SIZE = 20;

export function AdminAuditLogTable() {
  const [logs, setLogs] = useState<AuditEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "green_card" | "slots" | "members" | "operations">("all");
  const [page, setPage] = useState(1);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

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
    let result = logs;

    // Filter by action category
    if (categoryFilter === "green_card") {
      result = result.filter((l) => l.action === "MANUAL_GREEN_CARD_ACTIVATION");
    } else if (categoryFilter === "slots") {
      result = result.filter((l) => l.action === "MANUAL_SLOT_CREDIT");
    } else if (categoryFilter === "members") {
      result = result.filter((l) =>
        ["ADMIN_CREATE_MEMBER", "ADMIN_UPDATE_MEMBER", "ADMIN_RESET_PASSWORD"].includes(l.action),
      );
    } else if (categoryFilter === "operations") {
      result = result.filter((l) =>
        ["FARM_GROUP_ASSIGNMENT", "ADMIN_UPDATE_CONFIG"].includes(l.action),
      );
    }

    const q = search.toLowerCase().trim();
    if (!q) return result;

    return result.filter((log) => {
      const p = log.payload || {};
      return (
        log.action.toLowerCase().includes(q) ||
        (p.admin_email && p.admin_email.toLowerCase().includes(q)) ||
        (p.admin_name && p.admin_name.toLowerCase().includes(q)) ||
        (p.target_email && p.target_email.toLowerCase().includes(q)) ||
        (p.target_name && p.target_name.toLowerCase().includes(q)) ||
        (p.target_user_id && p.target_user_id.toLowerCase().includes(q)) ||
        (p.member_id && p.member_id.toLowerCase().includes(q)) ||
        (p.project_category && p.project_category.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.transaction_ref && p.transaction_ref.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    });
  }, [logs, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getActionLabel = (action: string) => {
    switch (action) {
      case "MANUAL_GREEN_CARD_ACTIVATION":
        return "Green Card Activation";
      case "MANUAL_SLOT_CREDIT":
        return "Manual Slot Credit";
      case "ADMIN_CREATE_MEMBER":
        return "Member Registered";
      case "ADMIN_UPDATE_MEMBER":
        return "Profile Update";
      case "ADMIN_RESET_PASSWORD":
        return "Password Reset";
      case "ADMIN_UPDATE_CONFIG":
        return "Config Update";
      case "FARM_GROUP_ASSIGNMENT":
        return "Farm Slot Assignment";
      default:
        return action;
    }
  };

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Admin_Audit_Trail_${dateStamp}.xlsx`;

    const rows = filtered.map((log, idx) => {
      const p = log.payload || {};
      return {
        "S/N": idx + 1,
        "Timestamp": log.created_at ? new Date(log.created_at).toLocaleString() : "",
        "Action": getActionLabel(log.action),
        "Authorizing Admin": p.admin_email || p.admin_name || "System",
        "Admin Role": p.admin_role || "admin",
        "Target Member / Entity": p.target_name || p.target_email || p.member_id || p.target_user_id || log.entity_id || "-",
        "Member ID": p.member_id || "-",
        "Category / Program": p.project_category || p.category || (log.action === "MANUAL_GREEN_CARD_ACTIVATION" ? "Green Card Lifetime" : "-"),
        "Slots": p.slots || p.slots_assigned || 0,
        "Amount (₦)": p.amount !== undefined ? p.amount : "-",
        "Rate Tier": p.is_legacy !== undefined ? (p.is_legacy ? "Legacy (₦1,000)" : "Standard (₦2,000)") : "-",
        "Bank Reference": p.transaction_ref || "-",
        "Payment Date": p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "-",
        "Has Receipt": p.receipt_url ? "YES" : "NO",
        "Receipt URL": p.receipt_url || "-",
        "Audit Notes": p.notes || "-",
      };
    });

    exportToExcel({
      filename,
      sheets: [{ sheetName: "Admin Audit Trail", data: rows }],
    });
  };

  const renderActionBadge = (log: AuditEventRecord) => {
    const p = log.payload || {};
    switch (log.action) {
      case "MANUAL_GREEN_CARD_ACTIVATION":
        return (
          <div className="flex flex-col gap-0.5 items-start">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
              💳 Green Card
            </Badge>
            {p.is_legacy !== undefined && (
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${p.is_legacy ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                {p.is_legacy ? "₦1,000 • Legacy" : "₦2,000 • Standard"}
              </span>
            )}
          </div>
        );
      case "MANUAL_SLOT_CREDIT":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
            🌱 Slot Credit ({p.slots || 0})
          </Badge>
        );
      case "ADMIN_CREATE_MEMBER":
        return (
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] font-semibold">
            👤 Member Created
          </Badge>
        );
      case "ADMIN_UPDATE_MEMBER":
        return (
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-semibold">
            ✏️ Profile Updated
          </Badge>
        );
      case "ADMIN_RESET_PASSWORD":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-semibold">
            🔑 Password Reset
          </Badge>
        );
      case "FARM_GROUP_ASSIGNMENT":
        return (
          <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px] font-semibold">
            🚜 Farm Assigned ({p.slots_assigned || 0})
          </Badge>
        );
      case "ADMIN_UPDATE_CONFIG":
        return (
          <Badge className="bg-slate-500/10 text-slate-300 border-slate-500/20 text-[10px] font-semibold">
            ⚙️ Config Updated
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {log.action}
          </Badge>
        );
    }
  };

  const renderDetails = (log: AuditEventRecord) => {
    const p = log.payload || {};
    const target = p.target_name || p.target_email || p.member_id || p.target_user_id || log.entity_id || "";

    return (
      <div className="flex flex-col text-xs space-y-0.5">
        {target && (
          <span className="font-medium text-foreground truncate max-w-[220px]" title={target}>
            {target}
            {p.target_email && p.target_name && p.target_name !== p.target_email && (
              <span className="text-[10px] text-muted-foreground block truncate">
                {p.target_email}
              </span>
            )}
          </span>
        )}
        {p.member_id && log.action === "MANUAL_GREEN_CARD_ACTIVATION" && (
          <span className="font-mono text-[10px] text-primary">
            ID: {p.member_id}
          </span>
        )}
        {p.project_category && (
          <span className="text-[10px] text-muted-foreground">
            {p.project_category}
          </span>
        )}
        {p.updated_fields && (
          <span className="text-[10px] text-purple-400/90 font-mono truncate max-w-[220px]" title={Object.keys(p.updated_fields).join(", ")}>
            Changed: {Object.keys(p.updated_fields).join(", ")}
          </span>
        )}
        {p.notes && (
          <span className="text-[10px] text-muted-foreground italic truncate max-w-[220px]" title={p.notes}>
            &ldquo;{p.notes}&rdquo;
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Administrative Audit Trail &amp; Actions Log
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cryptographically logged trail of all administrative approvals, card issuances, slot credits, and profile updates.
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        <Button
          type="button"
          size="sm"
          variant={categoryFilter === "all" ? "default" : "outline"}
          onClick={() => { setCategoryFilter("all"); setPage(1); }}
          className="h-7 text-xs px-2.5"
        >
          All Events ({logs.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={categoryFilter === "green_card" ? "default" : "outline"}
          onClick={() => { setCategoryFilter("green_card"); setPage(1); }}
          className="h-7 text-xs px-2.5"
        >
          💳 Green Cards
        </Button>
        <Button
          type="button"
          size="sm"
          variant={categoryFilter === "slots" ? "default" : "outline"}
          onClick={() => { setCategoryFilter("slots"); setPage(1); }}
          className="h-7 text-xs px-2.5"
        >
          🌱 Slot Credits
        </Button>
        <Button
          type="button"
          size="sm"
          variant={categoryFilter === "members" ? "default" : "outline"}
          onClick={() => { setCategoryFilter("members"); setPage(1); }}
          className="h-7 text-xs px-2.5"
        >
          👤 Member Accounts
        </Button>
        <Button
          type="button"
          size="sm"
          variant={categoryFilter === "operations" ? "default" : "outline"}
          onClick={() => { setCategoryFilter("operations"); setPage(1); }}
          className="h-7 text-xs px-2.5"
        >
          🚜 Operations &amp; Config
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-xs">S/N</TableHead>
              <TableHead className="text-xs">Date &amp; Time</TableHead>
              <TableHead className="text-xs">Action Type</TableHead>
              <TableHead className="text-xs">Authorizing Admin</TableHead>
              <TableHead className="text-xs">Target / Details</TableHead>
              <TableHead className="text-xs">Bank Ref / Tx ID</TableHead>
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
                  No administrative audit records found matching your filter.
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((log, idx) => {
                const p = log.payload || {};
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
                      {renderActionBadge(log)}
                    </TableCell>
                    <TableCell className="font-mono text-foreground truncate max-w-[160px]">
                      <div className="flex flex-col">
                        <span className="font-medium">{p.admin_email || p.admin_name || "System"}</span>
                        {p.admin_role && (
                          <span className="text-[10px] text-muted-foreground uppercase">{p.admin_role}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderDetails(log)}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {p.transaction_ref || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground font-mono">
                      {p.amount !== undefined ? `₦${(p.amount || 0).toLocaleString()}` : "-"}
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
                        <span className="text-[10px] text-muted-foreground">-</span>
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
