import { describe, it, expect, beforeEach } from "vitest"
import { mockStore } from "../mocks/mock-store"
import { Permissions } from "../permissions"
import { SEED_ANNOUNCEMENTS, SEED_USERS, SEED_TASKS } from "../mocks/seed-data"

describe("Permissions and Mock Store Integrity Tests", () => {
  beforeEach(() => {
    mockStore.reset()
  })

  // Test 1: Duplicate signature blocked
  it("blocks duplicate signatures on the same announcement", () => {
    const announcementId = SEED_ANNOUNCEMENTS[1].id // Pending 1 of 3 (author already signed)
    const authorId = SEED_ANNOUNCEMENTS[1].created_by

    // Author attempts to sign again
    expect(() => {
      mockStore.signAnnouncement(announcementId, authorId)
    }).toThrow("User has already signed this announcement")
  })

  // Test 2: Non-Tier-3 cannot sign
  it("prevents non-Tier-3 volunteers from signing announcements", () => {
    const announcementId = SEED_ANNOUNCEMENTS[1].id
    const tier2User = SEED_USERS.find((u) => u.tier === 2)!
    const tier1User = SEED_USERS.find((u) => u.tier === 1)!

    expect(() => {
      mockStore.signAnnouncement(announcementId, tier2User.id)
    }).toThrow("Only Tier 3 Organizers can sign announcements")

    expect(() => {
      mockStore.signAnnouncement(announcementId, tier1User.id)
    }).toThrow("Only Tier 3 Organizers can sign announcements")
  })

  // Test 3: Author counts as signature 1
  it("automatically counts announcement author as signature 1 upon creation", () => {
    const organizer = SEED_USERS.find((u) => u.tier === 3)!
    const newAnnouncement = mockStore.createAnnouncement(
      {
        movement_id: SEED_ANNOUNCEMENTS[0].movement_id,
        title: "Fresh Emergency Field Notice",
        body: "Stewards must inspect and secure all coastal hydration depots immediately.",
        required_signatures: 3,
      },
      organizer.id
    )

    const signatures = mockStore.getSignatures(newAnnouncement.id)
    expect(signatures).toHaveLength(1)
    expect(signatures[0].signed_by).toBe(organizer.id)
    expect(newAnnouncement.is_published).toBe(false)
  })

  // Test 4: Claim starts at in_progress
  it("ensures a new task claim starts with status in_progress", () => {
    // Task 1 is open
    const task = SEED_TASKS[0]
    const volunteer = SEED_USERS.find((u) => u.tier === 1)!

    const claim = mockStore.claimTask(
      {
        task_id: task.id,
        note: "Taking responsibility for water barrel staging.",
      },
      volunteer.id
    )

    expect(claim.status).toBe("in_progress")
  })

  // Test 5: Double-claim blocked
  it("blocks a user from double-claiming the same task", () => {
    const task = SEED_TASKS[0]
    const volunteer = SEED_USERS.find((u) => u.tier === 1)!

    mockStore.claimTask(
      {
        task_id: task.id,
      },
      volunteer.id
    )

    expect(() => {
      mockStore.claimTask(
        {
          task_id: task.id,
        },
        volunteer.id
      )
    }).toThrow("User has already claimed this task")
  })

  // Test 6: Claimant cannot verify own task
  it("prevents the claimant from voting to verify their own task claim", () => {
    // Task 5 is pending_verification by Karthik Bhat
    const karthikId = "55555555-5555-5555-5555-555555555555"
    const claimId = "c5555555-5555-5555-5555-555555555555"

    // Permission check
    const check = Permissions.canVerifyClaim({
      verifierId: karthikId,
      claimantId: karthikId,
      assignedVerifierIds: [karthikId, "44444444-4444-4444-4444-444444444444"],
    })
    expect(check.allowed).toBe(false)
    expect(check.reason).toBe("Claimants cannot verify their own tasks")

    // Mock store execution
    expect(() => {
      mockStore.submitVerificationVote(claimId, karthikId, "approve")
    }).toThrow("Claimants cannot verify their own tasks")
  })

  // Test 7: Reset restores seed data
  it("restores original seed data state upon reset()", () => {
    const initialTaskCount = mockStore.getTasks(SEED_ANNOUNCEMENTS[0].movement_id).length
    const initialAnnouncementCount = mockStore.getAnnouncements(SEED_ANNOUNCEMENTS[0].movement_id).length
    const organizer = SEED_USERS.find((u) => u.tier === 3)!

    // Mutate state
    mockStore.createTask(
      {
        movement_id: SEED_ANNOUNCEMENTS[0].movement_id,
        title: "Temporary Observation Tower Setup",
        reward_points: 60,
        required_volunteers: 2,
      },
      organizer.id
    )

    mockStore.createAnnouncement(
      {
        movement_id: SEED_ANNOUNCEMENTS[0].movement_id,
        title: "Temporary Broadcast Bulletin",
        body: "Temporary broadcast message that will be cleared on reset.",
        required_signatures: 2,
      },
      organizer.id
    )

    expect(mockStore.getTasks(SEED_ANNOUNCEMENTS[0].movement_id).length).toBe(initialTaskCount + 1)
    expect(mockStore.getAnnouncements(SEED_ANNOUNCEMENTS[0].movement_id).length).toBe(initialAnnouncementCount + 1)

    // Reset
    mockStore.reset()

    expect(mockStore.getTasks(SEED_ANNOUNCEMENTS[0].movement_id).length).toBe(initialTaskCount)
    expect(mockStore.getAnnouncements(SEED_ANNOUNCEMENTS[0].movement_id).length).toBe(initialAnnouncementCount)
  })
})
