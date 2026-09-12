import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Receipt,
  ShoppingBag,
  Coins,
  DollarSign,
  Calendar,
  Users,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Phone,
  Mail,
  User,
  History,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/components/ui/ToastComponent";
import { formatNaira } from "@shared/businessRules";
import { isPlatformAdmin, SUPER_DEV_EMAIL } from "@shared";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface FarmGroup {
  id: string;
  name: string;
  coordinator_id: string;
  project_category: string;
  coordinator_name?: string;
  coordinator_phone?: string;
  coordinator_email?: string;
}

interface FarmExpense {
  id: string;
  farm_id: string;
  category: string;
  amount: number;
  description?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

interface FarmSale {
  id: string;
  farm_id: string;
  produce_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  buyer_name?: string;
  sales_channel?: string;
  sale_date: string;
  description?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

interface UserSlotRecord {
  farm_id?: string;
  slots: number;
  category: string;
}

const MUSHROOM_EXPENSE_CATS = [
  "Mushroom housing & climate maintenance",
  "Inoculated substrate fruiting bags",
  "Cluster labor & staff salaries",
  "Humidity & temperature controls",
  "Packaging & cold storage",
  "Transportation & logistics",
  "Miscellaneous operations",
];

const GINGER_EXPENSE_CATS = [
  "Ginger seedlings & compost fertilizer",
  "Chili pepper intercrop defense",
  "Bush clearing & de-stumping",
  "Borehole & drip irrigation",
  "Solar pump & tank maintenance",
  "Farm labor",
  "Biofungicide & biopesticide",
  "Coordinator & logistics",
  "Miscellaneous",
];

const MUSHROOM_PRODUCE_ITEMS = [
  "Fresh Oyster Mushrooms",
  "Dried Oyster Mushrooms",
  "Mushroom Spawn",
  "Spent Substrate / Bio-Compost",
  "Custom Produce / Other",
];

const GINGER_PRODUCE_ITEMS = [
  "Fresh Ginger Rhizomes",
  "Dried Split Ginger",
  "Chili Pepper Intercrop",
  "Custom Produce / Other",
];

const SALES_CHANNELS = [
  "Off-taker Agreement",
  "Supermarket Distribution",
  "Wholesale Fresh Market",
  "Direct Consumer / Retail",
  "Food Processor",
  "Farm Gate",
  "Other",
];

export default function MyFarmSlots() {
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile } = useAuth();
  const currentUserId = authProfile?.id || authUser?.id;

  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<FarmGroup[]>([]);
  const [userSlotsByFarm, setUserSlotsByFarm] = useState<Record<string, number>>({});
  const [totalUserSlots, setTotalUserSlots] = useState<number>(0);
  const [expandedFarmId, setExpandedFarmId] = useState<string | null>(null);

  // Ledgers by farm_id
  const [expensesByFarm, setExpensesByFarm] = useState<Record<string, FarmExpense[]>>({});
  const [salesByFarm, setSalesByFarm] = useState<Record<string, FarmSale[]>>({});

  // Active Tab inside expanded card: 'ledger' | 'overview' | 'audit'
  const [activeTabByFarm, setActiveTabByFarm] = useState<Record<string, "ledger" | "overview" | "audit">>({});

  // Ledger sub-view: 'expenses' | 'sales'
  const [ledgerSubView, setLedgerSubView] = useState<"sales" | "expenses">("sales");

  // User's specific member record from farm_records for historical audit
  const [userRecordByFarm, setUserRecordByFarm] = useState<Record<string, any>>({});

  // Discrepancy Modal
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState<{
    farmId: string;
    farmName: string;
    category: string;
  } | null>(null);
  const [discrepancyNote, setDiscrepancyNote] = useState("");

