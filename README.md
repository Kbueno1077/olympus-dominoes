# Olympus Dominoes

Cuban double-nine dominoes scorepad on the web (Next.js / React).
Havana theme, English and Spanish. Live matches stay in the browser via
Recoil + `recoil-persist` (localStorage). Stats, history, and compare read
Olympus exports (CSV) from the mobile app, stored as named datasets in
localStorage.

**Live:** [https://olympus-dominoes.vercel.app/](https://olympus-dominoes.vercel.app/)

Companion mobile app: `olympus-dominoes-app` (Expo / React Native). Jose's
Coefficient and export table shapes stay aligned across both.

## Prerequisites

- Node 20+ and npm

```bash
npm install
```

## Running it

```bash
npm run dev      # Next.js dev server (http://localhost:3000)
npm run build    # production build
npm start        # serve the production build
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build (`.next`) |
| `npm start` | Serve the production build |

Typecheck (no dedicated script yet):

```bash
npx tsc --noEmit
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Home dashboard — start a match or open stats |
| `/match` | Live scorepad (settings, notes, table draw) |
| `/stats` | Player stats dashboard (leaderboard, KPIs, charts) |
| `/compare` | Multi-player / matchup compare |
| `/history` | Match history list + filters |
| `/history/[matchId]` | Deep link into one imported match |
| `/leaderboard` | Ranking by Jose's Coefficient |
| `/podium` | System AI podium |
| `/merge` | Prototype: merge 2+ data sets into a new one |

Analytics pages share full-bleed chrome (frosted left sidebar + scrollable
main). Import / rename / switch datasets via **Manage data**. Use **Merge** to
union players and matches by stable `public_id` (with conflict review).

## Layout

```
app/                      Next.js App Router (site routes + providers)
modules/
  NewMatch/               Live match shell
  Analytics/              Stats, compare, datasets drawer, charts, chrome
  History/                Imported match list + detail
sections/                 Match UI blocks (settings, note maker, table draw, done)
components/               Header, AppShell, Dashboard, dialogs, DominoTile
lib/analytics/            Export parse, datasets, selectors, Jose, history, compare
recoil/                   Live match atoms (persisted)
i18n/                     EN / ES copy + LanguageProvider
muiTheme/                 Havana palette, type, MUI overrides
hooks/                    Toast, responsive, mount gate for persisted state
utils/                    Match modes, teams, random names
public/                   Static assets
```

### Architecture rules (humans + agents)

Prefer co-location. Keep analytics math free of React UI.

| Concern | Put it in | Do not |
|---------|-----------|--------|
| Export parse, Jose, history filters, matchup stats, dataset I/O | `lib/analytics/` | Import MUI / page components into `lib/` |
| Stats / Compare / History screens | `modules/Analytics`, `modules/History` | Duplicate chrome tokens — use `dashboardChrome.js` |
| Live in-progress match | `recoil/recoilState.js` + `sections/` | Persist finished Olympus exports only in Recoil |
| Named import datasets | `lib/analytics/datasets.ts` (localStorage) | Mix export blobs into Recoil match atoms |
| Copy (EN / ES) | `i18n/translations.js` | Hard-code user-facing strings in modules |
| Theme / AppBar / sidebar frost | `muiTheme/` + shared chrome | Invent a second palette |

**One source of truth:** `lib/analytics/` owns export shapes and ranking math.
UI modules consume selectors / helpers. Jose's formula must stay in sync with
`olympus-dominoes-app/src/domain/joseCoefficient.ts`.

## Features

- **Scorepad** — 2–4 players, modes (e.g. 2 vs 2), datas / points, winner, notes
- **Table draw** — double-nine layout helper while a match is open
- **Stats** — import an Olympus export; leaderboard by Jose's Coefficient;
  per-player KPIs and charts; Sync Jose's Coefficient
- **Compare** — pick players (and optional team sides for matchups); charts + table
- **History** — search / format / roster+side filters; match cards; deep links;
  launch Compare from seating
- **Datasets** — multiple named localStorage slots; switch / rename / delete;
  import CSV export from the mobile app
- **i18n** — English and Spanish (cookie-backed language)

## Jose's Coefficient

Named for **Jose**, who designed the original ranking idea. It turns one
player’s saved stats (per mode) into a single number for leaderboards.

**Keep in sync** with the mobile app README and
`olympus-dominoes-app/src/domain/joseCoefficient.ts`.
Web source of truth: `lib/analytics/joseCoefficient.ts`
(`computeJosesCoefficient`, `josesLeadScore`, `josesSecondaryDenom`,
`JOSES_COEFFICIENT_WEIGHTS`, `JOSES_SECONDARY_MIN_GAMES = 25`).

**Design goals**

- **Games won are principal** — closing the partida is the sport; absolute
  `(W−L)` drives the lead term (soft-capped past ~+20).
- **Small nets stay catchable** — +1 / +2 can still lose to loud secondaries;
  **+4 must beat** a 0-net blowout season even if “ugly”.
- **Secondaries are quiet and volume-floored** — datas / points / pollos /
  zapatos use `max(G, 25)` so an 8-game heater cannot out-rate a real season.
- **Do not** put sample reliability on the lead term (`G/(G+G0)` was tried and
  rejected).

### Inputs

| Symbol | Meaning | Export / view field |
|--------|---------|---------------------|
| `G` | Games played | `gamesPlayed` |
| `W`, `L` | Games won / lost | `gamesWon`, `gamesLost` |
| `DW`, `DL` | Datas scored / conceded | `handsFor` / `handsAgainst` |
| `PF`, `PA` | Points for / against | `pointsFor`, `pointsAgainst` |
| `PolF`, `PolA` | Pollos given / received | `pollosFor`, `pollosAgainst` |
| `ZapF`, `ZapA` | Zapatos given / received | `zapatosFor`, `zapatosAgainst` |

A **pollo** is a win where the loser scored **0** hands; a **zapato** is a
win where the loser scored exactly **1** hand.
**Manos** = all datas played = MG + MP.
If `G = 0`, the coefficient is **null** (no ranking yet).

### Lead bands (absolute `W − L`)

| |Net| | Meaning | `leadScore` ≈ | Lead term (`×1.7`) |
|-------|---------|---------------|---------------------|
| 1–4 | Normal / easy to contest | ~2.5–9 | ~4.2–15.7 |
| 5–10 | Quite a lead | ~11–17 | ~18.9–28.8 |
| 10–20 | Immense | ~17–20 | ~28.8–33.5 |
| >20 | Not believable — curve is flat | ~20 | ~34 |

```text
leadScore(net) = 20 × tanh(net / 8)   # signed
Lead term      = 1.7 × leadScore(W − L)
2nds           = R − Lead
```

Lead depends **only** on net wins. Secondaries use `denom = max(G, 25)`.

### Formula

```text
denom = max(G, 25)

R =
  1.7 × leadScore(W − L)
+   3 × (DW − DL) / denom
+ 0.10 × (PF − PA) / denom
+  10 × (PolF − PolA) / denom
+   4 × (ZapF − ZapA) / denom
```

### Persistence & UI (web)

- Import may include `player_stats.joses_coefficient`; the UI **recomputes**
  Jose in selectors (`toStatsView`) so leaderboards stay correct even when
  the column is missing or stale
- **Sync Jose's Coefficient** on Stats recalculates and writes back into the
  active dataset
- Leaderboard: sort by `R` desc; show `—` when null
- Modes never mix — leaderboard / compare always filter one `mode_label`

### Calibration rule (humans + agents)

- Must hold: Cesar/Ariel 2nds > HotWeekend 2nds; Cesar > HotWeekend on `R`;
  Solid+4 > Luis; ugly +4 > 0-net even; Pedro elite on +18.
- After formula changes: update `joseCoefficient.ts` here **and** the mobile
  app, then Sync Jose on imported datasets.
- Do **not** reintroduce lead × `G/(G+G0)` unless product asks again.

### Why these multipliers

| Constant | On what | Why that size |
|----------|---------|----------------|
| **1.7 × leadScore** | Absolute `W−L` | +4 lead (~15.7) clears weak/negative 2nds; +18 immense. |
| **denom = max(G, 25)** | All secondary rates | Short heater cannot out-rate a longer season on 2nds alone. |
| **3** | `(DW−DL)/denom` | Datas matter; volume-floored. |
| **0.10** | `(PF−PA)/denom` | Points tie-break; volume-floored. |
| **10** | Pollo net / denom | Badge among equals. |
| **4** | Zapato net / denom | Weaker than pollo. |

Cuban scoring context: games to **150**, typical win ~**170**, ~**30–40**
pts/hand; ΔPF/net often ~100–130 (like the CSV export).

### Worked examples (20 scenarios)

Same calibration set as the mobile app. Sorted by **R**.

| # | Player | Record | Net | Lead | 2nds | R | ΔDW | ΔPF | ΔPo | ΔZap |
|---|--------|--------|-----|------|------|---|-----|-----|-----|------|
| 1 | Pedro | 24–6–30 | +18 | 33.3 | +13.4 | **46.7** | +56 | +2010 | +3 | +1 |
| 2 | DominantPair | 18–7–25 | +11 | 29.9 | +11.7 | **41.6** | +39 | +1375 | +3 | +2 |
| 3 | Cesar (CSV) | 17–12–29 | +5 | 18.9 | +5.3 | **24.2** | +19 | +609 | +4 | −1 |
| 4 | Ariel (CSV) | 17–12–29 | +5 | 18.9 | +5.3 | **24.2** | +19 | +609 | +4 | −1 |
| 5 | Ana | 18–12–30 | +6 | 21.6 | +2.3 | **23.9** | +9 | +330 | +1 | 0 |
| 6 | HotWeekend | 6–2–8 | +4 | 15.7 | +4.1 | **19.8** | +13 | +490 | +1 | +1 |
| 7 | Solid40 | 22–18–40 | +4 | 15.7 | +1.9 | **17.7** | +10 | +380 | +1 | 0 |
| 8 | Maya50 | 27–23–50 | +4 | 15.7 | +1.6 | **17.3** | +10 | +380 | +1 | 0 |
| 9 | Grinder100 | 52–48–100 | +4 | 15.7 | +0.8 | **16.5** | +11 | +380 | +1 | 0 |
| 10 | Ugly+4 | 17–13–30 | +4 | 15.7 | −4.5 | **11.2** | −17 | −600 | −2 | −1 |
| 11 | Luis | 16–14–30 | +2 | 8.3 | +2.6 | **10.9** | +8 | +260 | +2 | +2 |
| 12 | Eliecer (CSV) | 6–4–10 | +2 | 8.3 | +1.7 | **10.0** | +7 | +268 | −1 | +1 |
| 13 | Omar80loud | 41–39–80 | +2 | 8.3 | +1.5 | **9.9** | +13 | +455 | +3 | +2 |
| 14 | Omar80 | 41–39–80 | +2 | 8.3 | +0.6 | **8.9** | +5 | +190 | +1 | 0 |
| 15 | Quiet+2 | 16–14–30 | +2 | 8.3 | +0.2 | **8.6** | +1 | +40 | 0 | 0 |
| 16 | NearEven | 23–22–45 | +1 | 4.2 | +0.3 | **4.6** | +2 | +95 | 0 | 0 |
| 17 | EvenBlow | 15–15–30 | 0 | 0.0 | +0.5 | **0.5** | 0 | 0 | +1 | +1 |
| 18 | Comeback | 16–19–35 | −3 | −12.2 | +2.0 | **−10.2** | +12 | +445 | −1 | 0 |
| 19 | Randy (CSV) | 12–17–29 | −5 | −18.9 | −5.3 | **−24.2** | −19 | −609 | −4 | +1 |
| 20 | Guillermo (CSV) | 6–13–19 | −7 | −23.9 | −7.8 | **−31.8** | −26 | −877 | −3 | 0 |

Checks: Cesar 2nds > HotWeekend 2nds; Ugly+4 > EvenBlow; Solid40 > Luis.

### Agents / implementers

- Change formula only in `lib/analytics/joseCoefficient.ts` + this README
  section, then mirror the mobile app and Sync Jose on datasets.
- Modes never mix. Leaderboard queries one `mode_label`.
- Do not reinvent pollo/zapato; reuse export / match delta rules (0 / 1
  opponent hands).
- DW/DL = datas scored/conceded (`hands_for` / `hands_against`).

## Imports & datasets

The mobile app can export SQLite tables as CSV. The web parser
expects Olympus sectioned tables (mobile `EXPORT_TABLES` order):

`db_meta`, `players`, `app_settings`, `matches`, `match_players`, `games`,
`game_team_scores`, `player_stats`, `player_h2h`

See `lib/analytics/parseExport.ts`, `lib/analytics/dbMeta.ts`, and
`lib/analytics/types.ts`.

### `db_meta` (exactly one row, `id = 1`)

| Column | Notes |
|--------|--------|
| `id` | Always `1` |
| `db_identifier` | Stable **16-char** alphanumeric league identity |
| `created_at` / `updated_at` | ISO-8601; `updated_at` bumps only on meaningful writes |
| `schema_version` | Current schema (`17`) |
| `app_version` | Last writer (e.g. `4.4.1`) |
| `label` | Optional display name (often the data-set name) |
| `origin` | `local` \| `imported` \| `web` |

On import: keep a valid `db_identifier` from CSV and set `origin=imported`.
Legacy CSV without `# db_meta` gets a new identifier with `origin=imported`.
Export stays on the mobile app; the web app imports CSV and preserves `db_meta`
so identity round-trips when you re-import on mobile.

### `players` columns

| Column | Notes |
|--------|--------|
| `id` | Local numeric id within the export (not stable across DBs) |
| `name` | Display name |
| `name_key` | `trim(lower(name))` |
| `public_id` | Stable **16-char** alphanumeric (`A–Z a–z 0–9`). Survives renames. Cross-DB identity. |
| `created_at` | ISO timestamp (optional) |
| `is_myself` | `0` / `1` (optional) |

Legacy exports without `public_id` (only `id,name,name_key,created_at,is_myself`) still
import: missing or invalid ids are generated with `crypto.getRandomValues`. When a valid
`public_id` is present it is kept (first duplicate in a file wins; later rows get new ids).
Matching helpers prefer `public_id` over name — see `lib/analytics/playerPublicId.ts` and
`lib/analytics/playerIdentity.ts`.

### `matches` columns

| Column | Notes |
|--------|--------|
| `id` | Local numeric id within the export (not stable across DBs) |
| `title` / `ended_at` / `players_amount` / `mode_label` / `max_points` | Match metadata |
| `public_id` | Stable **16-char** alphanumeric. Cross-DB identity for the same finished match. |

Legacy exports without match `public_id` still import: missing or invalid ids are
generated on parse / load (same rules as players). See `lib/analytics/matchPublicId.ts`
and `lib/analytics/matchIdentity.ts`.

Datasets live under:

- Registry: `olympus-web-datasets-v1`
- Payloads: `olympus-web-dataset-data-<id>`
- Legacy single slot migrated on first load: `olympus-web-analytics-export-v1`

Stored datasets missing player/match `public_id` or `db_meta` are backfilled on load.
## Notes

- No account or cloud sync. Match state and imports stay in this browser.
- Clearing site data wipes live matches and datasets.
- Winners / mode labels follow the same language-independent conventions as
  the mobile export where applicable.
- The table drawing accounts for all 55 tiles of a double-nine set.
- Deployed on Vercel from this repo; production URL above.
