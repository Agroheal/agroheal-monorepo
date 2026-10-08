import { Users, ShieldCheck, AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GreenCardFilter } from "@/lib/memberFilters";
import type { Member } from "@/types/admin";

interface Props {
  members: Member[];
  value: GreenCardFilter;
  onChange: (v: GreenCardFilter) => void;
  loading?: boolean;
}

export function MembersKpiCards({ members, value, onChange, loading }: Props) {
  const total = members.length;
  const liveTotal = members.filter((m) => !m.is_legacy).length;
  const legacyTotal = members.filter((m) => m.is_legacy).length;

  const active = members.filter((m) => m.has_green_card).length;
  const liveActive = members.filter((m) => !m.is_legacy && m.has_green_card).length;
  const legacyActive = members.filter((m) => m.is_legacy && m.has_green_card).length;

  const pending = total - active;
  const livePending = members.filter((m) => !m.is_legacy && !m.has_green_card).length;
  const legacyPending = members.filter((m) => m.is_legacy && !m.has_green_card).length;

  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  const cards: {
    key: GreenCardFilter;
    icon: LucideIcon;
    iconClass: string;
    value: number;
    label: string;
    subtext: string;
  }[] = [
    {
      key: "all",
      icon: Users,
      iconClass: "bg-primary/15 text-primary",
      value: total,
      label: "Total Registered Members",
      subtext: `${liveTotal} Live • ${legacyTotal} Legacy`,
    },
    {
      key: "active",
      icon: ShieldCheck,
      iconClass: "bg-emerald-400/15 text-emerald-400",
      value: active,
      label: `Green Card Active (${activePct}%)`,
      subtext: `${liveActive} Live • ${legacyActive} Legacy`,
    },
    {
      key: "unpaid",
      icon: AlertCircle,
      iconClass: "bg-amber-400/15 text-amber-400",
      value: pending,
      label: "Pending / Needs Green Card",
      subtext: `${livePending} Live • ${legacyPending} Legacy`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40",
            value === c.key ? "border-primary/60 ring-1 ring-primary/30" : "border-border",
          )}
        >
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.iconClass)}>
            <c.icon className="h-5 w-5" />
          </span>
          <span>
            {loading ? (
              <span className="mb-1 block h-6 w-14 animate-pulse rounded bg-muted" />
            ) : (
              <span className="block text-xl font-semibold text-foreground">{c.value}</span>
            )}
            <span className="block text-xs text-muted-foreground">{c.label}</span>
            <span className="block text-[11px] text-muted-foreground/80 mt-0.5 font-medium">{c.subtext}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
