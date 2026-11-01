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
        title="We could not load this"
        message={error.message || "We could not load this. Check your connection and try again."}
        onRetry={reset}
      />
    </div>
  )
}
