/**
 * Contrast Ratio Calculator (WCAG 2.1)
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L is relative luminance.
 */

function hexToRgb(hex) {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return [r, g, b]
}

function sRgbToLinear(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b)
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return ((lighter + 0.05) / (darker + 0.05))
}

const colors = {
  ink: "#060814",
  ivory: "#F6F0E4",
  white: "#FFFFFF",
  cobalt: "#255DEE",
  cobaltSoft: "#7C9BFF",
  lime: "#D4FF24",
  tomato: "#FF4D2E",
  sun: "#FFB81C",
  lavender: "#C9B6FF",
}

const tests = [
  // Night Theme (Base: Ink #060814)
  { theme: "Night", element: "Body text (ivory on ink)", fg: colors.ivory, bg: colors.ink, req: "4.5:1", type: "body" },
  { theme: "Night", element: "Muted text (lavender on ink)", fg: colors.lavender, bg: colors.ink, req: "4.5:1", type: "body" },
  { theme: "Night", element: "Soft links (cobaltSoft on ink)", fg: colors.cobaltSoft, bg: colors.ink, req: "4.5:1", type: "body" },
  { theme: "Night", element: "Primary action button (ink on lime)", fg: colors.ink, bg: colors.lime, req: "4.5:1", type: "body" },
  { theme: "Night", element: "Cobalt banner text (white on cobalt)", fg: colors.white, bg: colors.cobalt, req: "4.5:1", type: "body" },
  { theme: "Night", element: "Tomato alert text (ink on tomato)", fg: colors.ink, bg: colors.tomato, req: "4.5:1", type: "body" },
  { theme: "Night", element: "Sun warning text (ink on sun)", fg: colors.ink, bg: colors.sun, req: "4.5:1", type: "body" },
  { theme: "Night", element: "Lavender tag text (ink on lavender)", fg: colors.ink, bg: colors.lavender, req: "4.5:1", type: "body" },
  { theme: "Night", element: "UI border boundary (white on ink)", fg: colors.white, bg: colors.ink, req: "3:1", type: "ui" },

  // Day Theme (Base: Ivory #F6F0E4)
  { theme: "Day", element: "Body text (ink on ivory)", fg: colors.ink, bg: colors.ivory, req: "4.5:1", type: "body" },
  { theme: "Day", element: "Cobalt block text (white on cobalt)", fg: colors.white, bg: colors.cobalt, req: "4.5:1", type: "body" },
  { theme: "Day", element: "Action button (ink on lime with border)", fg: colors.ink, bg: colors.lime, req: "4.5:1", type: "body" },
  { theme: "Day", element: "Tomato badge text (ink on tomato)", fg: colors.ink, bg: colors.tomato, req: "4.5:1", type: "body" },
  { theme: "Day", element: "Sun badge text (ink on sun)", fg: colors.ink, bg: colors.sun, req: "4.5:1", type: "body" },
  { theme: "Day", element: "Lavender block text (ink on lavender)", fg: colors.ink, bg: colors.lavender, req: "4.5:1", type: "body" },
  { theme: "Day", element: "Links / Secondary text (cobalt on ivory)", fg: colors.cobalt, bg: colors.ivory, req: "4.5:1", type: "body" },
  { theme: "Day", element: "UI border boundary (ink on ivory)", fg: colors.ink, bg: colors.ivory, req: "3:1", type: "ui" },
]

console.log("\n=======================================================")
console.log("          COBALT POP WCAG CONTRAST AUDIT               ")
console.log("=======================================================\n")

let allPassed = true
const results = tests.map((t) => {
  const ratio = getContrast(t.fg, t.bg)
  const reqNum = parseFloat(t.req)
  const pass = ratio >= reqNum
  if (!pass) allPassed = false
  return {
    Theme: t.theme,
    Element: t.element,
    Foreground: t.fg,
    Background: t.bg,
    "Ratio": ratio.toFixed(2) + ":1",
    "Required": t.req,
    "Status": pass ? "PASS" : "FAIL",
  }
})

console.table(results)

if (allPassed) {
  console.log(" All contrast pairs PASS WCAG 2.1 AA requirements!\n")
} else {
  console.error(" Some contrast pairs FAILED. Adjusting values required.\n")
  process.exit(1)
}
