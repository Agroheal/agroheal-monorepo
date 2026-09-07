import { ShieldCheck, AlertCircle, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProgramEmoji, getProgramPillClass } from "@/lib/memberFilters";
import type { MemberSlotSummary } from "@/types/admin";

export function GreenCardBadge({ active, size = "sm" }: { active: boolean; size?: "sm" | "xs" }) {
  const iconSize = size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return active ? (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 font-semibold text-emerald-400",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
      )}
    >
      <ShieldCheck className={iconSize} /> Active
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 font-semibold text-destructive",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
      )}
    >
      <AlertCircle className={iconSize} /> Unpaid
    </span>
  );
}

export function RoleBadge({ role }: { role?: string }) {
  const isSuper = role === "super_admin";
  const isAdmin = role === "admin";
  const isSupport = role === "support";
  const isCoord = role === "coordinator";

  const badgeClass = isSuper
    ? "bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold"
    : isAdmin
    ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
    : isSupport
    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
    : isCoord
    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold"
    : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px]",
        badgeClass,
      )}
    >
      {role || "user"}
    </span>
  );
}


export function TotalSlotsBadge({ total }: { total: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
      <Sprout className="h-3 w-3" /> {total} {total === 1 ? "Slot" : "Slots"}
    </span>
  );
}

export function ProgramPills({ programs, size = "sm" }: { programs: MemberSlotSummary[]; size?: "sm" | "xs" }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {programs.map((prog, idx) => (
        <span
          key={idx}
          className={cn(
            "inline-flex items-center rounded-full border font-medium",
            getProgramPillClass(prog.category),
            size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
          )}
        >
          {getProgramEmoji(prog.category)} {prog.category.replace(" Village", "")}: <strong className="ml-0.5">{prog.slots}</strong>
        </span>
      ))}
    </div>
  );
}

