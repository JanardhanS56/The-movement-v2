import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Compass } from "lucide-react"

export function MapSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading geographic heatmap"
      className="w-full h-[560px] min-h-[500px] rounded-md border border-border/80 bg-card/60 p-4 relative flex flex-col items-center justify-center space-y-4 overflow-hidden"
    >
      {/* Background grid texture representing map tiles */}
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 flex flex-col items-center space-y-3">
        <div className="p-3 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse">
          <Compass className="w-8 h-8" aria-hidden="true" />
        </div>
        <Skeleton className="h-5 w-48 rounded-sm" />
        <Skeleton className="h-4 w-72 rounded-sm" />
      </div>

      <div className="absolute bottom-6 right-6 z-10">
        <Skeleton className="h-12 w-36 rounded-md" />
      </div>

      <span className="sr-only">Loading Leaflet check-in heatmap...</span>
    </div>
  )
}
