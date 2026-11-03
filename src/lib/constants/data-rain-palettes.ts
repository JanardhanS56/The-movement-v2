import type { DataRainPalette } from "@/components/ui/data-rain";

export interface DataRainPreset {
  id: string;
  name: string;
  description: string;
  palette: DataRainPalette;
  flowSpeed: number;
  obstacleRadius: number;
}

export const DATA_RAIN_PRESETS: Record<string, DataRainPreset> = {
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyberpunk Glow",
    description: "Vibrant neon cyan, violet, and magenta particle streams",
    palette: {
      calm: "#22e6ff",
      mid: "#8a5cff",
      hot: "#ff3d9a",
    },
    flowSpeed: 1.0,
    obstacleRadius: 64,
  },
  matrix: {
    id: "matrix",
    name: "Terminal Matrix",
    description: "Phosphor monochrome greens for high-tech field terminals",
    palette: {
      calm: "#00ff66",
      mid: "#10b981",
      hot: "#6ee7b7",
    },
    flowSpeed: 1.25,
    obstacleRadius: 72,
  },
  arctic: {
    id: "arctic",
    name: "Arctic Blue",
    description: "Glacial blues and crisp cool white filaments",
    palette: {
      calm: "#38bdf8",
      mid: "#60a5fa",
      hot: "#e0f2fe",
    },
    flowSpeed: 0.85,
    obstacleRadius: 56,
  },
  amber: {
    id: "amber",
    name: "Solar Amber",
    description: "Warm dusk golden filaments and emergency warning flares",
    palette: {
      calm: "#f59e0b",
      mid: "#f97316",
      hot: "#fef08a",
    },
    flowSpeed: 1.1,
    obstacleRadius: 68,
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome Stealth",
    description: "Subtle silver and graphite field for minimalist dashboards",
    palette: {
      calm: "#94a3b8",
      mid: "#cbd5e1",
      hot: "#ffffff",
    },
    flowSpeed: 0.7,
    obstacleRadius: 60,
  },
};
