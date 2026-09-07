/**
 * Centralized Data Sanitization & Integrity Helpers for Agroheal Admin
 * Enforces strict input formats to eliminate database corruption, orphan records, and formatting anomalies.
 */

/**
 * Normalizes phone numbers to standard format (e.g., Nigerian 080... format)
 * Handles raw 10-digit formats (9076256518 -> 09076256518) and +234 prefixes.
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^0-9+]/g, "").trim();

  // If starts with +234 followed by 10 digits (e.g., +2348031234567)
  if (/^\+234\d{10}$/.test(cleaned)) {
    return `0${cleaned.slice(4)}`;
  }

  // If starts with 234 followed by 10 digits (e.g., 2348031234567)
  if (/^234\d{10}$/.test(cleaned)) {
    return `0${cleaned.slice(3)}`;
  }

  // If 10 digits starting with 7, 8, or 9 (missing initial 0)
  if (/^[789]\d{9}$/.test(cleaned)) {
    return `0${cleaned}`;
  }

  return cleaned;
}

/**
 * Cleans human full names by stripping leading/trailing whitespace
 * and collapsing repeated spaces into single spaces.
 */
export function cleanName(name: string | null | undefined): string {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Cleans and normalizes email addresses by trimming and lowercasing.
 */
export function cleanEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Standardizes slugs for farm groups and projects (e.g., "Star Farm" -> "star-farm").
 */
export function cleanSlug(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Cleans and formats Member IDs (e.g., "agc-0001-2026 " -> "AGC-0001-2026").
 */
export function cleanMemberId(id: string | null | undefined): string {
  if (!id) return "";
  return id.trim().toUpperCase();
}

/**
 * Cleans and formats Referral Codes (alphanumeric uppercase).
 */
export function cleanReferralCode(code: string | null | undefined): string {
  if (!code) return "";
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

/**
 * Parses a numeric value ensuring it is a non-negative integer.
 */
export function parsePositiveInt(val: unknown, fallback = 0): number {
  const num = Number(val);
  if (isNaN(num) || num < 0) return fallback;
  return Math.floor(num);
}
