import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/ui/ToastComponent";
import { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X, Printer, Lock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PROJECT_CATEGORIES,
  DEFAULT_CATEGORY,
} from "@/constant/projectCategories";
import { cleanName, cleanEmail, normalizePhoneNumber, parsePositiveInt } from "@shared/dataSanitizers";
import { useAuth } from "@/hooks/useAuth";

interface FarmRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  referral_code?: string;
  farm_slots: number;
  months_farm_setup: string;
  months_farm_support: string;
  absentee_fine: string;
  farm_groups: {
    id: string;
    name: string;
    coordinator_id: string;
    project_category: string;
  };
  setup_paid?: number;
  support_paid?: number;
  fine_paid?: number;
  setup_batches?: string;
  support_batches?: string;
  fine_batches?: string;
  created_by?: string;
  created_by_name?: string;
  created_at?: string;
  updated_by?: string;
  updated_by_name?: string;
  updated_at?: string;
}

interface AuthUserRow {
  user_id: string;
  email: string;
}

interface CategoryPaymentRow {
  user_id: string;
  payment_type: string;
  months?: number;
  amount?: number;
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
  updated_by?: string;
  updated_by_name?: string;
  updated_at?: string;
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
  updated_by?: string;
  updated_by_name?: string;
  updated_at?: string;
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

const MUSHROOM_VILLAGE_EXPENSE_CATEGORIES = [
  "Mushroom housing",
  "Fruiting bag",
  "Salaries",
  "Operations",
];

const UNITS_OF_MEASURE = ["kg", "crates", "packs", "bags", "baskets", "pieces", "tonnes"];

const SALES_CHANNELS = [
  "Offtaker",
  "Wholesale Market",
  "Supermarket Retail",
  "Direct Consumer",
  "Farm Gate",
  "Food Processor",
  "Other",
];

const MUSHROOM_PRODUCE_PRESETS = [
  "Fresh Oyster Mushrooms",
  "Dried Oyster Mushrooms",
  "Mushroom Spawn",
  "Spent Substrate / Compost",
  "Fresh Button Mushrooms",
  "Custom Produce / Other",
];

const GINGER_PRODUCE_PRESETS = [
  "Fresh Ginger Rhizomes",
  "Dried Split Ginger",
  "Chili Pepper Intercrop",
  "Custom Produce / Other",
];

const GENERAL_PRODUCE_PRESETS = [
  "Fresh Harvest Produce",
  "Intercrop Produce",
  "Custom Produce / Other",
];

const getProducePresets = (projectCategory?: string) => {
  if (projectCategory === "Mushroom Village") return MUSHROOM_PRODUCE_PRESETS;
  if (projectCategory === "Gingertown") return GINGER_PRODUCE_PRESETS;
  return GENERAL_PRODUCE_PRESETS;
};

const formatDateOnly = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} at ${d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return dateStr;
  }
};

const getExpenseCategories = (projectCategory?: string) =>
  projectCategory === "Mushroom Village"
    ? MUSHROOM_VILLAGE_EXPENSE_CATEGORIES
    : EXPENSE_CATEGORIES;

const calcSetup = (r: FarmRecord) =>
  Math.max(r.setup_paid || 0, Number(r.months_farm_setup) || 0);

const calcSupport = (r: FarmRecord) =>
  Math.max(r.support_paid || 0, Number(r.months_farm_support) || 0);

const calcFine = (r: FarmRecord) =>
  Math.max(r.fine_paid || 0, Number(r.absentee_fine) || 0);

interface ParsedAudit {
  role: "Super Admin" | "Admin" | "Support" | "Coordinator" | "Staff";
  name: string;
  email?: string;
  raw: string;
}

const parseAuditString = (raw?: string): ParsedAudit => {
  if (!raw || !raw.trim()) {
    return { role: "Coordinator", name: "Farm Coordinator", raw: "Coordinator" };
  }
  const str = raw.trim();

  let role: "Super Admin" | "Admin" | "Support" | "Coordinator" | "Staff" = "Coordinator";
  let name = str;
  let email: string | undefined = undefined;

  const emailMatch = str.match(/\(([^)]+@[^)]+)\)$/);
  if (emailMatch) {
    email = emailMatch[1].trim();
  }

  const withoutEmail = emailMatch ? str.substring(0, emailMatch.index).trim() : str;

  if (/\[\s*Super\s*Admin\s*\]/i.test(withoutEmail) || /^Super\s*Admin\s*:/i.test(withoutEmail)) {
    role = "Super Admin";
    name = withoutEmail.replace(/\[\s*Super\s*Admin\s*\]\s*/i, "").replace(/^Super\s*Admin\s*:\s*/i, "").trim();
  } else if (/\[\s*Admin\s*\]/i.test(withoutEmail) || /^Admin\s*:/i.test(withoutEmail)) {
    role = "Admin";
    name = withoutEmail.replace(/\[\s*Admin\s*\]\s*/i, "").replace(/^Admin\s*:\s*/i, "").trim();
  } else if (/\[\s*(?:Customer\s*)?Support\s*\]/i.test(withoutEmail) || /^(?:Customer\s*)?Support\s*:/i.test(withoutEmail)) {
    role = "Support";
    name = withoutEmail.replace(/\[\s*(?:Customer\s*)?Support\s*\]\s*/i, "").replace(/^(?:Customer\s*)?Support\s*:\s*/i, "").trim();
  } else if (/\[\s*(?:Farm\s*)?Coordinator\s*\]/i.test(withoutEmail) || /^(?:Farm\s*)?Coordinator\s*:/i.test(withoutEmail)) {
    role = "Coordinator";
    name = withoutEmail.replace(/\[\s*(?:Farm\s*)?Coordinator\s*\]\s*/i, "").replace(/^(?:Farm\s*)?Coordinator\s*:/i, "").trim();
  } else if (withoutEmail.toLowerCase() === "admin") {
    role = "Admin";
    name = "Platform Admin";
  } else if (withoutEmail.toLowerCase() === "support") {
    role = "Support";
    name = "Customer Support";
  } else if (withoutEmail.toLowerCase() === "coordinator" || withoutEmail.toLowerCase() === "farm coordinator") {
    role = "Coordinator";
    name = "Farm Coordinator";
  } else {
    name = withoutEmail.trim();
  }

  if (!name) {
    name = role === "Coordinator" ? "Farm Coordinator" : role === "Support" ? "Customer Support" : role;
  }

  return { role, name, email, raw };
};

const RoleBadge = ({ role }: { role: string }) => {
  if (role === "Super Admin") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
        Super Admin
      </span>
    );
  }
  if (role === "Admin") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
        Admin
      </span>
    );
  }
  if (role === "Support" || role === "Customer Support") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
        Support
      </span>
    );
  }
  if (role === "Coordinator" || role === "Farm Coordinator") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        Farm Coordinator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
      {role || "Staff"}
    </span>
  );
};

