"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./AuthProvider"
import { DemoPanel } from "./DemoPanel"
import { Toaster } from "@/components/ui/sonner"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <DemoPanel />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}
