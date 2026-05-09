import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface FarmRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  farm_slots: number;
  months_farm_setup: string;
  months_farm_support: string;
  absentee_fine: string;
  farm_groups: { id: string; name: string; coordinator_id: string };
  setup_paid?: number;
  support_paid?: number;
  fine_paid?: number;
  setup_batches?: string;
  support_batches?: string;
  fine_batches?: string;
}

interface FarmExpense {
  id: string;
  farm_id: string;
  category: string;
  amount: number;
  description?: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = [
  "Ginger seedlings + compost fertilizer",
  "Pepper intercrop",
  "Bush clearing & de-stumping",
  "Borehole",
  "Tank + scaffold",
  "Solar pump",
  "Land preparation",
  "Rice straw",
  "Farm workers",
  "Biofungicide & biopesticide",
  "Irrigation setup",
  "Coordinator",
  "Insurance",
  "Miscellaneous",
];


const calcSetup = (r: FarmRecord) => 
  Math.max(r.setup_paid || 0, Number(r.months_farm_setup) || 0);

const calcSupport = (r: FarmRecord) => 
  Math.max(r.support_paid || 0, Number(r.months_farm_support) || 0);

const calcSlotFee = (r: Pick<FarmRecord, "farm_slots">) => r.farm_slots * 2000;

const calcFine = (r: FarmRecord) => 
  Math.max(r.fine_paid || 0, Number(r.absentee_fine) || 0);

const calcTotal = (r: FarmRecord) => calcSetup(r) + calcSupport(r) + calcSlotFee(r) + calcFine(r);

const FarmRecordsView = () => {
  const [farm, setFarm] = useState<{ id: string; name: string; coordinator_id: string } | null>(null);
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [expenses, setExpenses] = useState<FarmExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FarmRecord>>({});
  const [expenseFormData, setExpenseFormData] = useState<Partial<FarmExpense>>({});
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const enrichRecordsWithBatches = async (records: any[]) => {
    if (!records || records.length === 0) return [];
    const enrichedRecords = [...records] as FarmRecord[];
    const emails = [...new Set(enrichedRecords
      .map(r => r.email?.trim().toLowerCase())
      .filter(e => e && e.includes("@"))
    )];
    
    if (emails.length === 0) return enrichedRecords;
    
    // Get user_ids from auth.users via RPC
    const { data: authUsers } = await supabase.rpc("get_user_ids_by_emails", { emails });
    
    if (authUsers && authUsers.length > 0) {
      const userIds = authUsers.map((u: any) => u.user_id);
      const { data: payments } = await supabase
        .from("other_payments")
        .select("user_id, payment_type, created_at, slots, amount, months")
        .in("user_id", userIds)
        .eq("status", "success")
        .order("created_at", { ascending: true });

      if (payments) {
        return enrichedRecords.map(record => {
          const authUser = authUsers.find((u: any) => u.email?.toLowerCase() === record.email?.toLowerCase());
          if (!authUser) return record;

          const userPayments = payments.filter((p: any) => p.user_id === authUser.user_id);
          const getBatchInfo = (type: string) => {
            const typePayments = userPayments.filter((p: any) => p.payment_type === type);
            if (typePayments.length === 0) return { months: "", total: undefined };
            
            const monthsStr = typePayments.map((p: any) => p.months || 0).join(", ");
            const totalPaid = typePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            return { months: monthsStr, total: totalPaid };
          };

          const setup = getBatchInfo("farm_setup");
          const support = getBatchInfo("farm_support");
          const fine = getBatchInfo("absentee_fine");

          return {
            ...record,
            setup_paid: setup.total,
            support_paid: support.total,
            fine_paid: fine.total,
            setup_batches: setup.months,
            support_batches: support.months,
            fine_batches: fine.months
          };
        });
      }
    }
    return enrichedRecords;
  };

  const fetchRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setLoading(false); return; }

    // First: try to find farm via member record email match
    const { data: recordData } = await supabase
      .from("farm_records")
      .select("*, farm_groups!inner(id, name, coordinator_id)")
      .eq("email", user.email).limit(1).maybeSingle();

