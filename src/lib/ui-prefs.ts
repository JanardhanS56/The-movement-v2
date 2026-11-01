/**
 * UI Preferences Module
 * 
 * Only file permitted to access localStorage (whitelisted in scripts/check-bans.mjs).
 * Stores:
 * 1. theme: 'day' | 'night' | 'system'
 * 2. textSize: 'normal' | 'large'
 * 3. sidebarCollapsed: boolean
 * 
 * All access wrapped in try/catch for SSR safety and restricted environments.
 */

export type ThemeMode = "day" | "night" | "system"
export type TextSize = "normal" | "large"

export interface UiPreferences {
  theme: ThemeMode
  textSize: TextSize
  sidebarCollapsed: boolean
}

const STORAGE_KEYS = {
  THEME: "the-movement:theme",
  TEXT_SIZE: "the-movement:text-size",
  SIDEBAR_COLLAPSED: "the-movement:sidebar-collapsed",
  SAVED_TASKS: "the-movement:saved-tasks",
} as const

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system"
  try {
    const val = localStorage.getItem(STORAGE_KEYS.THEME)
    if (val === "day" || val === "night" || val === "system") {
      return val
    }
  } catch {
    // Storage access blocked or unavailable
  }
  return "system"
}

export function setStoredTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
  } catch {
    // Storage access blocked
  }
  applyTheme(theme)
}

export function getStoredTextSize(): TextSize {
  if (typeof window === "undefined") return "normal"
  try {
    const val = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE)
    if (val === "normal" || val === "large") {
      return val
    }
  } catch {
    // Storage access blocked
  }
  return "normal"
}

export function setStoredTextSize(size: TextSize): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.TEXT_SIZE, size)
  } catch {
    // Storage access blocked
  }
  applyTextSize(size)
}

export function getStoredSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED)
    if (val !== null) {
      return val === "true"
    }
  } catch {
    // Storage access blocked
  }
  return false
}

export function setStoredSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed))
  } catch {
    // Storage access blocked
  }
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const isNight =
    theme === "night" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  if (isNight) {
    root.classList.add("dark")
    root.classList.remove("light")
    root.style.colorScheme = "dark"
  } else {
    root.classList.remove("dark")
    root.classList.add("light")
    root.style.colorScheme = "light"
  }
}

export function applyTextSize(size: TextSize): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (size === "large") {
    root.style.fontSize = "112.5%"
  } else {
    root.style.fontSize = "100%"
  }
}

export function getStoredSavedTasks(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_TASKS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Storage access blocked or invalid JSON
  }
  return []
}

export function setStoredSavedTasks(ids: string[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_TASKS, JSON.stringify(ids))
  } catch {
    // Storage access blocked
  }
}

/**
 * Script string executed inline in <head> to eliminate theme flash.
 */
export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var storedTheme = localStorage.getItem('the-movement:theme') || 'system';
    var isDark = storedTheme === 'night' || (storedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    var storedSize = localStorage.getItem('the-movement:text-size') || 'normal';
    if (storedSize === 'large') {
      document.documentElement.style.fontSize = '112.5%';
    }
  } catch (e) {}
})();
`
