/**
 * Deterministic date formatting with fixed locale ('en-US') and timezone ('UTC').
 * Guaranteed identical string output across SSR and browser to prevent hydration mismatches.
 */

const UTC_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const UTC_DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
})

/**
 * Formats an ISO date string or Date object to: 'MMM D, YYYY, HH:mm UTC'
 * Example: 'Nov 1, 2026, 14:30 UTC'
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Pending"
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return "Invalid date"
    return `${UTC_DATE_TIME_FORMATTER.format(d)} UTC`
  } catch {
    return "Invalid date"
  }
}

/**
 * Formats an ISO date string or Date object to: 'MMM D, YYYY'
 * Example: 'Nov 1, 2026'
 */
export function formatDateOnly(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Pending"
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return "Invalid date"
    return UTC_DATE_ONLY_FORMATTER.format(d)
  } catch {
    return "Invalid date"
  }
}
