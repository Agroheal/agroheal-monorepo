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
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-50 via-amber-100/90 to-amber-50 dark:from-amber-950/80 dark:via-amber-900/60 dark:to-slate-900 px-4 py-3 text-xs shadow-md ${className}`}
      >
        <div className="flex items-center gap-2.5 font-bold text-amber-950 dark:text-amber-100 min-w-0 flex-1">
          <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 animate-pulse" />
          <span className="truncate sm:whitespace-normal">
            <strong className="text-amber-900 dark:text-amber-300 uppercase tracking-wide mr-1 font-black">
              ⚠️ Final Price Lock:
            </strong>
            The complete ₦12,000 Starter Package increases permanently to ₦15,000 on Friday, Oct 9 at 11:59 PM WAT. Lock your ₦3,000 savings before time expires!
          </span>
        </div>
        {!timeLeft.isExpired ? (
          <div className="flex items-center gap-1.5 font-mono shrink-0">
            <span className="rounded-lg bg-amber-950 dark:bg-black/90 text-amber-100 dark:text-amber-300 px-2 py-1 font-black shadow-xs">
              {timeLeft.days}d
            </span>
            <span className="font-bold text-amber-900 dark:text-amber-400">:</span>
            <span className="rounded-lg bg-amber-950 dark:bg-black/90 text-amber-100 dark:text-amber-300 px-2 py-1 font-black shadow-xs">
              {String(timeLeft.hours).padStart(2, "0")}h
            </span>
            <span className="font-bold text-amber-900 dark:text-amber-400">:</span>
            <span className="rounded-lg bg-amber-950 dark:bg-black/90 text-amber-100 dark:text-amber-300 px-2 py-1 font-black shadow-xs">
              {String(timeLeft.minutes).padStart(2, "0")}m
            </span>
            <span className="font-bold text-amber-900 dark:text-amber-400">:</span>
            <span className="rounded-lg bg-amber-600 text-white px-2 py-1 font-black shadow-xs animate-pulse">
              {String(timeLeft.seconds).padStart(2, "0")}s
            </span>
          </div>
        ) : (
          <span className="rounded-xl bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
            Finalizing Transition
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-[#061e12] via-[#0b2b1b] to-[#241a05] p-4 sm:p-5 shadow-2xl text-white ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-inner">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                ⚠️ Final Price Lock Notice
              </span>
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <h3 className="mt-1 text-base sm:text-lg font-black text-white tracking-tight leading-snug">
              Lock In Your ₦12,000 Starter Package Before the Mandatory ₦15,000 Standard Switch!
            </h3>
            <p className="mt-1 text-xs sm:text-[13px] text-emerald-100/90 font-medium leading-relaxed max-w-2xl">
              Takes effect <strong className="text-amber-300 font-bold">Friday, Oct 9, 2026 at 11:59 PM WAT</strong>. Secure your lifetime Green Card, 1st farm slot, and Mushroom Power product at the founder rate now to lock your ₦3,000 discount before package entry increases permanently to ₦15,000.
            </p>
          </div>
        </div>

        {!timeLeft.isExpired ? (
          <div className="flex items-center gap-2 self-start font-mono sm:self-center shrink-0">
            <div className="flex flex-col items-center rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 min-w-[52px] shadow-md">
              <span className="text-lg font-black text-white">{timeLeft.days}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-300">Days</span>
            </div>
            <span className="text-lg font-bold text-amber-400">:</span>
            <div className="flex flex-col items-center rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 min-w-[52px] shadow-md">
              <span className="text-lg font-black text-white">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-300">Hours</span>
            </div>
            <span className="text-lg font-bold text-amber-400">:</span>
            <div className="flex flex-col items-center rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 min-w-[52px] shadow-md">
              <span className="text-lg font-black text-white">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-300">Mins</span>
            </div>
            <span className="text-lg font-bold text-amber-400">:</span>
            <div className="flex flex-col items-center rounded-xl border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 min-w-[52px] shadow-md">
              <span className="text-lg font-black text-amber-300 animate-pulse">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-300">Secs</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-amber-400 bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md">
            <Sparkles className="h-4 w-4" /> Final System Transition in Progress
          </div>
        )}
      </div>
    </div>
  );
};