    if (recordData) {
      const farmData = recordData.farm_groups as any;
      setFarm(farmData);
      setIsCoordinator(farmData.coordinator_id === user.id);
      
      const [recRes, expRes] = await Promise.all([
        supabase.from("farm_records").select("*").eq("farm_id", farmData.id).order("name"),
        supabase.from("farm_expenses").select("*").eq("farm_id", farmData.id).order("created_at", { ascending: false })
      ]);

      if (expRes.error) {
        console.error("Error fetching expenses:", expRes.error);
      }

      if (recRes.data) {
        const enriched = await enrichRecordsWithBatches(recRes.data);
        setRecords(enriched);
      }
      setExpenses(expRes.data || []);
      setLoading(false);
      return;
    }

    // Fallback: check if the user is a coordinator of any farm group
    const { data: coordinatorFarm } = await supabase
      .from("farm_groups")
      .select("id, name, coordinator_id")
      .eq("coordinator_id", user.id)
      .limit(1).maybeSingle();

    if (coordinatorFarm) {
      setFarm(coordinatorFarm);
      setIsCoordinator(true);
      
      const [recRes, expRes] = await Promise.all([
        supabase.from("farm_records").select("*").eq("farm_id", coordinatorFarm.id).order("name"),
        supabase.from("farm_expenses").select("*").eq("farm_id", coordinatorFarm.id).order("created_at", { ascending: false })
      ]);

      if (expRes.error) {
        console.error("Error fetching expenses:", expRes.error);
      }

      if (recRes.data) {
        const enriched = await enrichRecordsWithBatches(recRes.data);
        setRecords(enriched);
      }
      setExpenses(expRes.data || []);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleAdd = () => {
    setFormData({ name: "", email: "", phone: "", farm_slots: 0, months_farm_setup: "0", months_farm_support: "0", absentee_fine: "0" });
    setAutoFilled(false);
    setShowAddForm(true);
  };

  const lookupUserByEmail = async (email: string) => {
    if (!email || !email.includes("@")) return;
    setEmailLookupLoading(true);

    const emailTrimmed = email.trim().toLowerCase();

    // 1. Get member details (name, phone, slots) — may be null if user has no slots
    const { data: rpcData } = await supabase.rpc("get_member_details_by_email", {
      email_input: emailTrimmed,
    });
    const memberData = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const slots = Number(memberData?.total_slots || 0);

    // 2. Get user_id from auth.users via RPC (works for ANY registered user)
    const { data: authData } = await supabase.rpc("get_user_ids_by_emails", {
      emails: [emailTrimmed],
    });
    const userId = Array.isArray(authData) && authData.length > 0 ? authData[0].user_id : null;

    if (!memberData && !userId) {
      setAutoFilled(false);
      setEmailLookupLoading(false);
      return;
    }

    // 3. If no memberData but we have userId, get profile info (name, phone) from profiles table
    let profileName = memberData?.full_name || "";
    let profilePhone = memberData?.phone || "";

    if (!memberData && userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", userId)
        .maybeSingle();
      profileName = profile?.full_name || "";
      profilePhone = profile?.phone || "";
    }

    // 4. Get payment totals from other_payments
    if (userId) {
      const { data: payments } = await supabase
        .from("other_payments")
        .select("amount, payment_type")
        .eq("user_id", userId)
        .eq("status", "success");

      const getTotalPaid = (type: string) => {
        if (!payments) return 0;
        return payments
          .filter(p => p.payment_type?.toLowerCase() === type.toLowerCase())
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      };

      const setupAmt = getTotalPaid("farm_setup");
      const supportAmt = getTotalPaid("farm_support");
      const fineAmt = getTotalPaid("absentee_fine");

      setFormData((prev) => ({
        ...prev,
        name: profileName || prev.name || "",
        phone: profilePhone || prev.phone || "",
        farm_slots: Math.max(Number(prev.farm_slots) || 0, slots),
        months_farm_setup: Math.max(Number(prev.months_farm_setup) || 0, setupAmt).toString(),
        months_farm_support: Math.max(Number(prev.months_farm_support) || 0, supportAmt).toString(),
        absentee_fine: Math.max(Number(prev.absentee_fine) || 0, fineAmt).toString(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: profileName || prev.name || "",
        phone: profilePhone || prev.phone || "",
        farm_slots: Math.max(Number(prev.farm_slots) || 0, slots),
      }));
    }

    setAutoFilled(true);
    setEmailLookupLoading(false);
  };

  const handleEdit = (record: FarmRecord) => { 
    setFormData(record); 
    setEditingId(record.id); 
    lookupUserByEmail(record.email);
  };

  const handleSave = async () => {
    if (!farm) return;

    // Required field validation
    if (!formData.email?.trim()) {
      showToast({ variant: "error", title: "Email is required", description: "Please enter the member's email." });
      return;
    }
    if (!formData.name?.trim()) {
      showToast({ variant: "error", title: "Name is required", description: "Please enter the member's name." });
      return;
    }
    if (!formData.phone?.trim()) {
      showToast({ variant: "error", title: "Phone is required", description: "Please enter the member's phone number." });
      return;
    }
    if (!formData.farm_slots || formData.farm_slots <= 0) {
      showToast({ variant: "error", title: "Farm Slots required", description: "This member has no farm slots purchased." });
      return;
    }

    // On new record only: validate email uniqueness
    if (!editingId && formData.email) {
      const { data: existingRecords } = await supabase
        .from("farm_records")
        .select("farm_id")
        .eq("email", formData.email);

      if (existingRecords && existingRecords.length > 0) {
        const inSameFarm = existingRecords.some((r) => r.farm_id === farm.id);
        if (inSameFarm) {
          showToast({ variant: "error", title: "Email already exists", description: "This email is already in this farm group." });
        } else {
          showToast({ variant: "error", title: "Email already exists", description: "This email is already in another farm group." });
        }
        return;
      }
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      farm_slots: formData.farm_slots,
      months_farm_setup: formData.months_farm_setup,
      months_farm_support: formData.months_farm_support,
      absentee_fine: formData.absentee_fine,
      farm_id: farm.id
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("farm_records").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("farm_records").insert(payload));
    }
    if (error) { showToast({ variant: "error", title: "Failed to save", description: error.message }); return; }
    showToast({ variant: "success", title: editingId ? "Record updated" : "Record added" });
    setShowAddForm(false); setEditingId(null); setFormData({}); setAutoFilled(false);
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("farm_records").delete().eq("id", id);
    if (error) { showToast({ variant: "error", title: "Failed to delete", description: error.message }); return; }
    showToast({ variant: "success", title: "Record deleted" });
    fetchRecords();
  };

  const handleAddExpense = () => {
    setExpenseFormData({ category: "", amount: 0, description: "" });
    setEditingExpenseId(null);
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense: FarmExpense) => {
    setExpenseFormData(expense);
    setEditingExpenseId(expense.id);
    setShowExpenseForm(true);
  };

  const handleSaveExpense = async () => {
    if (!farm) return;
    if (!expenseFormData.category) {
      showToast({ variant: "error", title: "Category required", description: "Please select an expense category." });
      return;
    }
    if (!expenseFormData.amount || expenseFormData.amount <= 0) {
      showToast({ variant: "error", title: "Amount required", description: "Please enter a valid expense amount." });
      return;
    }

    const data = { ...expenseFormData, farm_id: farm.id };
    let error;
    if (editingExpenseId) {
      ({ error } = await supabase.from("farm_expenses").update(data).eq("id", editingExpenseId));
    } else {
      ({ error } = await supabase.from("farm_expenses").insert(data));
    }

    if (error) { showToast({ variant: "error", title: "Failed to save", description: error.message }); return; }
    showToast({ variant: "success", title: editingExpenseId ? "Expense updated" : "Expense added" });
    setShowExpenseForm(false); setEditingExpenseId(null); setExpenseFormData({});
    fetchRecords();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense record?")) return;
    const { error } = await supabase.from("farm_expenses").delete().eq("id", id);
    if (error) { showToast({ variant: "error", title: "Failed to delete", description: error.message }); return; }
    showToast({ variant: "success", title: "Expense deleted" });
    fetchRecords();
  };

  const cancelEdit = () => { setShowAddForm(false); setEditingId(null); setFormData({}); setAutoFilled(false); };
  const cancelExpenseEdit = () => { setShowExpenseForm(false); setEditingExpenseId(null); setExpenseFormData({}); };
  const set = (field: keyof FarmRecord, val: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: val }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading farm records...</p>
      </div>
    </div>
  );

