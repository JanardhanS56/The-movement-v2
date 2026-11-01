"use client"

import * as React from "react"
import { TaskFilterRail, TaskFilterRailProps } from "./TaskFilterRail"

export interface TaskFilterDrawerProps extends TaskFilterRailProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskFilterDrawer({
  isOpen,
  onClose,
  ...railProps
}: TaskFilterDrawerProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
      // Prevent body scrolling while drawer is open
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter tasks bottom sheet"
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Sheet Content */}
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl border-t-2 border-x-2 border-ink bg-white p-2 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-ink/20 rounded-full mx-auto my-2 shrink-0" />
        <TaskFilterRail
          {...railProps}
          isMobileSheet
          onCloseMobileSheet={onClose}
          className="border-0 shadow-none p-4"
        />
      </div>
    </div>
  )
}
