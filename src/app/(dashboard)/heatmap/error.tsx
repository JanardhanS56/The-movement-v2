"use client"

import * as React from "react"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

export default function HeatmapError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-8">
      <ErrorAlert
        title="Could not load heatmap"
        message={error.message || "An unexpected error occurred while loading geographic check-in coordinates."}
        onRetry={reset}
      />
    </div>
  )
}
