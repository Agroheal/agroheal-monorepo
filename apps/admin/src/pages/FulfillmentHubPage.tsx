import { useEffect, useMemo, useState } from "react";
import {
  PackageCheck,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  Copy,
  Check,
  FileSpreadsheet,
  MapPin,
  ExternalLink,
  Loader2,
  RefreshCw,
  Layers,
  Table as TableIcon,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { adminApiClient } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel } from "@shared/excelExport";
import { formatWATDateTime } from "@/lib/dateTimeFormat";
import { useAdminTierFilter } from "@/context/AdminTierContext";
import { cn } from "@/lib/utils";
import type { FulfillmentOrder } from "@/types/admin";

export default function FulfillmentHubPage() {
  const { tier } = useAdminTierFilter();
  const tierFilter = tier;
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"groups" | "table">("groups");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. Primary: fetch from adminApiClient.fulfillment.getManifest()
      const manifestRes = await adminApiClient.fulfillment
        .getManifest(tierFilter === "all" ? undefined : tierFilter)
        .catch(() => null);

      if (manifestRes && Array.isArray(manifestRes.manifest)) {
        setOrders(manifestRes.manifest);
        return;
      }

      // 2. Direct Supabase Fallback: fetch orders and lg_checkout
      const [ordersRes, lgCheckoutRes] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            id,
            user_id,
            transaction_id,
            product_code,
            quantity,
            unit_price,
            total_price,
            status,
            notes,
            created_at,
            profiles:user_id (
              id,
              full_name,
              email,
              phone,
              member_id,
              state,
              lga,
              country
            ),
            transactions:transaction_id (
              id,
              transaction_ref,
              payment_channel,
              created_at,
              state,
              lga
            )
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("lg_checkout")
          .select(`
            id,
            user_id,
            created_at,
            amount,
            status,
            first_name,
            last_name,
            email,
            phone,
            payment_method,
            transaction_ref,
            project_category
          `)
          .ilike("status", "%paid%")
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.error) throw ordersRes.error;

      const liveMapped: FulfillmentOrder[] = (ordersRes.data || []).map((o: any) => {
        const prof = o.profiles || {};
        const tx = o.transactions || {};
        const state = prof.state || tx.state || "Unspecified";
        const lga = prof.lga || tx.lga || "Unspecified";

        return {
          id: String(o.id),
          userId: o.user_id,
          transactionId: o.transaction_id,
          productCode: o.product_code || "SP-MUSH-100G",
          productName:
            o.product_code === "SP-MUSH-100G"
              ? "Mushroom Power 100g Starter Pack"
              : o.product_code || "Product Package",
          quantity: o.quantity || 1,
          totalPrice: Number(o.total_price) || 5000,
          status: (o.status || "PAID").toUpperCase(),
          notes: o.notes,
          createdAt: o.created_at,
          is_legacy: false,
          orderOrigin: "order" as const,
          buyer: {
            id: prof.id || o.user_id,
            fullName: prof.full_name || "Member",
            email: prof.email || "",
            phone: prof.phone || "",
            memberId: prof.member_id || "-",
            state,
            lga,
            country: prof.country || "Nigeria",
          },
          transactionRef: tx.transaction_ref || (o.transaction_id ? `TX-${o.transaction_id}` : `ORD-${String(o.id).slice(0, 8)}`),
        };
      });

      const legacyMapped: FulfillmentOrder[] = (lgCheckoutRes.data || []).map((c: any) => {
        const amt = Number(c.amount) || 0;
        const inferredQty = amt >= 5000 ? Math.floor(amt / 5000) : 1;
        const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Legacy Member";

        return {
          id: String(c.id),
          userId: c.user_id,
          transactionId: c.id,
          productCode: "LEGACY-CHECKOUT",
          productName: c.project_category || "Legacy Allocation",
          quantity: inferredQty,
          totalPrice: amt,
          status: (c.status || "PAID").toUpperCase(),
          notes: `Legacy founding checkout #${c.id}`,
          createdAt: c.created_at,
          is_legacy: true,
          orderOrigin: "legacy_checkout" as const,
          buyer: {
            id: c.user_id,
            fullName,
            email: c.email || "",
            phone: c.phone || "",
            memberId: "-",
            state: "Unspecified",
            lga: "Unspecified",
            country: "Nigeria",
          },
          transactionRef: c.transaction_ref || `LG-${c.id}`,
        };
      });

      setOrders([...liveMapped, ...legacyMapped]);
    } catch (err) {
      console.error("Failed to load fulfillment orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tierFilter]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: string,
    origin: "order" | "legacy_checkout" | "transaction" = "order"
  ) => {
    setUpdatingId(orderId);
    const cleanOrigin: "order" | "legacy_checkout" = origin === "legacy_checkout" ? "legacy_checkout" : "order";
    try {
      const apiOk = await adminApiClient.fulfillment
        .updateOrderStatus(orderId, newStatus, undefined, cleanOrigin)
        .then(() => true)
        .catch(() => false);

      if (!apiOk) {
        if (cleanOrigin === "legacy_checkout") {
          const { error } = await supabase
            .from("lg_checkout")
            .update({ status: newStatus.toLowerCase() })
            .eq("id", orderId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("orders")
            .update({
              status: newStatus.toUpperCase(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
          if (error) throw error;
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus.toUpperCase() } : o))
      );
    } catch (err) {
      console.error("Failed to update order status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Distinct states for filter
  const distinctStates = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.buyer.state && o.buyer.state !== "Unspecified") {
        set.add(o.buyer.state);
      }
    });
    return Array.from(set).sort();
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      // Tier Filter: all | live | legacy
      if (tierFilter === "live" && o.is_legacy) return false;
      if (tierFilter === "legacy" && !o.is_legacy) return false;

      if (q) {
        const nameMatch = o.buyer.fullName.toLowerCase().includes(q);
        const emailMatch = o.buyer.email.toLowerCase().includes(q);
        const phoneMatch = o.buyer.phone.toLowerCase().includes(q);
        const stateMatch = o.buyer.state.toLowerCase().includes(q);
        const lgaMatch = o.buyer.lga.toLowerCase().includes(q);
        const memIdMatch = o.buyer.memberId.toLowerCase().includes(q);
        const refMatch = (o.transactionRef || "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch && !stateMatch && !lgaMatch && !memIdMatch && !refMatch) {
          return false;
        }
      }

      if (selectedState !== "all") {
        if (o.buyer.state.toLowerCase() !== selectedState.toLowerCase()) return false;
      }

      if (selectedStatus !== "all") {
        const st = o.status.toLowerCase();
        if (selectedStatus === "pending" && ["dispatched", "shipped", "delivered"].includes(st)) return false;
        if (selectedStatus === "dispatched" && !["dispatched", "shipped"].includes(st)) return false;
        if (selectedStatus === "delivered" && st !== "delivered") return false;
      }

      return true;
    });
  }, [orders, search, selectedState, selectedStatus, tierFilter]);

  // Grouped by State for Logistics
  const stateGroups = useMemo(() => {
    const map = new Map<
      string,
      { state: string; count: number; totalQty: number; items: FulfillmentOrder[] }
    >();

    filteredOrders.forEach((o) => {
      const stateKey = o.buyer.state || "Unspecified Location";
      if (!map.has(stateKey)) {
        map.set(stateKey, { state: stateKey, count: 0, totalQty: 0, items: [] });
      }
      const g = map.get(stateKey)!;
      g.count += 1;
      g.totalQty += o.quantity;
      g.items.push(o);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Overall KPIs
  const totalPackages = orders.reduce((sum, o) => sum + o.quantity, 0);
  const pendingPackages = orders.filter(
    (o) => !["dispatched", "shipped", "delivered"].includes(o.status.toLowerCase())
  ).length;
  const dispatchedPackages = orders.filter((o) =>
    ["dispatched", "shipped"].includes(o.status.toLowerCase())
  ).length;
  const deliveredPackages = orders.filter((o) => o.status.toLowerCase() === "delivered").length;

  // Copy WhatsApp broadcast text
  const handleCopyWhatsAppManifest = () => {
    let text = `📦 *AGROHEAL MUSHROOM POWER STARTER PACK DISPATCH MANIFEST*\n`;
    text += `Generated: ${new Date().toLocaleDateString("en-GB")}\n`;
    text += `Total Packages to Deliver: ${filteredOrders.length}\n\n`;

    stateGroups.forEach((g) => {
      text += `📍 *${g.state.toUpperCase()} (${g.count} Recipients)*\n`;
      text += `───────────────────────\n`;
      g.items.forEach((item, idx) => {
        text += `${idx + 1}. *${item.buyer.fullName}* (${item.buyer.memberId})\n`;
        text += `   📞 Phone: ${item.buyer.phone || "No phone"}\n`;
        text += `   🏙️ LGA: ${item.buyer.lga || "Unspecified"}\n`;
        text += `   📦 Items: ${item.quantity}x ${item.productName}\n`;
        text += `   🏷️ Ref: ${item.transactionRef || "-"}\n\n`;
      });
      text += `\n`;
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    }
  };

  const handleExportExcel = () => {
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `Agroheal_Mushroom_Power_Fulfillment_${dateStamp}.xlsx`;

    const rows = filteredOrders.map((o, idx) => ({
      "S/N": idx + 1,
      "Member Name": o.buyer.fullName,
      "AGC Member ID": o.buyer.memberId,
      "Phone Number": o.buyer.phone,
      "Email Address": o.buyer.email,
      "State": o.buyer.state,
      "LGA": o.buyer.lga,
      "Product": o.productName,
      "Quantity": o.quantity,
      "Total Price (₦)": o.totalPrice,
      "Order Status": o.status,
      "Order Reference": o.transactionRef,
      "Order Date": o.createdAt ? formatWATDateTime(o.createdAt) : "",
    }));

    const summary = [
      { Metric: "Total Orders Exported", Value: filteredOrders.length },
      { Metric: "Total Package Quantity", Value: filteredOrders.reduce((sum, o) => sum + o.quantity, 0) },
      { Metric: "Filter State", Value: selectedState },
      { Metric: "Filter Status", Value: selectedStatus },
    ];

    exportToExcel({
      filename,
      sheets: [
        { sheetName: "Dispatch Manifest", data: rows },
        { sheetName: "Summary", data: summary },
      ],
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Orders &amp; Fulfillment Hub
              </h1>
              <p className="text-xs text-muted-foreground">
                Mushroom Power 100g Starter Packs and member product shipping manifest
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyWhatsAppManifest}
            className="h-8 gap-1.5 text-xs border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 font-semibold"
          >
            {copiedText ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied Manifest!
              </>
            ) : (
              <>
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Manifest
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 gap-1.5 text-xs border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Orders</span>
            <PackageCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">{orders.length}</div>
          <div className="text-[11px] text-muted-foreground">{totalPackages} total physical packages</div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-500">
            <span>Pending Dispatch</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-500">{pendingPackages}</div>
          <div className="text-[11px] text-muted-foreground">Awaiting shipment packaging</div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-500">
            <span>In Transit</span>
            <Truck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-500">{dispatchedPackages}</div>
          <div className="text-[11px] text-muted-foreground">Dispatched with courier</div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-500">
            <span>Delivered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-500">{deliveredPackages}</div>
          <div className="text-[11px] text-muted-foreground">Successfully received</div>
        </div>
      </div>

      {/* Smart Filters & View Mode Switcher */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, phone, LGA, order ref..."
              className="pl-9 h-9 text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* State Filter */}
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  📍 All States ({distinctStates.length})
                </SelectItem>
                {distinctStates.map((st) => (
                  <SelectItem key={st} value={st} className="text-xs">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  🌐 All Statuses
                </SelectItem>
                <SelectItem value="pending" className="text-xs">
                  ⏳ Pending Dispatch
                </SelectItem>
                <SelectItem value="dispatched" className="text-xs">
                  🚚 Dispatched
                </SelectItem>
                <SelectItem value="delivered" className="text-xs">
                  ✅ Delivered
                </SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
              <Button
                type="button"
                variant={viewMode === "groups" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("groups")}
                className="h-8 px-2.5 text-xs gap-1"
                title="Group by State & LGA"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">By State</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-2.5 text-xs gap-1"
                title="Full Manifest Table"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>
            Showing <strong className="text-foreground">{filteredOrders.length}</strong> matching shipment orders
          </span>
          <span>
            Physical Packs:{" "}
            <strong className="text-foreground font-mono">
              {filteredOrders.reduce((sum, o) => sum + o.quantity, 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-20 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading fulfillment manifest...
        </div>
      ) : viewMode === "groups" ? (
        /* State Logistics Groups View */
        <div className="flex flex-col gap-4">
          {stateGroups.map((group) => (
            <div
              key={group.state}
              className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between bg-muted/40 px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm text-foreground">{group.state}</span>
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                    {group.count} {group.count === 1 ? "order" : "orders"} &middot; {group.totalQty} {group.totalQty === 1 ? "pack" : "packs"}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {group.items.map((order, idx) => {
                  const isCopied = copiedId === order.id;
                  const cleanPhone = order.buyer.phone?.replace(/[^0-9]/g, "");
                  const waLink = cleanPhone ? `https://wa.me/234${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}` : null;

                  return (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3 hover:bg-muted/15 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-mono font-semibold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">
                              {order.buyer.fullName}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              ({order.buyer.memberId})
                            </span>
                            {order.is_legacy ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Legacy Founding
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Live Platform
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            {order.buyer.phone && (
                              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                                <Phone className="h-3 w-3" />
                                <span>{order.buyer.phone}</span>
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-1 inline-flex items-center text-[10px] bg-emerald-500/10 text-emerald-400 px-1 rounded hover:underline"
                                    title="Open WhatsApp chat"
                                  >
                                    Chat <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                                  </a>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{order.buyer.lga || "LGA Not Set"}, {order.buyer.state}</span>
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground">
                              Ref: {order.transactionRef}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        {/* Status Select */}
                        <Select
                          value={order.status.toLowerCase()}
                          onValueChange={(val) =>
                            handleUpdateStatus(
                              order.id,
                              val,
                              order.orderOrigin || (order.is_legacy ? "legacy_checkout" : "order")
                            )
                          }
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="h-7 w-[125px] text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid" className="text-xs">
                              ⏳ Pending
                            </SelectItem>
                            <SelectItem value="dispatched" className="text-xs">
                              🚚 Dispatched
                            </SelectItem>
                            <SelectItem value="delivered" className="text-xs">
                              ✅ Delivered
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(
                                `${order.buyer.fullName} (${order.buyer.phone}) - ${order.buyer.lga}, ${order.buyer.state} [${order.productName}]`
                              );
                              setCopiedId(order.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Copy delivery details"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {stateGroups.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
              No orders found matching the filter criteria.
            </div>
          )}
        </div>
      ) : (
        /* Full Manifest Table View */
        <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
          <Table className="w-full text-xs">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40">
                <TableHead className="py-2.5 px-3 font-semibold">S/N</TableHead>
                <TableHead className="py-2.5 px-3 font-semibold">Recipient / Buyer</TableHead>
                <TableHead className="py-2.5 px-3 font-semibold">Destination (State / LGA)</TableHead>
                <TableHead className="py-2.5 px-3 font-semibold">Product &amp; Qty</TableHead>
                <TableHead className="py-2.5 px-3 font-semibold">Reference &amp; Date</TableHead>
                <TableHead className="py-2.5 px-3 font-semibold">Status</TableHead>
                <TableHead className="py-2.5 px-3 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {filteredOrders.map((o, idx) => {
                const cleanPhone = o.buyer.phone?.replace(/[^0-9]/g, "");
                const waLink = cleanPhone ? `https://wa.me/234${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}` : null;

                return (
                  <TableRow key={o.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-2.5 px-3 font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground">{o.buyer.fullName}</span>
                        {o.is_legacy ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Legacy
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">{o.buyer.memberId}</div>
                      {o.buyer.phone && (
                        <div className="text-[11px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> {o.buyer.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{o.buyer.state}</div>
                      <div className="text-[11px] text-muted-foreground">{o.buyer.lga || "Unspecified"}</div>
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{o.productName}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">{o.quantity} unit ({o.quantity * 100}g)</div>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 font-mono text-[11px]">
                      <div className="text-foreground">{o.transactionRef}</div>
                      <div className="text-muted-foreground">{o.createdAt ? formatWATDateTime(o.createdAt) : ""}</div>
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <Select
                        value={o.status.toLowerCase()}
                        onValueChange={(val) =>
                          handleUpdateStatus(
                            o.id,
                            val,
                            o.orderOrigin || (o.is_legacy ? "legacy_checkout" : "order")
                          )
                        }
                        disabled={updatingId === o.id}
                      >
                        <SelectTrigger className="h-7 w-[115px] text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid" className="text-xs">
                            ⏳ Pending
                          </SelectItem>
                          <SelectItem value="dispatched" className="text-xs">
                            🚚 Dispatched
                          </SelectItem>
                          <SelectItem value="delivered" className="text-xs">
                            ✅ Delivered
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-right">
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500 hover:underline"
                        >
                          WhatsApp <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
