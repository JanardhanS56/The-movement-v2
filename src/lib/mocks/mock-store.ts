import {
  SEED_MOVEMENT,
  SEED_USERS,
  SEED_ANNOUNCEMENTS,
  SEED_SIGNATURES,
  SEED_TASKS,
  SEED_TASK_CLAIMS,
  SEED_PEER_VERIFICATIONS,
  SEED_BADGES,
  SEED_IMPACT_ENTRIES,
  SEED_RAW_CHECK_INS,
  SEED_CHECK_IN_POINTS,
} from "./seed-data"
import { User } from "../schemas/user.schema"
import { Movement } from "../schemas/movement.schema"
import { Announcement, CreateAnnouncementInput } from "../schemas/announcement.schema"
import { AnnouncementSignature } from "../schemas/signature.schema"
import { Task, TaskClaim, CreateTaskInput, ClaimTaskInput } from "../schemas/task.schema"
import { PeerVerification, VerificationVoteType } from "../schemas/verification.schema"
import { CheckIn, CreateCheckInInput, AggregatedCheckInPoint } from "../schemas/check-in.schema"
import { Badge } from "../schemas/badge.schema"
import { ImpactLedgerEntry } from "../schemas/impact-ledger.schema"
import { AUTHOR_AUTO_SIGNS, Permissions, VERIFICATION_RULES } from "../permissions"

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

class MockStore {
  private users: User[] = []
  private movements: Movement[] = []
  private announcements: Announcement[] = []
  private signatures: AnnouncementSignature[] = []
  private tasks: Task[] = []
  private taskClaims: TaskClaim[] = []
  private peerVerifications: PeerVerification[] = []
  private checkIns: CheckIn[] = []
  private badges: Badge[] = []
  private impactLedger: ImpactLedgerEntry[] = []

  constructor() {
    this.reset()
  }

  /**
   * Restores all in-memory collections to initial seed data state.
   */
  public reset(): void {
    this.movements = [clone(SEED_MOVEMENT)]
    this.users = clone(SEED_USERS)
    this.announcements = clone(SEED_ANNOUNCEMENTS)
    this.signatures = clone(SEED_SIGNATURES)
    this.tasks = clone(SEED_TASKS)
    this.taskClaims = clone(SEED_TASK_CLAIMS)
    this.peerVerifications = clone(SEED_PEER_VERIFICATIONS)
    this.checkIns = clone(SEED_RAW_CHECK_INS)
    this.badges = clone(SEED_BADGES)
    this.impactLedger = clone(SEED_IMPACT_ENTRIES)
  }

