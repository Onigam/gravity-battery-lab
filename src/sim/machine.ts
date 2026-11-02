import { cableResistance } from '@onigam/lab-kit/sim/electric';
import { G } from '@onigam/lab-kit/sim/hydraulic';
import { stagesNeeded } from './mech';

// Every constant of the machine, in one file, with its status (docs/physics.md §3):
//   reported (Kn, Sn)    stated in a source of docs/research.md
//   derived              computed from reported figures, the computation is given
//   assumption           a choice of ours
//   estimate             the sources are silent: a guess with its reasoning
// Nothing here is calibrated to bring the model to a published efficiency. `src/three/dims.ts`, when it exists, imports the
// dimensions below (stroke, blocks, rope, drum) rather than retyping them, as Mill Lab's does.

export { G };

// ------------------------------------------------------------------------------------------------ the farm machine, as published

/** Load at the hook, kg, and stroke, m (K6: S9, SHF 6050-16, 4/1, L4). */
export const FARM_MASS = 20000;
export const FARM_STROKE = 20;
/** Falls of the rope (K6). */
export const FARM_FALLS = 4;
/** Rated speed at 20 t, m/s (K8: 4 m/min). */
export const FARM_V_RATED = 4 / 60;
/** The published range is 0.08 to 4 m/min (K8): the lowest speed is 1/50 of the rated one. */
export const SPEED_RANGE = 50;
/** Extended range at part load (K8: up to 6 m/min, so 1.5 times the rated speed). */
export const EXTENDED_RANGE = 1.5;
/** Motor (K10: 15 kW, 4 poles, 100 Hz, 28 A at 380–415 V, cos φ 0.82, 70 % duty). */
export const FARM_MOTOR_W = 15000;
export const MOTOR_VOLTS = 400;
export const MOTOR_AMPS = 28;
export const MOTOR_COS_PHI = 0.82;
/** Rated speed of the motor, rpm (research §3: 4 poles at 100 Hz, "about 2,900 rpm"). */
export const MOTOR_RPM = 2900;
/** Hook power over motor power in the catalogue (K11: 13.08 / 15). Used to size the other machines. */
export const CATALOGUE_RATIO = (FARM_MASS * G * FARM_V_RATED) / FARM_MOTOR_W;

/** Rope (K13: Ø 20 mm, Fmin 315 kN; S10: 1.64 kg/m for a generic 20 mm rope). */
export const ROPE_DIAMETER = 0.02;
export const ROPE_FMIN = 315000;
export const ROPE_MASS_PER_M = 1.64;
/** Factor the maker states as a minimum (K13: ≥ 5). */
export const ROPE_FACTOR_MIN = 5;
/** Minimum distance hook to hoist, m (S9 p. 1/55: C = 0.83 m at 4/1). Sets the length of the falls at the top of the stroke. */
export const HOOK_APPROACH = 0.83;
/** Turns kept on the drum, as rope, m (K14: 84 m in all with 4 × 20 m). */
export const ROPE_ON_DRUM = 4;
/** Hoist mass, kg (K15). Not moved: it loads the head frame, not the store. */
export const HOIST_MASS = 1321;

/** Drum pitch diameter, m. **Estimate**: research §3 gives 0.30 to 0.36; only the speeds of the shafts depend on it (§1.3). */
export const FARM_DRUM_DIAMETER = 0.33;

/** The stack (K17, K18). Sizes reported by the block maker, weights by a mould maker, indicative. */
export const BLOCK = { length: 1.6, width: 0.8, height: 0.8, mass: 2400 } as const;
export const HALF_BLOCK = { length: 1.6, width: 0.8, height: 0.4, mass: 1200 } as const;
export const STACK_BLOCKS = 6;
export const STACK_HALVES = 2;
/** The stack's face to the wind and its height, m (K18: 1.6 × 1.6 × 2.8 m). */
export const STACK_WIDTH = BLOCK.length;
export const STACK_HEIGHT = (STACK_BLOCKS / 2) * BLOCK.height + (STACK_HALVES / 2) * HALF_BLOCK.height;
/** Carrier, lifting beam and hook block, kg: the remainder of the 20 t once the stack is counted (K18, assumption). */
export const CARRIER_MASS = FARM_MASS - STACK_BLOCKS * BLOCK.mass - STACK_HALVES * HALF_BLOCK.mass;

