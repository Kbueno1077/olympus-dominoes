# Jose's Coefficient

Named for **Jose**, who designed the original ranking idea. It turns one
player’s saved stats (per mode) into a single number for leaderboards.

**Keep in sync** with the mobile app
`olympus-dominoes-app/src/domain/joseCoefficient.ts` and that app’s formula
docs. Web source of truth: `lib/analytics/joseCoefficient.ts`
(`computeJosesCoefficient`, `josesLeadTerm`, `josesSecondaryTerm`,
`JOSES_COEFFICIENT_WEIGHTS`). Schema **25** is this KJ formula (no new columns
vs 24).

## Design goals

- **Games won are principal** — closing the partida is the sport; lead is
  linear `2.5 × ΔG` (`ΔG = W − L`). No curve, no cap.
- **Secondaries are stocks, not rates** — datas, points, pollos, and zapatos
  add the same amount whether they came from 8 games or 80. There is **no**
  `/ max(G, 25)`.
- **Do not** put sample reliability on the lead term (`G/(G+G0)` was tried and
  rejected).

## Inputs (app fields)

| Symbol | Meaning | `player_stats` / delta field |
|--------|---------|------------------------------|
| `G` | Games played | `gamesPlayed` |
| `ΔG` | Net games `W − L` | `gamesWon − gamesLost` |
| `ΔDW` | Datas scored − conceded | `handsFor − handsAgainst` |
| `ΔPF` | Points for − against | `pointsFor − pointsAgainst` |
| `ΔPo` | Pollos given − received | `pollosFor − pollosAgainst` |
| `ΔZap` | Zapatos given − received | `zapatosFor − zapatosAgainst` |

Definitions match the app: a **pollo** is a win where the loser scored
**0** hands; a **zapato** is a win where the loser scored exactly **1** hand.
**Manos (M / `hands_played`)** = all datas played = **MG + MP**.
If `G = 0`, the coefficient is **null** (no ranking yet).

## Lead (`2.5 × ΔG`)

| |ΔG| | Lead |
|-------|------|
| +1 | 2.5 |
| +2 | 5 |
| +4 | 10 |
| +5 | 12.5 |
| +18 | 45 |

Lead depends **only** on net wins. A parked +2 stays at **5** as `G` grows.

## Formula

```text
ΔG = W − L

R = 2.5 × ΔG
  + ΔDW / 3.5 + ΔPF / 150
  + 2.5 × (ΔPo / 4 + 0.4 × ΔZap / 4)
```

## Persistence & UI (web)

- Import and schema-24→25 hydrate recompute `player_stats.joses_coefficient`
  (same idea as mobile `needs_joses_recompute` on 25)
- The UI also recomputes Jose in selectors so leaderboards stay current
- **Sync Jose's Coefficient** on Stats writes the formula back into the
  active dataset
- Leaderboard: sort by `R` desc; show `—` when null
- Modes never mix — leaderboard / compare always filter one `mode_label`

## Calibration rule (humans + agents)

- Must hold: Cesar/Ariel 2nds > HotWeekend 2nds; Cesar > HotWeekend on `R`;
  Solid+4 > Luis; Pedro elite on +18. Same extras score the same R at any `G`.
- After formula changes: update `joseCoefficient.ts` here **and** the mobile
  app, then Sync Jose on imported datasets. Update this file’s 20-scenario
  table and `lib/analytics/joseCoefficient.test.ts`.
- Do **not** reintroduce lead × `G/(G+G0)`, `tanh`, or `/ max(G, 25)` unless
  product asks again.

## Why these multipliers

| Constant | On what | Why that size |
|----------|---------|----------------|
| **2.5 × ΔG** | Net games | Closing is the ranking. No curve. A parked +2 stays at **5**. |
| **ΔDW / 3.5** | Net datas | 3.5 extra datas = 1 R. |
| **ΔPF / 150** | Net points | 150 net points = 1 R. |
| **2.5 × (ΔPo / 4)** | Net pollos | Four pollos = 2.5 R. |
| **0.4 × ΔZap / 4** | Net zapatos | A zapato is 0.4 of a pollo in that term. |

