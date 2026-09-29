import { Link } from "react-router-dom";

interface RegulatoryNoticeProps {
  className?: string;
  linkHref?: string;
}

export default function RegulatoryNotice({
  className = "",
  linkHref = "/dashboard/legal#terms",
}: RegulatoryNoticeProps) {
  const isExternal = linkHref.startsWith("http");

  return (
    <footer
      className={`border-t border-gray-200/60 pt-3 pb-2 text-[10px] sm:text-[10.5px] lg:text-[11px] text-gray-500 text-center leading-tight max-w-7xl mx-auto px-4 ${className}`}
    >
      <p className="inline lg:block lg:whitespace-nowrap">
        <span className="font-semibold text-gray-600">
          Regulatory Compliance Notice — We Are Not An Investment Platform:
        </span>{" "}
        AgroHeal is strictly an agricultural technology &amp; community enablement enterprise, not a collective investment scheme. Projections are illustrative models based on verified commodity sales, never guaranteed passive yield.{" "}
        {isExternal ? (
          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 inline-block whitespace-nowrap ml-1"
          >
            Read Full Legal Disclosure
          </a>
        ) : (
          <Link
            to={linkHref}
            className="font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 inline-block whitespace-nowrap ml-1"
          >
            Read Full Legal Disclosure
          </Link>
        )}
      </p>
    </footer>
  );
}
