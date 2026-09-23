import { useRef, useState, type ReactNode } from "react";
import { Download, Share2, ShieldCheck, Sparkles, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GreenCardImageProps {
  memberName?: string;
  memberId?: string;
  memberSince?: string;
  qrValue?: string;
  fileName?: string;
  qrRenderer?: (value: string, size: number) => ReactNode;
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 756; // Standard card aspect ratio (1.586:1)
const CORNER_RADIUS = 32;

export const GreenCardImage = ({
  memberName = "AgroHeal Member",
  memberId = "AGC-2026-00001",
  memberSince = "SEPTEMBER 2026",
  qrValue,
  fileName,
  qrRenderer,
}: GreenCardImageProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const resolvedQrValue = qrValue || `https://agroheal.org/verify-card/${encodeURIComponent(memberId)}`;

  const handleDownload = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    setDownloading(true);
    setDownloadError(false);

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to render card for download"));
        img.src = url;
      });

      // Render at 2x crisp retina resolution (2400 x 1512)
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = CARD_WIDTH * scale;
      canvas.height = CARD_HEIGHT * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) {
          setDownloadError(true);
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        const safeName = (fileName || memberId || "agroheal-greencard").replace(
          /[^a-z0-9-_]+/gi,
          "-"
        );
        link.download = `${safeName}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }, "image/png");
    } catch (err) {
      console.error("Failed to export Green Card PNG:", err);
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* ── LUXURY FLAT 2D CARD (HIGH FIDELITY SVG) ── */}
      <div className="w-full max-w-[580px] filter drop-shadow-2xl">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
          width="100%"
          height="auto"
          className="block w-full h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Deep Emerald Luxury Gradients */}
            <linearGradient id="cardBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#022013" />
              <stop offset="45%" stopColor="#064024" />
              <stop offset="75%" stopColor="#08381e" />
              <stop offset="100%" stopColor="#021a0d" />
            </linearGradient>

            <radialGradient id="radialGlow" cx="85%" cy="15%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="radialAmberGlow" cx="20%" cy="85%" r="55%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* Gold Gradients */}
            <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <linearGradient id="chipGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Security Guilloche Lattice */}
            <pattern id="secGuilloche" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 0,25 Q 12.5,0 25,25 T 50,25" fill="none" stroke="#fcd34d" strokeWidth="0.65" opacity="0.2" />
              <path d="M 0,25 Q 12.5,50 25,25 T 50,25" fill="none" stroke="#6ee7b7" strokeWidth="0.65" opacity="0.2" />
            </pattern>

            <clipPath id="cardCorners">
              <rect width={CARD_WIDTH} height={CARD_HEIGHT} rx={CORNER_RADIUS} />
            </clipPath>
          </defs>

          {/* Card Base */}
          <rect
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            rx={CORNER_RADIUS}
            fill="url(#cardBgGrad)"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeOpacity="0.4"
          />

          <g clipPath="url(#cardCorners)">
            {/* Ambient Overlays */}
            <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#radialGlow)" />
            <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#radialAmberGlow)" />
            <rect width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#secGuilloche)" />

            {/* Subtle Metallic Bevel */}
            <rect
              x="8"
              y="8"
              width={CARD_WIDTH - 16}
              height={CARD_HEIGHT - 16}
              rx={CORNER_RADIUS - 4}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.2"
              strokeOpacity="0.25"
            />

            {/* ── TOP HEADER ROW ── */}
            {/* AgroHeal Gold Holographic Crest */}
            <g transform="translate(64, 56)">
              <rect
                x="0"
                y="0"
                width="72"
                height="72"
                rx="18"
                fill="#022013"
                stroke="#fcd34d"
                strokeWidth="2"
              />
              <g transform="translate(18, 18)">
                <path
                  d="M 18,0 L 22,12 L 36,18 L 22,24 L 18,36 L 14,24 L 0,18 L 14,12 Z"
                  fill="#fde68a"
                />
                <circle cx="18" cy="18" r="3" fill="#ffffff" />
              </g>

              {/* Title Lockup */}
              <text
                x="92"
                y="34"
                fill="url(#goldTextGrad)"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="34"
                fontWeight="900"
                letterSpacing="4"
              >
                AGROHEAL
              </text>
              <text
                x="92"
                y="60"
                fill="#a7f3d0"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="16"
                fontWeight="600"
                letterSpacing="2"
              >
                LEAP COMMUNITY DIGITAL PASS
              </text>
            </g>

            {/* Top-Right Badge: GREEN CARD LEAP ALLIANCE */}
            <g transform="translate(940, 56)">
              <rect
                x="0"
                y="0"
                width="196"
                height="54"
                rx="12"
                fill="#022013"
                fillOpacity="0.6"
                stroke="#fcd34d"
                strokeWidth="1.5"
                strokeOpacity="0.6"
              />
              <text
                x="98"
                y="26"
                textAnchor="middle"
                fill="#fde68a"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="17"
                fontWeight="800"
                letterSpacing="2"
              >
                GREEN CARD
              </text>
              <text
                x="98"
                y="44"
                textAnchor="middle"
                fill="#6ee7b7"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="11"
                fontWeight="700"
                letterSpacing="1.5"
              >
                LEAP ALLIANCE
              </text>
            </g>

            {/* ── MIDDLE ROW: COMMUNITY SECURITY EMBLEM & VERIFIED BADGE ── */}
            {/* Official Community Security Crest */}
            <g transform="translate(64, 216)">
              <rect
                x="0"
                y="0"
                width="200"
                height="78"
                rx="16"
                fill="#022013"
                fillOpacity="0.8"
                stroke="#6ee7b7"
                strokeWidth="1.5"
                strokeOpacity="0.5"
              />
              <circle cx="42" cy="39" r="22" fill="#10b981" fillOpacity="0.25" stroke="#34d399" strokeWidth="1.5" />
              <path
                d="M 35,35 L 42,31 L 49,35 L 49,43 C 49,47 42,50 42,50 C 42,50 35,47 35,43 Z"
                fill="#34d399"
                fillOpacity="0.9"
              />
              <path d="M 39,41 L 41,43 L 46,38" fill="none" stroke="#022013" strokeWidth="1.8" strokeLinecap="round" />
              <text
                x="76"
                y="33"
                fill="#6ee7b7"
                fontFamily="monospace"
                fontSize="11"
                fontWeight="700"
                letterSpacing="2"
              >
                COMMUNITY
              </text>
              <text
                x="76"
                y="52"
                fill="#fde68a"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14"
                fontWeight="800"
                letterSpacing="1.2"
              >
                COMMUNITY DIGITAL PASS
              </text>
            </g>

            {/* Official Verified Secure Hologram */}
            <g transform="translate(284, 232)">
              <rect
                x="0"
                y="0"
                width="190"
                height="46"
                rx="14"
                fill="#ffffff"
                fillOpacity="0.08"
                stroke="#6ee7b7"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              <path
                d="M 22,14 L 32,10 L 42,14 L 42,24 C 42,30 32,36 32,36 C 32,36 22,30 22,24 Z"
                fill="#10b981"
                fillOpacity="0.8"
              />
              <path d="M 27,23 L 30,26 L 37,19" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <text
                x="56"
                y="28"
                fill="#ecfdf5"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="13"
                fontWeight="700"
                letterSpacing="1.5"
              >
                VERIFIED SECURE
              </text>
            </g>

            {/* ── RIGHT COLUMN: HIGH-RES QR CODE ── */}
            <g transform="translate(940, 180)">
              <rect
                x="0"
                y="0"
                width="196"
                height="220"
                rx="18"
                fill="#ffffff"
                stroke="#fcd34d"
                strokeWidth="2"
              />
              <g transform="translate(18, 18)">
                {qrRenderer ? (
                  qrRenderer(resolvedQrValue, 160)
                ) : (
                  <rect width="160" height="160" fill="#022013" />
                )}
              </g>
              <text
                x="98"
                y="204"
                textAnchor="middle"
                fill="#022013"
                fontFamily="monospace"
                fontSize="11"
                fontWeight="900"
                letterSpacing="1.5"
              >
                SCAN TO VERIFY
              </text>
            </g>

            {/* ── BOTTOM CREDENTIALS AREA ── */}
            {/* Member Credential ID */}
            <g transform="translate(64, 400)">
              <text
                x="0"
                y="0"
                fill="#a7f3d0"
                fontFamily="monospace"
                fontSize="15"
                fontWeight="700"
                letterSpacing="3"
              >
                MEMBER CREDENTIAL ID
              </text>
              <text
                x="0"
                y="52"
                fill="url(#goldTextGrad)"
                fontFamily="'Courier New', monospace"
                fontSize="48"
                fontWeight="900"
                letterSpacing="6"
              >
                {memberId}
              </text>
            </g>

            {/* Member Name & Since Details */}
            <g transform="translate(64, 535)">
              <line x1="0" y1="0" x2="800" y2="0" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />

              {/* Cardholder Name */}
              <text
                x="0"
                y="34"
                fill="#6ee7b7"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14"
                fontWeight="700"
                letterSpacing="2"
              >
                CARDHOLDER NAME
              </text>
              <text
                x="0"
                y="74"
                fill="#ffffff"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="30"
                fontWeight="800"
                letterSpacing="2"
              >
                {memberName.toUpperCase()}
              </text>

              {/* Member Since */}
              <text
                x="560"
                y="34"
                fill="#6ee7b7"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14"
                fontWeight="700"
                letterSpacing="2"
              >
                MEMBER SINCE
              </text>
              <text
                x="560"
                y="74"
                fill="#fde68a"
                fontFamily="monospace"
                fontSize="24"
                fontWeight="800"
                letterSpacing="2"
              >
                {memberSince.toUpperCase()}
              </text>
            </g>

            {/* Bottom Security Footer */}
            <g transform="translate(64, 690)">
              <line x1="0" y1="0" x2={CARD_WIDTH - 128} y2="0" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.1" />
              <text
                x="0"
                y="34"
                fill="#6ee7b7"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="14"
                opacity="0.8"
              >
                Official Verification: agroheal.org/verify-card/{memberId}
              </text>
              <text
                x={CARD_WIDTH - 128}
                y="34"
                textAnchor="end"
                fill="#fde68a"
                fontFamily="monospace"
                fontSize="14"
                fontWeight="700"
                opacity="0.8"
              >
                REF: {memberId}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* ── ACTION CONTROLS ── */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-[620px]">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 hover:from-emerald-500 hover:to-green-700 text-white font-semibold text-sm shadow-md flex items-center gap-2"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              Downloaded Successfully!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {downloading ? "Generating High-Res PNG..." : "Download Green Card (PNG)"}
            </>
          )}
        </Button>
      </div>

      {downloadError && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Could not prepare high-res image. Please try again.</span>
        </div>
      )}
    </div>
  );
};

export default GreenCardImage;
