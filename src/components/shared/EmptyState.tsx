import * as React from "react"
import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description = "No items to show.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-sm border border-dashed border-border bg-card/50",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-secondary text-muted-foreground mb-4">
        {icon || <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
