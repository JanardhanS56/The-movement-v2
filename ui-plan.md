# UI Plan — The Movement: Frontend Architecture & Design System

> **Version:** 1.0 — MVP Scope  
> **Last Updated:** 2026-11-01  
> **Audience:** Frontend engineers building Phase 1

---

## Table of Contents

1. [Tech Stack Justification](#1-tech-stack-justification)
2. [Library Mandates](#2-library-mandates)
3. [Non-Vibe-Coded Mandates](#3-non-vibe-coded-mandates)
4. [Design System](#4-design-system)
5. [UX Flow & Navigation](#5-ux-flow--navigation)
6. [Component Architecture](#6-component-architecture)
7. [State Management Strategy](#7-state-management-strategy)
8. [Performance Rules](#8-performance-rules)

---

## 1. Tech Stack Justification

Every tool in our stack was chosen deliberately. If you want to deviate from this stack, you must present a written justification.

### Next.js 14 (App Router)

**Why Next.js over plain React or Vite:**

- **React Server Components (RSC):** The Badge Profile page (`/profile/[userId]`) is a fully public, SEO-important page. We render it on the server with zero JS hydration cost. Supabase fetching happens in the RSC — no loading spinner, no layout shift.
- **Route Handlers:** Our API endpoints (`/api/check-in`, `/api/sign-announcement`) live in the same repo as the frontend. No separate Express server to deploy and maintain.
- **Edge Middleware:** We protect dashboard routes at the edge via Supabase session cookie inspection — unauthenticated users never reach the dashboard JS bundle.
- **Image Optimization:** `next/image` automatically generates WebP variants and serves correct sizes — critical for badge images.

**Why NOT Vite/CRA:** These are pure client-side, which means the profile page would be blank until JS loads. Bad for SEO and accessibility.

### Tailwind CSS

**Why Tailwind over vanilla CSS or CSS Modules:**

- **Co-location:** Styles live where the component lives. No hunting across CSS files.
- **Design constraints:** Tailwind's spacing/color scale prevents one-off magic numbers. Every margin and padding is a deliberate token.
- **shadcn/ui compatibility:** shadcn is built on Tailwind + Radix UI. The component library is unusable without Tailwind.
- **Bundle size:** PurgeCSS is built into Tailwind JIT — only the classes actually used are shipped.

**Why NOT Styled Components / Emotion:** Runtime CSS-in-JS adds JavaScript overhead on every render and conflicts with React Server Components.

### shadcn/ui

**Why shadcn/ui over MUI or Chakra:**

- **Copy-paste model:** Components live in `src/components/ui/` and are fully editable. We own the code — no fighting a component library's API to match our design.
- **Accessibility by default:** shadcn components are built on Radix UI primitives, which handle ARIA, keyboard navigation, and focus management correctly out of the box.
- **No runtime JS for simple components:** A `Button` or `Card` from shadcn has zero runtime overhead beyond HTML + Tailwind classes.
- **No vendor lock-in:** We can eject and modify any component without forking a library.

---

## 2. Library Mandates

The following libraries are **mandatory**. They must not be replaced without team consensus.

### 2.1 — Zod (Schema Validation)

**Package:** `zod`  
**Purpose:** Runtime type safety for all form inputs and API responses.

**Why Zod is mandatory:**

TypeScript types are erased at runtime. Without Zod, a malformed API response or a user submitting bad form data can cause silent failures, undefined behavior, or security issues.

**Rules for use:**

1. Every Supabase table row that is read or written must have a corresponding Zod schema in `src/lib/schemas/`.
2. Every API Route Handler must validate its request body with Zod BEFORE doing any database operation.
3. Forms must use `zodResolver` from `@hookform/resolvers/zod` with `react-hook-form`.

**Example — Task schema:**
```typescript
// src/lib/schemas/task.schema.ts
import { z } from 'zod'

export const TaskSchema = z.object({
  id: z.string().uuid(),
  movement_id: z.string().uuid(),
  title: z.string().min(5).max(120),
  description: z.string().max(2000).optional(),
  reward_points: z.number().int().min(0).max(10000),
  required_volunteers: z.number().int().min(1).max(100),
  status: z.enum(['open', 'in_progress', 'pending_verification', 'completed', 'cancelled']),
  // ^ This is tasks.status (the task board row, not the claim row)
  created_by: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
})

export type Task = z.infer<typeof TaskSchema>

// For the claim form (what the user submits when claiming):
export const ClaimTaskSchema = z.object({
  task_id: z.string().uuid(),
  note: z.string().max(500).optional(),
})
export type ClaimTaskInput = z.infer<typeof ClaimTaskSchema>

// For the task_claims DB row (different from tasks.status!):
export const TaskClaimSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  claimed_by: z.string().uuid(),
  status: z.enum(['in_progress', 'pending_verification', 'verified', 'rejected', 'withdrawn']),
  // ^ IMPORTANT: task_claims.status starts at 'in_progress', NOT 'active' or 'open'
  note: z.string().max(500).nullable().optional(),
  claimed_at: z.string().datetime(),
  verified_at: z.string().datetime().nullable().optional(),
})
export type TaskClaim = z.infer<typeof TaskClaimSchema>
```

**Route Handler validation pattern (mandatory):**
```typescript
// app/api/claim-task/route.ts
import { ClaimTaskSchema } from '@/lib/schemas/task.schema'

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = ClaimTaskSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  // ... proceed with validated parsed.data
}
```

### 2.2 — TanStack Query v5 (React Query)

**Package:** `@tanstack/react-query`  
**Purpose:** All client-side data fetching, caching, background synchronization, and mutation state management.

**Why TanStack Query is mandatory:**

`useEffect` + `useState` for data fetching is an anti-pattern that leads to:
- Race conditions (stale data displayed after a faster subsequent request returns)
- No caching (identical requests made on every component mount)
- Manual loading/error state boilerplate in every component
- No background re-fetch on window focus

TanStack Query solves all of these out of the box.

**Setup — CRITICAL: never put `'use client'` on `app/layout.tsx` itself (it is a Server Component). Create a separate client wrapper:**

```typescript
// src/components/providers/QueryProvider.tsx  <-- NEW file
'use client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures a new QueryClient is created per browser session,
  // NOT shared across SSR requests on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,        // data is fresh for 30s
            gcTime: 5 * 60 * 1000,   // keep in cache for 5min after unmount
            retry: 2,
            refetchOnWindowFocus: true,
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

```typescript
// src/app/layout.tsx  <-- remains a Server Component (no 'use client')
import { QueryProvider } from '@/components/providers/QueryProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
```

> **Why `useState` instead of a module-level singleton?** A module-level `const queryClient = new QueryClient()` is created once per Node.js worker process and is shared across all concurrent SSR requests — leaking one user's cached data into another user's response. `useState` creates a fresh instance per client render.

**Query key conventions:**
```typescript
// src/lib/query-keys.ts
export const QueryKeys = {
  tasks: (movementId: string) => ['tasks', movementId] as const,
  announcements: (movementId: string) => ['announcements', movementId] as const,
  checkIns: (movementId: string) => ['check-ins', movementId] as const,
  userProfile: (userId: string) => ['profile', userId] as const,
  badges: (userId: string) => ['badges', userId] as const,
} as const
```

**Mutation + invalidation pattern:**
```typescript
const claimMutation = useMutation({
  mutationFn: (taskId: string) => fetch('/api/claim-task', {
    method: 'POST', body: JSON.stringify({ task_id: taskId }),
    headers: { 'Content-Type': 'application/json' }
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.tasks(movementId) })
    toast({ title: 'Task claimed!', description: 'Good luck.' })
  },
  onError: () => {
    toast({ title: 'Error', description: 'Could not claim task. Try again.', variant: 'destructive' })
  }
})
```

### 2.3 — react-leaflet + leaflet.heat

**Packages:** `react-leaflet`, `leaflet`, `leaflet.heat`  
**Purpose:** The live GPS heatmap visualization.

**Why react-leaflet:**
- **Free, open-source:** Uses OpenStreetMap tiles — no API key, no billing, no usage caps.
- **Proven in production:** Used by thousands of civic tech applications worldwide.
- **react-leaflet v4:** Full React 18 compatibility with hooks API (`useMap`, `useMapEvents`).

**Why leaflet.heat specifically:**
- Renders heatmap overlays directly on the Leaflet canvas layer.
- ~3KB — does not bloat the bundle.
- Accepts `[lat, lng, intensity]` tuples — maps directly to our `check_ins` table structure.

**Critical implementation rules:**

1. **SSR must be disabled for Leaflet.** Leaflet accesses `window` and `document` on import. Any Leaflet code in a Server Component will crash the build.
   ```typescript
   // MANDATORY: Dynamic import with ssr: false
   const HeatmapMap = dynamic(
     () => import('@/components/heatmap/HeatmapMap'),
     { ssr: false, loading: () => <MapSkeleton /> }
   )
   ```

2. **Fix the default marker icon** (known Leaflet + webpack issue):
   ```typescript
   // src/components/heatmap/HeatmapMap.tsx
   import L from 'leaflet'
   import 'leaflet/dist/leaflet.css'
   // Fix broken marker icons in webpack environments
   delete (L.Icon.Default.prototype as any)._getIconUrl
   L.Icon.Default.mergeOptions({
     iconRetinaUrl: '/leaflet/marker-icon-2x.png',
     iconUrl: '/leaflet/marker-icon.png',
     shadowUrl: '/leaflet/marker-shadow.png',
   })
   ```
   Copy the Leaflet marker images to `public/leaflet/`.

3. **leaflet.heat import is a side effect:**
   ```typescript
   import 'leaflet.heat'  // Must be imported after 'leaflet'
   ```

4. **Updating the heat layer without full re-render:**
   ```typescript
   // L.HeatLayer does NOT exist as a named type — the shim returns L.Layer.
   // Use L.Layer for the ref type.
   const heatLayerRef = useRef<L.Layer | null>(null)

   useEffect(() => {
     if (!mapRef.current || heatPoints.length === 0) return
     if (!heatLayerRef.current) {
       heatLayerRef.current = L.heatLayer(heatPoints, { radius: 25, blur: 15 })
       heatLayerRef.current.addTo(mapRef.current)
     } else {
       // Cast needed because setLatLngs is added by leaflet.heat, not on base L.Layer
       ;(heatLayerRef.current as any).setLatLngs(heatPoints)
     }
   }, [heatPoints])
   ```

---

## 3. Non-Vibe-Coded Mandates

"Vibe coding" means writing code that feels right but has no architectural discipline. The following rules are non-negotiable.

### 3.1 — Strict TypeScript Interfaces for ALL Data

**Rule:** Every piece of data that flows through the application — from the database to the UI — must have an explicit TypeScript type derived from a Zod schema.

**Prohibited patterns:**
```typescript
// FORBIDDEN: any
const user: any = await supabase.from('users').select('*')

// FORBIDDEN: inline type inference without schema
const { data } = await supabase.from('tasks').select('*')
// ^ data is typed as unknown by Supabase without explicit generic

// FORBIDDEN: as cast without validation
const task = data as Task
```

**Required pattern:**
```typescript
// CORRECT: Validate at the boundary
const { data, error } = await supabase.from('tasks').select('*').eq('movement_id', id)
const tasks = z.array(TaskSchema).parse(data) // throws if shape is wrong
```

### 3.2 — Skeleton Loaders for Every Data Fetch

**Rule:** No component may render a blank space, empty div, or spinner while data is loading. Every loading state must use a `<Skeleton>` that mirrors the shape of the loaded content.

**Pattern:**
```typescript
function TaskCard() {
  const { data: task, isLoading } = useQuery({ ... })
  
  if (isLoading) return <TaskCardSkeleton />   // <- mirrors the shape
  if (!task) return null
  return <div>...</div>
}

function TaskCardSkeleton() {
  return (
    <Card aria-busy="true">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3" />
    </Card>
  )
}
```

**Explicit skeleton list:**

| Component | Skeleton |
|---|---|
| Announcement feed | 3 announcement card skeletons |
| Task board | 6 task card skeletons (2-col grid) |
| Badge profile | Avatar skeleton + 4 badge circle skeletons |
| Heatmap | `<MapSkeleton>` — a gray rounded rectangle matching the map container |

### 3.3 — Error Boundaries

**Rule:** Every route segment that contains client-side data fetching must be wrapped in an Error Boundary.

**Implementation:** Create a custom error boundary component and use it in route `error.tsx` files.

```typescript
// src/app/(dashboard)/tasks/error.tsx
'use client'
export default function TasksError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center p-8 text-center">
      <h2 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

Every dashboard route segment (`feed/`, `heatmap/`, `tasks/`, `profile/`) must have a corresponding `error.tsx` and `loading.tsx`.

### 3.4 — Accessibility (a11y) Standards

**These are not optional.** The application serves diverse users, potentially in high-stress protest/organizing situations. Accessibility failures are inclusion failures.

**Required for every component:**

| Rule | Implementation |
|---|---|
| Icon-only buttons | `<Button aria-label="Sign announcement">` |
| Form inputs | Always have a visible `<label>` or `aria-label` |
| Color-only status | Never use color as the ONLY indicator — add text or icon |
| Map keyboard access | Map container has `role="application"`, Escape exits keyboard trap |
| Modal focus trap | shadcn Dialog handles this via Radix — do not override |
| Skip link | Add `<a href="#main-content">Skip to content</a>` as first child of body |
| Heading hierarchy | Each page has exactly one `<h1>`. Sub-sections use `<h2>`, `<h3>` |
| Live regions | Toast notifications use `role="status"` or `aria-live="polite"` |

**Color contrast minimum:** 4.5:1 for normal text (WCAG AA). Use the `oklch` color space in Tailwind config for accessible, vivid colors.

---

## 4. Design System

### Color Tokens

```css
/* src/app/globals.css — extend default shadcn theme */
:root {
  /* Brand */
  --brand-primary: oklch(65% 0.22 250);     /* Electric blue */
  --brand-accent: oklch(72% 0.20 340);      /* Vibrant coral */
  --brand-success: oklch(68% 0.18 145);     /* Verified green */
  --brand-warning: oklch(78% 0.19 85);      /* Caution amber */
  
  /* Surfaces (dark mode by default) */
  --surface-base: oklch(12% 0.02 250);      /* Near black */
  --surface-raised: oklch(17% 0.02 250);    /* Card surface */
  --surface-overlay: oklch(22% 0.02 250);   /* Modal overlay */
}
```

### Typography

```typescript
// src/app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

- **Body text:** Inter (humanist sans-serif — high legibility at small sizes)
- **Monospace (verification hashes, sig IDs):** JetBrains Mono
- **Scale:** Tailwind's default type scale (xs → 9xl)

### Tier Badges

Tier levels must be visually distinct everywhere they appear:

| Tier | Label | Color | shadcn variant |
|---|---|---|---|
| Tier 1 | Volunteer | `--muted` | `secondary` |
| Tier 2 | Senior Volunteer | `--brand-warning` | `outline` (amber ring) |
| Tier 3 | Organizer | `--brand-primary` | `default` (blue) |

### Signature Status Chips

For announcements, use a compact chip showing signature progress:

```typescript
// "2 / 3 Signed" chip
<Badge variant={isMet ? 'default' : 'outline'} className="gap-1">
  <CheckIcon className="h-3 w-3" aria-hidden />
  {currentSigs} / {requiredSigs} Signed
</Badge>
```

---

## 5. UX Flow & Navigation

### Overall Layout

The app uses a **persistent sidebar layout** for authenticated users. The sidebar is collapsible on mobile (hamburger menu).

```
+-------------------+----------------------------+
|  The Movement     |  [Page Content Area]       |
|  [Logo]           |                            |
|  ─────────────    |                            |
|  📢 Feed          |  (Announcement cards,      |
|  🗺 Heatmap        |   Heatmap view,            |
|  📋 Tasks          |   Task board, or           |
|  👤 My Profile    |   Profile page)            |
|  ─────────────    |                            |
|  [User Avatar]    |                            |
|  [Tier Badge]     |                            |
|  [Sign Out]       |                            |
+-------------------+----------------------------+
```

On mobile (< 768px), the sidebar becomes a bottom tab bar with icons only.

### Page-by-Page UX

#### `/feed` — Announcement Feed

1. User lands on a card-list of published announcements, newest first.
2. **For Tier 3 users:** A "+ New Announcement" button appears in the header.
3. Clicking it opens a shadcn `Dialog` with a form: Title, Body (rich-text optional), Required Signatures (number stepper, min 1, max = number of organizers in movement).
4. On submit: the announcement is created and appears in the "Pending" sub-section.
5. Other Tier 3 users see a "Pending Signatures" section at the top of their feed.
6. Each pending announcement shows a "Sign" button. On click: confirmation dialog ("Are you sure you want to sign this?") → signature added → chip updates in real-time.
7. When threshold is met, the announcement moves to the Published section with a green "✓ Verified" chip.

#### `/heatmap` — Live Check-in Map

1. Full-bleed map (OpenStreetMap tiles via react-leaflet).
2. Floating action button (bottom-right): **"Check In Here"** — large, touch-friendly (48px minimum).
3. On click: browser asks for geolocation permission. If denied: a dismissible banner explains why it's needed.
4. On success: the user's dot appears on the map immediately (optimistic update). The heatmap blob expands to absorb the new point within 2–3 seconds.
5. A live counter badge: "**142 checked in**" updates via Realtime subscription.

#### `/tasks` — Bounty Board

1. Two-column card grid (single column on mobile).
2. Filter chips at the top: All | Open | In Progress | Completed.
3. **Task Card structure:**
   - Title + Reward Points badge
   - Description (truncated to 2 lines with "Read more" expand)
   - Status badge + Claimant avatar (if claimed)
   - CTA: "Claim" (if open) | "Mark Complete" (if you're the claimant) | "Verify" (if you're a selected verifier)
4. **For Tier 3 users:** "Post Task" button in header.
5. Claim flow is optimistic: the button immediately changes to "Claimed" and disables while the mutation is in flight.

#### `/profile/[userId]` — Badge Profile

1. **Hero section:** Large avatar, display name, Tier badge, movement membership list.
2. **Stats row:** Tasks Completed | Announcements Signed | Check-ins | Impact Points (future).
3. **Badge gallery:** Grid of earned badges. Each badge is a circle with icon + name on hover.
4. **Impact Ledger:** Timeline list of verified contributions, showing:
   - Task name (linked to `/tasks`)
   - Verification method (Peer Vote or Organizer Override)
   - Date verified
   - For Peer Vote: shows "Verified by 3 peers"
   - For Override: shows "Verified by [Organizer Name]"

---

## 6. Component Architecture

### Component Hierarchy Map

```
src/components/
├── layout/
│   ├── Sidebar.tsx              -- Navigation sidebar
│   ├── MobileTabBar.tsx         -- Mobile bottom nav
│   └── PageHeader.tsx           -- Consistent page heading + action slot
├── feed/
│   ├── AnnouncementCard.tsx     -- Published announcement display
│   ├── PendingAnnouncementCard.tsx -- Pending + Sign button
│   ├── AnnouncementForm.tsx     -- Create announcement dialog form
│   └── SignatureChip.tsx        -- "X / Y Signed" progress chip
├── heatmap/
│   ├── HeatmapView.tsx          -- Client wrapper with dynamic import
│   ├── HeatmapMap.tsx           -- Actual Leaflet map (ssr: false)
│   ├── CheckInButton.tsx        -- FAB with geolocation logic
│   └── MapSkeleton.tsx          -- Gray placeholder while map loads
├── tasks/
│   ├── TaskCard.tsx             -- Individual task display card
│   ├── TaskCardSkeleton.tsx     -- Skeleton version
│   ├── TaskFilters.tsx          -- Status filter chips
│   ├── TaskForm.tsx             -- Create/edit task form (Tier 3)
│   └── VerifyTaskDialog.tsx     -- Peer verification vote dialog
├── profile/
│   ├── ProfileHero.tsx          -- Avatar + name + tier
│   ├── BadgeGallery.tsx         -- Badge grid
│   ├── BadgeItem.tsx            -- Individual badge circle
│   └── ImpactLedger.tsx         -- Contribution timeline
└── shared/
    ├── TierBadge.tsx            -- Reusable tier indicator
    ├── UserAvatar.tsx           -- Avatar with fallback initials
    ├── EmptyState.tsx           -- Consistent empty state illustration
    └── ErrorAlert.tsx           -- Inline error display
```

### Naming Rules

| Rule | Example |
|---|---|
| Page components | `page.tsx` (Next.js convention) |
| Layout components | `layout.tsx` (Next.js convention) |
| Feature components | PascalCase noun + noun: `TaskCard.tsx`, `AnnouncementForm.tsx` |
| Skeleton components | Same name + `Skeleton`: `TaskCardSkeleton.tsx` |
| Hooks | `use` prefix + verb: `useGeoLocation.ts`, `useCheckIn.ts` |
| Schemas | Feature + `.schema.ts`: `task.schema.ts`, `user.schema.ts` |

---

## 7. State Management Strategy

We use **zero global state management libraries** (no Redux, no Zustand). All state is managed through:

| State Type | Solution |
|---|---|
| Server data (remote) | TanStack Query (`useQuery`, `useMutation`) |
| URL/navigation state | Next.js `useSearchParams`, `usePathname` |
| Form state | `react-hook-form` + Zod |
| Local UI state | `useState` (e.g., modal open/closed) |
| Real-time events | Supabase Realtime → update TanStack Query cache |

**Supabase Realtime → TanStack Query cache update pattern:**
```typescript
// When Realtime fires, manually update the query cache instead of triggering a refetch
queryClient.setQueryData(QueryKeys.tasks(movementId), (old: Task[]) => {
  // Add new task from realtime payload
  return [...old, newTask]
})
```

This avoids unnecessary network requests on every Realtime event.

---

## 8. Performance Rules

| Rule | Implementation |
|---|---|
| No Leaflet in SSR | `dynamic(() => import('./HeatmapMap'), { ssr: false })` |
| No bundle bloat | Install `@next/bundle-analyzer`, wrap `next.config.js`, then run `ANALYZE=true npm run build` |
| Image optimization | Use `next/image` for all badge and avatar images |
| Font subsetting | `next/font/google` — only latin subset loaded |
| Query stale time | 30s default — reduces unnecessary refetches |
| Suspense boundaries | Use `<Suspense>` with skeleton fallback for RSC data |
| Lazy dialogs | Dialog content not rendered until `open === true` (Radix default) |
