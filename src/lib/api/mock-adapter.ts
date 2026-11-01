import { z } from "zod"
import { ApiClient } from "./types"
import { mockStore } from "../mocks/mock-store"
import {
  Announcement,
  AnnouncementSchema,
  CreateAnnouncementInput,
  CreateAnnouncementSchema,
} from "../schemas/announcement.schema"
import {
  AnnouncementSignature,
  AnnouncementSignatureSchema,
} from "../schemas/signature.schema"
import {
  Task,
  TaskSchema,
  CreateTaskInput,
  CreateTaskSchema,
  TaskClaim,
  TaskClaimSchema,
  ClaimTaskInput,
  ClaimTaskSchema,
} from "../schemas/task.schema"
import {
  PeerVerification,
  PeerVerificationSchema,
  VerificationVoteType,
  VerificationVoteTypeSchema,
} from "../schemas/verification.schema"
import {
  CheckIn,
  CheckInSchema,
  CreateCheckInInput,
  CreateCheckInSchema,
  AggregatedCheckInPoint,
  AggregatedCheckInPointSchema,
} from "../schemas/check-in.schema"
import { User, UserSchema } from "../schemas/user.schema"
import { Badge, BadgeSchema } from "../schemas/badge.schema"
import { ImpactLedgerEntry, ImpactLedgerEntrySchema } from "../schemas/impact-ledger.schema"

export class MockApiAdapter implements ApiClient {
  public async getAnnouncements(movementId: string): Promise<Announcement[]> {
    z.string().uuid().parse(movementId)
    const raw = mockStore.getAnnouncements(movementId)
    return z.array(AnnouncementSchema).parse(raw)
  }

  public async createAnnouncement(
    input: CreateAnnouncementInput,
    authorId: string
  ): Promise<Announcement> {
    const validatedInput = CreateAnnouncementSchema.parse(input)
    z.string().uuid().parse(authorId)
    const raw = mockStore.createAnnouncement(validatedInput, authorId)
    return AnnouncementSchema.parse(raw)
  }

  public async getSignatures(announcementId: string): Promise<AnnouncementSignature[]> {
    z.string().uuid().parse(announcementId)
    const raw = mockStore.getSignatures(announcementId)
    return z.array(AnnouncementSignatureSchema).parse(raw)
  }

  public async signAnnouncement(
    announcementId: string,
    signerId: string
  ): Promise<AnnouncementSignature> {
    z.string().uuid().parse(announcementId)
    z.string().uuid().parse(signerId)
    const raw = mockStore.signAnnouncement(announcementId, signerId)
    return AnnouncementSignatureSchema.parse(raw)
  }

  public async getTasks(movementId: string): Promise<Task[]> {
    z.string().uuid().parse(movementId)
    const raw = mockStore.getTasks(movementId)
    return z.array(TaskSchema).parse(raw)
  }

  public async getTask(taskId: string): Promise<Task> {
    z.string().uuid().parse(taskId)
    const raw = mockStore.getTask(taskId)
    if (!raw) throw new Error("Task not found")
    return TaskSchema.parse(raw)
  }

  public async createTask(input: CreateTaskInput, creatorId: string): Promise<Task> {
    const validatedInput = CreateTaskSchema.parse(input)
    z.string().uuid().parse(creatorId)
    const raw = mockStore.createTask(validatedInput, creatorId)
    return TaskSchema.parse(raw)
  }

  public async getTaskClaims(taskId?: string): Promise<TaskClaim[]> {
    if (taskId) z.string().uuid().parse(taskId)
    const raw = mockStore.getTaskClaims(taskId)
    return z.array(TaskClaimSchema).parse(raw)
  }

  public async claimTask(input: ClaimTaskInput, claimantId: string): Promise<TaskClaim> {
    const validatedInput = ClaimTaskSchema.parse(input)
    z.string().uuid().parse(claimantId)
    const raw = mockStore.claimTask(validatedInput, claimantId)
    return TaskClaimSchema.parse(raw)
  }

  public async markClaimComplete(
    claimId: string,
    claimantId: string,
    note?: string
  ): Promise<TaskClaim> {
    z.string().uuid().parse(claimId)
    z.string().uuid().parse(claimantId)
    if (note) z.string().max(500).parse(note)
    const raw = mockStore.markClaimComplete(claimId, claimantId, note)
    return TaskClaimSchema.parse(raw)
  }

  public async getPeerVerifications(claimId?: string): Promise<PeerVerification[]> {
    if (claimId) z.string().uuid().parse(claimId)
    const raw = mockStore.getPeerVerifications(claimId)
    return z.array(PeerVerificationSchema).parse(raw)
  }

  public async getPendingVerifications(verifierId: string): Promise<PeerVerification[]> {
    z.string().uuid().parse(verifierId)
    const raw = mockStore.getPendingVerifications(verifierId)
    return z.array(PeerVerificationSchema).parse(raw)
  }

  public async submitVerificationVote(
    claimId: string,
    verifierId: string,
    vote: VerificationVoteType
  ): Promise<PeerVerification> {
    z.string().uuid().parse(claimId)
    z.string().uuid().parse(verifierId)
    const validatedVote = VerificationVoteTypeSchema.parse(vote)
    const raw = mockStore.submitVerificationVote(claimId, verifierId, validatedVote)
    return PeerVerificationSchema.parse(raw)
  }

  public async organizerOverride(
    claimId: string,
    organizerId: string,
    approve: boolean,
    note?: string
  ): Promise<TaskClaim> {
    z.string().uuid().parse(claimId)
    z.string().uuid().parse(organizerId)
    z.boolean().parse(approve)
    if (note) z.string().max(500).parse(note)
    const raw = mockStore.organizerOverride(claimId, organizerId, approve, note)
    return TaskClaimSchema.parse(raw)
  }

  public async getCheckIns(movementId: string): Promise<CheckIn[]> {
    z.string().uuid().parse(movementId)
    const raw = mockStore.getCheckIns(movementId)
    return z.array(CheckInSchema).parse(raw)
  }

  public async getAggregatedCheckInPoints(): Promise<AggregatedCheckInPoint[]> {
    const raw = mockStore.getAggregatedCheckInPoints()
    return z.array(AggregatedCheckInPointSchema).parse(raw)
  }

  public async checkIn(input: CreateCheckInInput, userId: string): Promise<CheckIn> {
    const validatedInput = CreateCheckInSchema.parse(input)
    z.string().uuid().parse(userId)
    const raw = mockStore.checkIn(validatedInput, userId)
    return CheckInSchema.parse(raw)
  }

  public async getUsers(): Promise<User[]> {
    const raw = mockStore.getUsers()
    return z.array(UserSchema).parse(raw)
  }

  public async getUserProfile(userId: string): Promise<User> {
    z.string().uuid().parse(userId)
    const raw = mockStore.getUser(userId)
    if (!raw) throw new Error("User profile not found")
    return UserSchema.parse(raw)
  }

  public async getUserBadges(userId: string): Promise<Badge[]> {
    z.string().uuid().parse(userId)
    const raw = mockStore.getUserBadges(userId)
    return z.array(BadgeSchema).parse(raw)
  }

  public async getImpactLedger(userId: string): Promise<ImpactLedgerEntry[]> {
    z.string().uuid().parse(userId)
    const raw = mockStore.getImpactLedger(userId)
    return z.array(ImpactLedgerEntrySchema).parse(raw)
  }
}
