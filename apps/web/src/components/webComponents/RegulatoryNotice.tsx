import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

interface RegulatoryNoticeProps {
  className?: string;
  linkHref?: string;
}

export default function RegulatoryNotice({
  className = "",
  linkHref = "/dashboard/legal#terms",
}: RegulatoryNoticeProps) {
  return (
    <footer
      className={`border-t border-gray-200/70 pt-3 pb-1 text-[11px] text-gray-500 text-center leading-normal flex items-center justify-center gap-1.5 flex-wrap ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0 inline-block" />
      <span>
        <strong>Regulatory Compliance Notice — We Are Not An Investment Platform:</strong> AgroHeal is strictly an agricultural technology &amp; community enablement enterprise, not a collective investment scheme. Projections are illustrative models based on verified commodity sales, never guaranteed passive yield.
      </span>
      <Link
        to={linkHref}
        className="font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 ml-1"
      >
        Read Full Legal Disclosure
      </Link>
    </footer>
  );
}
