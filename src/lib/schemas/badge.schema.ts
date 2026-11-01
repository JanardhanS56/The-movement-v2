import { z } from "zod"

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
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  claim_id: z.string().uuid().nullable().optional(),
  badge_type: BadgeTypeSchema,
  badge_label: z.string().min(2).max(100),
  issued_by: BadgeIssuedBySchema,
  issued_by_user: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  awarded_at: z.string().datetime(),
})
export type Badge = z.infer<typeof BadgeSchema>
