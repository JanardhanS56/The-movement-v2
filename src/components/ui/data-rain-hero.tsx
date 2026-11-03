"use client";

import * as React from "react";
import DataRain, { type DataRainPalette } from "@/components/ui/data-rain";
import { cn } from "@/lib/utils";

export interface DataRainHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  palette?: DataRainPalette;
  flowSpeed?: number;
  obstacleRadius?: number;
  count?: number;
  autopilot?: boolean;
  intensity?: "subtle" | "medium" | "vivid";
}

export function DataRainHero({
  children,
  className,
  palette,
  flowSpeed = 0.8,
  obstacleRadius = 56,
  count = 1400,
  autopilot = true,
  intensity = "subtle",
  ...props
}: DataRainHeroProps) {
  const overlayOpacity =
    intensity === "subtle"
      ? "bg-[#020308]/85"
      : intensity === "medium"
      ? "bg-[#020308]/70"
      : "bg-[#020308]/50";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#020308] text-white shadow-2xl",
        className
      )}
      {...props}
    >
      {/* Background Fluid Canvas */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <DataRain
          fullscreen={false}
          palette={palette}
          flowSpeed={flowSpeed}
          obstacleRadius={obstacleRadius}
          count={count}
          autopilot={autopilot}
        />
      </div>

      {/* Atmospheric Contrast Scrim */}
      <div className={cn("absolute inset-0 z-[1] backdrop-blur-[1px]", overlayOpacity)} />

      {/* Foreground Content */}
      <div className="relative z-[2] w-full p-6 sm:p-8 md:p-12">{children}</div>
    </div>
  );
}
