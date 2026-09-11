import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Sprout,
  Wallet,
  GitBranch,
  IdCard,
  BookOpen,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight,
  ChevronDown,
  Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

interface SubNavItem {
  label: string;
  path: string;
}

interface NavGroup {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  subItems?: SubNavItem[];
}

// ── 6-Menu Grouped Information Hierarchy ──
const navGroups: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: "farm-operations",
    label: "Farm Operations",
    path: "/dashboard/slots-subscription",
    icon: Sprout,
    subItems: [
      { label: "Slot Management", path: "/dashboard/slots-subscription" },
      { label: "Practice Slots", path: "/dashboard/slots" },
      { label: "Farm Accounts", path: "/dashboard/group-farm-accounts" },
      { label: "Mushroom Village", path: "/dashboard/mushroom-village" },
    ],
  },
  {
    id: "finances",
    label: "Wallet & Ledger",
    path: "/dashboard/transactions",
    icon: Wallet,
    subItems: [
      { label: "Transaction Ledger", path: "/dashboard/transactions" },
      { label: "Other Payments", path: "/dashboard/other-payments" },
    ],
  },
  {
    id: "network",
    label: "Producer Network",
    path: "/dashboard/compound-referrals",
    icon: GitBranch,
    subItems: [
      { label: "5×7 Matrix Organogram", path: "/dashboard/compound-referrals" },
    ],
  },
  {
    id: "account",
    label: "Account & Identity",
    path: "/dashboard/green-card",
    icon: IdCard,
    subItems: [
      { label: "Green Card Community", path: "/dashboard/green-card" },
      { label: "Profile Settings", path: "/dashboard/profile" },
      { label: "Next of Kin", path: "/dashboard/kin" },
      { label: "Legal Agreement", path: "/dashboard/legal" },
    ],
  },
  {
    id: "academy",
    label: "Learning Academy",
    path: "/dashboard/courses",
    icon: BookOpen,
    subItems: [
      { label: "LEAP Courses", path: "/dashboard/courses" },
      { label: "Step-by-Step Guide", path: "/dashboard/roadmap-guide" },
    ],
  },
];

const HIDDEN_ROUTES = ["/signin", "/signup"];

const getPageTitle = (currentPath: string): string => {
  if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
    return "Dashboard Overview";
  }

  for (const group of navGroups) {
    if (group.subItems) {
      const match = group.subItems.find(
        (sub) =>
          currentPath === sub.path || currentPath.startsWith(sub.path + "/"),
      );
      if (match) return match.label;
    }
    if (currentPath === group.path || currentPath.startsWith(group.path + "/")) {
      return group.label;
    }
  }
  return "Dashboard";
};

