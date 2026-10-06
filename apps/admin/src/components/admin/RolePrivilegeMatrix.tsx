import { Shield, ShieldCheck, XCircle, Users, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  getVisibleRoleCapabilities,
  type RolePrivilegeDefinition,
  type RoleCapability,
} from "@shared";

const CAPABILITY_LABELS: Record<RoleCapability, { label: string; desc: string }> = {
  manage_system_configs: {
    label: "Platform Configurations",
    desc: "Economic parameters, fees, and Solvency Shield reserves",
  },
  access_treasury: {
    label: "Financial Treasury",
    desc: "Executive treasury audit, live reserves, and disbursals",
  },
  process_withdrawals: {
    label: "Disbursement Queue",
    desc: "Review, approve, and disburse bank withdrawals",
  },
  manage_members: {
    label: "Member Operations",
    desc: "Manage profile details, activations, and account status",
  },
  manage_farms: {
    label: "Farm Management",
    desc: "Farm group supervision, slot assignments, and harvest logs",
  },
  mutate_financials: {
    label: "Financial Mutations",
    desc: "Offline Green Card activation and slot crediting",
  },
  export_data: {
    label: "Data Export",
    desc: "Export member records and financial ledgers to Excel",
  },
};

export function RolePrivilegeMatrix() {
  const { profile } = useAdminAuth();
  const visibleRoles: RolePrivilegeDefinition[] = getVisibleRoleCapabilities(
    profile?.role,
    profile?.email
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Shield className="h-4.5 w-4.5 text-primary" /> Role Privileges Summary Matrix
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Authoritative capability matrix scoped to your administrative tier and below.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto gap-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
            Tier-Scoped Hierarchy
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {visibleRoles.map((roleDef) => (
            <div
              key={roleDef.role}
              className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/50 p-4 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {roleDef.title}
                  </h4>
                  <Badge variant="secondary" className="text-[11px] font-mono px-2 py-0">
                    Tier {roleDef.rank}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {roleDef.description}
                </p>
                <div className="space-y-1.5 border-t border-border/60 pt-2.5">
                  {(Object.keys(CAPABILITY_LABELS) as RoleCapability[]).map((capKey) => {
                    const isGranted = roleDef.capabilities[capKey] === true;
                    const info = CAPABILITY_LABELS[capKey];
                    return (
                      <div
                        key={capKey}
                        className="flex items-center justify-between text-xs py-0.5"
                      >
                        <span className={isGranted ? "text-foreground font-medium" : "text-muted-foreground/60"}>
                          {info.label}
                        </span>
                        {isGranted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/50">
                            <XCircle className="h-3 w-3" />
                            Restricted
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
