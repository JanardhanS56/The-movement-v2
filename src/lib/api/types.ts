import {
  Announcement,
  CreateAnnouncementInput,
} from "../schemas/announcement.schema"
import { AnnouncementSignature } from "../schemas/signature.schema"
import { Task, TaskClaim, CreateTaskInput, ClaimTaskInput } from "../schemas/task.schema"
import { PeerVerification, VerificationVoteType } from "../schemas/verification.schema"
import { CheckIn, CreateCheckInInput, AggregatedCheckInPoint } from "../schemas/check-in.schema"
import { User } from "../schemas/user.schema"
import { Badge } from "../schemas/badge.schema"
import { ImpactLedgerEntry } from "../schemas/impact-ledger.schema"

export interface ApiClient {
  // Announcements & Signatures
  getAnnouncements(movementId: string): Promise<Announcement[]>
  createAnnouncement(input: CreateAnnouncementInput, authorId: string): Promise<Announcement>
  getSignatures(announcementId: string): Promise<AnnouncementSignature[]>
  signAnnouncement(announcementId: string, signerId: string): Promise<AnnouncementSignature>

  // Tasks & Claims
  getTasks(movementId: string): Promise<Task[]>
  getTask(taskId: string): Promise<Task>
  createTask(input: CreateTaskInput, creatorId: string): Promise<Task>
  getTaskClaims(taskId?: string): Promise<TaskClaim[]>
  claimTask(input: ClaimTaskInput, claimantId: string): Promise<TaskClaim>
  markClaimComplete(claimId: string, claimantId: string, note?: string): Promise<TaskClaim>

  // Verifications
  getPeerVerifications(claimId?: string): Promise<PeerVerification[]>
  getPendingVerifications(verifierId: string): Promise<PeerVerification[]>
  submitVerificationVote(
    claimId: string,
    verifierId: string,
    vote: VerificationVoteType
  ): Promise<PeerVerification>
  organizerOverride(
    claimId: string,
    organizerId: string,
    approve: boolean,
    note?: string
  ): Promise<TaskClaim>

  // Check-ins
  getCheckIns(movementId: string): Promise<CheckIn[]>
  getAggregatedCheckInPoints(): Promise<AggregatedCheckInPoint[]>
  checkIn(input: CreateCheckInInput, userId: string): Promise<CheckIn>

  // Profiles, Badges & Impact Ledger
  getUsers(): Promise<User[]>
  getUserProfile(userId: string): Promise<User>
  getUserBadges(userId: string): Promise<Badge[]>
  getImpactLedger(userId: string): Promise<ImpactLedgerEntry[]>
}