/** The tower, m (research §3, an estimate: no maker, structure not designed). */
export const TOWER_HEIGHT = 28;

// ------------------------------------------------------------------------------------------------ the losses: all assumptions or estimates

/** Efficiency of one sheave. **Assumption** (research §5.2; EN 13001-3-2 has the formula, not read). */
export const SHEAVE_EFFICIENCY = 0.98;
/** Friction of the shoes in the guides, as a share of the weight. **Assumption**: S6 eq. 15 takes 2.5 % for a whole mine conveyance, sheave included. */
export const GUIDE_FRICTION = 0.01;
/** Rope drum bearings, per direction. **Estimate**. */
export const DRUM_BEARING = 0.995;

/** Largest ratio of one gear stage. **Estimate** (usual helical practice). */
export const STAGE_RATIO_MAX = 6.3;
/** Efficiency of one helical mesh at load. **Estimate** (usual helical practice: 0.97 to 0.99). */
export const GEAR_STAGE_ETA = 0.98;
/** Gearbox drag with no load, as a share of the rated power at the rated speed. **Assumption**: 0.5 to 2 % is usual. */
export const GEAR_NO_LOAD = 0.01;
/** Share of that drag that is a constant torque (bearings, seals); the rest grows with the speed (oil). **Estimate**. */
export const GEAR_COULOMB_SHARE = 0.4;
/** Static friction over running friction. **Estimate**: a greased or oiled contact starts about twice as hard as it runs. */
export const BREAKAWAY_FACTOR = 2;

/**
 * Efficiency of a meshing stage run backwards, from the forward one: η_b = 2 − 1/η (a friction proportional to the load, the
 * textbook result for a screw, which makes a stage of η ≤ 0.5 self-locking).
 */
export const backDriven = (eta: number): number => Math.max(0, 2 - 1 / eta);

/**
 * IE3 nominal efficiency, 4 poles, 50 Hz (IEC 60034-30-1 as tabulated on Wikipedia, "Premium efficiency"), at the five points read.
 * 15 kW gives 0.921, inside the 0.91–0.94 that K12 reads off the rating table.
 */
const IE3: readonly [number, number][] = [
  [750, 0.825],
  [1500, 0.853],
  [15000, 0.921],
  [90000, 0.952],
  [200000, 0.96],
];

/** Log-linear interpolation in a table of (power, value), flat outside. */
function logLerp(table: readonly [number, number][], w: number): number {
  if (w <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (w <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      return y0 + ((y1 - y0) * Math.log(w / x0)) / Math.log(x1 / x0);
    }
  }
  return table[table.length - 1][1];
}

export const motorEfficiency = (w: number): number => logLerp(IE3, w);

/** Share of the motor's rated losses in each place. **Assumption**, the usual split of a 4-pole induction motor of this size. */
export const MOTOR_LOSS_SHARE = { stator: 0.36, rotor: 0.22, stray: 0.07, iron: 0.25, windage: 0.1 } as const;
/** Share of the iron loss that follows the frequency (hysteresis); the rest follows its square (eddy currents). **Estimate**. */
export const IRON_HYSTERESIS = 0.6;
/** Rotor and brake inertia, kg·m². **Estimate**: a 15 kW 4-pole frame with its brake; scaled as P^1.2 for the other sizes. */
export const FARM_ROTOR_INERTIA = 0.1;
/** Shortest ramp the maker offers, s (S9 p. 1/14: "approx. 1.5 sec"). */
export const RAMP_MIN = 1.5;
/** Ramp in use, s. **Assumption**: the shortest allowed (the 1 s of K53 would ask for 1.6 times the rated torque). */
export const RAMP_TIME = 2;
/** Torque the drive can give for a few seconds, over the rated one. **Estimate**: the maker's "high overload capacity" (S9 p. 1/14). */
export const OVERLOAD_TORQUE = 1.6;