const AuditTrailCell = ({
  createdByName,
  createdAt,
  updatedByName,
  updatedAt,
}: {
  createdByName?: string;
  createdAt?: string;
  updatedByName?: string;
  updatedAt?: string;
}) => {
  const creator = parseAuditString(createdByName);
  const editor = updatedByName ? parseAuditString(updatedByName) : null;
  const isEdited = !!editor && (!!updatedByName && updatedByName !== createdByName || (!!updatedAt && updatedAt !== createdAt));

  const roleLabel = (r: string) => (r === "Coordinator" ? "Farm Coordinator" : r);

  const fullTooltip = [
    `Created by: [${roleLabel(creator.role)}] ${creator.name}${creator.email ? ` (${creator.email})` : ""}${createdAt ? ` on ${formatDateTime(createdAt)}` : ""}`,
    isEdited && editor
      ? `Last edited by: [${roleLabel(editor.role)}] ${editor.name}${editor.email ? ` (${editor.email})` : ""}${updatedAt ? ` on ${formatDateTime(updatedAt)}` : ""}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-1 leading-tight" title={fullTooltip}>
      {/* Creator Info */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1 flex-wrap">
          <RoleBadge role={creator.role} />
          <span className="font-medium text-gray-800 text-xs">
            {creator.name}
          </span>
        </div>
        {creator.email && (
          <div className="text-[10px] text-gray-500 truncate max-w-[170px]" title={creator.email}>
            {creator.email}
          </div>
        )}
        {createdAt && (
          <div className="text-[10px] text-gray-400">
            {formatDateTime(createdAt)}
          </div>
        )}
      </div>

      {/* Editor Info (if modified) */}
      {isEdited && editor && (
        <div className="pt-1 mt-1 border-t border-dashed border-gray-200 flex flex-col gap-0.5 bg-amber-50/50 p-1 rounded">
          <div className="flex items-center gap-1 text-[10px] text-amber-900 flex-wrap">
            <span className="font-semibold text-amber-700">Edited:</span>
            <RoleBadge role={editor.role} />
            <span className="font-medium text-gray-800">
              {editor.name}
            </span>
          </div>
          {editor.email && (
            <div className="text-[10px] text-gray-500 truncate max-w-[160px]" title={editor.email}>
              {editor.email}
            </div>
          )}
          {updatedAt && (
            <div className="text-[10px] text-amber-700/80">
              {formatDateTime(updatedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FarmRecordsView = () => {
  const [farm, setFarm] = useState<{
    id: string;
    name: string;
    coordinator_id: string;
    project_category: string;
  } | null>(null);
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [expenses, setExpenses] = useState<FarmExpense[]>([]);
  const [sales, setSales] = useState<FarmSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORY);
  const [allUserFarms, setAllUserFarms] = useState<
    Array<{
      id: string;
      name: string;
      coordinator_id: string;
      project_category: string;
    }>
  >([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const isOrganicFoodNation =
    selectedCategory ===
    "Organic FoodNation (1 Million Hectares against Hunger)";
  const isMushroomVillage = farm?.project_category === "Mushroom Village";

  const calcSlotFee = (r: Pick<FarmRecord, "farm_slots">) => {
    const slotFeeRate =
      farm?.project_category === "Mushroom Village" ? 1000 : 2000;
    return r.farm_slots * slotFeeRate;
  };

  const getRecordTotal = (r: FarmRecord) =>
    calcSetup(r) +
    calcSupport(r) +
    calcSlotFee(r) +
    (isOrganicFoodNation ? 0 : calcFine(r));
  const {
    user: authUser,
    profile: authProfile,
    isAdmin: authIsAdmin,
    isSuperAdmin: authIsSuperAdmin,
    isCoordinator: authIsCoordinator,
    isSupport: authIsSupport,
  } = useAuth();
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const isSuperAdmin =
    currentUserEmail?.toLowerCase() === "developerelijah360@gmail.com" ||
    authIsSuperAdmin;
  const isAdmin = authIsAdmin || isSuperAdmin;
  const isSupport = authIsSupport || authProfile?.role === "support";
  const isFarmCoordinator =
    isCoordinator || authIsCoordinator || authProfile?.role === "coordinator";

  // Platform Admins, Super Admins, Support, and Designated Farm Coordinators can manage member records, expenses, and sales
  const canManageRecords = isSuperAdmin || isAdmin || isSupport || isFarmCoordinator;
  const canManageExpenses = isSuperAdmin || isAdmin || isSupport || isFarmCoordinator;
  const canManageSales = isSuperAdmin || isAdmin || isSupport || isFarmCoordinator;

  // Active user audit attribution context
  const currentUserRoleLabel = isSuperAdmin
    ? "Super Admin"
    : isAdmin
    ? "Admin"
    : isSupport
    ? "Support"
    : isFarmCoordinator
    ? "Farm Coordinator"
    : "Staff";

  const userDisplayName =
    authProfile?.full_name?.trim() ||
    authProfile?.email ||
    authUser?.email ||
    currentUserEmail ||
    "User";

  const userDisplayEmail = authUser?.email || authProfile?.email || currentUserEmail || "";

  const currentAuditAttribution = userDisplayEmail
    ? `[${currentUserRoleLabel}] ${userDisplayName} (${userDisplayEmail})`
    : `[${currentUserRoleLabel}] ${userDisplayName}`;

  const currentUserId = authProfile?.id || authUser?.id;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FarmRecord>>({});
  const [expenseFormData, setExpenseFormData] = useState<Partial<FarmExpense>>(
    {},
  );
  const [salesFormData, setSalesFormData] = useState<Partial<FarmSale>>({});
  const [customProduceName, setCustomProduceName] = useState("");
  const [emailLookupLoading, setEmailLookupLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const enrichRecordsWithBatches = async (
    records: FarmRecord[],
    projectCategory: string,
  ) => {
    if (!records || records.length === 0) return [];
    const enrichedRecords = [...records];
    const emails = [
      ...new Set(
        enrichedRecords
          .map((r) => r.email?.trim().toLowerCase())
          .filter((e) => e && e.includes("@")),
      ),
    ];

    if (emails.length === 0) return enrichedRecords;

    // Get user_ids from auth.users via RPC
    const { data: authUsers } = await supabase.rpc("get_user_ids_by_emails", {
      emails,
    });

    if (authUsers && authUsers.length > 0) {
      const userIds = authUsers.map((u: AuthUserRow) => u.user_id);
      const { data: payments } = await supabase.rpc(
        "get_users_category_payments_batch",
        {
          target_user_ids: userIds,
          target_category: projectCategory,
        },
      );
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, referral_code")
        .in("id", userIds);
      const referralCodesByUserId = new Map(
        (profilesData || []).map((profile: { id: string; referral_code?: string }) => [
          profile.id,
          profile.referral_code,
        ]),
      );

      if (payments) {
        const categoryPayments = payments as CategoryPaymentRow[];
        return enrichedRecords.map((record) => {
          const authUser = (authUsers as AuthUserRow[]).find(
            (u) => u.email?.toLowerCase() === record.email?.toLowerCase(),
          );
          if (!authUser) return record;

          const userPayments = categoryPayments.filter(
            (p) => p.user_id === authUser.user_id,
          );
          const getBatchInfo = (type: string) => {
            const typePayments = userPayments.filter(
              (p) => p.payment_type === type,
            );
            if (typePayments.length === 0)
              return { months: "", total: undefined };

            const monthsStr = typePayments
              .map((p) => p.months || 0)
              .join(", ");
            const totalPaid = typePayments.reduce(
              (sum, p) => sum + (p.amount || 0),
              0,
            );
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
            fine_batches: fine.months,
            referral_code:
              referralCodesByUserId.get(authUser.user_id) ||
              record.referral_code,
          };
        });
      }
    }
    return enrichedRecords;
  };

  const fetchRecords = async (categoryInput?: string, farmIdInput?: string) => {
    let categoryToUse = categoryInput || selectedCategory;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setCurrentUserEmail(user.email);

    // First: fetch all farm groups this user is associated with (as member or coordinator)
    // 1. Groups where user is a coordinator
    const { data: coordFarms } = await supabase
      .from("farm_groups")
      .select("*")
      .eq("coordinator_id", user.id);

    // 2. Groups where user is a member
    const { data: memberRecords } = await supabase
      .from("farm_records")
      .select("farm_id, farm_groups!inner(*)")
      .eq("email", user.email);

    const memberFarms =
      memberRecords?.map(
        (r) => r.farm_groups as unknown as FarmRecord["farm_groups"],
      ) || [];

    // 3. If admin, super_admin, or support, also fetch all farm groups across the platform
    let platformFarms: FarmRecord["farm_groups"][] = [];
    if (isAdmin || isSupport) {
      const { data: allFarms } = await supabase.from("farm_groups").select("*");
      platformFarms = (allFarms || []) as unknown as FarmRecord["farm_groups"][];
    }

    // Combine and deduplicate
    const combinedFarms = [...(coordFarms || []), ...memberFarms, ...platformFarms];
    const uniqueFarms = Array.from(
      new Map(combinedFarms.map((f) => [f.id, f])).values(),
    ) as Array<{ id: string; name: string; coordinator_id: string; project_category: string }>;

    setAllUserFarms(uniqueFarms);

    // Check farms matching current category
    let categoryFarms = uniqueFarms.filter(
      (f) => (f.project_category || "Gingertown") === categoryToUse,
    );

    // If user has no farm in the chosen category, but has farms in other categories, auto-switch to their available category
    if (categoryFarms.length === 0 && uniqueFarms.length > 0 && !categoryInput) {
      const firstAvailableCategory = uniqueFarms[0].project_category || "Gingertown";
      categoryToUse = firstAvailableCategory;
      setSelectedCategory(firstAvailableCategory);
      categoryFarms = uniqueFarms.filter(
        (f) => (f.project_category || "Gingertown") === firstAvailableCategory,
      );
    }

    // Pick active farm: by farmIdInput, or selectedFarmId, or first farm in category
    const activeFarm =
      categoryFarms.find((f) => f.id === (farmIdInput || selectedFarmId)) ||
      categoryFarms[0] ||
      null;

    if (activeFarm) {
      setFarm(activeFarm);
      setSelectedFarmId(activeFarm.id);
      setIsCoordinator(activeFarm.coordinator_id === user.id);

      const [recRes, expRes, salesRes] = await Promise.all([
        supabase
          .from("farm_records")
          .select("*")
          .eq("farm_id", activeFarm.id)
          .order("name"),
        supabase
          .from("farm_expenses")
          .select("*")
          .eq("farm_id", activeFarm.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("farm_sales")
          .select("*")
          .eq("farm_id", activeFarm.id)
          .order("sale_date", { ascending: false }),
      ]);

      if (recRes.data) {
        const enriched = await enrichRecordsWithBatches(
          recRes.data,
          activeFarm.project_category || "Gingertown",
        );
        setRecords(enriched);
      }
      setExpenses(expRes.data || []);
      setSales(salesRes.data || []);
    } else {
      setFarm(null);
      setSelectedFarmId(null);
      setRecords([]);
      setExpenses([]);
      setSales([]);
    }

    setLoading(false);
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setSelectedFarmId(null);
    fetchRecords(newCategory, undefined);
  };

  const handleFarmChange = (newFarmId: string) => {
    setSelectedFarmId(newFarmId);
    fetchRecords(selectedCategory, newFarmId);
  };

  useEffect(() => {
    fetchRecords();
    // Clear forms when category changes
    setShowAddForm(false);
    setShowExpenseForm(false);
    setShowSalesForm(false);
    setEditingId(null);
    setEditingExpenseId(null);
    setEditingSaleId(null);
    setFormData({});
    setExpenseFormData({});
    setSalesFormData({});
    setCustomProduceName("");
    setAutoFilled(false);
  }, [selectedCategory]);

  const handleAdd = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      farm_slots: 0,
      months_farm_setup: "0",
      months_farm_support: "0",
      absentee_fine: "0",
    });
    setAutoFilled(false);
    setShowAddForm(true);
  };

  const lookupUserByEmail = async (email: string) => {
    if (!email || !email.includes("@")) return;
    setEmailLookupLoading(true);

    const emailTrimmed = email.trim().toLowerCase();

    // 1. Get member details (name, phone, slots) — may be null if user has no slots
    const { data: rpcData } = await supabase.rpc(
      "get_member_details_by_email",
      {
        email_input: emailTrimmed,
      },
    );
    const memberData = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    // 2. Get user_id from auth.users via RPC (works for ANY registered user)
    const { data: authData } = await supabase.rpc("get_user_ids_by_emails", {
      emails: [emailTrimmed],
    });
    const userId =
      Array.isArray(authData) && authData.length > 0
        ? authData[0].user_id
        : null;

    if (!memberData && !userId) {
      setAutoFilled(false);
      setEmailLookupLoading(false);
      return;
    }

    // 3. Get accurate slots for this specific project category
    let categorySlots = 0;
    if (userId && farm) {
      const { data: slotsData } = await supabase.rpc(
        "get_user_category_slots",
        {
          target_user_id: userId,
          target_category: farm.project_category || "Gingertown",
        },
      );
      categorySlots = Number(slotsData || 0);
    }

    // 4. If no memberData but we have userId, get profile info (name, phone) from profiles table
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

    // 5. Get payment totals from other_payments
    if (userId) {
      const { data: payments } = await supabase.rpc(
        "get_user_category_payments",
        {
          target_user_id: userId,
          target_category: farm?.project_category || "Gingertown",
        },
      );

      const getTotalPaid = (type: string) => {
        if (!payments) return 0;
        return (payments as CategoryPaymentRow[])
          .filter(
            (p) => p.payment_type?.toLowerCase() === type.toLowerCase(),
          )
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      };

      const setupAmt = getTotalPaid("farm_setup");
      const supportAmt = getTotalPaid("farm_support");
      const fineAmt = getTotalPaid("absentee_fine");

      setFormData((prev) => ({
        ...prev,
        name: profileName || prev.name || "",
        phone: profilePhone || prev.phone || "",
        farm_slots: Math.max(Number(prev.farm_slots) || 0, categorySlots),
        months_farm_setup: Math.max(
          Number(prev.months_farm_setup) || 0,
          setupAmt,
        ).toString(),
        months_farm_support: Math.max(
          Number(prev.months_farm_support) || 0,
          supportAmt,
        ).toString(),
        absentee_fine: Math.max(
          Number(prev.absentee_fine) || 0,
          fineAmt,
        ).toString(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: profileName || prev.name || "",
        phone: profilePhone || prev.phone || "",
        farm_slots: Math.max(Number(prev.farm_slots) || 0, categorySlots),
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

    if (!canManageRecords) {
      showToast({
        variant: "error",
        title: "Permission Denied",
        description: "Only the Farm Coordinator or Platform Administrator can add or edit member records for this farm.",
      });
      return;
    }

    if (!formData.email?.trim()) {
      showToast({
        variant: "error",
        title: "Email is required",
        description: "Please enter the member's email.",
      });
      return;
    }
    if (!formData.name) {
      showToast({
        variant: "error",
        title: "Name required",
        description: "Please enter the member's name.",
      });
      return;
    }
    if (!formData.email) {
      showToast({
        variant: "error",
        title: "Email required",
        description: "Please enter the member's email address.",
      });
      return;
    }
    if (!formData.phone) {
      showToast({
        variant: "error",
        title: "Phone required",
        description: "Please enter the member's phone number.",
      });
      return;
    }
    if (!formData.farm_slots || formData.farm_slots <= 0) {
      showToast({
        variant: "error",
        title: "Farm Slots required",
        description: "This member has no farm slots purchased.",
      });
      return;
    }

    // On new record only: validate email uniqueness within the SAME CATEGORY
    if (!editingId && formData.email) {
      const sanitizedEmail = cleanEmail(formData.email);
      const { data: existingRecords } = await supabase
        .from("farm_records")
        .select("farm_id, farm_groups!inner(project_category)")
        .eq("email", sanitizedEmail);

      if (existingRecords && existingRecords.length > 0) {
        const inSameCategory = existingRecords.some((r) => {
          const fg = r.farm_groups as unknown as { project_category?: string } | null;
          return (fg?.project_category || "Gingertown") === farm.project_category;
        });

        if (inSameCategory) {
          showToast({
            variant: "error",
            title: "Member already exists",
            description: `This member is already registered in a farm group within the ${farm.project_category} category.`,
          });
          return;
        }
      }
    }

    let error;
    if (editingId) {
      const updatePayload = {
        name: cleanName(formData.name),
        email: cleanEmail(formData.email),
        phone: normalizePhoneNumber(formData.phone),
        farm_slots: parsePositiveInt(formData.farm_slots, 0),
        months_farm_setup: String(formData.months_farm_setup || ""),
        months_farm_support: String(formData.months_farm_support || ""),
        absentee_fine: isOrganicFoodNation ? "0" : String(formData.absentee_fine || "0"),
        farm_id: farm.id,
        project_category: farm.project_category || "Gingertown",
        updated_by: currentUserId,
        updated_by_name: currentAuditAttribution,
        updated_at: new Date().toISOString(),
      };
      ({ error } = await supabase
        .from("farm_records")
        .update(updatePayload)
        .eq("id", editingId));
    } else {
      const insertPayload = {
        name: cleanName(formData.name),
        email: cleanEmail(formData.email),
        phone: normalizePhoneNumber(formData.phone),
        farm_slots: parsePositiveInt(formData.farm_slots, 0),
        months_farm_setup: String(formData.months_farm_setup || ""),
        months_farm_support: String(formData.months_farm_support || ""),
        absentee_fine: isOrganicFoodNation ? "0" : String(formData.absentee_fine || "0"),
        farm_id: farm.id,
        project_category: farm.project_category || "Gingertown",
        created_by: currentUserId,
        created_by_name: currentAuditAttribution,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      ({ error } = await supabase.from("farm_records").insert(insertPayload));
    }
    if (error) {
      showToast({
        variant: "error",
        title: "Failed to save",
        description: error.message,
      });
      return;
    }
    showToast({
      variant: "success",
      title: editingId ? "Record updated" : "Record added",
    });
    setShowAddForm(false);
    setEditingId(null);
    setFormData({});
    setAutoFilled(false);
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    if (!canManageRecords) {
      showToast({
        variant: "error",
        title: "Permission Denied",
        description: "Only the Farm Coordinator or Platform Administrator can delete member records from this farm.",
      });
      return;
    }
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from("farm_records").delete().eq("id", id);
    if (error) {
      showToast({
        variant: "error",
        title: "Failed to delete",
        description: error.message,
      });
      return;
    }
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
    if (!canManageExpenses) {
      showToast({
        variant: "error",
        title: "Permission Denied",
        description: "Only the Farm Coordinator or Platform Administrator can log or modify expenses for this farm group.",
      });
      return;
    }
    if (!expenseFormData.category) {
      showToast({
        variant: "error",
        title: "Category required",
        description: "Please select an expense category.",
      });
      return;
    }
    if (!expenseFormData.amount || expenseFormData.amount <= 0) {
      showToast({
        variant: "error",
        title: "Amount required",
        description: "Please enter a valid expense amount.",
      });
      return;
    }

    let error;
    if (editingExpenseId) {
      const updateData = {
        category: expenseFormData.category,
        amount: Number(expenseFormData.amount) || 0,
        description: expenseFormData.description?.trim() || null,
        updated_by: currentUserId,
        updated_by_name: currentAuditAttribution,
        updated_at: new Date().toISOString(),
      };
      ({ error } = await supabase
        .from("farm_expenses")
        .update(updateData)
        .eq("id", editingExpenseId));
    } else {
      const insertData = {
        category: expenseFormData.category,
        amount: Number(expenseFormData.amount) || 0,
        description: expenseFormData.description?.trim() || null,
        farm_id: farm.id,
        created_by: currentUserId,
        created_by_name: currentAuditAttribution,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      ({ error } = await supabase.from("farm_expenses").insert(insertData));
    }

    if (error) {
      showToast({
        variant: "error",
        title: "Failed to save",
        description: error.message,
      });
      return;
    }
    showToast({
      variant: "success",
      title: editingExpenseId ? "Expense updated" : "Expense added",
    });
    setShowExpenseForm(false);
    setEditingExpenseId(null);
    setExpenseFormData({});
    fetchRecords();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!canManageExpenses) {
      showToast({
        variant: "error",
        title: "Permission Denied",
        description: "Only the Farm Coordinator or Platform Administrator can delete expenses from this farm group.",
      });
      return;
    }
    if (!confirm("Delete this expense record?")) return;
    const { error } = await supabase
      .from("farm_expenses")
      .delete()
      .eq("id", id);
    if (error) {
      showToast({
        variant: "error",
        title: "Failed to delete",
        description: error.message,
      });
      return;
    }
    showToast({ variant: "success", title: "Expense deleted" });
    fetchRecords();
  };

  const handleAddSale = () => {
    const defaultProduce = isMushroomVillage ? "Fresh Oyster Mushrooms" : "Fresh Harvest Produce";
    setSalesFormData({
      produce_name: defaultProduce,
      quantity: 1,
      unit: "kg",
      unit_price: 0,
      amount: 0,
      buyer_name: "",
      sales_channel: "Offtaker",
      sale_date: new Date().toISOString().split("T")[0],
      description: "",
    });
    setCustomProduceName("");
    setEditingSaleId(null);
    setShowSalesForm(true);
  };

  const handleEditSale = (sale: FarmSale) => {
    const presets = getProducePresets(farm?.project_category);
    const isCustom = !presets.includes(sale.produce_name);
    setSalesFormData({
      ...sale,
      produce_name: isCustom ? "Custom Produce / Other" : sale.produce_name,
    });
    setCustomProduceName(isCustom ? sale.produce_name : "");
    setEditingSaleId(sale.id);
    setShowSalesForm(true);
  };

  const cancelSaleEdit = () => {
    setShowSalesForm(false);
    setEditingSaleId(null);
    setSalesFormData({});
    setCustomProduceName("");
  };

  const handleSaveSale = async () => {
    if (!farm) return;
    if (!canManageSales) {
      showToast({
        variant: "error",
        title: "Permission Denied",
        description: "Only the Farm Coordinator or Platform Administrator can log or modify sales for this farm group.",
      });
      return;
    }

    let finalProduceName = salesFormData.produce_name || "";
    if (finalProduceName === "Custom Produce / Other") {
      finalProduceName = customProduceName.trim();
    }
    if (!finalProduceName) {
      showToast({
        variant: "error",
        title: "Produce name required",
        description: "Please select or enter the produce name.",
      });
      return;
    }

    const qty = Number(salesFormData.quantity) || 0;
    const amount = Number(salesFormData.amount) || 0;
    if (amount <= 0 && qty <= 0) {
      showToast({
        variant: "error",
        title: "Amount or Quantity required",
        description: "Please enter a valid sales quantity or total revenue amount.",
      });
      return;
    }

    let error;
    if (editingSaleId) {
      const updatePayload = {
        produce_name: finalProduceName,
        quantity: qty > 0 ? qty : 1,
        unit: salesFormData.unit || "kg",
        unit_price: Number(salesFormData.unit_price) || 0,
        amount: amount > 0 ? amount : (qty * (Number(salesFormData.unit_price) || 0)),
        buyer_name: salesFormData.buyer_name?.trim() || null,
        sales_channel: salesFormData.sales_channel || "Offtaker",
        sale_date: salesFormData.sale_date || new Date().toISOString().split("T")[0],
        description: salesFormData.description?.trim() || null,
        updated_by: currentUserId,
        updated_by_name: currentAuditAttribution,
        updated_at: new Date().toISOString(),
      };
      ({ error } = await supabase
        .from("farm_sales")
        .update(updatePayload)
        .eq("id", editingSaleId));
    } else {
      const insertPayload = {
        farm_id: farm.id,
        produce_name: finalProduceName,
        quantity: qty > 0 ? qty : 1,
        unit: salesFormData.unit || "kg",
        unit_price: Number(salesFormData.unit_price) || 0,
        amount: amount > 0 ? amount : (qty * (Number(salesFormData.unit_price) || 0)),
        buyer_name: salesFormData.buyer_name?.trim() || null,
        sales_channel: salesFormData.sales_channel || "Offtaker",
        sale_date: salesFormData.sale_date || new Date().toISOString().split("T")[0],
        description: salesFormData.description?.trim() || null,
        created_by: currentUserId,
        created_by_name: currentAuditAttribution,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      ({ error } = await supabase.from("farm_sales").insert(insertPayload));
    }

    if (error) {
      showToast({
        variant: "error",
        title: "Failed to save sale",
        description: error.message,
      });
      return;
    }

    showToast({
      variant: "success",
      title: editingSaleId ? "Sale record updated" : "Sales revenue recorded",
    });
    setShowSalesForm(false);
    setEditingSaleId(null);
    setSalesFormData({});
    setCustomProduceName("");
    fetchRecords();
  };

  const handleDeleteSale = async (id: string) => {
    if (!canManageSales) {
      showToast({
        variant: "error",
        title: "Permission Denied",
        description: "Only the Farm Coordinator or Platform Administrator can delete sales from this farm group.",
      });
      return;
    }
    if (!confirm("Delete this sales revenue record?")) return;
    const { error } = await supabase
      .from("farm_sales")
      .delete()
      .eq("id", id);
    if (error) {
      showToast({
        variant: "error",
        title: "Failed to delete",
        description: error.message,
      });
      return;
    }
    showToast({ variant: "success", title: "Sale record deleted" });
    fetchRecords();
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({});
    setAutoFilled(false);
  };
  const cancelExpenseEdit = () => {
    setShowExpenseForm(false);
    setEditingExpenseId(null);
    setExpenseFormData({});
  };
  const set = (field: keyof FarmRecord, val: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: val }));

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading farm records...</p>
        </div>
      </div>
    );

  if (!farm)
    return (
      <div className="p-4 md:p-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Farm Records
              </h2>
              <p className="text-gray-600">
                Select a project category to view records
              </p>
            </div>
            <div className="flex flex-col gap-2 no-print">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-9 w-full max-w-[250px] sm:max-w-xs md:max-w-sm lg:max-w-md rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm text-ellipsis overflow-hidden whitespace-nowrap"
              >
                {PROJECT_CATEGORIES.map((cat) => {
                  const count = allUserFarms.filter(
                    (f) => (f.project_category || "Gingertown") === cat,
                  ).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} {count > 0 ? `(${count} group${count > 1 ? "s" : ""})` : ""}
                    </option>
                  );
                })}
              </select>

              {/* Quick Multi-Category Navigator */}
              {allUserFarms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-gray-500 font-medium">Your Categories:</span>
                  {Array.from(new Set(allUserFarms.map((f) => f.project_category || "Gingertown"))).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 transition-all"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-600">
                No farm group found for {selectedCategory}.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                You are not registered under this category, contact your
                coordinator.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Want to be a farm coordinator? Contact the admin.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  const totalFarmSlots = records.reduce((s, r) => s + r.farm_slots, 0);
  const totalFarmSupport = records.reduce((s, r) => s + calcSupport(r), 0);
  const totalFarmSetup = records.reduce((s, r) => s + calcSetup(r), 0);
  const totalAbsenteeFine = records.reduce((s, r) => s + calcFine(r), 0);
  const totalExpensesValue = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalSalesRevenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const harvestNetProfit = totalSalesRevenue - totalExpensesValue;
  const netProfitMargin = totalSalesRevenue > 0 ? (harvestNetProfit / totalSalesRevenue) * 100 : 0;

  const totalFarmIncome = records.reduce((s, r) => s + getRecordTotal(r), 0);
  const slotFeeRate = selectedCategory === "Mushroom Village" ? 1000 : 2000;
  const agrohealBalance = totalFarmSlots * slotFeeRate + totalFarmSupport;
  const grossBalance =
    totalFarmSetup + (isOrganicFoodNation ? 0 : totalAbsenteeFine);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-0.5">
                  {farm?.name || "No"} Records
                </h2>
                <p className="text-gray-600 text-xs">
                  {farm?.project_category} • Bookkeeping and finance tracking
                </p>
              </div>

              {/* Controls: Category Selector & Farm Group Selector */}
              <div className="flex items-center gap-2 flex-wrap no-print">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                >
                  {PROJECT_CATEGORIES.map((cat) => {
                    const count = allUserFarms.filter(
                      (f) => (f.project_category || "Gingertown") === cat,
                    ).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} {count > 0 ? `(${count} group${count > 1 ? "s" : ""})` : ""}
                      </option>
                    );
                  })}
                </select>

                {/* Farm Group Selector when multiple groups exist in category */}
                {allUserFarms.filter((f) => (f.project_category || "Gingertown") === selectedCategory).length > 1 && (
                  <select
                    value={farm?.id || ""}
                    onChange={(e) => handleFarmChange(e.target.value)}
                    className="h-9 rounded-lg border border-emerald-300 bg-emerald-50/70 px-3 text-xs font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                    title="Switch between your farm groups in this category"
                  >
                    {allUserFarms
                      .filter((f) => (f.project_category || "Gingertown") === selectedCategory)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} {f.coordinator_id === currentUserId ? "★ (Coordinator)" : ""}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            {/* Quick Multi-Category Navigator Bar if user has farm groups in more than one category */}
            {Array.from(new Set(allUserFarms.map((f) => f.project_category || "Gingertown"))).length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap no-print">
                <span className="text-[11px] text-gray-500 font-medium">Switch Category:</span>
                {Array.from(new Set(allUserFarms.map((f) => f.project_category || "Gingertown"))).map((cat) => {
                  const isCurrent = cat === selectedCategory;
                  const catFarms = allUserFarms.filter((f) => (f.project_category || "Gingertown") === cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-green-800 text-white shadow-sm ring-1 ring-green-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          isCurrent ? "bg-green-900 text-green-100" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {catFarms.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="no-print border-green-800 text-green-800 hover:bg-green-50 w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </motion.div>

        {!canManageRecords && !canManageExpenses && !canManageSales && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm no-print">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-5 h-5 text-slate-500" />
              <span>Read-Only View</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              You have read-only access to this farm group. Farm records, operating expenses, and harvest sales can only be created or modified by Farm Coordinators, Customer Support, and Platform Administrators.
            </p>
          </div>
        )}

        {(canManageRecords || canManageExpenses || canManageSales) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 flex flex-col sm:flex-row gap-3 no-print"
          >
            {canManageRecords && (
              <Button
                onClick={handleAdd}
                className="bg-green-800 hover:bg-green-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Member Record
              </Button>
            )}
            {canManageSales && (
              <Button
                onClick={handleAddSale}
                className="bg-emerald-700 hover:bg-emerald-600 text-white w-full sm:w-auto shadow-sm"
              >
                <TrendingUp className="w-4 h-4 mr-2" /> Add Sales Revenue
              </Button>
            )}
            {canManageExpenses && (
              <Button
                onClick={handleAddExpense}
                variant="outline"
                className="border-green-800 text-green-800 hover:bg-green-50 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Expenses
              </Button>
            )}
          </motion.div>
        )}

        {(showAddForm || editingId) && canManageRecords && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingId ? "Edit Record" : "Add New Record"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId && (formData.created_by_name || formData.updated_by_name) && (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
                    <div className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      <span>Audit Trail History</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 block text-[11px] mb-0.5">Original Creator</span>
                        {(() => {
                          const audit = parseAuditString(formData.created_by_name);
                          return (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <RoleBadge role={audit.role} />
                                <span className="font-medium text-gray-800">{audit.name}</span>
                              </div>
                              {audit.email && (
                                <div className="text-[11px] text-gray-500 mt-0.5">{audit.email}</div>
                              )}
                              {formData.created_at && (
                                <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(formData.created_at)}</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {formData.updated_by_name && (
                        <div>
                          <span className="text-gray-500 block text-[11px] mb-0.5">Last Modified By</span>
                          {(() => {
                            const audit = parseAuditString(formData.updated_by_name);
                            return (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <RoleBadge role={audit.role} />
                                  <span className="font-medium text-gray-800">{audit.name}</span>
                                </div>
                                {audit.email && (
                                  <div className="text-[11px] text-gray-500 mt-0.5">{audit.email}</div>
                                )}
                                {formData.updated_at && (
                                  <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(formData.updated_at)}</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                        className={
                          editingId
                            ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                            : ""
                        }
                      />
                      {emailLookupLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    {autoFilled && (
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        ✓ Member details auto-filled from profile
                      </p>
                    )}
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          months_farm_setup: e.target.value,
                        }))
                      }
                      placeholder="Auto-filled or enter amount"
                    />
                  </div>
                  <div>
                    <Label>Total Farm Support Paid (₦)</Label>
                    <Input
                      type="number"
                      value={formData.months_farm_support ?? "0"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          months_farm_support: e.target.value,
                        }))
                      }
                      placeholder="Auto-filled or enter amount"
                    />
                  </div>
                  {!isMushroomVillage && !isOrganicFoodNation && (
                    <div>
                      <Label>Total Absentee Fine Paid (₦)</Label>
                      <Input
                        type="number"
                        value={formData.absentee_fine ?? "0"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            absentee_fine: e.target.value,
                          }))
                        }
                        placeholder="Auto-filled or enter amount"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-green-800 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={cancelEdit} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showExpenseForm && canManageExpenses && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingExpenseId ? "Edit Expense" : "Add New Expense"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingExpenseId && (expenseFormData.created_by_name || expenseFormData.updated_by_name) && (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
                    <div className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      <span>Audit Trail History</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 block text-[11px] mb-0.5">Original Creator</span>
                        {(() => {
                          const audit = parseAuditString(expenseFormData.created_by_name);
                          return (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <RoleBadge role={audit.role} />
                                <span className="font-medium text-gray-800">{audit.name}</span>
                              </div>
                              {audit.email && (
                                <div className="text-[11px] text-gray-500 mt-0.5">{audit.email}</div>
                              )}
                              {expenseFormData.created_at && (
                                <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(expenseFormData.created_at)}</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {expenseFormData.updated_by_name && (
                        <div>
                          <span className="text-gray-500 block text-[11px] mb-0.5">Last Modified By</span>
                          {(() => {
                            const audit = parseAuditString(expenseFormData.updated_by_name);
                            return (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <RoleBadge role={audit.role} />
                                  <span className="font-medium text-gray-800">{audit.name}</span>
                                </div>
                                {audit.email && (
                                  <div className="text-[11px] text-gray-500 mt-0.5">{audit.email}</div>
                                )}
                                {expenseFormData.updated_at && (
                                  <div className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(expenseFormData.updated_at)}</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={expenseFormData.category || ""}
                      onChange={(e) =>
                        setExpenseFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {getExpenseCategories(farm?.project_category).map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <Label>Amount (₦)</Label>
                    <Input
                      type="number"
                      value={expenseFormData.amount ?? 0}
                      onChange={(e) =>
                        setExpenseFormData((prev) => ({
                          ...prev,
                          amount: Number(e.target.value),
                        }))
                      }
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
                  <Button
                    onClick={handleSaveExpense}
                    className="bg-green-800 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={cancelExpenseEdit} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showSalesForm && canManageSales && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="border-2 border-emerald-600/30 shadow-md">
              <CardHeader className="bg-emerald-50/50">
                <CardTitle className="text-emerald-950 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  {editingSaleId ? "Edit Produce Sales Record" : "Record Produce Sales Revenue"}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Record produce sales from mushroom harvest, ginger, or other farm outputs. Subtraction of operating expenses from sales revenue yields the net profit.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {editingSaleId && (salesFormData.created_by_name || salesFormData.updated_by_name) && (
                  <div className="rounded-md bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-900">
                    <div className="font-semibold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      <span>Audit Trail History</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-700/80 block text-[11px] mb-0.5">Original Creator</span>
                        {(() => {
                          const audit = parseAuditString(salesFormData.created_by_name);
                          return (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <RoleBadge role={audit.role} />
                                <span className="font-medium text-gray-900">{audit.name}</span>
                              </div>
                              {audit.email && (
                                <div className="text-[11px] text-gray-600 mt-0.5">{audit.email}</div>
                              )}
                              {salesFormData.created_at && (
                                <div className="text-[10px] text-gray-500 mt-0.5">{formatDateTime(salesFormData.created_at)}</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      {salesFormData.updated_by_name && (
                        <div>
                          <span className="text-emerald-700/80 block text-[11px] mb-0.5">Last Modified By</span>
                          {(() => {
                            const audit = parseAuditString(salesFormData.updated_by_name);
                            return (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <RoleBadge role={audit.role} />
                                  <span className="font-medium text-gray-900">{audit.name}</span>
                                </div>
                                {audit.email && (
                                  <div className="text-[11px] text-gray-600 mt-0.5">{audit.email}</div>
                                )}
                                {salesFormData.updated_at && (
                                  <div className="text-[10px] text-gray-500 mt-0.5">{formatDateTime(salesFormData.updated_at)}</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Produce Name</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={salesFormData.produce_name || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSalesFormData((prev) => ({ ...prev, produce_name: val }));
                        if (val !== "Custom Produce / Other") {
                          setCustomProduceName("");
                        }
                      }}
                    >
                      {getProducePresets(farm?.project_category).map((prod) => (
                        <option key={prod} value={prod}>
                          {prod}
                        </option>
                      ))}
                    </select>
                  </div>

                  {salesFormData.produce_name === "Custom Produce / Other" && (
                    <div>
                      <Label>Custom Produce Name</Label>
                      <Input
                        value={customProduceName}
                        onChange={(e) => setCustomProduceName(e.target.value)}
                        placeholder="e.g. Fresh Lion's Mane, Dried Chili"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Sale Date</Label>
                    <Input
                      type="date"
                      value={salesFormData.sale_date || new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setSalesFormData((prev) => ({
                          ...prev,
                          sale_date: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label>Sales Channel</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={salesFormData.sales_channel || "Offtaker"}
                      onChange={(e) =>
                        setSalesFormData((prev) => ({
                          ...prev,
                          sales_channel: e.target.value,
                        }))
                      }
                    >
                      {SALES_CHANNELS.map((ch) => (
                        <option key={ch} value={ch}>
                          {ch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="any"
                      value={salesFormData.quantity ?? 1}
                      onChange={(e) => {
                        const q = parseFloat(e.target.value) || 0;
                        const p = Number(salesFormData.unit_price) || 0;
                        setSalesFormData((prev) => ({
                          ...prev,
                          quantity: q,
                          amount: p > 0 ? q * p : prev.amount,
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <Label>Unit of Measure</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={salesFormData.unit || "kg"}
                      onChange={(e) =>
                        setSalesFormData((prev) => ({
                          ...prev,
                          unit: e.target.value,
                        }))
                      }
                    >
                      {UNITS_OF_MEASURE.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Unit Price (₦ per unit)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={salesFormData.unit_price ?? 0}
                      onChange={(e) => {
                        const p = parseFloat(e.target.value) || 0;
                        const q = Number(salesFormData.quantity) || 0;
                        setSalesFormData((prev) => ({
                          ...prev,
                          unit_price: p,
                          amount: q > 0 ? q * p : prev.amount,
                        }));
                      }}
                      placeholder="e.g. 3500"
                    />
                  </div>

                  <div>
                    <Label>Total Sales Revenue (₦)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={salesFormData.amount ?? 0}
                      onChange={(e) =>
                        setSalesFormData((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="font-bold text-emerald-800"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Auto-calculated from Qty × Unit Price, or override for negotiated bulk lot.
                    </p>
                  </div>

                  <div>
                    <Label>Buyer / Customer / Offtaker (Optional)</Label>
                    <Input
                      value={salesFormData.buyer_name || ""}
                      onChange={(e) =>
                        setSalesFormData((prev) => ({
                          ...prev,
                          buyer_name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Mile 12 Wholesale Buyer"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <Label>Harvest Batch / Notes (Optional)</Label>
                    <Input
                      value={salesFormData.description || ""}
                      onChange={(e) =>
                        setSalesFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="e.g. Grade A harvest from mushroom house #1, morning flush"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveSale}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingSaleId ? "Update Sale" : "Save Sales Revenue"}
                  </Button>
                  <Button onClick={cancelSaleEdit} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Member Records ({records.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No records found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2">Member ID</th>
                        <th className="text-left p-2">Farm Slots</th>
                        {isMushroomVillage ? (
                          <th className="text-left p-2">
                            Slot & Admin Marketing
                          </th>
                        ) : (
                          <th className="text-left p-2">Slot Fee</th>
                        )}
                        <th className="text-left p-2">Farm Setup</th>
                        {!isMushroomVillage && (
                          <th className="text-left p-2">Farm Support</th>
                        )}
                        {!isMushroomVillage && !isOrganicFoodNation && (
                          <th className="text-left p-2">Absentee Fine</th>
                        )}
                        <th className="text-left p-2">Total</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Recorded By / Audit</th>
                        {canManageRecords && (
                          <th className="text-left p-2">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-2 font-medium">
                            <div>
                              {record.referral_code?.toUpperCase() ||
                                record.name ||
                                "—"}
                            </div>
                            {record.name && record.referral_code && (
                              <div className="text-[11px] text-gray-500 font-normal">
                                {record.name}
                              </div>
                            )}
                          </td>
                          <td className="p-2">{record.farm_slots}</td>
                          {isMushroomVillage ? (
                            <td className="p-2 font-semibold text-blue-900">
                              ₦
                              {(
                                calcSlotFee(record) + calcSupport(record)
                              ).toLocaleString()}
                            </td>
                          ) : (
                            <td className="p-2">
                              ₦{calcSlotFee(record).toLocaleString()}
                            </td>
                          )}
                          <td className="p-2">
                            <div className="font-semibold text-green-900">
                              ₦{calcSetup(record).toLocaleString()}
                            </div>
                            {record.setup_batches && (
                              <div className="text-[10px] text-gray-400 leading-tight">
                                Months: {record.setup_batches}
                              </div>
                            )}
                          </td>
                          {!isMushroomVillage && (
                            <td className="p-2 font-semibold text-blue-900">
                              ₦{calcSupport(record).toLocaleString()}
                            </td>
                          )}
                          {!isMushroomVillage && !isOrganicFoodNation && (
                            <td className="p-2">
                              <div className="font-semibold text-orange-900">
                                ₦{calcFine(record).toLocaleString()}
                              </div>
                              {record.fine_batches && (
                                <div className="text-[10px] text-gray-400 leading-tight">
                                  Months: {record.fine_batches}
                                </div>
                              )}
                            </td>
                          )}
                          <td className="p-2 font-semibold text-green-800">
                            ₦{getRecordTotal(record).toLocaleString()}
                          </td>
                          <td className="p-2 text-gray-600">{record.email}</td>
                          <td className="p-2 text-xs text-gray-500">
                            <AuditTrailCell
                              createdByName={record.created_by_name}
                              createdAt={record.created_at}
                              updatedByName={record.updated_by_name}
                              updatedAt={record.updated_at}
                            />
                          </td>
                          {canManageRecords && (
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleEdit(record)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleDelete(record.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-semibold bg-gray-100">
                        <td className="p-2">Total</td>
                        <td className="p-2">
                          {records.reduce((s, r) => s + r.farm_slots, 0)}
                        </td>
                        {isMushroomVillage ? (
                          <td className="p-2">
                            ₦
                            {records
                              .reduce(
                                (s, r) => s + calcSlotFee(r) + calcSupport(r),
                                0,
                              )
                              .toLocaleString()}
                          </td>
                        ) : (
                          <td className="p-2">
                            ₦
                            {records
                              .reduce((s, r) => s + calcSlotFee(r), 0)
                              .toLocaleString()}
                          </td>
                        )}
                        <td className="p-2">
                          ₦
                          {records
                            .reduce((s, r) => s + calcSetup(r), 0)
                            .toLocaleString()}
                        </td>
                        {!isMushroomVillage && (
                          <td className="p-2">
                            ₦
                            {records
                              .reduce((s, r) => s + calcSupport(r), 0)
                              .toLocaleString()}
                          </td>
                        )}
                        {!isMushroomVillage && !isOrganicFoodNation && (
                          <td className="p-2">
                            ₦
                            {records
                              .reduce((s, r) => s + calcFine(r), 0)
                              .toLocaleString()}
                          </td>
                        )}
                        <td className="p-2 font-bold text-green-800">
                          ₦
                          {records
                            .reduce((s, r) => s + getRecordTotal(r), 0)
                            .toLocaleString()}
                        </td>
                        <td className="p-2" />
                        <td className="p-2" />
                        {canManageRecords && <td className="p-2" />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Harvest Produce Sales Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8"
        >
          <Card className="border border-emerald-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  Harvest Produce Sales ({sales.length})
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Produce harvest revenue, offtake sales, and commercial trading distributions
                </p>
              </div>
              {canManageSales && (
                <Button
                  onClick={handleAddSale}
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white no-print"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Sale
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No produce sales records logged yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Now that harvest has started, record sales revenue to track commercial net profit.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-emerald-50/50">
                        <th className="text-left p-2">Sale Date</th>
                        <th className="text-left p-2">Produce</th>
                        <th className="text-left p-2">Channel</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-right p-2">Total Revenue</th>
                        <th className="text-left p-2">Buyer</th>
                        <th className="text-left p-2">Recorded By / Audit</th>
                        {canManageSales && (
                          <th className="text-center p-2 no-print">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-gray-600 whitespace-nowrap">
                            {formatDateOnly(sale.sale_date)}
                          </td>
                          <td className="p-2 font-medium text-gray-900">
                            {sale.produce_name}
                            {sale.description && (
                              <div className="text-[11px] text-gray-400 italic">
                                {sale.description}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              {sale.sales_channel || "Offtaker"}
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            {Number(sale.quantity).toLocaleString()} {sale.unit || "kg"}
                          </td>
                          <td className="p-2 text-right text-gray-600">
                            {sale.unit_price > 0 ? `₦${Number(sale.unit_price).toLocaleString()}` : "—"}
                          </td>
                          <td className="p-2 text-right font-bold text-emerald-800">
                            ₦{Number(sale.amount).toLocaleString()}
                          </td>
                          <td className="p-2 text-gray-700">
                            {sale.buyer_name || "—"}
                          </td>
                          <td className="p-2 text-xs text-gray-500 whitespace-nowrap">
                            <AuditTrailCell
                              createdByName={sale.created_by_name}
                              createdAt={sale.created_at}
                              updatedByName={sale.updated_by_name}
                              updatedAt={sale.updated_at}
                            />
                          </td>
                          {canManageSales && (
                            <td className="p-2 no-print">
                              <div className="flex justify-center gap-1">
                                <Button
                                  onClick={() => handleEditSale(sale)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteSale(sale.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold bg-emerald-50/60">
                        <td colSpan={5} className="p-2 text-right uppercase tracking-wider text-emerald-950">
                          Total Sales Revenue
                        </td>
                        <td className="p-2 text-right text-emerald-900 text-base font-black">
                          ₦{totalSalesRevenue.toLocaleString()}
                        </td>
                        <td colSpan={canManageSales ? 3 : 2} className="p-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Farm Expenses ({expenses.length})</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Operational inputs, labor, infrastructure, and maintenance costs
                </p>
              </div>
              {canManageExpenses && (
                <Button
                  onClick={handleAddExpense}
                  size="sm"
                  variant="outline"
                  className="border-green-800 text-green-800 hover:bg-green-50 no-print"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Expense
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No expense records found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Category</th>
                        <th className="text-right p-2">Amount</th>
                        <th className="text-left p-2">Recorded By / Audit</th>
                        {canManageExpenses && (
                          <th className="text-center p-2 no-print">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-2 text-gray-600 whitespace-nowrap">
                            {formatDateOnly(expense.created_at)}
                          </td>
                          <td className="p-2 font-medium text-gray-900">
                            {expense.category}
                            {expense.description && (
                              <div className="text-[11px] text-gray-400 italic">
                                {expense.description}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-right font-semibold text-gray-900">
                            ₦{Number(expense.amount).toLocaleString()}
                          </td>
                          <td className="p-2 text-xs text-gray-500 whitespace-nowrap">
                            <AuditTrailCell
                              createdByName={expense.created_by_name}
                              createdAt={expense.created_at}
                              updatedByName={expense.updated_by_name}
                              updatedAt={expense.updated_at}
                            />
                          </td>
                          {canManageExpenses && (
                            <td className="p-2 no-print">
                              <div className="flex justify-center gap-1">
                                <Button
                                  onClick={() => handleEditExpense(expense)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleDeleteExpense(expense.id)
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold bg-gray-100">
                        <td
                          colSpan={2}
                          className="p-2 text-right uppercase tracking-wider"
                        >
                          Total Expenses
                        </td>
                        <td className="p-2 text-right text-red-700 text-base font-bold">
                          ₦{totalExpensesValue.toLocaleString()}
                        </td>
                        <td colSpan={canManageExpenses ? 2 : 1} className="p-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Balance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 mb-12 space-y-6"
        >
          {/* Card 1: Commercial Harvest Operations & Net Profit */}
          <Card className="border-2 border-emerald-800/30 overflow-hidden shadow-sm">
            <CardHeader className="bg-emerald-800 text-white py-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-300" />
                    <span>Commercial Harvest Operations & Net Profit</span>
                  </CardTitle>
                  <p className="text-xs text-emerald-100 mt-1">
                    Produce sales revenue vs. operating expenses for {farm.name}
                  </p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    harvestNetProfit >= 0 ? "bg-emerald-900 text-emerald-200 border border-emerald-400" : "bg-amber-900 text-amber-200 border border-amber-400"
                  }`}>
                    {harvestNetProfit >= 0 ? "Operating Profit" : "Ramping Up (Pre-Profit)"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-emerald-50/40">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                      Total Sales Revenue
                    </h4>
                    <p className="text-xs text-gray-500">
                      (Sum of all recorded produce sales & harvest offtake)
                    </p>
                  </div>
                  <span className="text-xl font-bold text-emerald-800">
                    ₦{totalSalesRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Total Farm Operating Expenses
                    </h4>
                    <p className="text-xs text-gray-500">
                      (Sum of all farm inputs, operations, salaries, and maintenance)
                    </p>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    ₦{totalExpensesValue.toLocaleString()}
                  </span>
                </div>

                <div className={`p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  harvestNetProfit >= 0 ? "bg-emerald-100/60" : "bg-amber-50"
                }`}>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      Harvest Net Profit
                      {totalSalesRevenue > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          harvestNetProfit >= 0 ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"
                        }`}>
                          Margin: {netProfitMargin.toFixed(1)}%
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Total Sales Revenue minus Total Farm Operating Expenses
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-3xl font-black ${
                        harvestNetProfit >= 0 ? "text-emerald-800" : "text-amber-800"
                      }`}
                    >
                      {harvestNetProfit < 0 ? "-" : ""}₦{Math.abs(harvestNetProfit).toLocaleString()}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {harvestNetProfit >= 0 ? "Commercial Net Gain from Harvest Operations" : "Operating Deficit (Expenses exceed produce revenue to date)"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Member Capital & Setup Account */}
          <Card className="border-2 border-green-800/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-green-800 text-white py-4">
              <CardTitle className="text-xl">Member Capital & Setup Account</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Total Member Contributions
                    </h4>
                    <p className="text-xs text-gray-500">
                      (Total sum of all member setup, support & slot payments)
                    </p>
                  </div>
                  <span className="text-xl font-bold text-green-800">
                    ₦{totalFarmIncome.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Agroheal Platform Fees
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      {isMushroomVillage
                        ? "(Slot & Admin Marketing)"
                        : "(Farm Slot Admin/Marketing + Agroheal Farm Support)"}
                    </p>
                  </div>
                  <span className="text-xl font-bold text-green-800">
                    ₦{agrohealBalance.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {farm.name} Setup Capital
                    </h4>
                    <p className="text-xs text-gray-500">
                      {isMushroomVillage
                        ? "(Farm Setup Capital)"
                        : isOrganicFoodNation
                          ? "(Total Farm Setup)"
                          : "(Farm Setup + Total Absentee Fine)"}
                    </p>
                  </div>
                  <span className="text-xl font-bold text-green-800">
                    ₦{grossBalance.toLocaleString()}
                  </span>
                </div>

                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gray-50/50">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Capital Deployed into Operations
                    </h4>
                    <p className="text-xs text-gray-500">
                      (Sum of recorded expenses funded from setup pool)
                    </p>
                  </div>
                  <span className="text-xl font-bold text-red-600">
                    ₦{totalExpensesValue.toLocaleString()}
                  </span>
                </div>

                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-green-50">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Remaining Setup Capital
                    </h3>
                    <p className="text-sm text-gray-600">
                      Remaining capital buffer after setup expenses
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-3xl font-black ${netBalance >= 0 ? "text-green-800" : "text-red-800"}`}
                    >
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