// ── Shared Sidebar Navigation Component ──
const SidebarContent = ({
  normalizedPath,
  onLogout,
  handleClose,
  userName,
  userEmail,
}: {
  normalizedPath: string;
  onLogout: () => void;
  handleClose: () => void;
  userName?: string;
  userEmail?: string;
}) => {
  // Determine which group contains the active path
  const activeGroupId = useMemo(() => {
    for (const group of navGroups) {
      if (group.exact) {
        if (normalizedPath === group.path) return group.id;
      } else {
        if (
          normalizedPath === group.path ||
          normalizedPath.startsWith(group.path + "/")
        ) {
          return group.id;
        }
        if (
          group.subItems?.some(
            (sub) =>
              normalizedPath === sub.path ||
              normalizedPath.startsWith(sub.path + "/"),
          )
        ) {
          return group.id;
        }
      }
    }
    return null;
  }, [normalizedPath]);

  // Track accordion expand/collapse state per group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-expand the active group when route changes
  useEffect(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId]);

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const initials = (userName || userEmail || "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full select-none text-emerald-100">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-800/50 bg-[#0a1e12]/60 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-md shadow-emerald-950/40 flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-white font-bold text-base tracking-tight block leading-tight">
            Agroheal
          </span>
          <span className="text-[10px] uppercase font-semibold text-emerald-400/90 tracking-wider block">
            Member Portal
          </span>
        </div>
      </div>

      {/* Navigation Groups (compact, 6 groups, scrollbar completely hidden) */}
      <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto no-scrollbar">
        {navGroups.map((group) => {
          const Icon = group.icon;
          const hasChildren = Boolean(group.subItems && group.subItems.length > 0);
          const isGroupActive = activeGroupId === group.id;
          const isOpen = Boolean(openGroups[group.id]);

          // Exact single link (like Dashboard overview)
          if (!hasChildren) {
            return (
              <NavLink
                key={group.id}
                to={group.path}
                end={group.exact}
                onClick={handleClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white text-emerald-950 shadow-sm font-semibold"
                      : "text-emerald-100/90 hover:bg-emerald-800/40 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-emerald-700" : "text-emerald-300/80"
                      }`}
                    />
                    <span className="flex-1 truncate">{group.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            );
          }

          // Group with Sub-items (Accordion)
          return (
            <div key={group.id} className="space-y-0.5">
              <div
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-all duration-150 ${
                  isGroupActive
                    ? "bg-emerald-800/60 text-white border border-emerald-700/40"
                    : "text-emerald-100/90 hover:bg-emerald-800/30 hover:text-white"
                }`}
                onClick={() => toggleGroup(group.id)}
              >
                <NavLink
                  to={group.path}
                  onClick={(e) => {
                    // Navigate to primary route but also ensure group is opened
                    setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
                    // Only close drawer if on mobile and no children need inspection
                  }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isGroupActive ? "text-emerald-300" : "text-emerald-300/80"
                    }`}
                  />
                  <span className="truncate">{group.label}</span>
                </NavLink>

                {/* Accordion toggle trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleGroup(group.id);
                  }}
                  className="p-1 rounded-md text-emerald-300/70 hover:text-white hover:bg-emerald-700/40 transition-colors ml-1"
                  aria-label={`Toggle ${group.label} sub-items`}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-emerald-200" : "text-emerald-400/60"
                    }`}
                  />
                </button>
              </div>

              {/* Sub-items accordion */}
              <AnimatePresence initial={false}>
                {isOpen && group.subItems && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden pl-7 pr-1 py-1 space-y-1"
                  >
                    {group.subItems.map((sub) => {
                      const isSubActive =
                        normalizedPath === sub.path ||
                        normalizedPath.startsWith(sub.path + "/");
                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={handleClose}
                          className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSubActive
                              ? "bg-emerald-500/25 text-white font-semibold border-l-2 border-emerald-400 pl-2.5 shadow-xs"
                              : "text-emerald-200/75 hover:bg-emerald-800/40 hover:text-white border-l-2 border-transparent pl-2.5"
                          }`}
                        >
                          <span className="truncate block">{sub.label}</span>
                        </NavLink>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-emerald-800/50 bg-[#0a1e12]/70 shrink-0 space-y-2">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-emerald-900/30 border border-emerald-800/40">
          <div className="w-8 h-8 rounded-full bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {userName || "Agroheal Member"}
            </p>
            <p className="text-[11px] text-emerald-300/75 truncate leading-tight">
              {userEmail || "Active"}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-200/90 hover:bg-rose-500/15 hover:text-rose-200 hover:border-rose-500/20 border border-transparent transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0 text-emerald-300/80" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { session, profile } = useAuth();

  const isSuperDeveloper =
    session?.user?.email?.toLowerCase() === "developerelijah360@gmail.com";
  const isReadOnly = !isSuperDeveloper;

  const normalizedPath = normalizePath(pathname);

  useEffect(() => {
    if (pathname !== normalizedPath) {
      navigate(normalizedPath, { replace: true });
    }
  }, [pathname, normalizedPath, navigate]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  const handleClose = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const hiddenPath = HIDDEN_ROUTES.includes(normalizedPath);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/", { replace: true });
    }
  }

  if (hiddenPath) return <Outlet />;

  const currentTitle = getPageTitle(normalizedPath);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── DESKTOP SIDEBAR — visible on lg+ (256px - 288px width, zero scrollbar) ── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#0c2415] border-r border-emerald-900/60 shadow-xl shrink-0 h-full overflow-hidden">
        <SidebarContent
          normalizedPath={normalizedPath}
          onLogout={handleLogout}
          handleClose={handleClose}
          userName={profile?.full_name}
          userEmail={profile?.email || session?.user?.email}
        />
      </aside>

      {/* ── MOBILE DRAWER — drawer on small screens only ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-[#0c2415] z-50 shadow-2xl border-r border-emerald-900/60 lg:hidden flex flex-col overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors z-50"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>

              <SidebarContent
                normalizedPath={normalizedPath}
                onLogout={handleLogout}
                handleClose={handleClose}
                userName={profile?.full_name}
                userEmail={profile?.email || session?.user?.email}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger for mobile/tablet */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-1 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 lg:hidden shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title */}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Mobile Logo Brand */}
            <div className="flex items-center gap-2 lg:hidden pl-2 border-l border-gray-200">
              <div className="w-7 h-7 rounded-lg bg-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-emerald-900 font-bold text-sm hidden sm:inline">
                Agroheal
              </span>
            </div>
          </div>
        </header>

        {/* Read-only Audit Banner */}
        {isReadOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs sm:text-sm text-amber-800 flex items-center justify-between gap-3 shadow-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span className="truncate sm:whitespace-normal">
                <strong>Read-Only Audit Mode:</strong> The platform is currently undergoing financial reconciliation & audit. Data modifications and new slot subscriptions are temporarily in view-only mode.
              </span>
            </div>
            <span className="shrink-0 text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              AUDIT ACTIVE
            </span>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-gray-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
