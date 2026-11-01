import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

export interface ErrorAlertProps {
  title?: string
  message: string
  details?: string
  onRetry?: () => void
  className?: string
}

export function parseErrorMessage(message: string, customDetails?: string): { displayMessage: string; technicalDetails?: string } {
  if (!message) {
    return { displayMessage: "An unexpected error occurred. Please try again.", technicalDetails: customDetails }
  }

  const trimmed = message.trim()
  let isJson = false
  let parsedJson: unknown = null

  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      parsedJson = JSON.parse(trimmed)
      isJson = true
    } catch {
      // Not valid JSON
    }
  }

  if (isJson && parsedJson) {
    const rawDetails = customDetails || JSON.stringify(parsedJson, null, 2)
    if (Array.isArray(parsedJson)) {
      const hasUuidError = parsedJson.some(
        (issue: Record<string, unknown>) =>
          issue?.message === "Invalid UUID" ||
          issue?.validation === "uuid" ||
          issue?.code === "invalid_string" ||
          issue?.code === "invalid_format"
      )
      if (hasUuidError) {
        return {
          displayMessage: "The server returned records with an invalid identifier format.",
          technicalDetails: rawDetails,
        }
      }
      return {
        displayMessage: "Data verification issue: received information does not match expected format.",
        technicalDetails: rawDetails,
      }
    }
    return {
      displayMessage: "An error occurred while communicating with the service.",
      technicalDetails: rawDetails,
    }
  }

  if (message.includes("ZodError") || message.includes("invalid_string") || message.includes("Invalid UUID")) {
    return {
      displayMessage: "A data formatting issue prevented this section from displaying properly.",
      technicalDetails: customDetails || message,
    }
  }

  return { displayMessage: message, technicalDetails: customDetails }
}

export function ErrorAlert({
  title = "An error occurred",
  message,
  details,
  onRetry,
  className,
}: ErrorAlertProps) {
  const { displayMessage, technicalDetails } = React.useMemo(
    () => parseErrorMessage(message, details),
    [message, details]
  )
  const isDev = process.env.NODE_ENV !== "production"

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-sm border border-destructive/50 bg-destructive/10 text-foreground",
        className
      )}
    >
      <div className="flex items-start gap-3 w-full">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <div className="w-full">
          <h3 className="text-sm font-semibold text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{displayMessage}</p>
          {isDev && technicalDetails && (
            <details className="mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium hover:text-foreground">Technical details</summary>
              <pre className="mt-1 p-2 bg-background/80 rounded border text-[11px] overflow-x-auto whitespace-pre-wrap font-mono">
                {technicalDetails}
              </pre>
            </details>
          )}
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-destructive/40 hover:bg-destructive/20 text-xs shrink-0"
        >
          Try again
        </Button>
      )}
    </div>
  )
}
