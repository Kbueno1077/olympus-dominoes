/** How bots choose moves — switched from Play settings. */
export type BotBrainId = "classic" | "table_sense" | "pimc";

export const BOT_BRAIN_KEY = "olympus-play-bot-brain";

/** Levels offered in setup / settings. Easy (`classic`) is retired. */
export const SELECTABLE_BOT_BRAIN_IDS = ["table_sense", "pimc"] as const;

export type SelectableBotBrainId = (typeof SELECTABLE_BOT_BRAIN_IDS)[number];

export const DEFAULT_BOT_BRAIN: SelectableBotBrainId = "pimc";

export const BOT_BRAIN_IDS: BotBrainId[] = [
  "classic",
  "table_sense",
  "pimc",
];

export function isBotBrainId(value: string): value is BotBrainId {
  return (
    value === "classic" || value === "table_sense" || value === "pimc"
  );
}

export function isSelectableBotBrainId(
  value: string
): value is SelectableBotBrainId {
  return value === "table_sense" || value === "pimc";
}

export function readBotBrain(): SelectableBotBrainId {
  try {
    const raw = sessionStorage.getItem(BOT_BRAIN_KEY);
    if (raw && isSelectableBotBrainId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_BOT_BRAIN;
}

export function writeBotBrain(id: BotBrainId) {
  try {
    sessionStorage.setItem(BOT_BRAIN_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Rules shown in settings for the attentive brain (i18n keys). */
export const TABLE_SENSE_RULE_KEYS = [
  "playBotRulePasses",
  "playBotRuleNext",
  "playBotRulePartner",
  "playBotRuleOpenerFavored",
  "playBotRuleTeamEnds",
  "playBotRuleSelfLine",
  "playBotRuleCloseTable",
  "playBotRuleRace",
  "playBotRuleHandReset",
  "playBotRuleNoCheat",
] as const;

/** Rules shown when PIMC search brain is selected. */
export const PIMC_RULE_KEYS = [
  "playBotPimcRuleSearch",
  "playBotPimcRuleVoids",
  "playBotPimcRuleTeam",
  "playBotPimcRuleModes",
  "playBotPimcRuleNoCheat",
  "playBotRuleHandReset",
] as const;
