export const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = [
  { code: "en", short: "EN", name: "English" },
  { code: "es", short: "ES", name: "Español" },
];

export const LANGUAGE_COOKIE = "lang";

export function isSupportedLanguage(code) {
  return LANGUAGES.some((language) => language.code === code);
}

/**
 * Game mode labels are persisted in storage and compared in the win logic, so
 * the stored value stays English forever. This maps it to a display string.
 */
export const MODE_LABEL_KEYS = {
  "1 vs 1": "mode1v1",
  "2 vs 1": "mode2v1",
  "2 vs 2": "mode2v2",
  "Free For All": "modeFreeForAll",
};

const en = {
  tagline: "Score · Double nine · 55 tiles",
  language: "Language",

  team: "Team {n}",
  player: "Player {n}",
  namePlaceholder: "Name",
  selfName: "Myself",
  selfPlaceholder: "Myself",
  rosterTitle: "Who's playing",
  rosterSubtitle: "Type them in, or fill the table at random.",
  randomNames: "Random names",
  clearName: "Clear name",
  youBadge: "You",

  mode1v1: "1 vs 1",
  mode2v1: "2 vs 1",
  mode2v2: "2 vs 2",
  modeFreeForAll: "Free for all",

  // Dashboard
  heroTitle: "Keep score, not arguments",
  heroSubtitle:
    "A clean scorepad for Cuban dominoes. Set the table, tally each hand, and let the app call the winner.",
  featurePlayers: "2 to 4 players",
  featureModes: "Partners or free for all",
  featureLocal: "Saved on this device",
  readyTitle: "Ready to play?",
  readyBody:
    "Name the players, pick a mode and a target score. Takes about twenty seconds.",
  startMatch: "Start a new match",
  madeForTheTable: "Made for the table",

  // Setup
  setupTitle: "Match setup",
  setupSubtitle: "Lock this in before the first hand.",
  playersAtTable: "Players at the table",
  format: "Format",
  pointsToWin: "Points to win",
  target: "Target",
  freeForAllNote: "In Free For All every player keeps their own score.",
  playersCount: "{n} players",
  firstTo: "First to {n}",
  startPlaying: "Start playing",
  playerCountAria: "{n} players",

  // Table
  tableTitle: "The table",
  tableSubtitle: "Who sits where. Partners face each other.",
  tableCaption: "{total} tiles · {perHand} dealt to each player",

  // Scorepad
  gameNumber: "Game {n}",
  firstToPoints: "First to {n} points",
  total: "Total",
  editHands: "Edit hands",
  doneEditing: "Done editing",
  stopEditingAria: "Stop editing hands",
  add: "Add",
  progressAria: "{team} progress toward {points} points",
  matchStanding: "Match standing",
  waitingForTarget: "Waiting for a team to reach {points}.",
  teamReached: "{team} reached {points}.",
  nextGame: "Next game",
  dashboard: "Dashboard",
  tookIt: "{team} took it",

  // Outcomes
  winner: "Winner",
  pollo: "Pollo",
  zapato: "Zapato",

  // Dialogs
  cancel: "Cancel",
  keepIt: "Keep it",
  delete: "Delete",
  addPointsTitle: "Add points to {team}",
  addPointsBody: "Count the pips left in the other hands.",
  points: "Points",
  addPoints: "Add points",
  deleteHandTitle: "Delete this hand?",
  deleteHandBody: "Removing {summary} will subtract it from the team's total.",
  deleteHandAria: "Delete hand worth {points} points",
  deleteGameTooltip: "Delete this game",
  deleteGameAria: "Delete game {n}",
  deleteGameTitle: "Delete game {n}?",
  deleteGameBody:
    "This game's scores will be removed from the match. The games after it will be renumbered.",
  endMatch: "End match",
  endMatchTitle: "End this match?",
  endMatchBody:
    "Every game, score and player name will be cleared and the table reset. This cannot be undone.",
  keepPlaying: "Keep playing",

  // Toasts
  toastMissingPlayers:
    "This match is set for {expected} players but only {present} are named.",
  toastNeedWinner: "A game needs a winner before moving on.",
  toastTooManyOverTarget:
    "More than one team is at or past the target. Check the scores.",
  toastEnterPoints: "Enter the points this team just made.",
};