  if (!farm) return (
    <div className="p-4 md:p-6">
      <Card><CardContent className="pt-6">
        <div className="text-center py-8">
          <p className="text-gray-600">You are not registered with any farm group yet.</p>
          <p className="text-sm text-gray-600 mt-2">Contact your farm coordinator to be added.</p>
          <p className="text-sm text-gray-500 mt-2">Want to be a farm coordinator? Contact the admin.</p>
        </div>
      </CardContent></Card>
    </div>
  );


  const totalFarmSlots = records.reduce((s, r) => s + r.farm_slots, 0);
  const totalFarmSupport = records.reduce((s, r) => s + calcSupport(r), 0);
  const totalFarmSetup = records.reduce((s, r) => s + calcSetup(r), 0);
  const totalAbsenteeFine = records.reduce((s, r) => s + calcFine(r), 0);
  const totalExpensesValue = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const totalFarmIncome = records.reduce((s, r) => s + calcTotal(r), 0);
  const agrohealBalance = (totalFarmSlots * 2000) + totalFarmSupport;
  const grossBalance = totalFarmSetup + totalAbsenteeFine;
  const netBalance = grossBalance - totalExpensesValue;

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 print:p-0">
      <style>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          /* Show only the content container and its children */
          .print-container, .print-container * {
            visibility: visible;
          }
          /* Position the content at the top left */
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide buttons and interactive elements during print */
          .no-print {
            display: none !important;
          }
          /* Ensure cards have borders and white backgrounds */
          .card, .Card {
            border: 1px solid #e5e7eb !important;
            break-inside: avoid;
            margin-bottom: 1.5rem !important;
          }
          /* Optimize table for print */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #f3f4f6 !important;
          }
          /* Remove motion animations during print */
          * {
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
          /* Page settings */
          @page {
            margin: 1cm;
            size: auto;
          }
        }
      `}</style>
      <div className="print-container">
      <Toaster />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{farm.name} Records</h2>
          <p className="text-gray-600">Farm bookkeeping and finance tracking</p>
        </div>
        <Button 
          onClick={handleDownloadPDF} 
          variant="outline" 
          className="no-print border-green-800 text-green-800 hover:bg-green-50 w-full sm:w-auto"
        >
          <Printer className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </motion.div>

      {isCoordinator && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex flex-col sm:flex-row gap-3 no-print">
          <Button onClick={handleAdd} className="bg-green-800 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Add Member Record
          </Button>
          <Button onClick={handleAddExpense} variant="outline" className="border-green-800 text-green-800 hover:bg-green-50 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Add Expenses
          </Button>
        </motion.div>
      )}

      {(showAddForm || editingId) && isCoordinator && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
          <Card>
            <CardHeader><CardTitle>{editingId ? "Edit Record" : "Add New Record"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email — first, triggers auto-lookup */}
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>Email</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => {
                        set("email", e.target.value.toLowerCase());
                        setAutoFilled(false);
                      }}
                      onBlur={(e) => lookupUserByEmail(e.target.value)}
                      placeholder="Enter member email to auto-fill details"
                      readOnly={!!editingId}
                      className={editingId ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                    />
                    {emailLookupLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {autoFilled && <p className="text-xs text-green-700 mt-1 font-medium">✓ Member details auto-filled from profile</p>}
                </div>

                {/* Name — read-only, auto-filled */}
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name || ""}
                    readOnly
                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="Auto-filled from email"
                  />
                </div>

                {/* Phone — read-only, auto-filled */}
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone || ""}
                    readOnly
                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="Auto-filled from email"
                  />
                </div>

                {/* Farm Slots — read-only, auto-filled */}
                <div>
                  <Label>No. of Farm Slots</Label>
                  <Input
                    type="number"
                    value={formData.farm_slots ?? 0}
                    readOnly
                    className="bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Total Farm Setup Paid (₦)</Label>
                  <Input
                    type="number"
                    value={formData.months_farm_setup ?? "0"}
                    onChange={(e) => setFormData(prev => ({ ...prev, months_farm_setup: e.target.value }))}
                    placeholder="Auto-filled or enter amount"
                  />
                </div>
                <div>
                  <Label>Total Farm Support Paid (₦)</Label>
                  <Input
                    type="number"
                    value={formData.months_farm_support ?? "0"}
                    onChange={(e) => setFormData(prev => ({ ...prev, months_farm_support: e.target.value }))}
                    placeholder="Auto-filled or enter amount"
                  />
                </div>
                <div>
                  <Label>Total Absentee Fine Paid (₦)</Label>
                  <Input
                    type="number"
                    value={formData.absentee_fine ?? "0"}
                    onChange={(e) => setFormData(prev => ({ ...prev, absentee_fine: e.target.value }))}
                    placeholder="Auto-filled or enter amount"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-green-800 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Save</Button>
                <Button onClick={cancelEdit} variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showExpenseForm && isCoordinator && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
          <Card>
            <CardHeader><CardTitle>{editingExpenseId ? "Edit Expense" : "Add New Expense"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={expenseFormData.category || ""}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="" disabled>Select category</option>
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Amount (₦)</Label>
                  <Input
                    type="number"
                    value={expenseFormData.amount ?? 0}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                </div>
                {/* 
                <div className="md:col-span-2">
                  <Label>Description (Optional)</Label>
                  <Input
                    value={expenseFormData.description || ""}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief details about the expense"
                  />
                </div>
                */}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveExpense} className="bg-green-800 hover:bg-green-700"><Save className="w-4 h-4 mr-2" />Save</Button>
                <Button onClick={cancelExpenseEdit} variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader><CardTitle>Member Records ({records.length})</CardTitle></CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Farm Slots</th>
                      <th className="text-left p-2">Slot Fee</th>
                      <th className="text-left p-2">Farm Setup</th>
                      <th className="text-left p-2">Farm Support</th>
                      <th className="text-left p-2">Absentee Fine</th>
                      <th className="text-left p-2">Total</th>
                      <th className="text-left p-2">Email</th>
                      {isCoordinator && <th className="text-left p-2">Phone</th>}
                      {isCoordinator && <th className="text-left p-2">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{record.name}</td>
                        <td className="p-2">{record.farm_slots}</td>
                        <td className="p-2">₦{calcSlotFee(record).toLocaleString()}</td>
                        <td className="p-2">
                          <div className="font-semibold text-green-900">₦{calcSetup(record).toLocaleString()}</div>
                          {record.setup_batches && (
                            <div className="text-[10px] text-gray-400 leading-tight">Months: {record.setup_batches}</div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="font-semibold text-blue-900">₦{calcSupport(record).toLocaleString()}</div>
                          {record.support_batches && (
                            <div className="text-[10px] text-gray-400 leading-tight">Months: {record.support_batches}</div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="font-semibold text-orange-900">₦{calcFine(record).toLocaleString()}</div>
                          {record.fine_batches && (
                            <div className="text-[10px] text-gray-400 leading-tight">Months: {record.fine_batches}</div>
                          )}
                        </td>
                        <td className="p-2 font-semibold text-green-800">₦{calcTotal(record).toLocaleString()}</td>
                        <td className="p-2 text-gray-600">{record.email}</td>
                        {isCoordinator && <td className="p-2 text-gray-600">{record.phone}</td>}
                        {isCoordinator && (
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button onClick={() => handleEdit(record)} variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                              <Button onClick={() => handleDelete(record.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold bg-gray-100">
                      <td className="p-2">Total</td>
                      <td className="p-2">{records.reduce((s, r) => s + r.farm_slots, 0)}</td>
                      <td className="p-2">₦{records.reduce((s, r) => s + calcSlotFee(r), 0).toLocaleString()}</td>
                      <td className="p-2">₦{records.reduce((s, r) => s + calcSetup(r), 0).toLocaleString()}</td>
                      <td className="p-2">₦{records.reduce((s, r) => s + calcSupport(r), 0).toLocaleString()}</td>
                      <td className="p-2">₦{records.reduce((s, r) => s + calcFine(r), 0).toLocaleString()}</td>
                      <td className="p-2 font-bold text-green-800">₦{records.reduce((s, r) => s + calcTotal(r), 0).toLocaleString()}</td>
                      <td className="p-2" />
                      {isCoordinator && <td className="p-2" />}
                      {isCoordinator && <td className="p-2" />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Expenses Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
        <Card>
          <CardHeader><CardTitle>Farm Expenses</CardTitle></CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expense records found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Category</th>
                      {/* <th className="text-left p-2">Description</th> */}
                      <th className="text-right p-2">Amount</th>
                      {isCoordinator && <th className="text-center p-2">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 text-gray-600">
                          {new Date(expense.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2 font-medium text-gray-900">{expense.category}</td>
                        {/* <td className="p-2 text-gray-500 italic">{expense.description || "-"}</td> */}
                        <td className="p-2 text-right font-semibold">₦{expense.amount.toLocaleString()}</td>
                        {isCoordinator && (
                          <td className="p-2">
                            <div className="flex justify-center gap-1">
                              <Button onClick={() => handleEditExpense(expense)} variant="outline" size="sm"><Edit className="w-3 h-3" /></Button>
                              <Button onClick={() => handleDeleteExpense(expense.id)} variant="outline" size="sm" className="text-red-600 hover:text-red-700"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold bg-gray-100">
                      <td colSpan={2} className="p-2 text-right uppercase tracking-wider">Total Expenses</td>
                      <td className="p-2 text-right text-red-700">
                        ₦{expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                      </td>
                      {isCoordinator && <td className="p-2" />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Balance Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 mb-12">
        <Card className="border-2 border-green-800/20 overflow-hidden">
          <CardHeader className="bg-green-800 text-white">
            <CardTitle className="text-xl">Account Balance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900">Total Farm Income</h4>
                  <p className="text-xs text-gray-500">(Total sum of all member payments)</p>
                </div>
                <span className="text-xl font-bold text-green-800">₦{totalFarmIncome.toLocaleString()}</span>
              </div>

              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
                <div>
                  <h4 className="font-semibold text-gray-900">Agroheal Fees</h4>
                  <p className="text-xs text-gray-500 font-medium">(Farm Slot Admin/Marketing + Agroheal Farm Support)</p>
                </div>
                <span className="text-xl font-bold text-green-800">₦{agrohealBalance.toLocaleString()}</span>
              </div>

              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{farm.name} Gross Balance</h4>
                  <p className="text-xs text-gray-500">(Farm Setup + Total Absentee Fine)</p>
                </div>
                <span className="text-xl font-bold text-green-800">₦{grossBalance.toLocaleString()}</span>
              </div>

              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900">Total Expenses</h4>
                  <p className="text-xs text-gray-500">(Sum of all recorded farm expenses)</p>
                </div>
                <span className="text-xl font-bold text-red-600">₦{totalExpensesValue.toLocaleString()}</span>
              </div>

              <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-green-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{farm.name} Net Balance</h3>
                  <p className="text-sm text-gray-600">Available funds after expenses</p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-black ${netBalance >= 0 ? "text-green-800" : "text-red-800"}`}>
                    ₦{netBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
};

export default FarmRecordsView;
