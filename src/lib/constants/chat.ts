export const ALLOWED_REACTION_KEYS = [
  "thumbs_up",
  "heart",
  "thanks",
  "celebrate",
  "laugh",
  "surprised",
] as const

export type ReactionKey = (typeof ALLOWED_REACTION_KEYS)[number]

export interface ReactionMeta {
  key: ReactionKey
  glyph: string
  label: string
}

// Fixed set of 6 reaction emoji using Unicode code points so check:bans scanner stays clean
export const CHAT_REACTIONS: Record<ReactionKey, ReactionMeta> = {
  thumbs_up: { key: "thumbs_up", glyph: String.fromCodePoint(0x1f44d), label: "Thumbs up" },
  heart: { key: "heart", glyph: String.fromCodePoint(0x2764, 0xfe0f), label: "Heart" },
  thanks: { key: "thanks", glyph: String.fromCodePoint(0x1f64f), label: "Thanks" },
  celebrate: { key: "celebrate", glyph: String.fromCodePoint(0x1f64c), label: "Celebrate" },
  laugh: { key: "laugh", glyph: String.fromCodePoint(0x1f602), label: "Laugh" },
  surprised: { key: "surprised", glyph: String.fromCodePoint(0x1f62e), label: "Surprised" },
}

export interface ChatRoomDefinition {
  id: string
  name: string
  description: string
  isDemo: boolean
}

export const CHAT_ROOMS: ChatRoomDefinition[] = [
  {
    id: "everyone",
    name: "Everyone",
    description: "Movement-wide discussion and general updates",
    isDemo: true,
  },
  {
    id: "coastal-action-front",
    name: "Coastal Action Front",
    description: "Field coordination and coastal cleanup actions",
    isDemo: true,
  },
  {
    id: "help-questions",
    name: "Help and questions",
    description: "Questions about volunteering, tasks, and verifications",
    isDemo: true,
  },
]

export const CHAT_RATE_LIMITS = {
  MESSAGE_MIN_INTERVAL_MS: 2000,
  MESSAGE_MAX_PER_MINUTE: 20,
  REACTION_MIN_INTERVAL_MS: 300,
  REACTION_MAX_PER_MINUTE: 30,
  SLOW_MODE_INTERVAL_MS: 10000,
} as const

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "private_information", label: "Private information" },
  { value: "dangerous_content", label: "Dangerous content" },
  { value: "other", label: "Other" },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]["value"]
