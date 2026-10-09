import { useAdminTierFilter } from "@/context/AdminTierContext";
import { cn } from "@/lib/utils";

export function AdminTierToggle({ className }: { className?: string }) {
  const { tier, setTier } = useAdminTierFilter();

  return (
    <div
      className={cn(
        "inline-flex items-center p-0.5 bg-muted/80 rounded-lg border border-border text-xs font-medium shrink-0",
        className
      )}
      role="group"
      aria-label="Platform Data Ecosystem Tier Filter"
    >
      <button
        type="button"
        onClick={() => setTier("live")}
        className={cn(
          "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-xs",
          tier === "live"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Modern Platform Records (Live System Default)"
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            tier === "live" ? "bg-emerald-500" : "bg-emerald-500/40"
          )}
        />
        <span>Modern</span>
        <span className="hidden xl:inline text-[10px] text-muted-foreground font-normal">
          (Default)
        </span>
      </button>

      <button
        type="button"
        onClick={() => setTier("legacy")}
        className={cn(
          "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-xs",
          tier === "legacy"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Legacy Migrated Records (Pre-Launch Base)"
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            tier === "legacy" ? "bg-amber-500" : "bg-amber-500/40"
          )}
        />
        <span>Legacy</span>
      </button>

      <button
        type="button"
        onClick={() => setTier("all")}
        className={cn(
          "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 text-xs",
          tier === "all"
            ? "bg-background text-foreground shadow-xs font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Both Modern and Legacy Records Combined"
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            tier === "all" ? "bg-blue-500" : "bg-blue-500/40"
          )}
        />
        <span>Both</span>
      </button>
    </div>
  );
}
