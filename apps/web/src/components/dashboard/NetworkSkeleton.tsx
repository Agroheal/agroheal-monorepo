import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NetworkSkeleton({ title = "Network Engine" }: { title?: string }) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-16 font-sans animate-pulse">
      {/* ── HERO BANNER SKELETON ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-slate-950 text-white p-7 sm:p-10 shadow-xl border border-emerald-700/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-6 w-52 rounded-full bg-white/20" />
              <Skeleton className="h-6 w-40 rounded-full bg-white/20" />
            </div>
            <Skeleton className="h-9 w-72 sm:w-96 rounded-xl bg-white/25" />
            <Skeleton className="h-4 w-full max-w-lg rounded-md bg-white/15" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-36 rounded-xl bg-white/20" />
          </div>
        </div>
      </div>

      {/* ── 4 METRIC TILES SKELETON ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-3 h-36"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* ── TIERS / ENGINE TABLE SKELETON ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-48 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
