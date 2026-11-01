import { z } from "zod"
import { uuidField } from "./common"

export const AnnouncementSignatureSchema = z.object({
  id: uuidField,
  announcement_id: uuidField,
  signed_by: uuidField,
  signed_at: z.string().datetime(),
})

export type AnnouncementSignature = z.infer<typeof AnnouncementSignatureSchema>

export const SignAnnouncementSchema = z.object({
  announcement_id: uuidField,
})

export type SignAnnouncementInput = z.infer<typeof SignAnnouncementSchema>
