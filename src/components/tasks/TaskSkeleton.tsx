import * as React from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TaskSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tasks"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {[1, 2, 3, 4, 5, 6].map((index) => {
        // Vary density across cards
        const isDense = index % 3 === 0
        const isCompletedLedger = index === 6

        return (
          <Card
            key={index}
            className={`border bg-card shadow-sm transition-all ${
              isCompletedLedger
                ? "border-l-4 border-l-lime bg-muted/20"
                : "border-border/80"
            }`}
          >
            <CardHeader className="pb-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-sm" />
              </div>
              <Skeleton className="h-6 w-5/6" />
            </CardHeader>

            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className={`h-4 ${isDense ? "w-2/3" : "w-4/5"}`} />
              {isDense && <Skeleton className="h-4 w-1/2" />}
            </CardContent>

            <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-24 rounded-sm" />
            </CardFooter>
          </Card>
        )
      })}
      <span className="sr-only">Loading 6 tasks...</span>
    </div>
  )
}
