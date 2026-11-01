import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  description?: string
  action?: React.ReactNode
  badge?: React.ReactNode
  tint?: "default" | "cobalt" | "lime" | "tomato" | "sun" | "lavender"
}

export function Section({
  title,
  description,
  action,
  badge,
  tint = "default",
  children,
  className,
  ...props
}: SectionProps) {
  const tintClasses = {
    default: "bg-transparent",
    cobalt: "bg-cobalt text-white",
    lime: "bg-lime/15 border-2 border-ink",
    tomato: "bg-tomato/10 border-2 border-tomato",
    sun: "bg-sun/15 border-2 border-ink",
    lavender: "bg-lavender/20 border-2 border-ink",
  }[tint]

  return (
    <section className={cn("space-y-6 my-12 first:mt-0 last:mb-0", className)} {...props}>
      {(title || description || action || badge) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b-2 border-border/80">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {title && (
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                  {title}
                </h2>
              )}
              {badge}
            </div>
            {description && (
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl font-sans">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={cn("rounded-chunky", tint !== "default" && "p-6", tintClasses)}>
        {children}
      </div>
    </section>
  )
}