  // --- Users & Profiles ---
  public getUser(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId)
  }

  public getUsers(): User[] {
    return clone(this.users)
  }

  // --- Announcements & Signatures ---
  public getAnnouncements(movementId: string): Announcement[] {
    return clone(this.announcements.filter((a) => a.movement_id === movementId))
  }

  public getSignatures(announcementId: string): AnnouncementSignature[] {
    return clone(this.signatures.filter((s) => s.announcement_id === announcementId))
  }

  public createAnnouncement(input: CreateAnnouncementInput, authorId: string): Announcement {
    const author = this.getUser(authorId)
    if (!author) throw new Error("Author not found")
    if (!Permissions.canCreateAnnouncement(author.tier)) {
      throw new Error("Only Tier 3 Organizers can create announcements")
    }

    const now = new Date().toISOString()
    const announcementId = generateUuid()
    const newAnnouncement: Announcement = {
      id: announcementId,
      movement_id: input.movement_id,
      created_by: authorId,
      title: input.title,
      body: input.body,
      required_signatures: input.required_signatures,
      is_published: false,
      published_at: null,
      created_at: now,
    }

    this.announcements.unshift(newAnnouncement)

    // Author auto-signs as signature 1
    if (AUTHOR_AUTO_SIGNS) {
      this.signatures.push({
        id: generateUuid(),
        announcement_id: announcementId,
        signed_by: authorId,
        signed_at: now,
      })

      // Check if threshold is 1
      if (newAnnouncement.required_signatures <= 1) {
        newAnnouncement.is_published = true
        newAnnouncement.published_at = now
      }
    }

    return clone(newAnnouncement)
  }

  public signAnnouncement(announcementId: string, signerId: string): AnnouncementSignature {
    const announcement = this.announcements.find((a) => a.id === announcementId)
    if (!announcement) throw new Error("Announcement not found")

    const signer = this.getUser(signerId)
    if (!signer) throw new Error("Signer not found")

    const existingSignerIds = this.signatures
      .filter((s) => s.announcement_id === announcementId)
      .map((s) => s.signed_by)

    const check = Permissions.canSignAnnouncement({
      userId: signerId,
      tier: signer.tier,
      existingSignerIds,
    })

    if (!check.allowed) {
      throw new Error(check.reason)
    }

    const now = new Date().toISOString()
    const newSignature: AnnouncementSignature = {
      id: generateUuid(),
      announcement_id: announcementId,
      signed_by: signerId,
      signed_at: now,
    }

    this.signatures.push(newSignature)

    const updatedSigCount = existingSignerIds.length + 1
    if (updatedSigCount >= announcement.required_signatures) {
      announcement.is_published = true
      announcement.published_at = now
    }

    return clone(newSignature)
  }

  // --- Tasks & Claims ---
  public getTasks(movementId: string): Task[] {
    return clone(this.tasks.filter((t) => t.movement_id === movementId))
  }

  public getTask(taskId: string): Task | undefined {
    return this.tasks.find((t) => t.id === taskId)
  }

  public createTask(input: CreateTaskInput, creatorId: string): Task {
    const creator = this.getUser(creatorId)
    if (!creator) throw new Error("Creator not found")
    if (!Permissions.canPostTask(creator.tier)) {
      throw new Error("Only Tier 3 Organizers can post tasks")
    }

    const now = new Date().toISOString()
    const newTask: Task = {
      id: generateUuid(),
      movement_id: input.movement_id,
      created_by: creatorId,
      title: input.title,
      description: input.description,
      reward_points: input.reward_points,
      required_volunteers: input.required_volunteers,
      status: "open",
      created_at: now,
    }

    this.tasks.unshift(newTask)
    return clone(newTask)
  }

  public claimTask(input: ClaimTaskInput, claimantId: string): TaskClaim {
    const task = this.getTask(input.task_id)
    if (!task) throw new Error("Task not found")

    const existingClaimants = this.taskClaims
      .filter((c) => c.task_id === input.task_id && c.status !== "withdrawn" && c.status !== "rejected")
      .map((c) => c.claimed_by)

    const check = Permissions.canClaimTask({
      taskCreatedBy: task.created_by,
      claimantId,
      existingClaimants,
      maxVolunteers: task.required_volunteers,
    })

    if (!check.allowed) {
      throw new Error(check.reason)
    }

    const now = new Date().toISOString()
    // A new claim always starts at in_progress
    const newClaim: TaskClaim = {
      id: generateUuid(),
      task_id: input.task_id,
      claimed_by: claimantId,
      status: "in_progress",
      note: input.note || null,
      claimed_at: now,
    }

    this.taskClaims.push(newClaim)

    // Update task status if all slots filled
    if (existingClaimants.length + 1 >= task.required_volunteers) {
      task.status = "in_progress"
    }

    return clone(newClaim)
  }

  public markClaimComplete(claimId: string, claimantId: string, note?: string): TaskClaim {
    const claim = this.taskClaims.find((c) => c.id === claimId)
    if (!claim) throw new Error("Claim not found")

    const check = Permissions.canMarkClaimComplete(claimantId, claim.claimed_by)
    if (!check.allowed) {
      throw new Error(check.reason)
    }

    const now = new Date().toISOString()
    claim.status = "pending_verification"
    claim.completed_at = now
    if (note) claim.note = note

    const task = this.getTask(claim.task_id)
    if (task) {
      task.status = "pending_verification"
    }

    // Assign 3 verifiers excluding claimant
    const eligibleVerifiers = this.users.filter((u) => u.id !== claimantId)
    const shuffled = [...eligibleVerifiers].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, VERIFICATION_RULES.requiredVerifiers)

    const expiry = new Date(Date.now() + VERIFICATION_RULES.expiryHours * 3600000).toISOString()
    for (const verifier of selected) {
      this.peerVerifications.push({
        id: generateUuid(),
        claim_id: claimId,
        verifier_id: verifier.id,
        vote: null,
        voted_at: null,
        assigned_at: now,
        expires_at: expiry,
      })
    }

    return clone(claim)
  }

  public getTaskClaims(taskId?: string): TaskClaim[] {
    if (taskId) {
      return clone(this.taskClaims.filter((c) => c.task_id === taskId))
    }
    return clone(this.taskClaims)
  }

  // --- Verifications ---
  public getPeerVerifications(claimId?: string): PeerVerification[] {
    if (claimId) {
      return clone(this.peerVerifications.filter((v) => v.claim_id === claimId))
    }
    return clone(this.peerVerifications)
  }

  public getPendingVerifications(verifierId: string): PeerVerification[] {
    return clone(this.peerVerifications.filter((v) => v.verifier_id === verifierId && v.vote === null))
  }

  public submitVerificationVote(
    claimId: string,
    verifierId: string,
    vote: VerificationVoteType
  ): PeerVerification {
    const claim = this.taskClaims.find((c) => c.id === claimId)
    if (!claim) throw new Error("Claim not found")

    const assigned = this.peerVerifications.filter((v) => v.claim_id === claimId)
    const assignedIds = assigned.map((v) => v.verifier_id)

    const check = Permissions.canVerifyClaim({
      verifierId,
      claimantId: claim.claimed_by,
      assignedVerifierIds: assignedIds,
    })

    if (!check.allowed) {
      throw new Error(check.reason)
    }

    const verificationRecord = assigned.find((v) => v.verifier_id === verifierId)
    if (!verificationRecord) throw new Error("Verification record not found")

    const now = new Date().toISOString()
    verificationRecord.vote = vote
    verificationRecord.voted_at = now

    // Check consensus
    const allClaimVotes = this.peerVerifications.filter((v) => v.claim_id === claimId)
    const approvals = allClaimVotes.filter((v) => v.vote === "approve").length
    const rejections = allClaimVotes.filter((v) => v.vote === "reject").length

    if (approvals >= VERIFICATION_RULES.approvalThreshold) {
      this.finalizeClaimVerification(claim, "peer_vote")
    } else if (rejections > VERIFICATION_RULES.requiredVerifiers - VERIFICATION_RULES.approvalThreshold) {
      claim.status = "rejected"
    }

    return clone(verificationRecord)
  }

  public organizerOverride(
    claimId: string,
    organizerId: string,
    approve: boolean,
    note?: string
  ): TaskClaim {
    const organizer = this.getUser(organizerId)
    if (!organizer || !Permissions.canOrganizerOverride(organizer.tier)) {
      throw new Error("Only Tier 3 Organizers can execute verification override")
    }

    const claim = this.taskClaims.find((c) => c.id === claimId)
    if (!claim) throw new Error("Claim not found")

    if (note) {
      claim.note = note
    }

    if (approve) {
      this.finalizeClaimVerification(claim, "organizer_override", organizerId)
    } else {
      claim.status = "rejected"
    }

    return clone(claim)
  }

  private finalizeClaimVerification(
    claim: TaskClaim,
    method: "peer_vote" | "organizer_override",
    organizerId?: string
  ): void {
    const now = new Date().toISOString()
    claim.status = "verified"
    claim.verified_at = now

    const task = this.getTask(claim.task_id)
    if (task) {
      task.status = "completed"
    }

    const organizer = organizerId ? this.getUser(organizerId) : undefined
    const detail =
      method === "peer_vote"
        ? `Verified by ${VERIFICATION_RULES.requiredVerifiers} peers`
        : `Verified by ${organizer?.display_name || "Organizer"}`

    // Issue badge
    this.badges.push({
      id: generateUuid(),
      user_id: claim.claimed_by,
      claim_id: claim.id,
      badge_type: "task_complete",
      badge_label: task?.title ? `${task.title} Champion` : "Task Champion",
      issued_by: method,
      issued_by_user: organizerId || null,
      awarded_at: now,
    })

    // Record impact ledger entry
    this.impactLedger.unshift({
      id: generateUuid(),
      user_id: claim.claimed_by,
      task_id: claim.task_id,
      task_title: task?.title || "Community Task",
      verification_method: method,
      verified_by_detail: detail,
      reward_points: task?.reward_points || 50,
      verified_at: now,
    })
  }

  // --- Check-Ins ---
  public getCheckIns(movementId: string): CheckIn[] {
    return clone(this.checkIns.filter((c) => c.movement_id === movementId))
  }

  public getAggregatedCheckInPoints(): AggregatedCheckInPoint[] {
    return clone(SEED_CHECK_IN_POINTS)
  }

  public checkIn(input: CreateCheckInInput, userId: string): CheckIn {
    const now = new Date().toISOString()
    const newCheckIn: CheckIn = {
      id: generateUuid(),
      movement_id: input.movement_id,
      user_id: userId,
      lat: Number(input.lat.toFixed(3)),
      lng: Number(input.lng.toFixed(3)),
      accuracy: input.accuracy,
      checked_in_at: now,
    }

    this.checkIns.unshift(newCheckIn)
    return clone(newCheckIn)
  }

  // --- Badges & Impact Ledger ---
  public getUserBadges(userId: string): Badge[] {
    return clone(this.badges.filter((b) => b.user_id === userId))
  }

  public getImpactLedger(userId: string): ImpactLedgerEntry[] {
    return clone(this.impactLedger.filter((e) => e.user_id === userId))
  }

  public getUserStats(userId: string): {
    tasksCompleted: number
    announcementsSigned: number
    checkInsCount: number
    impactPoints: number
  } {
    const userLedger = this.impactLedger.filter((e) => e.user_id === userId)
    const tasksCompleted = userLedger.length
    const announcementsSigned = this.signatures.filter((s) => s.signed_by === userId).length
    const checkInsCount = this.checkIns.filter((c) => c.user_id === userId).length
    const impactPoints = userLedger.reduce((sum, e) => sum + (e.reward_points || 0), 0)

    return {
      tasksCompleted,
      announcementsSigned,
      checkInsCount,
      impactPoints,
    }
  }
}

export const mockStore = new MockStore()
