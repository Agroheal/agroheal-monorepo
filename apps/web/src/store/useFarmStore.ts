import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

export interface ClusterFinancials {
  contributions: number;
  expenses: number;
  sales: number;
  net_balance: number;
}

export interface FarmClusterItem {
  id: string;
  farm_id: string;
  farm_name: string;
  category: string;
  slots_held: number;
  fruiting_bags: number;
  status: string;
  coordinator_id: string | null;
  financials: ClusterFinancials;
  expenses: Array<{ date: string; description: string; amount: number }>;
  sales: Array<{ date: string; produce: string; quantity: string; amount: number }>;
  source: "subscription" | "farm_record" | "other_payment";
}

export interface FarmState {
  totalSlots: number;
  mushroomSlots: number;
  gingerSlots: number;
  clusters: FarmClusterItem[];
  loading: boolean;
  lastFetched: number | null;
  error: string | null;

  // Actions
  fetchFarmData: (userId: string, userEmail?: string, force?: boolean) => Promise<void>;
  invalidateAndRefetch: (userId: string, userEmail?: string) => Promise<void>;
}

export const useFarmStore = create<FarmState>((set, get) => ({
  totalSlots: 0,
  mushroomSlots: 0,
  gingerSlots: 0,
  clusters: [],
  loading: false,
  lastFetched: null,
  error: null,

  fetchFarmData: async (userId: string, userEmail?: string, force = false) => {
    if (!userId) return;

    // Cache hit: If fetched within the last 60 seconds and not forced, return cached data
    const last = get().lastFetched;
    if (!force && last && Date.now() - last < 60000 && get().clusters.length > 0) {
      return;
    }

    set({ loading: true, error: null });

    try {
      // 1. Fetch user's subscriptions, farm records, and other payments concurrently
      const [
        { data: slotSubs, error: subsError },
        { data: farmRecordsByEmail },
        { data: farmRecordsById },
        { data: otherPayments },
        { data: farmGroups },
      ] = await Promise.all([
        supabase
          .from("slot_subscriptions")
          .select("id, user_id, farm_group_id, slots, amount, status, project_category, created_at")
          .eq("user_id", userId),
        userEmail
          ? supabase
              .from("farm_records")
              .select("id, farm_id, member_name, member_email, phone_number, number_of_slots, total_amount_paid, payment_status, created_at, user_id")
              .ilike("member_email", userEmail.trim())
          : Promise.resolve({ data: [] }),
        supabase
          .from("farm_records")
          .select("id, farm_id, member_name, member_email, phone_number, number_of_slots, total_amount_paid, payment_status, created_at, user_id")
          .eq("user_id", userId),
        supabase
          .from("other_payments")
          .select("id, user_id, amount, status, category, metadata, created_at")
          .eq("user_id", userId),
        supabase.from("farm_groups").select("id, name, project_category, coordinator_id"),
      ]);

      if (subsError) {
        console.warn("[useFarmStore] Warning fetching slot subscriptions:", subsError);
      }

      // Deduplicate farm records by ID
      const allFarmRecordsMap = new Map<string, any>();
      (farmRecordsByEmail || []).forEach((r: any) => allFarmRecordsMap.set(r.id, r));
      (farmRecordsById || []).forEach((r: any) => allFarmRecordsMap.set(r.id, r));
      const combinedFarmRecords = Array.from(allFarmRecordsMap.values());

      // Build farm_groups lookup map
      const groupsMap = new Map<string, any>();
      (farmGroups || []).forEach((fg: any) => {
        groupsMap.set(fg.id, fg);
      });

      // Collect all relevant farm IDs for expense & sales lookup
      const relevantFarmIds = new Set<string>();
      (slotSubs || []).forEach((s: any) => {
        if (s.farm_group_id) relevantFarmIds.add(s.farm_group_id);
      });
      combinedFarmRecords.forEach((fr: any) => {
        if (fr.farm_id) relevantFarmIds.add(fr.farm_id);
      });

      const farmIdList = Array.from(relevantFarmIds);
      const expensesMap: Record<string, any[]> = {};
      const salesMap: Record<string, any[]> = {};

      if (farmIdList.length > 0) {
        const [{ data: expData }, { data: saleData }] = await Promise.all([
          supabase
            .from("farm_expenses")
            .select("farm_id, amount, description, category, created_at")
            .in("farm_id", farmIdList)
            .order("created_at", { ascending: false })
            .limit(30),
          supabase
            .from("farm_sales")
            .select("farm_id, amount, produce_name, quantity, unit, sale_date, created_at")
            .in("farm_id", farmIdList)
            .order("sale_date", { ascending: false })
            .limit(30),
        ]);

        (expData || []).forEach((e: any) => {
          if (!expensesMap[e.farm_id]) expensesMap[e.farm_id] = [];
          expensesMap[e.farm_id].push({
            date: e.created_at ? new Date(e.created_at).toLocaleDateString() : "",
            description: e.description || e.category || "Operating expense",
            amount: Number(e.amount) || 0,
          });
        });

        (saleData || []).forEach((s: any) => {
          if (!salesMap[s.farm_id]) salesMap[s.farm_id] = [];
          salesMap[s.farm_id].push({
            date: s.sale_date || (s.created_at ? new Date(s.created_at).toLocaleDateString() : ""),
            produce: s.produce_name || "Produce harvest",
            quantity: s.quantity ? `${s.quantity} ${s.unit || "kg"}` : "",
            amount: Number(s.amount) || 0,
          });
        });
      }

      // Build consolidated cluster list
      const clusterItems: FarmClusterItem[] = [];
      let totalMushroom = 0;
      let totalGinger = 0;

      // 1. Process slot_subscriptions
      (slotSubs || []).forEach((s: any) => {
        const farm = s.farm_group_id ? groupsMap.get(s.farm_group_id) : null;
        const farmName = farm ? farm.name : (s.project_category || "Mushroom Village Cluster");
        const farmId = s.farm_group_id || farm?.id || s.id;
        const category = farm?.project_category || s.project_category || "Mushroom Village";
        const slotsCount = Number(s.slots) || 1;
        const bagsCount = slotsCount * 2;

        if (category.toLowerCase().includes("ginger")) {
          totalGinger += slotsCount;
        } else {
          totalMushroom += slotsCount;
        }

        const farmExpenses = expensesMap[farmId] || [];
        const farmSales = salesMap[farmId] || [];
        const totalExp = farmExpenses.reduce((sum, item) => sum + item.amount, 0);
        const totalSale = farmSales.reduce((sum, item) => sum + item.amount, 0);

        clusterItems.push({
          id: s.id,
          farm_id: farmId,
          farm_name: farmName,
          category,
          slots_held: slotsCount,
          fruiting_bags: bagsCount,
          status: s.status || "active",
          coordinator_id: farm?.coordinator_id || null,
          financials: {
            contributions: Number(s.amount) || slotsCount * 5000,
            expenses: totalExp,
            sales: totalSale,
            net_balance: totalSale - totalExp,
          },
          expenses: farmExpenses,
          sales: farmSales,
          source: "subscription",
        });
      });

      // 2. Process physical farm_records (if not already represented)
      combinedFarmRecords.forEach((fr: any) => {
        const farm = fr.farm_id ? groupsMap.get(fr.farm_id) : null;
        const farmName = farm ? farm.name : "Assigned Farm Cluster";
        const farmId = fr.farm_id || farm?.id || fr.id;
        const category = farm?.project_category || "Mushroom Village";
        const slotsCount = Number(fr.number_of_slots) || 0;
        const bagsCount = slotsCount * 2;

        // Check if this record is already accounted for in slot_subscriptions
        const alreadyInSubs = clusterItems.some(
          (c) => c.source === "subscription" && c.farm_id === farmId && c.slots_held === slotsCount
        );

        if (!alreadyInSubs) {
          if (category.toLowerCase().includes("ginger")) {
            totalGinger += slotsCount;
          } else {
            totalMushroom += slotsCount;
          }

          const farmExpenses = expensesMap[farmId] || [];
          const farmSales = salesMap[farmId] || [];
          const totalExp = farmExpenses.reduce((sum, item) => sum + item.amount, 0);
          const totalSale = farmSales.reduce((sum, item) => sum + item.amount, 0);

          clusterItems.push({
            id: fr.id,
            farm_id: farmId,
            farm_name: farmName,
            category,
            slots_held: slotsCount,
            fruiting_bags: bagsCount,
            status: fr.payment_status || "verified",
            coordinator_id: farm?.coordinator_id || null,
            financials: {
              contributions: Number(fr.total_amount_paid) || slotsCount * 5000,
              expenses: totalExp,
              sales: totalSale,
              net_balance: totalSale - totalExp,
            },
            expenses: farmExpenses,
            sales: farmSales,
            source: "farm_record",
          });
        }
      });

      // 3. Process other_payments with slots metadata
      (otherPayments || []).forEach((op: any) => {
        if (op.category === "slot_purchase" && op.status === "completed") {
          const slotsCount = Number(op.metadata?.slots) || Math.floor((Number(op.amount) || 0) / 5000);
          if (slotsCount > 0) {
            const alreadyInClusters = clusterItems.some(
              (c) => c.slots_held === slotsCount && c.financials.contributions === Number(op.amount)
            );
            if (!alreadyInClusters) {
              totalMushroom += slotsCount;
              clusterItems.push({
                id: op.id,
                farm_id: op.id,
                farm_name: "Community Farm Cluster",
                category: "Mushroom Village",
                slots_held: slotsCount,
                fruiting_bags: slotsCount * 2,
                status: "active",
                coordinator_id: null,
                financials: {
                  contributions: Number(op.amount) || slotsCount * 5000,
                  expenses: 0,
                  sales: 0,
                  net_balance: 0,
                },
                expenses: [],
                sales: [],
                source: "other_payment",
              });
            }
          }
        }
      });

      set({
        totalSlots: totalMushroom + totalGinger,
        mushroomSlots: totalMushroom,
        gingerSlots: totalGinger,
        clusters: clusterItems,
        loading: false,
        lastFetched: Date.now(),
        error: null,
      });
    } catch (err: any) {
      console.error("[useFarmStore] Error fetching farm data:", err);
      set({ loading: false, error: err?.message || "Failed to load farm data" });
    }
  },

  invalidateAndRefetch: async (userId: string, userEmail?: string) => {
    return get().fetchFarmData(userId, userEmail, true);
  },
}));
