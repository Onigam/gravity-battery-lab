// sim/mech: the drive between a slow machine and a fast one. These functions come from mill-lab/src/sim/mech.ts, its request 7 to
// the kit (docs/kit-requests.md, request 1 here: this lab is the second user). Pure, SI, no import from the lab. Angular speeds in
// rad/s, torques in N·m, powers in W, voltages in V, currents in A; rpm only in the helpers that say so.

export const rpmToRad = (rpm: number): number => (rpm * 2 * Math.PI) / 60;
export const radToRpm = (omega: number): number => (omega * 60) / (2 * Math.PI);

/** Ratio of stages in series: the product. */
export const totalRatio = (stages: readonly number[]): number => stages.reduce((a, r) => a * r, 1);

/** Torque T = P / ω. The slower the shaft, the bigger the torque for the same power. */
export const torque = (power: number, omega: number): number => (omega > 0 ? power / omega : Infinity);

/** How many stages of at most `maxStage` are needed to reach `ratio` (at least one). */
export const stagesNeeded = (ratio: number, maxStage: number): number =>
  Math.max(1, Math.ceil(Math.log(Math.max(ratio, 1)) / Math.log(maxStage) - 1e-9));

export interface StageState {
  /** Speed (rad/s) and torque (N·m) at the input shaft of the stage, and at its output. */
  omegaIn: number;
  omegaOut: number;
  torqueIn: number;
  torqueOut: number;
}

/**
 * Speeds and torques along a train of stages driven from the slow shaft: speed multiplied by the ratio, torque divided by
 * ratio × efficiency (the power loses the efficiency of each stage).
 */
export function driveTrain(
  omega: number,
  torqueIn: number,
  stages: readonly { ratio: number; efficiency: number }[],
): StageState[] {
  const out: StageState[] = [];
  let w = omega;
  let t = torqueIn;
  for (const s of stages) {
    const wOut = w * s.ratio;
    const tOut = (t * s.efficiency) / s.ratio;
    out.push({ omegaIn: w, omegaOut: wOut, torqueIn: t, torqueOut: tOut });
    w = wOut;
    t = tOut;
  }
  return out;
}

/**
 * A generator with a voltage proportional to the speed and a torque proportional to the current, on a bus held at `busVolts`:
 * V_oc = k·ω and T = k·I. Current flows only above the cut-in speed, where V_oc exceeds the bus plus the diode drop.
 */
export interface Generator {
  voltsPerRad: number;
  /** Resistance of the circuit, Ω. */
  resistance: number;
  busVolts: number;
  /** Drop of the diodes in the conducting path, V. */
  diodeDrop: number;
}

export interface GeneratorPoint {
  current: number;
  /** Mechanical power taken at the shaft, W, and electrical power into the bus, W. */
  shaftPower: number;
  electricPower: number;
  torque: number;
}

export function generatorAt(g: Generator, omega: number): GeneratorPoint {
  const voc = g.voltsPerRad * omega;
  const current = Math.max(0, (voc - g.diodeDrop - g.busVolts) / g.resistance);
  return {
    current,
    shaftPower: voc * current,
    electricPower: g.busVolts * current,
    torque: g.voltsPerRad * current,
  };
}

/**
 * The speed where the torque of the machine equals the torque of the load. `supply(ω)` must not increase and `load(ω)` must
 * not decrease with ω. Returns 0 when the machine cannot even start, `omegaMax` when the load never catches it.
 */
export function matchSpeed(supply: (w: number) => number, load: (w: number) => number, omegaMax: number): number {
  const net = (w: number) => supply(w) - load(w);
  const tiny = omegaMax * 1e-6;
  if (net(tiny) <= 0) return 0;
  if (net(omegaMax) >= 0) return omegaMax;
  let a = tiny;
  let b = omegaMax;
  for (let i = 0; i < 30; i++) {
    const m = 0.5 * (a + b);
    if (net(m) > 0) a = m;
    else b = m;
  }
  return 0.5 * (a + b);
}
