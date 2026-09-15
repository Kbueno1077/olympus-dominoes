/** Path ranks for directional view transitions. Lower is closer to home. */
const NAV_RANK: { prefix: string; rank: number }[] = [
  { prefix: "/", rank: 0 },
  { prefix: "/play", rank: 1 },
  { prefix: "/match", rank: 2 },
  { prefix: "/watch", rank: 2 },
  { prefix: "/history", rank: 3 },
  { prefix: "/leaderboard", rank: 4 },
  { prefix: "/stats", rank: 5 },
  { prefix: "/compare", rank: 6 },
  { prefix: "/podium", rank: 7 },
  { prefix: "/how-to-use", rank: 8 },
  { prefix: "/changelog", rank: 9 },
  { prefix: "/privacy", rank: 10 },
  { prefix: "/tools", rank: 11 },
  { prefix: "/f-lab", rank: 12 },
];

export type NavTransitionType = "nav-forward" | "nav-back";

export function pathWithoutSearch(href: string): string {
  const q = href.search(/[?#]/);
  return q === -1 ? href : href.slice(0, q);
}

function navRank(pathname: string): number {
  const path = pathWithoutSearch(pathname);
  if (path === "/") return 0;
  let best: { prefix: string; rank: number } | null = null;
  for (const entry of NAV_RANK) {
    if (entry.prefix === "/") continue;
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) {
      if (!best || entry.prefix.length >= best.prefix.length) best = entry;
    }
  }
  return best?.rank ?? 0;
}

/** Types passed to Next `<Link>` / `router.push` for React View Transitions. */
export function navTransitionTypes(
  fromPath: string,
  toHref: string
): NavTransitionType[] {
  const from = pathWithoutSearch(fromPath);
  const to = pathWithoutSearch(toHref);
  if (from === to) return ["nav-forward"];
  if (to.startsWith(`${from}/`)) return ["nav-forward"];
  if (from.startsWith(`${to}/`)) return ["nav-back"];
  return navRank(to) >= navRank(from) ? ["nav-forward"] : ["nav-back"];
}
