import { z } from "zod"

export const ImpactLedgerVerificationMethodSchema = z.enum(["peer_vote", "organizer_override"])
export type ImpactLedgerVerificationMethod = z.infer<typeof ImpactLedgerVerificationMethodSchema>

export const ImpactLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  task_title: z.string().min(1),
  verification_method: ImpactLedgerVerificationMethodSchema,
  verified_by_detail: z.string().min(1),
  reward_points: z.number().int().min(0),
  verified_at: z.string().datetime(),
})
export type ImpactLedgerEntry = z.infer<typeof ImpactLedgerEntrySchema>
