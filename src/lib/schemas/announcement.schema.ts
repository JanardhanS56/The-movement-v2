import { z } from "zod"

export const AnnouncementSchema = z.object({
  id: z.string().uuid(),
  movement_id: z.string().uuid(),
  created_by: z.string().uuid(),
  title: z.string().min(5).max(200),
  body: z.string().min(10),
  required_signatures: z.number().int().min(1).max(10),
  is_published: z.boolean(),
  published_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
})

export type Announcement = z.infer<typeof AnnouncementSchema>

export const CreateAnnouncementSchema = z.object({
  movement_id: z.string().uuid(),
  title: z.string().min(5).max(200),
  body: z.string().min(10),
  required_signatures: z.number().int().min(1).max(10).default(2),
})

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>
