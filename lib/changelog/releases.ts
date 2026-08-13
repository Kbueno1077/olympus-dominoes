/**
 * Curated release notes for the web app.
 *
 * Written for players: features, UI, and feel — not implementation detail.
 * Reconstructed from version bumps and merged work on master; powers `/changelog`.
 */

export type ChangelogRelease = {
  /** Semver, or `unreleased` for work not yet version-bumped. */
  version: string;
  /** ISO date (YYYY-MM-DD) when the version landed, if known. */
  date: string | null;
  /** One-line summary. */
  summary: string;
  /** Bullet highlights shown on the changelog page. */
  highlights: string[];
};

export const CHANGELOG: ChangelogRelease[] = [
  {
    version: "4.6.0",
    date: "2026-08-10",
    summary: "Double-six sets, plus an internal Play vs bots table.",
    highlights: [
      "Added: choose Double nine (55 tiles) or Double six (28 tiles) when you set up a match.",
      "The table picture matches the set you picked (7 tiles dealt for double six).",
      "Play vs bots is available from the home screen and the nav menu.",
    ],
  },
  {
    version: "4.5.0",
    date: "2026-08-09",
    summary: "Clearer home screen, quieter Privacy, and first store review.",
    highlights: [
      "Home explains App vs Web in a short, fold-away note — easier to scan.",
      "Version line lives on Privacy now, instead of crowding the header.",
      "Experimental merge tools stay off the public site for now — internal use, and may come to a release later.",
      "First build submitted for Apple App Store and Google Play review.",
    ],
  },
  {
    version: "4.4.0",
    date: "2026-08-08",
    summary: "A small brand touch and early merge experiments.",
    highlights: [
      "Header shows a light kbueno version signature beside the tagline.",
      "Early tools to combine datasets (for trying out merges across your exports).",
    ],
  },
  {
    version: "4.3.0",
    date: "2026-08-08",
    summary: "Matches stay recognizable when you import again.",
    highlights: [
      "Importing the same match from another export no longer treats it like a brand-new game.",
      "History and stats stay consistent when you move data between the app and the web.",
    ],
  },
  {
    version: "4.2.1",
    date: "2026-08-07",
    summary: "Smoother imports for named datasets.",
    highlights: [
      "Imported leagues and datasets keep their identity more reliably after you bring a file in.",
    ],
  },
  {
    version: "4.2.0",
    date: "2026-08-07",
    summary: "Leaderboard, cleaner History, and simpler imports.",
    highlights: [
      "Added: Leaderboard page to rank players at a glance.",
      "Players line up better with the mobile app when you share names across devices.",
      "Removed: SQL file import — bring data in with CSV only.",
      "History and the main dashboard look cleaner and easier to read.",
    ],
  },
  {
    version: "4.1.0",
    date: "2026-08-06",
    summary: "Podium awards and a clearer menu.",
    highlights: [
      "Added: Podium — fun awards and punchlines for how you play.",
      "Navigation shows icons, with Compare sitting next to Podium.",
    ],
  },
];

/** Newest numbered release (skips `unreleased`). */
export function latestReleasedVersion(): string {
  const released = CHANGELOG.find((entry) => entry.version !== "unreleased");
  return released?.version ?? "0.0.0";
}
