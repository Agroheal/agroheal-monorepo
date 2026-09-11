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
  ChevronRight,
  ChevronDown,
  Lock,
  HelpCircle,
  Sparkles,
  ShoppingBag,
  CornerDownRight,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";
import HowItWorksContent from "@/components/webComponents/HowItWorksContent";
import UserAvatar from "@/components/ui/UserAvatar";

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
  badge?: string;
  disabled?: boolean;
}

// ── Consolidated Information Hierarchy ──
// 1. Overview (#1)
// 2. Learning Academy (#2)
// 3. Farm Operations
// 4. Producer Network
// 5. Consumer Network (Coming Soon - E-commerce)
// 6. Wallet & Ledger (Penultimate)
// 7. Account & Identity (Profile & Green Card)
const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    id: "academy",
    label: "Learning Academy",
    path: "/dashboard/courses",
    icon: BookOpen,
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
    id: "consumer-network",
    label: "Consumer Network",
    path: "/dashboard/consumer-network",
    icon: ShoppingBag,
    badge: "Coming Soon",
  },
  {
    id: "finances",
    label: "Wallet & Ledger",
    path: "/dashboard/transactions",
    icon: Wallet,
  },
  {
    id: "account",
    label: "Profile & Settings",
    path: "/dashboard/profile",
    icon: IdCard,
    subItems: [
      { label: "My Green Card", path: "/dashboard/green-card" },
    ],
  },
];

const HIDDEN_ROUTES = ["/signin", "/signup"];

const getPageTitle = (currentPath: string): string => {
  if (currentPath === "/dashboard" || currentPath === "/dashboard/") {
    return "Overview";
  }

  if (
    currentPath === "/dashboard/how-it-works" ||
    currentPath === "/dashboard/roadmap-guide"
  ) {
    return "How Agroheal Works";
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
  avatarUrl,
}: {
  normalizedPath: string;
  onLogout: () => void;
  handleClose: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string | null;
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

  return (
    <div className="flex flex-col h-full select-none text-emerald-100">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-800/50 bg-[#0a1e12]/80 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-1 flex items-center justify-center shadow-md ring-1 ring-white/15 shrink-0">
          <img
            src="/apple-touch-icon.png"
            alt="AgroHeal"
            className="w-7 h-7 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-white font-black text-sm tracking-tight block leading-tight truncate">
            AgroHeal Member Portal
          </span>
          <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block truncate">
            Web App
          </span>
        </div>
      </div>

      {/* Navigation Groups (compact, scrollbar completely hidden) */}
      <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto no-scrollbar">
        {navGroups.map((group) => {
          const Icon = group.icon;
          const hasChildren = Boolean(group.subItems && group.subItems.length > 0);
          const isGroupActive = activeGroupId === group.id;
          const isOpen = Boolean(openGroups[group.id]);

          // Exact single link (Overview, Learning Academy, Consumer Network)
          if (!hasChildren) {
            return (
              <NavLink
                key={group.id}
                to={group.path}
                end={group.exact}
                onClick={handleClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white text-emerald-950 shadow-sm font-semibold"
                      : "text-emerald-100/90 hover:bg-emerald-800/40 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-emerald-700" : "text-emerald-300/80"
                        }`}
                      />
                      <span className="truncate">{group.label}</span>
                    </div>
                    {group.badge ? (
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-emerald-900/90 text-emerald-300 border border-emerald-700/60"
                      }`}>
                        {group.badge}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : null}
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
                    ? "bg-emerald-800/50 text-white font-medium"
                    : "text-emerald-100/90 hover:bg-emerald-800/30 hover:text-white"
                }`}
                onClick={() => toggleGroup(group.id)}
              >
                <NavLink
                  to={group.path}
                  onClick={() => {
                    setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
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
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSubActive
                              ? "bg-emerald-800/80 text-white font-semibold shadow-xs"
                              : "text-emerald-200/75 hover:bg-emerald-800/30 hover:text-white"
                          }`}
                        >
                          <CornerDownRight className="w-3 h-3 text-emerald-400/60 shrink-0" />
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

      {/* User Profile & Integrated Sign Out Footer */}
      <div className="p-3 border-t border-emerald-800/50 bg-[#0a1e12]/70 shrink-0">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-900/30 border border-emerald-800/50 hover:border-emerald-700/60 transition-colors">
          <NavLink
            to="/dashboard/profile"
            onClick={handleClose}
            className="flex items-center gap-2.5 min-w-0 flex-1 group"
          >
            <UserAvatar
              src={avatarUrl}
              name={userName}
              email={userEmail}
              sizeClassName="w-8 h-8"
              textClassName="text-xs font-bold"
              roundedClassName="rounded-full"
              className="border border-emerald-500/40 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                {userName || "Agroheal Member"}
              </p>
              <p className="text-[10px] text-emerald-300/75 truncate leading-tight mt-0.5">
                Profile & Settings
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            className="p-2 rounded-lg text-emerald-300/70 hover:text-rose-300 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 transition-all shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
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

  // Close drawers on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (howItWorksOpen) setHowItWorksOpen(false);
        if (mobileSidebarOpen) setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen, howItWorksOpen]);

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
          avatarUrl={profile?.avatar_url}
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
                avatarUrl={profile?.avatar_url}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── HOW IT WORKS RESPONSIVE SLIDE-OVER DRAWER ── */}
      <AnimatePresence>
        {howItWorksOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
              onClick={() => setHowItWorksOpen(false)}
            />

            {/* Slide-over Container */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden border-l border-gray-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-[#0c2415] text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700/80 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                      How Agroheal Works
                    </h2>
                    <p className="text-[11px] text-emerald-300">
                      Learn, Practice & Earn Cooperative Roadmap
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setHowItWorksOpen(false)}
                  className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors"
                  aria-label="Close guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar bg-gray-50/50">
                <HowItWorksContent
                  variant="modal"
                  onNavigate={() => setHowItWorksOpen(false)}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger for mobile/tablet */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-1 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700 lg:hidden shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Quick User DP in top-left */}
            <NavLink
              to="/dashboard/profile"
              className="lg:hidden shrink-0"
              title="View Profile"
            >
              <UserAvatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                email={profile?.email || session?.user?.email}
                sizeClassName="w-8 h-8"
                textClassName="text-[11px] font-bold"
                roundedClassName="rounded-full"
                className="ring-1 ring-emerald-600/30"
              />
            </NavLink>

            {/* Page title */}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* How It Works Header Button */}
            <button
              onClick={() => setHowItWorksOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 text-xs font-semibold transition-all shadow-xs"
              title="How Agroheal Works Guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">How It Works</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Desktop User DP Profile Badge */}
            <NavLink
              to="/dashboard/profile"
              className="hidden sm:flex items-center gap-2.5 pl-2.5 py-1 border-l border-gray-200 hover:opacity-85 transition-opacity"
              title="Manage Profile & Settings"
            >
              <UserAvatar
                src={profile?.avatar_url}
                name={profile?.full_name}
                email={profile?.email || session?.user?.email}
                sizeClassName="w-8 h-8"
                textClassName="text-[11px] font-bold"
                roundedClassName="rounded-full"
                className="ring-2 ring-emerald-500/25 shadow-xs"
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[130px]">
                  {profile?.full_name || "Member Account"}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold leading-tight">
                  View Profile
                </p>
              </div>
            </NavLink>
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