/** Rated efficiency of the inverter and of the regenerative supply (K47's assumption at 15 kW; 0.96 at 1.5 kW and 0.98 from 150 kW, estimates). */
const DRIVE_ETA: readonly [number, number][] = [
  [1500, 0.96],
  [15000, 0.97],
  [150000, 0.98],
];
export const driveEfficiency = (w: number): number => logLerp(DRIVE_ETA, w);
/** How the rated loss of the inverter splits: fixed, in the current, in its square. **Assumption**. */
export const INVERTER_LOSS_SHARE = { fixed: 0.2, linear: 0.5, square: 0.3 } as const;
/** The same for the regenerative supply, which also circulates current in its filter. **Assumption**. */
export const SUPPLY_LOSS_SHARE = { fixed: 0.3, linear: 0.4, square: 0.3 } as const;

/** Forced-ventilation fan at 15 kW, W. **Estimate** (S9 p. 1/13: standard on the 4-pole motors; power not given). */
export const FARM_FAN_W = 100;
/** Service brake coil, released, W (K16: a reference brake of 100 N·m draws about 69 W; the hoist's own is unknown). */
export const FARM_BRAKE_W = 69;
/** Drum brake, released, W. **Estimate**: load side, about 150 times the torque of the service brake, with an economised holding current. */
export const FARM_DRUM_BRAKE_W = 150;
/** Controls that never sleep (safety controller, encoder, wind mast, meter, control UPS), W. **Estimate**, range 15 to 80 W. */
export const CONTROLS_W = 40;
/** Time for the drive to wake (precharge the link, close the contactor, check the brakes), s. **Estimate**. */
export const WAKE_TIME = 15;
/** Idle time before the drive sleeps, s. **Assumption**. */
export const SLEEP_AFTER = 60;

/** Motor cable: from the shed along the trench and up the tower. Length m and section mm², **estimates**. */
export const FARM_CABLE_LENGTH = 55;
export const FARM_CABLE_SECTION = 10;
/** Resistance of one phase, Ω: half of the kit's loop resistance. */
export const FARM_CABLE_OHMS = cableResistance(FARM_CABLE_LENGTH, FARM_CABLE_SECTION) / 2;

/** The alarm at class F's rise, K. **Estimate** of the class; the rating's 70 % duty (K10) then means 105 / 0.7 = 150 K if run for ever at the rated loss. */
export const MOTOR_RISE_ALARM = 105;
export const MOTOR_DUTY = 0.7;
export const MOTOR_RISE_CONTINUOUS = MOTOR_RISE_ALARM / MOTOR_DUTY;
/** Thermal time constant of the motor, s. **Estimate** for this frame size. */
export const MOTOR_THERMAL_TAU = 1800;

// ------------------------------------------------------------------------------------------------ safety

/** Governor tripping speed, m/s. **Assumption**: above any working speed, with a margin a mechanical governor can hold. */
export const GOVERNOR_TRIP = 0.3;
/** Delay before the wedges bite, s. **Estimate**. */
export const GEAR_DELAY = 0.05;
/** Mean deceleration of the safety gear, m/s². **Assumption**: 0.5 g, inside the 0.2 to 1 g of a progressive lift gear. */
export const GEAR_DECEL = 0.5 * G;
/** Drag coefficient of a block stack. **Estimate**. */
export const STACK_CD = 1.2;
/** The hysteresis of the wind stop, m/s. **Assumption**. */
export const WIND_HYSTERESIS = 2;
/** Height of the DC link, V (research §4: about 600 V, estimate) and where the chopper starts, V (estimate). */
export const DC_LINK_V = 600;
export const CHOPPER_V = 750;
/** How long the DC link stays charged after the power goes, s. **Estimate**. */
export const DC_BLEED_TAU = 90;

// ------------------------------------------------------------------------------------------------ a hoist of any size

