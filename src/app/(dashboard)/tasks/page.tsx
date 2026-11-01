"use client"

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Bug, CheckCircle2, Clock, Compass, Filter } from "lucide-react"
import { api } from "@/lib/api"
import { QueryKeys } from "@/lib/query-keys"
import { useAuth } from "@/components/providers/AuthProvider"
import { Task } from "@/lib/schemas/task.schema"
import { TaskClaim } from "@/lib/schemas/task.schema"
import { PeerVerification } from "@/lib/schemas/verification.schema"
import { User } from "@/lib/schemas/user.schema"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton"
import { TaskCard } from "@/components/tasks/TaskCard"
import { PostTaskDialog, PostTaskFormData } from "@/components/tasks/PostTaskDialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TaskFilter = "all" | "open" | "in_progress" | "completed"

const FILTER_OPTIONS: { id: TaskFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Tasks", icon: Filter },
  { id: "open", label: "Open", icon: Compass },
  { id: "in_progress", label: "In Progress", icon: Clock },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
]

const EMPTY_STATES: Record<TaskFilter, { title: string; description: string }> = {
  all: {
    title: "No Tasks Found",
    description: "No tasks found in this movement.",
  },
  open: {
    title: "No Open Tasks",
    description: "No open tasks available to claim right now.",
  },
  in_progress: {
    title: "No Active Tasks",
    description: "No tasks are currently in progress.",
  },
  completed: {
    title: "No Completed Tasks",
    description: "No completed tasks on record yet.",
  },
}

