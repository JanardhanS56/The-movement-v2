import { describe, it, expect, beforeEach } from "vitest"
import { mockStore } from "../mocks/mock-store"
import { SEED_USERS, SEED_TASKS } from "../mocks/seed-data"
import { VERIFICATION_RULES } from "../permissions"

describe("Phase 4: Automated Consensus & Badge Awarding Triggers", () => {
  const claimantSneha = SEED_USERS[5] // Tier 1

  beforeEach(() => {
    mockStore.reset()
  })

  describe("Voting Lifecycle & 3-Vote Quorum Resolution", () => {
    it("transitions claim to verified and task to completed once approval quorum is reached", () => {
      // 1. Setup open task and claim
      const openTask = SEED_TASKS[1] // required_volunteers: 1, reward_points: 50
      expect(openTask.status).toBe("open")

      const claim = mockStore.claimTask({ task_id: openTask.id }, claimantSneha.id)
      expect(claim.status).toBe("in_progress")

      // 2. Mark complete with proof photo
      const completedClaim = mockStore.markClaimComplete(
        claim.id,
        claimantSneha.id,
        "Completed neighborhood inventory and verification",
        "https://example.com/proof.jpg"
      )
      expect(completedClaim.status).toBe("pending_verification")

      // 3. Verifiers are assigned
      const assignments = mockStore.getPeerVerifications(claim.id)
      expect(assignments.length).toBe(VERIFICATION_RULES.requiredVerifiers)

      const verifierIds = assignments.map((a) => a.verifier_id)
      expect(verifierIds).not.toContain(claimantSneha.id)

      // 4. Cast Vote 1: Approve
      mockStore.submitVerificationVote(claim.id, verifierIds[0], "approve")
      let claimState = mockStore.getTaskClaims().find((c) => c.id === claim.id)
      expect(claimState?.status).toBe("pending_verification")

      // 5. Cast Vote 2: Approve
      mockStore.submitVerificationVote(claim.id, verifierIds[1], "approve")
      claimState = mockStore.getTaskClaims().find((c) => c.id === claim.id)

      // If threshold is 3, verify 3rd vote
      if (VERIFICATION_RULES.approvalThreshold > 2) {
        expect(claimState?.status).toBe("pending_verification")
        mockStore.submitVerificationVote(claim.id, verifierIds[2], "approve")
        claimState = mockStore.getTaskClaims().find((c) => c.id === claim.id)
      }

      expect(claimState?.status).toBe("verified")
      expect(claimState?.verified_at).toBeDefined()

      // 6. Parent task automatically transitions to completed
      const finalTask = mockStore.getTask(openTask.id)
      expect(finalTask?.status).toBe("completed")
    })

    it("records impact ledger entries and issues badges upon verified quorum", () => {
      const openTask = SEED_TASKS[1]
      const claim = mockStore.claimTask({ task_id: openTask.id }, claimantSneha.id)
      mockStore.markClaimComplete(
        claim.id,
        claimantSneha.id,
        "Proof note",
        "https://example.com/proof.jpg"
      )

      const assignments = mockStore.getPeerVerifications(claim.id)
      const verifierIds = assignments.map((a) => a.verifier_id)

      // Cast quorum approval votes
      for (let i = 0; i < VERIFICATION_RULES.approvalThreshold; i++) {
        mockStore.submitVerificationVote(claim.id, verifierIds[i], "approve")
      }

      // Check impact ledger
      const ledgerEntries = mockStore.getImpactLedger(claimantSneha.id)
      expect(ledgerEntries.length).toBeGreaterThanOrEqual(1)

      const latestEntry = ledgerEntries.find((e) => e.task_id === openTask.id)
      expect(latestEntry).toBeDefined()
      expect(latestEntry?.reward_points).toBe(openTask.reward_points)
      expect(latestEntry?.verification_method).toBe("peer_vote")

      // Check task completion badge
      const badges = mockStore.getUserBadges(claimantSneha.id)
      const completionBadge = badges.find((b) => b.claim_id === claim.id)
      expect(completionBadge).toBeDefined()
      expect(completionBadge?.badge_type).toBe("task_complete")
    })

    it("rejects claim when peer rejections exceed allowed rejection threshold", () => {
      const openTask = SEED_TASKS[1]
      const claim = mockStore.claimTask({ task_id: openTask.id }, claimantSneha.id)
      mockStore.markClaimComplete(
        claim.id,
        claimantSneha.id,
        "Proof note",
        "https://example.com/proof.jpg"
      )

      const assignments = mockStore.getPeerVerifications(claim.id)
      const verifierIds = assignments.map((a) => a.verifier_id)

      // Cast 2 rejection votes
      mockStore.submitVerificationVote(claim.id, verifierIds[0], "reject")
      mockStore.submitVerificationVote(claim.id, verifierIds[1], "reject")

      const claimState = mockStore.getTaskClaims().find((c) => c.id === claim.id)
      expect(claimState?.status).toBe("rejected")

      // No ledger entry or completion badge issued for rejected claims
      const ledgerEntries = mockStore.getImpactLedger(claimantSneha.id)
      const rejectedEntry = ledgerEntries.find((e) => e.task_id === openTask.id)
      expect(rejectedEntry).toBeUndefined()
    })

    it("prevents self-voting and duplicate voting on the same verification assignment", () => {
      const openTask = SEED_TASKS[1]
      const claim = mockStore.claimTask({ task_id: openTask.id }, claimantSneha.id)
      mockStore.markClaimComplete(
        claim.id,
        claimantSneha.id,
        "Proof note",
        "https://example.com/proof.jpg"
      )

      const assignments = mockStore.getPeerVerifications(claim.id)
      const verifierId = assignments[0].verifier_id

      // Claimant cannot verify their own claim
      expect(() => {
        mockStore.submitVerificationVote(claim.id, claimantSneha.id, "approve")
      }).toThrow()

      // First vote succeeds
      mockStore.submitVerificationVote(claim.id, verifierId, "approve")

      // Second vote by same verifier throws
      expect(() => {
        mockStore.submitVerificationVote(claim.id, verifierId, "approve")
      }).toThrow()
    })
  })
})
