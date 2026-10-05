import React, { useEffect, useState } from "react";
import { Clock, ShieldAlert, Sparkles } from "lucide-react";
import { COUNTDOWN_TARGET_TIMESTAMP_MS, CUTOVER_TIMESTAMP_MS } from "@shared/cutover";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isPostCutover: boolean;
}

function calculateTimeLeft(): TimeLeft {
  const now = Date.now();
  const diff = COUNTDOWN_TARGET_TIMESTAMP_MS - now;
  const isPostCutover = now >= CUTOVER_TIMESTAMP_MS;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      isPostCutover,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    isPostCutover,
  };
}

interface CutoverCountdownBannerProps {
  variant?: "full" | "compact";
  className?: string;
}

export const CutoverCountdownBanner: React.FC<CutoverCountdownBannerProps> = ({
  variant = "full",
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isPostCutover) {
    return null; // System has already transitioned
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 ${className}`}
      >
        <div className="flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
          <span>Notice: Current ₦12,000 package switches to ₦15,000 standard on Wednesday, Oct 7 at 9:00 AM WAT.</span>
        </div>
        {!timeLeft.isExpired ? (
          <div className="flex items-center gap-1.5 font-mono text-amber-300">
            <span className="rounded bg-black/40 px-1.5 py-0.5 font-bold">{timeLeft.days}d</span>:
            <span className="rounded bg-black/40 px-1.5 py-0.5 font-bold">
              {String(timeLeft.hours).padStart(2, "0")}h
            </span>:
            <span className="rounded bg-black/40 px-1.5 py-0.5 font-bold">
              {String(timeLeft.minutes).padStart(2, "0")}m
            </span>:
            <span className="rounded bg-black/40 px-1.5 py-0.5 font-bold text-amber-400">
              {String(timeLeft.seconds).padStart(2, "0")}s
            </span>
          </div>
        ) : (
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
            Finalizing Transition
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-amber-950/40 p-4 sm:p-5 shadow-xl backdrop-blur-md ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-400">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                System Transition Countdown
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="mt-0.5 text-sm font-medium text-slate-100">
              National Expansion & ₦15,000 Compensation Model Launch
            </p>
            <p className="text-xs text-slate-400">
              Takes effect Wednesday, Oct 7, 2026 at 9:00 AM WAT. Current ₦12,000 package entry is locked until target.
            </p>
          </div>
        </div>

        {!timeLeft.isExpired ? (
          <div className="flex items-center gap-2 self-start font-mono sm:self-center">
            <div className="flex flex-col items-center rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 min-w-[48px]">
              <span className="text-base font-bold text-white">{timeLeft.days}</span>
              <span className="text-[10px] uppercase text-slate-400">Days</span>
            </div>
            <span className="text-base font-bold text-slate-500">:</span>
            <div className="flex flex-col items-center rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 min-w-[48px]">
              <span className="text-base font-bold text-white">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase text-slate-400">Hours</span>
            </div>
            <span className="text-base font-bold text-slate-500">:</span>
            <div className="flex flex-col items-center rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 min-w-[48px]">
              <span className="text-base font-bold text-white">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase text-slate-400">Mins</span>
            </div>
            <span className="text-base font-bold text-slate-500">:</span>
            <div className="flex flex-col items-center rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1.5 min-w-[48px]">
              <span className="text-base font-bold text-emerald-400">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase text-emerald-400/80">Secs</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
            <Sparkles className="h-4 w-4" /> Final System Transition in Progress
          </div>
        )}
      </div>
    </div>
  );
};
