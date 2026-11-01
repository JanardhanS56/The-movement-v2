import type { Metadata } from "next"
import Link from "next/link"
import { Scale, ArrowLeft, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms of Service | The Movement",
  description: "Draft terms of service covering platform rules, multi-signature announcements, location check-ins, and OpenStreetMap tiles. Requires legal review before launch.",
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsPage() {
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
          className="p-4 rounded-md border-2 border-sun bg-sun/15 text-ink flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-sun" aria-hidden="true" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-bold text-xs text-ink">
              Draft, requires legal review before launch
            </p>
            <p className="text-ink/80">
              This document is a technical placeholder draft for prototype coordination. It must be customized, reviewed, and finalized by qualified legal counsel prior to production deployment.
            </p>
          </div>
        </div>

        {/* Page Header */}
        <header className="border-b border-border pb-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <Scale className="h-6 w-6 text-cobalt" aria-hidden="true" />
            <span className="text-xs font-bold text-cobalt">
              Terms of engagement
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground font-sans">
            Terms of service (draft)
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: <span className="tabular-nums text-foreground font-semibold">[EFFECTIVE_DATE]</span> | Jurisdiction: <span className="tabular-nums text-foreground font-semibold">[LEGAL_JURISDICTION]</span>
          </p>
        </header>

        {/* Document Sections */}
        <article className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          {/* Section 1: Acceptance */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the platform provided by <strong className="text-foreground">[LEGAL_ENTITY_NAME]</strong>, located at{" "}
              <span className="tabular-nums text-xs text-foreground bg-secondary px-1.5 py-0.5 rounded-sm">
                [PHYSICAL_MAILING_ADDRESS]
              </span>{" "}
              (&quot;The Movement&quot;, &quot;we&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service subject to the jurisdiction of{" "}
              <strong className="text-foreground">[LEGAL_JURISDICTION]</strong>.
            </p>
          </section>

          {/* Section 2: Volunteer Tiers & Permissions */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              2. Governance & Volunteer Tiers
            </h2>
            <p>
              The Movement operates on a 3-tier decentralized verification structure:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Tier 1 Volunteers:</strong> May view verified announcements, check in to the physical heatmap, and claim open field tasks.
              </li>
              <li>
                <strong className="text-foreground">Tier 2 Senior Volunteers:</strong> May participate in peer verification consensus votes (minimum 3 votes required to verify task claims).
              </li>
              <li>
                <strong className="text-foreground">Tier 3 Organizers:</strong> Author official broadcast announcements (requiring multi-signature approval) and execute administrative verification overrides.
              </li>
            </ul>
          </section>

          {/* Section 3: Multi-Signature Announcements */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              3. Verified Announcements & Consensus
            </h2>
            <p>
              No broadcast announcement is published until it gathers the threshold of independent cryptographic signatures from designated organizers. Any attempt to forge signatures, bypass verification consensus, or publish unauthorized emergency alerts constitutes a violation of platform integrity.
            </p>
          </section>

          {/* Section 4: Location Check-ins & OpenStreetMap */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              4. Location Data & Mapping Services
            </h2>
            <p>
              Location check-ins are voluntary and ephemeral. Coordinates are truncated to 3 decimal places (~110m accuracy) to safeguard individual safety. Map visualization relies on OpenStreetMap tiles. By interacting with the heatmap, you acknowledge OpenStreetMap tile service policies and OpenStreetMap contributors copyright.
            </p>
          </section>

          {/* Section 5: Public Profiles & Conduct */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              5. Public Profiles & Volunteer Conduct
            </h2>
            <p>
              Your volunteer profile, badges, and verified task impact ledger are publicly readable. Volunteers agree to conduct themselves in good faith, avoiding duplicate task claims, malicious vote manipulation, or harassment of fellow stewards.
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              6. Legal Inquiries
            </h2>
            <p>
              Questions regarding these Terms of Service should be directed to our legal coordination office in{" "}
              <strong className="text-foreground">[LEGAL_JURISDICTION]</strong>:
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
          <Link href="/privacy" className="hover:text-foreground underline underline-offset-4">
            View Privacy Policy
          </Link>
        </footer>
      </div>
    </main>
  )
}
