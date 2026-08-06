export const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = [
  { code: "en", short: "EN", name: "English", region: "USA", flag: "🇺🇸" },
  { code: "es", short: "ES", name: "Español", region: "España", flag: "🇪🇸" },
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
  featureLocal: "Active match kept in this browser",
  readyTitle: "Ready to play?",
  readyBody:
    "Name the players, pick a mode and a target score. Takes about twenty seconds.",
  continueReadyTitle: "Match in progress",
  continueReadyBody:
    "Pick up where you left off. Scores and the table stay until you end the match.",
  startMatch: "Start a new match",
  continueMatch: "Continue match",
  madeForTheTable: "Made for the table",
  howItWorksTitle: "How it works",
  howStep1Title: "Set the table",
  howStep1Body: "Name the players, choose partners or free for all, and pick a target.",
  howStep2Title: "Tally each hand",
  howStep2Body: "Add the leftover pips after every hand. The pad keeps the running total.",
  howStep3Title: "Call the winner",
  howStep3Body: "When a team hits the target, lock the game and start the next one.",
  webHistoryTitle: "Bring your match history",
  webHistoryBody:
    "Export a save from the mobile app (CSV or SQL), then open Analytics to load it. History and player stats use that same save.",
  webHistoryNote: "Upload a save",
  webHistoryCta: "Open analytics",

  // Analytics
  analyticsTitle: "Analytics",
  analyticsSubtitle:
    "Upload an Olympus Dominoes export from the mobile app. Nothing is sent to a server — it stays in this browser.",
  analyticsUploadTitle: "Drop a save here",
  analyticsUploadBody:
    "Use the CSV or SQL file from Settings → Export on the mobile app.",
  analyticsChooseFile: "Choose file",
  analyticsUploadHint: ".csv or .sql",
  analyticsReplaceFile: "Replace save",
  analyticsClear: "Clear",
  analyticsLoadedMeta: "{file} · {players} players · {matches} matches",
  analyticsErrorGeneric: "Could not read that file. Try another export.",
  analyticsErrorEmpty: "That export has no players or stats yet.",
  analyticsErrorFormat: "Use a CSV or SQL export from the mobile app.",
  analyticsErrorUnknownTable: "That file has an unexpected table section.",
  analyticsNav: "Analytics",
  statsNav: "Stats",
  compareNav: "Compare Stats",
  statsTitle: "Stats",
  navMenu: "Menu",
  navMenuAria: "Open navigation menu",
  navMatchInProgress: "In progress",
  compareNeedImport:
    "Upload a mobile app export in Stats first, then come back to compare players.",
  navMatch: "Match",
  historyNav: "History",
  historyTitle: "History",
  historyEmpty: "Finished matches will show up here.",
  historyGames: "{n} games",
  historyBack: "History",
  historyNeedImport:
    "Upload a mobile app export in Stats to browse past matches here.",
  historyGoAnalytics: "Open stats",

  datasetsTitle: "Data sets",
  datasetsHint:
    "Keep several backups in this browser (your league, a friend’s file, …). Switch anytime — history and stats all swap.",
  datasetsActive: "Active",
  datasetsSwitch: "Switch",
  datasetsRename: "Rename",
  datasetsReplace: "Replace file…",
  datasetsImportNew: "Import as new…",
  datasetsDelete: "Delete",
  datasetsClearActive: "Clear active",
  datasetsRenameTitle: "Rename data set",
  datasetsRenamePlaceholder: "Name",
  datasetsNameTitle: "Name this data set",
  datasetsDeleteTitle: "Delete “{name}”?",
  datasetsDeleteBody:
    "This removes the data set from this browser. Export from the mobile app again if you might need it.",
  datasetsSwitchTitle: "Switch data set?",
  datasetsSwitchBody:
    "History and analytics will switch to “{name}”.",
  datasetsClearTitle: "Clear this data set?",
  datasetsClearBody:
    "Players, history, and stats for the active data set will be removed from this browser.",
  datasetsLastDataset: "Keep at least one data set.",
  datasetsEmptyName: "Enter a name.",

  matchAnalytics: "Compare",
  toastMatchAnalyticsNeedImport:
    "Upload a save in Analytics first, then try again.",
  toastMatchAnalyticsNeedRoster:
    "Name these players so they match your imported save.",
  toastMatchAnalyticsFailed: "Could not open analytics.",

  statsEmptyPlayers: "Upload a save to see player stats.",
  statsNoData: "No games yet for this selection.",
  statsGamesPlayed: "Games played",
  statsGamesWon: "Games won",
  statsGamesLost: "Games lost",
  statsGameDifference: "Game difference",
  statsPointsFor: "Points for",
  statsPointsAgainst: "Points against",
  statsPointsDifference: "Points difference",
  statsPointsPerHandFor: "Points / hand for",
  statsPointsPerHandAgainst: "Points / hand against",
  statsPointsPerHandDifference: "Points / hand difference",
  statsHandsTotal: "Hands (all datas)",
  statsHandsWon: "Hands won (datas scored)",
  statsHandsLost: "Hands lost (datas conceded)",
  statsHandsDifference: "Hands difference",
  statsPollosFor: "Pollos for",
  statsPollosAgainst: "Pollos against",
  statsPollosDifference: "Pollos difference",
  statsZapatosFor: "Zapatos for",
  statsZapatosAgainst: "Zapatos against",
  statsZapatosDifference: "Zapatos difference",
  statsH2HTitle: "Head to head · T–W–L",
  statsH2HCompareHint: "Tap an opponent to open Compare.",
  statsH2HRecord: "{total}–{wins}–{losses}",
  statsWinPct: "{pct}%",
  statsRecord: "{wins}–{losses}",
  statsLeaderboard: "Leaderboard",
  statsJosesCoefficient: "Jose's Coefficient",
  statsFor: "For",
  statsAgainst: "Against",
  statsChartCoef: "Jose's Coefficient",
  syncJosesCoefficient: "Sync Jose's Coefficient",
  syncJosesCoefficientHint:
    "Recompute the ranking score for every player from saved stats. Use after a formula change.",
  toastJosesSynced: "Jose's Coefficient updated.",
  statsChartRecord: "{name} · record & shutouts",
  statsChartRecordGeneric: "Record & shutouts",

  statsCompare: "Compare players",
  statsBack: "Stats",
  statsComparePlayers: "Players",
  statsCompareHint: "Pick up to 10 players to compare every stat side by side.",
  statsComparePick: "Choose players",
  statsCompareEmpty: "Choose at least one player to compare.",
  statsCompareStat: "Stat",
  statsCompareRemove: "Remove {name}",
  statsCompareChartRecord: "Record",
  statsCompareChartPoints: "Points",
  statsCompareChartHands: "Hands",
  statsCompareChartShutouts: "Shutouts for",
  statsMatchupToggle: "This matchup",
  statsMatchupHint:
    "Only games where these players sat in the teams you assign. Order within a team does not matter.",
  statsMatchupAssignHint: "Tap blue or red beside each name for a side.",
  statsMatchupTeamA: "Team A",
  statsMatchupTeamB: "Team B",
  statsMatchupNeedPlayers: "Pick at least two players for a matchup.",
  statsMatchupNeedBothSides: "Put at least one player on each team.",
  statsMatchupLoadingTitle: "Calculating matchup…",
  statsMatchupLoadingBody:
    "Scanning match history for this seating. This can take a moment.",
  statsMatchupMeta: "{matches} matches · {games} games",
  statsMatchupNoGames: "No saved matches with this seating and mode.",
  statsAbbrJoses: "JC",
  statsAbbrGamesPlayed: "GP",
  statsAbbrGamesWon: "GW",
  statsAbbrGamesLost: "GL",
  statsAbbrGameDifference: "GD",
  statsAbbrPointsFor: "PF",
  statsAbbrPointsAgainst: "PA",
  statsAbbrPointsDifference: "PD",
  statsAbbrHandsTotal: "M",
  statsAbbrHandsWon: "MG",
  statsAbbrHandsLost: "MP",
  statsAbbrHandsDifference: "DifM",
  statsAbbrPointsPerHandFor: "PPH+",
  statsAbbrPointsPerHandAgainst: "PPH−",
  statsAbbrPointsPerHandDifference: "PPHΔ",
  statsAbbrPollosFor: "Pol+",
  statsAbbrPollosAgainst: "Pol−",
  statsAbbrPollosDifference: "PolΔ",
  statsAbbrZapatosFor: "Zap+",
  statsAbbrZapatosAgainst: "Zap−",
  statsAbbrZapatosDifference: "ZapΔ",
  done: "Done",

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
  featureLocal: "La partida activa se guarda en este navegador",
  readyTitle: "¿Listos para jugar?",
  readyBody:
    "Pon los nombres, elige el modo y los puntos. Toma unos veinte segundos.",
  continueReadyTitle: "Partida en curso",
  continueReadyBody:
    "Sigue donde la dejaste. Los puntos y la mesa se quedan hasta que termines la partida.",
  startMatch: "Empezar una partida",
  continueMatch: "Continuar partida",
  madeForTheTable: "Hecho para la mesa",
  howItWorksTitle: "Cómo funciona",
  howStep1Title: "Arma la mesa",
  howStep1Body: "Pon los nombres, elige parejas o todos contra todos, y fija la meta.",
  howStep2Title: "Anota cada mano",
  howStep2Body: "Suma los puntos que quedaron. La libreta lleva el total.",
  howStep3Title: "Canta al ganador",
  howStep3Body: "Cuando un equipo llega a la meta, cierra el juego y empieza el siguiente.",
  webHistoryTitle: "Trae tu historial",
  webHistoryBody:
    "Exporta un respaldo desde la app móvil (CSV o SQL) y ábrelo en Analítica. El historial y las estadísticas usan ese mismo archivo.",
  webHistoryNote: "Sube un respaldo",
  webHistoryCta: "Abrir analítica",

  // Analytics
  analyticsTitle: "Analítica",
  analyticsSubtitle:
    "Sube un export de Olympus Dominoes desde la app móvil. No se envía a ningún servidor: se queda en este navegador.",
  analyticsUploadTitle: "Suelta un respaldo aquí",
  analyticsUploadBody:
    "Usa el archivo CSV o SQL de Ajustes → Exportar en la app móvil.",
  analyticsChooseFile: "Elegir archivo",
  analyticsUploadHint: ".csv o .sql",
  analyticsReplaceFile: "Cambiar archivo",
  analyticsClear: "Borrar",
  analyticsLoadedMeta: "{file} · {players} jugadores · {matches} partidas",
  analyticsErrorGeneric: "No se pudo leer ese archivo. Prueba otro export.",
  analyticsErrorEmpty: "Ese export no tiene jugadores ni estadísticas aún.",
  analyticsErrorFormat: "Usa un export CSV o SQL de la app móvil.",
  analyticsErrorUnknownTable: "Ese archivo tiene una sección de tabla inesperada.",
  analyticsNav: "Analítica",
  statsNav: "Estadísticas",
  compareNav: "Comparar stats",
  statsTitle: "Estadísticas",
  navMenu: "Menú",
  navMenuAria: "Abrir menú de navegación",
  navMatchInProgress: "En curso",
  compareNeedImport:
    "Sube un export de la app en Estadísticas primero, luego vuelve a comparar jugadores.",
  navMatch: "Partida",
  historyNav: "Historial",
  historyTitle: "Historial",
  historyEmpty: "Aquí aparecerán las partidas terminadas.",
  historyGames: "{n} juegos",
  historyBack: "Historial",
  historyNeedImport:
    "Sube un export de la app en Estadísticas para ver partidas aquí.",
  historyGoAnalytics: "Abrir estadísticas",

  datasetsTitle: "Conjuntos de datos",
  datasetsHint:
    "Guarda varios respaldos en este navegador (tu liga, el archivo de un amigo, …). Cambia cuando quieras: historial y estadísticas se reemplazan.",
  datasetsActive: "Activo",
  datasetsSwitch: "Cambiar",
  datasetsRename: "Renombrar",
  datasetsReplace: "Reemplazar archivo…",
  datasetsImportNew: "Importar como nuevo…",
  datasetsDelete: "Eliminar",
  datasetsClearActive: "Vaciar activo",
  datasetsRenameTitle: "Renombrar conjunto",
  datasetsRenamePlaceholder: "Nombre",
  datasetsNameTitle: "Nombre de este conjunto",
  datasetsDeleteTitle: "¿Eliminar “{name}”?",
  datasetsDeleteBody:
    "Se quita el conjunto de este navegador. Exporta de nuevo desde la app móvil si lo puedes necesitar.",
  datasetsSwitchTitle: "¿Cambiar de conjunto?",
  datasetsSwitchBody:
    "El historial y la analítica pasarán a “{name}”.",
  datasetsClearTitle: "¿Vaciar este conjunto?",
  datasetsClearBody:
    "Se borrarán jugadores, historial y estadísticas del conjunto activo en este navegador.",
  datasetsLastDataset: "Deja al menos un conjunto de datos.",
  datasetsEmptyName: "Escribe un nombre.",

  matchAnalytics: "Comparar",
  toastMatchAnalyticsNeedImport:
    "Sube un respaldo en Analítica primero e inténtalo de nuevo.",
  toastMatchAnalyticsNeedRoster:
    "Nombra a estos jugadores para que coincidan con tu respaldo importado.",
  toastMatchAnalyticsFailed: "No se pudo abrir la analítica.",

  statsEmptyPlayers: "Sube un respaldo para ver estadísticas.",
  statsNoData: "Aún no hay juegos para esta selección.",
  statsGamesPlayed: "Juegos jugados",
  statsGamesWon: "Juegos ganados",
  statsGamesLost: "Juegos perdidos",
  statsGameDifference: "Diferencia de juegos",
  statsPointsFor: "Puntos a favor",
  statsPointsAgainst: "Puntos en contra",
  statsPointsDifference: "Diferencia de puntos",
  statsPointsPerHandFor: "Puntos / mano a favor",
  statsPointsPerHandAgainst: "Puntos / mano en contra",
  statsPointsPerHandDifference: "Diferencia puntos / mano",
  statsHandsTotal: "Manos (todas las datas)",
  statsHandsWon: "Manos ganadas (datas a favor)",
  statsHandsLost: "Manos perdidas (datas en contra)",
  statsHandsDifference: "Diferencia de manos",
  statsPollosFor: "Pollos a favor",
  statsPollosAgainst: "Pollos en contra",
  statsPollosDifference: "Diferencia de pollos",
  statsZapatosFor: "Zapatos a favor",
  statsZapatosAgainst: "Zapatos en contra",
  statsZapatosDifference: "Diferencia de zapatos",
  statsH2HTitle: "Cara a cara · T–G–P",
  statsH2HCompareHint: "Toca un rival para abrir Comparar.",
  statsH2HRecord: "{total}–{wins}–{losses}",
  statsWinPct: "{pct}%",
  statsRecord: "{wins}–{losses}",
  statsLeaderboard: "Clasificación",
  statsJosesCoefficient: "Coeficiente de José",
  statsFor: "A favor",
  statsAgainst: "En contra",
  statsChartCoef: "Coeficiente de José",
  syncJosesCoefficient: "Sincronizar coeficiente de José",
  syncJosesCoefficientHint:
    "Recalcula la puntuación de todos los jugadores a partir de las estadísticas guardadas. Úsalo si cambió la fórmula.",
  toastJosesSynced: "Coeficiente de José actualizado.",
  statsChartRecord: "{name} · marca y cerradas",
  statsChartRecordGeneric: "Marca y cerradas",

  statsCompare: "Comparar jugadores",
  statsBack: "Estadísticas",
  statsComparePlayers: "Jugadores",
  statsCompareHint:
    "Elige hasta 10 jugadores para comparar todas las estadísticas.",
  statsComparePick: "Elegir jugadores",
  statsCompareEmpty: "Elige al menos un jugador para comparar.",
  statsCompareStat: "Estad.",
  statsCompareRemove: "Quitar a {name}",
  statsCompareChartRecord: "Marca",
  statsCompareChartPoints: "Puntos",
  statsCompareChartHands: "Manos",
  statsCompareChartShutouts: "Cerradas a favor",
  statsMatchupToggle: "Este enfrentamiento",
  statsMatchupHint:
    "Solo partidas donde estos jugadores se sentaron en los equipos que asignes. El orden dentro del equipo no importa.",
  statsMatchupAssignHint: "Toca azul o rojo junto al nombre para el lado.",
  statsMatchupTeamA: "Equipo A",
  statsMatchupTeamB: "Equipo B",
  statsMatchupNeedPlayers: "Elige al menos dos jugadores para el enfrentamiento.",
  statsMatchupNeedBothSides: "Pon al menos un jugador en cada equipo.",
  statsMatchupLoadingTitle: "Calculando enfrentamiento…",
  statsMatchupLoadingBody:
    "Revisando el historial con esta alineación. Puede tardar un momento.",
  statsMatchupMeta: "{matches} partidas · {games} juegos",
  statsMatchupNoGames:
    "No hay partidas guardadas con esta alineación y formato.",
  statsAbbrJoses: "CJ",
  statsAbbrGamesPlayed: "PJ",
  statsAbbrGamesWon: "PG",
  statsAbbrGamesLost: "PP",
  statsAbbrGameDifference: "DP",
  statsAbbrPointsFor: "PF",
  statsAbbrPointsAgainst: "PC",
  statsAbbrPointsDifference: "DifP",
  statsAbbrHandsTotal: "M",
  statsAbbrHandsWon: "MG",
  statsAbbrHandsLost: "MP",
  statsAbbrHandsDifference: "DifM",
  statsAbbrPointsPerHandFor: "P/M+",
  statsAbbrPointsPerHandAgainst: "P/M−",
  statsAbbrPointsPerHandDifference: "P/MΔ",
  statsAbbrPollosFor: "Pol+",
  statsAbbrPollosAgainst: "Pol−",
  statsAbbrPollosDifference: "PolΔ",
  statsAbbrZapatosFor: "Zap+",
  statsAbbrZapatosAgainst: "Zap−",
  statsAbbrZapatosDifference: "ZapΔ",
  done: "Listo",

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
