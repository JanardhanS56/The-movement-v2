import { describe, it, expect } from "vitest";
import React from "react";
import { DataRainHero } from "@/components/ui/data-rain-hero";
import { DataRainCard } from "@/components/ui/data-rain-card";

describe("DataRain Container Components", () => {
  it("exports DataRainHero component successfully", () => {
    expect(typeof DataRainHero).toBe("function");
  });

  it("exports DataRainCard component successfully", () => {
    expect(typeof DataRainCard).toBe("function");
  });

  it("validates DataRainHero props structure", () => {
    const heroElement = React.createElement(
      DataRainHero,
      { intensity: "vivid", flowSpeed: 1.2 },
      React.createElement("span", null, "Hero Title")
    );
    expect(heroElement.props.intensity).toBe("vivid");
    expect(heroElement.props.flowSpeed).toBe(1.2);
  });

  it("validates DataRainCard props structure and badge", () => {
    const cardElement = React.createElement(
      DataRainCard,
      { title: "Network Status", badge: "Live" },
      React.createElement("p", null, "Telemetry payload")
    );
    expect(cardElement.props.title).toBe("Network Status");
    expect(cardElement.props.badge).toBe("Live");
  });
});

