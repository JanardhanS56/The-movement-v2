import * as React from "react"
import { cn } from "@/lib/utils"

export type StatusVariant =
  | "open"
  | "in_progress"
  | "pending"
  | "completed"
  | "verified"
  | "needs_you"
  | "cancelled"
  | "default"

export interface StatusLabelProps {
  status: StatusVariant | string
  label?: string
  className?: string
}

export function StatusLabel({ status, label, className }: StatusLabelProps) {
  const normalized = status.toLowerCase().replace(/[\s-]/g, "_")

  let config = {
    bg: "bg-lavender",
    shape: "rounded-full", // circle
    text: "text-ink",
    border: "border-ink",
    defaultLabel: "Active",
  }

  switch (normalized) {
    case "open":
      config = {
        bg: "bg-lime",
        shape: "rounded-full",
        text: "text-ink font-bold",
        border: "border-ink",
        defaultLabel: "Open",
      }
      break
    case "in_progress":
      config = {
        bg: "bg-cobalt",
        shape: "rounded-sm rotate-45",
        text: "text-white font-bold",
        border: "border-ink",
        defaultLabel: "In progress",
      }
      break
    case "pending":
    case "pending_verification":
    case "pending_signatures":
      config = {
        bg: "bg-sun",
        shape: "rounded-sm",
        text: "text-ink font-bold",
        border: "border-ink",
        defaultLabel: "Pending",
      }
      break
    case "completed":
    case "verified":
      config = {
        bg: "bg-lime",
        shape: "rounded-full",
        text: "text-ink font-bold",
        border: "border-ink",
        defaultLabel: "Verified",
      }
      break
    case "needs_you":
      config = {
        bg: "bg-tomato",
        shape: "rounded-none",
        text: "text-ink font-bold",
        border: "border-ink",
        defaultLabel: "Needs you",
      }
      break
    case "cancelled":
      config = {
        bg: "bg-muted",
        shape: "rounded-none",
        text: "text-foreground/80 font-medium",
        border: "border-border",
        defaultLabel: "Cancelled",
      }
      break
  }

  const displayLabel = label || config.defaultLabel

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 h-7 px-3 rounded-chunky border text-sm select-none",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span
        className={cn("w-2 h-2 shrink-0 bg-current", config.shape)}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  )
}
