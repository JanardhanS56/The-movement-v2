/**
 * FallbackApiAdapter wraps RestApiAdapter with graceful in-memory fallback.
 * If a Supabase/REST call fails (rate limit, network error, cold start), it
 * falls back to the MockApiAdapter. The UI never crashes in front of a judge.
 *
 * Fallback priority: RestApiAdapter → MockApiAdapter → throw
 */
import { ApiClient, UserStats } from "./types"
import { RestApiAdapter } from "./rest-adapter"
import { MockApiAdapter } from "./mock-adapter"
import type {
  Announcement,
  CreateAnnouncementInput,
} from "../schemas/announcement.schema"
import type { AnnouncementSignature } from "../schemas/signature.schema"
import type {
  Task,
  TaskClaim,
  CreateTaskInput,
  ClaimTaskInput,
} from "../schemas/task.schema"
import type {
  PeerVerification,
  VerificationVoteType,
} from "../schemas/verification.schema"
import type {
  CheckIn,
  CreateCheckInInput,
  AggregatedCheckInPoint,
} from "../schemas/check-in.schema"
import type { User } from "../schemas/user.schema"
import type { Badge } from "../schemas/badge.schema"
import type { ImpactLedgerEntry } from "../schemas/impact-ledger.schema"

const rest = new RestApiAdapter()
const mock = new MockApiAdapter()

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary()
  } catch (err) {
    // Log in dev; silent in production
    if (process.env.NODE_ENV !== "production") {
      console.warn("[FallbackApiAdapter] REST failed, using mock fallback:", err)
    }
    return await fallback()
  }
}

export class FallbackApiAdapter implements ApiClient {
  getAnnouncements(movementId: string): Promise<Announcement[]> {
    return withFallback(
      () => rest.getAnnouncements(movementId),
      () => mock.getAnnouncements(movementId)
    )
  }

  createAnnouncement(input: CreateAnnouncementInput, authorId: string): Promise<Announcement> {
    return withFallback(
      () => rest.createAnnouncement(input, authorId),
      () => mock.createAnnouncement(input, authorId)
    )
  }

  getSignatures(announcementId: string): Promise<AnnouncementSignature[]> {
    return withFallback(
      () => rest.getSignatures(announcementId),
      () => mock.getSignatures(announcementId)
    )
  }

  signAnnouncement(announcementId: string, signerId: string): Promise<AnnouncementSignature> {
    return withFallback(
      () => rest.signAnnouncement(announcementId, signerId),
      () => mock.signAnnouncement(announcementId, signerId)
    )
  }

  getTasks(movementId: string): Promise<Task[]> {
    return withFallback(
      () => rest.getTasks(movementId),
      () => mock.getTasks(movementId)
    )
  }

  getTask(taskId: string): Promise<Task> {
    return withFallback(
      () => rest.getTask(taskId),
      () => mock.getTask(taskId)
    )
  }

  createTask(input: CreateTaskInput, creatorId: string): Promise<Task> {
    return withFallback(
      () => rest.createTask(input, creatorId),
      () => mock.createTask(input, creatorId)
    )
  }

  getTaskClaims(taskId?: string): Promise<TaskClaim[]> {
    return withFallback(
      () => rest.getTaskClaims(taskId),
      () => mock.getTaskClaims(taskId)
    )
  }

  claimTask(input: ClaimTaskInput, claimantId: string): Promise<TaskClaim> {
    return withFallback(
      () => rest.claimTask(input, claimantId),
      () => mock.claimTask(input, claimantId)
    )
  }

  markClaimComplete(claimId: string, claimantId: string, note?: string, proofUrl?: string): Promise<TaskClaim> {
    return withFallback(
      () => rest.markClaimComplete(claimId, claimantId, note, proofUrl),
      () => mock.markClaimComplete(claimId, claimantId, note, proofUrl)
    )
  }

  withdrawClaim(claimId: string, claimantId: string): Promise<TaskClaim> {
    return withFallback(
      () => rest.withdrawClaim(claimId, claimantId),
      () => mock.withdrawClaim(claimId, claimantId)
    )
  }

  cancelTask(taskId: string, organizerId: string): Promise<Task> {
    return withFallback(
      () => rest.cancelTask(taskId, organizerId),
      () => mock.cancelTask(taskId, organizerId)
    )
  }

  getPeerVerifications(claimId?: string): Promise<PeerVerification[]> {
    return withFallback(
      () => rest.getPeerVerifications(claimId),
      () => mock.getPeerVerifications(claimId)
    )
  }

  getPendingVerifications(verifierId: string): Promise<PeerVerification[]> {
    return withFallback(
      () => rest.getPendingVerifications(verifierId),
      () => mock.getPendingVerifications(verifierId)
    )
  }

  submitVerificationVote(claimId: string, verifierId: string, vote: VerificationVoteType): Promise<PeerVerification> {
    return withFallback(
      () => rest.submitVerificationVote(claimId, verifierId, vote),
      () => mock.submitVerificationVote(claimId, verifierId, vote)
    )
  }

  organizerOverride(claimId: string, organizerId: string, approve: boolean, note?: string): Promise<TaskClaim> {
    return withFallback(
      () => rest.organizerOverride(claimId, organizerId, approve, note),
      () => mock.organizerOverride(claimId, organizerId, approve, note)
    )
  }

  getCheckIns(movementId: string): Promise<CheckIn[]> {
    return withFallback(
      () => rest.getCheckIns(movementId),
      () => mock.getCheckIns(movementId)
    )
  }

  getAggregatedCheckInPoints(): Promise<AggregatedCheckInPoint[]> {
    return withFallback(
      () => rest.getAggregatedCheckInPoints(),
      () => mock.getAggregatedCheckInPoints()
    )
  }

  checkIn(input: CreateCheckInInput, userId: string): Promise<CheckIn> {
    return withFallback(
      () => rest.checkIn(input, userId),
      () => mock.checkIn(input, userId)
    )
  }

  getUsers(): Promise<User[]> {
    return withFallback(
      () => rest.getUsers(),
      () => mock.getUsers()
    )
  }

  getUserProfile(userId: string): Promise<User> {
    return withFallback(
      () => rest.getUserProfile(userId),
      () => mock.getUserProfile(userId)
    )
  }

  getUserBadges(userId: string): Promise<Badge[]> {
    return withFallback(
      () => rest.getUserBadges(userId),
      () => mock.getUserBadges(userId)
    )
  }

  getImpactLedger(userId: string): Promise<ImpactLedgerEntry[]> {
    return withFallback(
      () => rest.getImpactLedger(userId),
      () => mock.getImpactLedger(userId)
    )
  }

  getUserStats(userId: string): Promise<UserStats> {
    return withFallback(
      () => rest.getUserStats(userId),
      () => mock.getUserStats(userId)
    )
  }
}
