"use client";

import * as React from "react";
import DataRain, { type DataRainPalette } from "@/components/ui/data-rain";
import { cn } from "@/lib/utils";

export interface DataRainCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  palette?: DataRainPalette;
  flowSpeed?: number;
  obstacleRadius?: number;
  count?: number;
  title?: string;
  badge?: string;
}

export function DataRainCard({
  children,
  className,
  palette,
  flowSpeed = 0.6,
  obstacleRadius = 40,
  count = 800,
  title,
  badge,
  ...props
}: DataRainCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-[#05070d] text-white shadow-lg transition-all hover:border-[#22e6ff]/40",
        className
      )}
      {...props}
    >
      {/* Background Particle Stream */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none opacity-60">
        <DataRain
          fullscreen={false}
          palette={palette}
          flowSpeed={flowSpeed}
          obstacleRadius={obstacleRadius}
          count={count}
          autopilot={true}
        />
      </div>

      {/* Scrim Overlay for Content Contrast */}
      <div className="absolute inset-0 z-[1] bg-black/60 backdrop-blur-[0.5px]" />

      {/* Card Content */}
      <div className="relative z-[2] p-5">
        {(title || badge) && (
          <div className="mb-3 flex items-center justify-between">
            {title && <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>}
            {badge && (
              <span className="rounded bg-[#22e6ff]/15 px-2 py-0.5 text-[10px] font-mono uppercase text-[#22e6ff]">
                {badge}
              </span>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
