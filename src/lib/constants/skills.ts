export const AVAILABLE_SKILLS = [
  "Medical & First Aid",
  "Logistics & Transport",
  "Crowd Coordination",
  "Communications & Media",
  "Food & Water Distribution",
  "Legal Support",
  "Technical & IT",
  "Field Safety",
  "Language Translation",
] as const

export type Skill = (typeof AVAILABLE_SKILLS)[number]
