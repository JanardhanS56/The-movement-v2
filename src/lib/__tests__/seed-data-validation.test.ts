import { describe, it, expect } from "vitest"
import { z } from "zod"
import {
  SEED_MOVEMENT,
  SEED_USERS,
  SEED_ANNOUNCEMENTS,
  SEED_SIGNATURES,
  SEED_TASKS,
  SEED_TASK_CLAIMS,
  SEED_PEER_VERIFICATIONS,
  SEED_RAW_CHECK_INS,
  SEED_CHECK_IN_POINTS,
  SEED_BADGES,
  SEED_IMPACT_ENTRIES,
} from "../mocks/seed-data"
import { MovementSchema } from "../schemas/movement.schema"
import { UserSchema } from "../schemas/user.schema"
import { AnnouncementSchema } from "../schemas/announcement.schema"
import { AnnouncementSignatureSchema } from "../schemas/signature.schema"
import { TaskSchema, TaskClaimSchema } from "../schemas/task.schema"
import { PeerVerificationSchema } from "../schemas/verification.schema"
import { CheckInSchema, AggregatedCheckInPointSchema } from "../schemas/check-in.schema"
import { BadgeSchema } from "../schemas/badge.schema"
import { ImpactLedgerEntrySchema } from "../schemas/impact-ledger.schema"

