import { z } from "zod"

const uuidPattern = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/
const uuidField = z.string().regex(uuidPattern, "Invalid UUID")

export const ImpactLedgerVerificationMethodSchema = z.enum(["peer_vote", "organizer_override"])
export type ImpactLedgerVerificationMethod = z.infer<typeof ImpactLedgerVerificationMethodSchema>

export const ImpactLedgerEntrySchema = z.object({
  id: uuidField,
  user_id: uuidField,
  task_id: uuidField.optional(),
  task_title: z.string().min(1),
  verification_method: ImpactLedgerVerificationMethodSchema,
  verified_by_detail: z.string().min(1),
  reward_points: z.number().int().min(0),
  verified_at: z.string().datetime(),
})
export type ImpactLedgerEntry = z.infer<typeof ImpactLedgerEntrySchema>
