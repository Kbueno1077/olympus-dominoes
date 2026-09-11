export const LIVE_WATCH_DISPLAY_NAME_MAX = 24;

/** Short table nicknames when someone skips the name prompt. */
export const LIVE_WATCH_GUEST_NAMES = [
  "Palma",
  "Clave",
  "Son",
  "Danzón",
  "Guayaba",
  "Malecón",
  "Bohío",
  "Yuma",
  "Tres",
  "Montuno",
  "Guateque",
  "Habanero",
  "Caimán",
  "Mamey",
  "Conga",
  "Timbal",
  "Bongó",
  "Loma",
  "Marea",
  "Sonero",
] as const;

export function sanitizeLiveWatchDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return null;
  return name.slice(0, LIVE_WATCH_DISPLAY_NAME_MAX);
}

export function pickGuestDisplayName(
  taken: Iterable<string>,
  joinOrder: number
): string {
  const used = new Set(
    Array.from(taken, (n) => n.trim().toLowerCase()).filter(Boolean)
  );
  for (const name of LIVE_WATCH_GUEST_NAMES) {
    if (!used.has(name.toLowerCase())) return name;
  }
  const base =
    LIVE_WATCH_GUEST_NAMES[joinOrder % LIVE_WATCH_GUEST_NAMES.length] ?? "Palma";
  return `${base} ${joinOrder}`.slice(0, LIVE_WATCH_DISPLAY_NAME_MAX);
}
