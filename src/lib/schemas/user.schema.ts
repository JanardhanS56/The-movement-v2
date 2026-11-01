import { z } from "zod"
import { uuidField } from "./common"

export const UserTierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export type UserTier = z.infer<typeof UserTierSchema>

export const UserSchema = z.object({
  id: uuidField,
  display_name: z.string().min(2).max(60),
  avatar_url: z.string().nullable().optional(),
  tier: UserTierSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
})

export type User = z.infer<typeof UserSchema>
