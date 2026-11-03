import { z } from "zod"
import { uuidField } from "./common"

export const MovementSchema = z.object({
  id: uuidField,
  name: z.string().min(3).max(100),
  description: z.string().nullable().optional(),
  slug: z.string().min(3).max(100),
  invite_code: z.string().length(5).optional(),
  is_active: z.boolean(),
  created_by: uuidField,
  settings: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
})

export type Movement = z.infer<typeof MovementSchema>
