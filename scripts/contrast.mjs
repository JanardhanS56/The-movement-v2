// WCAG 2.2 Relative Luminance and Contrast Ratio Calculator

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '')
  const bigint = parseInt(cleanHex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return [r, g, b]
}

function channelLuminance(channel) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance([r, g, b]) {
  const rl = channelLuminance(r)
  const gl = channelLuminance(g)
  const bl = channelLuminance(b)
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

function contrastRatio(hex1, hex2) {
  const lum1 = relativeLuminance(hexToRgb(hex1))
  const lum2 = relativeLuminance(hexToRgb(hex2))
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

const PALETTE = {
  // Dominant dark blue-tinted surfaces
  surfaceBase: '#0b0f17',       // Near-black blue-tinted surface (base)
  surfaceRaised: '#131b2e',     // Card surface
  surfaceOverlay: '#1e293b',    // Popover / dialog surface
  surfaceBorder: '#64748b',     // UI boundaries & active borders (passes 3.5+:1 against dark surfaces)

  // Tinted neutrals
  foreground: '#f8fafc',        // Primary text (slate-50)
  mutedForeground: '#94a3b8',   // Secondary / muted text (slate-400)
  subtleForeground: '#cbd5e1',  // Subtle text (slate-300)

  // Primary / Supporting (Electric Blue)
  primary: '#1d4ed8',           // Deep electric blue button bg (passes 6.70:1 against #ffffff)
  primaryForeground: '#ffffff', // Button text
  primaryTextOnDark: '#60a5fa', // Electric blue text/icons on dark surfaces (passes 7.54:1 against #0b0f17)

  // Accent (Coral - used sparingly)
  accent: '#fb7185',            // Vibrant coral (passes 7.13:1 against #0b0f17)
  accentMuted: '#be123c',       // Deeper coral for badge backgrounds
  accentForeground: '#ffffff',

  // Status tokens
  verifiedGreen: '#34d399',     // Verified green (emerald-400, passes 9.98:1 against #0b0f17)
  verifiedBg: '#064e3b',        // Dark green badge background
  cautionAmber: '#fbbf24',      // Caution amber (amber-400, passes 11.49:1 against #0b0f17)
  cautionBg: '#78350f',         // Dark amber badge background
  destructive: '#f87171',       // Alert red (red-400, passes 6.93:1 against #0b0f17)
  destructiveForeground: '#ffffff',
}

const PAIRS_TO_CHECK = [
  { label: 'Body Text on Base Surface', fg: PALETTE.foreground, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'Body Text on Raised Card', fg: PALETTE.foreground, bg: PALETTE.surfaceRaised, min: 4.5, type: 'Body (AA)' },
  { label: 'Muted Text on Base Surface', fg: PALETTE.mutedForeground, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'Muted Text on Raised Card', fg: PALETTE.mutedForeground, bg: PALETTE.surfaceRaised, min: 4.5, type: 'Body (AA)' },
  { label: 'Subtle Text on Base Surface', fg: PALETTE.subtleForeground, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'Primary Button Text on Primary', fg: PALETTE.primaryForeground, bg: PALETTE.primary, min: 4.5, type: 'Body (AA)' },
  { label: 'Electric Blue Text on Base', fg: PALETTE.primaryTextOnDark, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'Coral Accent on Base Surface', fg: PALETTE.accent, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'Verified Green on Base Surface', fg: PALETTE.verifiedGreen, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'Caution Amber on Base Surface', fg: PALETTE.cautionAmber, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'Destructive Red on Base Surface', fg: PALETTE.destructive, bg: PALETTE.surfaceBase, min: 4.5, type: 'Body (AA)' },
  { label: 'UI Border vs Base Surface', fg: PALETTE.surfaceBorder, bg: PALETTE.surfaceBase, min: 3.0, type: 'UI Boundary' },
  { label: 'UI Border vs Raised Card', fg: PALETTE.surfaceBorder, bg: PALETTE.surfaceRaised, min: 3.0, type: 'UI Boundary' },
]

console.log('='.repeat(80))
console.log('THE MOVEMENT - WCAG 2.2 AA CONTRAST RATIO VERIFICATION')
console.log('='.repeat(80))
console.log(
  'Label'.padEnd(36) +
  'FG Hex'.padEnd(10) +
  'BG Hex'.padEnd(10) +
  'Ratio'.padEnd(10) +
  'Req.'.padEnd(8) +
  'Result'
)
console.log('-'.repeat(80))

let allPass = true

for (const pair of PAIRS_TO_CHECK) {
  const ratio = contrastRatio(pair.fg, pair.bg)
  const passed = ratio >= pair.min
  if (!passed) allPass = false

  console.log(
    pair.label.padEnd(36) +
    pair.fg.padEnd(10) +
    pair.bg.padEnd(10) +
    `${ratio.toFixed(2)}:1`.padEnd(10) +
    `${pair.min}:1`.padEnd(8) +
    (passed ? 'PASS (AA)' : 'FAIL')
  )
}

console.log('='.repeat(80))
if (allPass) {
  console.log('ALL COLOR PAIRS PASS WCAG 2.2 AA REQUIREMENTS.')
} else {
  console.error('ONE OR MORE COLOR PAIRS FAILED WCAG 2.2 AA REQUIREMENTS.')
  process.exit(1)
}
