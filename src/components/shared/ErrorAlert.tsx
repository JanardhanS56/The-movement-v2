import * as React from "react"
import { ErrorState, ErrorStateProps, parseErrorMessage } from "./ErrorState"

export { ErrorState, parseErrorMessage }
export type { ErrorStateProps }

export type ErrorAlertProps = ErrorStateProps

export function ErrorAlert(props: ErrorAlertProps) {
  return <ErrorState {...props} />
}
