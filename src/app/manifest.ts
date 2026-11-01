import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Movement",
    short_name: "The Movement",
    description: "Decentralized coordination for verified announcements, field check-ins, and community tasks.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f17",
    theme_color: "#0b0f17",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
