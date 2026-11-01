import { ApiClient, UserStats } from "./types"
import {
  Announcement,
  AnnouncementSchema,
  CreateAnnouncementInput,
} from "../schemas/announcement.schema"
import {
  AnnouncementSignature,
  AnnouncementSignatureSchema,
} from "../schemas/signature.schema"
import {
  Task,
  TaskSchema,
  CreateTaskInput,
  TaskClaim,
  TaskClaimSchema,
  ClaimTaskInput,
} from "../schemas/task.schema"
import {
  PeerVerification,
  PeerVerificationSchema,
  VerificationVoteType,
} from "../schemas/verification.schema"
import {
  CheckIn,
  CheckInSchema,
  CreateCheckInInput,
  AggregatedCheckInPoint,
  AggregatedCheckInPointSchema,
} from "../schemas/check-in.schema"
import { User, UserSchema } from "../schemas/user.schema"
import { Badge, BadgeSchema } from "../schemas/badge.schema"
import {
  ImpactLedgerEntry,
  ImpactLedgerEntrySchema,
} from "../schemas/impact-ledger.schema"

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json")
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `HTTP error ${res.status}`)
  }

  return json.data as T
}

export class RestApiAdapter implements ApiClient {
  public async getAnnouncements(movementId: string): Promise<Announcement[]> {
    const data = await request<Announcement[]>(
      `/api/announcements?movementId=${encodeURIComponent(movementId)}`
    )
    return (data || []).map((a) => AnnouncementSchema.parse(a))
  }

  public async createAnnouncement(
    input: CreateAnnouncementInput,
    authorId: string
  ): Promise<Announcement> {
    const data = await request<Announcement>("/api/announcements", {
      method: "POST",
      headers: { "x-user-id": authorId },
      body: JSON.stringify(input),
    })
    return AnnouncementSchema.parse(data)
  }

  public async getSignatures(announcementId: string): Promise<AnnouncementSignature[]> {
    const data = await request<AnnouncementSignature[]>(
      `/api/announcements/${encodeURIComponent(announcementId)}/signatures`
    )
    return (data || []).map((s) => AnnouncementSignatureSchema.parse(s))
  }

  public async signAnnouncement(
    announcementId: string,
    signerId: string
  ): Promise<AnnouncementSignature> {
    const data = await request<{ signature: AnnouncementSignature }>(
      `/api/announcements/${encodeURIComponent(announcementId)}/sign`,
      {
        method: "POST",
        headers: { "x-user-id": signerId },
        body: JSON.stringify({}),
      }
    )
    return AnnouncementSignatureSchema.parse(data.signature)
  }

  public async getTasks(movementId: string): Promise<Task[]> {
    const data = await request<Task[]>(
      `/api/tasks?movementId=${encodeURIComponent(movementId)}`
    )
    return (data || []).map((t) => TaskSchema.parse(t))
  }

  public async getTask(taskId: string): Promise<Task> {
    const data = await request<Task>(`/api/tasks/${encodeURIComponent(taskId)}`)
    return TaskSchema.parse(data)
  }

  public async createTask(input: CreateTaskInput, creatorId: string): Promise<Task> {
    const data = await request<Task>("/api/tasks", {
      method: "POST",
      headers: { "x-user-id": creatorId },
      body: JSON.stringify(input),
    })
    return TaskSchema.parse(data)
  }

  public async getTaskClaims(taskId?: string): Promise<TaskClaim[]> {
    const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : ""
    const data = await request<TaskClaim[]>(`/api/tasks/claims${query}`)
    return (data || []).map((c) => TaskClaimSchema.parse(c))
  }

  public async claimTask(input: ClaimTaskInput, claimantId: string): Promise<TaskClaim> {
    const data = await request<TaskClaim>(
      `/api/tasks/${encodeURIComponent(input.task_id)}/claim`,
      {
        method: "POST",
        headers: { "x-user-id": claimantId },
        body: JSON.stringify(input),
      }
    )
    return TaskClaimSchema.parse(data)
  }

  public async markClaimComplete(
    claimId: string,
    claimantId: string,
    note?: string
  ): Promise<TaskClaim> {
    const data = await request<{ claim: TaskClaim }>(
      `/api/tasks/${encodeURIComponent(claimId)}/complete`,
      {
        method: "POST",
        headers: { "x-user-id": claimantId },
        body: JSON.stringify({ note }),
      }
    )
    return TaskClaimSchema.parse(data.claim)
  }

