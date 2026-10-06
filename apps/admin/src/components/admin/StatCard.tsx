import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number | string;
  footer: string;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({ label, value, footer, icon: Icon, loading }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      {loading ? (
        <div className="mt-2.5 space-y-2">
          <div className="h-7 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-28 animate-pulse rounded bg-muted/60" />
        </div>
      ) : (
        <>
          <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{footer}</div>
        </>
      )}
    </div>
  );
}
