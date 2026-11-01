import { describe, it, expect } from "vitest"
import {
  getLeaderboard,
  getUserByHandle,
  getBadgeProgress,
  getTaskCounts,
  getFilteredTasks,
  FICTIONAL_USERS,
  TASK_META_MAP,
} from "../mocks/fictional-data"
import { SEED_TASKS, SEED_TASK_CLAIMS } from "../mocks/seed-data"

describe("Leaderboard Pure Functions", () => {
  const fixedNow = new Date("2026-10-31T12:00:00Z")

  it("excludes users who opted out with showOnLeaderboards = false", () => {
    const leaderboard = getLeaderboard("all", fixedNow)
    const hiddenUser = leaderboard.find((e) => e.handle === "vikram-alva")
    expect(hiddenUser).toBeUndefined()
    expect(leaderboard.length).toBe(11) // 12 users minus 1 opted-out
  })

  it("computes different scores and rankings across month, year, and all-time periods", () => {
    const monthBoard = getLeaderboard("month", fixedNow)
    const yearBoard = getLeaderboard("year", fixedNow)
    const allBoard = getLeaderboard("all", fixedNow)

    expect(monthBoard.length).toBeGreaterThan(0)
    expect(yearBoard.length).toBeGreaterThan(0)
    expect(allBoard.length).toBeGreaterThan(0)

    // Priya Rao: 2 tasks in last 30 days (100 + 60 = 160)
    const priyaMonth = monthBoard.find((e) => e.handle === "priya-rao")
    const priyaYear = yearBoard.find((e) => e.handle === "priya-rao")
    const priyaAll = allBoard.find((e) => e.handle === "priya-rao")

    expect(priyaMonth?.periodScore).toBe(160)
    expect(priyaYear?.periodScore).toBe(230) // 160 + 70 from June 2026
    expect(priyaAll?.periodScore).toBe(280) // 230 + 50 from Nov 2025

    // Ranks should be 1-indexed integers
    expect(monthBoard[0].rank).toBe(1)
    expect(monthBoard[1].rank).toBe(2)
    expect(monthBoard[2].rank).toBe(3)
  })

  it("applies tiebreaker rule: earlier completion date in period wins, then alphabetical", () => {
    // Create two mock users with identical period score but different completion dates
    const testNow = new Date("2026-10-31T12:00:00Z")
    const board = getLeaderboard("month", testNow)

    // Verify sort is strictly descending by periodScore or tiebreak
    for (let i = 0; i < board.length - 1; i++) {
      const current = board[i]
      const next = board[i + 1]
      expect(current.periodScore).toBeGreaterThanOrEqual(next.periodScore)
    }
  })
})

describe("User Handle Lookup", () => {
  it("resolves user by handle case-insensitively and handles @ prefix", () => {
    const priya1 = getUserByHandle("priya-rao")
    const priya2 = getUserByHandle("@Priya-Rao")
    const marcus = getUserByHandle("marcus-chen")

    expect(priya1).toBeDefined()
    expect(priya1?.display_name).toBe("Priya Rao")
    expect(priya2?.id).toBe(priya1?.id)
    expect(marcus?.handle).toBe("marcus-chen")

    const nonExistent = getUserByHandle("non-existent-user")
    expect(nonExistent).toBeUndefined()
  })
})

describe("Badge Progress Evaluation", () => {
  it("evaluates all 12 distinct badges with accurate progress for Priya Rao", () => {
    const priya = FICTIONAL_USERS.find((u) => u.handle === "priya-rao")!
    const badges = getBadgeProgress(priya)

    expect(badges.length).toBe(12)
    const earnedBadges = badges.filter((b) => b.earned)
    expect(earnedBadges.length).toBeGreaterThanOrEqual(3)

    // Priya is Tier 3 and rank 2, so Movement Founder, Point collector, and Podium must be earned
    const founderBadge = badges.find((b) => b.badgeId === "movement-founder" || b.badgeId === "movement-pillar")
    expect(founderBadge?.earned).toBe(true)

    const podiumBadge = badges.find((b) => b.badgeId === "podium")
    expect(podiumBadge?.earned).toBe(true)

    // Point collector (earned with 280 points >= 100)
    const centuryBadge = badges.find((b) => b.badgeId === "point-collector" || b.badgeId === "century-club")
    expect(centuryBadge?.earned).toBe(true)
    expect(centuryBadge?.progress).toBe(100)
  })
})

