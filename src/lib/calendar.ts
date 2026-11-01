import { Task } from "./schemas/task.schema"
import { TaskMetadata } from "./mocks/fictional-data"

export function generateTaskIcs(task: Task, meta?: TaskMetadata): string {
  const startDate = new Date(task.created_at)
  // Schedule task 2 days after creation or tomorrow at 10:00 UTC
  const eventStart = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
  eventStart.setUTCHours(10, 0, 0, 0)
  const durationMinutes = meta?.estimatedMinutes || 60
  const eventEnd = new Date(eventStart.getTime() + durationMinutes * 60 * 1000)

  const formatIcsDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  }

  const location = meta?.locationLabel ? `${meta.locationLabel}, Coastal Action Front` : "Field Action Area"
  const cleanDescription = (task.description || "Community volunteer task")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Movement//Volunteer Field Action//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${task.id}@themovement.org`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(eventStart)}`,
    `DTEND:${formatIcsDate(eventEnd)}`,
    `SUMMARY:${task.title}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

export function downloadTaskIcs(task: Task, meta?: TaskMetadata): void {
  const icsContent = generateTaskIcs(task, meta)
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `movement-task-${task.id.slice(0, 8)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
