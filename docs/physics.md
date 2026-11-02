# Physics of the Gravity Battery lab

The simulation in `src/sim` (pure TypeScript, no DOM, no three.js, runs in Node under vitest). It models a generic small-site gravity store on a
flat farm: a 20 t weight, a 20 m stroke, four falls of rope, a variable-speed 15 kW hoist, a regenerative drive on 400 V (research §0, K6 to K18).
E = m·g·h is one line. The rest of the model is where the energy goes on its way to the weight and back: guides, sheaves, drum, gears, motor, cable,
inverter, supply, fan, brakes, controls. Every efficiency here is an **outcome** of that chain, not a figure typed in.

Words for the status of a number: **reported** (stated in a source of `docs/research.md`, K- or S-number), **derived** (computed from reported
figures, the computation is next to it), **assumption** (a choice of ours), **estimate** (the sources are silent: a guess with its reasoning, labelled
so in `machine.ts`), **model** (what the equations give), **calibrated** (an estimate chosen so that the model retrieves a figure). **There is no
calibrated constant in this model.** The rated point of the motor is fitted to its data sheet (K10, K12), which is a parameterisation, not a tuning.

**The model was not tuned to any efficiency.** It gives **0.53 round trip at full speed** where the makers claim 0.75 to 0.90, and **nothing below
1.9 kW at the hook** where the research estimated 1.2 kW. §6 lists every figure, §7 says why, and how far each answer can move.

Files: `machine.ts` (every constant, and a hoist of any size), `reeving.ts` (rope and falls), `chain.ts` (**the energy chain at one instant, and the
inverse problems**), `store.ts` (**the integrator**: modes, control, the farm's bus, thermal, a fall), `engine.ts` (`GravitySim implements LabSim`, the
scenarios' script, the cached curves, a simulated day), `energy.ts` (E = m·g·h arithmetic), `night.ts` (tonnes for a night), `lfp.ts` (the module and its
inverter, with the kit's `ocv`), `day.ts` (sun and house), `ladder.ts` (real machines), `comparator.ts` (tower, module, lake, the race, money, carbon,
dated facts), `diy.ts` (the courtyard machine), `sensitivity.ts` (both ends of what the model can say), `mech.ts` (from Mill Lab, see
`docs/kit-requests.md`), `presets.ts`, `types.ts`. Tests next to the code; `src/panels/model.ts` holds what the panel plots, as plain functions.

**Where the dimensions live.** `machine.ts` exports the dimensions the physics needs (stroke, blocks, stack, rope, drum, tower height) and `src/three/dims.ts` imports them, as Mill Lab's does from its `src/sim`. Nothing is retyped.

## 1. The model

