# Data of the Gravity Battery lab (data role)

52 part sheets, two guides, four overviews, the Sources and the lab's interface strings, bilingual `l(fr, en)`, written together. The machine is **generic**: built around published parts, sold by nobody. No person, channel, company or brand is named in a visitor text outside the Sources panel and lesson 6.

## Files

| File                                 | What                                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/data/parts.ts`                  | `PARTS`: the 52 sheets in the order of `docs/research.md` §4, with the dimension rows appended                   |
| `src/data/parts/site.ts`             | 10 sheets of `site`                                                                                              |
| `src/data/parts/tower.ts`            | 15 sheets of `tower`                                                                                             |
| `src/data/parts/hoist.ts`            | 13 sheets of `hoist`                                                                                             |
| `src/data/parts/power-room.ts`       | 14 sheets of `power-room`                                                                                        |
| `src/data/parts/dim-specs.ts`        | every length of a sheet, **read from `src/three/dims.ts`**, nothing typed                                        |
| `src/data/assembly.ts`, `install.ts` | the guides: 20 and 10 steps, explained rather than ready to build. No torque and no duration: no source has any  |
| `src/data/overviews.ts`              | `OVERVIEWS`: title and text per world, for the lead to wire with the `go…` actions                               |
| `src/data/sources.ts`                | `SOURCE_GROUPS`, `MAIN_VIDEO`, and `sourcesPanel(ctx)`, the Sources panel: `about: sourcesPanel` in `src/lab.ts` |
| `src/data/chapters.ts`               | `CHAPTERS` of the main video, `VIDEO_ID` for `video: { id }` in `src/lab.ts`                                     |
| `src/data/figures.ts`                | `FIG`: every figure that is not reported, with its unit and status. Lengths are read from `dims.ts`              |
| `src/data/part-helpers.ts`           | `lf` fills `{placeholders}` with number, unit and mark; `sp`, `maint`, `v`                                       |
| `src/i18n/ui.ts`                     | `LAB_STRINGS`: only the lab's own                                                                                |

## The marks

Same as the simulation panel (`marksLegend`). **No mark**: reported by a source of `docs/research.md`, typed in the text, checked against `REPORTED` in `data.test.ts`, each with its research number. **†**: arithmetic on reported figures. **\***: rests on an estimate of this lab: a model result, an assumption or an estimate. `tagMark` (`src/sim/ladder.ts`, for the panel and the sheets) and `markOf` (`figures.ts`, for the texts) give each status the same mark, and a test holds them together. `lf` adds the mark by construction, so a modelled number cannot lose it; a test catches a number typed by hand with no mark. `figures.test.ts` recomputes each figure from `src/sim`, so a change of the model cannot go unnoticed.

## What the physics changed from the research, and the sheets say

Nothing comes out below **1.90 kW** at the hook, not 1.2 kW. A 100 W fridge **can** be served, at 5 % efficiency, for 2.02 kW at the hook: no text says it cannot. Round trip at full speed **53 %** (40 to 66 %). Standing: 40 W, 0.96 kWh a day, about what the weight holds; over a real day, 7 %. The rope's share of a stroke is 0.36 % in energy; the research's 0.7 % is its mass. The regenerative supply is **our addition**: the reference hoist publishes a chopper and a resistor.

## Said once

The suspended-load notice: the `tower` overview, and the Sources (`safety`). Educational reconstruction: the same two places, and `disclaimer` in the Sources. Law: the Sources (`legal`), and the connection in step 2 of the installation. "Not for construction": the cartouche of the A3 sheets. A test holds these counts. The former site of the liquidated company, now a casino page, is never linked; the Globe Oculaire video is cited as seen, its figures unused; the TEDx talk is out, being about a flywheel.

## Changes from the research's lists

Step 15 of the assembly: the governor stands in the `hoist` world and the safety gear in `tower`, so the governor comes with the overload cell in step 13, and step 15 ties the gear to it. Step 3 of the assembly frames the pad again, on purpose. Durations are dropped.
