/**
 * Demo Clock
 * 
 * Returns a fixed reference moment plus the time elapsed since the app loaded.
 * All relative times in mock mode use it, ensuring seed data looks fresh and renders
 * identically on server and client without hydration mismatches.
 */

const DEMO_REFERENCE_TIME = new Date("2026-10-31T12:00:00Z").getTime()
const LOAD_TIMESTAMP = typeof performance !== "undefined" ? performance.now() : 0

export function demoNow(): Date {
  const elapsed = typeof performance !== "undefined" ? performance.now() - LOAD_TIMESTAMP : 0
  return new Date(DEMO_REFERENCE_TIME + elapsed)
}
