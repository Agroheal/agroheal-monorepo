import type { Member } from "@/types/admin";

/**
 * Consolidates the search-matching logic that used to be copy-pasted three
 * times in App.tsx (main directory search, slot-credit picker, issue-green-
 * card picker) into one predicate, reused by memberSearchPredicate below.
 */
export function memberMatchesQuery(m: Member, queryStr: string) {
  const query = queryStr.toLowerCase().trim();
  if (!query) return true;

  const isNumericOrPhoneQuery = /^[0-9+\-\s()]+$/.test(query);
  const cleanPhone = (m.phone || "").replace(/[^0-9]/g, "");
  const cleanQuery = query.replace(/[^0-9]/g, "");
  const matchesPhone = isNumericOrPhoneQuery && cleanQuery.length >= 3 && cleanPhone.includes(cleanQuery);

  return (
    m.full_name.toLowerCase().includes(query) ||
    m.email.toLowerCase().includes(query) ||
    matchesPhone ||
    (m.phone ? m.phone.toLowerCase().includes(query) : false) ||
    (m.member_id ? m.member_id.toLowerCase().includes(query) : false) ||
    (m.referral_code ? m.referral_code.toLowerCase().includes(query) : false) ||
    Boolean(m.state && m.state.toLowerCase().includes(query)) ||
    Boolean(m.lga && m.lga.toLowerCase().includes(query))
  );
}

export type GreenCardFilter = "all" | "active" | "unpaid";
export type DebtorFilter = "all" | "debtors" | "debt_free";
export type LocationStatusFilter = "all" | "configured" | "pending";

export function filterMemberPredicate(
  m: Member,
  queryStr: string,
  greenCardFilter: GreenCardFilter = "all",
  programFilter: string = "all",
  options?: {
    stateFilter?: string;
    lgaFilter?: string;
    debtorFilter?: DebtorFilter;
    roleFilter?: string;
    locationStatusFilter?: LocationStatusFilter;
  },
) {
  if (!memberMatchesQuery(m, queryStr)) return false;

  if (greenCardFilter === "active" && !m.has_green_card) return false;
  if (greenCardFilter === "unpaid" && m.has_green_card) return false;

  if (programFilter === "has_slots") {
    if (m.total_slots <= 0) return false;
  } else if (programFilter === "no_slots") {
    if (m.total_slots !== 0) return false;
  } else if (programFilter !== "all") {
    if (!m.slots_by_program.some((prog) => prog.category.toLowerCase().includes(programFilter.toLowerCase()))) {
      return false;
    }
  }

  // State filter
  if (options?.stateFilter && options.stateFilter !== "all") {
    if ((m.state || "").toLowerCase() !== options.stateFilter.toLowerCase()) return false;
  }

  // LGA filter
  if (options?.lgaFilter && options.lgaFilter !== "all") {
    if ((m.lga || "").toLowerCase() !== options.lgaFilter.toLowerCase()) return false;
  }

  // Debtor filter
  if (options?.debtorFilter === "debtors") {
    if (Number(m.advance_debt_balance || 0) <= 0) return false;
  } else if (options?.debtorFilter === "debt_free") {
    if (Number(m.advance_debt_balance || 0) > 0) return false;
  }

  // Role filter
  if (options?.roleFilter && options.roleFilter !== "all") {
    if ((m.role || "user").toLowerCase() !== options.roleFilter.toLowerCase()) return false;
  }

  // Location status filter
  if (options?.locationStatusFilter === "configured") {
    if (!m.state || !m.lga) return false;
  } else if (options?.locationStatusFilter === "pending") {
    if (m.state && m.lga) return false;
  }

  return true;
}

/** Tailwind classes for the program pill badges, keyed by program category. */
export function getProgramPillClass(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes("mushroom")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (cat.includes("potato")) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (cat.includes("ginger")) return "bg-lime-500/10 text-lime-400 border-lime-500/20";
  return "bg-primary/10 text-primary border-primary/20";
}

export function getProgramEmoji(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes("mushroom")) return "🍄";
  if (cat.includes("potato")) return "🍠";
  if (cat.includes("ginger")) return "🌿";
  return "🌱";
}

export function memberInitial(member: Pick<Member, "full_name">) {
  return member.full_name.charAt(0).toUpperCase();
}
