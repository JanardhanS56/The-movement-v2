"use client"

import * as React from "react"
import {
  Clock,
  MapPin,
  Users,
  Bookmark,
  ArrowRight,
} from "lucide-react"
import { Task, TaskClaim } from "@/lib/schemas/task.schema"
import { User } from "@/lib/schemas/user.schema"
import { TASK_META_MAP } from "@/lib/mocks/fictional-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface TaskBoardViewProps {
  tasks: Task[]
  claimsByTaskId: Record<string, TaskClaim>
  usersMap: Record<string, User>
  savedTaskIds: string[]
  onToggleSave: (taskId: string) => void
  onSelectTask: (taskId: string) => void
  currentUserId?: string | null
}

interface ColumnConfig {
  id: "open" | "in_progress" | "pending_verification" | "completed"
  title: string
  subhead: string
  color: string
  accentBorder: string
  badgeBg: string
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "open",
    title: "Open",
    subhead: "Ready for volunteers",
    color: "text-cobalt",
    accentBorder: "border-cobalt",
    badgeBg: "bg-cobalt/10 text-cobalt",
  },
  {
    id: "in_progress",
    title: "In progress",
    subhead: "Currently underway",
    color: "text-sun",
    accentBorder: "border-sun",
    badgeBg: "bg-sun/20 text-ink",
  },
  {
    id: "pending_verification",
    title: "Awaiting verification",
    subhead: "Awaiting peer review",
    color: "text-lavender",
    accentBorder: "border-lavender",
    badgeBg: "bg-lavender/30 text-ink",
  },
  {
    id: "completed",
    title: "Completed",
    subhead: "Verified and awarded",
    color: "text-lime",
    accentBorder: "border-lime",
    badgeBg: "bg-lime/30 text-ink",
  },
]

export function TaskBoardView({
  tasks,
  claimsByTaskId,
  usersMap,
  savedTaskIds,
  onToggleSave,
  onSelectTask,
}: TaskBoardViewProps) {
  // Group tasks by column
  const columnTasks = React.useMemo(() => {
    const map: Record<ColumnConfig["id"], Task[]> = {
      open: [],
      in_progress: [],
      pending_verification: [],
      completed: [],
    }

    tasks.forEach((task) => {
      if (task.status === "cancelled") return
      if (map[task.status as ColumnConfig["id"]]) {
        map[task.status as ColumnConfig["id"]].push(task)
      }
    })

    return map
  }, [tasks])

  return (
    <div className="w-full">
      {/* Horizontal snapping columns on mobile, ruled columns on desktop */}
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory no-scrollbar">
        {COLUMNS.map((col) => {
          const colTasks = columnTasks[col.id] || []

          return (
            <div
              key={col.id}
              className="flex-1 min-w-[280px] sm:min-w-[320px] max-w-[360px] snap-center flex flex-col shrink-0"
            >
              {/* Ruled Column Header */}
              <div
                className={cn(
                  "pb-3 mb-4 border-b-2 flex items-center justify-between",
                  col.accentBorder
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans font-black text-sm text-ink">{col.title}</h3>
                    <span
                      className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded-xs tabular-nums border border-ink/20",
                        col.badgeBg
                      )}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink/60 mt-0.5">{col.subhead}</p>
                </div>
              </div>

              {/* Tasks List in Column */}
              <div className="space-y-3 min-h-[300px]">
                {colTasks.length === 0 ? (
                  <div className="py-12 px-4 text-center rounded-sm border border-dashed border-ink/20 bg-white/40">
                    <p className="text-xs text-ink/50 italic">No tasks in this stage</p>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const claim = claimsByTaskId[task.id]
                    const claimant = claim ? usersMap[claim.claimed_by] : undefined
                    const meta = TASK_META_MAP[task.id]
                    const isSaved = savedTaskIds.includes(task.id)

                    return (
                      <div
                        key={task.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectTask(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            onSelectTask(task.id)
                          }
                        }}
                        className="group relative bg-white p-4 rounded-chunky border-2 border-ink shadow-hard-xs hover:shadow-hard transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-cobalt"
                      >
                        {/* Top row: Category tag & Bookmark & Points */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink/70 px-1.5 py-0.5 rounded-xs bg-ivory border border-ink/15">
                            {meta?.category || "Community"}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black tabular-nums text-ink px-1.5 py-0.5 rounded-xs bg-lime border border-ink/30">
                              +{task.reward_points} pts
                            </span>
                            <button
                              type="button"
                              aria-label={isSaved ? "Remove from saved" : "Save task"}
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleSave(task.id)
                              }}
                              className="p-1 text-ink/50 hover:text-ink transition-colors rounded-xs hover:bg-ivory"
                            >
                              <Bookmark
                                className={cn(
                                  "w-3.5 h-3.5",
                                  isSaved && "fill-sun text-sun"
                                )}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="font-sans font-bold text-xs text-ink line-clamp-2 leading-snug group-hover:text-cobalt transition-colors">
                          {task.title}
                        </h4>

                        {/* Metadata pills */}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/65">
                          {meta?.estimatedMinutes && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-ink/40" />
                              <span>{meta.estimatedMinutes}m</span>
                            </span>
                          )}
                          {meta?.locationLabel && (
                            <span className="inline-flex items-center gap-1 max-w-[120px] truncate">
                              <MapPin className="w-3 h-3 text-ink/40 shrink-0" />
                              <span className="truncate">{meta.locationLabel}</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom row: Slots / Claimant avatar */}
                        <div className="mt-3 pt-2.5 border-t border-ink/10 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-ink/70">
                            <Users className="w-3 h-3 text-ink/40" />
                            <span>
                              {claim ? "1" : "0"}/{task.required_volunteers} spots
                            </span>
                          </div>

                          {claimant ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="w-5 h-5 border border-ink/40">
                                {claimant.avatar_url && (
                                  <AvatarImage
                                    src={claimant.avatar_url}
                                    alt={claimant.display_name}
                                  />
                                )}
                                <AvatarFallback className="text-[9px] bg-sun text-ink font-bold">
                                  {claimant.display_name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-ink/80 font-bold truncate max-w-[80px]">
                                {claimant.handle ? `@${claimant.handle}` : claimant.display_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-cobalt font-bold inline-flex items-center gap-0.5">
                              <span>Open</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
