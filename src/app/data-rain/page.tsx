"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RefreshCw, Palette, Sliders, Maximize2, Minimize2, Eye } from "lucide-react";
import DataRain, { type DataRainPalette } from "@/components/ui/data-rain";
import { DATA_RAIN_PRESETS, type DataRainPreset } from "@/lib/constants/data-rain-palettes";
import { Button } from "@/components/ui/button";

export default function DataRainDemoPage() {
  const [presetKey, setPresetKey] = React.useState<string>("cyberpunk");
  const [flowSpeed, setFlowSpeed] = React.useState<number>(1.0);
  const [obstacleRadius, setObstacleRadius] = React.useState<number>(64);
  const [particleCount, setParticleCount] = React.useState<number>(2400);
  const [autopilot, setAutopilot] = React.useState<boolean>(true);
  const [fullscreen, setFullscreen] = React.useState<boolean>(true);
  const [showControls, setShowControls] = React.useState<boolean>(true);

  const currentPreset: DataRainPreset = DATA_RAIN_PRESETS[presetKey] || DATA_RAIN_PRESETS.cyberpunk;

  const handlePresetSelect = (key: string) => {
    setPresetKey(key);
    const chosen = DATA_RAIN_PRESETS[key];
    if (chosen) {
      setFlowSpeed(chosen.flowSpeed);
      setObstacleRadius(chosen.obstacleRadius);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020308] text-white">
      {/* Background canvas */}
      <div className={fullscreen ? "fixed inset-0 z-0" : "relative z-0 h-[65vh] w-full border-b border-white/10"}>
        <DataRain
          palette={currentPreset.palette}
          flowSpeed={flowSpeed}
          obstacleRadius={obstacleRadius}
          count={particleCount}
          autopilot={autopilot}
          fullscreen={fullscreen}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22e6ff]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Return to Movement</span>
          </Link>
          <div className="h-4 w-px bg-white/20" />
          <h1 className="text-base font-bold tracking-tight text-white md:text-lg">
            DataRain Fluid Particle Engine
          </h1>
          <span className="rounded bg-[#22e6ff]/10 px-2 py-0.5 text-[10px] font-mono uppercase text-[#22e6ff]">
            Interactive Showcase
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControls((prev) => !prev)}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{showControls ? "Hide Controls" : "Show Controls"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen((prev) => !prev)}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            {fullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Contained View</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Floating Control Panel */}
      {showControls && (
        <aside
          aria-label="Particle Simulation Controls"
          className="fixed bottom-6 right-6 z-20 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-white/15 bg-black/80 p-5 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[#22e6ff]" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Simulation Controls
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setFlowSpeed(currentPreset.flowSpeed);
                setObstacleRadius(currentPreset.obstacleRadius);
                setParticleCount(2400);
                setAutopilot(true);
              }}
              className="text-white/50 transition hover:text-white"
              title="Reset defaults"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Palette Presets */}
            <div>
              <label className="mb-1.5 block font-semibold text-white/80">
                Preset Palette: {currentPreset.name}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.keys(DATA_RAIN_PRESETS).map((key) => {
                  const p = DATA_RAIN_PRESETS[key];
                  const isActive = presetKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetSelect(key)}
                      title={p.name}
                      className={`flex h-8 flex-col items-center justify-center rounded border transition ${
                        isActive ? "border-[#22e6ff] bg-white/20 ring-1 ring-[#22e6ff]" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex gap-0.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.palette.calm }} />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.palette.mid }} />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.palette.hot }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flow Speed */}
            <div>
              <div className="mb-1 flex justify-between font-mono text-[11px] text-white/70">
                <span>Flow Velocity</span>
                <span className="text-[#22e6ff]">{flowSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={flowSpeed}
                onChange={(e) => setFlowSpeed(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#22e6ff]"
              />
            </div>

            {/* Obstacle Radius */}
            <div>
              <div className="mb-1 flex justify-between font-mono text-[11px] text-white/70">
                <span>Obstacle Radius</span>
                <span className="text-[#22e6ff]">{obstacleRadius}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="140"
                step="4"
                value={obstacleRadius}
                onChange={(e) => setObstacleRadius(parseInt(e.target.value, 10))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#22e6ff]"
              />
            </div>

            {/* Particle Density */}
            <div>
              <div className="mb-1 flex justify-between font-mono text-[11px] text-white/70">
                <span>Particle Density</span>
                <span className="text-[#22e6ff]">{particleCount}</span>
              </div>
              <input
                type="range"
                min="600"
                max="5000"
                step="200"
                value={particleCount}
                onChange={(e) => setParticleCount(parseInt(e.target.value, 10))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-[#22e6ff]"
              />
            </div>

            {/* Autopilot Switch */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-white/80">Lissajous Autopilot</span>
              <button
                type="button"
                onClick={() => setAutopilot((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  autopilot ? "bg-[#22e6ff]/20 text-[#22e6ff]" : "bg-white/10 text-white/50"
                }`}
              >
                {autopilot ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span>{autopilot ? "Active" : "Paused"}</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Non-fullscreen container info card */}
      {!fullscreen && (
        <section className="relative z-10 mx-auto max-w-4xl p-6">
          <div className="rounded-xl border border-white/15 bg-black/60 p-6 backdrop-blur-lg">
            <h2 className="text-xl font-bold tracking-tight text-white">Contained Canvas Integration</h2>
            <p className="mt-2 text-sm text-white/70">
              When <code>fullscreen=false</code>, DataRain adapts to its parent container bounds with full fluid dynamics,
              making it suitable for hero backgrounds, card banners, and ambient dashboard telemetry.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
