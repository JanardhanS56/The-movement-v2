import * as React from "react"
import { cn } from "@/lib/utils"

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  leftStrip?: "lime" | "cobalt" | "sun" | "tomato" | "muted" | null
  needsYou?: boolean
}

export function ListItem({
  leftStrip,
  needsYou,
  children,
  className,
  ...props
}: ListItemProps) {
  const stripColors = {
    lime: "border-l-8 border-l-lime",
    cobalt: "border-l-8 border-l-cobalt",
    sun: "border-l-8 border-l-sun",
    tomato: "border-l-8 border-l-tomato",
    muted: "border-l-8 border-l-muted",
  }

  return (
    <div
      className={cn(
        "relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-chunky border-2 border-border/80 bg-card text-card-foreground shadow-hard transition-all duration-150 hover:-translate-y-0.5",
        leftStrip && stripColors[leftStrip],
        needsYou && "ring-2 ring-tomato border-tomato/80 shadow-[4px_4px_0px_0px_#FF4D2E]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
