import { Edit3, KeyRound, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GreenCardBadge, ProgramPills, RoleBadge } from "@/components/admin/MemberBadges";
import { memberInitial } from "@/lib/memberFilters";
import type { Member } from "@/types/admin";

interface Props {
  member: Member;
  recoveryLoading: boolean;
  onEdit: (m: Member) => void;
  onResetPassword: (m: Member) => void;
}

export function MemberCard({ member: m, recoveryLoading, onEdit, onResetPassword }: Props) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {memberInitial(m)}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{m.full_name}</div>
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

            {m.referral_code && (
              <div className="flex items-center justify-between border-t border-dashed border-border pt-1.5 text-[10px] text-muted-foreground">
                <span>
                  Ref: <strong className="text-foreground/80">{m.referral_code}</strong>
                </span>
                <span>
                  By: <strong className="text-foreground/80">{m.referred_by || "Direct"}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" className="h-8 flex-1 gap-1.5 text-xs" onClick={() => onEdit(m)}>
          <Edit3 className="h-3.5 w-3.5" /> Edit
        </Button>
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
      </div>
    </div>
  );
}
