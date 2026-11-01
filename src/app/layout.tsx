import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { THEME_INIT_SCRIPT } from "@/lib/ui-prefs";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
  variable: "--font-serif",
});

export const viewport: Viewport = {
  themeColor: "#255DEE",
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
    <html lang="en" className={cn("font-sans", bricolage.variable, instrumentSerif.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-lime selection:text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-lime focus:text-ink focus:border-2 focus:border-ink focus:rounded-chunky focus:outline-none focus:ring-4 focus:ring-cobalt font-bold text-sm shadow-hard"
        >
          Skip to content
        </a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
