import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8 pb-16 font-sans animate-pulse">
      {/* ── HEADER BANNER SKELETON ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 sm:w-64 rounded-xl bg-white/25" />
              <Skeleton className="h-4 w-36 sm:w-44 rounded-md bg-white/15" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 w-28 rounded-full bg-white/20" />
                <Skeleton className="h-5 w-24 rounded-full bg-white/15" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-36 rounded-xl bg-white/20" />
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN FORM CARDS SKELETON ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="space-y-1.5 pb-2 border-b border-gray-100">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-56 rounded-md" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>

          <Skeleton className="h-11 w-full rounded-xl mt-4" />
        </div>

        {/* Banking & Payout Destination Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="space-y-1.5 pb-2 border-b border-gray-100">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded-md" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>

          <Skeleton className="h-11 w-full rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}