function TasksContent() {
  const { user, movementId } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const [simulateFailure, setSimulateFailure] = React.useState(false)

  // URL search params filter binding
  const currentFilter: TaskFilter = React.useMemo(() => {
    const statusParam = searchParams.get("status")?.toLowerCase()
    if (statusParam === "open" || statusParam === "in_progress" || statusParam === "completed") {
      return statusParam
    }
    return "all"
  }, [searchParams])

  const handleFilterChange = (filter: TaskFilter) => {
    const params = new URLSearchParams(searchParams.toString())
    if (filter === "all") {
      params.delete("status")
    } else {
      params.set("status", filter)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  // 1. Fetch tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    error: tasksErrorObj,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: QueryKeys.tasks(movementId),
    queryFn: () => api.getTasks(movementId),
  })

  // 2. Fetch task claims
  const { data: claims = [] } = useQuery({
    queryKey: QueryKeys.taskClaims(),
    queryFn: () => api.getTaskClaims(),
  })

  // 3. Fetch peer verifications
  const { data: verifications = [] } = useQuery({
    queryKey: QueryKeys.peerVerifications(),
    queryFn: () => api.getPeerVerifications(),
  })

  // 4. Fetch users for claimant metadata
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

  // Map task claims by taskId
  const claimsByTaskId = React.useMemo(() => {
    const map: Record<string, TaskClaim> = {}
    claims.forEach((c) => {
      if (c.status !== "withdrawn" && c.status !== "rejected") {
        map[c.task_id] = c
      }
    })
    return map
  }, [claims])

  // Map verifications by claimId
  const verificationsByClaimId = React.useMemo(() => {
    const map: Record<string, PeerVerification[]> = {}
    verifications.forEach((v) => {
      if (!map[v.claim_id]) map[v.claim_id] = []
      map[v.claim_id].push(v)
    })
    return map
  }, [verifications])

  // Filtered tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      if (currentFilter === "all") return true
      if (currentFilter === "open") return task.status === "open"
      if (currentFilter === "in_progress") {
        return task.status === "in_progress" || task.status === "pending_verification"
      }
      if (currentFilter === "completed") return task.status === "completed"
      return true
    })
  }, [tasks, currentFilter])

  // 1. Post Task Mutation
  const postTaskMutation = useMutation({
    mutationFn: async (data: PostTaskFormData) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Task creation rejected.")
      }
      return await api.createTask(
        {
          movement_id: movementId,
          title: data.title,
          description: data.description,
          reward_points: data.reward_points,
          required_volunteers: data.required_volunteers,
        },
        user.id
      )
    },
    onSuccess: (newTask) => {
      toast.success(`Task "${newTask.title}" created successfully.`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create task.")
    },
  })

  // 2. Claim Task Mutation with Optimistic Updates & Rollback
  const claimMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Claim could not be submitted.")
      }
      return await api.claimTask({ task_id: taskId }, user.id)
    },
    onMutate: async (taskId) => {
      if (!user) return

      await queryClient.cancelQueries({ queryKey: QueryKeys.tasks(movementId) })
      await queryClient.cancelQueries({ queryKey: QueryKeys.taskClaims() })

      const previousTasks = queryClient.getQueryData<Task[]>(QueryKeys.tasks(movementId))
      const previousClaims = queryClient.getQueryData<TaskClaim[]>(QueryKeys.taskClaims())

      const nowIso = new Date().toISOString()
      const optimisticClaim: TaskClaim = {
        id: `temp-claim-${Date.now()}`,
        task_id: taskId,
        claimed_by: user.id,
        status: "in_progress",
        claimed_at: nowIso,
      }

      // Optimistically add claim
      queryClient.setQueryData<TaskClaim[]>(QueryKeys.taskClaims(), (old = []) => [
        ...old,
        optimisticClaim,
      ])

      // Optimistically update task status to in_progress
      queryClient.setQueryData<Task[]>(QueryKeys.tasks(movementId), (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, status: "in_progress" as const } : t))
      )

      return { previousTasks, previousClaims }
    },
    onError: (err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(QueryKeys.tasks(movementId), context.previousTasks)
      }
      if (context?.previousClaims) {
        queryClient.setQueryData(QueryKeys.taskClaims(), context.previousClaims)
      }
      toast.error(err instanceof Error ? err.message : "Failed to claim task.")
    },
    onSuccess: () => {
      toast.success("Task claimed successfully. Start working on your mission.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
    },
  })

  // 3. Mark Complete Mutation (moves claim and task to pending_verification)
  const markCompleteMutation = useMutation({
    mutationFn: async ({ claimId }: { claimId: string }) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Completion report aborted.")
      }
      return await api.markClaimComplete(claimId, user.id)
    },
    onMutate: async ({ claimId }) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.tasks(movementId) })
      await queryClient.cancelQueries({ queryKey: QueryKeys.taskClaims() })

      const previousTasks = queryClient.getQueryData<Task[]>(QueryKeys.tasks(movementId))
      const previousClaims = queryClient.getQueryData<TaskClaim[]>(QueryKeys.taskClaims())

      const targetClaim = previousClaims?.find((c) => c.id === claimId)
      const nowIso = new Date().toISOString()

      // Optimistically update claim
      queryClient.setQueryData<TaskClaim[]>(QueryKeys.taskClaims(), (old = []) =>
        old.map((c) =>
          c.id === claimId
            ? { ...c, status: "pending_verification" as const, completed_at: nowIso }
            : c
        )
      )

      // Optimistically update task
      if (targetClaim) {
        queryClient.setQueryData<Task[]>(QueryKeys.tasks(movementId), (old = []) =>
          old.map((t) =>
            t.id === targetClaim.task_id
              ? { ...t, status: "pending_verification" as const }
              : t
          )
        )
      }

      return { previousTasks, previousClaims }
    },
    onError: (err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(QueryKeys.tasks(movementId), context.previousTasks)
      }
      if (context?.previousClaims) {
        queryClient.setQueryData(QueryKeys.taskClaims(), context.previousClaims)
      }
      toast.error(err instanceof Error ? err.message : "Failed to submit completion.")
    },
    onSuccess: () => {
      toast.success("Task marked complete. Submitted to assigned peers for verification.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.peerVerifications() })
    },
  })

  // 4. Peer Vote Mutation
  const peerVoteMutation = useMutation({
    mutationFn: async ({ claimId, vote }: { claimId: string; vote: "approve" | "reject" }) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Peer vote rejected.")
      }
      return await api.submitVerificationVote(claimId, user.id, vote)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to record vote.")
    },
    onSuccess: (result) => {
      toast.success(
        result.vote === "approve"
          ? "Approval vote registered in the verification ledger."
          : "Rejection vote registered in the verification ledger."
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.peerVerifications() })
    },
  })

  // 5. Organizer Override Mutation
  const organizerOverrideMutation = useMutation({
    mutationFn: async ({
      claimId,
      approve,
      note,
    }: {
      claimId: string
      approve: boolean
      note?: string
    }) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Organizer override failed.")
      }
      return await api.organizerOverride(claimId, user.id, approve, note)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Organizer override failed.")
    },
    onSuccess: (updatedClaim) => {
      toast.success(
        updatedClaim.status === "verified"
          ? "Organizer override approved. Task verified and reward points awarded."
          : "Organizer override rejected. Task claim rejected."
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
      queryClient.invalidateQueries({ queryKey: QueryKeys.peerVerifications() })
    },
  })

  const isTier3 = user?.tier === 3

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Bounty Board"
        description="Community tasks and operational missions verified through decentralized peer consensus."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Simulation Toggle */}
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

            {/* Tier 3: Post Task Dialog */}
            {isTier3 && (
              <PostTaskDialog
                movementId={movementId}
                onSubmit={async (data) => {
                  await postTaskMutation.mutateAsync(data)
                }}
                isPending={postTaskMutation.isPending}
              />
            )}
          </div>
        }
      />

      {/* Filter Chips Bar (Stored in URL with useSearchParams) */}
      <section aria-label="Task status filters" className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = currentFilter === option.id
            const Icon = option.icon

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleFilterChange(option.id)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors border outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Loading state: 6 task-card skeletons */}
      {tasksLoading && <TaskSkeleton />}

      {/* Error state with retry */}
      {tasksError && (
        <ErrorAlert
          title="Unable to load tasks"
          message={
            tasksErrorObj instanceof Error
              ? tasksErrorObj.message
              : "Failed to connect to the task distribution layer."
          }
          onRetry={() => void refetchTasks()}
        />
      )}

      {/* Tasks Grid: 2 columns from 768px, 1 below */}
      {!tasksLoading && !tasksError && (
        <div>
          {filteredTasks.length === 0 ? (
            <EmptyState
              title={EMPTY_STATES[currentFilter].title}
              description={EMPTY_STATES[currentFilter].description}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const claim = claimsByTaskId[task.id]
                const taskVerifications = claim ? verificationsByClaimId[claim.id] || [] : []

                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    claim={claim}
                    verifications={taskVerifications}
                    usersMap={usersMap}
                    currentUserId={user ? user.id : null}
                    currentUserTier={user ? user.tier : undefined}
                    onClaim={async (taskId) => {
                      await claimMutation.mutateAsync(taskId)
                    }}
                    onMarkComplete={async (claimId) => {
                      await markCompleteMutation.mutateAsync({ claimId })
                    }}
                    onPeerVote={async (claimId, vote) => {
                      await peerVoteMutation.mutateAsync({ claimId, vote })
                    }}
                    onOrganizerOverride={async (claimId, approve, note) => {
                      await organizerOverrideMutation.mutateAsync({ claimId, approve, note })
                    }}
                    isClaiming={claimMutation.isPending && claimMutation.variables === task.id}
                    isCompleting={
                      markCompleteMutation.isPending &&
                      markCompleteMutation.variables?.claimId === claim?.id
                    }
                    isVerifying={
                      peerVoteMutation.isPending || organizerOverrideMutation.isPending
                    }
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  return (
    <React.Suspense fallback={<TaskSkeleton />}>
      <TasksContent />
    </React.Suspense>
  )
}
