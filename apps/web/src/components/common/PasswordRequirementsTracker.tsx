import React from "react";
import { Check, Circle } from "lucide-react";

export interface PasswordRequirementsTrackerProps {
  password: string;
  className?: string;
}

export const checkPasswordRequirements = (password: string) => {
  const hasLength = (password || "").length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password || "");
  const hasNumber = /[0-9]/.test(password || "");

  const score = (hasLength ? 1 : 0) + (hasLetter ? 1 : 0) + (hasNumber ? 1 : 0);
  const isValid = hasLength && hasLetter && hasNumber;

  return {
    hasLength,
    hasLetter,
    hasNumber,
    score,
    isValid,
  };
};

export const PasswordRequirementsTracker: React.FC<PasswordRequirementsTrackerProps> = ({
  password,
  className = "",
}) => {
  const { hasLength, hasLetter, hasNumber, score } = checkPasswordRequirements(password);
  const isStarted = (password || "").length > 0;

  const strengthColor =
    score === 1
      ? "bg-rose-500"
      : score === 2
      ? "bg-amber-500"
      : score === 3
      ? "bg-emerald-600"
      : "bg-gray-200";

  const strengthLabel =
    !isStarted
      ? ""
      : score === 1
      ? "Weak"
      : score === 2
      ? "Almost there"
      : "Strong password";

  return (
    <div className={`space-y-2 pt-1 ${className}`}>
      {/* Strength Bar */}
      {isStarted && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-medium">Password Strength:</span>
            <span
              className={`font-semibold ${
                score === 1
                  ? "text-rose-600"
                  : score === 2
                  ? "text-amber-600"
                  : "text-emerald-700"
              }`}
            >
              {strengthLabel}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
            <div
              className={`rounded-full transition-all duration-300 ${
                score >= 1 ? strengthColor : "bg-gray-200"
              }`}
            />
            <div
              className={`rounded-full transition-all duration-300 ${
                score >= 2 ? strengthColor : "bg-gray-200"
              }`}
            />
            <div
              className={`rounded-full transition-all duration-300 ${
                score >= 3 ? strengthColor : "bg-gray-200"
              }`}
            />
          </div>
        </div>
      )}

      {/* Real-time Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
        <div
          className={`flex items-center gap-1.5 transition-colors ${
            hasLength
              ? "text-emerald-700 font-semibold"
              : isStarted
              ? "text-gray-600"
              : "text-gray-400"
          }`}
        >
          {hasLength ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
          <span>At least 8 characters</span>
        </div>

        <div
          className={`flex items-center gap-1.5 transition-colors ${
            hasLetter
              ? "text-emerald-700 font-semibold"
              : isStarted
              ? "text-gray-600"
              : "text-gray-400"
          }`}
        >
          {hasLetter ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
          <span>Letters (a-z)</span>
        </div>

        <div
          className={`flex items-center gap-1.5 transition-colors ${
            hasNumber
              ? "text-emerald-700 font-semibold"
              : isStarted
              ? "text-gray-600"
              : "text-gray-400"
          }`}
        >
          {hasNumber ? (
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
          <span>Numbers (0-9)</span>
        </div>
      </div>
    </div>
  );
};