export interface HoistSpec {
  kind: 'hoist';
  massRated: number;
  stroke: number;
  falls: number;
  drumDiameter: number;
  sheaveEta: number;
  guideFriction: number;
  drumBearing: number;
  vRated: number;
  vMin: number;
  rampTime: number;
  ropeMassPerM: number;
  ropeFmin: number;
  // motor
  motorW: number;
  motorRpm: number;
  motorEta: number;
  cosPhi: number;
  motorAmps: number;
  rotorInertia: number;
  // gears
  ratio: number;
  stages: number;
  gearEtaForward: number;
  gearEtaBack: number;
  gearDragCoulomb: number;
  gearDragViscous: number;
  /** Torque at the motor shaft that the load must exceed to start the train turning backwards, N·m. */
  breakawayTorque: number;
  // electrics
  inverterLossRated: number;
  supplyLossRated: number;
  /** Fan, both brakes, W: drawn only while the machine moves. */
  fanW: number;
  brakesW: number;
  controlsW: number;
  /** Resistance of one phase of the motor cable, Ω. */
  cablePhaseOhms: number;
}

export interface HoistDesign {
  massRated: number;
  stroke: number;
  falls: number;
  drumDiameter: number;
  /** Either the motor is given and the rated speed follows, or the speed is given and the motor follows. */
  motorW?: number;
  vRated?: number;
}

/** The assumptions that drive the results, gathered so that they can be moved together (sensitivity.ts). */
export interface Assumptions {
  sheaveEta: number;
  guideFriction: number;
  stageEta: number;
  gearNoLoad: number;
  /** Motor's rated efficiency, or the IE3 table at its power if not given. */
  motorEta?: number;
  /** Rated efficiency of the inverter and of the supply, each, or the table if not given. */
  driveEta?: number;
  fanW: number;
  drumBrakeW: number;
  controlsW: number;
  /** Multiplies the farm's cable loss. */
  cableScale: number;
}

export const NOMINAL: Assumptions = {
  sheaveEta: SHEAVE_EFFICIENCY,
  guideFriction: GUIDE_FRICTION,
  stageEta: GEAR_STAGE_ETA,
  gearNoLoad: GEAR_NO_LOAD,
  fanW: FARM_FAN_W,
  drumBrakeW: FARM_DRUM_BRAKE_W,
  controlsW: CONTROLS_W,
  cableScale: 1,
};

/** Scale of the auxiliaries with the size of the machine (fan, brakes): P^0.7. **Estimate**. */
const auxScale = (w: number): number => Math.pow(w / FARM_MOTOR_W, 0.7);

/** The farm's design, for the sensitivity runs. */
export const FARM_DESIGN: HoistDesign = {
  massRated: FARM_MASS,
  stroke: FARM_STROKE,
  falls: FARM_FALLS,
  drumDiameter: FARM_DRUM_DIAMETER,
  motorW: FARM_MOTOR_W,
};

/**
 * A hoist of the farm machine's structure at another size. The motor's rated torque must carry the rated load: the catalogue's own
 * ratio (K11) sizes the motor, and the gear ratio then brings its rated speed to the rated speed of the hook. At 20 t and 15 kW it
 * gives back K8's 4 m/min exactly. The other sizes are ESTIMATES: nobody publishes these tables for Leith or for a shaft.
 */