All SI. g = 9.81 m/s² (the kit's `G`). Sign: v > 0 raises. `meter` > 0 is power taken from the farm, `meter` < 0 is power given back. A loss is ≥ 0.

### 1.1 Energy (`energy.ts`)

E = m·g·h. So 1 kWh = 1 t × 366.97 m (K1), and per kilogram g·h/3600, whatever the mass (K4). The rope counts too: the drum takes in all the rope hanging at
that moment, `n·ρ·L(z)`, as S6 eq. 15 counts it at its longest: 137 kg at the bottom of the stroke, 5 kg at the top, 0.36 % of the energy of a
stroke (K14's 0.69 % is its mass, not its energy). Gross figures (K7) count the load alone.

### 1.2 Reeving (`reeving.ts`)

Four falls, three sheaves: drum, hook block, return sheave, hook block, anchor. Going up, the fall on the drum carries the most: T₁ = F / Σηᵏ. Going
down it carries the least: T₁ = F / Ση⁻ᵏ, k = 0 … n−1, η = 0.98 (assumption, research §5.2). That is 0.9704 up and 0.9699 down, and it gives K13's 49 kN and 6.4 before
friction, 51 kN and 6.1 with it. Guides: a force of 1 % of the weight against the motion (assumption; S6 eq. 15 takes 2.5 % for a whole mine conveyance, sheave
included, as a figure for sizing a rope). Wind adds its drag × 1 % to the guides' force: at the stop, 0.005 % of the hook's power.

### 1.3 Drum and gears (`chain.ts`, `machine.ts`)

ω_drum = n·v / r; the gear ratio brings the motor's rated speed to the rated hook speed: 2,900 rpm at 4 m/min gives **188:1** with a drum of 0.33 m (research §3 says 170 to
205 for 0.30 to 0.36 m). **The motor's torque depends only on v_rated / ω_rated, so the unknown drum changes no energy**, only the speeds of the shafts (test).

Three helical stages (`stagesNeeded`, at most 6.3 each), η = 0.98 per mesh (estimate). Mesh loss follows the torque and the direction of the power. Back-driven, η_b = 2 − 1/η
(the friction-proportional-to-load result of a screw, which also makes a stage of η ≤ 0.5 self-locking): 0.9796, so a good helical train barely minds. Drag follows the speed and
always costs: no-load 1 % of the rated power at the rated speed (assumption, 0.5 to 2 % usual), 40 % of it a constant torque, 60 % viscous. Drum bearings 0.995 (estimate).

Starting friction at the motor shaft: twice the running Coulomb torque of gearbox and motor, 0.73 N·m, 1.5 % of rated (estimate). A load starts down alone if its torque through sheaves and gears
beats it (K50).

### 1.4 The motor: why the losses do not leave with the speed

The rated point is K10: 15 kW, 2,900 rpm, 28 A, cos φ 0.82, with η = 0.921 from the IE3 table (IEC 60034-30-1 as tabulated on Wikipedia, "Premium efficiency"), inside K12's 0.91 to 0.94. The rated loss
`L = P(1/η − 1)` = 1.29 kW splits as stator 36 %, rotor 22 %, stray 7 %, iron 25 %, windage 10 % (assumption, the usual split of a 4-pole induction motor of this size). Then, with x = T/T_rated:

- stator copper: `0.36 L (sin²φ + cos²φ x²)`. **The sin²φ is the flux current: it comes from K10's cos φ and stays while the machine is magnetised.**
- rotor and stray: `(0.22 + 0.07) L x²`.
- iron: `0.25 L (0.6 w + 0.4 w²)`, w = speed / rated speed.
- windage: `0.10 L (0.4 w + 0.6 w²)`.

At a torque that is set by the weight and not by the speed, copper does not fall with the speed and iron and windage do. Above the base speed the flux falls as 1/w (the extended range of K8). The motor
reproduces K10: at the catalogue's point it runs at 98 % of rated torque and 27.7 A against K10's 28 A at 100 %.

The rotor's inertia counts in the torque: J = 0.1 kg·m² (estimate), T_rotor = J·α, α = a·n·i/r. See K53.

### 1.5 Cable, inverter, supply, auxiliaries

- **Motor cable**: 55 m (shed, trench, tower) of 10 mm² (estimates), one phase being half of the kit's `cableResistance`: 3·I²·R. A larger machine keeps the same share of its power (estimate).
- **Inverter**: rated loss 3 % of the input (K47's assumption). It splits as 20 % fixed, 50 % in the current, 30 % in its square (assumption). **It carries the motor's current at any speed**, so
  this loss, like the copper, stays at low speed: 416 W at the cut-in. The research's first estimate did not count it.
- **Regenerative supply**: rated loss 3 % of the input, 30 % fixed (it circulates current in its filter), 40 % in the power, 30 % in its square (assumption).
- **Auxiliaries while moving**: fan 100 W (estimate; S9 says forced ventilation is standard on the 4-pole motors, without the power), service brake 69 W (K16, a reference brake, the hoist's own is unknown), drum
  brake 150 W (estimate), controls 40 W (estimate, 15 to 80 W).
- **Standing, not moving**: asleep (contactor open), the controls alone: **40 W**. Ready to answer in a second, the fixed losses of inverter and supply as well: **284 W**. The drive sleeps after 60 s idle and takes 15 s to wake (both ours).

A loss scale for other sizes: drive 0.96 at 1.5 kW to 0.98 from 150 kW, fan and brakes as P^0.7, controls as P^0.3, rotor inertia as P^1.2, motor from the same IE3 table. All **estimates**: the presets other than the farm are this
machine's structure at another size, nothing more.

### 1.6 Dynamics and control (`store.ts`)

Speed follows a ramp, `a = v_rated / 2 s` (S7 eq. 12; S9 gives 1.5 s as the shortest). A speed is limited near the end of the stroke by `√(2·a·room)`. A step that finishes the stroke spends the rest of itself holding, so
the energy does not depend on the size of the step (test at ×1, ×60, ×600).

Control: `hold`; `raise` at a speed; `lower` at a power at the hook; `load` follows a steady load; `day` follows the sun and the house. Without a buffer the machine follows the load, however badly. With a buffer the battery
follows the load, and the tower bursts into it when the state of charge falls to 30 %, until 90 % or the bottom: at `load + 50 A × V` per module (K31's recommended current). The sun's surplus goes to the battery first, then to the
tower: at full speed once there is enough sun (default), or crawling on whatever there is.

Interlocks: gate open, wind above the stop (2 m/s of hysteresis), grid lost, overload (more than 1.1 × rated, or a torque over 1.6 × rated). Grid lost: no supply to send to, the link's power goes to the chopper during the ramp, then the
brakes; the DC link goes to 750 V and bleeds with a time constant of 90 s (estimates). The control UPS keeps the controls off the meter.

Thermal: first order, τ = 30 min (estimate). K10's 70 % duty is used directly: the alarm is at 105 K (class F) and the loss at rated continuous gives 105 / 0.7 = 150 K, so the duty is what the rating allows.

A fall (a shaft breaks, scenario 8): the rope goes slack, the load falls at g(1 − μ), the governor trips at 0.3 m/s (assumption), 50 ms later the wedges bite at 0.5 g (assumption, inside the 0.2–1 g of a progressive lift gear). It runs at 1 ms steps, in
real time at most, slowed by the slow motion, whatever the clock. Without safety gear it reaches the buffer: √(2·g·h·0.99).

### 1.7 The battery (`lfp.ts`)

The module of K31, with the kit's `ocv` for the volts. Resistance 0.02 Ω (estimate: it gives 96 % at 50 A, the "≥ 95 %" of retail pages, K31 to check). The inverter costs 20 W to be on and 4 % of the power (estimates). So the module returns 87 % at
its recommended 2.5 kW through its inverter, and a fridge's 100 W pays 20 W of idle: a battery has its own part-load loss, and the model shows it.

### 1.8 The courtyard (`diy.ts`)

The gear motor of K29 as a DC machine: k = 12 V / 620 rpm, R = 1 Ω (estimate), 0.2 N·m to turn it backwards (estimate), printed stages at 0.85 (estimate) with the same back-driven law, a pulley at 0.9, a roller of 3 cm (estimate), `generatorAt` and `matchSpeed`
from `mech.ts`. Its figures are a plausibility, not a retrieval: K30 lists what the video does not give.

### 1.9 Comparators (`comparator.ts`, `ladder.ts`, `night.ts`)

Three sides of one table, each number tagged. Money and carbon are ranges of orders of magnitude (research Q8). `nightNeed`: gross mass from E = m·g·h, then the only path that makes sense for a night's small load: the tower in bursts into a battery, the battery following the
house. `raceLanes`: one load, one tower, one module, and the tower's mass of water up K34's 294 m at the square root of the sources' middle round trip (estimate).

## 2. Parameters

All through `GravitySim.set`, clamped by `rangeFor`. The ranges of the farm are in `presets.ts`:

| Parameter                        | Range                                           | Default            | Status                                              |
| -------------------------------- | ----------------------------------------------- | ------------------ | --------------------------------------------------- |
| `mass` (kg)                      | 200 to 20,000 (research 2–20 t, opened for K50) | 20,000             | reported as a rating (K6), assumption as our choice |
| `stroke` (m)                     | 1 to 20                                         | 20                 | reported as an option (K6)                          |
| `falls`                          | 1, 2, 4                                         | 4                  | reported (K6)                                       |
| `motorKw`                        | 5 to 22, the ratio and the top speed follow     | 15                 | reported (K10) at 15; the rest scaled, estimate     |
| `raiseSpeed` (m/min)             | 0.08 to 6                                       | 4                  | reported (K8)                                       |
| `lowerPower` (W at the hook)     | 50 to 13,080, floored at the hoist's lowest     | 13,080             | derived (K8)                                        |
| `loadPower` (W)                  | 50 to 13,000                                    | 1,000              | assumption                                          |
| `modules`, `buffer`              | 1 to 4, on/off                                  | 1, off             | K31; assumption                                     |
| `nightKwh`                       | 1 to 7                                          | 3                  | assumption (K43: no source)                         |
| `pvKw`                           | 0 to 36                                         | 36                 | assumption (research §3)                            |
| `wind`, `windStop` (m/s)         | 0–30, 10–25                                     | 4, 18              | assumption (research §5)                            |
| `sleepWhenIdle`, `waitForSun`    | on/off                                          | on, on             | assumption                                          |
| `gateOpen`, `grid`, `safetyGear` | on/off                                          | closed, on, fitted |                                                     |
| `ladderTonnes`, `ladderHeight`   | 0.01–100 t, 1–2,000 m, on log sliders           | 1 t, 367 m         | a calculator (K1), apart from the machine           |

## 3. Constants and what drives the results

One file, `machine.ts`, with the status in a comment by each. Those that move an answer, with the effect of each alone on the farm (nominal: round trip 0.533, cut-in 1,902 W at the hook):

| Assumption, nominal                           | Range tried    | Round trip      | Cut-in at the hook |
| --------------------------------------------- | -------------- | --------------- | ------------------ |
| Inverter and supply, each 0.97 at rated (K47) | 0.96 to 0.98   | −0.023 / +0.024 | +218 / −218 W      |
| Motor's rated η, 0.921 (K12)                  | 0.91 to 0.94   | −0.015 / +0.026 | +118 / −194 W      |
| Gear mesh per stage, 0.98                     | 0.97 to 0.985  | −0.034 / +0.017 | +18 / −8 W         |
| Sheave, 0.98                                  | 0.97 to 0.99   | −0.017 / +0.017 | +8 / −8 W          |
| Guides, 1 % of the weight                     | 0.5 to 2.5 %   | +0.006 / −0.016 | −3 / +8 W          |
| Gearbox no-load, 1 %                          | 0.5 to 2 %     | +0.006 / −0.013 | −2 / +3 W          |
| Fan and drum brake, 100 and 150 W             | 60–80, 150–300 | +0.010 / −0.017 | −128 / +232 W      |
| Motor cable, 55 m of 10 mm²                   | × 0.6 to × 1.5 | +0.006 / −0.008 | −77 / +96 W        |
| Controls, 40 W                                | 15 to 80 W     | +0.002 / −0.003 | −29 / +46 W        |

**The drive and the motor set the cut-in; the gears and the rope set the round trip at full speed.** All at their kind or unkind end at once (`sensitivity.ts`, two ends rather than two likely machines):

| Answer                         | Unkind     | Nominal        | Kind       | Research's estimate       |
| ------------------------------ | ---------- | -------------- | ---------- | ------------------------- |
| Round trip at full speed       | 0.40       | **0.53**       | 0.66       | 0.55 to 0.68              |
| One way down                   | 0.60       | **0.72**       | 0.81       | 0.74 to 0.82 (chain only) |
| A stroke delivers              | 658 Wh     | **780 Wh**     | 878 Wh     | 800 to 900 Wh             |
| Nothing out below, at the hook | 2.69 kW    | **1.90 kW**    | 1.26 kW    | 1.2 kW                    |
| Same, speed                    | 0.82 m/min | **0.58 m/min** | 0.38 m/min | 0.37 m/min                |
| Comes down alone from          | 645 kg     | **374 kg**     | 219 kg     | no estimate               |

**An open choice: the drum's pitch diameter.** The maker's page reads the rope force 517 mm from the frame's front and the drum's axis 695 mm from it (S9 p. 1/55): 178 mm of radius, **0.356 m** (`HOIST.drawnPitchRadius` in `dims.ts`, the 3D role's reading of the drawing). `machine.ts` takes **0.33 m**, the research's middle (0.30 to 0.36 m, §3). It changes no energy (§1.3, tested), only the shafts: at 0.356 m the drum turns at 14.3 instead of 15.4 tr/min, and the ratio is 203:1 instead of 188:1, still inside the research's 170 to 205. No sheet contradicts 0.33: PL-G03 and PL-G06 print Ø330\* as our estimate, and neither prints the 517 or the 695. The value stays until someone chooses; moving it means `FARM_DRUM_DIAMETER`, the teeth of `GEARS`, and the sheets' speeds.

## 4. What the 3D and the data roles read

`GravitySim.state`, every field documented with its unit in `types.ts`. **The 3D needs:** `zFraction` (use it rather than `z`: a preset may have another stroke than the tower drawn), `fallLength` (one fall of rope, m), `blocks` and `halves` (how many of the stack to show), `drumAngle`,
`sheaveAngle`, `motorAngle` (already capped for the eye and scaled by the clock and the slow motion), `motorBlur` (the real speed is past what the eye reads: show the blur disc), `brakeReleased`, `safetyGearSet`, `mode`, `flowDirection` (1 towards the machine, −1 back, for the power room's flows), `chopperPower`,
`dcVolts`, `soc`, `pv`, `load`, `hour` (the site's light and its windows), `ghostTonnes`, `ghostTowers`, `ghostBlocks`, `ghostVolume` (the ghost stack: 0 when the load is too light ever to pay back, show none), `wind`, `gateOpen` and `grid` in `params`. `GravitySim.spec.kind` says whether it is a machine at all: `'energy'` presets (lamp, Rudong, Nant de Drance) do
not move, and `state.zFraction` stays at 1 for them.

**`shaftsAt(spec, mass)` in `chain.ts`** gives the speed and the torque at each shaft (hook force, rope, drum, each gear stage, motor) for the drive-train sheet, and the torque labels of the `hoist` world. `reeving.ts` gives the tension at each fall for the reeving sheet (`staticTension`, `reevingSumUp`). `comparator.ts` and `ladder.ts` give the
lessons their figures and dated facts; `RUNGS[i].note` is bilingual.

**Lessons** can open on `applyScenario(id)` with the ten ids of §5.

## 5. Presets and scenarios

**Presets**, `presets.ts`: `farm` (default, opens at noon, weight at the bottom, sun high: it climbs at once) · `garden` (1 t, 6 m, 1.5 kW) · `diy` (46 kg, courtyard) · `gravitylight`, `rudong`, `nant` (energy only: no model of their machines, as the research plans) · `leith` (50 t, 15 m, 337 kW) · `swiss` (34.1 t, 42 m, 269 kW) · `shaft` (500 t, 500 m, 2.8 MW). For Leith, Swiss and the shaft the falls and drum are ours, and the drive is the farm's scaled: estimates.

**Scenarios**, each teaching one thing:

| Id              | What happens                                                                        | What the model shows                                                                             |
| --------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `sunny-day`     | A day at ×600: the roof lifts it in the morning, the house spends it in the evening | 2.0 kWh in by evening, 0.17 kWh out: the house is a poor customer for this machine               |
| `kettle`        | Full speed at the real clock, a 2 kW kettle on                                      | 9.4 kW at the meter for 5 minutes: 4.7 kettles, then nothing                                     |
| `fridge-direct` | Power at the hook asked from 262 W upwards                                          | The meter pays 1.44 kW at first, crosses zero at 1.9 kW, gives back above it                     |
| `fridge-buffer` | 100 W from the battery, the tower bursting into it, at ×600                         | One burst of about 13 minutes at 2.6 kW; about 430 Wh reach the fridge, 8 times the direct 54 Wh |
| `night`         | The night grows from 1 to 7 kWh                                                     | The ghost stack from 2.5 to 14 towers                                                            |
| `too-light`     | Blocks come off on the way down                                                     | First it stops paying, then it stops coming down by itself                                       |
| `blackout`      | The grid goes at full speed down                                                    | Chopper on the ramp, a few Wh burnt, brakes; the link stays charged                              |
| `overspeed`     | A shaft breaks at full speed, seen at 1/20                                          | Governor, wedges: 0.79 m/s, 9.5 cm, under half a second                                          |
| `wind-stop`     | The wind rises past the stop and falls                                              | It stops, and starts again only 2 m/s under the stop                                             |
| `race`          | The same 1 kW from the tower, a module, the same mass of water at 294 m             | 21 minutes, 4.3 hours, 14 hours                                                                  |

## 6. Key figures → tests → results

"Retrieved" means the arithmetic or the model gives the source's figure. Tests: `src/sim/figures.test.ts` (K1 to K46 and the sources checked), `src/sim/chain.test.ts` (K47 to K53), `src/sim/engine.test.ts` (the same through the integrator, the scenarios).

### Retrieved

| K                  | Figure                                                                               | Model                                   | Note                                                              |
| ------------------ | ------------------------------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------- |
| K1                 | 1 kWh = 1 t × 366.97 m                                                               | 366.97 m                                |                                                                   |
| K2                 | 10 MWh: 36,697 t at 100 m, 1,835 t at 2,000 m                                        | same                                    |                                                                   |
| K3                 | 1,000 t at 2,000 m: 5.4 MWh                                                          | 5.45 MWh                                | the source truncates                                              |
| K4                 | 0.0545 Wh/kg, 120 Wh/kg, ratio 2,200                                                 | 0.0545, 120, 2,202                      |                                                                   |
| K6–K9              | 20 t, 20 m, 262 W to 13.08 kW, 5 min, 4.2 h                                          | same                                    |                                                                   |
| K7                 | 1.09 kWh, 3.92 MJ                                                                    | same                                    |                                                                   |
| K10                | 15 kW, 28 A, cos φ 0.82                                                              | 27.7 A at 98 % of rated torque          | the catalogue's point loads the motor just under its rating       |
| K11                | motor to hook ≥ 0.872                                                                | 0.8875, shaft 14.74 kW < 15 kW          | consistent: a chain below 0.872 would have broken the catalogue   |
| K12                | 0.91 to 0.94                                                                         | 0.921 taken from IE3                    |                                                                   |
| K13                | 49 kN, factor 6.4                                                                    | same; 6.13 with friction, at the bottom | still above the maker's 5                                         |
| K14                | 84 m, 138 kg                                                                         | 84 m, 137.8 kg                          |                                                                   |
| K15, K16, K17, K18 | hoist, brake, block, stack                                                           | used as given                           | 16.8 t + 3.2 t; 1.6 × 1.6 × 2.8 m                                 |
| K19, K20           | Leith's arithmetic                                                                   | 2.04 kWh, 29 s, 8.4 m, 1.14 kWh, 294 kW |                                                                   |
| K21                | Swiss test's arithmetic                                                              | 34.1 t, 94.7 %, 79.5 %, 75.3 %, 186 kW  | the arithmetic only; see below for the model                      |
| K23–K28            | Rudong, its mass, the Midlands (4 % of Nant de Drance), the rail, the lamp (33–41 %) | same                                    | K26: its 75,000 t is another configuration: 134 MWh on that slope |
| K29                | 1:27; 12 kg stalls                                                                   | stalls for every roller from 1 to 8 cm  | with the estimate of the gear motor's friction                    |
| K31–K34            | the module, 4.4 towers, Nant de Drance, 294 m, CHF 100/kWh                           | same                                    |                                                                   |
| K35–K41            | claims, costs, status                                                                | held as data, with tags and dates       | K38 retrieved exactly: $294 and $14.68/kWh                        |
| K42–K46            | fridge, 128 t, kettle, carbon, tower's cost                                          | same                                    | ranges only                                                       |
| K53                | 1 + P/(m·g²·τ) = 1.007                                                               | 1.0068                                  | but see below: the formula forgets the rotor                      |
| S1, S2, S5, S6     | the sources checked                                                                  | S2's "9.6 MJ" is 34.3 MJ                |                                                                   |

### Not retrieved, or found by the model with no target

| K                      | What the sources or the research say                                                                        | What the model finds                                                                                                                                                                                                                                                              | Why, and what would change it                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **K47**                | estimate 0.55 to 0.68; makers 0.75 to 0.90 (K35)                                                            | **0.533** (0.40 to 0.66)                                                                                                                                                                                                                                                          | The research's chain left out the fan, the brakes, the controls and the cable: without them the model gives 0.77 × 0.76 = **0.58**, inside the estimate. **Below every claim of K35, as the research expected**: a small geared machine, part-rated, with a drive a hundred times smaller than the plants that make the claims. The same structure at 300 kW gives 0.66, at 1.5 kW 0.39                               |
| **K21**                | ~75 % round trip, 95 % up, 79.5 % down                                                                      | **0.66** round trip, 0.81 up, 0.81 down                                                                                                                                                                                                                                           | The way down agrees (0.81 against 0.795). The way up does not (0.81 against 0.95); the research already found that asymmetry strange in a machine with one chain. No primary report exists. A 34 t machine with fewer stages or a direct drive would close part of the gap. Not forced                                                                                                                                |
| **K20**                | 250 kW from 294 kW, η ≈ 0.85                                                                                | **238 kW**, 0.81                                                                                                                                                                                                                                                                  | 5 % low, with falls, drum and stages of ours, and "250 kW" may be rated rather than measured. Same structure, not tuned                                                                                                                                                                                                                                                                                               |
| **K48**                | "should rise, peak, and fall at full load" (research); "relatively constant above 20 % of rated power" (S7) | **At 20 t it rises all the way to the top speed**: 72 % down. The peak exists just beyond what the hoist is allowed at 20 t, near 5.2 m/min, and it falls past that                                                                                                               | Copper and inverter do not grow with the speed at a fixed torque; only iron, windage and drag do, and they catch up only past the rating. **S7's "constant" is refuted for this size**: at 20 % of rated power the way down gives 23 %, at 60 % about 90 % of its best. S7 writes about megawatts                                                                                                                     |
| **K49**                | estimate: nothing below 1.2 kW, 0.37 m/min; "a 100 W fridge cannot be served directly"                      | **Nothing below 1.90 kW, 0.58 m/min** (1.26 to 2.69 kW). **And a 100 W fridge can be served, at a price**: 2.02 kW at the hook, 5 % efficiency, the stroke gone in 32 minutes for 54 Wh                                                                                           | At the cut-in: copper 569 W, inverter 416 W, auxiliaries 359 W, gears and rope 205 W, cable 167 W, supply 153 W. The estimate had 0.9 kW of copper at full torque; the torque going down is 78 % of rated, so copper is 0.57 kW, but the inverter, the cable and the supply were not counted. **The lessons should say "below 1.9 kW it gives nothing, and 100 W costs 2 kW at the hook", not "it cannot be served"** |
| **K49, smaller motor** | "a smaller motor and a larger ratio lower K49, at the price of top speed"                                   | 5 kW: 0.88 kW, 1.33 m/min. **Agreed, and at a price not listed**: round trip 0.44 instead of 0.53                                                                                                                                                                                 | A smaller machine has a worse motor, four stages and the same fixed draws                                                                                                                                                                                                                                                                                                                                             |
| **K50**                | no target; S1 stalls at 12 kg at 1:27                                                                       | **374 kg** on the tower (219 to 645). 36.5 kg in the courtyard with a 3 cm roller, so 12 kg stalls                                                                                                                                                                                | Never the tower's problem in service: the empty carrier is 3.2 t. **It stops paying long before it stops moving**: at 4 m/min, below 2.7 t. S1's cure in the model: more stages make the stall worse, the bigger roller is what helped                                                                                                                                                                                |
| **K51**                | K43: 128 t gross for 7 kWh                                                                                  | **287 t, 14.3 towers, 103 m³ of concrete** through bursts and a battery; 179 t and 9 towers at full speed with no battery, a load no house asks. 1 kWh: 50 t, 2.5 towers. 3 kWh: 128 t, 6.4 towers                                                                                | The tower's bursts at 50 A run at 0.52 down, the battery's path at 0.71 to 0.86. Two modules let it burst faster: fewer tonnes                                                                                                                                                                                                                                                                                        |
| **K52**                | estimate 0.8 to 0.9 kWh                                                                                     | **780 Wh** (658 to 878)                                                                                                                                                                                                                                                           | Just under. The same reasons as K47                                                                                                                                                                                                                                                                                                                                                                                   |
| **K53**                | 1.007: "acceleration costs almost nothing" (S7, S6)                                                         | **In energy, right: 1.3 Wh per start, given back. In torque, wrong for a geared machine**: through 188:1 and four falls the rotor is worth 2,075 t at the hook, a hundred times the load, and a 1 s ramp asks 1.63 × the torque, past what the drive has. S9's 1.5 s minimum fits | S7 and S6 write about direct or low-ratio machines. The 0.1 kg·m² is an estimate: double it and the 2 s ramp reaches the drive's limit                                                                                                                                                                                                                                                                                |
| **K5**                 | 0.2–3.1 kWh/m³ in a shaft; pumped 0.133–0.5                                                                 | Tower 0.128 kWh/m³ of concrete, under the range; Nant de Drance 0.80, **above** S6's pumped range                                                                                                                                                                                 | S6's range stops at a head of about 183 m                                                                                                                                                                                                                                                                                                                                                                             |
| **K30**                | no power in the video; two 5 W bulbs by eye                                                                 | 3.1 W at 46 kg, 6.8 cm/s, 10 % down, 23 % up, **2 % round trip**                                                                                                                                                                                                                  | Estimates throughout, a plausibility. The bulbs would be dim: not a contradiction, there is no figure to contradict                                                                                                                                                                                                                                                                                                   |

**Found by the model, in no source: standing losses.** Asleep, 40 W: **0.96 kWh a day, about what the weight holds**. Ready, 284 W: 6.8 kWh a day, six times. So a real day of the farm (`simulateDay`, a 3 kWh night):

| Day                                                         | In       | Out      | Of which standby | Out / in |
| ----------------------------------------------------------- | -------- | -------- | ---------------- | -------- |
| Direct to the house, drive asleep                           | 2.43 kWh | 0.17 kWh | 0.94 kWh         | **7 %**  |
| With one module (the night is served, mostly by the module) | 2.43 kWh | 0.56 kWh | 0.95 kWh         | **23 %** |
| Direct, drive kept ready                                    | 8.15 kWh | 0.17 kWh | 6.66 kWh         | **2 %**  |

These are the machine's own books; the module's are not free either (20 W of idle), but it shares them over 4.4 times the energy.

## 7. Findings

1. **E = m·g·h is the easy part, and the lab's lesson is everywhere else**, as the plan said: below 15 % of its rated power the machine pays to come down. The sharpest limit of the small machine is that one, then its standing draw, then the energy itself.
2. **The round trip is a good number to quote carefully.** 0.53 at full speed, 7 % over a real day. Both are the same machine.
3. **Scale, not physics, is what the claims of K35 hide.** The same loss structure gives 0.39 at 1.5 kW, 0.53 at 15 kW and 0.66 at 300 kW, with nothing else changed.
4. **The reference hoist's published control has a chopper and a resistor** (S9, "integrated brake chopper and external brake resistor"), not a regenerative supply. The lab's decision to fit one is ours, and the machine is impossible without it. It changes no number, but the sheet of the power room should say that this part is added, not catalogue.
5. **The fridge's 100 W is a running draw.** K42's fridge averages 20 to 40 W over a day: one stroke through the battery is under a day of one fridge.

## 8. Known limits of the model

- **Nothing in any source measures a machine this small.** Every efficiency is the product of assumptions, each reasonable, none tested on this machine. §3 gives their range.
- No structure: the tower is not designed, its sway and its wind load on the steel are not modelled; the wind only stops the machine and adds to the guides' friction.
- No rope stretch, no slack-rope dynamics, no block swing, no temperature of the oil (the drag is a warm gearbox's), no cold start, no wear.
- The motor is a steady-state loss model, not a machine in two axes: no slip, no flux dynamics. The voltage of the DC link is two levels and a decay, for the power room.
- Only one sun and one night: an equinox, clear (the roof sets only the charging power, §1.6); the house's profile is an assumption (K43).
- The presets other than the farm are this machine's structure at another size. The shaft's up and down figures also carry its 82 t of rope, so only its round trip is meaningful.
- The race's water has no drive of its own to pay for, unlike the tower; a farm could not have a share of an Alpine plant. It shows the height, and only that.
- A hoist of group M5 is not sold for storage (research §3): its daily run time is not the limit here (a stroke twice a day is 10 minutes), but its life at this duty is not modelled.

## 9. Assumptions the owner may wish to confirm

The drum at 0.33 m against the 0.356 m the maker's drawing implies (§3) · standing 40 W asleep, 284 W ready (no source; drive sleeping by default) · inverter and supply at 0.97 each (K47's assumption) · 0.98 per sheave and per gear mesh · 1 % of the weight in the guides · 15 s to wake · a bursting rule of 30 to 90 % on one module at 50 A · a 3 kWh night by default · the day's "wait for enough sun" by default (it is the kindest: crawling costs more).

## 10. Sources read for the physics

`docs/research.md` §1 (S1, S6 to S13, S19, S24), its private copies of S6 (pages on the piston force and on rope sizing: eq. 10, 14 to 16, the 2.5 % and 10 %) and S9 (p. 1/13–1/15: forced ventilation, brake, 1.5 s minimum ramp, chopper). IEC 60034-30-1's IE3 table as tabulated at <https://en.wikipedia.org/wiki/Premium_efficiency> (0.75, 1.5, 15, 90 and 200 kW, 4 poles, 50 Hz); the standard itself was not read. The loss split of §1.4, the drive's fixed shares and the governor's figures are from general practice, not from a page read for this lab, and are marked as assumptions or estimates in `machine.ts`.
