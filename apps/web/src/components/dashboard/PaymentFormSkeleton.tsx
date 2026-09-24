import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentFormSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 animate-pulse font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Title skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-60 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* 2-Column layout */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
              </div>
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40 rounded-md" />
                      <Skeleton className="h-3 w-56 rounded-md" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-4">
              <Skeleton className="h-5 w-32 rounded-md" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Right card (Checkout Summary) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 space-y-4">
              <Skeleton className="h-6 w-40 rounded-md" />
              <div className="space-y-2.5 py-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
