import { API_BASE_URL } from "@/config/Index";
import { supabase } from "@/lib/supabaseClient";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

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

// -------------------------------------------------------------
// Core HTTP Request Engine (Routes to Express /api/v1/...)
// -------------------------------------------------------------
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
    console.warn("[apiClient] Could not read Supabase session token:", err);
  }

  return headers;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Guarantee the endpoint is properly resolved under /api/v1
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
        `API request to ${cleanEndpoint} failed with status ${response.status}`;
      throw new ApiError(errMsg, response.status, json?.data);
    }

    // Unpack data wrapper if standard Express ApiResponse format
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

// -------------------------------------------------------------
// Domain Specific API Modules
// -------------------------------------------------------------

export const apiClient = {
  /**
   * Health & ping checks
   * GET /api/v1/health
   */
  health: {
    check: () => apiRequest<{ service: string; version: string; status: string }>("health"),
  },

  /**
   * Member & Digital Green Card APIs
   * GET/POST /api/v1/member/...
   */
  member: {
    getProfile: () => apiRequest<any>("member/profile"),
    getDigitalCard: () =>
      apiRequest<{
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        memberId: string;
        isVerified: boolean;
        issueDate: string;
        verificationUrl: string;
      }>("member/digital-card"),
    activateGreenCard: (data: {
      paymentReference: string;
      amount?: number;
      sponsorId?: string;
    }) =>
      apiRequest<{
        memberId: string;
        fullName: string;
        email: string;
        alreadyActive: boolean;
        activatedAt: string;
      }>("member/activate-greencard", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verifyCard: (memberId: string) =>
      apiRequest<{
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: string;
        memberId: string;
        isVerified: boolean;
        issueDate: string;
        verificationUrl: string;
      }>(`member/verify-card/${encodeURIComponent(memberId)}`),
  },

  /**
   * Genealogy & 5x7 Matrix APIs
   * GET /api/v1/genealogy/...
   */
  genealogy: {
    getMatrixTree: () =>
      apiRequest<{
        root: {
          userId: string;
          fullName: string;
          memberId: string;
          level: number;
          childrenCount: number;
          apexRoot: string;
        };
        children: Array<{
          userId: string;
          fullName: string;
          memberId: string;
          level: number;
          position: number;
        }>;
      }>("genealogy/matrix"),
    getQualifications: () =>
      apiRequest<{
        directReferralWallet: {
          isWithdrawable: boolean;
          currentBalance: number;
          minThreshold: number;
          remainingToThreshold: number;
        };
        matrixSpilloverWallet: {
          isQualified: boolean;
          directReferralsCount: number;
          requiredReferrals: number;
          activePqv30d: number;
          requiredPqv: number;
          daysRemaining: number;
          status: "QUALIFIED" | "NEEDS_REFERRALS" | "NEEDS_PQV" | "NEEDS_BOTH";
        };
        commissionsSchedule: Array<{
          level: number;
          percentage: number;
          commissionAmount: number;
          requiredDirects: number;
          isUnlocked: boolean;
        }>;
        unlockedDepthLevel?: number;
        nextTierTarget?: {
          nextLevel: number;
          requiredDirects: number;
          remainingDirects: number;
          progressPercent: number;
          isMax: boolean;
        };
      }>("genealogy/qualifications"),
  },

  /**
   * Dual Wallet & Financial Ledger APIs
   * GET /api/v1/wallet/...
   */
  wallet: {
    getSummary: () =>
      apiRequest<{
        directReferralWallet: {
          balance: number;
          isWithdrawable: boolean;
          minThreshold: number;
          remainingToThreshold: number;
        };
        matrixSpilloverWallet: {
          balance: number;
          isQualified: boolean;
          directReferralsCount: number;
          requiredReferrals: number;
          activePqv30d: number;
          requiredPqv: number;
          daysRemaining: number;
          status: string;
        };
        totalEarnings: number;
      }>("wallet/summary"),
    getLedger: () => apiRequest<any[]>("wallet/ledger"),
  },

  /**
   * LMS & Agronomy Courses APIs
   * GET /api/v1/courses/...
   */
  courses: {
    getAll: () => apiRequest<any[]>("courses"),
    getBySlug: (slug: string) => apiRequest<any>(`courses/${encodeURIComponent(slug)}`),
    completeLesson: (lessonId: string) =>
      apiRequest<any>(`courses/lessons/${encodeURIComponent(lessonId)}/progress`, {
        method: "POST",
      }),
  },

  /**
   * Executive Treasury & Operational Admin APIs
   * GET /api/v1/admin/...
   */
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
};

export default apiClient;
