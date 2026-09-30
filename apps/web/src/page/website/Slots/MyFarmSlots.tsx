import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sprout, 
  TrendingUp, 
  AlertCircle, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Calendar, 
  PlusCircle, 
  ShoppingBag, 
  Receipt, 
  ShieldCheck, 
  Activity, 
  X,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFarmStore, type FarmClusterItem } from '@/store/useFarmStore';
import { supabase } from '@/lib/supabaseClient';
import { isLegacyMember } from '@shared/businessRules';
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const EXPENSE_CATEGORIES = [
  "Substrate & Raw Materials",
  "Labor & Farm Workers",
  "Utilities & Water Supply",
  "Mushroom Spawn / Inoculants",
  "Packaging, Crates & Labeling",
  "Logistics & Delivery Transport",
  "Facility Maintenance & Repairs",
  "Farm Equipment & Tools",
  "Miscellaneous Operating Cost"
];

const SALES_CHANNELS = [
  "Direct / Farm Gate Offtake",
  "Wholesale Market Buyer",
  "AgroHeal Central Processing",
  "Local Supermarket / Grocery",
  "Community Retail Stakeholder"
];

interface ClusterFinancialsLedgerProps {
  sub: FarmClusterItem;
  isUserCoordinator: boolean;
  onRecordExpense: () => void;
  onRecordSale: () => void;
}

