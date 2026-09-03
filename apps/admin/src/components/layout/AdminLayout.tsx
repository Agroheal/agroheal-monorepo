import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, Settings as SettingsIcon, Sprout, LogOut, MapPinned } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Members", path: "/members", icon: Users },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Farm Assignments", path: "/farm-assignments", icon: MapPinned },
  { label: "Settings", path: "/settings", icon: SettingsIcon },
];

function isItemActive(path: string, pathname: string) {
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

export default function AdminLayout() {
  const { profile } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const currentTitle =
    navItems.find((item) => isItemActive(item.path, location.pathname))?.label ?? "Dashboard";

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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
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
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <SidebarTrigger />
          <h1 className="text-sm font-medium text-foreground">{currentTitle}</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.full_name}</span>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
