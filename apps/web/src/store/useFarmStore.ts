import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

export interface ClusterFinancials {
  contributions: number;
  expenses: number;
  sales: number;
  net_balance: number;
}

export interface FarmClusterMember {
  id: string;
  name: string;
  email: string;
  slots: number;
  fruiting_bags: number;
  created_at: string;
  is_legacy?: boolean;
}

export interface FarmCycleStage {
  cycle_number: number;
  crop_type: string;
  stage: string;
  progress_percent: number;
  start_date: string | null;
  total_bags: number;
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
  coordinator?: { full_name?: string; phone?: string; email?: string } | null;
  cycle?: FarmCycleStage | null;
  members: FarmClusterMember[];
  financials: ClusterFinancials;
  expenses: Array<{ date: string; description: string; amount: number; category?: string }>;
  sales: Array<{ date: string; produce: string; quantity: string; amount: number; buyer?: string }>;
  source: "subscription" | "farm_record" | "other_payment";
  is_legacy?: boolean;
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
              .select("id, farm_id, name, email, phone, farm_slots, created_at, is_legacy, project_category")
              .ilike("email", userEmail.trim())
          : Promise.resolve({ data: [] }),
        supabase
          .from("farm_records")
          .select("id, farm_id, name, email, phone, farm_slots, created_at, is_legacy, project_category")
          .eq("email", userEmail ? userEmail.trim() : ""),
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

      // Collect all relevant farm IDs for expense, sales, cycle & roster lookup
      const relevantFarmIds = new Set<string>();
      (slotSubs || []).forEach((s: any) => {
        if (s.farm_group_id) relevantFarmIds.add(s.farm_group_id);
      });
      combinedFarmRecords.forEach((fr: any) => {
        if (fr.farm_id) relevantFarmIds.add(fr.farm_id);
      });

      const farmIdList = Array.from(relevantFarmIds);
      const coordinatorIds = Array.from(
        new Set(
          (farmGroups || [])
            .map((fg: any) => fg.coordinator_id)
            .filter((id: any): id is string => Boolean(id))
        )
      );

      const expensesMap: Record<string, any[]> = {};
      const salesMap: Record<string, any[]> = {};
      const cyclesMap: Record<string, FarmCycleStage> = {};
      const rosterMap: Record<string, FarmClusterMember[]> = {};
      const coordsMap = new Map<string, any>();

