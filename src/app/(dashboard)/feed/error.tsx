"use client"

import * as React from "react"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-8">
      <ErrorAlert
        title="Could not load announcements"
        message={error.message || "An unexpected error occurred while fetching movement announcements."}
        onRetry={reset}
      />
    </div>
  )
}
