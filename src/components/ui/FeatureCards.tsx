"use client";

import * as React from "react";
import { Flag, MapPin, ClipboardCheck, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export interface FeatureItem {
  id: string;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
}

export interface FeatureCardsProps {
  className?: string;
  features?: FeatureItem[];
  sectionTitle?: string;
}

export const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: "multi-sig",
    icon: Flag,
    iconClassName: "text-neutral-900 stroke-[1.75]",
    title: "Multi-Sig Announcements",
    description:
      "Field notices require multiple organizer cryptographic signatures before publishing to prevent false alarms.",
  },
  {
    id: "heatmap",
    icon: MapPin,
    iconClassName: "text-neutral-900 stroke-[1.75]",
    title: "Live Check-in Heatmap",
    description:
      "Real-time GPS density visualization displaying volunteer distribution across field sectors.",
  },
  {
    id: "bounty-board",
    icon: ClipboardCheck,
    iconClassName: "text-yellow-500 stroke-[1.75]",
    title: "Bounty Board & Verifications",
    description:
      "Community tasks claimed by volunteers and validated through randomized peer review consensus.",
  },
];

export function FeatureCards({
  className = "",
  features = DEFAULT_FEATURES,
  sectionTitle = "Platform Features",
}: FeatureCardsProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.45,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <section
      aria-label={sectionTitle}
      className={`w-full max-w-7xl mx-auto p-4 md:p-8 ${className}`}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
      >
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <motion.article
              key={feature.id}
              variants={cardVariants}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4, transition: { duration: 0.2, ease: "easeOut" } }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : { scale: 0.99, transition: { duration: 0.1 } }
              }
              className="h-full flex flex-col justify-between bg-[#EBEBEB] border border-neutral-200/60 rounded-2xl p-6 md:p-8 transition-colors duration-200 hover:border-neutral-300"
            >
              <div>
                {/* Icon Container */}
                <div className="mb-6 inline-flex items-center justify-center">
                  <IconComponent
                    aria-hidden="true"
                    className={`w-7 h-7 ${feature.iconClassName}`}
                  />
                </div>

                {/* Card Title */}
                <h3 className="font-bold text-neutral-900 leading-snug text-xl md:text-2xl tracking-tight mb-3">
                  {feature.title}
                </h3>

                {/* Card Body */}
                <p className="font-normal text-neutral-600 leading-relaxed text-base">
                  {feature.description}
                </p>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}

export default FeatureCards;

