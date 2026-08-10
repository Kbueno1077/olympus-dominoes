/** Pace sliders use levels 1 (slow) … 20 (fast); engine still runs on ms. */

export const PACE_LEVEL_MIN = 1;
export const PACE_LEVEL_MAX = 20;
export const PACE_LEVEL_NORMAL = 10;

const BOT_MS_SLOW = 2000;
const BOT_MS_FAST = 200;
const ANIM_MS_SLOW = 900;
const ANIM_MS_FAST = 200;

function clampLevel(level: number): number {
  return Math.min(PACE_LEVEL_MAX, Math.max(PACE_LEVEL_MIN, Math.round(level)));
}

function msFromLevel(
  level: number,
  slowMs: number,
  fastMs: number
): number {
  const t = (clampLevel(level) - PACE_LEVEL_MIN) / (PACE_LEVEL_MAX - PACE_LEVEL_MIN);
  return Math.round(slowMs + t * (fastMs - slowMs));
}

function levelFromMs(ms: number, slowMs: number, fastMs: number): number {
  const span = slowMs - fastMs;
  if (span <= 0) return PACE_LEVEL_NORMAL;
  const t = (slowMs - ms) / span;
  return clampLevel(PACE_LEVEL_MIN + t * (PACE_LEVEL_MAX - PACE_LEVEL_MIN));
}

export function botMsFromLevel(level: number): number {
  return msFromLevel(level, BOT_MS_SLOW, BOT_MS_FAST);
}

export function botLevelFromMs(ms: number): number {
  return levelFromMs(ms, BOT_MS_SLOW, BOT_MS_FAST);
}

export function animMsFromLevel(level: number): number {
  return msFromLevel(level, ANIM_MS_SLOW, ANIM_MS_FAST);
}

export function animLevelFromMs(ms: number): number {
  return levelFromMs(ms, ANIM_MS_SLOW, ANIM_MS_FAST);
}
