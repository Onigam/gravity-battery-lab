# The A3 sheets of the Gravity Battery lab

Eight sheets in `src/drawings/`, generated from `src/three/dims.ts` and `src/sim`, pinned by `src/drawings/drawings.test.ts`. The cartouche of each says « not for construction » (`configureDrawings` in `src/drawings/index.ts`).

| No.    | Sheet             | Group        | What it shows                                                                                                         |
| ------ | ----------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| PL-G01 | `site-plan`       | `site`       | the farm in plan at 1:500, the fall zone, the trench, the buildings, and a section: why the fence has that radius     |
| PL-G02 | `tower-elevation` | `tower`      | elevation at 1:125 with the weight at both ends of the stroke, the chain of levels, the watt-hour ruler; plan at 1:50 |
| PL-G03 | `hoist-layout`    | `tower`      | the hoist in plan, front and side, the maker's dimensions with no mark, our estimates with a star                     |
| PL-G04 | `reeving`         | `tower`      | the four falls, not to scale, the tension of each fall both ways and the speed of each                                |
| PL-G05 | `weight-stack`    | `tower`      | the weight at 1:25: blocks in their layers, carrier, shoes, wedges, plan in the shaft; a shoe on its rail at 1:2      |
| PL-G06 | `drive-train`     | `hoist`      | the gears to scale along the shafts, speeds and torques, where each brake acts                                        |
| PL-G07 | `single-line`     | `power-room` | the single-line diagram with the powers both ways, the safety chain, the lab's addition marked                        |
| PL-G08 | `energy-chain`    | `chart`      | the Sankey of both ways, and the real machines by mass and height with lines of equal energy                          |

**Order.** The kit lists the sheets group by group, in the order `src/lab.ts` gives the groups, so a group must not break the numbers: PL-G03 stands with the tower, whose group is « La tour, son treuil et son poids », and PL-G06 alone in « La transmission ». A test holds the list in number order.

**Numbers.** A length is read from `dims.ts`, a result from `chainAt`, `shaftsAt`, `fallTensions` or `RUNGS`, a figure from `FIG` through `fig()`. The test checks the numbers against those sources, that the rope's power and the losses add up to the meter, that no text falls on another text or off the sheet, and that a kilowatt the model gives carries its star.
