"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Task } from "@/lib/schemas/task.schema"
import { CheckSquare, Award } from "lucide-react"

export interface TaskPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: Task[]
  onSelectTask: (task: Task) => void
}

export function TaskPickerModal({
  open,
  onOpenChange,
  tasks,
  onSelectTask,
}: TaskPickerModalProps) {
  const [filterQuery, setFilterQuery] = React.useState("")

  const openTasks = React.useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        t.title.toLowerCase().includes(filterQuery.toLowerCase())
    )
  }, [tasks, filterQuery])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-ink rounded-sm p-6 shadow-hard-lg space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cobalt shrink-0" />
            <DialogTitle className="text-base font-black text-ink font-sans">
              Share a task in chat
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink/70">
            Select an open volunteer task to reference in your message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search tasks..."
            aria-label="Filter tasks"
            className="w-full p-2.5 rounded-sm border-2 border-ink bg-ivory text-xs text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          />

          <div className="max-h-64 overflow-y-auto divide-y divide-ink/10">
            {openTasks.length === 0 ? (
              <p className="text-xs text-ink/60 py-4 text-center">
                No matching open tasks found.
              </p>
            ) : (
              openTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    onSelectTask(task)
                    onOpenChange(false)
                  }}
                  className="w-full text-left py-2.5 px-2 hover:bg-ivory flex items-center justify-between gap-2 rounded-xs transition-colors cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-ink group-hover:text-cobalt truncate">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-ink/60 font-semibold capitalize">
                      {task.required_volunteers} {task.required_volunteers === 1 ? "spot" : "spots"} available
                    </p>
                  </div>

                  <span className="shrink-0 flex items-center gap-1 text-[11px] font-black tabular-nums px-2 py-0.5 rounded-full bg-sun/30 border border-ink text-ink">
                    <Award className="w-3 h-3 text-ink" />
                    <span>{task.reward_points} pts</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
