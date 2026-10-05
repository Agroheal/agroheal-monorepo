/**
 * Centralized Single Source of Truth for Data Sanitization & Integrity in Agroheal.
 * Shared across both apps/web, apps/admin, and backend modules.
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
 * Supported Country Codes for UI pickers and phone formatting.
 */
export const SUPPORTED_COUNTRY_CODES = [
  { code: "+234", flag: "🇳🇬", country: "Nigeria", minDigits: 10, maxDigits: 11 },
  { code: "+1", flag: "🇺🇸", country: "United States / Canada", minDigits: 10, maxDigits: 10 },
  { code: "+44", flag: "🇬🇧", country: "United Kingdom", minDigits: 10, maxDigits: 10 },
  { code: "+233", flag: "🇬🇭", country: "Ghana", minDigits: 9, maxDigits: 9 },
  { code: "+254", flag: "🇰🇪", country: "Kenya", minDigits: 9, maxDigits: 9 },
  { code: "+27", flag: "🇿🇦", country: "South Africa", minDigits: 9, maxDigits: 9 },
] as const;

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formattedInternational: string;
  error?: string;
}

/**
 * Validates and normalizes phone numbers with strict Nigerian rules (11 digits with 0, 10 digits without +234).
 */
export function validatePhoneNumber(
  phone: string | null | undefined,
  selectedCountryCode = "+234"
): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      normalized: "",
      formattedInternational: "",
      error: "Phone number is required.",
    };
  }

  const rawCleaned = phone.replace(/[^0-9+]/g, "").trim();

  // If user selected Nigeria (+234) or number starts with +234 / 234 / Nigerian prefixes
  if (selectedCountryCode === "+234" || rawCleaned.startsWith("+234") || rawCleaned.startsWith("234")) {
    let digitsOnly = rawCleaned.replace(/^\+/, "");
    if (digitsOnly.startsWith("234")) {
      digitsOnly = digitsOnly.slice(3);
    }
    // If starts with leading 0, strip it to check the 10 core subscriber digits
    if (digitsOnly.startsWith("0")) {
      digitsOnly = digitsOnly.slice(1);
    }

    if (digitsOnly.length !== 10) {
      return {
        isValid: false,
        normalized: normalizePhoneNumber(phone),
        formattedInternational: `+234${digitsOnly}`,
        error: `Nigerian phone numbers must be 11 digits (e.g. 08012345678) or 10 digits after +234. You entered ${digitsOnly.length} digits.`,
      };
    }

    if (!/^[789]\d{9}$/.test(digitsOnly)) {
      return {
        isValid: false,
        normalized: `0${digitsOnly}`,
        formattedInternational: `+234${digitsOnly}`,
        error: "Nigerian phone numbers must begin with valid network prefix (070, 080, 081, 090, 091, etc.).",
      };
    }

    return {
      isValid: true,
      normalized: `0${digitsOnly}`,
      formattedInternational: `+234${digitsOnly}`,
    };
  }

  // Generic international fallback (E.164)
  const digits = rawCleaned.replace(/[^0-9]/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return {
      isValid: false,
      normalized: rawCleaned,
      formattedInternational: rawCleaned.startsWith("+") ? rawCleaned : `${selectedCountryCode}${rawCleaned}`,
      error: "Please enter a valid international phone number (7 to 15 digits).",
    };
  }

  return {
    isValid: true,
    normalized: rawCleaned,
    formattedInternational: rawCleaned.startsWith("+") ? rawCleaned : `${selectedCountryCode}${rawCleaned}`,
  };
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
