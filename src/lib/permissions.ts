import { UserTier } from "./schemas/user.schema"

/**
 * Announcement author automatically counts as signature 1 on creation.
 * Documented mock assumption, not product policy.
 */
export const AUTHOR_AUTO_SIGNS = true

/**
 * Verification default rules for peer consensus.
 * Documented mock assumption, not product policy.
 */
export const VERIFICATION_RULES = {
  requiredVerifiers: 3,
  approvalThreshold: 2,
  expiryHours: 24,
} as const

export interface ClaimPermissionInput {
  taskCreatedBy: string
  claimantId: string
  existingClaimants?: string[]
  maxVolunteers?: number
}

export interface VerificationPermissionInput {
  verifierId: string
  claimantId: string
  assignedVerifierIds: string[]
}

export interface SignAnnouncementPermissionInput {
  userId: string
  tier: UserTier
  existingSignerIds: string[]
}

/**
 * Core permission table checks:
 * - All tiers (1, 2, 3): view feed, tasks, heatmap, profiles; check in;
 *   claim a task they did not create; mark own claim complete;
 *   verify if selected verifier (never the claimant).
 * - Tier 3 only: create announcement, post task, sign announcement, organizer override on verification.
 * - Tier 2 and above: add context notes (Tier B).
 */
export const Permissions = {
  // All tiers (1, 2, 3)
  canViewFeed: (tier: UserTier): boolean => tier >= 1,
  canViewTasks: (tier: UserTier): boolean => tier >= 1,
  canViewHeatmap: (tier: UserTier): boolean => tier >= 1,
  canViewProfiles: (tier: UserTier): boolean => tier >= 1,
  canCheckIn: (tier: UserTier): boolean => tier >= 1,

  canClaimTask: ({
    taskCreatedBy,
    claimantId,
    existingClaimants = [],
    maxVolunteers = 1,
  }: ClaimPermissionInput): { allowed: boolean; reason?: string } => {
    if (taskCreatedBy === claimantId) {
      return { allowed: false, reason: "Users cannot claim tasks they created" }
    }
    if (existingClaimants.includes(claimantId)) {
      return { allowed: false, reason: "User has already claimed this task" }
    }
    if (existingClaimants.length >= maxVolunteers) {
      return { allowed: false, reason: "Task volunteer capacity reached" }
    }
    return { allowed: true }
  },

  canMarkClaimComplete: (
    userId: string,
    claimedBy: string
  ): { allowed: boolean; reason?: string } => {
    if (userId !== claimedBy) {
      return { allowed: false, reason: "Only the claimant can mark their claim complete" }
    }
    return { allowed: true }
  },

  canVerifyClaim: ({
    verifierId,
    claimantId,
    assignedVerifierIds,
  }: VerificationPermissionInput): { allowed: boolean; reason?: string } => {
    if (verifierId === claimantId) {
      return { allowed: false, reason: "Claimants cannot verify their own tasks" }
    }
    if (!assignedVerifierIds.includes(verifierId)) {
      return { allowed: false, reason: "User is not an assigned verifier for this claim" }
    }
    return { allowed: true }
  },

  // Tier 3 only
  canCreateAnnouncement: (tier: UserTier): boolean => tier === 3,
  canPostTask: (tier: UserTier): boolean => tier === 3,

  canSignAnnouncement: ({
    userId,
    tier,
    existingSignerIds,
  }: SignAnnouncementPermissionInput): { allowed: boolean; reason?: string } => {
    if (tier !== 3) {
      return { allowed: false, reason: "Only Tier 3 Organizers can sign announcements" }
    }
    if (existingSignerIds.includes(userId)) {
      return { allowed: false, reason: "User has already signed this announcement" }
    }
    return { allowed: true }
  },

  canOrganizerOverride: (tier: UserTier): boolean => tier === 3,

  // Tier 2 and above
  canAddContextNotes: (tier: UserTier): boolean => tier >= 2,
}
