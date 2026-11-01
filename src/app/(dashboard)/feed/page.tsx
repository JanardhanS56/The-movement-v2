"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query"
import { toast } from "sonner"
import { ShieldCheck, AlertTriangle, Sparkles } from "lucide-react"
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

const SIMULATED_ANNOUNCEMENTS: NewAnnouncementFormData[] = [
  {
    title: "Urgent: Safe Corridor Established via Nehru Circle",
    body: "Coordinated volunteer marshals have marked a secure pedestrian transit corridor along Nehru Circle. First aid stations are operational with water supplies.",
    required_signatures: 2,
  },
  {
    title: "Medical Staging Zone Relocated to South Gate",
    body: "Due to high crowd density near the main square, volunteer triage units and ambulances have relocated to the South Gate entrance. Keep access ways clear.",
    required_signatures: 2,
  },
  {
    title: "Weather Advisory: Rain Shelter Protocol Activated",
    body: "Light coastal squalls expected within 45 minutes. Waterproof covers and canopy shelters at Sector 2 and 4 are open for public refuge.",
    required_signatures: 3,
  },
  {
    title: "Legal Support Observers Active Across Sector 1",
    body: "Trained civil rights observers in high-vis armbands are stationed along the parade route. Contact hotline 555-0199 for field documentation.",
    required_signatures: 2,
  },
]

export default function FeedPage() {
  const { user, movementId, simulateFailure } = useAuth()
  const queryClient = useQueryClient()
  const [simulateIndex, setSimulateIndex] = React.useState(0)
  const [isSimulatingDraft, setIsSimulatingDraft] = React.useState(false)

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

  // 6. Simulate draft announcement requiring multi-sig co-signatures
  const handleSimulateAnnouncement = async () => {
    if (!user) {
      toast.error("Please sign in or select a demo user.")
      return
    }
    const template = SIMULATED_ANNOUNCEMENTS[simulateIndex % SIMULATED_ANNOUNCEMENTS.length]
    setSimulateIndex((prev) => prev + 1)
    setIsSimulatingDraft(true)

    try {
      await createMutation.mutateAsync({
        title: template.title,
        body: template.body,
        required_signatures: template.required_signatures,
      })
    } catch {
      // Error handled by mutation
    } finally {
      setIsSimulatingDraft(false)
    }
  }

  // 7. Simulate co-signature by another eligible Tier 3 organizer
  const handleSimulateCoSign = async (announcementId: string) => {
    const existingSignatures = signaturesMap[announcementId] || []
    const existingSignerIds = existingSignatures.map((s) => s.signed_by)

    // Find registered Tier 3 organizers who haven't signed this announcement yet
    const eligibleOrganizers = users.filter(
      (u) => u.tier === 3 && !existingSignerIds.includes(u.id)
    )

    if (eligibleOrganizers.length === 0) {
      toast.info("All registered organizers have already signed this announcement.")
      return
    }

    const coSigner = eligibleOrganizers[0]

    try {
      if (simulateFailure) {
        throw new Error("Simulated network failure: Co-signature verification dropped.")
      }

      await api.signAnnouncement(announcementId, coSigner.id)

      await queryClient.invalidateQueries({
        queryKey: QueryKeys.announcements(movementId),
      })
      await queryClient.invalidateQueries({
        queryKey: QueryKeys.signatures(announcementId),
      })

      const targetAnnouncement = announcements.find((a) => a.id === announcementId)
      const newCount = existingSignatures.length + 1
      const required = targetAnnouncement?.required_signatures || 2

      if (newCount >= required) {
        toast.success(
          `${coSigner.display_name} co-signed! Multi-sig threshold reached (${newCount}/${required}) - Published live!`
        )
      } else {
        toast.success(
          `${coSigner.display_name} co-signed (${newCount}/${required}). Needs ${required - newCount} more signature${required - newCount === 1 ? "" : "s"}.`
        )
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to record simulated co-signature."
      )
    }
  }

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title="Announcements feed"
        description="Official dispatches co-signed by community organizers."
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Simulate Announcement Button */}
            <Button
              id="simulate-announcement-button"
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSimulateAnnouncement}
              loading={isSimulatingDraft}
              disabled={isSimulatingDraft}
              className="text-xs font-bold gap-2 h-9 border-2 border-ink bg-white hover:bg-ivory text-ink shadow-hard-xs"
              aria-label="Simulate draft announcement requiring co-signatures"
            >
              <Sparkles className="w-4 h-4 text-cobalt shrink-0" aria-hidden="true" />
              <span>Simulate announcement</span>
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
        <div className="space-y-12">
          {/* 1. Pending Signatures Section: Visible ONLY to Tier 3 organizers at top */}
          {isTier3 && pendingAnnouncements.length > 0 && (
            <section
              aria-labelledby="pending-signatures-heading"
              className="p-6 md:p-8 rounded-sm border-2 border-ink bg-sun/10 shadow-hard space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-4">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-ink shrink-0" aria-hidden="true" />
                  <h2
                    id="pending-signatures-heading"
                    className="text-xl font-black tracking-tight text-ink font-sans"
                  >
                    Pending signatures ({pendingAnnouncements.length})
                  </h2>
                </div>
                <span className="text-xs font-bold text-ink bg-sun px-3 py-1 rounded-sm border-2 border-ink shadow-hard-xs">
                  Organizer action required
                </span>
              </div>

              <p className="text-sm font-medium text-ink/80 max-w-prose">
                These announcements require co-signatures from Tier 3 organizers before they are verified and published to volunteers.
              </p>

              <div className="space-y-6 pt-2">
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
                    onSimulateCoSign={handleSimulateCoSign}
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
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b-2 border-ink pb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cobalt shrink-0" aria-hidden="true" />
                <h2
                  id="published-feed-heading"
                  className="text-xl font-black tracking-tight text-ink font-sans"
                >
                  Published dispatches
                </h2>
              </div>
              <span className="text-xs font-semibold text-ink/70">
                {publishedAnnouncements.length} verified dispatch
                {publishedAnnouncements.length === 1 ? "" : "es"}
              </span>
            </div>

            {publishedAnnouncements.length === 0 ? (
              <EmptyState
                title="No published announcements"
                description="No items to show."
              />
            ) : (
              <div className="space-y-6">
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
