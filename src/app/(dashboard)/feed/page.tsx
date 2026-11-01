"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query"
import { toast } from "sonner"
import { ShieldCheck, AlertTriangle, Bug } from "lucide-react"
import { api } from "@/lib/api"
import { QueryKeys } from "@/lib/query-keys"
import { useAuth } from "@/components/providers/AuthProvider"
import { Announcement } from "@/lib/schemas/announcement.schema"
import { AnnouncementSignature } from "@/lib/schemas/signature.schema"
import { User } from "@/lib/schemas/user.schema"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { AnnouncementSkeleton } from "@/components/feed/AnnouncementSkeleton"
import { AnnouncementCard } from "@/components/feed/AnnouncementCard"
import {
  NewAnnouncementDialog,
  NewAnnouncementFormData,
} from "@/components/feed/NewAnnouncementDialog"
import { Button } from "@/components/ui/button"

export default function FeedPage() {
  const { user, movementId } = useAuth()
  const queryClient = useQueryClient()
  const [simulateFailure, setSimulateFailure] = React.useState(false)

  // 1. Fetch announcements
  const {
    data: announcements = [],
    isLoading: announcementsLoading,
    isError: announcementsError,
    error: announcementsErrorObj,
    refetch: refetchAnnouncements,
  } = useQuery({
    queryKey: QueryKeys.announcements(movementId),
    queryFn: () => api.getAnnouncements(movementId),
  })

  // 2. Fetch movement users (to resolve author and signer display names)
  const { data: users = [] } = useQuery({
    queryKey: QueryKeys.users(),
    queryFn: () => api.getUsers(),
  })

  const usersMap = React.useMemo(() => {
    const map: Record<string, User> = {}
    users.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const totalOrganizers = React.useMemo(() => {
    const count = users.filter((u) => u.tier === 3).length
    return count > 0 ? count : 3
  }, [users])

  // 3. Fetch signatures for each announcement
  const signaturesQueries = useQueries({
    queries: announcements.map((announcement) => ({
      queryKey: QueryKeys.signatures(announcement.id),
      queryFn: () => api.getSignatures(announcement.id),
      staleTime: 30_000,
    })),
  })

  const signaturesMap = React.useMemo(() => {
    const map: Record<string, AnnouncementSignature[]> = {}
    announcements.forEach((ann, index) => {
      map[ann.id] = signaturesQueries[index]?.data ?? []
    })
    return map
  }, [announcements, signaturesQueries])

  // 4. Create Announcement Mutation with Optimistic Updates & Rollback
  const createMutation = useMutation({
    mutationFn: async (data: NewAnnouncementFormData) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Announcement creation rejected.")
      }
      return await api.createAnnouncement(
        {
          movement_id: movementId,
          title: data.title,
          body: data.body,
          required_signatures: data.required_signatures,
        },
        user.id
      )
    },
    onMutate: async (newAnnouncementData) => {
      if (!user) return

      await queryClient.cancelQueries({
        queryKey: QueryKeys.announcements(movementId),
      })

      const previousAnnouncements = queryClient.getQueryData<Announcement[]>(
        QueryKeys.announcements(movementId)
      )

      const isImmediatePublish = newAnnouncementData.required_signatures <= 1
      const tempId = `temp-announcement-${Date.now()}`
      const nowIso = new Date().toISOString()

      const optimisticAnnouncement: Announcement = {
        id: tempId,
        movement_id: movementId,
        created_by: user.id,
        title: newAnnouncementData.title,
        body: newAnnouncementData.body,
        required_signatures: newAnnouncementData.required_signatures,
        is_published: isImmediatePublish,
        published_at: isImmediatePublish ? nowIso : null,
        created_at: nowIso,
      }

      // Optimistically append announcement to cache
      queryClient.setQueryData<Announcement[]>(
        QueryKeys.announcements(movementId),
        (old = []) => [optimisticAnnouncement, ...old]
      )

      // Optimistically set signature for author
      const optimisticAuthorSignature: AnnouncementSignature = {
        id: `temp-sig-${Date.now()}`,
        announcement_id: tempId,
        signed_by: user.id,
        signed_at: nowIso,
      }
      queryClient.setQueryData<AnnouncementSignature[]>(
        QueryKeys.signatures(tempId),
        [optimisticAuthorSignature]
      )

      return { previousAnnouncements, tempId }
    },
    onError: (err, _variables, context) => {
      if (context?.previousAnnouncements) {
        queryClient.setQueryData(
          QueryKeys.announcements(movementId),
          context.previousAnnouncements
        )
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to create announcement."
      )
    },
    onSuccess: (created) => {
      toast.success(
        created.is_published
          ? "Announcement published immediately (1 of 1 signature)."
          : "Announcement created and sent to Pending for co-signatures."
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.announcements(movementId),
      })
    },
  })

  // 5. Sign Announcement Mutation with Optimistic Updates & Rollback
  const signMutation = useMutation({
    mutationFn: async ({ announcementId }: { announcementId: string }) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Signature could not be verified.")
      }
      return await api.signAnnouncement(announcementId, user.id)
    },
    onMutate: async ({ announcementId }) => {
      if (!user) return

      await queryClient.cancelQueries({
        queryKey: QueryKeys.announcements(movementId),
      })
      await queryClient.cancelQueries({
        queryKey: QueryKeys.signatures(announcementId),
      })

      const previousAnnouncements = queryClient.getQueryData<Announcement[]>(
        QueryKeys.announcements(movementId)
      )
      const previousSignatures = queryClient.getQueryData<AnnouncementSignature[]>(
        QueryKeys.signatures(announcementId)
      )

      const nowIso = new Date().toISOString()
      const optimisticSig: AnnouncementSignature = {
        id: `temp-sig-${Date.now()}`,
        announcement_id: announcementId,
        signed_by: user.id,
        signed_at: nowIso,
      }

      // Optimistically add signature
      queryClient.setQueryData<AnnouncementSignature[]>(
        QueryKeys.signatures(announcementId),
        (old = []) => [...old, optimisticSig]
      )

      // Optimistically check if threshold is met to flip is_published
      queryClient.setQueryData<Announcement[]>(
        QueryKeys.announcements(movementId),
        (old = []) =>
          old.map((ann) => {
            if (ann.id !== announcementId) return ann
            const updatedCount = (previousSignatures?.length || 0) + 1
            if (updatedCount >= ann.required_signatures) {
              return {
                ...ann,
                is_published: true,
                published_at: nowIso,
              }
            }
            return ann
          })
      )

      return { previousAnnouncements, previousSignatures, announcementId }
    },
    onError: (err, _variables, context) => {
      if (context?.previousAnnouncements) {
        queryClient.setQueryData(
          QueryKeys.announcements(movementId),
          context.previousAnnouncements
        )
      }
      if (context?.announcementId && context?.previousSignatures) {
        queryClient.setQueryData(
          QueryKeys.signatures(context.announcementId),
          context.previousSignatures
        )
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to record co-signature."
      )
    },
    onSuccess: () => {
      toast.success("Co-signature verified and recorded in the ledger.")
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.announcements(movementId),
      })
      queryClient.invalidateQueries({
        queryKey: QueryKeys.signatures(variables.announcementId),
      })
    },
  })

  // Published announcements (newest first)
  const publishedAnnouncements = React.useMemo(() => {
    return announcements
      .filter((a) => a.is_published)
      .sort((a, b) => {
        const timeA = new Date(a.published_at || a.created_at).getTime()
        const timeB = new Date(b.published_at || b.created_at).getTime()
        return timeB - timeA
      })
  }, [announcements])

  // Pending announcements (newest first)
  const pendingAnnouncements = React.useMemo(() => {
    return announcements
      .filter((a) => !a.is_published)
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime()
        const timeB = new Date(b.created_at).getTime()
        return timeB - timeA
      })
  }, [announcements])

  const isTier3 = user?.tier === 3

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Announcements Feed"
        description="Multi-signature verified dispatches and operational directives."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Simulation toggle for testing optimistic rollback */}
            <Button
              variant={simulateFailure ? "destructive" : "outline"}
              size="sm"
              onClick={() => setSimulateFailure((prev) => !prev)}
              className="text-xs gap-1.5 h-8"
              aria-label="Toggle mutation simulated failure"
            >
              <Bug className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {simulateFailure ? "Simulated Failure: ON" : "Simulate Failure: OFF"}
              </span>
            </Button>

            {/* Tier 3: New Announcement Dialog */}
            {isTier3 && (
              <NewAnnouncementDialog
                movementId={movementId}
                totalOrganizers={totalOrganizers}
                onSubmit={async (data) => {
                  await createMutation.mutateAsync(data)
                }}
                isPending={createMutation.isPending}
              />
            )}
          </div>
        }
      />

      {/* Loading state: 3 announcement skeletons */}
      {announcementsLoading && <AnnouncementSkeleton />}

      {/* Error state with retry action */}
      {announcementsError && (
        <ErrorAlert
          title="Unable to load feed announcements"
          message={
            announcementsErrorObj instanceof Error
              ? announcementsErrorObj.message
              : "Failed to communicate with the movements API layer."
          }
          onRetry={() => void refetchAnnouncements()}
        />
      )}

      {!announcementsLoading && !announcementsError && (
        <div className="space-y-8">
          {/* 1. Pending Signatures Section: Visible ONLY to Tier 3 organizers at top */}
          {isTier3 && pendingAnnouncements.length > 0 && (
            <section
              aria-labelledby="pending-signatures-heading"
              className="space-y-4 p-4 sm:p-5 rounded-lg border border-sun/40 bg-sun/20 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3 border-b border-sun/40 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-sun shrink-0" aria-hidden="true" />
                  <h2
                    id="pending-signatures-heading"
                    className="text-base sm:text-lg font-bold tracking-tight text-foreground"
                  >
                    Pending Signatures ({pendingAnnouncements.length})
                  </h2>
                </div>
                <span className="text-xs tabular-nums text-sun bg-sun/20 px-2 py-0.5 rounded-sm border border-sun/40">
                  Organizer Action Required
                </span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground">
                These announcements require co-signatures from Tier 3 Organizers before they are verified and published to volunteers.
              </p>

              <div className="space-y-4 pt-1">
                {pendingAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    signatures={signaturesMap[announcement.id] || []}
                    usersMap={usersMap}
                    currentUserId={user ? user.id : null}
                    currentUserTier={user ? user.tier : undefined}
                    onSign={async (announcementId) => {
                      await signMutation.mutateAsync({ announcementId })
                    }}
                    isSigning={
                      signMutation.isPending &&
                      signMutation.variables?.announcementId === announcement.id
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* 2. Published Announcements Feed: Visible to all, newest first */}
          <section
            aria-labelledby="published-feed-heading"
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <h2
                  id="published-feed-heading"
                  className="text-lg font-bold tracking-tight text-foreground"
                >
                  Published Dispatches
                </h2>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {publishedAnnouncements.length} Verified Dispatch
                {publishedAnnouncements.length === 1 ? "" : "es"}
              </span>
            </div>

            {publishedAnnouncements.length === 0 ? (
              <EmptyState
                title="No Published Announcements"
                description="No items to show."
              />
            ) : (
              <div className="space-y-4">
                {publishedAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    signatures={signaturesMap[announcement.id] || []}
                    usersMap={usersMap}
                    currentUserId={user ? user.id : null}
                    currentUserTier={user ? user.tier : undefined}
                    onSign={async (announcementId) => {
                      await signMutation.mutateAsync({ announcementId })
                    }}
                    isSigning={
                      signMutation.isPending &&
                      signMutation.variables?.announcementId === announcement.id
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
