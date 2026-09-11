import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";

interface RegulatoryNoticeProps {
  className?: string;
  linkHref?: string;
}

export default function RegulatoryNotice({
  className = "",
  linkHref = "/dashboard/legal#terms",
}: RegulatoryNoticeProps) {
  return (
    <div
      className={`bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3.5 shadow-xs ${className}`}
    >
      <div className="w-8 h-8 rounded-xl bg-amber-200/80 border border-amber-300 flex items-center justify-center shrink-0 text-amber-950 mt-0.5">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <strong className="text-amber-950 font-bold block text-xs sm:text-sm tracking-tight">
            Regulatory Compliance Notice — We Are Not An Investment Platform
          </strong>
          <Link
            to={linkHref}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-950 hover:text-emerald-900 underline underline-offset-2 transition-colors ml-auto"
          >
            <span>Read Full Legal Disclosure</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-amber-900/95 leading-relaxed">
          AgroHeal Solutions Ltd is an agricultural technology and cooperative enablement enterprise. We facilitate agricultural production, training, and direct distribution infrastructure for registered and emerging agricultural cooperatives and direct off-take consumer networks. We are <strong>strictly not an investment company, financial institution, or collective investment scheme (CIS)</strong>.
        </p>
        <p className="text-amber-900/90 text-[11px] sm:text-xs">
          Simulated projections, matrix commissions, and performance tiers shown on this platform are mathematical models for illustrative purposes grounded strictly in verified commodity crop sales, harvest surplus realizations, and active member Personal Qualifying Volume (PQV) — never guaranteed passive yield or fixed financial interest.
        </p>
      </div>
    </div>
  );
}
