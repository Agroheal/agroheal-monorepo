import React, { ReactNode } from "react";
import { ShieldCheck, Calculator } from "lucide-react";

export type IconComponent = React.ComponentType<{ className?: string }>;

export interface CalculatorMetric {
  label: string;
  value: string;
  subtext: string;
  isHighlight?: boolean;
}

export interface NetworkCalculatorCardProps {
  eyebrowIcon?: IconComponent;
  eyebrowText: string;
  title: string;
  description: string;
  controls: ReactNode;
  metrics: CalculatorMetric[];
  complianceNotice?: string;
  className?: string;
}

export const NetworkCalculatorCard: React.FC<NetworkCalculatorCardProps> = ({
  eyebrowIcon: EyebrowIcon = Calculator,
  eyebrowText,
  title,
  description,
  controls,
  metrics,
  complianceNotice,
  className = "",
}) => {
  return (
    <div
      className={`bg-gradient-to-br from-emerald-900 via-green-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/40 space-y-6 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
            <EyebrowIcon className="w-4 h-4" /> {eyebrowText}
          </span>
          <h4 className="text-xl sm:text-2xl font-black">{title}</h4>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 p-3.5 rounded-2xl border border-white/15 shrink-0">
          {controls}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={
              m.isHighlight
                ? "bg-emerald-500/20 p-4 rounded-2xl border border-emerald-400/50"
                : "bg-white/5 p-4 rounded-2xl border border-white/10"
            }
          >
            <span
              className={
                m.isHighlight
                  ? "text-[10px] text-amber-300 font-bold uppercase tracking-wider block"
                  : "text-[10px] text-emerald-300 uppercase tracking-wider block"
              }
            >
              {m.label}
            </span>
            <span
              className={
                m.isHighlight
                  ? "text-xl font-black text-amber-300 mt-1 block"
                  : "text-xl font-black text-white mt-1 block"
              }
            >
              {m.value}
            </span>
            <span
              className={
                m.isHighlight
                  ? "text-[10px] text-emerald-200 mt-0.5 block"
                  : "text-[10px] text-emerald-200/70 mt-0.5 block"
              }
            >
              {m.subtext}
            </span>
          </div>
        ))}
      </div>

      {complianceNotice && (
        <div className="mt-5 p-3.5 rounded-xl bg-black/25 border border-emerald-500/20 flex items-start gap-2.5 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-200/80 leading-relaxed">
            <strong className="text-emerald-100 font-semibold">
              Cooperative Notice:
            </strong>{" "}
            {complianceNotice}
          </p>
        </div>
      )}
    </div>
  );
};

export default NetworkCalculatorCard;
