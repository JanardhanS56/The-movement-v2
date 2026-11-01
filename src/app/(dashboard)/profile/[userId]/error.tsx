"use client"

import * as React from "react"
import { ErrorAlert } from "@/components/shared/ErrorAlert"

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-8">
      <ErrorAlert
        title="Could not load profile"
        message={error.message || "An unexpected error occurred while loading member profile and badges."}
        onRetry={reset}
      />
    </div>
  )
}
