import { describe, it, expect } from "vitest"
import { formatDateTime, formatDateOnly } from "../date"

describe("Date Formatting Utility (Fixed UTC and en-US)", () => {
  it("formats ISO timestamps consistently in UTC", () => {
    const isoString = "2026-11-01T14:30:00.000Z"
    const formatted = formatDateTime(isoString)
    expect(formatted).toBe("Nov 1, 2026, 14:30 UTC")
  })

  it("formats date-only consistently in UTC", () => {
    const isoString = "2026-11-01T14:30:00.000Z"
    const formatted = formatDateOnly(isoString)
    expect(formatted).toBe("Nov 1, 2026")
  })

  it("handles null and undefined gracefully", () => {
    expect(formatDateTime(null)).toBe("Pending")
    expect(formatDateTime(undefined)).toBe("Pending")
    expect(formatDateOnly(null)).toBe("Pending")
  })

  it("handles invalid date strings gracefully", () => {
    expect(formatDateTime("invalid-date-string")).toBe("Invalid date")
    expect(formatDateOnly("invalid-date-string")).toBe("Invalid date")
  })
})
