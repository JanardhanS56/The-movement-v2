"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  MapPin,
  ShieldCheck,
  AlertCircle,
  X,
  Radio,
} from "lucide-react"
import { api } from "@/lib/api"
import { QueryKeys } from "@/lib/query-keys"
import { useAuth } from "@/components/providers/AuthProvider"
import { MapSkeleton } from "./MapSkeleton"
import { ErrorAlert } from "@/components/shared/ErrorAlert"
import { Button } from "@/components/ui/button"

// SSR-safe dynamic import inside client component
const LeafletMap = dynamic(
  () => import("./LeafletMap").then((mod) => mod.LeafletMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
)

export function HeatmapView() {
  const { user, movementId } = useAuth()
  const queryClient = useQueryClient()

  const [userCheckIn, setUserCheckIn] = React.useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = React.useState<string | null>(null)
  const [isLocating, setIsLocating] = React.useState(false)

  // 1. Fetch aggregated check-in points
  const {
    data: points = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QueryKeys.aggregatedCheckIns(),
    queryFn: () => api.getAggregatedCheckInPoints(),
  })

  // 2. Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (coords: { lat: number; lng: number; accuracy?: number }) => {
      if (!user) throw new Error("Authentication required")
      return await api.checkIn(
        {
          movement_id: movementId,
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
        },
        user.id
      )
    },
    onSuccess: (newCheckIn) => {
      setUserCheckIn({ lat: newCheckIn.lat, lng: newCheckIn.lng })
      setGeoError(null)
      toast.success("Checked in successfully. Your approximate location has been aggregated.")
      queryClient.invalidateQueries({ queryKey: QueryKeys.checkIns(movementId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.aggregatedCheckIns() })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to record check-in.")
    },
  })

  // Geolocation trigger ONLY after user taps the button
  const handleCheckInClick = () => {
    setGeoError(null)

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoError(
        "Geolocation is unavailable on this device or browser. You can simulate a check-in using demo coordinates."
      )
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const accuracy = position.coords.accuracy

        checkInMutation.mutate({ lat, lng, accuracy })
      },
      (err) => {
        setIsLocating(false)
        let message = "Unable to retrieve your location."
        if (err.code === err.PERMISSION_DENIED) {
          message =
            "Location access was denied. To check in, please enable location permissions for this site in your browser settings, or use manual demo coordinates simulation."
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message =
            "Location information is currently unavailable. Please verify GPS signal or try again."
        } else if (err.code === err.TIMEOUT) {
          message = "Location request timed out. Please try again."
        }
        setGeoError(message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }

  // Demo fallback check-in near Mangalore
  const handleSimulateCheckIn = () => {
    // Mangalore center coordinates with slight variation
    const mockLat = 12.872 + (Math.random() - 0.5) * 0.015
    const mockLng = 74.846 + (Math.random() - 0.5) * 0.015

    checkInMutation.mutate({
      lat: mockLat,
      lng: mockLng,
      accuracy: 25,
    })
  }

  const handleEscape = () => {
    // Meaningful landmark focus target on Escape
    document.getElementById("heatmap-heading")?.focus()
  }

  return (
    <div className="space-y-4 relative">
      {/* Top Banner & Counter (Labeled Demo Data, No Fake Live Claims) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-card border border-border/80 text-xs">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary shrink-0 animate-pulse" aria-hidden="true" />
          <span className="font-semibold text-foreground">
            {points.length} volunteers checked in
          </span>
          <span className="px-1.5 py-0.5 rounded-xs font-mono text-[10px] uppercase font-semibold bg-primary/10 text-primary border border-primary/20">
            Demo Data
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>Aggregated to ~110m (3 decimal places) for privacy</span>
        </div>
      </div>

      {/* Dismissible Geolocation Error / Denial Explanation with Next Step */}
      {geoError && (
        <div
          role="alert"
          className="p-4 rounded-md border border-destructive/40 bg-destructive/10 text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <span className="font-semibold text-destructive block">
                Location Access Notification
              </span>
              <p className="text-muted-foreground leading-relaxed">{geoError}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSimulateCheckIn}
              loading={checkInMutation.isPending}
              className="text-xs h-8 border-destructive/40"
            >
              Simulate Check-in (Demo)
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setGeoError(null)}
              aria-label="Dismiss location message"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <MapSkeleton />}

      {/* Error State with Retry */}
      {isError && (
        <ErrorAlert
          title="Unable to load geographic heatmap data"
          message={
            error instanceof Error
              ? error.message
              : "Failed to connect to geographic telemetry service."
          }
          onRetry={() => void refetch()}
        />
      )}

      {/* Map Container Area */}
      {!isLoading && !isError && (
        <div className="relative rounded-md overflow-hidden">
          <LeafletMap
            points={points}
            userCheckIn={userCheckIn}
            onEscape={handleEscape}
          />

          {/* Floating "Check In Here" Button (At least 48px tall, bottom-right) */}
          <div className="absolute bottom-5 right-5 z-[400] flex flex-col items-end gap-2">
            {/* Plain explanation of what check-in shares */}
            <div className="hidden sm:block max-w-xs p-2.5 rounded-md bg-background/95 backdrop-blur-md border border-border/80 shadow-md text-[11px] text-muted-foreground space-y-1 text-right">
              <p className="font-medium text-foreground">
                Volunteer Density Check-in
              </p>
              <p>
                Shares approximate coordinates (~110m). Your personal identity and individual location are never shown to other users.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                id="simulate-check-in-button"
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleSimulateCheckIn}
                loading={checkInMutation.isPending}
                disabled={isLocating || checkInMutation.isPending}
                className="min-h-[48px] h-12 px-4 rounded-md font-semibold text-sm shadow-md gap-2 border border-border/80 bg-background/95 hover:bg-secondary text-foreground backdrop-blur-md"
                aria-label="Simulate demo check-in with mock coordinates"
              >
                <Radio className="w-4 h-4 text-primary shrink-0 animate-pulse" aria-hidden="true" />
                <span>Simulate Check-in</span>
              </Button>

              <Button
                id="check-in-button"
                type="button"
                variant="default"
                size="lg"
                onClick={handleCheckInClick}
                loading={isLocating || checkInMutation.isPending}
                disabled={isLocating || checkInMutation.isPending}
                className="min-h-[48px] h-12 px-6 rounded-md font-semibold text-sm shadow-lg gap-2 text-primary-foreground bg-primary hover:bg-primary/90"
                aria-label="Check in your current location"
              >
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isLocating
                    ? "Detecting GPS..."
                    : checkInMutation.isPending
                    ? "Recording..."
                    : "Check In Here"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Visible Text Legend */}
      <section
        aria-label="Heatmap density legend"
        className="p-3.5 rounded-md bg-card border border-border/80 space-y-2 text-xs"
      >
        <div className="flex items-center justify-between text-muted-foreground font-mono text-[11px]">
          <span className="font-semibold text-foreground uppercase tracking-wider">
            Concentration Density Legend
          </span>
          <span>Keyboard: Arrow keys pan, + / - zoom, Escape exits</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 font-mono text-[11px]">
          {/* Low */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0284c7] inline-block shrink-0 shadow-xs" />
            <span className="text-muted-foreground">Low Density</span>
          </div>

          {/* Moderate */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#eab308] inline-block shrink-0 shadow-xs" />
            <span className="text-muted-foreground">Moderate Density</span>
          </div>

          {/* High */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block shrink-0 shadow-xs" />
            <span className="text-muted-foreground">High Concentration</span>
          </div>

          {/* User's Own Dot */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#38bdf8] ring-2 ring-[#2563eb] inline-block shrink-0 animate-pulse" />
            <span className="text-foreground font-medium">Your Check-in Dot</span>
          </div>
        </div>
      </section>
    </div>
  )
}