export function designHoist(d: HoistDesign, a: Assumptions = NOMINAL): HoistSpec {
  const hookPerSpeed = d.massRated * G;
  const motorW = d.motorW ?? (hookPerSpeed * (d.vRated ?? FARM_V_RATED)) / CATALOGUE_RATIO;
  const vRated = d.vRated ?? (motorW * CATALOGUE_RATIO) / hookPerSpeed;
  // the two-pole-pair 100 Hz motor of K10 up to 30 kW, then a 4-pole motor at 50 Hz (estimate)
  const motorRpm = motorW <= 30000 ? MOTOR_RPM : 1480;
  const motorEta = a.motorEta ?? motorEfficiency(motorW);
  const omega = (motorRpm * 2 * Math.PI) / 60;
  const drumOmega = (d.falls * vRated) / (d.drumDiameter / 2);
  const ratio = omega / drumOmega;
  const stages = stagesNeeded(ratio, STAGE_RATIO_MAX);
  // K10's current at 15 kW; the same current per kilowatt elsewhere, at 400 V and cos φ 0.82 (estimate)
  const motorAmps = (MOTOR_AMPS * motorW) / FARM_MOTOR_W;
  const ratedInput = motorW / motorEta;
  const driveEta = a.driveEta ?? driveEfficiency(motorW);
  const drag = (a.gearNoLoad * motorW) / omega;
  const coulomb = GEAR_COULOMB_SHARE * drag;
  const windage = (MOTOR_LOSS_SHARE.windage * (ratedInput - motorW)) / omega;
  // the farm's cable loses this share of the rated power; a larger machine is wired (section, voltage) for the same share (estimate)
  const cableShare =
    (a.cableScale * 3 * MOTOR_AMPS * MOTOR_AMPS * FARM_CABLE_OHMS) / (FARM_MOTOR_W / motorEfficiency(FARM_MOTOR_W));
  return {
    kind: 'hoist',
    massRated: d.massRated,
    stroke: d.stroke,
    falls: d.falls,
    drumDiameter: d.drumDiameter,
    sheaveEta: a.sheaveEta,
    guideFriction: a.guideFriction,
    drumBearing: DRUM_BEARING,
    vRated,
    vMin: vRated / SPEED_RANGE,
    rampTime: RAMP_TIME,
    ropeMassPerM: (ROPE_MASS_PER_M * d.massRated * FARM_FALLS) / (FARM_MASS * d.falls),
    ropeFmin: (ROPE_FMIN * d.massRated * FARM_FALLS) / (FARM_MASS * d.falls),
    motorW,
    motorRpm,
    motorEta,
    cosPhi: MOTOR_COS_PHI,
    motorAmps,
    rotorInertia: FARM_ROTOR_INERTIA * Math.pow(motorW / FARM_MOTOR_W, 1.2),
    ratio,
    stages,
    gearEtaForward: Math.pow(a.stageEta, stages),
    gearEtaBack: Math.pow(backDriven(a.stageEta), stages),
    gearDragCoulomb: coulomb,
    gearDragViscous: (drag - coulomb) / omega,
    // the gearbox's and the motor's bearings, both starting twice as hard as they run (estimate)
    breakawayTorque: BREAKAWAY_FACTOR * (coulomb + GEAR_COULOMB_SHARE * windage),
    inverterLossRated: (1 - driveEta) * ratedInput,
    supplyLossRated: (1 - driveEta) * ratedInput,
    fanW: a.fanW * auxScale(motorW),
    brakesW: (FARM_BRAKE_W + a.drumBrakeW) * auxScale(motorW),
    controlsW: a.controlsW * Math.max(1, Math.pow(motorW / FARM_MOTOR_W, 0.3)),
    cablePhaseOhms: (cableShare * ratedInput) / (3 * motorAmps * motorAmps),
  };
}

/** The machine of the lab: 20 t, 20 m, four falls, 15 kW. */
export const FARM: HoistSpec = designHoist(FARM_DESIGN);

/** Standing power with the drive powered and ready (under a second to move), W. */
export const standingReady = (m: HoistSpec): number =>
  m.controlsW + INVERTER_LOSS_SHARE.fixed * m.inverterLossRated + SUPPLY_LOSS_SHARE.fixed * m.supplyLossRated;
/** Standing power with the drive asleep (contactor open), W. */
export const standingAsleep = (m: HoistSpec): number => m.controlsW;

/** How the mass of the machine is made: whole blocks at the bottom, half blocks on top, what the carrier cannot be stripped of. */
export function stackFor(mass: number): { blocks: number; halves: number; rest: number } {
  const payload = Math.max(0, mass - CARRIER_MASS);
  const full = STACK_BLOCKS * BLOCK.mass + STACK_HALVES * HALF_BLOCK.mass;
  // the published stack is six whole blocks and two half ones: it is what the full 20 t is made of (K18)
  if (payload >= full - 1e-6) return { blocks: STACK_BLOCKS, halves: STACK_HALVES, rest: payload - full };
  const blocks = Math.floor(payload / BLOCK.mass + 1e-9);
  const halves = Math.floor((payload - blocks * BLOCK.mass) / HALF_BLOCK.mass + 1e-9);
  return { blocks, halves, rest: payload - blocks * BLOCK.mass - halves * HALF_BLOCK.mass };
}
