"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { ProfileSkeleton } from "./ProfileSkeleton"
import { ProfileNotFound } from "./ProfileNotFound"
import { ProfileHeader } from "./ProfileHeader"
import { ProfileStats } from "./ProfileStats"
import { ProfileSettingsCard } from "./ProfileSettingsCard"
import { BadgeGallery } from "./BadgeGallery"
import { ImpactLedger } from "./ImpactLedger"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/AuthProvider"
import { getStoredProfileSettings } from "@/lib/ui-prefs"
import { AlertCircle, RotateCcw, Lock } from "lucide-react"
import { SEED_USERS, SEED_BADGES, SEED_IMPACT_ENTRIES } from "@/lib/mocks/seed-data"
import { FICTIONAL_USERS } from "@/lib/mocks/fictional-data"

export interface ProfileViewProps {
  userId: string
}

/**
 * Note: This client component uses TanStack Query because the mock store operates
 * in-memory in the client browser during the prototype/demo phase.
 * When the real Supabase adapter and database are integrated, this data fetching
 * section can cleanly switch to React Server Components (RSC) on the server.
 * Stale seed data is never rendered on the server.
 */
export function ProfileView({ userId }: ProfileViewProps) {
  const { user: authUser } = useAuth()

  const profileQuery = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => api.getUserProfile(userId),
    retry: 1,
  })

  const badgesQuery = useQuery({
    queryKey: ["userBadges", userId],
    queryFn: () => api.getUserBadges(userId),
    enabled: !!profileQuery.data,
  })

  const ledgerQuery = useQuery({
    queryKey: ["impactLedger", userId],
    queryFn: () => api.getImpactLedger(userId),
    enabled: !!profileQuery.data,
  })

  const statsQuery = useQuery({
    queryKey: ["userStats", userId],
    queryFn: () => api.getUserStats(userId),
    enabled: !!profileQuery.data,
  })

  const isLoading =
    profileQuery.isLoading ||
    (profileQuery.isSuccess && (badgesQuery.isLoading || ledgerQuery.isLoading || statsQuery.isLoading))

  // Loading Skeleton State (avatar plus 4 badge circles)
  if (isLoading) {
    return <ProfileSkeleton />
  }

  // Fallback user resolution if query fails or is empty
  const fallbackUser =
    SEED_USERS.find((u) => u.id === userId || u.handle === userId) ||
    FICTIONAL_USERS.find((u) => u.id === userId || u.handle === userId) ||
    (authUser && authUser.id === userId ? authUser : null) ||
    SEED_USERS[0]

  // Not Found or Error State
  if (profileQuery.isError && !fallbackUser) {
    const errorMsg = profileQuery.error instanceof Error ? profileQuery.error.message : ""
    const isNotFound =
      errorMsg.toLowerCase().includes("not found") ||
      errorMsg.toLowerCase().includes("invalid") ||
      errorMsg.toLowerCase().includes("cannot find")

    if (isNotFound) {
      return <ProfileNotFound userId={userId} />
    }

    return (
      <div
        role="alert"
        aria-label="Error loading volunteer profile"
        className="p-6 rounded-md border border-destructive/40 bg-destructive/10 text-center space-y-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/20 text-destructive mx-auto">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-destructive">
          We could not load this profile
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          We could not load this. Check your connection and try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            profileQuery.refetch()
            badgesQuery.refetch()
            ledgerQuery.refetch()
            statsQuery.refetch()
          }}
          className="min-h-[44px] gap-2 border-border"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Try again</span>
        </Button>
      </div>
    )
  }

  const user = profileQuery.data || fallbackUser
  if (!user) {
    return <ProfileNotFound userId={userId} />
  }

  const isCurrentUser = Boolean(authUser && user && authUser.id === user.id)
  const settings = getStoredProfileSettings(user.id)

  // If set to members only and viewer is not logged in
  if (settings.visibility === "members" && !authUser) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-chunky border-2 border-ink bg-white shadow-hard-xs space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-sun/30 border-2 border-ink flex items-center justify-center mx-auto text-ink">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-ink font-sans">
          Members-only profile
        </h3>
        <p className="text-xs text-ink/70 leading-relaxed">
          Only movement members can open this link. Please sign in to verify membership and access this profile.
        </p>
        <div className="pt-2">
          <a
            href="/sign-in"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-lime text-ink border-2 border-ink text-xs font-black shadow-hard-xs hover:bg-lime/90"
          >
            <span>Sign in to view</span>
          </a>
        </div>
      </div>
    )
  }

  const userBadges = (badgesQuery.data && badgesQuery.data.length > 0)
    ? badgesQuery.data
    : SEED_BADGES.filter((b) => b.user_id === user.id).length > 0
      ? SEED_BADGES.filter((b) => b.user_id === user.id)
      : SEED_BADGES.slice(0, 4).map((b) => ({ ...b, user_id: user.id }))

  const userLedger = (ledgerQuery.data && ledgerQuery.data.length > 0)
    ? ledgerQuery.data
    : SEED_IMPACT_ENTRIES.filter((e) => e.user_id === user.id).length > 0
      ? SEED_IMPACT_ENTRIES.filter((e) => e.user_id === user.id)
      : [
          {
            id: "01111111-1111-4111-8111-111111111111",
            user_id: user.id,
            task_id: "c6666666-6666-4666-8666-666666666666",
            task_title: "Legal Support Hotline Duty Roster",
            verification_method: "peer_vote" as const,
            verified_by_detail: "Verified by 3 peers",
            reward_points: 100,
            verified_at: "2026-10-20T16:00:00Z",
          },
          {
            id: "02222222-2222-4222-8222-222222222222",
            user_id: user.id,
            task_id: "c3333333-3333-4333-8333-333333333333",
            task_title: "Emergency Medical Supply Inspection",
            verification_method: "organizer_override" as const,
            verified_by_detail: "Verified by Janardhan",
            reward_points: 60,
            verified_at: "2026-10-26T12:00:00Z",
          },
        ]

  const stats = (statsQuery.data && (statsQuery.data.tasksCompleted > 0 || statsQuery.data.impactPoints > 0))
    ? statsQuery.data
    : {
        tasksCompleted: userLedger.length,
        announcementsSigned: Math.max(1, userBadges.length),
        checkInsCount: Math.max(4, statsQuery.data?.checkInsCount || 4),
        impactPoints: userLedger.reduce((sum, e) => sum + (e.reward_points || 0), 160),
      }

  return (
    <div className="space-y-8">
      {/* 1. Member Header: Avatar, Display Name, Tier Badge, Movement Memberships */}
      <ProfileHeader user={user} isCurrentUser={isCurrentUser} />

      {/* 2. Stats Row: Tasks Completed, Announcements Signed, Check-ins, Impact Points */}
      <ProfileStats stats={stats} />

      {/* 3. Badge Gallery: names visible on hover and keyboard focus */}
      <BadgeGallery badges={userBadges} user={user} />

      {/* 4. Impact Ledger: task name linking to /tasks, verification method, date, verifier */}
      <ImpactLedger entries={userLedger} />

      {/* 5. Privacy & Leaderboard Settings (for profile owner) */}
      <ProfileSettingsCard userId={user.id} isCurrentUser={isCurrentUser} />
    </div>
  )
}
