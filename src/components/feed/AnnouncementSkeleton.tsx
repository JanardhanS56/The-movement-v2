import * as React from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AnnouncementSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading announcements"
      className="space-y-4"
    >
      {[1, 2, 3].map((index) => (
        <Card
          key={index}
          className="border-l-4 border-l-muted bg-card shadow-sm transition-all"
        >
          <CardHeader className="pb-3 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-sm" />
            </div>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter className="pt-2 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-24 rounded-sm" />
          </CardFooter>
        </Card>
      ))}
      <span className="sr-only">Loading 3 announcement items...</span>
    </div>
  )
}
