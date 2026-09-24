import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* ── HEADER BANNER ── */}
      <div className="bg-green-800 px-4 md:px-8 pt-8 pb-16">
        <div className="max-w-[96%] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 sm:w-72 bg-white/20 rounded-xl" />
            <Skeleton className="h-4 w-40 sm:w-52 bg-white/10 rounded-md" />
          </div>

          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-32 rounded-xl bg-white/15" />
            <Skeleton className="h-9 w-36 rounded-xl bg-white/15" />
          </div>
        </div>
      </div>

      {/* ── MAIN DASHBOARD CONTENT ── */}
      <div className="px-4 md:px-8 -mt-8 pb-12 max-w-[96%] mx-auto space-y-6">
        {/* Journey Progression Card Skeleton */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>

          {/* Stepper Dots Placeholder */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Stats Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between h-40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="w-9 h-9 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Referral Sharing Box Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2 w-full md:w-auto">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Skeleton className="h-10 w-44 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>

        {/* Recent Payment History Table Skeleton */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
