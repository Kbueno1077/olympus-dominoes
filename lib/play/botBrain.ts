/** How bots choose moves — switched from Play settings. */
export type BotBrainId = "classic" | "table_sense" | "pimc";

export const BOT_BRAIN_KEY = "olympus-play-bot-brain";

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

export function readBotBrain(): BotBrainId {
  try {
    const raw = sessionStorage.getItem(BOT_BRAIN_KEY);
    if (raw && isBotBrainId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "table_sense";
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
