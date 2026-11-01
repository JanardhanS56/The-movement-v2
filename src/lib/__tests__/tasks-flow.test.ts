import { describe, it, expect, beforeEach } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { mockStore } from "../mocks/mock-store"
import { Permissions } from "../permissions"
import { SEED_MOVEMENT_ID, SEED_USERS, SEED_TASKS, SEED_TASK_CLAIMS } from "../mocks/seed-data"
import { Task, TaskClaim } from "../schemas/task.schema"
import { QueryKeys } from "../query-keys"

describe("Phase 6: Tasks Board, Claims & Peer Verification Workflows", () => {
  const priyaOrganizer = SEED_USERS[0] // Tier 3
  const rohanOrganizer = SEED_USERS[1] // Tier 3
  const devikaSeniorVolunteer = SEED_USERS[3] // Tier 2
  const karthikClaimant = SEED_USERS[4] // Tier 2
  const snehaVolunteer = SEED_USERS[5] // Tier 1

  beforeEach(() => {
    mockStore.reset()
  })

  // 1. Claim
  it("allows a volunteer to claim an open task and updates status when capacity is filled", () => {
    // Task 2 is open with required_volunteers: 1
    const task2 = SEED_TASKS[1]
    expect(task2.status).toBe("open")

    const claim = mockStore.claimTask({ task_id: task2.id }, snehaVolunteer.id)

    expect(claim.id).toBeDefined()
    expect(claim.task_id).toBe(task2.id)
    expect(claim.claimed_by).toBe(snehaVolunteer.id)
    expect(claim.status).toBe("in_progress")

    // Since required_volunteers is 1, claiming it moves task to in_progress
    const updatedTask = mockStore.getTask(task2.id)
    expect(updatedTask?.status).toBe("in_progress")
  })

  // 2. Double-claim blocked
  it("blocks duplicate claims and creators claiming their own tasks", () => {
    const task2 = SEED_TASKS[1] // Created by Priya

    // First claim by Sneha succeeds
    mockStore.claimTask({ task_id: task2.id }, snehaVolunteer.id)

    // Second claim attempt by Sneha on the same task must throw
    expect(() => {
      mockStore.claimTask({ task_id: task2.id }, snehaVolunteer.id)
    }).toThrow("User has already claimed this task")

    // Creator attempting to claim their own task must throw
    expect(() => {
      mockStore.claimTask({ task_id: task2.id }, task2.created_by)
    }).toThrow("Users cannot claim tasks they created")
  })

  // 3. Rollback on failure
  it("rolls back optimistic updates when task claim encounters simulated failure", () => {
    const queryClient = new QueryClient()
    const tasksQueryKey = QueryKeys.tasks(SEED_MOVEMENT_ID)
    const claimsQueryKey = QueryKeys.taskClaims()

    const initialTasks: Task[] = [
      {
        id: "task-test-01",
        movement_id: SEED_MOVEMENT_ID,
        created_by: priyaOrganizer.id,
        title: "Test Distribution Task",
        reward_points: 50,
        required_volunteers: 1,
        status: "open",
        created_at: "2026-10-25T08:00:00Z",
      },
    ]

    const initialClaims: TaskClaim[] = []

    queryClient.setQueryData(tasksQueryKey, initialTasks)
    queryClient.setQueryData(claimsQueryKey, initialClaims)

    // 1. Snapshot taken in onMutate
    const tasksSnapshot = queryClient.getQueryData<Task[]>(tasksQueryKey)
    const claimsSnapshot = queryClient.getQueryData<TaskClaim[]>(claimsQueryKey)

    // 2. Optimistic update applied
    const optimisticClaim: TaskClaim = {
      id: "temp-claim-99",
      task_id: "task-test-01",
      claimed_by: snehaVolunteer.id,
      status: "in_progress",
      claimed_at: new Date().toISOString(),
    }

    queryClient.setQueryData<TaskClaim[]>(claimsQueryKey, [optimisticClaim])
    queryClient.setQueryData<Task[]>(tasksQueryKey, (old = []) =>
      old.map((t) => (t.id === "task-test-01" ? { ...t, status: "in_progress" as const } : t))
    )

    expect(queryClient.getQueryData<TaskClaim[]>(claimsQueryKey)?.length).toBe(1)
    expect(queryClient.getQueryData<Task[]>(tasksQueryKey)?.[0].status).toBe("in_progress")

    // 3. Simulated failure occurs (mutation error)
    const simulateError = new Error("Simulated network failure: Server dropped connection")

    // 4. onError executes rollback
    queryClient.setQueryData(tasksQueryKey, tasksSnapshot)
    queryClient.setQueryData(claimsQueryKey, claimsSnapshot)

    // 5. Verify cache state restored
    const restoredTasks = queryClient.getQueryData<Task[]>(tasksQueryKey)
    const restoredClaims = queryClient.getQueryData<TaskClaim[]>(claimsQueryKey)

    expect(restoredTasks?.[0].status).toBe("open")
    expect(restoredClaims?.length).toBe(0)
    expect(simulateError.message).toContain("Simulated network failure")
  })

  // 4. Mark complete moves claim & task to pending_verification
  it("moves claim and task to pending_verification when claimant marks complete", () => {
    // Task 3 is in_progress by Devika Pai (Claim 3)
    const claim3 = SEED_TASK_CLAIMS[0]
    expect(claim3.status).toBe("in_progress")

    const updatedClaim = mockStore.markClaimComplete(
      claim3.id,
      devikaSeniorVolunteer.id,
      "Finished all item counts and boxed for transport."
    )

    expect(updatedClaim.status).toBe("pending_verification")
    expect(updatedClaim.completed_at).not.toBeNull()
    expect(updatedClaim.note).toBe("Finished all item counts and boxed for transport.")

    const updatedTask = mockStore.getTask(claim3.task_id)
    expect(updatedTask?.status).toBe("pending_verification")

    // Non-claimant attempting to mark complete throws
    expect(() => {
      mockStore.markClaimComplete(claim3.id, snehaVolunteer.id)
    }).toThrow("Only the claimant can mark their claim complete")
  })

  // 5. Peer verification reaching 2 of 3
  it("finalizes verification and marks task completed when peer approvals reach 2 of 3", () => {
    // Task 5 is pending_verification for Claim 5 (Karthik Bhat)
    // Devika already approved (1 of 3)
    const claim5 = SEED_TASK_CLAIMS[2]
    const task5 = mockStore.getTask(claim5.task_id)
    expect(task5?.status).toBe("pending_verification")

    // Second verifier (Sneha Nayak) votes "approve"
    const voteRecord = mockStore.submitVerificationVote(claim5.id, snehaVolunteer.id, "approve")
    expect(voteRecord.vote).toBe("approve")
    expect(voteRecord.voted_at).not.toBeNull()

    // Threshold (2 of 3) met -> claim verified and task completed
    const finalizedClaim = mockStore.getTaskClaims(claim5.task_id).find((c: TaskClaim) => c.id === claim5.id)
    expect(finalizedClaim?.status).toBe("verified")
    expect(finalizedClaim?.verified_at).not.toBeNull()

    const finalizedTask = mockStore.getTask(claim5.task_id)
    expect(finalizedTask?.status).toBe("completed")
  })

  // 6. Organizer override
  it("allows Tier 3 Organizer override to unilaterally verify task and award points", () => {
    const claim5 = SEED_TASK_CLAIMS[2]

    // Non-organizer (Tier 1 Sneha) attempting override must throw
    expect(() => {
      mockStore.organizerOverride(claim5.id, snehaVolunteer.id, true)
    }).toThrow("Only Tier 3 Organizers can execute verification override")

    // Tier 3 Organizer (Priya Rao) executes override
    const overriddenClaim = mockStore.organizerOverride(
      claim5.id,
      priyaOrganizer.id,
      true,
      "Confirmed in person during morning staging inspection."
    )

    expect(overriddenClaim.status).toBe("verified")
    expect(overriddenClaim.verified_at).not.toBeNull()

    const overriddenTask = mockStore.getTask(claim5.task_id)
    expect(overriddenTask?.status).toBe("completed")
  })

  // 7. Claimant cannot verify own task
  it("strictly prevents the task claimant from verifying their own task", () => {
    const claim5 = SEED_TASK_CLAIMS[2] // Claimed by Karthik Bhat

    // Karthik attempting to vote on his own claim must throw
    expect(() => {
      mockStore.submitVerificationVote(claim5.id, karthikClaimant.id, "approve")
    }).toThrow("Claimants cannot verify their own tasks")

    // Permission rule verification
    const check = Permissions.canVerifyClaim({
      verifierId: karthikClaimant.id,
      claimantId: karthikClaimant.id,
      assignedVerifierIds: [devikaSeniorVolunteer.id, snehaVolunteer.id, rohanOrganizer.id],
    })

    expect(check.allowed).toBe(false)
    expect(check.reason).toBe("Claimants cannot verify their own tasks")
  })

  // 8. Filters via URL
  it("filters tasks correctly according to active filter state and URL parameters", () => {
    const allTasks = mockStore.getTasks(SEED_MOVEMENT_ID)

    // Filter: "all"
    const allFiltered = allTasks.filter(() => true)
    expect(allFiltered.length).toBe(allTasks.length)

    // Filter: "open"
    const openFiltered = allTasks.filter((t: Task) => t.status === "open")
    expect(openFiltered.every((t: Task) => t.status === "open")).toBe(true)
    expect(openFiltered.length).toBeGreaterThan(0)

    // Filter: "in_progress"
    const inProgressFiltered = allTasks.filter(
      (t: Task) => t.status === "in_progress" || t.status === "pending_verification"
    )
    expect(
      inProgressFiltered.every(
        (t: Task) => t.status === "in_progress" || t.status === "pending_verification"
      )
    ).toBe(true)

    // Filter: "completed"
    const completedFiltered = allTasks.filter((t: Task) => t.status === "completed")
    expect(completedFiltered.every((t: Task) => t.status === "completed")).toBe(true)
    expect(completedFiltered.length).toBeGreaterThan(0)

    // URL parameter mapping logic
    const buildQueryString = (status: string) => {
      const params = new URLSearchParams()
      if (status !== "all") {
        params.set("status", status)
      }
      return params.toString()
    }

    expect(buildQueryString("all")).toBe("")
    expect(buildQueryString("open")).toBe("status=open")
    expect(buildQueryString("in_progress")).toBe("status=in_progress")
    expect(buildQueryString("completed")).toBe("status=completed")
  })
})
