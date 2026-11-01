import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#0b0f17",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://REPLACE_ME.example"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "The Movement | Decentralized Civic Action & Verification",
    template: "%s | The Movement",
  },
  description: "A platform where volunteers and organizers coordinate verified announcements, check in on a map, complete tasks, and earn public badge profiles.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://REPLACE_ME.example",
    siteName: "The Movement",
    title: "The Movement | Decentralized Civic Action & Verification",
    description: "A platform where volunteers and organizers coordinate verified announcements, check in on a map, complete tasks, and earn public badge profiles.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, jetbrains.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded-sm focus:outline-none focus:ring-2 focus:ring-ring font-medium text-sm"
        >
          Skip to content
        </a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
