import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sprout,
  CreditCard,
  ScrollText,
  FileText,
  Route,
  LogOut,
  Menu,
  X,
  Leaf,
  ChevronRight,
  BookOpen,
  Users,
  IdCard,
  Lock,
  Wallet,
  GitBranch,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "./NotificationBell";

const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Green Card Community", path: "/dashboard/green-card", icon: IdCard },
  { label: "Wallet & Ledger", path: "/dashboard/transactions", icon: Wallet },
  { label: "Courses", path: "/dashboard/courses", icon: ScrollText },
  { label: "Secure Practice Slot", path: "/dashboard/slots", icon: Sprout },
  {
    label: "Slot Management",
    path: "/dashboard/slots-subscription",
    icon: CreditCard,
  },
  {
    label: "Group Farm Accounts",
    path: "/dashboard/group-farm-accounts",
    icon: BookOpen,
  },
  {
    label: "Other Payments",
    path: "/dashboard/other-payments",
    icon: CreditCard,
  },
  {
    label: "5×7 Matrix Organogram",
    path: "/dashboard/compound-referrals",
    icon: GitBranch,
  },
  {
    label: "Mushroom Village",
    path: "/dashboard/mushroom-village",
    icon: Leaf,
  },
  {
    label: "Step-by-Step Guide",
    path: "/dashboard/roadmap-guide",
    icon: Route,
  },
  { label: "Legal Agreement", path: "/dashboard/legal", icon: FileText },
  { label: "Next of Kin", path: "/dashboard/kin", icon: Users },
];

const HIDDEN_ROUTES = ["/signin", "/signup"];

// Extracted so both desktop + mobile sidebars share the same nav markup
const SidebarContent = ({
  onLogout,
  handleClose,
}: {
  onLogout: () => void;
  handleClose: () => void;
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-green-700">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg">Agroheal</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/dashboard"}
            onClick={handleClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-green-800"
                  : "text-green-100 hover:bg-green-700 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-green-600" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-green-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-green-100 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { session } = useAuth();

  const isSuperDeveloper = session?.user?.email?.toLowerCase() === "developerelijah360@gmail.com";
  const isReadOnly = !isSuperDeveloper;

  const normalizedPath = normalizePath(pathname);

  useEffect(() => {
    if (pathname !== normalizedPath) {
      navigate(normalizedPath, { replace: true });
    }
  }, [pathname, normalizedPath, navigate]);

  function handleClose() {
    setMobileSidebarOpen(false);
  }

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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── DESKTOP SIDEBAR — always visible on lg+ ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-green-900 flex-shrink-0">
        <SidebarContent onLogout={handleLogout} handleClose={handleClose} />
      </aside>

      {/* ── MOBILE SIDEBAR — drawer on small screens only ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed left-0 top-0 h-full w-64 bg-green-800 z-40 shadow-2xl lg:hidden"
            >
              {/* Close button — mobile only */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 text-green-300 hover:text-white transition-colors z-50"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent
                onLogout={handleLogout}
                handleClose={handleClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — hamburger only shows on mobile */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 z-20 flex-shrink-0">
          {/* Hamburger — hidden on desktop since sidebar is always visible */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900 capitalize">
              {navItems.find((item) =>
                item.path === "/dashboard"
                  ? normalizedPath === "/dashboard"
                  : normalizedPath.startsWith(item.path),
              )?.label ?? "Dashboard"}
            </h1>
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Logo — shown in top bar on mobile since sidebar is hidden */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-full bg-green-800 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-green-800 font-bold text-sm hidden sm:block">
              Agroheal
            </span>
          </div>
        </header>

        {isReadOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs sm:text-sm text-amber-800 flex items-center justify-between gap-3 shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Read-Only Audit Mode:</strong> The platform is currently undergoing financial reconciliation & audit. Data modifications and new slot subscriptions are temporarily in view-only mode.
              </span>
            </div>
            <span className="shrink-0 text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              AUDIT ACTIVE
            </span>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
