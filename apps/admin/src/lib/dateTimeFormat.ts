/**
 * Centralized Date & Time formatting for the AgroHeal Admin Portal
 * Defaults to West Africa Time (WAT, UTC+1 / Africa/Lagos)
 */

export function formatWATDateTime(
  dateInput: string | number | Date | null | undefined,
  options?: {
    includeSeconds?: boolean;
    dateOnly?: boolean;
    timeOnly?: boolean;
  }
): string {
  if (!dateInput) return "-";
  const date =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;

  if (isNaN(date.getTime())) return "-";

  const timeZone = "Africa/Lagos";

  if (options?.dateOnly) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  if (options?.timeOnly) {
    return `${new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: options.includeSeconds ? "2-digit" : undefined,
      hour12: true,
    }).format(date)} WAT`;
  }

  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: options?.includeSeconds ? "2-digit" : undefined,
    hour12: true,
  }).format(date);

  return `${datePart}, ${timePart} WAT`;
}

export function formatWATDate(dateInput: string | number | Date | null | undefined): string {
  return formatWATDateTime(dateInput, { dateOnly: true });
}
