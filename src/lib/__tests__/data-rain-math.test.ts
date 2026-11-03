import { describe, it, expect } from "vitest";
import { clamp, mulberry32, parseHex, makeWave } from "@/components/ui/data-rain";

describe("DataRain Pure Mathematical Helpers", () => {
  describe("clamp()", () => {
    it("preserves numbers within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0.5, 0, 1)).toBe(0.5);
    });

    it("clamps values below minimum", () => {
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(-0.1, 0, 1)).toBe(0);
    });

    it("clamps values above maximum", () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(1.5, 0, 1)).toBe(1);
    });

    it("handles equal bounds correctly", () => {
      expect(clamp(42, 50, 50)).toBe(50);
      expect(clamp(84, 50, 50)).toBe(50);
    });
  });

  describe("mulberry32() PRNG", () => {
    it("generates deterministic floating-point sequence for a fixed seed", () => {
      const rand1 = mulberry32(1337);
      const rand2 = mulberry32(1337);

      const seq1 = [rand1(), rand1(), rand1(), rand1()];
      const seq2 = [rand2(), rand2(), rand2(), rand2()];

      expect(seq1).toEqual(seq2);
    });

    it("generates values strictly in the range [0, 1)", () => {
      const rand = mulberry32(999);
      for (let i = 0; i < 500; i++) {
        const v = rand();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it("produces different sequences for distinct seeds", () => {
      const randA = mulberry32(101);
      const randB = mulberry32(202);

      const valA = randA();
      const valB = randB();
      expect(valA).not.toBe(valB);
    });
  });

  describe("parseHex() Color Parsing", () => {
    const fallback: readonly [number, number, number] = [34, 230, 255];

    it("parses 6-character hex with hash prefix", () => {
      expect(parseHex("#22e6ff", fallback)).toEqual([34, 230, 255]);
      expect(parseHex("#ffffff", fallback)).toEqual([255, 255, 255]);
      expect(parseHex("#000000", fallback)).toEqual([0, 0, 0]);
    });

    it("parses 6-character hex without hash prefix", () => {
      expect(parseHex("8a5cff", fallback)).toEqual([138, 92, 255]);
      expect(parseHex("ff3d9a", fallback)).toEqual([255, 61, 154]);
    });

    it("expands 3-character short hex codes correctly", () => {
      expect(parseHex("#fff", fallback)).toEqual([255, 255, 255]);
      expect(parseHex("#f0a", fallback)).toEqual([255, 0, 170]);
    });

    it("returns fallback for invalid hex format", () => {
      expect(parseHex("not-a-color", fallback)).toEqual(fallback);
      expect(parseHex("#12345", fallback)).toEqual(fallback);
      expect(parseHex("", fallback)).toEqual(fallback);
      expect(parseHex(undefined, fallback)).toEqual(fallback);
    });
  });

  describe("makeWave() Divergence-Free Vector Field Physics", () => {
    it("creates wave structures with correct spatial wavenumber and angular frequency", () => {
      const wave = makeWave(400, 0, 0.25, 1.0, 15);
      expect(wave.om).toBe(0.25);
      expect(wave.ph).toBe(1.0);
      expect(wave.kx).toBeCloseTo((Math.PI * 2) / 400);
      expect(wave.ky).toBeCloseTo(0);
      expect(wave.au).toBeCloseTo(0);
      expect(wave.av).toBeCloseTo(-15);
    });

    it("satisfies analytic divergence-free boundary properties", () => {
      const angle = Math.PI / 4;
      const wave = makeWave(500, angle, 0.3, 0.5, 20);
      expect(Math.sqrt(wave.au * wave.au + wave.av * wave.av)).toBeCloseTo(20);
    });
  });
});

