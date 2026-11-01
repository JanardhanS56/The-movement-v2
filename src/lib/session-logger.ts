import { User } from "@/lib/schemas/user.schema"

export interface SessionLogEntry {
  id: string
  user_id: string
  action: string
  timestamp: string
  metadata?: Record<string, unknown>
  synced: boolean
}

const STORAGE_KEY = "movement_user_logs"
const AUTH_USER_KEY = "the-movement:auth-user"

export function getStoredAuthUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setStoredAuthUser(user: User | null): void {
  if (typeof window === "undefined") return
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_USER_KEY)
    }
  } catch {
    // Storage access blocked
  }
}

export async function logUserSession(
  userId: string,
  action: "login" | "logout" | string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (typeof window === "undefined") return

  const entry: SessionLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    action,
    timestamp: new Date().toISOString(),
    metadata,
    synced: false,
  }

  // 1. Write to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const logs: SessionLogEntry[] = raw ? JSON.parse(raw) : []
    logs.unshift(entry)
    // Keep last 50 logs locally
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 50)))
  } catch (err) {
    console.warn("Could not save session log to localStorage:", err)
  }

  // 2. If online, sync to POST /api/logs
  if (navigator.onLine) {
    try {
      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          action,
          metadata: {
            ...metadata,
            client_timestamp: entry.timestamp,
            user_agent: navigator.userAgent,
          },
        }),
      })

      // Mark as synced in localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const logs: SessionLogEntry[] = JSON.parse(raw)
          const target = logs.find((l) => l.id === entry.id)
          if (target) target.synced = true
          localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
        }
      } catch {
        // Ignored
      }
    } catch (netErr) {
      console.warn("Could not sync session log to server:", netErr)
    }
  }
}

