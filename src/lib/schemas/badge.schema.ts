import { z } from "zod"

const uuidPattern = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/
const uuidField = z.string().regex(uuidPattern, "Invalid UUID")

export const BadgeTypeSchema = z.enum([
  "task_complete",
  "organizer_verified",
  "early_adopter",
  "movement_founder",
])
export type BadgeType = z.infer<typeof BadgeTypeSchema>

export const BadgeIssuedBySchema = z.enum(["peer_vote", "organizer_override"])
export type BadgeIssuedBy = z.infer<typeof BadgeIssuedBySchema>

export const BadgeSchema = z.object({
  id: uuidField,
  user_id: uuidField,
  claim_id: uuidField.nullable().optional(),
  badge_type: BadgeTypeSchema,
  badge_label: z.string().min(2).max(100),
  issued_by: BadgeIssuedBySchema,
  issued_by_user: uuidField.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  awarded_at: z.string().datetime(),
})
export type Badge = z.infer<typeof BadgeSchema>
