# Scenery of the `site` world

Written by the lead from `src/three/site`, for the reviewer and the film. A flat farmyard, **flat on purpose**: no hill and no lake, so pumped storage is not an option here. No texture file, no model file, no writing, no brand: every map is generated at start-up from a seeded noise lattice, and every size is an estimate of ours (`SITE` in `src/three/dims.ts`, with the research's 36 kWp roof and fence radius as assumptions). The code of the materials, the sky and part of the vegetation comes from Mill Lab (`docs/kit-requests.md` item 16). There is no water world: the `docs/water.md` rule does not apply, and the pumped-storage comparison is a chart. The one thing that is written on in the whole lab is the machine's ruler, because its voice and its sheet say so (`docs/3d.md`).

| File                 | What                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `site/terrain.ts`    | one mesh on a graded grid, 2 m in the yard to 200 m at the horizon. Y = 0 over the whole yard, a few centimetres further out, capped by `SITE.flatHeight` (0.18 m) |
| `site/materials.ts`  | the procedural maps and the shader patches, plain `MeshStandardMaterial`s, so the kit's isolate, ghost and X-ray work as before                                    |
| `site/vegetation.ts` | the placement plan, deterministic, and the instanced plants: each species is one geometry with its colours in the vertices and a per-vertex sway                   |
| `site/buildings.ts`  | the timber barn with its 90 modules on the south slope, and the farmhouse of stone and render, with a clay roof and windows that light up with the evening load    |
| `site/props.ts`      | the fence on its circle, the gate, the mast, the block yard, the trench, the poles and wires, the telehandler, round bales, a log pile, a water trough             |
| `site/sky.ts`        | a Preetham dome, stars at night, sun and moon as one light whose shadow box follows the field, at an equinox and 46° north, a choice of the lab                    |
| `site/scene.ts`      | the calls, the ghost stack, the flows, what follows the state                                                                                                      |

## What is on the land

- **The farm, in place.** Barn at (−58, −38), farmhouse at (47, −38), shed at (−35, 2), block yard at (8, 15), wind mast at (19, −10), the supply's pole at `SITE.pole`, the tower at the origin. The fence has a radius equal to the tower's height, 28 m, an `assumption`: no rule was found (research §7). Everything but the fence, the gate, the mast, the yard and the trench stands outside it (tested).
- **Plants.** Lombardy poplars along the west track, oaks round the yard, apple trees east of the house, hedges along the meadow's edge and the far parcels, tree belts on the far horizon, shrubs in the corners, tufts of grass and wild flowers. None is planted in the fence, on a track or on a building (tested), and the plan keeps them out of the home view's line to the tower. Grass keeps off the yard's hard standing (tested).
- **Crowns.** A crown is hundreds of sprays of leaves, each a card with leaves cut out of one procedural sprite (`spraySprite`), turned around the crown's outward direction and lit as one volume, over a few dark masses that stop the sky showing through: 1,500 on an oak, 760 on a poplar, 440 on an apple tree, fewer on near hedges and shrubs. Far away the sprite's small mipmaps are a soft round blob, so the mass stays. The far hedges and tree belts keep their few lobes: they are never close.
- **Gravel.** The ground's detail map holds packed crushed stone, a stone of 5 to 6 cm in a 2.2 m tile, each with its own tone, the gaps dark, under a softer patch of a coarser scale: no spots, and no grid from afar (tested on the map).
- **Land.** Parcels of wheat, pasture and plough out to the horizon, tracks and yards painted in the vertices of the one mesh, so nothing can fight it for depth.
- **Wires.** The supply comes over the plain on poles to the horizon, drops to a box on the shed's west wall; the roof's cable goes by a pole to the shed; the house's line goes by two poles north of the fence. Every wire ends on an insulator or on its box.

## What follows the simulation

Only these: the sun and the sky with `hour`, the house's windows and light with the evening `load`, the tower's lamp and the shed's bulb at dusk, the gate with `gateOpen`, the mast's cups with `wind`, the ghost stack, the flows. The rest is decoration, including the sway of the plants.

## Weak points

Asked by the review, and answered since: the trees at three distances, the gravel, the telehandler (rounded tyres, rims, a sloping hood, its boom over it on a post, a ram). Not asked again by someone who did not build them.

## Tests

`site/site.test.ts`: the land is level and never rises to a hill, nothing floats or sinks, every plant stands on the land, nothing is planted where it must not be, the fence is the fall zone, the roof is 36 kWp, the cable drawn is the model's 55 m within 7 %, the state drives the weight, the windows, the gate and the ghost.
