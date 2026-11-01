"use client"

import * as React from "react"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-8">
      <ErrorAlert
        title="Could not load tasks"
        message={error.message || "An unexpected error occurred while loading the bounty board."}
        onRetry={reset}
      />
    </div>
  )
}
