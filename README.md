# Olympus Dominoes

Cuban double-nine dominoes on the web: a scorepad, a bot table, and analytics
for mobile exports. Havana theme, English and Spanish.

**Live:** [https://olympus-dominoes.kbueno-studio.com/](https://olympus-dominoes.kbueno-studio.com/)

Companion mobile app: `olympus-dominoes-app` (Expo / React Native). Jose's
Coefficient and export table shapes stay aligned across both. iOS is on the
[App Store](https://apps.apple.com/us/app/olympus-dominoes/id6799737142);
Android Play listing is not live yet.

## Stack

| | |
|--|--|
| App | Next.js 16 (App Router; Turbopack in `next dev`) |
| UI | React 19, MUI 5, Havana theme (`muiTheme/`). Tailwind utilities with preflight off so CssBaseline owns the base layer |
| Live match | Zustand persist (`localStorage` key `olympus-match`). First load copies a leftover Recoil `recoil-persist` blob if present |
| Analytics | CSV datasets in `localStorage` (`olympus-web-datasets-v1` + per-slot payloads) |
| Tests | Vitest |
| Deploy | Vercel. GitHub Actions runs typecheck + tests on PRs and `master` |

## Prerequisites

- Node 20+ and npm (CI uses Node 22)

```bash
npm install
```

`.npmrc` sets `legacy-peer-deps=true` so MUI 5 can install next to React 19.

## Running it

```bash
npm run dev      # http://localhost:3000
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
| `/` | Home — play with bots, score notepad, store / site links |
| `/play` | Full table vs bots (setup + dealt table) |
| `/match` | Live score notepad (settings, notes, table draw) |
| `/stats` | Player stats dashboard (leaderboard, KPIs, charts) |
| `/compare` | Multi-player / matchup compare |
| `/history` | Match history list + filters |
| `/history/[matchId]` | Deep link into one imported match |
| `/leaderboard` | Ranking by Jose's Coefficient |
| `/podium` | System AI podium |
| `/tools` | Password-gated Tools (dataset ops + **Live watch** monitor). `/merge` redirects here |
| `/watch/[id]` | Read-only live scoreboard (phone-published relay) |
| `/f-lab` | Password-gated Jose formula lab (open in local `next dev`) |
| `/how-to-use` | How the pad and exports fit together |
| `/changelog` | In-app release notes |
| `/privacy` | Privacy policy |

Local live-watch setup: see the phone repo `docs/live-watch.md`.
Production shares live in Upstash Redis (`UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN`, or the `KV_REST_API_*` aliases). Without those,
Vercel lambdas cannot list or update the same live match.

`/tools` and `/f-lab` are gated in production (`MERGE_PASSWORD`,
`F_LAB_PASSWORD`). Local `next dev` skips the gate.

Analytics pages share full-bleed chrome (frosted left sidebar + scrollable
main). Import / rename / switch datasets via **Manage data**. Use **Merge** on
Tools to union players and matches by stable `public_id` (with conflict review).

In-app navigation uses React 19 `<ViewTransition>` plus Next
`transitionTypes` (`nav-forward` / `nav-back`) so the site header stays put.

## Layout

```
app/                      App Router — root layout, providers, (site) pages, live-watch API
modules/
  NewMatch/               Live notepad shell
  Play/                   Bot table (setup, seats, chain, scorepad)
  Analytics/              Stats, compare, datasets drawer, charts, Tools chrome
  History/                Imported match list + detail
  LiveWatch/              Watcher scoreboard + Tools monitor
  JoseLab/                F-lab sliders, charts, mock/CSV benches
  HowToUse/               How-to page
  DevGate/                Password forms for Tools / F-lab
sections/                 Notepad UI blocks (settings, note maker, table draw, done)
components/               Header, AppShell, home Dashboard, page transition, dialogs, tiles
lib/
  matchStore.ts           Zustand live-match store + Recoil persist migration
  analytics/              Export parse, datasets, selectors, Jose, history, compare
  play/                   Bot engine, tiles, chain layout (no React)
  liveWatch/              Relay types, store, HTTP helpers
  joseLab/                Formula compute + lab fixtures
  devGate/                Cookie / env gates
  navTransition.ts        Path rank + forward/back transition types
  muiEmotionCache.tsx     Emotion SSR cache (styles in <head>)
docs/                     Team/agent notes (Jose formula, CSV schema, tests)
i18n/                     EN / ES copy + LanguageProvider
muiTheme/                 Havana palette, type, MUI overrides
hooks/                    Toast, responsive, mount gate for persisted state
utils/                    Match modes, teams, random names, domino sets
public/                   Favicon, sample CSVs under examples/
.github/workflows/        CI (typecheck + Vitest)
```

Imports use `@/*` from the repo root (`tsconfig` paths).

### Architecture rules (humans + agents)

Prefer co-location. Keep analytics and play math free of React UI.

| Concern | Put it in | Do not |
|---------|-----------|--------|
| Export parse, Jose, history filters, matchup stats, dataset I/O | `lib/analytics/` | Import MUI / page components into `lib/` |
| Bot rules, tiles, chain geometry | `lib/play/` | Put deal / legal-move logic in `modules/Play` |
| Stats / Compare / History screens | `modules/Analytics`, `modules/History` | Duplicate chrome tokens — use `dashboardChrome.js` |
| Live in-progress notepad | `lib/matchStore.ts` + `sections/` | Persist finished Olympus exports in the match store |
| Named import datasets | `lib/analytics/datasets.ts` (localStorage) | Mix export blobs into match-store fields |
| Copy (EN / ES) | `i18n/translations.js` | Hard-code user-facing strings in modules |
| Theme / AppBar / sidebar frost | `muiTheme/` + shared chrome | Invent a second palette |

**One source of truth:** `lib/analytics/` owns export shapes and ranking math.
UI modules consume selectors / helpers. Jose's formula must stay in sync with
`olympus-dominoes-app/src/domain/joseCoefficient.ts`.

## Features

- **Score notepad** — 2–4 players, modes (e.g. 2 vs 2), datas / points, winner, notes
- **Play with bots** — deal a Cuban table in the browser (`/play`)
- **Table draw** — double-nine layout helper while a notepad match is open
- **Stats** — import an Olympus export; leaderboard by Jose's Coefficient;
  per-player KPIs and charts; Sync Jose's Coefficient
- **Compare** — pick players (and optional team sides for matchups); charts + table
- **History** — search / format / roster+side filters; match cards; deep links;
  launch Compare from seating
- **Datasets** — multiple named localStorage slots; switch / rename / delete;
  import CSV export from the mobile app
- **Live watch** — phone publishes a match; `/watch/[id]` is the spectator board
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

- No account or cloud sync for scorepads or datasets. Live-watch relay is the
  exception (Redis).
- Clearing site data wipes the notepad (`olympus-match`) and imported datasets.
- Winners / mode labels follow the same language-independent conventions as
  the mobile export where applicable.
- The table drawing accounts for all 55 tiles of a double-nine set.
- Deployed on Vercel from this repo; production URL above.
