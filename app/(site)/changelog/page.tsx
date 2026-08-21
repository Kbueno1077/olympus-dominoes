import type { Metadata } from "next";
import Link from "next/link";
import { APP_UI_SIGNATURE, WRITING_APP_VERSION } from "@/lib/analytics/dbMeta";
import { SCHEMA_VERSION } from "@/lib/analytics/schemaVersion";
import { CHANGELOG } from "@/lib/changelog/releases";

export const metadata: Metadata = {
  title: "Changelog | Olympus Dominoes",
  description:
    "Release notes for the Olympus Dominoes companion website — what changed in each version.",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function ChangelogPage() {
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

      <article className="space-y-10 text-[rgb(var(--text))]">
        <header className="space-y-2 border-b border-[rgb(var(--border))] pb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Changelog
          </h1>
          <p className="leading-relaxed text-[rgb(var(--text-muted))]">
            What changed for you on the companion website — new features, UI
            tweaks, and removals — version by version.
          </p>
          <p className="text-xs font-medium tracking-wide text-[rgb(var(--text-muted))]">
            {APP_UI_SIGNATURE} · schema {SCHEMA_VERSION}
          </p>
        </header>

        <ol className="space-y-10">
          {CHANGELOG.map((release) => {
            const isUnreleased = release.version === "unreleased";
            const isCurrent = release.version === WRITING_APP_VERSION;
            const dateLabel = isCurrent ? formatDate(release.date) : null;
            const schema =
              release.schema ?? (isUnreleased ? SCHEMA_VERSION : null);

            return (
              <li
                key={release.version}
                id={isUnreleased ? "unreleased" : `v${release.version}`}
                className="scroll-mt-24"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {isUnreleased ? "Unreleased" : `v${release.version}`}
                    </h2>
                    {schema != null ? (
                      <span className="text-sm text-[rgb(var(--text-muted))]">
                        schema {schema}
                      </span>
                    ) : null}
                    {dateLabel && (
                      <time
                        dateTime={release.date ?? undefined}
                        className="text-sm text-[rgb(var(--text-muted))]"
                      >
                        {dateLabel}
                      </time>
                    )}
                  </div>

                  <p className="leading-relaxed text-[rgb(var(--text-muted))]">
                    {release.summary}
                  </p>

                  <ul className="list-disc space-y-2 pl-5 leading-relaxed text-[rgb(var(--text-muted))]">
                    {release.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="border-t border-[rgb(var(--border))] pt-6 text-sm text-[rgb(var(--text-muted))]">
          Release notes start at 4.1.0 (August 2026). Earlier updates were not
          numbered the same way.
        </p>
      </article>
    </div>
  );
}
