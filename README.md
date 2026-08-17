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
(`computeJosesCoefficient`, `josesGamesTerm`, `josesSecondaryDenom`,
`JOSES_COEFFICIENT_WEIGHTS`, `JOSES_SECONDARY_MIN_GAMES = 25`).

**Design goals**

- **Games won are principal** — closing the partida is the sport; absolute
  `(W−L)` is linear `3n` (not tanh-capped, not divided by `G`).
- **Small nets stay catchable** — +1 / +2 can still lose to loud secondaries.
  On this formula an **ugly +4 can lose** to a loud +2 (Luis) or a 0-net farm.
- **Secondaries are rates, volume-floored** — datas / points / pollos /
  zapatos use `max(G, 25)` so an 8-game heater cannot out-rate a real season.
- **Never** put a top cap on denom (that lets point stocks eat `n`).
- **Do not** put sample reliability on the lead term (`G/(G+G0)` was tried and
  rejected). Tanh lead (lab A) is previous, not current.

### Inputs

| Symbol | Meaning | Export / view field |
|--------|---------|---------------------|
| `G` | Games played | `gamesPlayed` |
| `W`, `L` | Games won / lost | `gamesWon`, `gamesLost` |
| `n` | `W − L` | |
| `DW`, `DL` | Datas scored / conceded | `handsFor` / `handsAgainst` |
| `PF`, `PA` | Points for / against | `pointsFor`, `pointsAgainst` |
| `PolF`, `PolA` | Pollos given / received | `pollosFor` / `pollosAgainst` |
| `ZapF`, `ZapA` | Zapatos given / received | `zapatosFor` / `zapatosAgainst` |

A **pollo** is a win where the loser scored **0** hands; a **zapato** is a
win where the loser scored exactly **1** hand.
**Manos** = all datas played = MG + MP.
If `G = 0`, the coefficient is **null** (no ranking yet).

### Lead term (absolute `W − L`)

Linear: `3n`. No soft cap — a +18 is +54 from games alone.

| |n| | Meaning | `3n` |
|-------|---------|------|
| 1–4 | Normal / contestable | 3–12 |
| 5–10 | Quite a lead | 15–30 |
| 10–20 | Huge | 30–60 |
| >20 | Keeps growing | 3n |

```text
kn             = 3 × (W − L)
2nds           = R − kn
denom          = max(G, 25)
```

Lead depends **only** on net wins. Secondaries use `denom = max(G, 25)`.

### Formula

```text
denom = max(G, 25)

R =
  3 × (W − L)
+ 6.25 × (DW − DL) / denom
+ 0.15 × (PF − PA) / denom
+  15  × (PolF − PolA) / denom
+   6  × (ZapF − ZapA) / denom
```

Cesar (CSV) at stock: kn +15.0, datas +4.1, pts +3.2, pollos +2.1, zap −0.2
→ **R ≈ +24.1**. Randy is Cesar’s mirror (−24.1).

### Persistence & UI (web)

- Import may include `player_stats.joses_coefficient`; the UI **recomputes**
  Jose in selectors (`toStatsView`) so leaderboards stay correct even when
  the column is missing or stale
- **Sync Jose's Coefficient** on Stats recalculates and writes back into the
  active dataset
- Leaderboard: sort by `R` desc; show `—` when null
- Modes never mix — leaderboard / compare always filter one `mode_label`

### Calibration rule (humans + agents)

- Must hold at defaults: Cesar R ≈ +24.1; Cesar kn ≈ 3.7× datas and datas >
  points; Ugly+4 can lose to Luis; test Ugly+4 loses to loud EvenBlow;
  no denom cap.
- After formula changes: update `joseCoefficient.ts` here **and** the mobile
  app, then Sync Jose on imported datasets.
- Do **not** reintroduce lead × `G/(G+G0)` or tanh unless product asks again.

### Why these multipliers

| Constant | On what | Why that size |
|----------|---------|----------------|
| **3 × n** | Absolute `W−L` | Cesar +5 → +15 games; extras stay a minority. |
| **denom = max(G, 25)** | All secondary rates | Short heater cannot out-rate a longer season on extras alone. |
| **6.25** | `(DW−DL)/denom` | Datas still the main secondary; Cesar datas ~+4.1. At G=25, 1 ΔG = 12 datas. |
| **0.15** | `(PF−PA)/denom` | Points tie-break; Cesar pts ~+3.2, still under datas. At G=25, 1 ΔG = 500 pts. |
| **15** | Pollo net / denom | 5 pollos = 1 ΔG at the floor. Cesar pollos ~+2.1. |
| **6** | Zapato net / denom | Pollos stay 2.5× zapatos (15 / 6). At G=25, 1 ΔG = 12.5 zapatos. |

