import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

export interface ErrorStateProps {
  title?: string
  message: string
  details?: string
  actionLabel?: string
  onRetry?: () => void
  className?: string
}

export function parseErrorMessage(
  message: string,
  customDetails?: string
): { displayMessage: string; technicalDetails?: string } {
  if (!message) {
    return {
      displayMessage: "An unexpected error occurred. Please try again.",
      technicalDetails: customDetails,
    }
  }

  const trimmed = message.trim()
  let isJson = false
  let parsedJson: unknown = null

  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
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
      displayMessage: "Could not communicate with the movement service.",
      technicalDetails: rawDetails,
    }
  }

  if (
    message.includes("ZodError") ||
    message.includes("invalid_string") ||
    message.includes("Invalid UUID")
  ) {
    return {
      displayMessage: "Could not display this section due to a data formatting issue.",
      technicalDetails: customDetails || message,
    }
  }

  return { displayMessage: message, technicalDetails: customDetails }
}

export function ErrorState({
  title = "Could not load content",
  message,
  details,
  actionLabel = "Try again",
  onRetry,
  className,
}: ErrorStateProps) {
  const { displayMessage, technicalDetails } = React.useMemo(
    () => parseErrorMessage(message, details),
    [message, details]
  )
  const isDev = process.env.NODE_ENV !== "production"

  return (
    <div
      role="alert"
      className={cn(
        "rounded-chunky border-2 border-tomato bg-tomato/10 p-6 text-foreground shadow-hard",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-sm bg-tomato text-ink shrink-0 font-bold">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">{title}</h3>
            <p className="text-base text-muted-foreground mt-1 leading-relaxed">
              {displayMessage}
            </p>
            <p className="text-sm text-foreground/80 mt-1 font-medium">
              Please check your connection or retry in a few moments.
            </p>

            {isDev && technicalDetails && (
              <details className="mt-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-bold hover:text-foreground">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-background/90 rounded-sm border border-border text-xs overflow-x-auto whitespace-pre-wrap">
                  {technicalDetails}
                </pre>
              </details>
            )}
          </div>
        </div>

        {onRetry && (
          <Button
            type="button"
            onClick={onRetry}
            className="shrink-0 bg-lime text-ink hover:bg-white border-2 border-ink rounded-chunky font-bold px-4 py-2 shadow-hard-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
