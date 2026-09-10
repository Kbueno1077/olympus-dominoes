# Testing Olympus Dominoes (web)

Living catalog of what our automated tests protect. When product behavior changes
**on purpose**, update the matching suite **and** this file. Do not “fix” a
failing test to silence a regression.

## Glossary

| English | Spanish (UI) | Meaning |
|---------|--------------|---------|
| **Match** | Partida (session) | One sitting: setup → several games → end / history |
| **Game** | Partida (scored) | One race to the target score; stats “games” counters |
| **Hand / data** | Mano / data | One score entry on a team’s note |

## Pyramid

| Layer | Status | Role |
|-------|--------|------|
| Domain unit (`lib/**/*.test.ts`, `utils/**/*.test.ts`) | **Active** | Export parse, Jose, history, podium, seating |
| Component / UI | Deferred | Low ROI while flows still move |
| E2E (Playwright) | Later | Import → Stats → History when flows stabilize |

## How to run

```bash
npm test            # CI / before commit
npm run test:watch  # while editing domain logic
npm run typecheck
```

Pull requests and pushes to `master` run the same checks in GitHub Actions
(`.github/workflows/ci.yml`).

## When to change tests vs code

1. **Intentional rule change** (e.g. pollo definition) → update domain code, failing tests, and the suite entry below.
2. **Bug / accidental break** → fix the code; leave the test red until green.
3. **New feature** → add coverage + a catalog block in this file.

Keep analytics math in `lib/analytics/` with the test beside the module. Do not
import MUI or page components into `lib/`.

---

## Suite catalog

### `lib/analytics/joseCoefficient.test.ts`

**Protects:** `computeJosesCoefficient` — linear `2.5 × ΔG`; secondaries
`ΔDW/3.5 + ΔPF/150 + 2.5×(ΔPo/4 + 0.4×ΔZap/4)`; Cesar > short-heater on the
docs fixtures; Solid+4 > Luis; null when `G = 0`; formatting.

**Update this test when:** Jose's Coefficient formula/constants change (also
update [docs/joses-coefficient.md](joses-coefficient.md), including the
20-scenario table).

**Do not “fix” the test if:** the Cesar / Pedro / HotWeekend anchors drift.

### `lib/analytics/matchStats.test.ts`

**Protects:** `computeHistoryMatchStatsDelta` — closed matches credit one
seating for every game; open tables credit only sitters for the games they sat.

**Update this test when:** open-table vs closed seating credit changes.

**Do not “fix” the test if:** sit-outs start receiving games they did not play.

### `lib/analytics/stylePoints.test.ts`

**Protects:** biggest/smallest single datas and datas-to-win / datas-to-lose
extrema from real hands. Flavor only — does not change Jose.

**Update this test when:** Style points definitions change (also Stats / History
/ Podium).

**Do not “fix” the test if:** pad hands start counting as datas, or open-table
seats leak across games.

### `lib/analytics/podium.test.ts`

**Protects:** `buildPodium` — glory / grind / shame ranking, rate min-games,
keepsComing eligibility, style higher/lower directions.

**Update this test when:** trophy categories, min-game gates, or style ranking
direction change.

**Do not “fix” the test if:** a winner with L < W appears on Keeps Coming Back.

### `lib/analytics/podiumPunchlines.test.ts`

**Protects:** sticky 24h punchline slots, index clamp, numbered i18n keys.

**Update this test when:** punchline count or TTL changes.

### `lib/analytics/hands.test.ts`

**Protects:** trailing pad-hand stripping and parallel take-order arrays.

**Update this test when:** scorepad pad-hand rules change.

**Do not “fix” the test if:** mid-list zeros start getting stripped.

### `lib/analytics/historyFilters.test.ts`

**Protects:** `matchPassesHistoryFilter` / `matchPassesMatchupFilter` —
presence, relative A/B sides, History vs Compare Any semantics.

**Update this test when:** History or Compare seating filter UX changes.

**Do not “fix” the test if:** partners on opposite notes start matching as the
same side.

### `lib/analytics/matchup.test.ts`

**Protects:** Compare matchup alignment ready-state and This matchup seating
(Any floaters, outsiders when the pool fills the table).

**Update this test when:** Compare “This matchup” rules change.

### `lib/analytics/sessionStats.test.ts`

**Protects:** History “This night” — only seated people, session-only numbers.

**Update this test when:** History session rail seating rules change.

### `lib/analytics/parseExport.test.ts`

**Protects:** Olympus CSV section parse, schema hydrate, public_id / db_meta
backfill.

**Update this test when:** export table order or required columns change. See
[imports-and-datasets.md](imports-and-datasets.md).

### `lib/analytics/playerPublicId.test.ts` / `matchPublicId.test.ts` / `dbMeta.test.ts`

**Protects:** 16-char alphanumeric ids; keep valid CSV ids; regenerate on
collision / invalid / missing.

**Update this test when:** identity alphabet or length changes.

### `lib/analytics/signedDiff.test.ts`

**Protects:** signed net formatting (`+3` / `0` / `-2`), per-hand average,
per-game rate percent.

**Update this test when:** leaderboard / podium net display format changes.

### `lib/analytics/playerVisibility.test.ts`

**Protects:** hidden players stay in the file but drop from leaderboard / pickers.

**Update this test when:** hide/restore roster tools change who is listed.

### `lib/analytics/datasets.test.ts`

**Protects:** dataset registry prune / active fallback when payloads are missing.

**Update this test when:** localStorage dataset keys or switch rules change.

### `lib/analytics/dateRangeFilter.test.ts`

**Protects:** inclusive local YYYY-MM-DD match date filtering.

**Update this test when:** Stats / History date range semantics change.

### `lib/analytics/modeFormat.test.ts`

**Protects:** canonical Mode/Format lists and display mapping (55/28, FFA).

**Update this test when:** tile sets or format labels change.

### `lib/analytics/openTableBoard.test.ts`

**Protects:** open-table player tally / sit-out counting for History.

**Update this test when:** open-table board aggregation changes.

### `lib/analytics/recomputeFromMatches.test.ts` / `repairSave.test.ts` / `dedupeNights.test.ts` / `extractDataset.test.ts`

**Protects:** Tools — rebuild aggregates from matches, repair, fold duplicate
nights, extract a slice.

**Update this test when:** Tools behavior changes on purpose.

### `lib/analytics/compareLaunch.test.ts`

**Protects:** Compare launch payloads from Stats H2H / History seating.

### `lib/analytics/importError.test.ts`

**Protects:** import error codes map to player-facing copy keys.

### `utils/teams.test.ts`

**Protects:** `buildTeams` / `teamsFromRoster` / initials — 2/3/4 players,
partners vs Free For All, pad-hand strip in `teamScoresFromGame`.

**Update this test when:** scorepad seating / partner layout changes.

**Do not “fix” the test if:** seats 1+3 are no longer partners in 2 vs 2.

---

## Not in this layer (yet)

- [ ] Playwright smoke: import CSV → Stats leaderboard → History detail
- [ ] UI tests for drawers / scorepad

When those land, add suite blocks above using the same “Protects / Update when
/ Do not fix” format.
