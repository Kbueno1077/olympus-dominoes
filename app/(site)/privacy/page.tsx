import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Olympus Dominoes",
  description:
    "Privacy Policy for the Olympus Dominoes mobile app and companion website.",
};

const LAST_UPDATED = "August 7, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-6 text-sm text-[rgb(var(--text-muted))]">
        <Link
          href="/"
          className="underline decoration-[rgb(var(--border))] underline-offset-2 hover:text-[rgb(var(--primary))]"
        >
          ← Olympus Dominoes
        </Link>
      </p>

      <article className="space-y-8 text-[rgb(var(--text))]">
        <header className="space-y-2 border-b border-[rgb(var(--border))] pb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-[rgb(var(--text-muted))]">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            Olympus Dominoes (“the App,” including the mobile application and
            this companion website) is an offline-first scorekeeper for
            dominoes. This Privacy Policy explains what information is handled
            when you use the App.
          </p>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            In short: match and player data stay on your device or browser. We
            do not require an account, and the App does not automatically send
            your game data to our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Information we handle</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            The App stores the following locally on your device or in your
            browser:
          </p>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-[rgb(var(--text-muted))]">
            <li>
              Player names and match details you enter (titles, scores, hands,
              settings).
            </li>
            <li>
              Computed local stats derived from your matches (wins, losses,
              head-to-head records, and similar).
            </li>
            <li>
              App preferences such as language, UI options, in-progress match
              state, and named datasets.
            </li>
            <li>
              On the website only: a language preference cookie (
              <code className="rounded bg-[rgb(var(--bone-200))] px-1 py-0.5 text-sm">
                lang
              </code>
              ).
            </li>
            <li>
              Optionally, on mobile: photos taken with the pip counter, stored
              on the device if you confirm a scan.
            </li>
          </ul>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            The App does not ask for email address, phone number, payment
            information, or government ID.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How information is used</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            Local data is used only to run the scorekeeper and stats features
            on your device or browser—for example, recording games, showing
            history, and calculating leaderboards. “Analytics” in the App means
            your local match statistics, not third-party tracking.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Camera</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            The optional pip counter on the mobile app may use the camera to
            photograph domino tiles. Image processing runs on your device.
            Photos are not uploaded automatically. You may choose to export scan
            files yourself via the device share sheet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Import, export, and sharing</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            You can export match data as CSV and import it
            into the mobile app or this website. Exports and imports are
            user-initiated. When you share a file, the destination (email, cloud
            drive, messaging, and so on) is controlled by you and your device,
            not by an automatic upload from the App.
          </p>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            There is no automatic cloud sync between the mobile app and the
            website.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            What we do not collect automatically
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-[rgb(var(--text-muted))]">
            <li>No user accounts or sign-in.</li>
            <li>
              No advertising networks or in-app behavioral analytics SDKs in the
              App.
            </li>
            <li>
              No automatic transmission of match or player data to
              developer-operated backends from App code.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Third parties and hosting</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            This website may be hosted by a third-party provider (for example
            Vercel). Hosting providers may process standard technical logs such
            as IP address, user agent, and request URLs as part of delivering
            the site. Those logs are not used by the App to store your match
            history.
          </p>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            Some website UI icons may be loaded from Iconify’s public icon
            service. That request identifies the icon to display; it does not
            include your match or player data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Data retention and deletion</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            Data remains on your device or browser until you delete it, clear
            app or site storage, or uninstall the mobile app. Export a backup
            first if you want to keep your history. We do not maintain a
            separate cloud copy of your games that we can delete on request,
            because we do not host your match database.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Children</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            The App is a general-audience scorekeeper and is not directed at
            children under 13. We do not knowingly collect personal information
            from children.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Changes</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            We may update this Privacy Policy from time to time. The “Last
            updated” date at the top of this page will change when we do. Continued
            use of the App after an update means you accept the revised policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            Questions about this Privacy Policy can be sent through the contact
            options on the Olympus Dominoes store listing, or via the developer
            site linked from the mobile app settings.
          </p>
        </section>

        <p className="border-t border-[rgb(var(--border))] pt-6 text-sm text-[rgb(var(--text-muted))]">
          This page applies to the Olympus Dominoes mobile app (
          <code className="rounded bg-[rgb(var(--bone-200))] px-1 py-0.5 text-xs">
            com.olympus.dominoes
          </code>
          ) and this companion website.
        </p>
      </article>
    </div>
  );
}
