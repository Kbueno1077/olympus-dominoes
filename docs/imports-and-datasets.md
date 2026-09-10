# Imports & datasets

The mobile app can export SQLite tables as CSV. The web parser
expects Olympus sectioned tables (mobile `EXPORT_TABLES` order):

`db_meta`, `players`, `app_settings`, `matches`, `match_players`, `games`,
`game_players`, `game_team_scores`, `player_stats`, `player_h2h`

See `lib/analytics/parseExport.ts`, `lib/analytics/dbMeta.ts`, and
`lib/analytics/types.ts`.

## `db_meta` (exactly one row, `id = 1`)

| Column | Notes |
|--------|--------|
| `id` | Always `1` |
| `db_identifier` | Stable **16-char** alphanumeric league identity |
| `created_at` / `updated_at` | ISO-8601; `updated_at` bumps only on meaningful writes |
| `schema_version` | Current schema (`25`) |
| `app_version` | Last writer (e.g. `4.5.0`) |
| `label` | Optional display name (often the data-set name) |
| `origin` | `local` \| `imported` \| `web` |

On import: keep a valid `db_identifier` from CSV and set `origin=imported`.
Legacy CSV without `# db_meta` gets a new identifier with `origin=imported`.
Export stays on the mobile app; the web app imports CSV and preserves `db_meta`
so identity round-trips when you re-import on mobile.

## `players` columns

| Column | Notes |
|--------|--------|
| `id` | Local numeric id within the export (not stable across DBs) |
| `name` | Display name |
| `name_key` | `trim(lower(name))` |
| `public_id` | Stable **16-char** alphanumeric (`A–Z a–z 0–9`). Survives renames. Cross-DB identity. |
| `created_at` | ISO timestamp (optional) |
| `is_myself` | `0` / `1` (optional) |
| `is_hidden` | `0` / `1`. Missing on older CSVs → `0`. Hidden rows stay in the file with stats and seats; web pickers and the leaderboard skip them. |

Legacy exports without `public_id` (only `id,name,name_key,created_at,is_myself`) still
import: missing or invalid ids are generated with `crypto.getRandomValues`. When a valid
`public_id` is present it is kept (first duplicate in a file wins; later rows get new ids).
Matching helpers prefer `public_id` over name — see `lib/analytics/playerPublicId.ts` and
`lib/analytics/playerIdentity.ts`.

## `matches` columns

| Column | Notes |
|--------|--------|
| `id` | Local numeric id within the export (not stable across DBs) |
| `title` / `ended_at` / `players_amount` / `mode_label` / `max_points` | Match metadata |
| `public_id` | Stable **16-char** alphanumeric. Cross-DB identity for the same finished match. |

Legacy exports without match `public_id` still import: missing or invalid ids are
generated on parse / load (same rules as players). See `lib/analytics/matchPublicId.ts`
and `lib/analytics/matchIdentity.ts`.

## Storage keys

Datasets live under:

- Registry: `olympus-web-datasets-v1`
- Payloads: `olympus-web-dataset-data-<id>`
- Legacy single slot migrated on first load: `olympus-web-analytics-export-v1`

Stored datasets missing player/match `public_id` or `db_meta` are backfilled on load.
