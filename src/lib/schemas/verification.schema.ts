import { z } from "zod"
import { uuidField, isoDateTime } from "./common"

export const VerificationVoteTypeSchema = z.enum(["approve", "reject"])
export type VerificationVoteType = z.infer<typeof VerificationVoteTypeSchema>

export const PeerVerificationSchema = z.object({
  id: uuidField,
  claim_id: uuidField,
  verifier_id: uuidField,
  vote: VerificationVoteTypeSchema.nullable(),
  voted_at: isoDateTime.nullable().optional(),
  assigned_at: isoDateTime,
  expires_at: isoDateTime,
})
export type PeerVerification = z.infer<typeof PeerVerificationSchema>

export const SubmitVerificationVoteSchema = z.object({
  claim_id: uuidField,
  vote: VerificationVoteTypeSchema,
})
export type SubmitVerificationVoteInput = z.infer<typeof SubmitVerificationVoteSchema>

export const OrganizerOverrideSchema = z.object({
  claim_id: uuidField,
  approve: z.boolean(),
  note: z.string().max(500).optional(),
})
export type OrganizerOverrideInput = z.infer<typeof OrganizerOverrideSchema>
