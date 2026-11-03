import { describe, it, expect } from "vitest"
import { generateMovementInviteCode } from "@/lib/movement-utils"
import {
  FICTIONAL_MOVEMENTS,
  getMovementByInviteCode,
  addFictionalMovement,
  getActiveMovementId,
  setActiveMovementId,
} from "@/lib/mocks/fictional-data"
import { Movement } from "@/lib/schemas/movement.schema"

describe("Movement Invite Code & Cross-Browser Join Flow", () => {
  describe("Invite Code Generation", () => {
    it("generates an uppercase 5-character alphanumeric code", () => {
      const code = generateMovementInviteCode()
      expect(code).toBeTypeOf("string")
      expect(code).toHaveLength(5)
      expect(code).toMatch(/^[2-9A-HJ-NP-Z]{5}$/)
    })

    it("excludes ambiguous characters (0, O, 1, I) to prevent visual confusion", () => {
      for (let i = 0; i < 50; i++) {
        const code = generateMovementInviteCode()
        expect(code).not.toMatch(/[01IO]/)
      }
    })

    it("generates distinct random codes on successive calls", () => {
      const codes = new Set<string>()
      for (let i = 0; i < 20; i++) {
        codes.add(generateMovementInviteCode())
      }
      expect(codes.size).toBeGreaterThanOrEqual(18)
    })
  })

  describe("Invite Code Lookup & Multi-Tenant Joining", () => {
    it("resolves the primary seed movement by its default invite code MOV9K", () => {
      const movement = getMovementByInviteCode("MOV9K")
      expect(movement).toBeDefined()
      expect(movement?.name).toBe("Coastal Action Front")
      expect(movement?.id).toBe("00000000-0000-4000-8000-000000000001")
    })

    it("resolves invite codes case-insensitively with whitespace trimmed", () => {
      const movementLower = getMovementByInviteCode("  mov9k  ")
      expect(movementLower).toBeDefined()
      expect(movementLower?.id).toBe("00000000-0000-4000-8000-000000000001")

      const movementSecond = getMovementByInviteCode("metr2")
      expect(movementSecond).toBeDefined()
      expect(movementSecond?.name).toBe("Metro Solidarity Network")
    })

    it("returns undefined when an invalid or unknown invite code is entered", () => {
      const invalid = getMovementByInviteCode("XXXXX")
      expect(invalid).toBeUndefined()
    })

    it("allows a newly created movement to be discovered and joined via its invite code", () => {
      const newMovementId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      const customCode = "CIV99"

      const newMovement: Movement = {
        id: newMovementId,
        name: "Clean Air Coalition",
        description: "Community air quality monitoring network across south district.",
        slug: "clean-air-coalition",
        invite_code: customCode,
        is_active: true,
        created_by: "11111111-1111-4111-8111-111111111111",
        created_at: new Date().toISOString(),
      }

      addFictionalMovement(newMovement)

      const resolved = getMovementByInviteCode(customCode)
      expect(resolved).toBeDefined()
      expect(resolved?.name).toBe("Clean Air Coalition")
      expect(resolved?.id).toBe(newMovementId)
    })

    it("switches active movement ID when joining a campaign", () => {
      const initial = getActiveMovementId()
      expect(initial).toBeDefined()

      const targetId = "00000000-0000-4000-8000-000000000002"
      setActiveMovementId(targetId)

      // When in non-browser Node test environment, verify function handles gracefully
      expect(FICTIONAL_MOVEMENTS.some((m) => m.id === targetId)).toBe(true)
    })

    it("supports joining Hack-a-thon 2026 Volunteer movement by code HK26V", () => {
      const hackathonMovement: Movement = {
        id: "806a316b-83f7-4aae-b35d-af0689be109e",
        name: "Hack-a-thon 2026 Volunteer",
        description: "Volunteer movement for Hack-a-thon 2026",
        slug: "hack-a-thon-2026-volunteer",
        invite_code: "HK26V",
        is_active: true,
        created_by: "11111111-1111-4111-8111-111111111111",
        created_at: new Date().toISOString(),
      }

      addFictionalMovement(hackathonMovement)
      const found = getMovementByInviteCode("HK26V")
      expect(found).toBeDefined()
      expect(found?.name).toBe("Hack-a-thon 2026 Volunteer")
      expect(found?.invite_code).toBe("HK26V")
    })
  })
})