Cuban scoring context: games to **150**, typical win ~**170**, ~**30–40**
pts/hand; ΔPF/net often ~100–130 (like the CSV export).

### Worked examples (20 scenarios)

Same calibration set as the lab. Sorted by **R**. kn = `3n`. 2nds = `R − kn`.

| # | Player | Record | Net | kn | 2nds | R | ΔDW | ΔPF | ΔPo | ΔZap |
|---|--------|--------|-----|----|------|---|-----|-----|-----|------|
| 1 | Pedro | 24–6–30 | +18 | 54.0 | +23.4 | **77.4** | +56 | +2010 | +3 | +1 |
| 2 | DominantPair | 18–7–25 | +11 | 33.0 | +20.3 | **53.3** | +39 | +1375 | +3 | +2 |
| 3 | Cesar (CSV) | 17–12–29 | +5 | 15.0 | +9.1 | **24.1** | +19 | +609 | +4 | −1 |
| 4 | Ariel (CSV) | 17–12–29 | +5 | 15.0 | +9.1 | **24.1** | +19 | +609 | +4 | −1 |
| 5 | Ana | 18–12–30 | +6 | 18.0 | +4.0 | **22.0** | +9 | +330 | +1 | 0 |
| 6 | HotWeekend | 6–2–8 | +4 | 12.0 | +7.0 | **19.0** | +13 | +490 | +1 | +1 |
| 7 | Solid40 | 22–18–40 | +4 | 12.0 | +3.4 | **15.4** | +10 | +380 | +1 | 0 |
| 8 | Maya50 | 27–23–50 | +4 | 12.0 | +2.7 | **14.7** | +10 | +380 | +1 | 0 |
| 9 | Grinder100 | 52–48–100 | +4 | 12.0 | +1.4 | **13.4** | +11 | +380 | +1 | 0 |
| 10 | Luis | 16–14–30 | +2 | 6.0 | +4.4 | **10.4** | +8 | +260 | +2 | +2 |
| 11 | Eliecer (CSV) | 6–4–10 | +2 | 6.0 | +3.0 | **9.0** | +7 | +268 | −1 | +1 |
| 12 | Omar80loud | 41–39–80 | +2 | 6.0 | +2.6 | **8.6** | +13 | +455 | +3 | +2 |
| 13 | Omar80 | 41–39–80 | +2 | 6.0 | +0.9 | **6.9** | +5 | +190 | +1 | 0 |
| 14 | Quiet+2 | 16–14–30 | +2 | 6.0 | +0.4 | **6.4** | +1 | +40 | 0 | 0 |
| 15 | Ugly+4 | 17–13–30 | +4 | 12.0 | −7.7 | **4.3** | −17 | −600 | −2 | −1 |
| 16 | NearEven | 23–22–45 | +1 | 3.0 | +0.6 | **3.6** | +2 | +95 | 0 | 0 |
| 17 | EvenBlow | 15–15–30 | 0 | 0.0 | +0.7 | **0.7** | 0 | 0 | +1 | +1 |
| 18 | Comeback | 16–19–35 | −3 | −9.0 | +3.6 | **−5.4** | +12 | +445 | −1 | 0 |
| 19 | Randy (CSV) | 12–17–29 | −5 | −15.0 | −9.1 | **−24.1** | −19 | −609 | −4 | +1 |
| 20 | Guillermo (CSV) | 6–13–19 | −7 | −21.0 | −13.6 | **−34.6** | −26 | −877 | −3 | 0 |

Checks: Cesar R ≈ +24.1; Ugly+4 < Luis; Solid40 > Luis; Randy = −Cesar.

### Agents / implementers

- Change formula only in `lib/analytics/joseCoefficient.ts` + this README
  section, then mirror the mobile app and Sync Jose on datasets.
- Modes never mix. Leaderboard queries one `mode_label`.
- Do not reinvent pollo/zapato; reuse export / match delta rules (0 / 1
  opponent hands).
- DW/DL = datas scored/conceded (`hands_for` / `hands_against`).
- Never add a top cap on `denom`.

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
| `app_version` | Last writer (e.g. `4.5.0`) |
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
