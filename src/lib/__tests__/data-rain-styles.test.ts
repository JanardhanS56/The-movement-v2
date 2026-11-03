import { describe, it, expect } from "vitest";
import { parseHex } from "@/components/ui/data-rain";

describe("DataRain Computed Style Fallback Engine", () => {
  const DEFAULT_CALM: readonly [number, number, number] = [34, 230, 255];
  const DEFAULT_MID: readonly [number, number, number] = [138, 92, 255];
  const DEFAULT_HOT: readonly [number, number, number] = [255, 61, 154];
  const DEFAULT_CORE: readonly [number, number, number] = [234, 252, 255];

  it("handles missing CSS custom properties with resilient default colors", () => {
    expect(parseHex("", DEFAULT_CALM)).toEqual(DEFAULT_CALM);
    expect(parseHex(undefined, DEFAULT_MID)).toEqual(DEFAULT_MID);
    expect(parseHex(undefined, DEFAULT_HOT)).toEqual(DEFAULT_HOT);
    expect(parseHex("", DEFAULT_CORE)).toEqual(DEFAULT_CORE);
  });

  it("prioritizes runtime prop overrides above computed CSS custom properties", () => {
    const customCalm = "#ffaa00";
    const resolvedCalm = parseHex(customCalm, DEFAULT_CALM);
    expect(resolvedCalm).toEqual([255, 170, 0]);
  });
});