const es = {
  tagline: "Anota · Doble nueve · 55 fichas",
  language: "Idioma",

  team: "Equipo {n}",
  player: "Jugador {n}",
  namePlaceholder: "Nombre",
  selfName: "Yo",
  selfPlaceholder: "Yo",
  rosterTitle: "Quién juega",
  rosterSubtitle: "Escríbelos, o llena la mesa al azar.",
  randomNames: "Nombres al azar",
  clearName: "Borrar nombre",
  youBadge: "Tú",

  mode1v1: "1 vs 1",
  mode2v1: "2 vs 1",
  mode2v2: "2 vs 2",
  modeFreeForAll: "Todos contra todos",

  // Dashboard
  heroTitle: "Anota los puntos, no las discusiones",
  heroSubtitle:
    "Una libreta limpia para el dominó cubano. Arma la mesa, anota cada mano y deja que la app cante al ganador.",
  featurePlayers: "De 2 a 4 jugadores",
  featureModes: "En parejas o todos contra todos",
  featureLocal: "Guardado en este dispositivo",
  readyTitle: "¿Listos para jugar?",
  readyBody:
    "Pon los nombres, elige el modo y los puntos. Toma unos veinte segundos.",
  startMatch: "Empezar una partida",
  madeForTheTable: "Hecho para la mesa",

  // Setup
  setupTitle: "Configuración de la partida",
  setupSubtitle: "Déjalo listo antes de la primera mano.",
  playersAtTable: "Jugadores en la mesa",
  format: "Modo de juego",
  pointsToWin: "Puntos para ganar",
  target: "Meta",
  freeForAllNote:
    "En Todos contra todos cada jugador lleva su propia anotación.",
  playersCount: "{n} jugadores",
  firstTo: "Primero a {n}",
  startPlaying: "Empezar a jugar",
  playerCountAria: "{n} jugadores",

  // Table
  tableTitle: "La mesa",
  tableSubtitle: "Quién se sienta dónde. Las parejas se sientan de frente.",
  tableCaption: "{total} fichas · {perHand} repartidas a cada jugador",

  // Scorepad
  gameNumber: "Juego {n}",
  firstToPoints: "Primero a {n} puntos",
  total: "Total",
  editHands: "Editar manos",
  doneEditing: "Listo",
  stopEditingAria: "Dejar de editar manos",
  add: "Anotar",
  progressAria: "Avance del {team} hacia {points} puntos",
  matchStanding: "Cómo va la partida",
  waitingForTarget: "Esperando a que un equipo llegue a {points}.",
  teamReached: "{team} llegó a {points}.",
  nextGame: "Siguiente juego",
  dashboard: "Inicio",
  tookIt: "Ganó {team}",

  // Outcomes
  winner: "Ganador",
  pollo: "Pollo",
  zapato: "Zapato",

  // Dialogs
  cancel: "Cancelar",
  keepIt: "Dejarlo",
  delete: "Borrar",
  addPointsTitle: "Anotar puntos al {team}",
  addPointsBody: "Cuenta los puntos que quedaron en las otras manos.",
  points: "Puntos",
  addPoints: "Anotar puntos",
  deleteHandTitle: "¿Borrar esta mano?",
  deleteHandBody: "Quitar {summary} lo restará del total del equipo.",
  deleteHandAria: "Borrar la mano de {points} puntos",
  deleteGameTooltip: "Borrar este juego",
  deleteGameAria: "Borrar el juego {n}",
  deleteGameTitle: "¿Borrar el juego {n}?",
  deleteGameBody:
    "Los puntos de este juego se quitarán de la partida y los juegos siguientes se renumerarán.",
  endMatch: "Terminar partida",
  endMatchTitle: "¿Terminar la partida?",
  endMatchBody:
    "Se borrarán todos los juegos, los puntos y los nombres, y la mesa volverá a empezar. No se puede deshacer.",
  keepPlaying: "Seguir jugando",

  // Toasts
  toastMissingPlayers:
    "La partida es para {expected} jugadores pero solo hay {present} con nombre.",
  toastNeedWinner: "Hace falta un ganador antes de seguir.",
  toastTooManyOverTarget:
    "Más de un equipo llegó o pasó la meta. Revisa los puntos.",
  toastEnterPoints: "Escribe los puntos que acaba de hacer este equipo.",
};

export const translations = { en, es };
