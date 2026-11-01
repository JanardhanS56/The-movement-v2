"use client"

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Filter,
  Trophy,
  SlidersHorizontal,
  RotateCcw,
  List,
  LayoutGrid,
} from "lucide-react"
import { api } from "@/lib/api"
import { QueryKeys } from "@/lib/query-keys"
import { useAuth } from "@/components/providers/AuthProvider"
import { Task, TaskStatus } from "@/lib/schemas/task.schema"
import { TaskClaim } from "@/lib/schemas/task.schema"
import { PeerVerification } from "@/lib/schemas/verification.schema"
import { User } from "@/lib/schemas/user.schema"
import { PageHeader } from "@/components/shared/PageHeader"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { TaskSkeleton } from "@/components/tasks/TaskSkeleton"
import { TaskCard } from "@/components/tasks/TaskCard"
import { TaskBoardView } from "@/components/tasks/TaskBoardView"
import { TaskDetailDrawer } from "@/components/tasks/TaskDetailDrawer"
import { TasksLeaderboard } from "@/components/tasks/TasksLeaderboard"
import { TaskFilterRail } from "@/components/tasks/TaskFilterRail"
import { TaskFilterDrawer } from "@/components/tasks/TaskFilterDrawer"
import { PostTaskDialog, PostTaskFormData } from "@/components/tasks/PostTaskDialog"
import { Button } from "@/components/ui/button"
import {
  TaskCategory,
  TaskDifficulty,
  TaskFilterOptions,
  TaskSortOption,
  getFilteredTasks,
  getTaskCounts,
} from "@/lib/mocks/fictional-data"
import { getStoredSavedTasks, setStoredSavedTasks } from "@/lib/ui-prefs"
import { cn } from "@/lib/utils"

export type TaskTab = "all" | "mine" | "saved" | "verification"