      if (farmIdList.length > 0) {
        const [
          { data: expData },
          { data: saleData },
          { data: cycleData },
          { data: slotRosterData },
          { data: farmRecordsRoster },
          { data: coordProfiles },
        ] = await Promise.all([
          supabase
            .from("farm_expenses")
            .select("farm_id, amount, description, category, created_at")
            .in("farm_id", farmIdList)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("farm_sales")
            .select("farm_id, amount, produce_name, quantity, unit, buyer_name, sale_date, created_at")
            .in("farm_id", farmIdList)
            .order("sale_date", { ascending: false })
            .limit(50),
          supabase
            .from("farm_cycles")
            .select("farm_group_id, cycle_number, crop_type, stage, total_bags_fruiting, start_date, status")
            .in("farm_group_id", farmIdList)
            .limit(20),
          supabase
            .from("slot_subscriptions")
            .select("id, farm_group_id, user_id, slots, member_name, member_email, member_phone, created_at, is_legacy")
            .in("farm_group_id", farmIdList)
            .limit(100),
          supabase
            .from("farm_records")
            .select("id, farm_id, name, email, phone, farm_slots, created_at, is_legacy")
            .in("farm_id", farmIdList)
            .limit(200),
          coordinatorIds.length > 0
            ? supabase
                .from("profiles")
                .select("id, full_name, phone, email")
                .in("id", coordinatorIds)
            : Promise.resolve({ data: [] }),
        ]);

        (coordProfiles || []).forEach((cp: any) => {
          coordsMap.set(cp.id, cp);
        });

        (expData || []).forEach((e: any) => {
          if (!expensesMap[e.farm_id]) expensesMap[e.farm_id] = [];
          expensesMap[e.farm_id].push({
            date: e.created_at ? new Date(e.created_at).toLocaleDateString() : "",
            description: e.description || e.category || "Operating expense",
            amount: Number(e.amount) || 0,
            category: e.category,
          });
        });

        (saleData || []).forEach((s: any) => {
          if (!salesMap[s.farm_id]) salesMap[s.farm_id] = [];
          salesMap[s.farm_id].push({
            date: s.sale_date || (s.created_at ? new Date(s.created_at).toLocaleDateString() : ""),
            produce: s.produce_name || "Produce harvest",
            quantity: s.quantity ? `${s.quantity} ${s.unit || "kg"}` : "",
            amount: Number(s.amount) || 0,
            buyer: s.buyer_name,
          });
        });

        (cycleData || []).forEach((c: any) => {
          const rawStage = (c.stage || "GROWING").toUpperCase();
          let pct = 60;
          if (rawStage.includes("PREP") || rawStage.includes("PLANT")) pct = 25;
          else if (rawStage.includes("GROW") || rawStage.includes("VEGET")) pct = 60;
          else if (rawStage.includes("HARVEST") || rawStage.includes("FRUIT")) pct = 90;
          else if (rawStage.includes("COMPLET")) pct = 100;

          cyclesMap[c.farm_group_id] = {
            cycle_number: c.cycle_number || 1,
            crop_type: c.crop_type || "Oyster Mushroom",
            stage: rawStage,
            progress_percent: pct,
            start_date: c.start_date || null,
            total_bags: Number(c.total_bags_fruiting) || 2000,
          };
        });

        // Populate roster from slot_subscriptions
        (slotRosterData || []).forEach((r: any) => {
          if (!rosterMap[r.farm_group_id]) rosterMap[r.farm_group_id] = [];
          const name = r.member_name || "Community Stakeholder";
          const email = r.member_email || "Registered Member";
          const slots = Number(r.slots) || 1;
          rosterMap[r.farm_group_id].push({
            id: r.id,
            name,
            email,
            slots,
            fruiting_bags: slots * 2,
            created_at: r.created_at || new Date().toISOString(),
            is_legacy: Boolean(r.is_legacy),
          });
        });

        // Also merge farm_records for full historical roster transparency
        (farmRecordsRoster || []).forEach((fr: any) => {
          if (!rosterMap[fr.farm_id]) rosterMap[fr.farm_id] = [];
          const existing = rosterMap[fr.farm_id].some(
            (m) => (fr.email && m.email && m.email.toLowerCase() === fr.email.toLowerCase()) ||
                   (fr.name && m.name && m.name.toLowerCase() === fr.name.toLowerCase())
          );
          if (!existing) {
            const slots = Number(fr.farm_slots) || 1;
            rosterMap[fr.farm_id].push({
              id: fr.id,
              name: fr.name || "Founding Stakeholder",
              email: fr.email || "Founding Member",
              slots,
              fruiting_bags: slots * 2,
              created_at: fr.created_at || new Date().toISOString(),
              is_legacy: true,
            });
          }
        });
      }

      // Build consolidated cluster list
      const clusterItems: FarmClusterItem[] = [];
      let totalMushroom = 0;
      let totalGinger = 0;