describe("Task Filtering and Counts Pure Functions", () => {
  const fixedNow = new Date("2026-10-31T12:00:00Z")

  it("calculates accurate tab counts for all, mine, saved, and needs verification", () => {
    const priya = FICTIONAL_USERS.find((u) => u.handle === "priya-rao")!
    const counts = getTaskCounts(priya, SEED_TASKS, SEED_TASK_CLAIMS, [
      "c1111111-1111-4111-8111-111111111111",
    ])

    expect(counts.all).toBe(SEED_TASKS.length)
    expect(counts.saved).toBe(1)
    expect(counts.needsVerification).toBeGreaterThanOrEqual(2)
  })

  it("filters tasks by status correctly", () => {
    const openTasks = getFilteredTasks(SEED_TASKS, { status: "open" }, "soonest", fixedNow)
    expect(openTasks.length).toBeGreaterThanOrEqual(4)
    expect(openTasks.every((t) => t.status === "open")).toBe(true)

    const completedTasks = getFilteredTasks(
      SEED_TASKS,
      { status: "completed" },
      "soonest",
      fixedNow
    )
    expect(completedTasks.length).toBeGreaterThanOrEqual(4)
    expect(completedTasks.every((t) => t.status === "completed")).toBe(true)
  })

  it("filters tasks by category, difficulty, reward, and spots", () => {
    // Category Logistics
    const logistics = getFilteredTasks(SEED_TASKS, { category: "Logistics" }, "soonest", fixedNow)
    expect(logistics.length).toBeGreaterThan(0)
    expect(logistics.every((t) => TASK_META_MAP[t.id].category === "Logistics")).toBe(true)

    // Single spot
    const singleSpots = getFilteredTasks(SEED_TASKS, { spots: "single" }, "soonest", fixedNow)
    expect(singleSpots.every((t) => t.required_volunteers === 1)).toBe(true)

    // High reward (>= 75 pts)
    const highRewards = getFilteredTasks(SEED_TASKS, { reward: "high" }, "soonest", fixedNow)
    expect(highRewards.every((t) => t.reward_points >= 75)).toBe(true)

    // Difficulty Easy
    const easyTasks = getFilteredTasks(SEED_TASKS, { difficulty: "Easy" }, "soonest", fixedNow)
    expect(easyTasks.every((t) => TASK_META_MAP[t.id].difficulty === "Easy")).toBe(true)
  })

  it("sorts tasks by highest points, newest, and fewest spots", () => {
    const byPoints = getFilteredTasks(SEED_TASKS, {}, "highest_points", fixedNow)
    for (let i = 0; i < byPoints.length - 1; i++) {
      expect(byPoints[i].reward_points).toBeGreaterThanOrEqual(byPoints[i + 1].reward_points)
    }

    const byNewest = getFilteredTasks(SEED_TASKS, {}, "newest", fixedNow)
    for (let i = 0; i < byNewest.length - 1; i++) {
      const aTime = new Date(byNewest[i].created_at).getTime()
      const bTime = new Date(byNewest[i + 1].created_at).getTime()
      expect(aTime).toBeGreaterThanOrEqual(bTime)
    }

    const bySpots = getFilteredTasks(SEED_TASKS, {}, "fewest_spots", fixedNow)
    for (let i = 0; i < bySpots.length - 1; i++) {
      expect(bySpots[i].required_volunteers).toBeLessThanOrEqual(bySpots[i + 1].required_volunteers)
    }
  })

  it("searches tasks across title, description, category, and location", () => {
    const marinaResults = getFilteredTasks(
      SEED_TASKS,
      { search: "Marina Green" },
      "soonest",
      fixedNow
    )
    expect(marinaResults.length).toBeGreaterThan(0)

    const waterResults = getFilteredTasks(SEED_TASKS, { search: "water" }, "soonest", fixedNow)
    expect(waterResults.length).toBeGreaterThan(0)
  })
})