function TasksContent() {
  const { user, movementId, simulateFailure } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  // Tab & View state
  const currentView = searchParams.get("view") === "leaderboard" ? "leaderboard" : "tasks"
  const currentTab: TaskTab = (searchParams.get("tab") as TaskTab) || "all"
  const currentSort: TaskSortOption = (searchParams.get("sort") as TaskSortOption) || "soonest"
  const currentLayout: "list" | "board" =
    searchParams.get("layout") === "board" ? "board" : "list"
  const selectedTaskId = searchParams.get("task") || null
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false)

  // Seeded saved task IDs with storage persistence
  const [savedTaskIds, setSavedTaskIds] = React.useState<string[]>(() => {
    const stored = getStoredSavedTasks()
    if (stored.length > 0) return stored
    return [
      "c1111111-1111-4111-8111-111111111111",
      "c8888888-8888-4888-8888-888888888888",
    ]
  })

  const handleToggleSave = React.useCallback((taskId: string) => {
    setSavedTaskIds((prev) => {
      const exists = prev.includes(taskId)
      const next = exists ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      setStoredSavedTasks(next)
      if (exists) {
        toast.info("Task removed from saved.")
      } else {
        toast.success("Task saved to bookmarks.")
      }
      return next
    })
  }, [])

  // Multi-criteria filter options from URL query
  const filters: TaskFilterOptions = React.useMemo(() => {
    return {
      search: searchParams.get("q") || undefined,
      status: (searchParams.get("status") as TaskStatus) || undefined,
      category: (searchParams.get("cat") as TaskCategory) || undefined,
      reward: (searchParams.get("reward") as TaskFilterOptions["reward"]) || undefined,
      spots: (searchParams.get("spots") as TaskFilterOptions["spots"]) || undefined,
      when: (searchParams.get("when") as TaskFilterOptions["when"]) || undefined,
      difficulty: (searchParams.get("diff") as TaskDifficulty) || undefined,
    }
  }, [searchParams])

  // Count active filters (non-default values)
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.search && filters.search.trim().length > 0) count++
    if (filters.status && filters.status !== "all") count++
    if (filters.category && filters.category !== "all") count++
    if (filters.reward && filters.reward !== "all") count++
    if (filters.spots && filters.spots !== "all") count++
    if (filters.when && filters.when !== "all") count++
    if (filters.difficulty && filters.difficulty !== "all") count++
    return count
  }, [filters])

  // Helper to update a URL search param
  const updateQueryParam = React.useCallback(
    (key: string, value: string | undefined | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === "all" || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [searchParams, router, pathname]
  )

  const handleFilterParamChange = React.useCallback(
    <K extends keyof TaskFilterOptions>(key: K, value: TaskFilterOptions[K]) => {
      const keyMap: Record<keyof TaskFilterOptions, string> = {
        search: "q",
        status: "status",
        category: "cat",
        reward: "reward",
        spots: "spots",
        when: "when",
        difficulty: "diff",
      }
      updateQueryParam(keyMap[key], value as string)
    },
    [updateQueryParam]
  )

  const handleClearAllFilters = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    params.delete("status")
    params.delete("cat")
    params.delete("reward")
    params.delete("spots")
    params.delete("when")
    params.delete("diff")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [searchParams, router, pathname])

  const handleTabChange = React.useCallback(
    (tab: TaskTab) => {
      updateQueryParam("tab", tab === "all" ? undefined : tab)
    },
    [updateQueryParam]
  )

  const handleSortChange = React.useCallback(
    (sort: TaskSortOption) => {
      updateQueryParam("sort", sort === "soonest" ? undefined : sort)
    },
    [updateQueryParam]
  )

  const handleViewChange = React.useCallback(
    (view: "tasks" | "leaderboard") => {
      updateQueryParam("view", view === "leaderboard" ? "leaderboard" : undefined)
    },
    [updateQueryParam]
  )

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

  // Counts for Quick Tabs
  const counts = React.useMemo(() => {
    return getTaskCounts(user, tasks, claims, savedTaskIds)
  }, [user, tasks, claims, savedTaskIds])

  // Filtered tasks based on Quick Tab + Multi-criteria Filters + Sort
  const filteredTasks = React.useMemo(() => {
    // 1. Tab filter
    let base = tasks
    if (currentTab === "mine" && user) {
      base = base.filter((t) => {
        const claim = claims.find((c) => c.task_id === t.id)
        return t.created_by === user.id || (claim && claim.claimed_by === user.id)
      })
    } else if (currentTab === "saved") {
      base = base.filter((t) => savedTaskIds.includes(t.id))
    } else if (currentTab === "verification") {
      base = base.filter((t) => t.status === "pending_verification")
    }

    // 2. Multi-criteria filter & sort
    return getFilteredTasks(base, filters, currentSort)
  }, [tasks, currentTab, user, claims, savedTaskIds, filters, currentSort])

  // Selected task data for TaskDetailDrawer
  const selectedTask = React.useMemo(() => {
    if (!selectedTaskId) return undefined
    return tasks.find((t) => t.id === selectedTaskId)
  }, [tasks, selectedTaskId])

  const selectedClaim = React.useMemo(() => {
    if (!selectedTaskId) return undefined
    return claimsByTaskId[selectedTaskId]
  }, [claimsByTaskId, selectedTaskId])

  const selectedVerifications = React.useMemo(() => {
    if (!selectedClaim) return []
    return verificationsByClaimId[selectedClaim.id] || []
  }, [verificationsByClaimId, selectedClaim])

  // 1. Post Task Mutation
  const postTaskMutation = useMutation({
    mutationFn: async (data: PostTaskFormData) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Task creation rejected.")
      }
      const targetMovementId = movementId || "00000000-0000-4000-8000-000000000001"
      const newTask = await api.createTask(
        {
          movement_id: targetMovementId,
          title: data.title,
          description: data.description || undefined,
          reward_points: data.reward_points ?? 50,
          required_volunteers: data.required_volunteers ?? 1,
          required_skills: data.required_skills ?? [],
        },
        user.id
      )

      if (data.smart_assign && newTask?.id) {
        try {
          const res = await fetch(`/api/tasks/${newTask.id}/smart-assign`, {
            method: "POST",
          })
          const resJson = await res.json()
          if (resJson.success && resJson.data?.assigned_count > 0) {
            toast.success(
              `Smart Assign: ${resJson.data.assigned_count} volunteer(s) automatically assigned (${resJson.data.assigned_users?.join(", ")})!`
            )
          } else if (resJson.success && resJson.data?.assigned_count === 0) {
            toast.info(resJson.data.message || "No matching volunteers found with required skills.")
          } else if (!resJson.success) {
            toast.error(resJson.error || "Smart Assign could not complete.")
          }
        } catch {
          toast.error("Smart Assign request failed.")
        }
      }

      return newTask
    },
    onSuccess: (newTask) => {
      toast.success(`Task "${newTask.title}" created successfully.`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create task.")
    },
  })

  // Smart Assign Mutation for existing open tasks
  const smartAssignMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/smart-assign`, {
        method: "POST",
      })
      const resJson = await res.json()
      if (!resJson.success) {
        throw new Error(resJson.error || "Failed to trigger Smart Assign")
      }
      return resJson.data
    },
    onSuccess: (data) => {
      if (data?.assigned_count > 0) {
        toast.success(
          `Smart Assign: ${data.assigned_count} volunteer(s) assigned (${data.assigned_users?.join(", ")})`
        )
      } else {
        toast.info(data?.message || "No matching volunteers found.")
      }
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Smart Assign failed")
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
    mutationFn: async ({
      claimId,
      note,
      proofUrl,
    }: {
      claimId: string
      note?: string
      proofUrl?: string
    }) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Completion report aborted.")
      }
      return await api.markClaimComplete(claimId, user.id, note, proofUrl)
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

  // 6. Withdraw Claim Mutation
  const withdrawMutation = useMutation({
    mutationFn: async (claimId: string) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Withdrawal failed.")
      }
      return await api.withdrawClaim(claimId, user.id)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw claim.")
    },
    onSuccess: () => {
      toast.success("Claim withdrawn. Your spot has been returned to the open pool.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
    },
  })

  // 7. Cancel Task Mutation
  const cancelTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error("Authentication required")
      if (simulateFailure) {
        throw new Error("Simulated network failure: Cancellation failed.")
      }
      return await api.cancelTask(taskId, user.id)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel task.")
    },
    onSuccess: () => {
      toast.success("Task cancelled by organizer.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.taskClaims() })
    },
  })

  const isTier3 = user?.tier === 3

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        title={currentView === "leaderboard" ? "Leaderboard" : "Tasks"}
        description={
          currentView === "leaderboard"
            ? "Track community recognition and verified field contributions."
            : "Find volunteer opportunities or post field actions."
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Leaderboard View Switcher Pill */}
            <button
              type="button"
              onClick={() => handleViewChange(currentView === "leaderboard" ? "tasks" : "leaderboard")}
              aria-pressed={currentView === "leaderboard"}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-chunky text-xs font-black transition-all border-2 border-ink outline-none focus-visible:ring-2 focus-visible:ring-ring",
                currentView === "leaderboard"
                  ? "bg-sun text-ink shadow-hard-xs ring-2 ring-ink"
                  : "bg-white text-ink hover:bg-sun/20 shadow-xs"
              )}
            >
              <Trophy className="w-4 h-4 text-sun fill-sun/40" aria-hidden="true" />
              <span>{currentView === "leaderboard" ? "Back to tasks" : "Leaderboard"}</span>
            </button>

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

      {/* Main View: Leaderboard vs Task Board */}
      {currentView === "leaderboard" ? (
        <TasksLeaderboard />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Desktop Filter Rail (280px, sticky top-20, visible at 1024px+) */}
          <div className="hidden lg:block sticky top-20">
            <TaskFilterRail
              filters={filters}
              onFilterChange={handleFilterParamChange}
              onClearFilters={handleClearAllFilters}
              activeFilterCount={activeFilterCount}
              matchingCount={filteredTasks.length}
              totalCount={tasks.length}
            />
          </div>

          {/* Right Main Column */}
          <div className="space-y-6 min-w-0">
            {/* Quick Tabs row & Sort Select */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b-2 border-ink/10 pb-4">
              {/* Quick Tabs */}
              <div
                role="tablist"
                aria-label="Task category tabs"
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
              >
                {(
                  [
                    { id: "all", label: "All tasks", count: counts.all },
                    { id: "mine", label: "Mine", count: counts.mine },
                    { id: "saved", label: "Saved", count: counts.saved },
                    {
                      id: "verification",
                      label: "Needs my verification",
                      count: counts.needsVerification,
                    },
                  ] as const
                ).map((tab) => {
                  const isActive = currentTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap border-2",
                        isActive
                          ? "bg-cobalt text-white border-cobalt shadow-xs"
                          : "bg-white text-ink/70 border-ink/20 hover:border-ink hover:text-ink hover:bg-ivory"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-xs text-[10px] tabular-nums font-black",
                          isActive ? "bg-white/20 text-white" : "bg-ink/10 text-ink"
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Sort Select & View Mode (List vs Board) */}
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                {/* View switcher next to Sort: List and Board */}
                <div
                  role="group"
                  aria-label="Task layout switcher"
                  className="inline-flex items-center rounded-sm border-2 border-ink bg-white overflow-hidden shadow-hard-xs"
                >
                  <button
                    type="button"
                    onClick={() => updateQueryParam("layout", undefined)}
                    aria-pressed={currentLayout === "list"}
                    title="List view"
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-black transition-colors flex items-center gap-1",
                      currentLayout === "list"
                        ? "bg-cobalt text-white"
                        : "text-ink hover:bg-ivory"
                    )}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQueryParam("layout", "board")}
                    aria-pressed={currentLayout === "board"}
                    title="Board view"
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-black transition-colors flex items-center gap-1 border-l-2 border-ink",
                      currentLayout === "board"
                        ? "bg-cobalt text-white"
                        : "text-ink hover:bg-ivory"
                    )}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Board</span>
                  </button>
                </div>

                <span className="text-xs font-semibold text-ink/60 hidden md:inline">Sort:</span>
                <select
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value as TaskSortOption)}
                  aria-label="Sort tasks by"
                  className="px-3 py-1.5 rounded-sm border-2 border-ink bg-white text-xs font-bold shadow-hard-xs focus:ring-2 focus:ring-cobalt outline-none cursor-pointer"
                >
                  <option value="soonest">Soonest / Urgency</option>
                  <option value="highest_points">Highest points</option>
                  <option value="newest">Newest</option>
                  <option value="fewest_spots">Fewest spots left</option>
                </select>
              </div>
            </div>

            {/* Mobile Filter Trigger Bar (Visible on <lg screens) */}
            <div className="flex items-center justify-between gap-2 lg:hidden bg-card p-2.5 rounded-chunky border-2 border-ink shadow-hard-xs">
              <Button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                variant="outline"
                size="sm"
                className="text-xs font-bold border-2 border-ink bg-white gap-1.5 shadow-hard-xs h-8"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cobalt" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-cobalt text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() =>
                    handleFilterParamChange(
                      "status",
                      filters.status === "open" ? "all" : "open"
                    )
                  }
                  className={cn(
                    "px-2 py-1 rounded-sm text-[11px] font-bold border whitespace-nowrap",
                    filters.status === "open"
                      ? "bg-ink text-ivory border-ink"
                      : "bg-white text-ink/80 border-ink/30"
                  )}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFilterParamChange(
                      "difficulty",
                      filters.difficulty === "Easy" ? "all" : "Easy"
                    )
                  }
                  className={cn(
                    "px-2 py-1 rounded-sm text-[11px] font-bold border whitespace-nowrap",
                    filters.difficulty === "Easy"
                      ? "bg-lavender text-ink border-ink"
                      : "bg-white text-ink/80 border-ink/30"
                  )}
                >
                  Easy
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFilterParamChange(
                      "reward",
                      filters.reward === "high" ? "all" : "high"
                    )
                  }
                  className={cn(
                    "px-2 py-1 rounded-sm text-[11px] font-bold border whitespace-nowrap",
                    filters.reward === "high"
                      ? "bg-sun text-ink border-ink"
                      : "bg-white text-ink/80 border-ink/30"
                  )}
                >
                  75+ pts
                </button>
              </div>
            </div>

            {/* Loading state: 6 task-card skeletons */}
            {tasksLoading && <TaskSkeleton />}

            {/* Error state with retry */}
            {tasksError && (
              <ErrorAlert
                title="We could not load this"
                message={
                  tasksErrorObj instanceof Error
                    ? tasksErrorObj.message
                    : "We could not load this. Check your connection and try again."
                }
                onRetry={() => void refetchTasks()}
              />
            )}

            {/* Tasks Ledger / Empty state */}
            {!tasksLoading && !tasksError && (
              <div>
                {filteredTasks.length === 0 ? (
                  <div className="p-12 text-center rounded-chunky border-2 border-dashed border-ink/30 bg-white space-y-4">
                    <div className="w-12 h-12 rounded-full bg-ivory border-2 border-ink flex items-center justify-center mx-auto text-ink/60">
                      <Filter className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-black text-ink">No tasks match your filters</h4>
                    <p className="text-sm text-ink/70 max-w-sm mx-auto">
                      No volunteer actions match your selected criteria. Try adjusting or clearing your filters to see more opportunities.
                    </p>
                    <Button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="bg-lime text-ink hover:bg-lime/90 border-2 border-ink rounded-chunky font-bold text-xs shadow-hard-xs h-9 px-4"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      <span>Reset filters</span>
                    </Button>
                  </div>
                ) : currentLayout === "board" ? (
                  <TaskBoardView
                    tasks={filteredTasks}
                    claimsByTaskId={claimsByTaskId}
                    usersMap={usersMap}
                    savedTaskIds={savedTaskIds}
                    onToggleSave={handleToggleSave}
                    onSelectTask={(taskId) => updateQueryParam("task", taskId)}
                    currentUserId={user ? user.id : null}
                  />
                ) : (
                  <div className="space-y-6">
                    {filteredTasks.map((task) => {
                      const claim = claimsByTaskId[task.id]
                      const taskVerifications = claim
                        ? verificationsByClaimId[claim.id] || []
                        : []

                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          claim={claim}
                          verifications={taskVerifications}
                          usersMap={usersMap}
                          currentUserId={user ? user.id : null}
                          currentUserTier={user ? user.tier : undefined}
                          isSaved={savedTaskIds.includes(task.id)}
                          onToggleSave={handleToggleSave}
                          onSelectTask={(taskId) => updateQueryParam("task", taskId)}
                          onClaim={async (taskId) => {
                            await claimMutation.mutateAsync(taskId)
                          }}
                          onMarkComplete={async (claimId, note, proofUrl) => {
                            await markCompleteMutation.mutateAsync({ claimId, note, proofUrl })
                          }}
                          onPeerVote={async (claimId, vote) => {
                            await peerVoteMutation.mutateAsync({ claimId, vote })
                          }}
                          onOrganizerOverride={async (claimId, approve, note) => {
                            await organizerOverrideMutation.mutateAsync({
                              claimId,
                              approve,
                              note,
                            })
                          }}
                          onSmartAssign={async (taskId) => {
                            await smartAssignMutation.mutateAsync(taskId)
                          }}
                          isClaiming={
                            claimMutation.isPending && claimMutation.variables === task.id
                          }
                          isCompleting={
                            markCompleteMutation.isPending &&
                            markCompleteMutation.variables?.claimId === claim?.id
                          }
                          isVerifying={
                            peerVoteMutation.isPending || organizerOverrideMutation.isPending
                          }
                          isSmartAssigning={
                            smartAssignMutation.isPending &&
                            smartAssignMutation.variables === task.id
                          }
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Bottom Sheet Filter Drawer */}
          <TaskFilterDrawer
            isOpen={mobileFilterOpen}
            onClose={() => setMobileFilterOpen(false)}
            filters={filters}
            onFilterChange={handleFilterParamChange}
            onClearFilters={handleClearAllFilters}
            activeFilterCount={activeFilterCount}
            matchingCount={filteredTasks.length}
            totalCount={tasks.length}
          />

          {/* Task Detail Drawer */}
          <TaskDetailDrawer
            taskId={selectedTaskId}
            isOpen={Boolean(selectedTaskId)}
            onClose={() => updateQueryParam("task", undefined)}
            task={selectedTask}
            claim={selectedClaim}
            verifications={selectedVerifications}
            usersMap={usersMap}
            currentUser={user}
            isSaved={Boolean(selectedTaskId && savedTaskIds.includes(selectedTaskId))}
            onToggleSave={handleToggleSave}
            onClaim={async (taskId) => {
              await claimMutation.mutateAsync(taskId)
            }}
            onWithdraw={async (claimId) => {
              await withdrawMutation.mutateAsync(claimId)
            }}
            onMarkComplete={async (claimId, note, proofUrl) => {
              await markCompleteMutation.mutateAsync({ claimId, note, proofUrl })
            }}
            onPeerVote={async (claimId, vote) => {
              await peerVoteMutation.mutateAsync({ claimId, vote })
            }}
            onOrganizerOverride={async (claimId, approve, note) => {
              await organizerOverrideMutation.mutateAsync({ claimId, approve, note })
            }}
            onCancelTask={async (taskId) => {
              await cancelTaskMutation.mutateAsync(taskId)
            }}
            isLoading={tasksLoading}
            isActionPending={
              claimMutation.isPending ||
              withdrawMutation.isPending ||
              markCompleteMutation.isPending ||
              peerVoteMutation.isPending ||
              organizerOverrideMutation.isPending ||
              cancelTaskMutation.isPending
            }
          />
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
