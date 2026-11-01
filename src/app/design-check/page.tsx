// TEMPORARY ROUTE: Phase 2 design system inspection.
// This route is temporary and serves to visually verify tokens, button states, typography, and badges.

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, CheckCircle, AlertTriangle, Send } from "lucide-react"

export default function DesignCheckPage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Design System Verification</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Visual verification of tokens, typography, button interaction states, and components for The Movement.
        </p>
      </header>

      {/* Distinctiveness Elements Highlight */}
      <section aria-labelledby="distinctiveness-heading" className="space-y-4">
        <h2 id="distinctiveness-heading" className="text-xl font-semibold tracking-tight text-foreground">
          Distinctiveness Elements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-primary bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Ledger-Line Motif</CardTitle>
              <CardDescription>
                Continuous vertical and horizontal verification grid lines visually anchoring state transitions, audit steps, and cryptographic confirmations.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-l-4 border-l-accent bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Signature Stamps</CardTitle>
              <CardDescription>
                Compact monospace cryptographic stamps displaying organizer multi-signature threshold progress and verifier consensus directly on cards.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Color Tokens */}
      <section aria-labelledby="tokens-heading" className="space-y-4">
        <h2 id="tokens-heading" className="text-xl font-semibold tracking-tight text-foreground">
          Color Tokens (Dark First)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-sm border border-border bg-background space-y-1">
            <div className="font-semibold text-foreground">Surface Base</div>
            <div className="text-muted-foreground">#0b0f17</div>
          </div>
          <div className="p-4 rounded-sm border border-border bg-card space-y-1">
            <div className="font-semibold text-foreground">Surface Raised</div>
            <div className="text-muted-foreground">#131b2e</div>
          </div>
          <div className="p-4 rounded-sm border border-border bg-popover space-y-1">
            <div className="font-semibold text-foreground">Surface Overlay</div>
            <div className="text-muted-foreground">#1e293b</div>
          </div>
          <div className="p-4 rounded-sm border border-border bg-primary text-primary-foreground space-y-1">
            <div className="font-semibold">Electric Blue</div>
            <div className="opacity-90">#1d4ed8</div>
          </div>
          <div className="p-4 rounded-sm border border-border bg-accent text-accent-foreground space-y-1">
            <div className="font-semibold">Coral Accent</div>
            <div className="opacity-90">#fb7185</div>
          </div>
          <div className="p-4 rounded-sm border border-border bg-verified-bg text-verified space-y-1">
            <div className="font-semibold">Verified Green</div>
            <div className="opacity-90">#34d399</div>
          </div>
          <div className="p-4 rounded-sm border border-border bg-caution-bg text-caution space-y-1">
            <div className="font-semibold">Caution Amber</div>
            <div className="opacity-90">#fbbf24</div>
          </div>
          <div className="p-4 rounded-sm border border-border bg-destructive text-destructive-foreground space-y-1">
            <div className="font-semibold">Alert Red</div>
            <div className="opacity-90">#f87171</div>
          </div>
        </div>
      </section>

      {/* Button States */}
      <section aria-labelledby="buttons-heading" className="space-y-4">
        <h2 id="buttons-heading" className="text-xl font-semibold tracking-tight text-foreground">
          Buttons: Variants, Sizes and States
        </h2>

        {/* Variants */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Variants</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="default">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline Action</Button>
            <Button variant="ghost">Ghost Action</Button>
            <Button variant="accent">Accent Action</Button>
            <Button variant="destructive">Destructive Action</Button>
          </div>
        </div>

        {/* States */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Interaction States</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="default">Normal</Button>
            <Button variant="default" disabled>Disabled State</Button>
            <Button variant="default" loading>Loading State</Button>
            <Button variant="outline" loading>Loading Outline</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Sizes</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Send notification">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Typography Scale */}
      <section aria-labelledby="typography-heading" className="space-y-4">
        <h2 id="typography-heading" className="text-xl font-semibold tracking-tight text-foreground">
          Typography Scale
        </h2>
        <div className="space-y-3 border border-border p-4 rounded-sm bg-card">
          <p className="text-2xl font-bold">Heading 2xl: Collective Action Coordination</p>
          <p className="text-xl font-semibold">Heading xl: Verified Movement Feeds</p>
          <p className="text-lg font-medium">Heading lg: Decentralized Task Board</p>
          <p className="text-base text-foreground">
            Body regular: High-contrast body text designed for readability outdoors in variable lighting conditions.
          </p>
          <p className="text-sm text-muted-foreground">
            Muted caption: Secondary metadata, timestamps, and contextual instructions.
          </p>
          <p className="font-mono text-xs text-primary-light bg-popover p-2 rounded-sm border border-border">
            Monospace Hash: 0x8f2d3a91b4e67c80d5f1a234e789bcde
          </p>
        </div>
      </section>

      {/* Badges and Tier Status */}
      <section aria-labelledby="badges-heading" className="space-y-4">
        <h2 id="badges-heading" className="text-xl font-semibold tracking-tight text-foreground">
          Tier Badges and Status Chips
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="secondary">Tier 1 Volunteer</Badge>
          <Badge variant="outline" className="border-caution text-caution">
            <AlertTriangle className="h-3 w-3 mr-1" aria-hidden="true" />
            Tier 2 Senior Volunteer
          </Badge>
          <Badge variant="default" className="bg-primary text-primary-foreground">
            <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
            Tier 3 Organizer
          </Badge>
          <Badge className="bg-verified-bg text-verified border-verified">
            <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
            Verified
          </Badge>
          <span className="font-mono text-xs px-2.5 py-1 rounded-sm border border-primary text-primary-light bg-card">
            SIG: 2/3 CONFIRMED
          </span>
        </div>
      </section>

      {/* Form Controls & Skeletons */}
      <section aria-labelledby="forms-heading" className="space-y-4">
        <h2 id="forms-heading" className="text-xl font-semibold tracking-tight text-foreground">
          Form Controls and Loading Skeletons
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4 bg-card p-4 rounded-sm border border-border">
            <div className="space-y-1.5">
              <Label htmlFor="input-title">Announcement Title</Label>
              <Input id="input-title" placeholder="Enter verified announcement title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="input-desc">Details</Label>
              <Textarea id="input-desc" placeholder="Provide accurate field instructions" rows={3} />
            </div>
          </div>
          <div className="space-y-4 bg-card p-4 rounded-sm border border-border">
            <h3 className="text-sm font-medium text-muted-foreground">Skeleton Loaders</h3>
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
