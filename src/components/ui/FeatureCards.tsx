"use client";

import * as React from "react";
import Link from "next/link";
import { Flag, MapPin, ClipboardCheck, ArrowRight, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export interface FeatureItem {
  id: string;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  description: string;
  accentColor?: string;
}

export interface FeatureCardsProps {
  className?: string;
  wrapperClassName?: string;
  features?: FeatureItem[];
  sectionTitle?: string;
  showSignIn?: boolean;
  signInHref?: string;
  signInLabel?: string;
}

export const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: "multi-sig",
    icon: Flag,
    iconClassName: "w-7 h-7 text-neutral-900 stroke-[1.75]",
    title: "Multi-Sig Announcements",
    description:
      "Field notices require multiple organizer cryptographic signatures before publishing to prevent false alarms.",
  },
  {
    id: "heatmap",
    icon: MapPin,
    iconClassName: "w-7 h-7 text-neutral-900 stroke-[1.75]",
    title: "Live Check-in Heatmap",
    description:
      "Real-time GPS density visualization displaying volunteer distribution across field sectors.",
  },
  {
    id: "bounty-board",
    icon: ClipboardCheck,
    iconClassName: "w-7 h-7 text-[#A4B600] stroke-[2]",
    title: "Bounty Board & Verifications",
    description:
      "Community tasks claimed by volunteers and validated through randomized peer review consensus.",
    accentColor: "#D4E700",
  },
];

export function FeatureCards({
  className = "",
  wrapperClassName = "",
  features = DEFAULT_FEATURES,
  sectionTitle = "Platform Features",
  showSignIn = true,
  signInHref = "/sign-in",
  signInLabel = "Sign in to Platform",
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
    <div
      className={`w-full bg-[#5B5D5F] py-8 sm:py-12 md:py-16 ${wrapperClassName}`}
    >
      <section
        aria-label={sectionTitle}
        className={`w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 ${className}`}
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
                className="h-full flex flex-col justify-between bg-[#EBEBEB] border-2 border-[#1A1A1A] rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-200 ease-out hover:shadow-md"
              >
                <div>
                  {/* Top-Left Aligned Icon Container */}
                  <div className="mb-6 inline-flex items-center justify-center">
                    <IconComponent
                      aria-hidden="true"
                      className={feature.iconClassName}
                    />
                  </div>

                  {/* Card Title */}
                  <h3 className="font-bold text-[#111827] text-xl tracking-tight mb-2">
                    {feature.title}
                  </h3>

                  {/* Card Body / Subtitle */}
                  <p className="font-normal text-[#4B5563] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Integrated Sign-in Option */}
        {showSignIn && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 md:p-6 rounded-2xl bg-[#EBEBEB] border-2 border-[#1A1A1A] shadow-sm"
          >
            <div className="text-center sm:text-left">
              <h4 className="font-bold text-[#111827] text-base md:text-lg tracking-tight">
                Ready to coordinate verified collective action?
              </h4>
              <p className="font-normal text-[#4B5563] text-xs sm:text-sm mt-0.5">
                Sign in to verify field reports, view real-time volunteer heatmaps, and claim bounties.
              </p>
            </div>
            <Link href={signInHref} className="shrink-0">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#111827] bg-[#D4E700] hover:bg-[#CCDE00] border-2 border-[#1A1A1A] shadow-sm transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                <span>{signInLabel}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.25]" aria-hidden="true" />
              </button>
            </Link>
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default FeatureCards;
