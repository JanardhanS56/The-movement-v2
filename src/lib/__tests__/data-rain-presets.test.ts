import { describe, it, expect } from "vitest";
import { DATA_RAIN_PRESETS } from "@/lib/constants/data-rain-palettes";
import { parseHex } from "@/components/ui/data-rain";

describe("DataRain Presets Configuration", () => {
  it("contains all key civic and cyber presets", () => {
    expect(DATA_RAIN_PRESETS).toHaveProperty("cyberpunk");
    expect(DATA_RAIN_PRESETS).toHaveProperty("matrix");
    expect(DATA_RAIN_PRESETS).toHaveProperty("arctic");
    expect(DATA_RAIN_PRESETS).toHaveProperty("amber");
    expect(DATA_RAIN_PRESETS).toHaveProperty("monochrome");
  });

  it("ensures all presets have valid 6-character hex colors that parse cleanly", () => {
    const dummyFallback: readonly [number, number, number] = [0, 0, 0];
    for (const [key, preset] of Object.entries(DATA_RAIN_PRESETS)) {
      expect(preset.id).toBe(key);
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);

      const calmRgb = parseHex(preset.palette.calm, dummyFallback);
      const midRgb = parseHex(preset.palette.mid, dummyFallback);
      const hotRgb = parseHex(preset.palette.hot, dummyFallback);

      expect(calmRgb).not.toEqual(dummyFallback);
      expect(midRgb).not.toEqual(dummyFallback);
      expect(hotRgb).not.toEqual(dummyFallback);
    }
  });

  it("ensures flow speeds and obstacle radii are bounded within safe physics limits", () => {
    for (const preset of Object.values(DATA_RAIN_PRESETS)) {
      expect(preset.flowSpeed).toBeGreaterThanOrEqual(0.1);
      expect(preset.flowSpeed).toBeLessThanOrEqual(5.0);

      expect(preset.obstacleRadius).toBeGreaterThanOrEqual(20);
      expect(preset.obstacleRadius).toBeLessThanOrEqual(200);
    }
  });
});
