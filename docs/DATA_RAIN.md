# DataRain Particle Dynamics & Integration Guide

A high-performance HTML5 Canvas fluid simulation engine combining potential aerodynamics flow, divergence-free wave drift, Kármán vortex shedding, and adaptive frame-budgeting.

---

## 1. Overview & Architectural Capabilities

`DataRain` is an atmospheric particle visualization component engineered for high-density, low-latency UI environments. It provides interactive, ambient particle field dynamics that react to cursor trajectories, touch sweeps, and window resizing with zero external canvas library dependencies.

### Key Capabilities:
- **Zero-Allocation Hot Simulation Loop:** Pre-allocated typed arrays (`Float32Array`, `Uint8Array`, `Int32Array`) prevent garbage collection pauses during 60 FPS animation.
- **Divergence-Free Vector Field:** Fluid particle motion is governed by stream function curl formulations ($\mathbf{u} = \nabla^\perp \psi$), ensuring zero fluid compression.
- **Potential Obstacle Deflection:** Interactive pointer positions generate analytical potential flow around a cylindrical obstacle with static wake deficits.
- **Viscous Kármán Vortex Shedding:** High-velocity cursor flicks shed decaying Lamb-Oseen vortices into the downstream field.
- **Adaptive Frame Budgeting:** Continuously tracks moving averages of frame times and automatically throttles active particle density if framerates drop below threshold.
- **Full WCAG Accessibility:** Respects `prefers-reduced-motion` by parking the cursor and rendering a single pre-simulated static frame without requestAnimationFrame loops.

---

## 2. Directory Layout & shadcn Architecture

### Default Component Paths

In this project, components follow the standard Next.js `src/` directory convention configured in `components.json`:

```
the-movement/
├── components.json             # shadcn configuration file
├── src/
│   ├── app/
│   │   ├── globals.css         # Global Tailwind 3 stylesheets & CSS variables
│   │   ├── data-rain/page.tsx  # Full interactive showcase route
│   │   └── page.tsx            # Landing page with ambient rain toggle
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx      # Base shadcn button primitive
│   │       ├── data-rain.tsx   # Core simulation component
│   │       ├── data-rain-card.tsx # Contained card wrapper widget
│   │       ├── data-rain-hero.tsx # Contained section hero wrapper
│   │       └── demo.tsx        # Standard preview component
│   └── lib/
│       └── constants/
│           └── data-rain-palettes.ts # Curated color schemes
└── components/                 # Root-level backward-compatibility shims
    └── ui/
        ├── data-rain.tsx
        └── demo.tsx
```

### Why `/components/ui` is Standardized

1. **shadcn CLI Compatibility:** The `shadcn` CLI reads `components.json` to install primitives directly into `@/components/ui`. Having an explicit `ui/` directory separates atomic reusable primitives from feature-specific application components (e.g., `components/chat/`, `components/tasks/`).
2. **Modular Architecture:** UI primitives remain completely decoupled from business domain logic and database state.
3. **Universal Aliasing:** TypeScript path alias `@/* -> ./src/*` enables imports such as `import DataRain from "@/components/ui/data-rain"` across server and client boundaries.

---

## 3. Setup Instructions

If setting up this component in a fresh repository:

### Step A: Initialize shadcn & TypeScript
```bash
npx shadcn@latest init
```
When prompted:
- Framework: Next.js (App Router)
- Style: Default / Nova
- CSS Variables: Yes
- Tailwind CSS configuration: `tailwind.config.ts`
- Components alias: `@/components`
- UI alias: `@/components/ui`

### Step B: Configure Tailwind CSS Variables
In your global CSS file (`src/app/globals.css` or Tailwind 4 `index.css`), add the theme variables:

```css
:root {
  --dr-bg-0: #020308;
  --dr-bg-1: #05070d;
  --dr-bg-2: #0a1020;
  --dr-calm: #22e6ff;
  --dr-mid: #8a5cff;
  --dr-hot: #ff3d9a;
  --dr-core: #eafcff;
  --dr-vignette: 0.62;
  --dr-grain: 0.05;
  --dr-bloom-blur: 10px;
  --dr-bloom-opacity: 0.7;
}

@keyframes dr-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dr-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, var(--dr-bg-2, #0a1020) 0%, var(--dr-bg-1, #05070d) 50%, var(--dr-bg-0, #020308) 100%);
  z-index: 0;
  pointer-events: none;
  animation: dr-fade-in 0.8s ease-out forwards;
}

.dr-root--contained {
  position: relative !important;
  inset: auto !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 240px;
  border-radius: inherit;
}

.dr-bloom {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  filter: blur(var(--dr-bloom-blur, 10px));
  opacity: var(--dr-bloom-opacity, 0.7);
  mix-blend-mode: screen;
  transform: translateZ(0);
}

.dr-main {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.dr-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 35%, rgba(2, 3, 8, var(--dr-vignette, 0.62)) 100%);
}

.dr-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--dr-grain, 0.05);
  background-image: radial-gradient(#fff 1px, transparent 1px);
  background-size: 4px 4px;
}
```

---

## 4. Component API & Props

```typescript
export interface DataRainPalette {
  calm: string; // Base low-velocity particle color (hex)
  mid: string;  // Medium-velocity particle color (hex)
  hot: string;  // High-velocity and spark color (hex)
}

export interface DataRainProps {
  className?: string;       // Custom CSS classes applied to root
  count?: number;           // Target particle count (default auto-scaled to viewport area)
  flowSpeed?: number;       // Global velocity multiplier [0.05 - 5.0]
  obstacleRadius?: number;  // Deflection radius around cursor in pixels [24 - 140]
  autopilot?: boolean;      // Lissajous curve autonomous cursor movement when idle
  fullscreen?: boolean;     // Fixed viewport mode (true) vs contained relative mode (false)
  palette?: DataRainPalette;// Custom color overrides
}
```

---

## 5. Usage Examples

### Fullscreen Ambient Background
```tsx
import DataRain from "@/components/ui/data-rain";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <DataRain fullscreen count={1800} flowSpeed={0.8} />
    </div>
  );
}
```

### Contained Metric Card Widget
```tsx
import { DataRainCard } from "@/components/ui/data-rain-card";

export function TelemetryCard() {
  return (
    <DataRainCard title="Consensus Quorum" badge="Real-time" count={600} flowSpeed={0.5}>
      <p className="text-xs text-white/80">3 of 3 verifiers confirmed.</p>
    </DataRainCard>
  );
}
```

### Hero Section Wrapper
```tsx
import { DataRainHero } from "@/components/ui/data-rain-hero";

export function HeaderHero() {
  return (
    <DataRainHero intensity="subtle" flowSpeed={0.9}>
      <h1 className="text-3xl font-extrabold text-white">Decentralized Field Coordination</h1>
    </DataRainHero>
  );
}
```

---

## 6. Verification & Test Suite

The implementation is verified with dedicated unit tests:
- `src/lib/__tests__/data-rain-math.test.ts`: Mathematical stability, PRNG determinism, and potential flow wave creation.
- `src/lib/__tests__/data-rain-presets.test.ts`: Color palette completeness and boundary validation.
- `src/lib/__tests__/data-rain-components.test.ts`: Component props and mounting contracts.
- `src/lib/__tests__/data-rain-styles.test.ts`: Computed CSS property fallback resilience.