const ClusterFinancialsLedger: React.FC<ClusterFinancialsLedgerProps> = ({
  sub,
  isUserCoordinator,
  onRecordExpense,
  onRecordSale,
}) => {
  const [filter, setFilter] = useState<'all' | 'expenses' | 'sales'>('all');

  const unifiedLedger = React.useMemo(() => {
    const list: Array<{
      date: string;
      rawDate: number;
      type: 'EXPENSE' | 'SALE';
      categoryOrProduce: string;
      descriptionOrBuyer: string;
      quantity?: string;
      amount: number;
    }> = [];

    (sub.expenses || []).forEach((exp: any) => {
      list.push({
        date: exp.date || '—',
        rawDate: exp.date ? new Date(exp.date).getTime() : 0,
        type: 'EXPENSE',
        categoryOrProduce: exp.category || 'General Expense',
        descriptionOrBuyer: exp.description || '—',
        amount: Number(exp.amount) || 0,
      });
    });

    (sub.sales || []).forEach((sale: any) => {
      list.push({
        date: sale.date || '—',
        rawDate: sale.date ? new Date(sale.date).getTime() : 0,
        type: 'SALE',
        categoryOrProduce: sale.produce || 'Oyster Mushrooms',
        descriptionOrBuyer: sale.buyer || 'Commercial Wholesale',
        quantity: sale.quantity,
        amount: Number(sale.amount) || 0,
      });
    });

    return list.sort((a, b) => b.rawDate - a.rawDate);
  }, [sub.expenses, sub.sales]);

  return (
    <div className="space-y-4">
      {/* Coordinator Action Header or Transparency Banner */}
      {isUserCoordinator ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center gap-3 text-blue-900">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Cluster Coordinator Operations Desk</p>
              <p className="text-xs text-blue-700">
                You manage this farm cluster. Record operating costs and crop harvests to keep the shared ledger transparent.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              className="bg-white border-blue-300 text-blue-800 hover:bg-blue-50 shadow-2xs flex-1 sm:flex-none text-xs font-semibold cursor-pointer"
              onClick={onRecordExpense}
            >
              <Receipt className="w-3.5 h-3.5 mr-1 text-red-600" />
              Record Expense
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xs flex-1 sm:flex-none text-xs font-semibold cursor-pointer"
              onClick={onRecordSale}
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
              Record Produce Sale
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-600 text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Open Farm Records:</strong> Every naira spent and earned from mushroom harvests is recorded here for all farm members to see.
          </span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Harvest Sales</p>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">+₦{sub.financials.sales.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{sub.sales.length} harvest sale(s)</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Farm Expenses</p>
          <p className="text-lg font-bold text-red-600 mt-0.5">-₦{sub.financials.expenses.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{sub.expenses.length} expense(s)</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Farm Net Profit</p>
          <p className={`text-lg font-extrabold mt-0.5 ${sub.financials.net_balance >= 0 ? "text-slate-800" : "text-amber-700"}`}>
            ₦{sub.financials.net_balance.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Profit shared after harvest</p>
        </div>
      </div>

      {/* Sub-Filter Toggles / Pills */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <div className="inline-flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Records ({sub.expenses.length + sub.sales.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('expenses')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'expenses' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expenses ({sub.expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('sales')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'sales' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Produce Sales ({sub.sales.length})
          </button>
        </div>
      </div>

      {/* Filter Views */}
      {filter === 'all' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Item / Category</th>
                <th className="px-6 py-3">Description / Buyer</th>
                <th className="px-6 py-3 text-right">Cashflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unifiedLedger.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 text-xs">{item.date}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {item.type === 'SALE' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Produce Sale
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        Operating Expense
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800 text-xs">
                    {item.categoryOrProduce}
                    {item.quantity ? <span className="text-[11px] font-normal text-slate-500 ml-1.5">({item.quantity})</span> : null}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 text-xs">{item.descriptionOrBuyer}</td>
                  <td className={`px-6 py-3.5 text-right font-bold text-xs whitespace-nowrap ${item.type === 'SALE' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {item.type === 'SALE' ? `+₦${item.amount.toLocaleString()}` : `-₦${item.amount.toLocaleString()}`}
                  </td>
                </tr>
              ))}
              {unifiedLedger.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                    No financial ledger entries recorded for this cluster yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {filter === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sub.expenses.map((exp: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 text-xs">{exp.date}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {exp.category || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-800 text-xs">{exp.description}</td>
                  <td className="px-6 py-3.5 text-right text-red-600 font-bold text-xs whitespace-nowrap">
                    -₦{exp.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {sub.expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs">
                    No operational expenses recorded for this cluster yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {filter === 'sales' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Produce</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">Offtaker / Buyer</th>
                <th className="px-6 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sub.sales.map((sale: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 text-xs">{sale.date}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800 text-xs">{sale.produce}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-600">{sale.quantity || "—"}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-600">{sale.buyer || "Commercial Wholesale"}</td>
                  <td className="px-6 py-3.5 text-right text-emerald-600 font-bold text-xs whitespace-nowrap">
                    +₦{sale.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {sub.sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                    No harvest sales logged yet for this cluster cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const MyFarmSlots: React.FC = () => {
  const { session, profile } = useAuth();
  const user = session?.user;
  const navigate = useNavigate();
  const { clusters, loading, fetchFarmData } = useFarmStore();
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [clusterFilter, setClusterFilter] = useState<"ALL" | "RECENT" | "LEGACY">("ALL");

  // Coordinator Modals State
  const [expenseModalCluster, setExpenseModalCluster] = useState<FarmClusterItem | null>(null);
  const [saleModalCluster, setSaleModalCluster] = useState<FarmClusterItem | null>(null);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [submittingSale, setSubmittingSale] = useState(false);

  // Form Fields: Expense
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  // Form Fields: Sale
  const [produceName, setProduceName] = useState("Fresh Oyster Mushrooms");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [unitPrice, setUnitPrice] = useState("");
  const [saleAmount, setSaleAmount] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [salesChannel, setSalesChannel] = useState(SALES_CHANNELS[0]);
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [saleDescription, setSaleDescription] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchFarmData(user.id, user.email || profile?.email);
    }
  }, [user?.id, user?.email, profile?.email, fetchFarmData]);

  // Recalculate sale total amount when quantity or unitPrice changes
  useEffect(() => {
    const q = parseFloat(quantity);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setSaleAmount((q * p).toString());
    }
  }, [quantity, unitPrice]);

  const subscriptions = clusters;

  const isLegacy = Boolean(
    (profile as any)?.is_legacy ||
    isLegacyMember((profile as any)?.created_at) ||
    clusters.some((c) => c.is_legacy)
  );

  const filteredClusters = subscriptions.filter((c) => {
    if (isLegacy) {
      if (clusterFilter === "LEGACY" && !c.is_legacy) return false;
      if (clusterFilter === "RECENT" && c.is_legacy) return false;
    }
    return true;
  });

  const toggleCluster = (id: string) => {
    setExpandedCluster((prev) => (prev === id ? null : id));
  };

  const totalSlots = subscriptions.reduce((sum, s) => sum + (Number(s.slots_held) || 0), 0);
  const totalFruitingBags = subscriptions.reduce((sum, s) => sum + (Number(s.fruiting_bags) || 0), 0);

  // Submit Expense Handler
  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseModalCluster || !user?.id) return;

    const parsedAmount = parseFloat(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid expense amount greater than 0.");
      return;
    }

    setSubmittingExpense(true);
    try {
      const { error } = await supabase.from("farm_expenses").insert({
        farm_id: expenseModalCluster.farm_id,
        category: expenseCategory,
        amount: parsedAmount,
        description: expenseDescription.trim() || expenseCategory,
        created_by: user.id,
        created_by_name: profile?.full_name || user.email || "Farm Coordinator",
      });

      if (error) throw error;

      toast.success("Operational expense logged to cluster ledger!");
      setExpenseModalCluster(null);
      setExpenseAmount("");
      setExpenseDescription("");
      // Refetch cluster data to update financials
      await fetchFarmData(user.id, user.email || profile?.email, true);
    } catch (err: any) {
      console.error("Error inserting farm expense:", err);
      toast.error(err.message || "Failed to record expense. Please try again.");
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Submit Produce Sale Handler
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleModalCluster || !user?.id) return;

    const parsedQty = parseFloat(quantity);
    const parsedUnitPrice = parseFloat(unitPrice);
    const parsedAmount = parseFloat(saleAmount);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast.error("Please specify a valid produce quantity.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please specify a valid total sale amount.");
      return;
    }

    setSubmittingSale(true);
    try {
      const { error } = await supabase.from("farm_sales").insert({
        farm_id: saleModalCluster.farm_id,
        produce_name: produceName.trim(),
        quantity: parsedQty,
        unit: unit.trim(),
        unit_price: isNaN(parsedUnitPrice) ? 0 : parsedUnitPrice,
        amount: parsedAmount,
        buyer_name: buyerName.trim() || null,
        sales_channel: salesChannel,
        sale_date: saleDate,
        description: saleDescription.trim() || null,
        created_by: user.id,
        created_by_name: profile?.full_name || user.email || "Farm Coordinator",
      });

      if (error) throw error;

      toast.success("Produce sale successfully recorded to cluster ledger!");
      setSaleModalCluster(null);
      setQuantity("");
      setUnitPrice("");
      setSaleAmount("");
      setBuyerName("");
      setSaleDescription("");
      // Refetch cluster data to update financials
      await fetchFarmData(user.id, user.email || profile?.email, true);
    } catch (err: any) {
      console.error("Error inserting farm sale:", err);
      toast.error(err.message || "Failed to record produce sale. Please try again.");
    } finally {
      setSubmittingSale(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">My Farm Slots</h1>
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Sprout className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">No Farm Slots Yet</h2>
            <p className="text-slate-500 max-w-md mb-6">
              You haven't subscribed to any farm clusters. Purchase your first farm slot to start your agricultural portfolio.
            </p>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/dashboard/farm-operations/buy-slots')}>
              Browse & Buy Farm Slots
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-emerald-900">My Farm Slots</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your agricultural portfolio, track crop cycle progress, and review live cluster financials.
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 font-medium text-xs uppercase tracking-wider mb-1">Total Slots Owned</p>
                <h3 className="text-4xl font-extrabold">{totalSlots}</h3>
                <p className="text-xs text-emerald-200 mt-1">Across all subscribed clusters</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl shadow-inner">
                <Sprout className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Fruiting Bags in Production</p>
                <h3 className="text-4xl font-extrabold text-slate-800">{totalFruitingBags.toLocaleString()}</h3>
                <p className="text-xs text-slate-500 mt-1">Active yield allocation (2 bags / slot)</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Leaf className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Subscribed Clusters</p>
                <h3 className="text-4xl font-extrabold text-slate-800">{subscriptions.length}</h3>
                <p className="text-xs text-slate-500 mt-1">Participating cooperative groups</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribed Clusters List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Active Farm Clusters</h2>
            <Badge variant="secondary" className="font-semibold text-xs bg-slate-100 text-slate-700">
              {subscriptions.length} Total
            </Badge>
          </div>

          {isLegacy && (
            <div className="inline-flex items-center gap-1 p-0.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 px-2 hidden sm:inline">
                Founding Members' Filter:
              </span>
              <button
                type="button"
                onClick={() => setClusterFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  clusterFilter === "ALL"
                    ? "bg-white text-emerald-950 shadow-2xs border border-amber-300"
                    : "text-amber-800 hover:text-amber-950"
                }`}
              >
                All ({subscriptions.length})
              </button>
              <button
                type="button"
                onClick={() => setClusterFilter("RECENT")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  clusterFilter === "RECENT"
                    ? "bg-white text-emerald-950 shadow-2xs border border-amber-300"
                    : "text-amber-800 hover:text-amber-950"
                }`}
              >
                Platform Slots ({subscriptions.filter((c) => !c.is_legacy).length})
              </button>
              <button
                type="button"
                onClick={() => setClusterFilter("LEGACY")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  clusterFilter === "LEGACY"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-amber-800 hover:text-amber-950"
                }`}
              >
                Founding Members' Slots ({subscriptions.filter((c) => c.is_legacy).length})
              </button>
            </div>
          )}
        </div>

        {filteredClusters.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No clusters found for the selected filter.
          </div>
        ) : (
          filteredClusters.map((sub) => {
            const isUserCoordinator = Boolean(
              sub.coordinator_id && (user?.id === sub.coordinator_id || profile?.id === sub.coordinator_id)
            );
            const cycle = sub.cycle || {
              cycle_number: 1,
              crop_type: sub.category.toLowerCase().includes("ginger") ? "High-Yield Ginger" : "Oyster Mushroom",
              stage: "GROWING",
              progress_percent: 65,
              start_date: null,
              total_bags: 2000,
            };

            const match = sub.farm_name.match(/^(.+?)\s*\[(.+?)\]$/);
            const displayName = match ? match[1] : sub.farm_name;
            const displayCategory = match ? match[2] : sub.category;

            return (
              <Card key={sub.id} className="overflow-hidden shadow-sm border-slate-200 transition-all hover:border-slate-300">
                {/* Cluster Card Header & Stats */}
                <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
                      <Sprout className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-bold text-slate-900">{displayName}</h3>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs">
                          [{displayCategory}]
                        </Badge>
                        {sub.is_legacy && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-bold text-xs">
                            Founding Member Slot
                          </Badge>
                        )}
                        {isUserCoordinator && (
                          <Badge className="bg-blue-600 text-white font-bold text-xs">
                            You are Coordinator
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                        <p>
                          Your Stake: <span className="font-semibold text-slate-800">{sub.slots_held} Slots</span> ({sub.fruiting_bags} bags)
                        </p>
                        {sub.coordinator && (
                          <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            Coordinator: <strong className="text-slate-800">{sub.coordinator.full_name || "Assigned"}</strong>
                          </span>
                        )}
                      </div>

                      {sub.is_legacy && (
                        <p className="text-xs text-amber-700 mt-1">
                          Historical cluster record allocated prior to the Sept 6, 2026 digital platform launch.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Financial Pill Summary */}
                  <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-2 text-sm divide-x divide-slate-200 shadow-inner w-full lg:w-auto">
                    <div className="px-3.5 py-1 text-center flex-1 lg:flex-none">
                      <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Expenses</p>
                      <p className="font-bold text-red-600 text-sm">₦{sub.financials.expenses.toLocaleString()}</p>
                    </div>
                    <div className="px-3.5 py-1 text-center flex-1 lg:flex-none">
                      <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Produce Sales</p>
                      <p className="font-bold text-emerald-600 text-sm">₦{sub.financials.sales.toLocaleString()}</p>
                    </div>
                    <div className="px-3.5 py-1 text-center flex-1 lg:flex-none bg-slate-100/60 rounded-r-lg">
                      <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Net Balance</p>
                      <p className={`font-extrabold text-sm ${sub.financials.net_balance >= 0 ? "text-slate-800" : "text-amber-700"}`}>
                        ₦{sub.financials.net_balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Crop Cycle Stage Progress Bar */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-700">Crop Cycle #{cycle.cycle_number}: {cycle.crop_type}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">Target: {cycle.total_bags.toLocaleString()} Bags</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                        Stage: {cycle.stage} ({cycle.progress_percent}%)
                      </span>
                    </div>
                  </div>

                  {/* Stage Progress Track */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(Math.max(cycle.progress_percent, 5), 100)}%` }}
                    />
                  </div>

                  {/* Stage Milestones */}
                  <div className="grid grid-cols-4 text-[10px] font-medium text-slate-500 mt-2 text-center">
                    <div className={cycle.progress_percent >= 25 ? "text-emerald-700 font-bold" : ""}>
                      1. Inoculation & Prep
                    </div>
                    <div className={cycle.progress_percent >= 60 ? "text-emerald-700 font-bold" : ""}>
                      2. Incubation & Growth
                    </div>
                    <div className={cycle.progress_percent >= 90 ? "text-emerald-700 font-bold" : ""}>
                      3. Fruiting & Harvest
                    </div>
                    <div className={cycle.progress_percent >= 100 ? "text-emerald-700 font-bold" : ""}>
                      4. Offtake & Payout
                    </div>
                  </div>

                  {/* Estimated Harvest Return */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/80 p-3.5 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-900">
                            Estimated Harvest Return
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Harvest Share
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          When this crop batch is harvested and sold to commercial off-takers, net harvest proceeds will be credited directly to your wallet.{" "}
                          <Link to="/how-it-works/presentation" className="text-emerald-700 font-semibold underline hover:text-emerald-800">
                            How harvest returns work →
                          </Link>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 shrink-0 self-end sm:self-center bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-right">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                          Estimated Return ({sub.slots_held} Slot{sub.slots_held > 1 ? "s" : ""})
                        </p>
                        <p className="text-base font-black text-emerald-950 font-mono">
                          ₦{((sub.slots_held || 0) * 2400).toLocaleString()}{" "}
                          <span className="text-[10px] font-normal text-gray-500">(Quarterly Offtake)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expander Toggle */}
                <div 
                  className="border-t border-slate-100 bg-white px-6 py-2.5 flex justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleCluster(sub.id)}
                >
                  <div className="flex items-center text-xs font-semibold text-slate-600 gap-1.5">
                    {expandedCluster === sub.id ? (
                      <><ChevronUp className="w-4 h-4 text-emerald-600" /> Hide Farm Details</>
                    ) : (
                      <><ChevronDown className="w-4 h-4 text-emerald-600" /> View Farm Records &amp; Members</>
                    )}
                  </div>
                </div>

                {/* Expanded Content: Ledger, Sales, and Roster */}
                {expandedCluster === sub.id && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-6 space-y-6">
                    
                    {/* Primary Detail Tabs */}
                    <Tabs defaultValue="roster" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 max-w-[460px] bg-slate-200/80 p-1 rounded-xl">
                        <TabsTrigger value="roster" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                          Farm Members ({sub.members.length})
                        </TabsTrigger>
                        <TabsTrigger value="financials" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs">
                          Farm Accounting ({sub.expenses.length + sub.sales.length})
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab 1: Stakeholders Roster (Comes First) */}
                      <TabsContent value="roster" className="mt-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Members</p>
                              <p className="text-xl font-bold text-slate-800">{sub.members.length}</p>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Allocated Farm Slots</p>
                              <p className="text-xl font-bold text-emerald-700">
                                {sub.members.reduce((sum, m) => sum + (Number(m.slots) || 0), 0)} Slots
                              </p>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Substrate Bags</p>
                              <p className="text-xl font-bold text-slate-800">
                                {(sub.members.reduce((sum, m) => sum + (Number(m.slots) || 0), 0) * 2).toLocaleString()} Bags
                              </p>
                            </div>
                          </div>

                          {/* Desktop Table View */}
                          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                                <tr>
                                  <th className="px-6 py-3">Stakeholder</th>
                                  <th className="px-6 py-3">Status</th>
                                  <th className="px-6 py-3 text-center">Slots Held</th>
                                  <th className="px-6 py-3 text-center">Fruiting Bags</th>
                                  <th className="px-6 py-3 text-right">Allocation Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sub.members.map((member, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-6 py-3.5">
                                      <div className="font-semibold text-slate-800 text-xs">{member.name}</div>
                                      <div className="text-[11px] text-slate-500">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                      {member.is_legacy ? (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[10px] font-semibold">
                                          Founding Stakeholder
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                                          Active Platform Member
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="px-6 py-3.5 text-center font-bold text-slate-800 text-xs">
                                      {member.slots}
                                    </td>
                                    <td className="px-6 py-3.5 text-center font-medium text-emerald-700 text-xs">
                                      {member.fruiting_bags} bags
                                    </td>
                                    <td className="px-6 py-3.5 text-right text-slate-500 text-xs whitespace-nowrap">
                                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : "—"}
                                    </td>
                                  </tr>
                                ))}
                                {sub.members.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                                      No members linked to this cluster yet.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card List View (Clean on Smartphones) */}
                          <div className="block md:hidden space-y-2.5">
                            {sub.members.map((member, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 text-xs truncate">{member.name}</div>
                                    <div className="text-[11px] text-slate-500 truncate">{member.email}</div>
                                  </div>
                                  {member.is_legacy ? (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[10px] font-semibold shrink-0">
                                      Founding
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold shrink-0">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                                  <div className="bg-slate-50 rounded-lg p-2">
                                    <span className="text-[10px] font-medium text-slate-500 block uppercase">Slots</span>
                                    <span className="text-xs font-bold text-slate-800">{member.slots}</span>
                                  </div>
                                  <div className="bg-emerald-50/70 rounded-lg p-2">
                                    <span className="text-[10px] font-medium text-emerald-700 block uppercase">Yield Bags</span>
                                    <span className="text-xs font-bold text-emerald-800">{member.fruiting_bags}</span>
                                  </div>
                                  <div className="bg-slate-50 rounded-lg p-2">
                                    <span className="text-[10px] font-medium text-slate-500 block uppercase">Allocated</span>
                                    <span className="text-[10px] font-semibold text-slate-600 block truncate">
                                      {member.created_at ? new Date(member.created_at).toLocaleDateString() : "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {sub.members.length === 0 && (
                              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
                                No members linked to this cluster yet.
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Tab 2: Financials & Ledger (Unified Expenses & Produce Sales with Coordinator Controls) */}
                      <TabsContent value="financials" className="mt-4">
                        <ClusterFinancialsLedger
                          sub={sub}
                          isUserCoordinator={isUserCoordinator}
                          onRecordExpense={() => setExpenseModalCluster(sub)}
                          onRecordSale={() => setSaleModalCluster(sub)}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL 1: Record Operating Expense */}
      {expenseModalCluster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Operating Expense</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cluster: <span className="font-semibold text-emerald-800">{expenseModalCluster.farm_name}</span>
                </p>
              </div>
              <button 
                onClick={() => setExpenseModalCluster(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Expense Category</Label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Amount (₦)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 45000"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  min="1"
                  step="any"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Description / Memo</Label>
                <Input
                  type="text"
                  placeholder="e.g. Purchase of 20 bags of sawdust substrate"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800">
                Logged expenses immediately deduct from the cluster's net balance and appear in the shared transparent ledger.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpenseModalCluster(null)}
                  disabled={submittingExpense}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingExpense}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {submittingExpense ? "Logging..." : "Log Expense"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Produce Harvest Sale */}
      {saleModalCluster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Produce Harvest Sale</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cluster: <span className="font-semibold text-emerald-800">{saleModalCluster.farm_name}</span>
                </p>
              </div>
              <button 
                onClick={() => setSaleModalCluster(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSale} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Produce Type</Label>
                <Input
                  type="text"
                  placeholder="e.g. Fresh Grey Oyster Mushrooms"
                  value={produceName}
                  onChange={(e) => setProduceName(e.target.value)}
                  required
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    min="0.1"
                    step="any"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Unit</Label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="baskets">Baskets</option>
                    <option value="crates">Crates</option>
                    <option value="packs">Packs</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Unit Price (₦)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2500"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    min="1"
                    step="any"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Total Revenue (₦)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 125000"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    required
                    min="1"
                    step="any"
                    className="mt-1.5 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Buyer / Offtaker</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Mile 12 Market Wholesale"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Sale Date</Label>
                  <Input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Sales Channel</Label>
                <select
                  value={salesChannel}
                  onChange={(e) => setSalesChannel(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {SALES_CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800">
                Logged sales immediately contribute to the cluster's produce sales and positive net balance.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaleModalCluster(null)}
                  disabled={submittingSale}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingSale}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {submittingSale ? "Recording..." : "Record Sale"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Leaf icon component
function Leaf(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export default MyFarmSlots;
