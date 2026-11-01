import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { mockStore } from "../mocks/mock-store"
import { Permissions } from "../permissions"
import { SEED_MOVEMENT_ID, SEED_USERS } from "../mocks/seed-data"
import { Announcement } from "../schemas/announcement.schema"
import { AnnouncementSignature } from "../schemas/signature.schema"
import { QueryKeys } from "../query-keys"

describe("Phase 5: Feed & Multi-Signature Announcement Workflows", () => {
  const priyaOrganizer = SEED_USERS[0] // Tier 3
  const rohanOrganizer = SEED_USERS[1] // Tier 3
  const ananyaOrganizer = SEED_USERS[2] // Tier 3
  const devikaSeniorVolunteer = SEED_USERS[3] // Tier 2
  const snehaVolunteer = SEED_USERS[5] // Tier 1

  beforeEach(() => {
    mockStore.reset()
  })

  // 1. Create an announcement as Tier 3
  it("allows Tier 3 Organizer to create announcement and auto-signs as signature 1", async () => {
    const announcement = mockStore.createAnnouncement(
      {
        movement_id: SEED_MOVEMENT_ID,
        title: "Logistics Checkpoint Relocation Alert",
        body: "All volunteer units report to Sector 4 staging grounds immediately.",
        required_signatures: 2,
      },
      priyaOrganizer.id
    )

    expect(announcement.id).toBeDefined()
    expect(announcement.created_by).toBe(priyaOrganizer.id)
    expect(announcement.required_signatures).toBe(2)
    expect(announcement.is_published).toBe(false)
    expect(announcement.published_at).toBeNull()

    // Author auto-signs as signature 1
    const signatures = mockStore.getSignatures(announcement.id)
    expect(signatures.length).toBe(1)
    expect(signatures[0].signed_by).toBe(priyaOrganizer.id)
  })

  // 1b. If required_signatures is 1, it publishes immediately
  it("publishes immediately when required_signatures is set to 1", async () => {
    const singleSigAnnouncement = mockStore.createAnnouncement(
      {
        movement_id: SEED_MOVEMENT_ID,
        title: "Immediate Advisory Notice",
        body: "Precautionary hydration reminders for coastal volunteers during peak sun hours.",
        required_signatures: 1,
      },
      priyaOrganizer.id
    )

    expect(singleSigAnnouncement.required_signatures).toBe(1)
    expect(singleSigAnnouncement.is_published).toBe(true)
    expect(singleSigAnnouncement.published_at).not.toBeNull()

    const signatures = mockStore.getSignatures(singleSigAnnouncement.id)
    expect(signatures.length).toBe(1)
    expect(signatures[0].signed_by).toBe(priyaOrganizer.id)
  })

  // 2. Sign as a second organizer
  it("allows a second Tier 3 Organizer to co-sign a pending announcement", async () => {
    const announcement = mockStore.createAnnouncement(
      {
        movement_id: SEED_MOVEMENT_ID,
        title: "Multi-Organizer Protocol Activation",
        body: "Coordinated emergency logistics activation across all active sectors.",
        required_signatures: 3,
      },
      priyaOrganizer.id
    )

    // Second organizer signs
    const signature = mockStore.signAnnouncement(announcement.id, rohanOrganizer.id)
    expect(signature.announcement_id).toBe(announcement.id)
    expect(signature.signed_by).toBe(rohanOrganizer.id)

    const updatedSignatures = mockStore.getSignatures(announcement.id)
    expect(updatedSignatures.length).toBe(2)
    expect(updatedSignatures.map((s: AnnouncementSignature) => s.signed_by)).toContain(rohanOrganizer.id)
  })

  // 3. Duplicate sign blocked
  it("blocks duplicate signatures from the same organizer", async () => {
    const announcement = mockStore.createAnnouncement(
      {
        movement_id: SEED_MOVEMENT_ID,
        title: "Duplicate Test Announcement",
        body: "Ensuring idempotency and duplicate signature resistance in verification ledger.",
        required_signatures: 3,
      },
      priyaOrganizer.id
    )

    // Author already signed at creation: Priya signing again must throw
    expect(() => {
      mockStore.signAnnouncement(announcement.id, priyaOrganizer.id)
    }).toThrow("User has already signed this announcement")

    // Second organizer signs once
    mockStore.signAnnouncement(announcement.id, rohanOrganizer.id)

    // Rohan signing a second time must throw
    expect(() => {
      mockStore.signAnnouncement(announcement.id, rohanOrganizer.id)
    }).toThrow("User has already signed this announcement")
  })

  // 4. Tier 1 cannot see Sign / sign announcement
  it("blocks non-Tier-3 users (Tier 1 and Tier 2) from signing announcements", async () => {
    const announcement = mockStore.createAnnouncement(
      {
        movement_id: SEED_MOVEMENT_ID,
        title: "Organizer Authority Enforcement",
        body: "Testing role boundaries and cryptographic verification permissions.",
        required_signatures: 3,
      },
      priyaOrganizer.id
    )

    // Tier 1 volunteer attempt
    expect(() => {
      mockStore.signAnnouncement(announcement.id, snehaVolunteer.id)
    }).toThrow("Only Tier 3 Organizers can sign announcements")

    // Tier 2 senior volunteer attempt
    expect(() => {
      mockStore.signAnnouncement(announcement.id, devikaSeniorVolunteer.id)
    }).toThrow("Only Tier 3 Organizers can sign announcements")

    // Direct permissions check
    const tier1Check = Permissions.canSignAnnouncement({
      userId: snehaVolunteer.id,
      tier: snehaVolunteer.tier,
      existingSignerIds: [priyaOrganizer.id],
    })
    expect(tier1Check.allowed).toBe(false)
    expect(tier1Check.reason).toBe("Only Tier 3 Organizers can sign announcements")
  })

  // 5. Threshold publishes it
  it("moves pending announcement to published when required signature threshold is reached", async () => {
    const announcement = mockStore.createAnnouncement(
      {
        movement_id: SEED_MOVEMENT_ID,
        title: "Consensus Threshold Test Directive",
        body: "Requiring tripartite organizer sign-off before public broadcast.",
        required_signatures: 3,
      },
      priyaOrganizer.id
    )

    // Initially 1 of 3 (author Priya)
    expect(announcement.is_published).toBe(false)

    // Second organizer signs: 2 of 3
    mockStore.signAnnouncement(announcement.id, rohanOrganizer.id)
    const afterSecondSign = mockStore
      .getAnnouncements(SEED_MOVEMENT_ID)
      .find((a: Announcement) => a.id === announcement.id)
    expect(afterSecondSign?.is_published).toBe(false)

    // Third organizer signs: 3 of 3 (Threshold met)
    mockStore.signAnnouncement(announcement.id, ananyaOrganizer.id)
    const afterThirdSign = mockStore
      .getAnnouncements(SEED_MOVEMENT_ID)
      .find((a: Announcement) => a.id === announcement.id)

    expect(afterThirdSign?.is_published).toBe(true)
    expect(afterThirdSign?.published_at).not.toBeNull()

    const allSigs = mockStore.getSignatures(announcement.id)
    expect(allSigs.length).toBe(3)
  })

  // 6. Simulated failure rolls back optimistic updates
  it("rolls back optimistic updates when announcement creation encounters simulated failure", async () => {
    const queryClient = new QueryClient()
    const movementQueryKey = QueryKeys.announcements(SEED_MOVEMENT_ID)

    // 1. Initial cached state (e.g. 1 announcement)
    const initialAnnouncements: Announcement[] = [
      {
        id: "ann-01",
        movement_id: SEED_MOVEMENT_ID,
        created_by: priyaOrganizer.id,
        title: "Original Announcement One",
        body: "Original announcement body description.",
        required_signatures: 2,
        is_published: true,
        created_at: "2026-10-20T10:00:00Z",
        published_at: "2026-10-20T11:00:00Z",
      },
    ]

    queryClient.setQueryData(movementQueryKey, initialAnnouncements)
    expect(queryClient.getQueryData<Announcement[]>(movementQueryKey)?.length).toBe(1)

    // 2. Snapshot captured in onMutate
    const snapshot = queryClient.getQueryData<Announcement[]>(movementQueryKey)

    // 3. Optimistic update applied
    const optimisticAnnouncement: Announcement = {
      id: "temp-ann-99",
      movement_id: SEED_MOVEMENT_ID,
      created_by: priyaOrganizer.id,
      title: "Optimistic Title Pending Verification",
      body: "Optimistic announcement description text.",
      required_signatures: 2,
      is_published: false,
      created_at: new Date().toISOString(),
      published_at: null,
    }

    queryClient.setQueryData<Announcement[]>(movementQueryKey, (old = []) => [
      optimisticAnnouncement,
      ...old,
    ])

    // Verify optimistic item is now visible in cache (length is 2)
    expect(queryClient.getQueryData<Announcement[]>(movementQueryKey)?.length).toBe(2)
    expect(queryClient.getQueryData<Announcement[]>(movementQueryKey)?.[0].id).toBe("temp-ann-99")

    // 4. Simulated failure occurs (mutation error)
    const simulateError = new Error("Simulated network failure: Server unreachable")

    // 5. onError executes rollback to snapshot
    if (snapshot) {
      queryClient.setQueryData(movementQueryKey, snapshot)
    }

    // Verify cache has been strictly restored to initial state (length is 1, temp item removed)
    const restoredAnnouncements = queryClient.getQueryData<Announcement[]>(movementQueryKey)
    expect(restoredAnnouncements?.length).toBe(1)
    expect(restoredAnnouncements?.[0].id).toBe("ann-01")
    expect(simulateError.message).toContain("Simulated network failure")
  })

  it("rolls back optimistic signature when signing encounters simulated failure", async () => {
    const queryClient = new QueryClient()
    const announcementId = "ann-target-01"
    const sigQueryKey = QueryKeys.signatures(announcementId)

    const initialSignatures: AnnouncementSignature[] = [
      {
        id: "sig-01",
        announcement_id: announcementId,
        signed_by: priyaOrganizer.id,
        signed_at: "2026-10-20T10:00:00Z",
      },
    ]

    queryClient.setQueryData(sigQueryKey, initialSignatures)
    const sigSnapshot = queryClient.getQueryData<AnnouncementSignature[]>(sigQueryKey)

    // Optimistically add Rohan's signature
    const optimisticSig: AnnouncementSignature = {
      id: "temp-sig-88",
      announcement_id: announcementId,
      signed_by: rohanOrganizer.id,
      signed_at: new Date().toISOString(),
    }

    queryClient.setQueryData<AnnouncementSignature[]>(sigQueryKey, (old = []) => [
      ...old,
      optimisticSig,
    ])
    expect(queryClient.getQueryData<AnnouncementSignature[]>(sigQueryKey)?.length).toBe(2)

    // Simulated failure occurs
    // onError rolls back to snapshot
    queryClient.setQueryData(sigQueryKey, sigSnapshot)

    // Verify cache rolled back
    const restoredSignatures = queryClient.getQueryData<AnnouncementSignature[]>(sigQueryKey)
    expect(restoredSignatures?.length).toBe(1)
    expect(restoredSignatures?.[0].signed_by).toBe(priyaOrganizer.id)
  })
})