      // 1. Process slot_subscriptions
      (slotSubs || []).forEach((s: any) => {
        const farm = s.farm_group_id ? groupsMap.get(s.farm_group_id) : null;
        const category = farm?.project_category || s.project_category || "Mushroom Village";
        const rawName = farm ? farm.name : (s.project_category || "Mushroom Village Cluster");
        const cleanRawName = rawName.replace(/\[.*?\]/g, "").trim();
        const farmName = cleanRawName && cleanRawName.toLowerCase() !== category.toLowerCase()
          ? `${cleanRawName} [${category}]`
          : rawName.includes("[") ? rawName : `${category} Cluster`;
        const farmId = s.farm_group_id || farm?.id || s.id;
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

        const coordinatorProfile = farm?.coordinator_id ? coordsMap.get(farm.coordinator_id) : null;
        const activeCycle = cyclesMap[farmId] || {
          cycle_number: 1,
          crop_type: category.toLowerCase().includes("ginger") ? "High-Yield Ginger" : "Oyster Mushroom",
          stage: "GROWING",
          progress_percent: category.toLowerCase().includes("ginger") ? 40 : 65,
          start_date: null,
          total_bags: 2000,
        };

        const clusterMembers = rosterMap[farmId] || [
          {
            id: s.id,
            name: "Member Stakeholder",
            email: "Active Stakeholder",
            slots: slotsCount,
            fruiting_bags: bagsCount,
            created_at: s.created_at || new Date().toISOString(),
            is_legacy: Boolean(s.is_legacy),
          },
        ];

        clusterItems.push({
          id: s.id,
          farm_id: farmId,
          farm_name: farmName,
          category,
          slots_held: slotsCount,
          fruiting_bags: bagsCount,
          status: s.status || "active",
          coordinator_id: farm?.coordinator_id || null,
          coordinator: coordinatorProfile || null,
          cycle: activeCycle,
          members: clusterMembers,
          financials: {
            contributions: Number(s.amount) || slotsCount * 5000,
            expenses: totalExp,
            sales: totalSale,
            net_balance: totalSale - totalExp,
          },
          expenses: farmExpenses,
          sales: farmSales,
          source: "subscription",
          is_legacy: Boolean(s.is_legacy),
        });
      });

      // 2. Process physical farm_records (if not already represented)
      combinedFarmRecords.forEach((fr: any) => {
        const farm = fr.farm_id ? groupsMap.get(fr.farm_id) : null;
        const category = farm?.project_category || "Mushroom Village";
        const rawName = farm ? farm.name : "Assigned Farm Cluster";
        const cleanRawName = rawName.replace(/\[.*?\]/g, "").trim();
        const farmName = cleanRawName && cleanRawName.toLowerCase() !== category.toLowerCase()
          ? `${cleanRawName} [${category}]`
          : rawName.includes("[") ? rawName : `${category} Cluster`;
        const farmId = fr.farm_id || farm?.id || fr.id;
        const slotsCount = Number(fr.farm_slots ?? fr.number_of_slots ?? 0);
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

          const coordinatorProfile = farm?.coordinator_id ? coordsMap.get(farm.coordinator_id) : null;
          const activeCycle = cyclesMap[farmId] || {
            cycle_number: 1,
            crop_type: category.toLowerCase().includes("ginger") ? "High-Yield Ginger" : "Oyster Mushroom",
            stage: "GROWING",
            progress_percent: category.toLowerCase().includes("ginger") ? 40 : 65,
            start_date: null,
            total_bags: 2000,
          };

          const clusterMembers = rosterMap[farmId] || [
            {
              id: fr.id,
              name: fr.name || "Founding Stakeholder",
              email: fr.email || "Archived Contact",
              slots: slotsCount,
              fruiting_bags: bagsCount,
              created_at: fr.created_at || new Date().toISOString(),
              is_legacy: Boolean(fr.is_legacy),
            },
          ];

          clusterItems.push({
            id: fr.id,
            farm_id: farmId,
            farm_name: farmName,
            category,
            slots_held: slotsCount,
            fruiting_bags: bagsCount,
            status: fr.payment_status || "verified",
            coordinator_id: farm?.coordinator_id || null,
            coordinator: coordinatorProfile || null,
            cycle: activeCycle,
            members: clusterMembers,
            financials: {
              contributions: Number(fr.total_amount_paid) || slotsCount * 5000,
              expenses: totalExp,
              sales: totalSale,
              net_balance: totalSale - totalExp,
            },
            expenses: farmExpenses,
            sales: farmSales,
            source: "farm_record",
            is_legacy: Boolean(fr.is_legacy),
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
                coordinator: null,
                cycle: null,
                members: [],
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
