/**
 * Everyday first names for the "fill randomly" action. Mix of common Spanish
 * and English names so a Cuban table still feels familiar in either language.
 */
const NAME_POOL = [
  "Luis",
  "Ana",
  "Carlos",
  "Maria",
  "Pedro",
  "Sofia",
  "Miguel",
  "Carmen",
  "Jorge",
  "Elena",
  "Diego",
  "Rosa",
  "Andres",
  "Isabel",
  "Hector",
  "Laura",
  "Ramon",
  "Patricia",
  "Oscar",
  "Lucia",
  "Fernando",
  "Claudia",
  "Ricardo",
  "Valeria",
  "Manuel",
  "Camila",
  "Antonio",
  "Daniela",
  "Francisco",
  "Paula",
  "Alex",
  "Sam",
  "Chris",
  "Jordan",
  "Nina",
  "Marco",
];

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Builds a four-slot roster. Slot 0 is always the local player label
 * ("Myself" / "Yo"); the rest are unique draws from the name pool.
 */
export function buildRandomRoster(count, selfName) {
  const needed = Math.max(0, Math.min(count, 4) - 1);
  const picks = shuffle(
    NAME_POOL.filter((name) => name.toLowerCase() !== selfName.toLowerCase())
  ).slice(0, needed);

  return [selfName, picks[0] ?? "", picks[1] ?? "", picks[2] ?? ""];
}
