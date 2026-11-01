import { z } from "zod"

export const VerificationVoteTypeSchema = z.enum(["approve", "reject"])
export type VerificationVoteType = z.infer<typeof VerificationVoteTypeSchema>

export const PeerVerificationSchema = z.object({
  id: z.string().uuid(),
  claim_id: z.string().uuid(),
  verifier_id: z.string().uuid(),
  vote: VerificationVoteTypeSchema.nullable(),
  voted_at: z.string().datetime().nullable().optional(),
  assigned_at: z.string().datetime(),
  expires_at: z.string().datetime(),
})
export type PeerVerification = z.infer<typeof PeerVerificationSchema>

export const SubmitVerificationVoteSchema = z.object({
  claim_id: z.string().uuid(),
  vote: VerificationVoteTypeSchema,
})
export type SubmitVerificationVoteInput = z.infer<typeof SubmitVerificationVoteSchema>

export const OrganizerOverrideSchema = z.object({
  claim_id: z.string().uuid(),
  approve: z.boolean(),
  note: z.string().max(500).optional(),
})
export type OrganizerOverrideInput = z.infer<typeof OrganizerOverrideSchema>
