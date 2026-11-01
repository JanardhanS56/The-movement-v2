import { demoNow } from "./clock"
import { Task, TaskClaim, TaskStatus } from "../schemas/task.schema"
import { User } from "../schemas/user.schema"
import { Movement } from "../schemas/movement.schema"
import { SEED_MOVEMENT, SEED_MOVEMENT_ID } from "./seed-data"

export type TaskCategory = "Setup" | "Outreach" | "Cleanup" | "Safety" | "Logistics"
export type TaskDifficulty = "Easy" | "Medium" | "Hard"

export interface TaskMetadata {
  category: TaskCategory
  estimatedMinutes: number
  locationLabel: string
  difficulty: TaskDifficulty
}

export interface CompletedTaskRecord {
  taskId: string
  completedAt: string
  rewardPoints: number
}

export interface DemoUser extends User {
  handle: string
  showOnLeaderboards: boolean
  stats: {
    tasksCompleted: number
    hoursContributed: number
    impactScore: number
    rank: number
  }
  earnedBadgeIds: string[]
  completedTasks: CompletedTaskRecord[]
  movement_id: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  handle: string
  displayName: string
  avatarUrl: string | null
  tier: 1 | 2 | 3
  periodScore: number
  periodCompletions: number
  hoursContributed: number
  isCurrentUser?: boolean
  latestCompletionAt?: string
}

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  category: "participation" | "action" | "community" | "leadership"
  maxProgress: number
  unit?: string
  evaluate: (user: DemoUser | User, completedTasks: CompletedTaskRecord[]) => { earned: boolean; progress: number }
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-step",
    name: "First step",
    description: "Complete your first verified task",
    category: "action",
    maxProgress: 1,
    unit: "task",
    evaluate: (user, tasks) => {
      const demoUser = user as DemoUser
      const count = demoUser.stats?.tasksCompleted || tasks.length || 0
      const earned = count >= 1 || demoUser.earnedBadgeIds?.includes("first-step") || demoUser.earnedBadgeIds?.includes("first-response") || false
      return { earned, progress: Math.min(count, 1) }
    },
  },
  {
    id: "getting-going",
    name: "Getting going",
    description: "Complete 5 community tasks",
    category: "action",
    maxProgress: 5,
    unit: "tasks",
    evaluate: (user, tasks) => {
      const demoUser = user as DemoUser
      const count = demoUser.stats?.tasksCompleted || tasks.length || 0
      const earned = count >= 5 || demoUser.earnedBadgeIds?.includes("getting-going") || demoUser.earnedBadgeIds?.includes("water-bearer") || false
      return { earned, progress: Math.min(count, 5) }
    },
  },
  {
    id: "task-master",
    name: "Task master",
    description: "Complete 15 community tasks",
    category: "action",
    maxProgress: 15,
    unit: "tasks",
    evaluate: (user, tasks) => {
      const demoUser = user as DemoUser
      const count = demoUser.stats?.tasksCompleted || tasks.length || 0
      const earned = count >= 15 || demoUser.earnedBadgeIds?.includes("task-master") || false
      return { earned, progress: Math.min(count, 15) }
    },
  },
  {
    id: "point-collector",
    name: "Point collector",
    description: "Earn 100 impact points",
    category: "leadership",
    maxProgress: 100,
    unit: "points",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const pts = demoUser.stats?.impactScore || 0
      const earned = pts >= 100 || demoUser.earnedBadgeIds?.includes("point-collector") || demoUser.earnedBadgeIds?.includes("century-club") || false
      return { earned, progress: Math.min(pts, 100) }
    },
  },
  {
    id: "point-hero",
    name: "Point hero",
    description: "Earn 500 impact points",
    category: "leadership",
    maxProgress: 500,
    unit: "points",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const pts = demoUser.stats?.impactScore || 0
      const earned = pts >= 500 || demoUser.earnedBadgeIds?.includes("point-hero") || false
      return { earned, progress: Math.min(pts, 500) }
    },
  },
  {
    id: "field-eyes",
    name: "Field eyes",
    description: "Record 5 field check-ins",
    category: "action",
    maxProgress: 5,
    unit: "check-ins",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const count = (demoUser.metadata?.checkInsCount as number) || (demoUser.tier === 3 ? 5 : 3)
      const earned = count >= 5 || demoUser.earnedBadgeIds?.includes("field-eyes") || demoUser.earnedBadgeIds?.includes("mapmaker") || false
      return { earned, progress: Math.min(count, 5) }
    },
  },
  {
    id: "co-signer",
    name: "Co-signer",
    description: "Co-sign 3 movement announcements",
    category: "community",
    maxProgress: 3,
    unit: "signatures",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const count = (demoUser.metadata?.announcementsSigned as number) || (demoUser.tier >= 2 ? 4 : 2)
      const earned = count >= 3 || demoUser.earnedBadgeIds?.includes("co-signer") || demoUser.earnedBadgeIds?.includes("megaphone") || false
      return { earned, progress: Math.min(count, 3) }
    },
  },
  {
    id: "team-player",
    name: "Team player",
    description: "Verify 3 tasks for others",
    category: "community",
    maxProgress: 3,
    unit: "tasks",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const count = (demoUser.metadata?.verificationsCount as number) || (demoUser.tier >= 2 ? 4 : 1)
      const earned = count >= 3 || demoUser.earnedBadgeIds?.includes("team-player") || demoUser.earnedBadgeIds?.includes("consensus-builder") || false
      return { earned, progress: Math.min(count, 3) }
    },
  },
  {
    id: "steady-hands",
    name: "Steady hands",
    description: "Complete tasks on 3 different days",
    category: "participation",
    maxProgress: 3,
    unit: "days",
    evaluate: (user, tasks) => {
      const demoUser = user as DemoUser
      const distinctDays = new Set(tasks.map((t) => t.completedAt.slice(0, 10))).size
      const count = Math.max(distinctDays, demoUser.completedTasks?.length ? 3 : 0)
      const earned = count >= 3 || demoUser.earnedBadgeIds?.includes("steady-hands") || demoUser.earnedBadgeIds?.includes("night-watch") || false
      return { earned, progress: Math.min(count, 3) }
    },
  },
  {
    id: "podium",
    name: "Podium",
    description: "Reach monthly top 3 on the leaderboard",
    category: "leadership",
    maxProgress: 3,
    unit: "rank",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const rank = demoUser.stats?.rank || 99
      const earned = rank <= 3 || demoUser.earnedBadgeIds?.includes("podium") || false
      return { earned, progress: earned ? 3 : 0 }
    },
  },
  {
    id: "champion",
    name: "Champion",
    description: "Monthly or yearly top rank champion",
    category: "leadership",
    maxProgress: 1,
    unit: "rank",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const rank = demoUser.stats?.rank || 99
      const earned = rank === 1 || demoUser.earnedBadgeIds?.includes("champion") || false
      return { earned, progress: earned ? 1 : 0 }
    },
  },
  {
    id: "movement-founder",
    name: "Movement Founder",
    description: "Movement founder status",
    category: "leadership",
    maxProgress: 1,
    unit: "status",
    evaluate: (user) => {
      const demoUser = user as DemoUser
      const isFounder = demoUser.tier === 3 || demoUser.earnedBadgeIds?.includes("movement-founder") || demoUser.earnedBadgeIds?.includes("movement-pillar") || false
      return { earned: isFounder, progress: isFounder ? 1 : 0 }
    },
  },
]

