import { ApiClient, UserStats } from "./types"
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

export class NotImplementedError extends Error {
  constructor(methodName: string) {
    super(
      `Supabase adapter method '${methodName}' is not implemented. Real backend operations are strictly off-limits in the frontend scope.`
    )
    this.name = "NotImplementedError"
  }
}

export class SupabaseStubAdapter implements ApiClient {
  public async getAnnouncements(movementId: string): Promise<Announcement[]> {
    void movementId
    throw new NotImplementedError("getAnnouncements")
  }

  public async createAnnouncement(
    input: CreateAnnouncementInput,
    authorId: string
  ): Promise<Announcement> {
    void input
    void authorId
    throw new NotImplementedError("createAnnouncement")
  }

  public async getSignatures(announcementId: string): Promise<AnnouncementSignature[]> {
    void announcementId
    throw new NotImplementedError("getSignatures")
  }

  public async signAnnouncement(
    announcementId: string,
    signerId: string
  ): Promise<AnnouncementSignature> {
    void announcementId
    void signerId
    throw new NotImplementedError("signAnnouncement")
  }

  public async getTasks(movementId: string): Promise<Task[]> {
    void movementId
    throw new NotImplementedError("getTasks")
  }

  public async getTask(taskId: string): Promise<Task> {
    void taskId
    throw new NotImplementedError("getTask")
  }

  public async createTask(input: CreateTaskInput, creatorId: string): Promise<Task> {
    void input
    void creatorId
    throw new NotImplementedError("createTask")
  }

  public async getTaskClaims(taskId?: string): Promise<TaskClaim[]> {
    void taskId
    throw new NotImplementedError("getTaskClaims")
  }

  public async claimTask(input: ClaimTaskInput, claimantId: string): Promise<TaskClaim> {
    void input
    void claimantId
    throw new NotImplementedError("claimTask")
  }

  public async markClaimComplete(
    claimId: string,
    claimantId: string,
    note?: string,
    proofUrl?: string
  ): Promise<TaskClaim> {
    void claimId
    void claimantId
    void note
    void proofUrl
    throw new NotImplementedError("markClaimComplete")
  }

  public async withdrawClaim(claimId: string, claimantId: string): Promise<TaskClaim> {
    void claimId
    void claimantId
    throw new NotImplementedError("withdrawClaim")
  }

  public async cancelTask(taskId: string, organizerId: string): Promise<Task> {
    void taskId
    void organizerId
    throw new NotImplementedError("cancelTask")
  }

  public async getPeerVerifications(claimId?: string): Promise<PeerVerification[]> {
    void claimId
    throw new NotImplementedError("getPeerVerifications")
  }

  public async getPendingVerifications(verifierId: string): Promise<PeerVerification[]> {
    void verifierId
    throw new NotImplementedError("getPendingVerifications")
  }

  public async submitVerificationVote(
    claimId: string,
    verifierId: string,
    vote: VerificationVoteType
  ): Promise<PeerVerification> {
    void claimId
    void verifierId
    void vote
    throw new NotImplementedError("submitVerificationVote")
  }

  public async organizerOverride(
    claimId: string,
    organizerId: string,
    approve: boolean,
    note?: string
  ): Promise<TaskClaim> {
    void claimId
    void organizerId
    void approve
    void note
    throw new NotImplementedError("organizerOverride")
  }

  public async getCheckIns(movementId: string): Promise<CheckIn[]> {
    void movementId
    throw new NotImplementedError("getCheckIns")
  }

  public async getAggregatedCheckInPoints(): Promise<AggregatedCheckInPoint[]> {
    throw new NotImplementedError("getAggregatedCheckInPoints")
  }

  public async checkIn(input: CreateCheckInInput, userId: string): Promise<CheckIn> {
    void input
    void userId
    throw new NotImplementedError("checkIn")
  }

  public async getUsers(): Promise<User[]> {
    throw new NotImplementedError("getUsers")
  }

  public async getUserProfile(userId: string): Promise<User> {
    void userId
    throw new NotImplementedError("getUserProfile")
  }

  public async getUserBadges(userId: string): Promise<Badge[]> {
    void userId
    throw new NotImplementedError("getUserBadges")
  }

  public async getImpactLedger(userId: string): Promise<ImpactLedgerEntry[]> {
    void userId
    throw new NotImplementedError("getImpactLedger")
  }

  public async getUserStats(userId: string): Promise<UserStats> {
    void userId
    throw new NotImplementedError("getUserStats")
  }
}
