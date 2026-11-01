"use client"

import * as React from "react"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import "leaflet.heat"
import { AggregatedCheckInPoint } from "@/lib/schemas/check-in.schema"

// Configure default marker icons from public/leaflet/
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
})

export interface LeafletMapProps {
  points: AggregatedCheckInPoint[]
  userCheckIn: { lat: number; lng: number } | null
  onEscape?: () => void
}

const DEFAULT_CENTER: [number, number] = [12.875, 74.850] // Mangalore regional center
const DEFAULT_ZOOM = 13

export function LeafletMap({
  points,
  userCheckIn,
  onEscape,
}: LeafletMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null)
  const mapInstanceRef = React.useRef<L.Map | null>(null)
  const heatLayerRef = React.useRef<L.HeatLayer | null>(null)
  const userMarkerRef = React.useRef<L.CircleMarker | null>(null)

  // 1. Initialize Leaflet Map Instance ONCE
  React.useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      keyboard: true,
    })

    // OpenStreetMap attribution and tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Initial aggregated heat layer
    const heatData: Array<[number, number, number]> = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ])

    const heat = L.heatLayer(heatData, {
      radius: 25,
      blur: 18,
      maxZoom: 16,
      max: 1.0,
      gradient: {
        0.2: "#0284c7",
        0.5: "#eab308",
        0.8: "#f97316",
        1.0: "#ef4444",
      },
    }).addTo(map)

    heatLayerRef.current = heat
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      heatLayerRef.current = null
      userMarkerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. Update heat layer with setLatLngs on points change (Do NOT recreate)
  React.useEffect(() => {
    if (!heatLayerRef.current) return

    const heatData: Array<[number, number, number]> = points.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ])

    heatLayerRef.current.setLatLngs(heatData)
  }, [points])

  // 3. User's Own Dot: Show ONLY current user's dot immediately
  React.useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clean up previous marker if position changes
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    if (userCheckIn) {
      // Distinct beacon circle for user's own check-in
      const marker = L.circleMarker([userCheckIn.lat, userCheckIn.lng], {
        radius: 9,
        color: "#2563eb",
        fillColor: "#38bdf8",
        fillOpacity: 0.95,
        weight: 3,
      })
        .bindPopup(
          "<div class='font-sans text-xs'><strong>Your Check-in Location</strong><br>Rounded to ~110m for privacy protection.</div>"
        )
        .addTo(map)

      userMarkerRef.current = marker

      // Pan smoothly to user's location
      map.setView([userCheckIn.lat, userCheckIn.lng], Math.max(map.getZoom(), 14), {
        animate: true,
      })
    }
  }, [userCheckIn])

  // 4. Keyboard Navigation: Escape key exits map interaction and returns focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      if (onEscape) {
        onEscape()
      } else {
        // Blur map container to return focus
        mapContainerRef.current?.blur()
      }
    }
  }

  return (
    <div
      ref={mapContainerRef}
      role="application"
      aria-label="Movement Check-in Heatmap showing volunteer concentration density"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full h-[560px] min-h-[500px] rounded-md overflow-hidden relative z-0 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
    />
  )
}
