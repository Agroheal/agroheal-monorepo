/**
 * Agroheal Unified Role-Based Access Control (RBAC) System
 * Single source of truth for user roles and capability matrices across web, admin, and backend.
 */

export const UserRole = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  SUPPORT: "support",
  COORDINATOR: "coordinator",
  MEMBER: "user",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const SUPER_DEV_EMAIL = "developerelijah360@gmail.com";

/**
 * Normalizes any role string into a valid UserRole
 */
export function parseUserRole(role?: string | null): UserRole {
  if (!role) return UserRole.MEMBER;
  const normalized = role.trim().toLowerCase();
  switch (normalized) {
    case "super_admin":
    case "superadmin":
      return UserRole.SUPER_ADMIN;
    case "admin":
      return UserRole.ADMIN;
    case "support":
      return UserRole.SUPPORT;
    case "coordinator":
      return UserRole.COORDINATOR;
    default:
      return UserRole.MEMBER;
  }
}

/**
 * Checks if a user has administrative platform privileges (admin or super_admin)
 */
export function isPlatformAdmin(role?: string | null, email?: string | null): boolean {
  if (email && email.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase()) {
    return true;
  }
  const parsed = parseUserRole(role);
  return parsed === UserRole.ADMIN || parsed === UserRole.SUPER_ADMIN;
}

/**
 * Checks if a user has access to the Admin Portal (super_admin, admin, support)
 */
export function canAccessAdminPortal(role?: string | null, email?: string | null): boolean {
  if (isPlatformAdmin(role, email)) return true;
  return parseUserRole(role) === UserRole.SUPPORT;
}

/**
 * Checks if a user has permission to manage (add, edit) farm member records.
 * Rules:
 * - In Audit Mode: strictly super developer
 * - In Normal Mode: Platform Admins (admin, super_admin), Support, OR designated Farm Coordinators
 */
export function canManageFarmMemberRecords(params: {
  role?: string | null;
  email?: string | null;
  isFarmCoordinator: boolean;
  isAuditLocked?: boolean;
}): boolean {
  const { role, email, isFarmCoordinator, isAuditLocked = false } = params;
  const isSuper = email?.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() || parseUserRole(role) === UserRole.SUPER_ADMIN;
  if (isAuditLocked) {
    return isSuper;
  }
  const parsed = parseUserRole(role);
  return isPlatformAdmin(role, email) || parsed === UserRole.SUPPORT || isFarmCoordinator;
}

/**
 * Checks if a user has permission to add, edit, or delete farm operating expenses.
 * Rules:
 * - In Audit Mode: strictly super developer
 * - In Normal Mode: Platform Admins, Support, and designated Farm Coordinators
 */
export function canManageFarmExpenses(params: {
  role?: string | null;
  email?: string | null;
  isFarmCoordinator: boolean;
  isAuditLocked?: boolean;
}): boolean {
  const { role, email, isFarmCoordinator, isAuditLocked = false } = params;
  const isSuper = email?.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() || parseUserRole(role) === UserRole.SUPER_ADMIN;
  if (isAuditLocked) {
    return isSuper;
  }
  const parsed = parseUserRole(role);
  return isPlatformAdmin(role, email) || parsed === UserRole.SUPPORT || isFarmCoordinator;
}

/**
 * Checks if a user has permission to add, edit, or delete farm produce sales.
 * Rules:
 * - In Audit Mode: strictly super developer
 * - In Normal Mode: Platform Admins, Support, and designated Farm Coordinators
 */
export function canManageFarmSales(params: {
  role?: string | null;
  email?: string | null;
  isFarmCoordinator: boolean;
  isAuditLocked?: boolean;
}): boolean {
  const { role, email, isFarmCoordinator, isAuditLocked = false } = params;
  const isSuper = email?.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() || parseUserRole(role) === UserRole.SUPER_ADMIN;
  if (isAuditLocked) {
    return isSuper;
  }
  const parsed = parseUserRole(role);
  return isPlatformAdmin(role, email) || parsed === UserRole.SUPPORT || isFarmCoordinator;
}

/**
 * Checks if a user can create new farm groups
 */
export function canCreateFarmGroup(role?: string | null, email?: string | null): boolean {
  return isPlatformAdmin(role, email);
}

/**
 * Checks if a user can perform financial mutations (offline approvals, green card issuance)
 */
export function canMutateFinancials(role?: string | null, email?: string | null): boolean {
  return isPlatformAdmin(role, email);
}

/**
 * Checks if a user can manage system configurations or bulk payouts
 */
export function canManageSystemConfigs(role?: string | null, email?: string | null): boolean {
  if (email && email.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase()) {
    return true;
  }
  return parseUserRole(role) === UserRole.SUPER_ADMIN;
}