export const TASK_META_MAP: Record<string, TaskMetadata> = {
  // 1
  "c1111111-1111-4111-8111-111111111111": {
    category: "Logistics",
    estimatedMinutes: 45,
    locationLabel: "Marina Green",
    difficulty: "Easy",
  },
  // 2
  "c2222222-2222-4222-8222-222222222222": {
    category: "Setup",
    estimatedMinutes: 60,
    locationLabel: "North Beach",
    difficulty: "Medium",
  },
  // 3
  "c3333333-3333-4333-8333-333333333333": {
    category: "Safety",
    estimatedMinutes: 30,
    locationLabel: "Mission Plaza",
    difficulty: "Easy",
  },
  // 4
  "c4444444-4444-4444-8444-444444444444": {
    category: "Outreach",
    estimatedMinutes: 90,
    locationLabel: "Central Square",
    difficulty: "Medium",
  },
  // 5
  "c5555555-5555-4555-8555-555555555555": {
    category: "Logistics",
    estimatedMinutes: 60,
    locationLabel: "Civic Center",
    difficulty: "Medium",
  },
  // 6
  "c6666666-6666-4666-8666-666666666666": {
    category: "Safety",
    estimatedMinutes: 120,
    locationLabel: "Harbor Pier",
    difficulty: "Hard",
  },
  // 7
  "c7777777-7777-4777-8777-777777777777": {
    category: "Cleanup",
    estimatedMinutes: 45,
    locationLabel: "Marina Green",
    difficulty: "Easy",
  },
  // 8
  "c8888888-8888-4888-8888-888888888888": {
    category: "Outreach",
    estimatedMinutes: 90,
    locationLabel: "Sunset Boulevard",
    difficulty: "Hard",
  },
  // 9
  "c9999999-9999-4999-8999-999999999999": {
    category: "Cleanup",
    estimatedMinutes: 60,
    locationLabel: "Ocean Beach",
    difficulty: "Medium",
  },
  // 10
  "caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa": {
    category: "Safety",
    estimatedMinutes: 45,
    locationLabel: "Town Hall",
    difficulty: "Easy",
  },
  // 11
  "cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb": {
    category: "Setup",
    estimatedMinutes: 60,
    locationLabel: "Marina Green",
    difficulty: "Medium",
  },
  // 12
  "cccccccc-cccc-4ccc-8ccc-cccccccccccc": {
    category: "Cleanup",
    estimatedMinutes: 90,
    locationLabel: "North Beach",
    difficulty: "Medium",
  },
  // 13
  "cddddddd-dddd-4ddd-8ddd-dddddddddddd": {
    category: "Outreach",
    estimatedMinutes: 30,
    locationLabel: "Mission Plaza",
    difficulty: "Easy",
  },
  // 14
  "ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee": {
    category: "Logistics",
    estimatedMinutes: 120,
    locationLabel: "Harbor Pier",
    difficulty: "Hard",
  },
}

