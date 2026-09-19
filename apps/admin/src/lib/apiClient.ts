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
        activeSlots: number;
        activeGreenCards: number;
        farmGroupsCount: number;
        timestamp: string;
      }>("admin/stats"),
    getTreasuryAudit: () => apiRequest<any>("admin/treasury-audit"),
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
