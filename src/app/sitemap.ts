import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://REPLACE_ME.example"
  const now = new Date()

  const routes = [
    "",
    "/sign-in",
    "/feed",
    "/heatmap",
    "/tasks",
    "/privacy",
    "/terms",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/feed" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/privacy" || route === "/terms" ? 0.3 : 0.8,
  }))
}