export function getTaskMetadata(taskId: string): TaskMetadata {
  return (
    TASK_META_MAP[taskId] || {
      category: "Logistics",
      estimatedMinutes: 45,
      locationLabel: "Central Area",
      difficulty: "Easy",
    }
  )
}

export const FICTIONAL_USERS: DemoUser[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    handle: "priya-rao",
    display_name: "Priya Rao",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=PriyaRao",
    tier: 3,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 8,
      hoursContributed: 26,
      impactScore: 280,
      rank: 2,
    },
    earnedBadgeIds: ["first-response", "water-bearer", "movement-pillar", "century-club"],
    completedTasks: [
      {
        taskId: "c6666666-6666-4666-8666-666666666666",
        completedAt: "2026-10-21T10:00:00Z", // this month
        rewardPoints: 100,
      },
      {
        taskId: "cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        completedAt: "2026-10-15T14:30:00Z", // this month
        rewardPoints: 60,
      },
      {
        taskId: "cddddddd-dddd-4ddd-8ddd-dddddddddddd",
        completedAt: "2026-06-12T11:00:00Z", // this year
        rewardPoints: 70,
      },
      {
        taskId: "c1111111-1111-4111-8111-111111111111",
        completedAt: "2025-11-20T09:00:00Z", // all time
        rewardPoints: 50,
      },
    ],
    created_at: "2026-10-01T08:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    handle: "rohan-shetty",
    display_name: "Rohan Shetty",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=RohanShetty",
    tier: 3,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 11,
      hoursContributed: 34,
      impactScore: 340,
      rank: 1,
    },
    earnedBadgeIds: ["movement-pillar", "peacemaker", "century-club", "megaphone"],
    completedTasks: [
      {
        taskId: "cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        completedAt: "2026-10-22T16:00:00Z", // this month
        rewardPoints: 110,
      },
      {
        taskId: "c6666666-6666-4666-8666-666666666666",
        completedAt: "2026-10-10T12:00:00Z", // this month
        rewardPoints: 90,
      },
      {
        taskId: "c4444444-4444-4444-8444-444444444444",
        completedAt: "2026-05-18T10:00:00Z", // this year
        rewardPoints: 80,
      },
      {
        taskId: "c2222222-2222-4222-8222-222222222222",
        completedAt: "2025-10-15T08:00:00Z", // all time
        rewardPoints: 60,
      },
    ],
    created_at: "2026-10-01T08:30:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    handle: "ananya-kamath",
    display_name: "Ananya Kamath",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=AnanyaKamath",
    tier: 3,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 7,
      hoursContributed: 22,
      impactScore: 230,
      rank: 3,
    },
    earnedBadgeIds: ["movement-pillar", "night-watch", "bridge-builder"],
    completedTasks: [
      {
        taskId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        completedAt: "2026-10-24T18:00:00Z", // this month
        rewardPoints: 80,
      },
      {
        taskId: "cddddddd-dddd-4ddd-8ddd-dddddddddddd",
        completedAt: "2026-07-04T15:00:00Z", // this year
        rewardPoints: 80,
      },
      {
        taskId: "c1111111-1111-4111-8111-111111111111",
        completedAt: "2025-12-01T09:00:00Z", // all time
        rewardPoints: 70,
      },
    ],
    created_at: "2026-10-01T09:00:00Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    handle: "devika-pai",
    display_name: "Devika Pai",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=DevikaPai",
    tier: 2,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 6,
      hoursContributed: 18,
      impactScore: 195,
      rank: 4,
    },
    earnedBadgeIds: ["verified-voice", "clean-slate"],
    completedTasks: [
      {
        taskId: "c3333333-3333-4333-8333-333333333333",
        completedAt: "2026-10-19T11:00:00Z",
        rewardPoints: 75,
      },
      {
        taskId: "c6666666-6666-4666-8666-666666666666",
        completedAt: "2026-08-14T09:00:00Z",
        rewardPoints: 60,
      },
      {
        taskId: "cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        completedAt: "2025-09-12T16:00:00Z",
        rewardPoints: 60,
      },
    ],
    created_at: "2026-10-05T10:00:00Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    handle: "karthik-bhat",
    display_name: "Karthik Bhat",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=KarthikBhat",
    tier: 2,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 5,
      hoursContributed: 15,
      impactScore: 160,
      rank: 5,
    },
    earnedBadgeIds: ["verified-voice", "consensus-builder"],
    completedTasks: [
      {
        taskId: "c4444444-4444-4444-8444-444444444444",
        completedAt: "2026-10-18T10:30:00Z",
        rewardPoints: 65,
      },
      {
        taskId: "c5555555-5555-4555-8555-555555555555",
        completedAt: "2026-04-10T14:00:00Z",
        rewardPoints: 50,
      },
      {
        taskId: "c8888888-8888-4888-8888-888888888888",
        completedAt: "2025-10-05T10:00:00Z",
        rewardPoints: 45,
      },
    ],
    created_at: "2026-10-06T11:00:00Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    handle: "sneha-nayak",
    display_name: "Sneha Nayak",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=SnehaNayak",
    tier: 1,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 4,
      hoursContributed: 12,
      impactScore: 130,
      rank: 6,
    },
    earnedBadgeIds: ["first-response"],
    completedTasks: [
      {
        taskId: "c2222222-2222-4222-8222-222222222222",
        completedAt: "2026-10-16T15:00:00Z",
        rewardPoints: 50,
      },
      {
        taskId: "c1111111-1111-4111-8111-111111111111",
        completedAt: "2026-06-20T12:00:00Z",
        rewardPoints: 40,
      },
      {
        taskId: "c7777777-7777-4777-8777-777777777777",
        completedAt: "2025-11-15T09:00:00Z",
        rewardPoints: 40,
      },
    ],
    created_at: "2026-10-10T12:00:00Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    handle: "vikram-alva",
    display_name: "Vikram Alva",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=VikramAlva",
    tier: 1,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: false, // Hidden from leaderboards to test toggle
    stats: {
      tasksCompleted: 3,
      hoursContributed: 9,
      impactScore: 90,
      rank: 7,
    },
    earnedBadgeIds: [],
    completedTasks: [
      {
        taskId: "c1111111-1111-4111-8111-111111111111",
        completedAt: "2026-10-14T08:00:00Z",
        rewardPoints: 40,
      },
      {
        taskId: "c3333333-3333-4333-8333-333333333333",
        completedAt: "2026-03-12T10:00:00Z",
        rewardPoints: 50,
      },
    ],
    created_at: "2026-10-12T14:00:00Z",
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    handle: "marcus-chen",
    display_name: "Marcus Chen",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=MarcusChen",
    tier: 2,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 4,
      hoursContributed: 13,
      impactScore: 125,
      rank: 8,
    },
    earnedBadgeIds: ["verified-voice", "water-bearer"],
    completedTasks: [
      {
        taskId: "c8888888-8888-4888-8888-888888888888",
        completedAt: "2026-10-17T11:00:00Z",
        rewardPoints: 60,
      },
      {
        taskId: "c6666666-6666-4666-8666-666666666666",
        completedAt: "2026-05-22T13:00:00Z",
        rewardPoints: 65,
      },
    ],
    created_at: "2026-10-13T10:00:00Z",
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    handle: "tariq-mansour",
    display_name: "Tariq Mansour",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=TariqMansour",
    tier: 1,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 3,
      hoursContributed: 8,
      impactScore: 85,
      rank: 9,
    },
    earnedBadgeIds: ["mapmaker"],
    completedTasks: [
      {
        taskId: "c5555555-5555-4555-8555-555555555555",
        completedAt: "2026-10-12T16:00:00Z",
        rewardPoints: 45,
      },
      {
        taskId: "c2222222-2222-4222-8222-222222222222",
        completedAt: "2026-02-14T09:00:00Z",
        rewardPoints: 40,
      },
    ],
    created_at: "2026-10-15T09:00:00Z",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    handle: "elena-rostova",
    display_name: "Elena Rostova",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=ElenaRostova",
    tier: 1,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 2,
      hoursContributed: 6,
      impactScore: 60,
      rank: 10,
    },
    earnedBadgeIds: [],
    completedTasks: [
      {
        taskId: "c1111111-1111-4111-8111-111111111111",
        completedAt: "2026-10-11T14:00:00Z",
        rewardPoints: 30,
      },
      {
        taskId: "c7777777-7777-4777-8777-777777777777",
        completedAt: "2026-04-05T11:00:00Z",
        rewardPoints: 30,
      },
    ],
    created_at: "2026-10-16T11:00:00Z",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    handle: "zainab-hashmi",
    display_name: "Zainab Hashmi",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=ZainabHashmi",
    tier: 2,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 2,
      hoursContributed: 5,
      impactScore: 55,
      rank: 11,
    },
    earnedBadgeIds: ["verified-voice"],
    completedTasks: [
      {
        taskId: "c4444444-4444-4444-8444-444444444444",
        completedAt: "2026-10-08T09:30:00Z",
        rewardPoints: 25,
      },
      {
        taskId: "c2222222-2222-4222-8222-222222222222",
        completedAt: "2026-03-22T14:00:00Z",
        rewardPoints: 30,
      },
    ],
    created_at: "2026-10-17T15:00:00Z",
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    handle: "lucas-silva",
    display_name: "Lucas Silva",
    avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=LucasSilva",
    tier: 1,
    movement_id: "00000000-0000-4000-8000-000000000001",
    showOnLeaderboards: true,
    stats: {
      tasksCompleted: 1,
      hoursContributed: 3,
      impactScore: 40,
      rank: 12,
    },
    earnedBadgeIds: [],
    completedTasks: [
      {
        taskId: "c8888888-8888-4888-8888-888888888888",
        completedAt: "2026-10-05T12:00:00Z",
        rewardPoints: 40,
      },
    ],
    created_at: "2026-10-18T16:00:00Z",
  },
]

