import { z } from "zod"

export const MovementSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(100),
  description: z.string().nullable().optional(),
  slug: z.string().min(3).max(100),
  is_active: z.boolean(),
  created_by: z.string().uuid(),
  settings: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
})

export type Movement = z.infer<typeof MovementSchema>
