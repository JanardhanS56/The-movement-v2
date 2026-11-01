"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { ProfileSkeleton } from "./ProfileSkeleton"
import { ProfileNotFound } from "./ProfileNotFound"
import { ProfileHeader } from "./ProfileHeader"
import { ProfileStats } from "./ProfileStats"
import { BadgeGallery } from "./BadgeGallery"
import { ImpactLedger } from "./ImpactLedger"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw } from "lucide-react"

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

  // Not Found or Error State
  if (profileQuery.isError) {
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

  const user = profileQuery.data
  if (!user) {
    return <ProfileNotFound userId={userId} />
  }

  const badges = badgesQuery.data || []
  const ledger = ledgerQuery.data || []
  const stats = statsQuery.data || {
    tasksCompleted: ledger.length,
    announcementsSigned: 0,
    checkInsCount: 0,
    impactPoints: ledger.reduce((sum, e) => sum + (e.reward_points || 0), 0),
  }

  return (
    <div className="space-y-8">
      {/* 1. Member Header: Avatar, Display Name, Tier Badge, Movement Memberships */}
      <ProfileHeader user={user} />

      {/* 2. Stats Row: Tasks Completed, Announcements Signed, Check-ins, Impact Points */}
      <ProfileStats stats={stats} />

      {/* 3. Badge Gallery: names visible on hover and keyboard focus */}
      <BadgeGallery badges={badges} />

      {/* 4. Impact Ledger: task name linking to /tasks, verification method, date, verifier */}
      <ImpactLedger entries={ledger} />
    </div>
  )
}
