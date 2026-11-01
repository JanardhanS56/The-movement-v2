import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      colors: {
        ink: "#060814",
        ivory: "#F6F0E4",
        cobalt: {
          DEFAULT: "#0047FF",
          soft: "#7C9BFF",
        },
        lime: {
          DEFAULT: "#D4FF24",
          foreground: "#060814",
        },
        tomato: {
          DEFAULT: "#FF4D2E",
          foreground: "#060814",
        },
        sun: {
          DEFAULT: "#FFB81C",
          foreground: "#060814",
        },
        lavender: {
          DEFAULT: "#C9B6FF",
          foreground: "#060814",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      boxShadow: {
        hard: "3px 3px 0px 0px var(--hard-shadow, #060814)",
        "hard-sm": "2px 2px 0px 0px var(--hard-shadow, #060814)",
        "hard-lg": "5px 5px 0px 0px var(--hard-shadow, #060814)",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
        "24": "96px",
        "32": "128px",
      },
      borderRadius: {
        chunky: "12px",
        stamp: "9999px",
        band: "0px",
        sm: "6px",
        md: "12px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
