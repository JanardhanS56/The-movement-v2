import type { Metadata } from "next"
import Link from "next/link"
import { Shield, ArrowLeft, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Privacy Policy | The Movement",
  description: "Draft privacy policy covering location data, public profiles, and OpenStreetMap tiles. Requires legal review before launch.",
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <main
      id="main-content"
      role="main"
      className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation back */}
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        {/* Legal Draft Notice Banner */}
        <div
          role="alert"
          aria-label="Legal draft status banner"
          className="p-4 rounded-md border-2 border-caution bg-caution-bg/40 text-caution flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-bold tracking-wide uppercase">
              DRAFT, requires legal review before launch
            </p>
            <p className="text-caution/90">
              This document is a technical placeholder draft for prototype coordination. It must be customized, reviewed, and finalized by qualified legal counsel prior to production deployment.
            </p>
          </div>
        </div>

        {/* Page Header */}
        <header className="border-b border-border pb-6 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="tabular-nums text-xs uppercase tracking-widest text-primary-light">
              Compliance & Data Governance
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Privacy Policy (Draft)
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: <span className="tabular-nums text-foreground font-semibold">[EFFECTIVE_DATE]</span> | Jurisdiction: <span className="tabular-nums text-foreground font-semibold">[LEGAL_JURISDICTION]</span>
          </p>
        </header>

        {/* Document Sections */}
        <article className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          {/* Section 1: Entity & Scope */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              1. Organization & Legal Entity
            </h2>
            <p>
              This Privacy Policy governs the decentralized volunteer platform operated by{" "}
              <strong className="text-foreground">[LEGAL_ENTITY_NAME]</strong>, located at{" "}
              <span className="tabular-nums text-xs text-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                [PHYSICAL_MAILING_ADDRESS]
              </span>{" "}
              (&quot;The Movement&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </p>
          </section>

          {/* Section 2: Location Data Handling */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              2. Field Telemetry & Location Privacy
            </h2>
            <p>
              The Movement treats volunteer physical safety and location privacy as foundational requirements:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Explicit User Consent:</strong> Geolocation coordinates are requested{" "}
                <em>only</em> when you intentionally tap the &quot;Check In Here&quot; action button. Continuous, passive, or background location tracking is strictly forbidden and technically impossible in our client architecture.
              </li>
              <li>
                <strong className="text-foreground">Coordinate Truncation (~110 Meter Radius):</strong> Submitted GPS coordinates are automatically rounded to three (3) decimal places (~110m at the equator) before processing. Exact coordinates are discarded immediately.
              </li>
              <li>
                <strong className="text-foreground">Aggregated Heatmaps Only:</strong> Other volunteers, organizers, and observers never see individual volunteer pins, paths, or historical movements. The heatmap displays only aggregated density clusters.
              </li>
            </ul>
          </section>

          {/* Section 3: Public Profiles & Impact Ledger */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              3. Public Volunteer Profiles & Impact Ledger
            </h2>
            <p>
              To foster public accountability without compromising personal safety, volunteer profiles operate under deterministic transparency:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Public Data Elements:</strong> Your display name, tier level (Tier 1 Volunteer, Tier 2 Senior Volunteer, Tier 3 Organizer), movement memberships, and earned recognition badges are visible to anyone viewing your public profile at <code>/profile/[userId]</code>.
              </li>
              <li>
                <strong className="text-foreground">Impact Ledger:</strong> Verified task completions record the task title, verification consensus method (peer vote or organizer override), verifier attribution, and timestamp. Unverified tasks or rejected claims do not appear on your public ledger.
              </li>
            </ul>
          </section>

          {/* Section 4: Map Tiles & Third-Party Services */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              4. OpenStreetMap Map Tiles & Third Parties
            </h2>
            <p>
              Heatmap and map visualization utilizes Leaflet.js with map tile layers fetched directly from OpenStreetMap servers. Your browser transmits standard HTTP request headers (including IP address and user-agent) to OpenStreetMap tile servers to render map graphics. Map tiles are provided under the OpenStreetMap Foundation terms.
            </p>
          </section>

          {/* Section 5: Data Rights & Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              5. Privacy Inquiries & Contact
            </h2>
            <p>
              To request account deletion, data extraction, or legal clarifications under applicable laws of{" "}
              <strong className="text-foreground">[LEGAL_JURISDICTION]</strong>, please contact our legal steward:
            </p>
            <div className="p-4 rounded-md border border-border bg-card flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Placeholder: [LEGAL_CONTACT_EMAIL]
                </p>
                <a
                  href="mailto:legal@themovement.example"
                  className="text-sm font-semibold text-primary hover:text-primary-light hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                >
                  legal@themovement.example
                </a>
              </div>
            </div>
          </section>
        </article>

        {/* Footer actions */}
        <footer className="pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>The Movement Platform &copy; 2026. All rights reserved.</span>
          <Link href="/terms" className="hover:text-foreground underline underline-offset-4">
            View Terms of Service
          </Link>
        </footer>
      </div>
    </main>
  )
}