Cuban scoring context for invented examples: games to **150**, typical win
~**170**, ~**30–40** pts/hand; ΔPF/net often ~100–130 (like the CSV export).

## Worked examples (20 scenarios)

CSV rows are real export data. Others are realistic invented seasons.
Sorted by **R**. Columns: **Lead**, **2nds**, **R**, then deltas.

| # | Player | Record | Net | Lead | 2nds | R | ΔDW | ΔPF | ΔPo | ΔZap |
|---|--------|--------|-----|------|------|---|-----|-----|-----|------|
| 1 | Pedro | 24–6–30 | +18 | 45.0 | +31.5 | **76.5** | +56 | +2010 | +3 | +1 |
| 2 | DominantPair | 18–7–25 | +11 | 27.5 | +22.7 | **50.2** | +39 | +1375 | +3 | +2 |
| 3 | Cesar (CSV) | 17–12–29 | +5 | 12.5 | +11.7 | **24.2** | +19 | +609 | +4 | −1 |
| 4 | Ariel (CSV) | 17–12–29 | +5 | 12.5 | +11.7 | **24.2** | +19 | +609 | +4 | −1 |
| 5 | Ana | 18–12–30 | +6 | 15.0 | +5.4 | **20.4** | +9 | +330 | +1 | 0 |
| 6 | HotWeekend | 6–2–8 | +4 | 10.0 | +7.9 | **17.9** | +13 | +490 | +1 | +1 |
| 7 | Grinder100 | 52–48–100 | +4 | 10.0 | +6.3 | **16.3** | +11 | +380 | +1 | 0 |
| 8 | Solid40 | 22–18–40 | +4 | 10.0 | +6.0 | **16.0** | +10 | +380 | +1 | 0 |
| 9 | Maya50 | 27–23–50 | +4 | 10.0 | +6.0 | **16.0** | +10 | +380 | +1 | 0 |
| 10 | Omar80loud | 41–39–80 | +2 | 5.0 | +9.1 | **14.1** | +13 | +455 | +3 | +2 |
| 11 | Luis | 16–14–30 | +2 | 5.0 | +5.8 | **10.8** | +8 | +260 | +2 | +2 |
| 12 | Eliecer (CSV) | 6–4–10 | +2 | 5.0 | +3.4 | **8.4** | +7 | +268 | −1 | +1 |
| 13 | Omar80 | 41–39–80 | +2 | 5.0 | +3.3 | **8.3** | +5 | +190 | +1 | 0 |
| 14 | Quiet+2 | 16–14–30 | +2 | 5.0 | +0.6 | **5.6** | +1 | +40 | 0 | 0 |
| 15 | NearEven | 23–22–45 | +1 | 2.5 | +1.2 | **3.7** | +2 | +95 | 0 | 0 |
| 16 | EvenBlow | 15–15–30 | 0 | 0.0 | +0.9 | **0.9** | 0 | 0 | +1 | +1 |
| 17 | Ugly+4 | 17–13–30 | +4 | 10.0 | −10.4 | **−0.4** | −17 | −600 | −2 | −1 |
| 18 | Comeback | 16–19–35 | −3 | −7.5 | +5.8 | **−1.7** | +12 | +445 | −1 | 0 |
| 19 | Randy (CSV) | 12–17–29 | −5 | −12.5 | −11.7 | **−24.2** | −19 | −609 | −4 | +1 |
| 20 | Guillermo (CSV) | 6–13–19 | −7 | −17.5 | −15.2 | **−32.7** | −26 | −877 | −3 | 0 |

Checks: Cesar 2nds > HotWeekend 2nds; Solid40 > Luis.
Same extras score the same R at any `G` (Solid40 = Maya50).

## Agents / implementers

- Change formula only in `lib/analytics/joseCoefficient.ts` and this file,
  then mirror the mobile app and Sync Jose on datasets.
- Modes never mix. Leaderboard queries one `mode_label`.
- Do not reinvent pollo/zapato; reuse export / match delta rules (0 / 1
  opponent hands).
- DW/DL = datas scored/conceded (`hands_for` / `hands_against`).
- Never divide secondaries by `G` or `max(G, 25)` unless product asks.
