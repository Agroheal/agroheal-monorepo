/**
 * Authoritative Client-side Referral Capture & Persistence Utility
 * 
 * Supports all standard referral query parameters:
 *  - ?ref=...
 *  - ?referral=...
 *  - ?sponsor=...
 *  - ?code=...
 *  - ?sponsor_code=...
 *  - ?referral_code=...
 *  - ?r=...
 * 
 * Multi-layer persistence to survive cross-app/web-view context drops:
 *  1. localStorage ('agroheal_ref')
 *  2. sessionStorage ('agroheal_ref')
 *  3. Cookie ('agroheal_ref', 30 days, SameSite=Lax, path=/)
 */

import { apiClient } from "./apiClient";

export const REFERRAL_STORAGE_KEY = "agroheal_ref";
export const DEFAULT_ROOT_SPONSOR_CODE = "356FV1"; // Adetola Esther (Co-founder Root Sponsor)

const PARAM_KEYS = [
  "ref",
  "referral",
  "sponsor",
  "code",
  "sponsor_code",
  "referral_code",
  "r",
];

function sanitizeCode(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Extracts and captures any referral param from URL or location.search,
 * immediately persisting to localStorage, sessionStorage, and cookies.
 */
export function captureReferral(searchParams?: URLSearchParams): string | null {
  if (typeof window === "undefined") return null;

  let foundCode = "";

  if (searchParams) {
    for (const key of PARAM_KEYS) {
      const val = searchParams.get(key);
      if (val && val.trim()) {
        foundCode = val.trim();
        break;
      }
    }
  }

  if (!foundCode && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    for (const key of PARAM_KEYS) {
      const val = params.get(key);
      if (val && val.trim()) {
        foundCode = val.trim();
        break;
      }
    }
  }

  const clean = sanitizeCode(foundCode);
  if (clean) {
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, clean);
    } catch {}
    try {
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, clean);
    } catch {}
    try {
      setCookie(REFERRAL_STORAGE_KEY, clean);
    } catch {}

    // Debounced click tracking per session + pathname
    try {
      const trackKey = `agroheal_click_tracked_${clean}_${window.location.pathname}`;
      if (!sessionStorage.getItem(trackKey)) {
        sessionStorage.setItem(trackKey, "true");
        apiClient.genealogy
          .trackClick({
            sponsorCode: clean,
            path: window.location.pathname,
            page: document.title || window.location.pathname,
            referrer: document.referrer || undefined,
          })
          .catch(() => {});
      }
    } catch {}

    return clean;
  }

  return null;
}

/**
 * Retrieves the currently active referral code from URL, storage, or cookies.
 */
export function getActiveReferral(searchParams?: URLSearchParams): string {
  // 1. Check direct URL first (and persist if found)
  const fromUrl = captureReferral(searchParams);
  if (fromUrl) return fromUrl;

  if (typeof window === "undefined") return "";

  // 2. Check localStorage
  try {
    const fromLocal = localStorage.getItem(REFERRAL_STORAGE_KEY);
    const cleanLocal = sanitizeCode(fromLocal);
    if (cleanLocal) return cleanLocal;
  } catch {}

  // 3. Check sessionStorage
  try {
    const fromSession = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    const cleanSession = sanitizeCode(fromSession);
    if (cleanSession) return cleanSession;
  } catch {}

  // 4. Check Cookie
  try {
    const fromCookie = getCookie(REFERRAL_STORAGE_KEY);
    const cleanCookie = sanitizeCode(fromCookie);
    if (cleanCookie) return cleanCookie;
  } catch {}

  return "";
}

/**
 * Explicitly saves a referral code (e.g. when verifying a card or selecting a sponsor)
 */
export function setStoredReferral(code: string): void {
  const clean = sanitizeCode(code);
  if (!clean) return;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, clean);
    } catch {}
    try {
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, clean);
    } catch {}
    try {
      setCookie(REFERRAL_STORAGE_KEY, clean);
    } catch {}
  }
}

/**
 * Clears stored referral state upon successful registration
 */
export function clearStoredReferral(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {}
  try {
    deleteCookie(REFERRAL_STORAGE_KEY);
  } catch {}
}

/**
 * Constructs a signup URL preserving any stored or active referral code
 */
export function getSignupUrl(redirectPath?: string): string {
  const code = getActiveReferral();
  const params = new URLSearchParams();

  if (code) {
    params.set("ref", code);
  }
  if (redirectPath) {
    params.set("redirect", redirectPath);
  }

  const qs = params.toString();
  return qs ? `/signup?${qs}` : "/signup";
}
