import { supabase } from "./supabaseClient";

const SERVER_API_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.MODE === "production"
    ? "https://agroheal-server-prod.up.railway.app"
    : "https://agroheal-server-dev.up.railway.app");

export const API_BASE_URL = `${SERVER_API_URL.replace(/\/+$/, "")}/api/v1`;

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn("[adminApiClient] Could not read Supabase session token:", err);
  }

  return headers;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `${API_BASE_URL.replace(/\/+$/, "")}/${cleanEndpoint}`;

  const defaultHeaders = await getAuthHeaders();
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...mergedOptions,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);
    const json = await response.json().catch(() => null);

    if (!response.ok || (json && json.success === false)) {
      const errMsg =
        json?.message ||
        `Admin API request to ${cleanEndpoint} failed with status ${response.status}`;
      throw new ApiError(errMsg, response.status, json?.data);
    }

    if (json && typeof json === "object" && "data" in json) {
      return json.data as T;
    }

    return json as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError(`Request timeout connecting to ${url}`, 408);
    }
    throw err;
  }
}

export const adminApiClient = {
  health: {
    check: () => apiRequest<{ service: string; version: string; status: string }>("health"),
  },
  admin: {
    getStats: () =>
      apiRequest<{
        totalMembers: number;
        liveMembers?: number;
        legacyMembers?: number;
        activeSlots: number;
        liveSlots?: number;
        legacySlots?: number;
        activeGreenCards: number;
        farmGroupsCount: number;
        timestamp: string;
      }>("admin/stats"),
    getTreasuryAudit: () => apiRequest<any>("admin/treasury-audit"),
    getWalletHistory: (walletKey: string, params?: { startDate?: string; endDate?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.startDate) query.append("startDate", params.startDate);
      if (params?.endDate) query.append("endDate", params.endDate);
      if (params?.search) query.append("search", params.search);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return apiRequest<any>(`admin/treasury/wallet-history/${walletKey}${qs}`);
    },
    getGroupFarms: () => apiRequest<any[]>("admin/treasury/group-farms"),
    getGroupFarmHistory: (farmId: string, params?: { startDate?: string; endDate?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.startDate) query.append("startDate", params.startDate);
      if (params?.endDate) query.append("endDate", params.endDate);
      if (params?.search) query.append("search", params.search);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return apiRequest<any>(`admin/treasury/group-farms/${farmId}/history${qs}`);
    },
    triggerCorporateSweep: (date?: string) =>
      apiRequest<any>("admin/treasury/trigger-sweep", {
        method: "POST",
        body: JSON.stringify({ date }),
      }),
    getTransactions: (limit = 200) => apiRequest<any[]>(`admin/transactions?limit=${limit}`),
    impersonateMember: (userId: string, reason?: string) =>
      apiRequest<{
        member: { id: string; fullName: string; email: string; memberId: string };
        actionLink: string;
        emailOtp: string;
        redirectTo: string;
      }>(`admin/members/${userId}/impersonate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    verifyFlwPayment: (reference: string) =>
      apiRequest<{
        gateway: {
          verified: boolean;
          status: "paid" | "failed" | "pending";
          amount?: number;
          gatewayRef?: string;
          provider: "flutterwave";
          customerEmail?: string;
          raw?: any;
        };
        localMatch?: {
          transaction?: any;
          order?: any;
          slotSubscription?: any;
        };
      }>("admin/payments/verify-flw", {
        method: "POST",
        body: JSON.stringify({ reference }),
      }),
  },
  fulfillment: {
    getManifest: (tier?: string) =>
      apiRequest<{
        manifest: any[];
        groupedByState: any[];
        stats: {
          totalOrders: number;
          liveOrdersCount?: number;
          legacyOrdersCount?: number;
          totalQuantity: number;
          pendingCount: number;
          dispatchedCount: number;
          deliveredCount: number;
          topStates: Array<{ state: string; count: number }>;
        };
      }>(`admin/fulfillment/manifest${tier ? `?tier=${tier}` : ""}`),
    updateOrderStatus: (id: string, status: string, notes?: string, origin: string = "order") =>
      apiRequest<any>(`admin/fulfillment/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, notes, origin }),
      }),
  },
  transactions: {
    getAllotmentPreview: (txId: string | number) =>
      apiRequest<{
        transaction: {
          id: string | number;
          amount: number;
          reference: string;
          status: string;
          createdAt: string;
          projectCategory?: string;
          notes?: string;
        };
        member: {
          id: string;
          fullName: string;
          email: string;
          memberId?: string;
          sponsorId?: string;
          sponsorName?: string;
        };
        allotment: {
          isCombo: boolean;
          isStarterPackOnly: boolean;
          isGreenCardOnly: boolean;
          isSlotsOnly: boolean;
          greenCard: {
            action: "ACTIVATE" | "ALREADY_ACTIVE";
            plan: string;
            cost: number;
          };
          wealthCreation: {
            action: "ACTIVATE" | "ALREADY_ACTIVE";
            productCode: string;
            productName: string;
            orderPrice: number;
          };
          farmSlots: {
            count: number;
            farmGroup: string;
            unitPrice: number;
            totalSlotValue: number;
          };
          sponsorCommission: {
            amount: number;
            sponsorId?: string;
            sponsorName?: string;
            bonusCategory: string;
          };
          coreDriversBonus: {
            amountPerDriver: number;
            totalDrivers: number;
            totalPool: number;
          };
          matrixPlacement: boolean;
        };
      }>(`admin/transactions/${encodeURIComponent(String(txId))}/allotment-preview`),
    forceSettle: (txId: string | number, notes?: string) =>
      apiRequest<{
        success: boolean;
        message: string;
        allotments: any;
      }>(`admin/transactions/${encodeURIComponent(String(txId))}/force-settle`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
  },
  members: {
    placeMatrix: (id: string) =>
      apiRequest<any>(`admin/members/${id}/place-matrix`, { method: "POST" }),
    reassignSponsor: (id: string, newSponsorId: string, reason?: string) =>
      apiRequest<any>(`admin/members/${id}/sponsor`, {
        method: "PUT",
        body: JSON.stringify({ newSponsorId, reason }),
      }),
    issueAdvance: (payload: { userId: string; amount: number; notes?: string }) =>
      apiRequest<any>("admin/members/issue-advance", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    issueGift: (payload: { userId: string; amount: number; notes?: string }) =>
      apiRequest<any>("admin/members/issue-gift", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    resetBankLock: (memberId: string) =>
      apiRequest<{ memberId: string }>(`admin/members/${encodeURIComponent(memberId)}/reset-bank-lock`, {
        method: "POST",
      }),
    verifyFlwPayment: (reference: string) =>
      apiRequest<{
        gateway: {
          verified: boolean;
          status: "paid" | "failed" | "pending";
          amount?: number;
          gatewayRef?: string;
          provider: "flutterwave";
          customerEmail?: string;
          raw?: any;
        };
        localMatch?: {
          transaction?: any;
          order?: any;
          slotSubscription?: any;
        };
      }>("admin/payments/verify-flw", {
        method: "POST",
        body: JSON.stringify({ reference }),
      }),
  },
  crons: {
    getStatus: () => apiRequest<any>("admin/crons/status"),
    triggerReconciliation: () => apiRequest<any>("admin/crons/reconciliation", { method: "POST" }),
    triggerPqvEvaluation: () => apiRequest<any>("admin/crons/pqv-evaluation", { method: "POST" }),
  },
  cycles: {
    draftHarvestYield: (payload: {
      farmGroupId: string;
      totalHarvestRevenue: number;
      yieldKg?: number;
      continuationCost?: number;
      notes?: string;
    }) => apiRequest<any>("cycles/draft", { method: "POST", body: JSON.stringify(payload) }),
    approveHarvestCycle: (cycleId: string, payload?: { notes?: string }) =>
      apiRequest<any>(`cycles/${cycleId}/approve`, { method: "POST", body: JSON.stringify(payload || {}) }),
    distributeDividends: (cycleId: string) =>
      apiRequest<any>(`cycles/${cycleId}/distribute`, { method: "POST" }),
    getFarmCycles: (farmGroupId: string) =>
      apiRequest<any[]>(`cycles/farm/${farmGroupId}`),
    updateStage: (farmGroupId: string, stage: string) =>
      apiRequest<any>(`cycles/farm/${encodeURIComponent(farmGroupId)}/stage`, {
        method: "PUT",
        body: JSON.stringify({ stage }),
      }),
  },
  withdrawals: {
    listWithdrawals: () => apiRequest<any[]>("admin/withdrawals"),
    approveWithdrawal: (id: string) =>
      apiRequest<any>(`admin/withdrawals/${id}/approve`, { method: "POST" }),
    rejectWithdrawal: (id: string, reason?: string) =>
      apiRequest<any>(`admin/withdrawals/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    evaluateSolvencyShield: (payload: { liquidBankBalance: number; withdrawalIds?: string[] }) =>
      apiRequest<{
        liquidBankBalance: number;
        totalPendingLiability: number;
        liquidityCoverageRatio: number;
        isSolvent: boolean;
        shortfall: number;
        pendingWithdrawalsCount: number;
        recommendedAction: string;
      }>("admin/withdrawals/solvency-shield", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    batchDisburse: (payload: { liquidBankBalance: number; withdrawalIds: string[] }) =>
      apiRequest<{
        disbursedCount: number;
        totalDisbursed: number;
        clearedIds: string[];
        solvencyShield: any;
      }>("admin/withdrawals/batch-disburse", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  configs: {
    getConfigs: () => apiRequest<any>("admin/configs"),
    updateConfigs: (payload: any) =>
      apiRequest<any>("admin/configs", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    updateAdminPermission: (id: string, canManageConfigs: boolean) =>
      apiRequest<any>(`admin/users/${id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ canManageConfigs }),
      }),
  },
};

export default adminApiClient;