  public async getPeerVerifications(claimId?: string): Promise<PeerVerification[]> {
    const query = claimId ? `?claimId=${encodeURIComponent(claimId)}` : ""
    const data = await request<PeerVerification[]>(`/api/verifications${query}`)
    return (data || []).map((v) => PeerVerificationSchema.parse(v))
  }

  public async getPendingVerifications(verifierId: string): Promise<PeerVerification[]> {
    const data = await request<PeerVerification[]>(
      `/api/verifications/pending?verifierId=${encodeURIComponent(verifierId)}`
    )
    return (data || []).map((v) => PeerVerificationSchema.parse(v))
  }

  public async submitVerificationVote(
    claimId: string,
    verifierId: string,
    vote: VerificationVoteType
  ): Promise<PeerVerification> {
    const data = await request<PeerVerification>(
      `/api/verifications/${encodeURIComponent(claimId)}/vote`,
      {
        method: "POST",
        headers: { "x-user-id": verifierId },
        body: JSON.stringify({ vote }),
      }
    )
    return PeerVerificationSchema.parse(data)
  }

  public async organizerOverride(
    claimId: string,
    organizerId: string,
    approve: boolean,
    note?: string
  ): Promise<TaskClaim> {
    const data = await request<TaskClaim>(
      `/api/tasks/${encodeURIComponent(claimId)}/organizer-verify`,
      {
        method: "POST",
        headers: { "x-user-id": organizerId },
        body: JSON.stringify({ approve, note }),
      }
    )
    return TaskClaimSchema.parse(data)
  }

  public async getCheckIns(movementId: string): Promise<CheckIn[]> {
    const data = await request<{ check_ins?: CheckIn[]; points?: unknown }>(
      `/api/checkins?movementId=${encodeURIComponent(movementId)}`
    )
    const list = Array.isArray(data) ? data : data.check_ins || []
    return list.map((c) => CheckInSchema.parse(c))
  }

  public async getAggregatedCheckInPoints(): Promise<AggregatedCheckInPoint[]> {
    const data = await request<{ points: AggregatedCheckInPoint[] }>("/api/checkins")
    const points = data?.points || []
    return points.map((p) => AggregatedCheckInPointSchema.parse(p))
  }

  public async checkIn(input: CreateCheckInInput, userId: string): Promise<CheckIn> {
    const data = await request<{ check_in: CheckIn }>("/api/checkins", {
      method: "POST",
      headers: { "x-user-id": userId },
      body: JSON.stringify(input),
    })
    return CheckInSchema.parse(data.check_in)
  }

  public async getUsers(): Promise<User[]> {
    const data = await request<User[]>("/api/users")
    return (data || []).map((u) => UserSchema.parse(u))
  }

  public async getUserProfile(userId: string): Promise<User> {
    const data = await request<User>(`/api/users?userId=${encodeURIComponent(userId)}`)
    return UserSchema.parse(data)
  }

  public async getUserBadges(userId: string): Promise<Badge[]> {
    const data = await request<Badge[]>(`/api/badges/${encodeURIComponent(userId)}`)
    return (data || []).map((b) => BadgeSchema.parse(b))
  }

  public async getImpactLedger(userId: string): Promise<ImpactLedgerEntry[]> {
    const data = await request<{ ledger: ImpactLedgerEntry[] }>(
      `/api/impact?userId=${encodeURIComponent(userId)}`
    )
    return (data?.ledger || []).map((e) => ImpactLedgerEntrySchema.parse(e))
  }

  public async getUserStats(userId: string): Promise<UserStats> {
    const data = await request<{
      stats: {
        tasks_completed: number
        badges_earned: number
        check_ins_count: number
        total_impact_points: number
      }
    }>(`/api/impact?userId=${encodeURIComponent(userId)}`)

    const s = data?.stats
    return {
      tasksCompleted: s?.tasks_completed || 0,
      announcementsSigned: s?.badges_earned || 0,
      checkInsCount: s?.check_ins_count || 0,
      impactPoints: s?.total_impact_points || 0,
    }
  }
}
