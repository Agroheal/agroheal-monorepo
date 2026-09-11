import React from "react";
import { Leaf } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  fullScreen = false,
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizeMap = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 select-none ${className}`}>
      {/* Outer spinning ring with center pulse icon */}
      <div className="relative flex items-center justify-center">
        <div
          className={`${sizeMap[size]} rounded-full border-3 border-emerald-600/20 border-t-emerald-600 border-r-emerald-500 animate-spin`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shadow-xs">
            <Leaf className={`${iconSizeMap[size]} text-emerald-700 animate-pulse`} />
          </div>
        </div>
      </div>

      {message && (
        <p className="text-xs sm:text-sm font-medium text-emerald-950/80 animate-pulse tracking-wide">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[45vh] w-full flex items-center justify-center">
      {content}
    </div>
  );
};

export default LoadingSpinner;