describe("Seed Data Validation against Strict Zod Schemas", () => {
  it("validates SEED_MOVEMENT against MovementSchema", () => {
    const result = MovementSchema.safeParse(SEED_MOVEMENT)
    expect(result.success).toBe(true)
  })

  it("validates all SEED_USERS against UserSchema", () => {
    const result = z.array(UserSchema).safeParse(SEED_USERS)
    expect(result.success).toBe(true)
    expect(SEED_USERS.length).toBeGreaterThan(0)
  })

  it("validates all SEED_ANNOUNCEMENTS against AnnouncementSchema", () => {
    const result = z.array(AnnouncementSchema).safeParse(SEED_ANNOUNCEMENTS)
    expect(result.success).toBe(true)
    expect(SEED_ANNOUNCEMENTS.length).toBeGreaterThan(0)
  })

  it("validates all SEED_SIGNATURES against AnnouncementSignatureSchema", () => {
    const result = z.array(AnnouncementSignatureSchema).safeParse(SEED_SIGNATURES)
    expect(result.success).toBe(true)
    expect(SEED_SIGNATURES.length).toBeGreaterThan(0)
  })

  it("validates all SEED_TASKS against TaskSchema", () => {
    const result = z.array(TaskSchema).safeParse(SEED_TASKS)
    expect(result.success).toBe(true)
    expect(SEED_TASKS.length).toBeGreaterThan(0)
  })

  it("validates all SEED_TASK_CLAIMS against TaskClaimSchema", () => {
    const result = z.array(TaskClaimSchema).safeParse(SEED_TASK_CLAIMS)
    expect(result.success).toBe(true)
    expect(SEED_TASK_CLAIMS.length).toBeGreaterThan(0)
  })

  it("validates all SEED_PEER_VERIFICATIONS against PeerVerificationSchema", () => {
    const result = z.array(PeerVerificationSchema).safeParse(SEED_PEER_VERIFICATIONS)
    expect(result.success).toBe(true)
    expect(SEED_PEER_VERIFICATIONS.length).toBeGreaterThan(0)
  })

  it("validates all SEED_RAW_CHECK_INS against CheckInSchema", () => {
    const result = z.array(CheckInSchema).safeParse(SEED_RAW_CHECK_INS)
    expect(result.success).toBe(true)
    expect(SEED_RAW_CHECK_INS.length).toBeGreaterThan(0)
  })

  it("validates all SEED_CHECK_IN_POINTS against AggregatedCheckInPointSchema", () => {
    const result = z.array(AggregatedCheckInPointSchema).safeParse(SEED_CHECK_IN_POINTS)
    expect(result.success).toBe(true)
    expect(SEED_CHECK_IN_POINTS.length).toBeGreaterThan(0)
  })

  it("validates all SEED_BADGES against BadgeSchema", () => {
    const result = z.array(BadgeSchema).safeParse(SEED_BADGES)
    expect(result.success).toBe(true)
    expect(SEED_BADGES.length).toBeGreaterThan(0)
  })

  it("validates all SEED_IMPACT_ENTRIES against ImpactLedgerEntrySchema", () => {
    const result = z.array(ImpactLedgerEntrySchema).safeParse(SEED_IMPACT_ENTRIES)
    expect(result.success).toBe(true)
    expect(SEED_IMPACT_ENTRIES.length).toBeGreaterThan(0)
  })

  it("ensures all mock IDs are strictly valid RFC 4122 v4 UUIDs", () => {
    const uuidSchema = z.string().uuid()

    // Test Movement ID
    expect(uuidSchema.safeParse(SEED_MOVEMENT.id).success).toBe(true)
    expect(uuidSchema.safeParse(SEED_MOVEMENT.created_by).success).toBe(true)

    // Test Users
    for (const user of SEED_USERS) {
      expect(uuidSchema.safeParse(user.id).success).toBe(true)
    }

    // Test Announcements
    for (const ann of SEED_ANNOUNCEMENTS) {
      expect(uuidSchema.safeParse(ann.id).success).toBe(true)
      expect(uuidSchema.safeParse(ann.movement_id).success).toBe(true)
      expect(uuidSchema.safeParse(ann.created_by).success).toBe(true)
    }

    // Test Signatures
    for (const sig of SEED_SIGNATURES) {
      expect(uuidSchema.safeParse(sig.id).success).toBe(true)
      expect(uuidSchema.safeParse(sig.announcement_id).success).toBe(true)
      expect(uuidSchema.safeParse(sig.signed_by).success).toBe(true)
    }

    // Test Tasks
    for (const task of SEED_TASKS) {
      expect(uuidSchema.safeParse(task.id).success).toBe(true)
      expect(uuidSchema.safeParse(task.movement_id).success).toBe(true)
      expect(uuidSchema.safeParse(task.created_by).success).toBe(true)
    }

    // Test Claims
    for (const claim of SEED_TASK_CLAIMS) {
      expect(uuidSchema.safeParse(claim.id).success).toBe(true)
      expect(uuidSchema.safeParse(claim.task_id).success).toBe(true)
      expect(uuidSchema.safeParse(claim.claimed_by).success).toBe(true)
    }

    // Test Verifications
    for (const ver of SEED_PEER_VERIFICATIONS) {
      expect(uuidSchema.safeParse(ver.id).success).toBe(true)
      expect(uuidSchema.safeParse(ver.claim_id).success).toBe(true)
      expect(uuidSchema.safeParse(ver.verifier_id).success).toBe(true)
    }

    // Test Badges
    for (const badge of SEED_BADGES) {
      expect(uuidSchema.safeParse(badge.id).success).toBe(true)
      expect(uuidSchema.safeParse(badge.user_id).success).toBe(true)
      if (badge.claim_id) {
        expect(uuidSchema.safeParse(badge.claim_id).success).toBe(true)
      }
      if (badge.issued_by_user) {
        expect(uuidSchema.safeParse(badge.issued_by_user).success).toBe(true)
      }
    }

    // Test Impact Entries
    for (const entry of SEED_IMPACT_ENTRIES) {
      expect(uuidSchema.safeParse(entry.id).success).toBe(true)
      expect(uuidSchema.safeParse(entry.user_id).success).toBe(true)
      if (entry.task_id) {
        expect(uuidSchema.safeParse(entry.task_id).success).toBe(true)
      }
    }

    // Test Check-ins
    for (const checkIn of SEED_RAW_CHECK_INS) {
      expect(uuidSchema.safeParse(checkIn.id).success).toBe(true)
      expect(uuidSchema.safeParse(checkIn.movement_id).success).toBe(true)
      expect(uuidSchema.safeParse(checkIn.user_id).success).toBe(true)
    }
  })

  it("sanitizes raw Zod JSON error strings into human messages and preserves technical details", async () => {
    const { parseErrorMessage } = await import("../../components/shared/ErrorAlert")

    const rawZodJson = JSON.stringify([
      {
        code: "invalid_string",
        validation: "uuid",
        message: "Invalid UUID",
        path: [0, "id"],
      },
    ])

    const sanitized = parseErrorMessage(rawZodJson)
    expect(sanitized.displayMessage).toBe("The server returned records with an invalid identifier format.")
    expect(sanitized.displayMessage).not.toContain("invalid_string")
    expect(sanitized.displayMessage).not.toContain("[{")
    expect(sanitized.technicalDetails).toBeDefined()
    expect(sanitized.technicalDetails).toContain("Invalid UUID")

    const genericSanitized = parseErrorMessage(
      JSON.stringify([{ code: "custom", message: "Something failed", path: ["title"] }])
    )
    expect(genericSanitized.displayMessage).toBe(
      "Data verification issue: received information does not match expected format."
    )
    expect(genericSanitized.technicalDetails).toBeDefined()
  })
})
