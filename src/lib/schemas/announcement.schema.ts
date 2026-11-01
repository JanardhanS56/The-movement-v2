import { z } from "zod"
import { uuidField, isoDateTime } from "./common"

export const AnnouncementSchema = z.object({
  id: uuidField,
  movement_id: uuidField,
  created_by: uuidField,
  title: z.string().min(5).max(200),
  body: z.string().min(10),
  required_signatures: z.number().int().min(1).max(10),
  is_published: z.boolean(),
  published_at: isoDateTime.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: isoDateTime,
  updated_at: isoDateTime.nullable().optional(),
})

export type Announcement = z.infer<typeof AnnouncementSchema>

export const CreateAnnouncementSchema = z.object({
  movement_id: uuidField,
  title: z.string().min(5).max(200),
  body: z.string().min(10),
  required_signatures: z.number().int().min(1).max(10).default(2),
})

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>
