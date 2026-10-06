import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  Sprout,
  LogOut,
  Landmark,
  Award,
  Trophy,
  GraduationCap,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabaseClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface NavItem {
  label: string;
  path: string;
  icon: any;
  superAdminOnly?: boolean;
  requireTreasury?: boolean;
  hideForSupport?: boolean;
  hideForCoordinator?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Community & Network",
    items: [
      { label: "Members Directory", path: "/members", icon: Users, hideForCoordinator: true },
      { label: "Leaderboard & Ranks", path: "/leaderboard", icon: Trophy, hideForCoordinator: true },
    ],
  },
  {
    title: "Farm Operations",
    items: [
      { label: "Farm Management", path: "/farm-assignments", icon: Sprout },
    ],
  },
  {
    title: "Finance & Treasury",
    items: [
      { label: "Treasury & Solvency", path: "/treasury", icon: Landmark, requireTreasury: true, hideForSupport: true, hideForCoordinator: true },
      { label: "Transactions & Inflows", path: "/payments", icon: CreditCard, hideForCoordinator: true },
      { label: "Audit Trail", path: "/audit", icon: ShieldCheck, hideForCoordinator: true },
      { label: "Core Drivers Pool", path: "/core-drivers", icon: Award, superAdminOnly: true, hideForSupport: true, hideForCoordinator: true },
    ],
  },
  {
    title: "Content Management (CMS)",
    items: [
      { label: "Announcements & Legal", path: "/content", icon: FileText, hideForCoordinator: true },
      { label: "Academy & Courses", path: "/courses", icon: GraduationCap, hideForCoordinator: true },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Platform Settings", path: "/settings", icon: SettingsIcon, hideForSupport: true, hideForCoordinator: true },
    ],
  },
];

function isItemActive(path: string, pathname: string) {
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

export default function AdminLayout() {
  const { profile, isSupport, isCoordinator, hasTreasuryAccess, isSuperDeveloper } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin", { replace: true });
  };

  const isSuperAdmin =
    isSuperDeveloper ||
    profile?.role === "super_admin" ||
    profile?.email?.toLowerCase() === "developerelijah360@gmail.com";

  // Filter groups and items by user permissions
  const visibleGroups = navGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (item.superAdminOnly && !isSuperAdmin) return false;
        if (item.requireTreasury && !hasTreasuryAccess) return false;
        if (item.hideForSupport && isSupport) return false;
        if (item.hideForCoordinator && isCoordinator) return false;
        return true;
      });

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => group.items.length > 0);

  const allVisibleItems = visibleGroups.flatMap((g) => g.items);
  const currentTitle =
    allVisibleItems.find((item) => isItemActive(item.path, location.pathname))?.label ?? "Dashboard";

  const initials = (profile?.full_name || profile?.email || "A").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Sprout className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold text-foreground">Agroheal</span>
              <span className="text-xs text-muted-foreground">Admin Console</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {visibleGroups.map((group) => (
            <SidebarGroup key={group.title} className="py-1">
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1 group-data-[collapsible=icon]:hidden">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isItemActive(item.path, location.pathname);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                          <NavLink to={item.path} end={item.path === "/"}>
                            <item.icon />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 bg-background">
          <SidebarTrigger />
          <h1 className="text-sm font-medium text-foreground">{currentTitle}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.full_name}</span>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
