import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganogramSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 pb-16 font-sans animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── HEADER BANNER SKELETON ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-44 rounded-full bg-white/20" />
                <Skeleton className="h-6 w-48 rounded-full bg-white/20" />
              </div>
              <Skeleton className="h-8 w-72 sm:w-96 rounded-xl bg-white/25" />
              <Skeleton className="h-4 w-full max-w-xl rounded-md bg-white/15" />
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-44 rounded-xl bg-white/20" />
              <Skeleton className="h-10 w-28 rounded-xl bg-white/20" />
            </div>
          </div>
        </div>

        {/* ── 4 STATS / QUALIFICATION CARDS SKELETON ── */}
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

        {/* ── TABS SKELETON ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* ── VISUAL MATRIX TREE SKELETON ── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-8 flex flex-col items-center justify-center min-h-[420px]">
          {/* Root Member Node Skeleton */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-48 sm:w-56 p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 flex flex-col items-center space-y-2 shadow-sm">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
            {/* Trunk Line */}
            <div className="w-0.5 h-8 bg-slate-300" />
            <div className="w-3/4 max-w-xl h-0.5 bg-slate-300" />
          </div>

          {/* 5 Frontline Slot Nodes Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 w-full max-w-3xl pt-2">
            {[1, 2, 3, 4, 5].map((slot) => (
              <div
                key={slot}
                className="flex flex-col items-center p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 shadow-2xs"
              >
                <div className="w-0.5 h-4 bg-slate-300 -mt-3.5 mb-1" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-3.5 w-16 rounded-md" />
                <Skeleton className="h-2.5 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