export type LeaderboardPeriod = "month" | "year" | "all"

/**
 * Computes deterministic leaderboard entries for the given period.
 * Filters out users who have opted out of leaderboards.
 * Sorts by score descending, with tiebreak on earliest completion date in the period, then alphabetical.
 */
export function getLeaderboard(
  period: LeaderboardPeriod,
  now: Date = demoNow(),
  currentUserId?: string
): LeaderboardEntry[] {
  const eligibleUsers = FICTIONAL_USERS.filter((u) => u.showOnLeaderboards !== false)
  const nowMs = now.getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const currentYear = now.getUTCFullYear()

  const entries: (LeaderboardEntry & { earliestCompletionMs: number })[] = eligibleUsers.map((user) => {
    let periodScore = 0
    let periodCompletions = 0
    let latestCompletionAt: string | undefined
    let earliestCompletionMs = Infinity

    user.completedTasks.forEach((record) => {
      const taskDate = new Date(record.completedAt)
      const taskMs = taskDate.getTime()
      let inPeriod = false

      if (period === "month") {
        inPeriod = taskMs >= nowMs - thirtyDaysMs && taskMs <= nowMs
      } else if (period === "year") {
        inPeriod = taskDate.getUTCFullYear() === currentYear && taskMs <= nowMs
      } else {
        // all time
        inPeriod = taskMs <= nowMs
      }

      if (inPeriod) {
        periodScore += record.rewardPoints
        periodCompletions += 1
        if (!latestCompletionAt || taskMs > new Date(latestCompletionAt).getTime()) {
          latestCompletionAt = record.completedAt
        }
        if (taskMs < earliestCompletionMs) {
          earliestCompletionMs = taskMs
        }
      }
    })

    return {
      rank: 0,
      userId: user.id,
      handle: user.handle,
      displayName: user.display_name,
      avatarUrl: user.avatar_url || null,
      tier: user.tier as 1 | 2 | 3,
      periodScore,
      periodCompletions,
      hoursContributed: Math.round(periodCompletions * 2.8),
      isCurrentUser: currentUserId ? user.id === currentUserId : user.handle === "priya-rao",
      latestCompletionAt,
      earliestCompletionMs,
    }
  })

  // Sort descending by periodScore
  // Tiebreak 1: Earliest completion date in period (seniority in the period)
  // Tiebreak 2: Alphabetical by displayName
  entries.sort((a, b) => {
    if (b.periodScore !== a.periodScore) {
      return b.periodScore - a.periodScore
    }
    if (a.earliestCompletionMs !== b.earliestCompletionMs) {
      return a.earliestCompletionMs - b.earliestCompletionMs
    }
    return a.displayName.localeCompare(b.displayName)
  })

  // Assign ranks
  return entries.map((entry, idx) => ({
    rank: idx + 1,
    userId: entry.userId,
    handle: entry.handle,
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
    tier: entry.tier,
    periodScore: entry.periodScore,
    periodCompletions: entry.periodCompletions,
    hoursContributed: entry.hoursContributed,
    isCurrentUser: entry.isCurrentUser,
    latestCompletionAt: entry.latestCompletionAt,
  }))
}

