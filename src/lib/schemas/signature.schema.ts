import { z } from "zod"

export const AnnouncementSignatureSchema = z.object({
  id: z.string().uuid(),
  announcement_id: z.string().uuid(),
  signed_by: z.string().uuid(),
  signed_at: z.string().datetime(),
})

export type AnnouncementSignature = z.infer<typeof AnnouncementSignatureSchema>

export const SignAnnouncementSchema = z.object({
  announcement_id: z.string().uuid(),
})

export type SignAnnouncementInput = z.infer<typeof SignAnnouncementSchema>
