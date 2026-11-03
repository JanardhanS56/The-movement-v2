import { describe, it, expect } from "vitest";
import React from "react";
import {
  FeatureCards,
  DEFAULT_FEATURES,
  type FeatureItem,
} from "@/components/ui/FeatureCards";
import { Flag, MapPin, ClipboardCheck, Shield } from "lucide-react";

describe("FeatureCards Component and Dataset Specification", () => {
  it("exports FeatureCards functional component", () => {
    expect(typeof FeatureCards).toBe("function");
  });

  it("provides exactly 3 default features conforming to design specifications", () => {
    expect(DEFAULT_FEATURES).toHaveLength(3);

    // Card 1
    const card1 = DEFAULT_FEATURES[0];
    expect(card1.id).toBe("multi-sig");
    expect(card1.title).toBe("Multi-Sig Announcements");
    expect(card1.description).toContain("cryptographic signatures");
    expect(card1.icon).toBe(Flag);
    expect(card1.iconClassName).toContain("text-neutral-900");
    expect(card1.iconClassName).toContain("stroke-[1.75]");

    // Card 2
    const card2 = DEFAULT_FEATURES[1];
    expect(card2.id).toBe("heatmap");
    expect(card2.title).toBe("Live Check-in Heatmap");
    expect(card2.description).toContain("GPS density visualization");
    expect(card2.icon).toBe(MapPin);
    expect(card2.iconClassName).toContain("text-neutral-900");
    expect(card2.iconClassName).toContain("stroke-[1.75]");

    // Card 3
    const card3 = DEFAULT_FEATURES[2];
    expect(card3.id).toBe("bounty-board");
    expect(card3.title).toBe("Bounty Board & Verifications");
    expect(card3.description).toContain("randomized peer review consensus");
    expect(card3.icon).toBe(ClipboardCheck);
    expect(card3.iconClassName).toContain("text-[#A4B600]");
    expect(card3.iconClassName).toContain("stroke-[2]");
    expect(card3.accentColor).toBe("#D4E700");
  });

  it("instantiates FeatureCards with default props", () => {
    const element = React.createElement(FeatureCards, null);
    expect(element.type).toBe(FeatureCards);
    expect(element.props).toEqual({});
  });

  it("instantiates FeatureCards with customized props and features array", () => {
    const customFeatures: FeatureItem[] = [
      {
        id: "custom-1",
        icon: Shield,
        iconClassName: "text-neutral-900 stroke-[1.75]",
        title: "Security Shield",
        description: "Zero-knowledge verification layer for secure decentralized coordination.",
      },
    ];

    const element = React.createElement(FeatureCards, {
      className: "custom-class",
      wrapperClassName: "custom-wrapper",
      features: customFeatures,
      sectionTitle: "Custom Title",
    });

    expect(element.props.className).toBe("custom-class");
    expect(element.props.wrapperClassName).toBe("custom-wrapper");
    expect(element.props.sectionTitle).toBe("Custom Title");
    expect(element.props.features).toBeDefined();
    expect(element.props.features?.[0]?.title).toBe("Security Shield");
  });
});