  // Modals for Coordinator Entry
  const [showExpenseModal, setShowExpenseModal] = useState<string | null>(null); // farmId or null
  const [showSaleModal, setShowSaleModal] = useState<string | null>(null); // farmId or null

  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    description: "",
  });

  // Sale form
  const [saleForm, setSaleForm] = useState({
    produce_name: "",
    quantity: "",
    unit: "kg",
    unit_price: "",
    amount: "",
    sales_channel: SALES_CHANNELS[0],
    buyer_name: "",
    sale_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [submittingRecord, setSubmittingRecord] = useState(false);

  // Load user farms and slots
  const loadData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch user's active slot subscriptions
      const { data: slotSubs } = await supabase
        .from("slot_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");

      // 2. Fetch user's member records in farm_records (case-insensitive email)
      const { data: memberRecords } = await supabase
        .from("farm_records")
        .select("farm_id, farm_slots, email, name, phone, months_farm_setup, months_farm_support, absentee_fine, project_category, created_at")
        .ilike("email", user.email || "");

      // 3. Fetch all farm groups from database
      const { data: allDbFarms } = await supabase
        .from("farm_groups")
        .select("*")
        .order("name", { ascending: true });

      const allFarms = allDbFarms || [];

      // Map slots held
      const slotsMap: Record<string, number> = {};
      const recMap: Record<string, any> = {};
      let totalSlotsCount = 0;

      (slotSubs || []).forEach((sub) => {
        const qty = sub.slots || 1;
        totalSlotsCount += qty;
      });

      (memberRecords || []).forEach((r) => {
        if (r.farm_id) {
          slotsMap[r.farm_id] = (slotsMap[r.farm_id] || 0) + (r.farm_slots || 0);
          recMap[r.farm_id] = r;
        }
      });
      setUserRecordByFarm(recMap);

      const isAdminOrDev =
        user.email?.toLowerCase() === SUPER_DEV_EMAIL ||
        isPlatformAdmin(authProfile?.role);

      // Aggregate all relevant farm groups
      const farmList: FarmGroup[] = [];
      const farmIds = new Set<string>();

      if (isAdminOrDev) {
        // Platform Admins and Super Dev have full cluster visibility
        allFarms.forEach((f) => {
          if (!farmIds.has(f.id)) {
            farmIds.add(f.id);
            farmList.push(f);
            if (!slotsMap[f.id]) {
              slotsMap[f.id] = totalSlotsCount > 0 ? totalSlotsCount : 5;
            }
          }
        });
        if (totalSlotsCount === 0) {
          totalSlotsCount = 5;
        }
      } else {
        // Regular members: show groups where they have records, are coordinator, or have matching subscriptions
        allFarms.forEach((f) => {
          const isCoord = f.coordinator_id === user.id;
          const hasRecord = (memberRecords || []).some((r) => r.farm_id === f.id);
          const hasSubCategory = (slotSubs || []).some(
            (s) => s.project_category && s.project_category.toLowerCase() === (f.project_category || "").toLowerCase(),
          );

          if ((isCoord || hasRecord || hasSubCategory) && !farmIds.has(f.id)) {
            farmIds.add(f.id);
            farmList.push(f);
          }
        });

        // Fallback: If user holds slots but no specific cluster match, show the primary Mushroom cluster
        if (farmList.length === 0 && totalSlotsCount > 0 && allFarms.length > 0) {
          const defaultFarm =
            allFarms.find((f) => f.project_category === "Mushroom Village") || allFarms[0];
          farmList.push(defaultFarm);
          farmIds.add(defaultFarm.id);
          slotsMap[defaultFarm.id] = totalSlotsCount;
        }
      }

      // Fetch coordinator profiles for each farm
      const coordinatorIds = farmList.map((f) => f.coordinator_id).filter(Boolean);
      if (coordinatorIds.length > 0) {
        const { data: coordProfiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, phone, email")
          .in("id", coordinatorIds);

        const coordMap = new Map((coordProfiles || []).map((p) => [p.id, p]));
        farmList.forEach((f) => {
          const cp = coordMap.get(f.coordinator_id);
          if (cp) {
            f.coordinator_name = `${cp.first_name || ""} ${cp.last_name || ""}`.trim() || "Assigned Coordinator";
            f.coordinator_phone = cp.phone;
            f.coordinator_email = cp.email;
          }
        });
      }

      setFarms(farmList);
      setUserSlotsByFarm(slotsMap);
      setTotalUserSlots(Math.max(totalSlotsCount, Object.values(slotsMap).reduce((a, b) => a + b, 0)));

      // If farms exist, load expenses and sales for all of them
      if (farmList.length > 0) {
        setExpandedFarmId(farmList[0].id);
        const allFarmIds = farmList.map((f) => f.id);

        const [expRes, salesRes] = await Promise.all([
          supabase
            .from("farm_expenses")
            .select("*")
            .in("farm_id", allFarmIds)
            .order("created_at", { ascending: false }),
          supabase
            .from("farm_sales")
            .select("*")
            .in("farm_id", allFarmIds)
            .order("sale_date", { ascending: false }),
        ]);

        const expMap: Record<string, FarmExpense[]> = {};
        (expRes.data || []).forEach((exp) => {
          if (!expMap[exp.farm_id]) expMap[exp.farm_id] = [];
          expMap[exp.farm_id].push(exp);
        });
        setExpensesByFarm(expMap);

        const salesMap: Record<string, FarmSale[]> = {};
        (salesRes.data || []).forEach((sale) => {
          if (!salesMap[sale.farm_id]) salesMap[sale.farm_id] = [];
          salesMap[sale.farm_id].push(sale);
        });
        setSalesByFarm(salesMap);
      }
    } catch (err) {
      console.error("Error loading user farm slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate totals for a given farm
  const getFarmFinancials = (farmId: string) => {
    const expenses = expensesByFarm[farmId] || [];
    const sales = salesByFarm[farmId] || [];

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const netBalance = totalSales - totalExpenses;

    return { totalExpenses, totalSales, netBalance };
  };

  // Toggle farm expansion
  const toggleExpand = (farmId: string) => {
    setExpandedFarmId((prev) => (prev === farmId ? null : farmId));
  };

  // Switch tab in card
  const setFarmTab = (farmId: string, tab: "ledger" | "overview" | "audit") => {
    setActiveTabByFarm((prev) => ({ ...prev, [farmId]: tab }));
  };

  // Coordinator: Submit new Expense
  const handleCreateExpense = async (farmId: string) => {
    if (!expenseForm.category) {
      showToast("Please select an expense category", "error");
      return;
    }
    const numAmount = parseFloat(expenseForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("Please enter a valid expense amount", "error");
      return;
    }

    setSubmittingRecord(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const auditString = `[Farm Coordinator] ${
        authProfile?.first_name || user?.user_metadata?.first_name || "Coordinator"
      } (${user?.email || ""})`;

      const { data, error } = await supabase
        .from("farm_expenses")
        .insert([
          {
            farm_id: farmId,
            category: expenseForm.category,
            amount: numAmount,
            description: expenseForm.description?.trim() || null,
            created_by: user?.id,
            created_by_name: auditString,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      showToast("Operating expense recorded successfully", "success");
      setExpensesByFarm((prev) => ({
        ...prev,
        [farmId]: [data, ...(prev[farmId] || [])],
      }));
      setShowExpenseModal(null);
      setExpenseForm({ category: "", amount: "", description: "" });
    } catch (err: any) {
      console.error("Failed to add expense:", err);
      showToast(err.message || "Failed to record expense", "error");
    } finally {
      setSubmittingRecord(false);
    }
  };

  // Coordinator: Submit new Produce Sale
  const handleCreateSale = async (farmId: string) => {
    if (!saleForm.produce_name) {
      showToast("Please select or enter produce name", "error");
      return;
    }
    const numQty = parseFloat(saleForm.quantity);
    const numPrice = parseFloat(saleForm.unit_price);
    const numTotal = parseFloat(saleForm.amount) || numQty * numPrice;

    if (isNaN(numQty) || numQty <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }
    if (isNaN(numTotal) || numTotal <= 0) {
      showToast("Please enter a valid price/amount", "error");
      return;
    }

    setSubmittingRecord(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const auditString = `[Farm Coordinator] ${
        authProfile?.first_name || user?.user_metadata?.first_name || "Coordinator"
      } (${user?.email || ""})`;

      const { data, error } = await supabase
        .from("farm_sales")
        .insert([
          {
            farm_id: farmId,
            produce_name: saleForm.produce_name,
            quantity: numQty,
            unit: saleForm.unit,
            unit_price: isNaN(numPrice) ? 0 : numPrice,
            amount: numTotal,
            sales_channel: saleForm.sales_channel,
            buyer_name: saleForm.buyer_name?.trim() || null,
            sale_date: saleForm.sale_date,
            description: saleForm.description?.trim() || null,
            created_by: user?.id,
            created_by_name: auditString,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      showToast("Produce sale logged successfully", "success");
      setSalesByFarm((prev) => ({
        ...prev,
        [farmId]: [data, ...(prev[farmId] || [])],
      }));
      setShowSaleModal(null);
      setSaleForm({
        produce_name: "",
        quantity: "",
        unit: "kg",
        unit_price: "",
        amount: "",
        sales_channel: SALES_CHANNELS[0],
        buyer_name: "",
        sale_date: new Date().toISOString().split("T")[0],
        description: "",
      });
    } catch (err: any) {
      console.error("Failed to add sale:", err);
      showToast(err.message || "Failed to record sale", "error");
    } finally {
      setSubmittingRecord(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50/50">
        <LoadingSpinner />
      </div>
    );
  }

  const hasAnySlotsOrFarms = totalUserSlots > 0 || farms.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Production Portfolio &amp; Cluster Audits</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Manage My Farm Slots
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-1 max-w-2xl">
              Inspect your subscribed production clusters, verify biological unit allocations, and
              audit real-time crop sales and operational expenses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard/farm-operations/buy-slots">
              <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm h-10 rounded-xl shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Browse &amp; Buy More Slots
              </Button>
            </Link>
          </div>
        </div>

        {/* Portfolio Stats Row */}
        {hasAnySlotsOrFarms && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Slots */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block">Total Slots Owned</span>
                <span className="text-2xl font-black text-gray-900">{totalUserSlots}</span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                  Managed Production
                </span>
              </div>
            </div>

            {/* Biological Fruiting Bags in Production */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block">Fruiting Bags Active</span>
                <span className="text-2xl font-black text-gray-900">
                  {totalUserSlots * 2}
                  <span className="text-xs font-medium text-gray-400 ml-1">bags</span>
                </span>
                <span className="text-[11px] text-teal-700 font-semibold block mt-0.5">
                  Doubling to {totalUserSlots * 4} in Cycle 1
                </span>
              </div>
            </div>

            {/* Active Subscribed Clusters */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block">Active Farm Clusters</span>
                <span className="text-2xl font-black text-gray-900">{farms.length}</span>
                <span className="text-[11px] text-amber-800 font-semibold block mt-0.5">
                  Community Operations
                </span>
              </div>
            </div>

            {/* Maintenance Policy Badge */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block">Maintenance Invoices</span>
                <span className="text-lg font-extrabold text-blue-900">Zero Monthly Fees</span>
                <span className="text-[11px] text-blue-600 block mt-0.5">
                  100% Harvest-Backed Return
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State: If user has no slots/farms */}
        {!hasAnySlotsOrFarms && (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center max-w-2xl mx-auto shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <Sprout className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No Active Farm Slots Found
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              You do not have any subscribed farm production slots yet. Secure your production slot
              in our active Mushroom Village cluster to start earning from biological crop yields
              with zero monthly maintenance fees.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/dashboard/buy-slots">
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 h-11 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse &amp; Buy Farm Slots
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Subscribed Clusters List */}
        {hasAnySlotsOrFarms && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                Subscribed Agricultural Clusters
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                Showing {farms.length} {farms.length === 1 ? "Cluster" : "Clusters"}
              </span>
            </div>

            <div className="space-y-5">
              {farms.map((farm) => {
                const isExpanded = expandedFarmId === farm.id;
                const isCoordinator =
                  farm.coordinator_id === currentUserId ||
                  isPlatformAdmin(authProfile?.role) ||
                  authUser?.email?.toLowerCase() === SUPER_DEV_EMAIL;
                const farmSlots = userSlotsByFarm[farm.id] || totalUserSlots || 1;
                const fruitingBags = farmSlots * 2;
                const currentTab = activeTabByFarm[farm.id] || "ledger";
                const { totalExpenses, totalSales, netBalance } = getFarmFinancials(farm.id);
                const farmExpenses = expensesByFarm[farm.id] || [];
                const farmSales = salesByFarm[farm.id] || [];

                return (
                  <div
                    key={farm.id}
                    className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Card Top Banner / Summary Header */}
                    <div className="p-5 md:p-6 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/60 border-b border-gray-200/80">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Title & Metadata */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-0.5">
                              {farm.project_category || "Mushroom Village"}
                            </Badge>

                            {isCoordinator ? (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                                You are Farm Coordinator
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 border-gray-200 text-xs">
                                Subscribed Producer
                              </Badge>
                            )}
                          </div>

                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{farm.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>Coordinator: {farm.coordinator_name || "Assigned Cluster Lead"}</span>
                              {farm.coordinator_phone && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-600 font-mono">{farm.coordinator_phone}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Quick Stats Pill */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2 text-center">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                              Your Allocation
                            </span>
                            <span className="text-base font-extrabold text-emerald-950">
                              {farmSlots} {farmSlots === 1 ? "Slot" : "Slots"}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium block">
                              {farm.project_category === "Mushroom Village"
                                ? `(${fruitingBags} Fruiting Bags)`
                                : `(${farmSlots} Production Slots)`}
                            </span>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                              Net Farm Balance
                            </span>
                            <span
                              className={`text-base font-extrabold ${
                                netBalance >= 0 ? "text-emerald-700" : "text-amber-700"
                              }`}
                            >
                              {formatNaira(netBalance)}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              Revenue: {formatNaira(totalSales)}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            onClick={() => toggleExpand(farm.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-xl h-10 px-4 font-semibold shadow-2xs"
                          >
                            {isExpanded ? (
                              <>
                                <span className="text-xs font-semibold mr-1.5">Collapse</span>
                                <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-semibold mr-1.5">Inspect Ledger</span>
                                <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-100 p-5 md:p-6 space-y-6"
                        >
                          {/* Inner Tabs Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setFarmTab(farm.id, "ledger")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                  currentTab === "ledger"
                                    ? "bg-emerald-800 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                Real-Time Financial Ledger
                              </button>

                              <button
                                type="button"
                                onClick={() => setFarmTab(farm.id, "overview")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                  currentTab === "overview"
                                    ? "bg-emerald-800 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                <Sprout className="w-3.5 h-3.5" />
                                Agronomy &amp; Production Details
                              </button>

                              <button
                                type="button"
                                onClick={() => setFarmTab(farm.id, "audit")}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                  currentTab === "audit"
                                    ? "bg-emerald-800 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                <History className="w-3.5 h-3.5" />
                                My Verified Holdings &amp; Audit
                              </button>
                            </div>

                            {/* Coordinator Quick Modals Trigger */}
                            {isCoordinator && currentTab === "ledger" && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setShowExpenseModal(farm.id)}
                                  className="bg-[#1b4332] hover:bg-[#143225] text-white border border-emerald-700/60 text-xs h-9 rounded-xl font-medium shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Record Expense
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setShowSaleModal(farm.id)}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 rounded-xl font-medium"
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Record Produce Sale
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* TAB 1: FINANCIAL TRANSPARENCY LEDGER */}
                          {currentTab === "ledger" && (
                            <div className="space-y-6">
                              {/* Financial KPI Summary Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                  <div className="flex items-center justify-between text-emerald-800 mb-1">
                                    <span className="text-xs font-semibold">Total Harvest Revenue</span>
                                    <ShoppingBag className="w-4 h-4" />
                                  </div>
                                  <div className="text-2xl font-black text-emerald-950">
                                    {formatNaira(totalSales)}
                                  </div>
                                  <span className="text-[11px] text-emerald-700 mt-1 block">
                                    {farmSales.length} {farmSales.length === 1 ? "Sale" : "Sales"} Logged
                                  </span>
                                </div>

                                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                                  <div className="flex items-center justify-between text-amber-800 mb-1">
                                    <span className="text-xs font-semibold">Total Operating Expenses</span>
                                    <Receipt className="w-4 h-4" />
                                  </div>
                                  <div className="text-2xl font-black text-amber-950">
                                    {formatNaira(totalExpenses)}
                                  </div>
                                  <span className="text-[11px] text-amber-700 mt-1 block">
                                    {farmExpenses.length} {farmExpenses.length === 1 ? "Expense" : "Expenses"} Logged
                                  </span>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                  <div className="flex items-center justify-between text-slate-700 mb-1">
                                    <span className="text-xs font-semibold">Net Operating Cash</span>
                                    <Coins className="w-4 h-4" />
                                  </div>
                                  <div
                                    className={`text-2xl font-black ${
                                      netBalance >= 0 ? "text-emerald-700" : "text-amber-700"
                                    }`}
                                  >
                                    {formatNaira(netBalance)}
                                  </div>
                                  <span className="text-[11px] text-gray-500 mt-1 block">
                                    Cash Surplus / Deficit
                                  </span>
                                </div>
                              </div>

                              {/* Ledger Sub-switch: Sales vs Expenses */}
                              <div className="flex items-center justify-between gap-4 pt-2">
                                <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() => setLedgerSubView("sales")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                      ledgerSubView === "sales"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                    }`}
                                  >
                                    Produce Sales Ledger ({farmSales.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLedgerSubView("expenses")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                      ledgerSubView === "expenses"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                    }`}
                                  >
                                    Operating Expenses Ledger ({farmExpenses.length})
                                  </button>
                                </div>

                                <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  <span>Transparent, immutable audit trail</span>
                                </div>
                              </div>

                              {/* SUB-VIEW 1: PRODUCE SALES LEDGER */}
                              {ledgerSubView === "sales" && (
                                <div className="space-y-3">
                                  {farmSales.length === 0 ? (
                                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                                      <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-xs font-semibold text-gray-700">
                                        No produce sales recorded yet
                                      </p>
                                      <p className="text-[11px] text-gray-500 mt-0.5">
                                        Harvest proceeds from supermarket distribution and off-takers will be logged here.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                      <table className="w-full text-left text-xs text-gray-700">
                                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                          <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Produce Item</th>
                                            <th className="p-3">Quantity</th>
                                            <th className="p-3">Unit Price</th>
                                            <th className="p-3">Total Amount</th>
                                            <th className="p-3">Channel / Buyer</th>
                                            <th className="p-3">Audited By</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {farmSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-gray-50/80">
                                              <td className="p-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                                {sale.sale_date}
                                              </td>
                                              <td className="p-3 font-medium text-gray-900">
                                                {sale.produce_name}
                                                {sale.description && (
                                                  <span className="block text-[10px] text-gray-500 font-normal">
                                                    {sale.description}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="p-3 font-semibold text-gray-800 whitespace-nowrap">
                                                {sale.quantity} {sale.unit}
                                              </td>
                                              <td className="p-3 text-gray-600 whitespace-nowrap">
                                                {formatNaira(sale.unit_price)}
                                              </td>
                                              <td className="p-3 font-bold text-emerald-800 whitespace-nowrap">
                                                {formatNaira(sale.amount)}
                                              </td>
                                              <td className="p-3 text-gray-600">
                                                <Badge variant="outline" className="text-[10px] font-normal">
                                                  {sale.sales_channel || "Off-taker"}
                                                </Badge>
                                                {sale.buyer_name && (
                                                  <span className="block text-[10px] text-gray-500 mt-0.5">
                                                    {sale.buyer_name}
                                                  </span>
                                                )}
                                              </td>
                                              <td className="p-3 text-[11px] text-gray-500 max-w-[180px] truncate" title={sale.created_by_name}>
                                                {sale.created_by_name || "Farm Coordinator"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* SUB-VIEW 2: OPERATING EXPENSES LEDGER */}
                              {ledgerSubView === "expenses" && (
                                <div className="space-y-3">
                                  {farmExpenses.length === 0 ? (
                                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                                      <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-xs font-semibold text-gray-700">
                                        No operational expenses recorded yet
                                      </p>
                                      <p className="text-[11px] text-gray-500 mt-0.5">
                                        Cluster operational expenditures such as substrates, climate care, and housing will appear here.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                      <table className="w-full text-left text-xs text-gray-700">
                                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                          <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Expense Category</th>
                                            <th className="p-3">Description</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Audited By</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {farmExpenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-gray-50/80">
                                              <td className="p-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                                {exp.created_at ? exp.created_at.split("T")[0] : "—"}
                                              </td>
                                              <td className="p-3 font-semibold text-gray-900">
                                                {exp.category}
                                              </td>
                                              <td className="p-3 text-gray-600">
                                                {exp.description || "—"}
                                              </td>
                                              <td className="p-3 font-bold text-amber-800 whitespace-nowrap">
                                                {formatNaira(exp.amount)}
                                              </td>
                                              <td className="p-3 text-[11px] text-gray-500 max-w-[180px] truncate" title={exp.created_by_name}>
                                                {exp.created_by_name || "Farm Coordinator"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 2: AGRONOMY & CLUSTER DETAILS */}
                          {currentTab === "overview" && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Production Cycle & Specifications */}
                                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Sprout className="w-4 h-4 text-emerald-700" />
                                    Biological Production Specs
                                  </h4>
                                  <div className="space-y-2.5 text-xs text-gray-600">
                                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                                      <span className="text-gray-500">Crop Category:</span>
                                      <span className="font-semibold text-gray-900">{farm.project_category}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                                      <span className="text-gray-500">Your Active Slots:</span>
                                      <span className="font-semibold text-gray-900">{farmSlots}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                                      <span className="text-gray-500">Biological Units:</span>
                                      <span className="font-semibold text-emerald-800 font-bold">
                                        {fruitingBags} Fruiting Bags (Expands to {farmSlots * 4} bags)
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                                      <span className="text-gray-500">Production Cycle:</span>
                                      <span className="font-semibold text-gray-900">60–90 Days (Multi-flush harvest)</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-gray-500">Monthly Support Fee:</span>
                                      <span className="font-bold text-emerald-700">₦0.00 (Zero Recurring Fees)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Coordinator & Cluster Support */}
                                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-700" />
                                    Cluster Management &amp; Support
                                  </h4>
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    Each Agroheal cluster is managed by a trained Farm Coordinator responsible
                                    for climate oversight, substrate hydration, harvest aggregation, and
                                    direct off-taker fulfillment.
                                  </p>

                                  <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs space-y-1.5">
                                    <div className="font-semibold text-gray-900">
                                      Lead Coordinator: {farm.coordinator_name || "Assigned Cluster Lead"}
                                    </div>
                                    {farm.coordinator_phone && (
                                      <div className="text-gray-600 flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{farm.coordinator_phone}</span>
                                      </div>
                                    )}
                                    {farm.coordinator_email && (
                                      <div className="text-gray-600 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{farm.coordinator_email}</span>
                                      </div>
                                    )}
                                  </div>

                                  {isCoordinator && (
                                    <div className="pt-2">
                                      <Link to="/dashboard/group-farm-accounts">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
                                        >
                                          Open Detailed Member Roster
                                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                        </Button>
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TAB 3: MY VERIFIED HOLDINGS & AUDIT */}
                          {currentTab === "audit" && (
                            <div className="space-y-6">
                              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                                    <span className="text-sm font-bold text-emerald-950">
                                      Your Verified Allocation in {farm.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-emerald-800 leading-relaxed">
                                    Your tangible agricultural production assets are 100% verified. Under AgroHeal's new operational model, zero recurring monthly support fees or maintenance charges will ever be levied.
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setShowDiscrepancyModal({
                                      farmId: farm.id,
                                      farmName: farm.name,
                                      category: farm.project_category,
                                    })
                                  }
                                  variant="outline"
                                  className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100/80 text-xs font-semibold h-9 rounded-xl flex items-center gap-1.5 flex-shrink-0"
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                  Report Record Discrepancy
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-white rounded-xl border border-gray-200">
                                  <span className="text-xs text-gray-500 font-medium block">Verified Slots Held</span>
                                  <span className="text-xl font-black text-gray-900 mt-1 block">
                                    {farmSlots} {farmSlots === 1 ? "Slot" : "Slots"}
                                  </span>
                                  <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                                    {farm.project_category === "Mushroom Village"
                                      ? `${fruitingBags} Fruiting Bags`
                                      : `${farmSlots} Production Slots`}
                                  </span>
                                </div>

                                <div className="p-4 bg-white rounded-xl border border-gray-200">
                                  <span className="text-xs text-gray-500 font-medium block">Official Unit Rate</span>
                                  <span className="text-xl font-black text-gray-900 mt-1 block">
                                    {farm.project_category === "Mushroom Village" ? "₦5,000" : "₦33,000"}
                                    <span className="text-xs font-normal text-gray-400 ml-1">/ slot</span>
                                  </span>
                                  <span className="text-[11px] text-gray-500 block mt-0.5">
                                    Flat production asset rate
                                  </span>
                                </div>

                                <div className="p-4 bg-white rounded-xl border border-gray-200">
                                  <span className="text-xs text-gray-500 font-medium block">Total Asset Capital</span>
                                  <span className="text-xl font-black text-emerald-800 mt-1 block">
                                    {formatNaira(farmSlots * (farm.project_category === "Mushroom Village" ? 5000 : 33000))}
                                  </span>
                                  <span className="text-[11px] text-emerald-600 block mt-0.5">
                                    Harvest-backed principal
                                  </span>
                                </div>

                                <div className="p-4 bg-white rounded-xl border border-gray-200">
                                  <span className="text-xs text-gray-500 font-medium block">Audit Status</span>
                                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    Reconciled &amp; Active
                                  </span>
                                  <span className="text-[11px] text-gray-500 block mt-0.5">
                                    Pioneers Register 2026
                                  </span>
                                </div>
                              </div>

                              {/* Historical Legacy Payment Audit Table */}
                              {userRecordByFarm[farm.id] && (
                                <div className="p-5 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                      <History className="w-4 h-4 text-gray-600" />
                                      Historical Payment Audit (Legacy Breakdown)
                                    </h4>
                                    <span className="text-[11px] text-gray-500">
                                      Registered Name: <strong className="text-gray-800">{userRecordByFarm[farm.id].name}</strong>
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs">
                                      <span className="text-gray-500 block">Legacy Setup Fee Recorded</span>
                                      <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                                        {formatNaira(parseFloat(userRecordByFarm[farm.id].months_farm_setup || 0))}
                                      </span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs">
                                      <span className="text-gray-500 block">Legacy Support Fee Recorded</span>
                                      <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                                        {formatNaira(parseFloat(userRecordByFarm[farm.id].months_farm_support || 0))}
                                      </span>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs">
                                      <span className="text-gray-500 block">Absentee Fines Recorded</span>
                                      <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                                        {formatNaira(parseFloat(userRecordByFarm[farm.id].absentee_fine || 0))}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                                    * Historical payments made under the former monthly support structure have been reconciled and unified under your verified tangible slot portfolio. All recurring monthly maintenance dues have been discontinued.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* MODAL: Record Expense */}
                    {showExpenseModal === farm.id && (
                      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-bold text-gray-900">
                              Record Operating Expense
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowExpenseModal(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Category</Label>
                              <select
                                value={expenseForm.category}
                                onChange={(e) =>
                                  setExpenseForm((prev) => ({ ...prev, category: e.target.value }))
                                }
                                className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 bg-white"
                              >
                                <option value="">Select Category...</option>
                                {(farm.project_category === "Mushroom Village"
                                  ? MUSHROOM_EXPENSE_CATS
                                  : GINGER_EXPENSE_CATS
                                ).map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Amount (₦)</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 25000"
                                value={expenseForm.amount}
                                onChange={(e) =>
                                  setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))
                                }
                                className="mt-1 text-xs rounded-xl"
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">
                                Description / Vendor Notes
                              </Label>
                              <Input
                                placeholder="Details about this expenditure..."
                                value={expenseForm.description}
                                onChange={(e) =>
                                  setExpenseForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                className="mt-1 text-xs rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowExpenseModal(null)}
                              className="rounded-xl text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCreateExpense(farm.id)}
                              disabled={submittingRecord}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                            >
                              {submittingRecord ? "Saving..." : "Save Expense"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODAL: Record Produce Sale */}
                    {showSaleModal === farm.id && (
                      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-base font-bold text-gray-900">
                              Record Crop / Produce Sale
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowSaleModal(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <Label className="text-xs font-semibold text-gray-700">Produce Name</Label>
                              <select
                                value={saleForm.produce_name}
                                onChange={(e) =>
                                  setSaleForm((prev) => ({ ...prev, produce_name: e.target.value }))
                                }
                                className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 bg-white"
                              >
                                <option value="">Select Produce...</option>
                                {(farm.project_category === "Mushroom Village"
                                  ? MUSHROOM_PRODUCE_ITEMS
                                  : GINGER_PRODUCE_ITEMS
                                ).map((item) => (
                                  <option key={item} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Quantity</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 50"
                                value={saleForm.quantity}
                                onChange={(e) => {
                                  const q = e.target.value;
                                  const p = saleForm.unit_price;
                                  setSaleForm((prev) => ({
                                    ...prev,
                                    quantity: q,
                                    amount: q && p ? String(parseFloat(q) * parseFloat(p)) : prev.amount,
                                  }));
                                }}
                                className="mt-1 text-xs rounded-xl"
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Unit (kg/bags/crates)</Label>
                              <select
                                value={saleForm.unit}
                                onChange={(e) => setSaleForm((prev) => ({ ...prev, unit: e.target.value }))}
                                className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 bg-white"
                              >
                                <option value="kg">Kilograms (kg)</option>
                                <option value="crates">Crates</option>
                                <option value="bags">Bags</option>
                                <option value="packs">Packs</option>
                                <option value="tonnes">Tonnes</option>
                              </select>
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Unit Price (₦)</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 2500"
                                value={saleForm.unit_price}
                                onChange={(e) => {
                                  const p = e.target.value;
                                  const q = saleForm.quantity;
                                  setSaleForm((prev) => ({
                                    ...prev,
                                    unit_price: p,
                                    amount: q && p ? String(parseFloat(q) * parseFloat(p)) : prev.amount,
                                  }));
                                }}
                                className="mt-1 text-xs rounded-xl"
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Total Amount (₦)</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 125000"
                                value={saleForm.amount}
                                onChange={(e) =>
                                  setSaleForm((prev) => ({ ...prev, amount: e.target.value }))
                                }
                                className="mt-1 text-xs rounded-xl font-bold"
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Sales Channel</Label>
                              <select
                                value={saleForm.sales_channel}
                                onChange={(e) =>
                                  setSaleForm((prev) => ({ ...prev, sales_channel: e.target.value }))
                                }
                                className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 bg-white"
                              >
                                {SALES_CHANNELS.map((ch) => (
                                  <option key={ch} value={ch}>
                                    {ch}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Buyer Name / Company</Label>
                              <Input
                                placeholder="e.g. FreshMart Supermarket"
                                value={saleForm.buyer_name}
                                onChange={(e) =>
                                  setSaleForm((prev) => ({ ...prev, buyer_name: e.target.value }))
                                }
                                className="mt-1 text-xs rounded-xl"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <Label className="text-xs font-semibold text-gray-700">Sale Date</Label>
                              <Input
                                type="date"
                                value={saleForm.sale_date}
                                onChange={(e) =>
                                  setSaleForm((prev) => ({ ...prev, sale_date: e.target.value }))
                                }
                                className="mt-1 text-xs rounded-xl"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowSaleModal(null)}
                              className="rounded-xl text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCreateSale(farm.id)}
                              disabled={submittingRecord}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                            >
                              {submittingRecord ? "Saving..." : "Save Produce Sale"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* MODAL: Report Record Discrepancy */}
        {showDiscrepancyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Report Record Discrepancy
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {showDiscrepancyModal.farmName} ({showDiscrepancyModal.category})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscrepancyModal(null);
                    setDiscrepancyNote("");
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-gray-600 leading-relaxed">
                  If your physical slot count, payment receipts, or historical records differ from what is displayed on your dashboard, submit a direct notice to our farm audit desk.
                </p>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">Details of Discrepancy</Label>
                  <textarea
                    rows={4}
                    value={discrepancyNote}
                    onChange={(e) => setDiscrepancyNote(e.target.value)}
                    placeholder="e.g. I subscribed for 10 slots on May 12 via bank transfer (Ref #12345), but my dashboard shows 5 slots..."
                    className="w-full mt-1 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDiscrepancyModal(null);
                    setDiscrepancyNote("");
                  }}
                  className="w-full sm:w-auto rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const subject = encodeURIComponent(`Record Discrepancy: ${showDiscrepancyModal.farmName}`);
                    const body = encodeURIComponent(
                      `Hello AgroHeal Audit Team,\n\nI am reporting a record discrepancy for ${showDiscrepancyModal.farmName}.\n\nDetails:\n${discrepancyNote || "(No notes provided)"}\n\nUser Email: ${authProfile?.email || ""}`
                    );
                    window.open(`mailto:support@agroheal.solutions?subject=${subject}&body=${body}`, "_blank");
                    showToast("Email draft opened. Our audit desk will review your record.", "success");
                    setShowDiscrepancyModal(null);
                    setDiscrepancyNote("");
                  }}
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit via Email
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `*AgroHeal Audit Notice*\nFarm: ${showDiscrepancyModal.farmName}\nMember: ${authProfile?.full_name || authProfile?.first_name || "Member"}\nEmail: ${authProfile?.email || ""}\n\n*Discrepancy Details:*\n${discrepancyNote || "I would like to verify my slot records."}`
                    );
                    window.open(`https://wa.me/2348168055000?text=${text}`, "_blank");
                    setShowDiscrepancyModal(null);
                    setDiscrepancyNote("");
                  }}
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Submit via WhatsApp
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
