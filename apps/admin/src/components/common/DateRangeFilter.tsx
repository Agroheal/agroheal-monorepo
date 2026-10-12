import { useMemo } from "react";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  onClear?: () => void;
  className?: string;
  compact?: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onChange,
  onClear,
  className = "",
  compact = false,
}: DateRangeFilterProps) {
  const activePreset = useMemo(() => {
    if (!startDate && !endDate) return "all";

    const todayStr = new Date().toISOString().split("T")[0];
    if (startDate === todayStr && endDate === todayStr) return "today";

    const now = new Date();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    const weekStartStr = firstDayOfWeek.toISOString().split("T")[0];
    if (startDate === weekStartStr && endDate === todayStr) return "week";

    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    if (startDate === monthStartStr && endDate === todayStr) return "month";

    return "custom";
  }, [startDate, endDate]);

  const handleApplyPreset = (preset: "all" | "today" | "week" | "month") => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (preset) {
      case "all":
        onChange("", "");
        if (onClear) onClear();
        break;
      case "today":
        onChange(todayStr, todayStr);
        break;
      case "week": {
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - today.getDay());
        const startStr = firstDay.toISOString().split("T")[0];
        onChange(startStr, todayStr);
        break;
      }
      case "month": {
        const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
        onChange(startStr, todayStr);
        break;
      }
    }
  };

  const handleStartDateChange = (val: string) => {
    onChange(val, endDate);
  };

  const handleEndDateChange = (val: string) => {
    onChange(startDate, val);
  };

  const hasFilter = Boolean(startDate || endDate);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Quick Presets */}
      <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/50 text-xs">
        <button
          type="button"
          onClick={() => handleApplyPreset("all")}
          className={`px-2 py-1 rounded-md font-medium transition-colors ${
            activePreset === "all"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("today")}
          className={`px-2 py-1 rounded-md font-medium transition-colors ${
            activePreset === "today"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("week")}
          className={`px-2 py-1 rounded-md font-medium transition-colors ${
            activePreset === "week"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          This Week
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("month")}
          className={`px-2 py-1 rounded-md font-medium transition-colors ${
            activePreset === "month"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          This Month
        </button>
      </div>

      {/* From - To Date Pickers */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 bg-muted/30 border border-border/60 rounded-lg px-2 py-1">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground font-medium shrink-0">From</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="h-6 w-32 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 font-mono"
          />
        </div>

        <span className="text-xs text-muted-foreground">—</span>

        <div className="flex items-center gap-1 bg-muted/30 border border-border/60 rounded-lg px-2 py-1">
          <span className="text-[11px] text-muted-foreground font-medium shrink-0">To</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="h-6 w-32 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 font-mono"
          />
        </div>

        {hasFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleApplyPreset("all")}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Clear Date Filter"
          >
            <X className="w-3 h-3" />
            {!compact && "Clear"}
          </Button>
        )}
      </div>
    </div>
  );
}
