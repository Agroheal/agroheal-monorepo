import { Edit3, KeyRound, Mail, Phone, MapPin, ShieldAlert, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GreenCardBadge, ProgramPills, RoleBadge } from "@/components/admin/MemberBadges";
import { memberInitial } from "@/lib/memberFilters";
import { cn } from "@/lib/utils";
import type { Member } from "@/types/admin";

interface Props {
  member: Member;
  recoveryLoading: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onEdit: (m: Member) => void;
  onResetPassword: (m: Member) => void;
  onToggleSuspend?: (m: Member) => void;
  onImpersonate?: (m: Member) => void;
  onAutoPlaceMatrix?: (m: Member) => void;
  isSuperAdmin?: boolean;
}

export function MemberCard({
  member: m,
  recoveryLoading,
  selected = false,
  onToggleSelect,
  onEdit,
  onResetPassword,
  onToggleSuspend,
  onImpersonate,
  onAutoPlaceMatrix,
  isSuperAdmin,
}: Props) {
  return (
    <div className={cn("flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all", selected && "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/5")}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
              />
            )}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {memberInitial(m)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{m.full_name}</span>
                {m.is_legacy ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Legacy
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                )}
                {m.is_suspended && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                    Suspended
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">Joined {m.created_at}</div>
            </div>
          </div>
          <RoleBadge role={m.role} />
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="break-all">{m.email}</span>
          </div>
          {m.phone && (
            <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <Phone className="h-3.5 w-3.5 shrink-0" /> {m.phone}
            </a>
          )}

          <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-background/40 p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Location:</span>
              {m.state && m.lga ? (
                <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {m.lga}, {m.state}
                </span>
              ) : (
                <span className="text-[11px] text-amber-500 font-medium">Pending LGA</span>
              )}
            </div>

            {Number(m.advance_debt_balance || 0) > 0 && (
              <div className="flex items-center justify-between text-[11px] text-rose-500 font-semibold bg-rose-500/10 px-2 py-0.5 rounded">
                <span>Advance Debt:</span>
                <span>₦{Number(m.advance_debt_balance).toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Green Card:</span>
              <GreenCardBadge active={m.has_green_card} size="xs" />
            </div>

            {m.has_green_card && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Member ID:</span>
                <span className="font-mono text-xs font-semibold text-foreground">{m.member_id}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Farm Slots:</span>
              {m.total_slots > 0 ? (
                <span className="text-[11px] font-semibold text-emerald-400">
                  🌱 {m.total_slots} {m.total_slots === 1 ? "Slot" : "Slots"}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">0 Slots</span>
              )}
            </div>

            {m.total_slots > 0 && <ProgramPills programs={m.slots_by_program} size="xs" />}

            <div className="flex items-center justify-between border-t border-dashed border-border pt-1.5 text-[10px] text-muted-foreground">
              <span>
                Sponsor: <strong className="text-foreground/80">{m.sponsor_name || m.referred_by || "Direct"}</strong>
              </span>
              {m.placement_parent_id ? (
                <span>
                  Tree: <strong className="text-foreground/80">L{m.matrix_depth ?? "?"} (P{m.matrix_position ?? "?"})</strong>
                </span>
              ) : (m.has_purchased_starter_pack || m.is_wealth_creation_active) ? (
                <span className="text-amber-500 font-semibold">⚠️ Unplaced in Matrix</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {onAutoPlaceMatrix && (m.has_purchased_starter_pack || m.is_wealth_creation_active) && !m.placement_parent_id && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 px-2.5 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 cursor-pointer font-semibold w-full"
            onClick={() => onAutoPlaceMatrix(m)}
            title="Place member into 5x7 matrix (BFS)"
          >
            <GitMerge className="h-3.5 w-3.5 text-amber-400" /> Place Matrix
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" className="h-8 flex-1 gap-1.5 text-xs" onClick={() => onEdit(m)}>
          <Edit3 className="h-3.5 w-3.5" /> Edit
        </Button>
        {isSuperAdmin && onImpersonate && m.role !== "super_admin" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 px-2.5 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
            onClick={() => onImpersonate(m)}
            title="Sign in as this member (Super Admin)"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Impersonate
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 flex-1 gap-1.5 text-xs"
          disabled={recoveryLoading}
          onClick={() => onResetPassword(m)}
        >
          <KeyRound className="h-3.5 w-3.5" /> Reset
        </Button>
        {onToggleSuspend && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "h-8 px-2 text-xs",
              m.is_suspended
                ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                : "border-destructive/40 text-destructive hover:bg-destructive/10",
            )}
            onClick={() => onToggleSuspend(m)}
            title={m.is_suspended ? "Unblock account" : "Suspend account"}
          >
            {m.is_suspended ? "Unblock" : "Suspend"}
          </Button>
        )}
      </div>
    </div>
  );
}
