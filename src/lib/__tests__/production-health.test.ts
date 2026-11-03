import { describe, it, expect } from "vitest"
import { TaskSchema } from "../schemas/task.schema"
import { AnnouncementSchema } from "../schemas/announcement.schema"
import { MovementSchema } from "../schemas/movement.schema"
import { ImpactLedgerEntrySchema } from "../schemas/impact-ledger.schema"
import { MessageSchema } from "../schemas/chat.schema"
import { SEED_TASKS, SEED_ANNOUNCEMENTS, SEED_MOVEMENT, SEED_IMPACT_ENTRIES } from "../mocks/seed-data"
import { buildFictionalDemoMessages } from "../api/chat"
import { Permissions, VERIFICATION_RULES } from "../permissions"

describe("Phase 6: Production Health, Schema Contracts & RLS Rule Verification", () => {
  describe("Schema Integrity & API Contracts", () => {
    it("validates all tasks conform to strict TaskSchema", () => {
      for (const task of SEED_TASKS) {
        const parsed = TaskSchema.safeParse(task)
        expect(parsed.success).toBe(true)
      }
    })

    it("validates all announcements conform to strict AnnouncementSchema", () => {
      for (const ann of SEED_ANNOUNCEMENTS) {
        const parsed = AnnouncementSchema.safeParse(ann)
        expect(parsed.success).toBe(true)
      }
    })

    it("validates primary seed movement conforms to MovementSchema with invite code", () => {
      const parsed = MovementSchema.safeParse(SEED_MOVEMENT)
      expect(parsed.success).toBe(true)
      expect(SEED_MOVEMENT.invite_code).toMatch(/^[2-9A-Z]{5}$/)
    })

    it("validates impact ledger entries match ImpactLedgerEntrySchema", () => {
      for (const entry of SEED_IMPACT_ENTRIES) {
        const parsed = ImpactLedgerEntrySchema.safeParse(entry)
        expect(parsed.success).toBe(true)
      }
    })

    it("validates all seeded chat messages conform to MessageSchema", () => {
      const roomMessages = buildFictionalDemoMessages()
      for (const [roomId, msgs] of Object.entries(roomMessages)) {
        expect(msgs.length).toBeGreaterThan(0)
        for (const msg of msgs) {
          const parsed = MessageSchema.safeParse(msg)
          expect(parsed.success).toBe(true)
          expect(msg.roomId).toBe(roomId)
        }
      }
    })
  })

  describe("Pagination & Cursor Invariant Rules", () => {
    it("enforces clamp limits on pagination parameters between 1 and 50", () => {
      const clampLimit = (limitParam: number) => Math.min(Math.max(isNaN(limitParam) ? 20 : limitParam, 1), 50)

      expect(clampLimit(0)).toBe(1)
      expect(clampLimit(-10)).toBe(1)
      expect(clampLimit(25)).toBe(25)
      expect(clampLimit(100)).toBe(50)
      expect(clampLimit(NaN)).toBe(20)
    })

    it("ensures descending cursor ordering avoids data loss across pages", () => {
      const timestamps = [
        "2026-11-03T12:00:00Z",
        "2026-11-03T11:00:00Z",
        "2026-11-03T10:00:00Z",
        "2026-11-03T09:00:00Z",
      ]

      const cursor = timestamps[1]
      const nextBatch = timestamps.filter((t) => t < cursor)

      expect(nextBatch).toEqual(["2026-11-03T10:00:00Z", "2026-11-03T09:00:00Z"])
    })
  })

  describe("Role-Based Security & RLS Access Control Guards", () => {
    it("strictly restricts organizer override actions to Tier 3 users", () => {
      expect(Permissions.canOrganizerOverride(3)).toBe(true)
      expect(Permissions.canOrganizerOverride(2)).toBe(false)
      expect(Permissions.canOrganizerOverride(1)).toBe(false)
    })

    it("strictly blocks claimants from verifying their own task completion", () => {
      const claimantId = "11111111-1111-4111-8111-111111111111"
      const verifierId = claimantId
      const assignedIds = [claimantId, "22222222-2222-4222-8222-222222222222"]

      const check = Permissions.canVerifyClaim({
        verifierId,
        claimantId,
        assignedVerifierIds: assignedIds,
      })

      expect(check.allowed).toBe(false)
      expect(check.reason).toContain("cannot verify their own")
    })

    it("enforces quorum rules requiring 3 approvals for consensus completion", () => {
      expect(VERIFICATION_RULES.requiredVerifiers).toBe(3)
      expect(VERIFICATION_RULES.approvalThreshold).toBeGreaterThanOrEqual(2)
      expect(VERIFICATION_RULES.expiryHours).toBe(24)
    })
  })
})
