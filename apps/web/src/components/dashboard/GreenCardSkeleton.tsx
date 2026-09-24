import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GreenCardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 animate-pulse font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* ── DIGITAL GREEN CARD ID-1 RATIO SKELETON ── */}
        <div className="flex justify-center py-4">
          <div className="w-full max-w-md aspect-[1.586/1] rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-900 border-2 border-emerald-500/40 p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            {/* Top row */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <Skeleton className="h-6 w-32 rounded-md bg-white/20" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/20" />
            </div>

            {/* Middle body */}
            <div className="flex items-center gap-5 my-auto">
              <Skeleton className="w-20 h-24 rounded-xl bg-white/15 shrink-0" />
              <div className="space-y-2.5 flex-1">
                <Skeleton className="h-5 w-40 rounded-md bg-white/25" />
                <Skeleton className="h-4 w-28 rounded-md bg-white/15" />
                <Skeleton className="h-6 w-32 rounded-md bg-white/20" />
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <Skeleton className="h-4 w-24 rounded-md bg-white/15" />
              <Skeleton className="w-10 h-10 rounded-lg bg-white/20" />
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS SKELETON ── */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto">
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
