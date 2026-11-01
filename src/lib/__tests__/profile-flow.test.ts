import { describe, it, expect, beforeEach } from "vitest"
import { api } from "../api"
import { mockStore } from "../mocks/mock-store"
import { SEED_USERS, SEED_TASKS } from "../mocks/seed-data"

describe("Phase 8: Profile and Impact Ledger Integrity Tests", () => {
  beforeEach(() => {
    mockStore.reset()
  })

  // Exercise 1: Profile loads for each tier (Tier 1, Tier 2, Tier 3)
  it("loads profile data accurately for each volunteer tier", async () => {
    // Tier 1: Vikram Alva
    const tier1User = SEED_USERS.find((u) => u.tier === 1 && u.display_name === "Vikram Alva")!
    const t1Profile = await api.getUserProfile(tier1User.id)
    const t1Badges = await api.getUserBadges(tier1User.id)
    const t1Ledger = await api.getImpactLedger(tier1User.id)
    const t1Stats = await api.getUserStats(tier1User.id)

    expect(t1Profile.tier).toBe(1)
    expect(t1Profile.display_name).toBe("Vikram Alva")
    expect(t1Badges.length).toBeGreaterThanOrEqual(1)
    expect(t1Ledger.length).toBeGreaterThanOrEqual(1)
    expect(t1Stats.tasksCompleted).toBe(t1Ledger.length)
    expect(t1Stats.impactPoints).toBeGreaterThan(0)

    // Tier 2: Devika Pai
    const tier2User = SEED_USERS.find((u) => u.tier === 2 && u.display_name === "Devika Pai")!
    const t2Profile = await api.getUserProfile(tier2User.id)
    const t2Badges = await api.getUserBadges(tier2User.id)
    const t2Ledger = await api.getImpactLedger(tier2User.id)
    const t2Stats = await api.getUserStats(tier2User.id)

    expect(t2Profile.tier).toBe(2)
    expect(t2Profile.display_name).toBe("Devika Pai")
    expect(t2Badges.some((b) => b.badge_label === "Field Medic Steward")).toBe(true)
    expect(t2Ledger.some((e) => e.task_title === "Emergency Medical Camp Setup")).toBe(true)
    expect(t2Stats.impactPoints).toBe(150)

    // Tier 3: Priya Rao
    const tier3User = SEED_USERS.find((u) => u.tier === 3 && u.display_name === "Priya Rao")!
    const t3Profile = await api.getUserProfile(tier3User.id)
    const t3Stats = await api.getUserStats(tier3User.id)

    expect(t3Profile.tier).toBe(3)
    expect(t3Profile.display_name).toBe("Priya Rao")
    expect(t3Stats.announcementsSigned).toBeGreaterThanOrEqual(1)
  })

  // Exercise 2: Unknown id handled with proper not-found state
  it("handles unknown user IDs by throwing an identifiable error for not-found states", async () => {
    const nonExistentUuid = "99999999-9999-9999-9999-999999999999"
    await expect(api.getUserProfile(nonExistentUuid)).rejects.toThrow("User profile not found")
    await expect(api.getUserStats(nonExistentUuid)).rejects.toThrow("User profile not found")

    const invalidStringId = "non-existent-user-handle"
    await expect(api.getUserProfile(invalidStringId)).rejects.toThrow("User profile not found")
  })

  // Exercise 3: Badge names and verification details are present and accessible
  it("provides complete badge metadata with labels and issuance source for accessible display", async () => {
    const userWithBadges = SEED_USERS.find((u) => u.display_name === "Vikram Alva")!
    const badges = await api.getUserBadges(userWithBadges.id)

    expect(badges.length).toBeGreaterThan(0)
    for (const badge of badges) {
      expect(badge.badge_label).toBeTruthy()
      expect(["peer_vote", "organizer_override"]).toContain(badge.issued_by)
      expect(badge.awarded_at).toBeTruthy()
    }
  })

  // Exercise 4: Ledger entries have valid task links, verification details, and points
  it("ensures ledger entries have valid task references, points, and verifier details", async () => {
    const userWithLedger = SEED_USERS.find((u) => u.display_name === "Vikram Alva")!
    const ledger = await api.getImpactLedger(userWithLedger.id)

    expect(ledger.length).toBeGreaterThan(0)
    const entry = ledger[0]
    expect(entry.task_title).toBe("Legal Support Hotline Duty Roster")
    expect(entry.reward_points).toBe(100)
    expect(entry.verification_method).toBe("peer_vote")
    expect(entry.verified_by_detail).toContain("Verified by 3 peers")
    expect(entry.verified_at).toBeTruthy()
  })

  // Exercise 5: Completing and verifying a task in the demo updates the ledger and awards points
  it("completing and verifying a task updates the claimant impact ledger, stats, and badges", async () => {
    // Elena Rostova (Tier 1 volunteer) initially has 0 ledger entries
    const volunteerId = "66666666-6666-4666-8666-666666666666"
    const initialLedger = await api.getImpactLedger(volunteerId)
    const initialStats = await api.getUserStats(volunteerId)
    expect(initialLedger).toHaveLength(0)
    expect(initialStats.impactPoints).toBe(0)

    // Step 1: Claim an open task (Task 1: Water Distribution Barrel Staging, 50 points)
    const task = SEED_TASKS[0]
    const claim = await api.claimTask({ task_id: task.id, note: "Staging ready." }, volunteerId)
    expect(claim.status).toBe("in_progress")

    // Step 2: Mark claim complete
    const completedClaim = await api.markClaimComplete(claim.id, volunteerId, "Depots loaded.")
    expect(completedClaim.status).toBe("pending_verification")

    // Step 3: Tier 3 Organizer approves via override
    const organizerId = "11111111-1111-4111-8111-111111111111" // Priya Rao
    const verifiedClaim = await api.organizerOverride(claim.id, organizerId, true, "Verified on site.")
    expect(verifiedClaim.status).toBe("verified")

    // Step 4: Verify ledger is updated with new verified entry
    const updatedLedger = await api.getImpactLedger(volunteerId)
    expect(updatedLedger).toHaveLength(1)
    expect(updatedLedger[0].task_title).toBe(task.title)
    expect(updatedLedger[0].reward_points).toBe(task.reward_points)
    expect(updatedLedger[0].verification_method).toBe("organizer_override")
    expect(updatedLedger[0].verified_by_detail).toContain("Verified by Priya Rao")

    // Step 5: Verify points and badges are awarded
    const updatedStats = await api.getUserStats(volunteerId)
    expect(updatedStats.tasksCompleted).toBe(1)
    expect(updatedStats.impactPoints).toBe(task.reward_points)

    const updatedBadges = await api.getUserBadges(volunteerId)
    const newBadge = updatedBadges.find((b) => b.claim_id === claim.id)
    expect(newBadge).toBeDefined()
    expect(newBadge?.badge_label).toBe(`${task.title} Champion`)
  })
})
