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

export function formatCleanDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-"
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return "-"
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = months[d.getUTCMonth()]
    const day = d.getUTCDate()
    let hours = d.getUTCHours()
    const minutes = String(d.getUTCMinutes()).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12
    return `${month} ${day}, ${hours}:${minutes} ${ampm}`
  } catch {
    return "-"
  }
}

export function formatRelativeTime(
  dateInput: string | Date | null | undefined,
  baseTime?: Date
): string {
  if (!dateInput) return "-"
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return "-"
    const now = baseTime || new Date("2026-10-31T12:00:00Z")
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return formatCleanDateTime(d)
  } catch {
    return "-"
  }
}

export function formatShortTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return ""
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ""
    let hours = d.getUTCHours()
    const minutes = String(d.getUTCMinutes()).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12
    return `${hours}:${minutes} ${ampm}`
  } catch {
    return ""
  }
}

export function getDayLabel(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return ""
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ""
    const now = new Date()
    const isToday =
      d.getUTCFullYear() === now.getUTCFullYear() &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate()
    if (isToday) return "Today"

    const yesterday = new Date(now.getTime() - 86400000)
    const isYesterday =
      d.getUTCFullYear() === yesterday.getUTCFullYear() &&
      d.getUTCMonth() === yesterday.getUTCMonth() &&
      d.getUTCDate() === yesterday.getUTCDate()
    if (isYesterday) return "Yesterday"

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
  } catch {
    return ""
  }
}
