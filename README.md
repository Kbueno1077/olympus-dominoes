# Olympus Dominoes

Cuban double-nine dominoes scorepad on the web (Next.js / React).
Havana theme, English and Spanish. Live matches stay in the browser via
Recoil + `recoil-persist` (localStorage). Stats, history, and compare read
Olympus exports (CSV) from the mobile app, stored as named datasets in
localStorage.

**Live:** [https://olympus-dominoes.kbueno-studio.com/](https://olympus-dominoes.kbueno-studio.com/)

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
| `npm test` | Unit tests (Vitest, `lib/` + `utils/`) |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | `tsc --noEmit` |

Pull requests and pushes to `master` run typecheck + `npm test`
(`.github/workflows/ci.yml`). See [docs/testing.md](docs/testing.md).

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
docs/                     Team/agent notes (Jose formula, CSV schema, tests)
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

## Docs (team / agents)

Formula, CSV schema, and the test catalog live in [`docs/`](docs/README.md) so
the README stays a how-to-run guide.

| Doc | Contents |
|------|----------|
| [docs/joses-coefficient.md](docs/joses-coefficient.md) | Jose's Coefficient formula, calibration, 20 scenarios |
| [docs/imports-and-datasets.md](docs/imports-and-datasets.md) | Export tables, `db_meta`, dataset storage keys |
| [docs/testing.md](docs/testing.md) | What each unit suite protects |

Keep Jose in sync with `lib/analytics/joseCoefficient.ts` and the mobile app
`olympus-dominoes-app/src/domain/joseCoefficient.ts`.

## Notes

- No account or cloud sync. Match state and imports stay in this browser.
- Clearing site data wipes live matches and datasets.
- Winners / mode labels follow the same language-independent conventions as
  the mobile export where applicable.
- The table drawing accounts for all 55 tiles of a double-nine set.
- Deployed on Vercel from this repo; production URL above.