export function getUserByHandle(handle: string): DemoUser | undefined {
  const normalized = handle.toLowerCase().replace(/^@/, "").trim()
  return FICTIONAL_USERS.find(
    (u) => u.handle.toLowerCase() === normalized || u.id === normalized
  )
}

export function getBadgeProgress(user: DemoUser | User) {
  const demoUser = (FICTIONAL_USERS.find((u) => u.id === user.id) || user) as DemoUser
  const completedTasks = demoUser.completedTasks || []

  return BADGE_DEFINITIONS.map((def) => {
    const { earned, progress } = def.evaluate(demoUser, completedTasks)
    return {
      badgeId: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      earned,
      progress,
      maxProgress: def.maxProgress,
      unit: def.unit || "tasks",
    }
  })
}

export interface TaskCounts {
  all: number
  mine: number
  saved: number
  needsVerification: number
}

export function getTaskCounts(
  user: User | null | undefined,
  tasks: Task[],
  claims: TaskClaim[] = [],
  savedTaskIds: string[] = []
): TaskCounts {
  const currentUserId = user?.id

  let mineCount = 0
  let needsVerificationCount = 0

  tasks.forEach((t) => {
    const claim = claims.find((c) => c.task_id === t.id)
    if (currentUserId && claim && claim.claimed_by === currentUserId) {
      mineCount++
    }
    if (currentUserId && t.created_by === currentUserId) {
      mineCount++
    }
    if (t.status === "pending_verification") {
      needsVerificationCount++
    }
  })

  return {
    all: tasks.length,
    mine: mineCount,
    saved: savedTaskIds.length,
    needsVerification: needsVerificationCount,
  }
}

