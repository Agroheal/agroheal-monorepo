/**
 * Agroheal Unified Role-Based Access Control (RBAC) System
 * Single source of truth for user roles and capability matrices across web, admin, and backend.
 */

export const UserRole = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  REVIEWER: "reviewer",
  COORDINATOR: "coordinator",
  SUPPORT: "support",
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
    case "reviewer":
    case "accountant":
    case "auditor":
      return UserRole.REVIEWER;
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
 * Checks if a user has access to the Admin Portal (super_admin, admin, reviewer, coordinator, support)
 */
export function canAccessAdminPortal(role?: string | null, email?: string | null): boolean {
  if (isPlatformAdmin(role, email)) return true;
  const parsed = parseUserRole(role);
  return (
    parsed === UserRole.SUPPORT ||
    parsed === UserRole.COORDINATOR ||
    parsed === UserRole.REVIEWER
  );
}

/**
 * Checks if a user has access to sensitive Financial Treasury, Solvency Shield, and Payout Disbursals.
 * Strictly: super_admin, admin, and reviewer. (Support and Coordinator are strictly excluded).
 */
export function canAccessTreasury(role?: string | null, email?: string | null): boolean {
  if (email && email.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase()) {
    return true;
  }
  const parsed = parseUserRole(role);
  return (
    parsed === UserRole.SUPER_ADMIN ||
    parsed === UserRole.ADMIN ||
    parsed === UserRole.REVIEWER
  );
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
export const ESTHER_BOLA_EMAIL = "estherbola888@gmail.com";

export const ROLE_HIERARCHY_RANK: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.REVIEWER]: 3,
  [UserRole.COORDINATOR]: 2,
  [UserRole.SUPPORT]: 1,
  [UserRole.MEMBER]: 0,
};

export type RoleCapability =
  | "manage_system_configs"
  | "access_treasury"
  | "process_withdrawals"
  | "manage_members"
  | "manage_farms"
  | "mutate_financials"
  | "export_data";

export interface RolePrivilegeDefinition {
  role: UserRole;
  title: string;
  rank: number;
  description: string;
  capabilities: Record<RoleCapability, boolean>;
}

export const ALL_ROLE_PRIVILEGES: RolePrivilegeDefinition[] = [
  {
    role: UserRole.SUPER_ADMIN,
    title: "Super Administrator",
    rank: 5,
    description: "Universal platform control, economic parameters, root treasury, role provisioning, and account revocations.",
    capabilities: {
      manage_system_configs: true,
      access_treasury: true,
      process_withdrawals: true,
      manage_members: true,
      manage_farms: true,
      mutate_financials: true,
      export_data: true,
    },
  },
  {
    role: UserRole.ADMIN,
    title: "Administrator",
    rank: 4,
    description: "Operational management, member profiles, farm assignments, and withdrawal disbursements.",
    capabilities: {
      manage_system_configs: false,
      access_treasury: true,
      process_withdrawals: true,
      manage_members: true,
      manage_farms: true,
      mutate_financials: true,
      export_data: true,
    },
  },
  {
    role: UserRole.REVIEWER,
    title: "Reviewer / Auditor",
    rank: 3,
    description: "Financial oversight, ledger audits, treasury monitoring, and export capabilities.",
    capabilities: {
      manage_system_configs: false,
      access_treasury: true,
      process_withdrawals: false,
      manage_members: false,
      manage_farms: false,
      mutate_financials: false,
      export_data: true,
    },
  },
  {
    role: UserRole.COORDINATOR,
    title: "Farm Coordinator",
    rank: 2,
    description: "Farm group supervision, member slot coordination, and farm expense logging.",
    capabilities: {
      manage_system_configs: false,
      access_treasury: false,
      process_withdrawals: false,
      manage_members: false,
      manage_farms: true,
      mutate_financials: false,
      export_data: false,
    },
  },
  {
    role: UserRole.SUPPORT,
    title: "Support Specialist",
    rank: 1,
    description: "Customer service, member inquiry verification, and read-only directory assistance.",
    capabilities: {
      manage_system_configs: false,
      access_treasury: false,
      process_withdrawals: false,
      manage_members: true,
      manage_farms: false,
      mutate_financials: false,
      export_data: false,
    },
  },
  {
    role: UserRole.MEMBER,
    title: "Standard Member",
    rank: 0,
    description: "Member dashboard access, Green Card benefits, farm slot participation, and referral network.",
    capabilities: {
      manage_system_configs: false,
      access_treasury: false,
      process_withdrawals: false,
      manage_members: false,
      manage_farms: false,
      mutate_financials: false,
      export_data: false,
    },
  },
];

/**
 * Returns role privileges filtered strictly by downward-only visibility:
 * Roles CANNOT see privileges of roles above them, only their own and roles below them.
 */
export function getVisibleRoleCapabilities(
  role?: string | null,
  email?: string | null
): RolePrivilegeDefinition[] {
  const isSuper =
    email?.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() ||
    parseUserRole(role) === UserRole.SUPER_ADMIN;

  if (isSuper) {
    return ALL_ROLE_PRIVILEGES;
  }

  const parsedRole = parseUserRole(role);
  const currentRank = ROLE_HIERARCHY_RANK[parsedRole] ?? 0;

  return ALL_ROLE_PRIVILEGES.filter((def) => def.rank <= currentRank);
}

/**
 * Strict Delegation Gate:
 * - Only Super Admin can create ANY role.
 * - Only Esther Bola (estherbola888@gmail.com) can create other roles (reviewer, coordinator, support, member).
 * - No other role can create roles.
 */
export function canCreateRoles(role?: string | null, email?: string | null): boolean {
  if (email && email.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase()) return true;
  if (parseUserRole(role) === UserRole.SUPER_ADMIN) return true;
  if (email && email.trim().toLowerCase() === ESTHER_BOLA_EMAIL.toLowerCase()) return true;
  return false;
}

/**
 * Returns the list of roles that a given actor is authorized to assign.
 */
export function getAllowedAssignableRoles(
  role?: string | null,
  email?: string | null
): UserRole[] {
  const isSuper =
    email?.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() ||
    parseUserRole(role) === UserRole.SUPER_ADMIN;

  if (isSuper) {
    return [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.REVIEWER,
      UserRole.COORDINATOR,
      UserRole.SUPPORT,
      UserRole.MEMBER,
    ];
  }

  const isEsther = email?.trim().toLowerCase() === ESTHER_BOLA_EMAIL.toLowerCase();
  if (isEsther) {
    return [
      UserRole.REVIEWER,
      UserRole.COORDINATOR,
      UserRole.SUPPORT,
      UserRole.MEMBER,
    ];
  }

  return [];
}

/**
 * Determines whether a user has a specific access capability, factoring in role defaults and granular overrides.
 */
export function hasUserCapability(
  capability: RoleCapability,
  role?: string | null,
  email?: string | null,
  customOverrides?: Record<string, boolean> | null
): boolean {
  const isSuper =
    email?.trim().toLowerCase() === SUPER_DEV_EMAIL.toLowerCase() ||
    parseUserRole(role) === UserRole.SUPER_ADMIN;

  if (isSuper) return true;

  if (customOverrides && typeof customOverrides[capability] === "boolean") {
    return customOverrides[capability];
  }

  const parsed = parseUserRole(role);
  const def = ALL_ROLE_PRIVILEGES.find((p) => p.role === parsed);
  return def ? def.capabilities[capability] === true : false;
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