export interface TaskFilterOptions {
  search?: string
  status?: TaskStatus | "all"
  category?: TaskCategory | "all"
  reward?: "all" | "high" | "medium" | "low"
  spots?: "all" | "single" | "multi"
  when?: "all" | "today" | "this_week"
  difficulty?: TaskDifficulty | "all"
}

export type TaskSortOption = "soonest" | "highest_points" | "newest" | "fewest_spots"

export function getFilteredTasks(
  tasks: Task[],
  filters: TaskFilterOptions,
  sort: TaskSortOption = "soonest",
  now: Date = demoNow()
): Task[] {
  const nowMs = now.getTime()
  const oneDayMs = 24 * 60 * 60 * 1000
  const sevenDaysMs = 7 * oneDayMs

  const filtered = tasks.filter((task) => {
    const meta = getTaskMetadata(task.id)

    // Search query: match title, description, or locationLabel
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim()
      const titleMatch = task.title.toLowerCase().includes(q)
      const descMatch = (task.description || "").toLowerCase().includes(q)
      const locMatch = meta.locationLabel.toLowerCase().includes(q)
      const catMatch = meta.category.toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !locMatch && !catMatch) {
        return false
      }
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      if (task.status !== filters.status) return false
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      if (meta.category !== filters.category) return false
    }

    // Reward filter
    if (filters.reward && filters.reward !== "all") {
      if (filters.reward === "high" && task.reward_points < 75) return false
      if (filters.reward === "medium" && (task.reward_points < 40 || task.reward_points >= 75)) return false
      if (filters.reward === "low" && task.reward_points >= 40) return false
    }

    // Spots filter
    if (filters.spots && filters.spots !== "all") {
      if (filters.spots === "single" && task.required_volunteers !== 1) return false
      if (filters.spots === "multi" && task.required_volunteers <= 1) return false
    }

    // When filter
    if (filters.when && filters.when !== "all") {
      const createdMs = new Date(task.created_at).getTime()
      const diffMs = nowMs - createdMs
      if (filters.when === "today" && diffMs > oneDayMs) return false
      if (filters.when === "this_week" && diffMs > sevenDaysMs) return false
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== "all") {
      if (meta.difficulty !== filters.difficulty) return false
    }

    return true
  })

  // Sort
  return filtered.sort((a, b) => {
    const metaA = getTaskMetadata(a.id)
    const metaB = getTaskMetadata(b.id)

    if (sort === "highest_points") {
      return b.reward_points - a.reward_points
    }
    if (sort === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sort === "fewest_spots") {
      return a.required_volunteers - b.required_volunteers
    }
    // "soonest" / urgency default: pending_verification first, then in_progress, open, completed
    const statusOrder: Record<TaskStatus, number> = {
      pending_verification: 1,
      in_progress: 2,
      open: 3,
      completed: 4,
      cancelled: 5,
    }
    const orderDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
    if (orderDiff !== 0) return orderDiff

    // Then estimated minutes
    return metaA.estimatedMinutes - metaB.estimatedMinutes
  })
}

export const FICTIONAL_MOVEMENTS: Movement[] = [
  SEED_MOVEMENT,
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Metro Solidarity Network",
    description: "Decentralized mutual aid and civic coordination across urban metro districts.",
    slug: "metro-solidarity-network",
    is_active: true,
    created_by: "22222222-2222-4222-8222-222222222222",
    created_at: "2026-10-02T10:00:00Z",
  },
]

export function getActiveMovementId(): string {
  if (typeof window === "undefined") return SEED_MOVEMENT_ID
  try {
    return sessionStorage.getItem("the-movement:active-movement-id") || SEED_MOVEMENT_ID
  } catch {
    return SEED_MOVEMENT_ID
  }
}

export function setActiveMovementId(id: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem("the-movement:active-movement-id", id)
  } catch {}
}
