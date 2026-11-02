import {
  EXTENDED_RANGE,
  G,
  INVERTER_LOSS_SHARE,
  IRON_HYSTERESIS,
  MOTOR_LOSS_SHARE,
  OVERLOAD_TORQUE,
  SUPPLY_LOSS_SHARE,
  type HoistSpec,
} from './machine';
import { driveTrain, radToRpm, rpmToRad, type StageState } from './mech';
import { hangingRope, reevingSumDown, reevingSumUp, ropeFactor } from './reeving';

// The energy chain of the hoist at one instant, in the order the power crosses it: hook, guides, sheaves, drum, gears, motor, cable,
// inverter, regenerative supply, auxiliaries, meter. The chain is computed forwards from the load for a given speed, with no iteration,
// so that a step stays cheap; the inverse problems (what speed gives this power?) use bisection on it.
//
// Sign: v > 0 raises, v < 0 lowers. `meter` > 0 is power taken from the farm, `meter` < 0 is power given back. A loss is always ≥ 0.

export interface ChainPoint {
  v: number;
  /** Force on the hook including the rope and the guides, N; mechanical power at the hook m·g·|v|, W. */
  force: number;
  hook: number;
  /** Losses, W. */
  guide: number;
  reeving: number;
  drum: number;
  gearMesh: number;
  gearDrag: number;
  motorCopper: number;
  motorIron: number;
  motorWindage: number;
  cable: number;
  inverter: number;
  supply: number;
  fan: number;
  brakes: number;
  controls: number;
  /** Signed: mechanical at the motor shaft (> 0 the motor drives), electrical at the motor and at the DC link. */
  shaft: number;
  motorElectric: number;
  dcLink: number;
  meter: number;
  /** Shafts. */
  motorTorque: number;
  motorRpm: number;
  drumRpm: number;
  drumTorque: number;
  ropeTension: number;
  ropeFactor: number;
  current: number;
}

export function newChainPoint(): ChainPoint {
  return {
    v: 0,
    force: 0,
    hook: 0,
    guide: 0,
    reeving: 0,
    drum: 0,
    gearMesh: 0,
    gearDrag: 0,
    motorCopper: 0,
    motorIron: 0,
    motorWindage: 0,
    cable: 0,
    inverter: 0,
    supply: 0,
    fan: 0,
    brakes: 0,
    controls: 0,
    shaft: 0,
    motorElectric: 0,
    dcLink: 0,
    meter: 0,
    motorTorque: 0,
    motorRpm: 0,
    drumRpm: 0,
    drumTorque: 0,
    ropeTension: 0,
    ropeFactor: Infinity,
    current: 0,
  };
}

/** The motor at a shaft torque (signed) and speed: the rated losses (K10, K12) followed down to any load. */
export interface MotorLosses {
  copper: number;
  iron: number;
  windage: number;
  /** Current as a share of the rated one. */
  current: number;
}

/**
 * The parameterisation of the data sheet. At the rated point the losses add up to P(1/η − 1). The stator current has a part that
 * makes the flux (sin φ of the rating) and a part that makes the torque (cos φ), so the stator's copper loss never falls to zero
 * while the machine is magnetised, and a torque that does not depend on the speed gives a loss that does not depend on it either.
 * Above the base speed the flux falls as 1/speed, as the extended range of K8 implies.
 */
export function motorLossesAt(m: HoistSpec, torque: number, omega: number, out?: MotorLosses): MotorLosses {
  const omegaRated = rpmToRad(m.motorRpm);
  const torqueRated = m.motorW / omegaRated;
  const rated = m.motorW * (1 / m.motorEta - 1);
  const w = Math.abs(omega) / omegaRated;
  const flux = w > 1 ? 1 / w : 1;
  const x = Math.abs(torque) / torqueRated / flux;
  const sin2 = 1 - m.cosPhi * m.cosPhi;
  const cos2 = m.cosPhi * m.cosPhi;
  const i2 = sin2 * flux * flux + cos2 * x * x;
  const r = out ?? { copper: 0, iron: 0, windage: 0, current: 0 };
  r.copper = rated * (MOTOR_LOSS_SHARE.stator * i2 + (MOTOR_LOSS_SHARE.rotor + MOTOR_LOSS_SHARE.stray) * x * x);
  r.iron = rated * MOTOR_LOSS_SHARE.iron * flux * flux * (IRON_HYSTERESIS * w + (1 - IRON_HYSTERESIS) * w * w);
  r.windage = rated * MOTOR_LOSS_SHARE.windage * (0.4 * w + 0.6 * w * w);
  r.current = Math.sqrt(i2);
  return r;
}

const scratchMotor: MotorLosses = { copper: 0, iron: 0, windage: 0, current: 0 };

/** The whole chain for a load `mass` (kg) at height `z` (m), speed `v` (m/s), acceleration `a` (m/s², positive upwards). */
export function chainAt(
  m: HoistSpec,
  mass: number,
  z: number,
  v: number,
  a = 0,
  windForce = 0,
  out: ChainPoint = newChainPoint(),
): ChainPoint {
  const up = v >= 0;
  const speed = Math.abs(v);
  const n = m.falls;
  // the hook: load, the rope hanging, what the guides take, the force of the ramp
  const rope = hangingRope(n, m.ropeMassPerM, m.stroke, z);
  const weight = (mass + rope) * G;
  const guideForce = m.guideFriction * (mass * G + Math.abs(windForce));
  const inertial = mass * a;
  const force = weight + inertial + (up ? guideForce : -guideForce);
  // the rope
  const tension = force / (up ? reevingSumUp(n, m.sheaveEta) : reevingSumDown(n, m.sheaveEta));
  const ropeAtDrum = tension * n * speed;
  const reeving = Math.abs(force * speed - ropeAtDrum);
  // the drum
  const r = m.drumDiameter / 2;
  const omegaDrum = (n * speed) / r;
  const drumTorque = (tension * r) / (tension * (up ? 1 : -1) >= 0 ? m.drumBearing : 1 / m.drumBearing);
  const drumOut = drumTorque * omegaDrum;
  // the gears: the mesh follows the torque and the direction of the power; the drag follows the speed and always costs
  const omega = omegaDrum * m.ratio;
  const motorSideMesh =
    drumTorque / (m.ratio * (drumTorque * (up ? 1 : -1) >= 0 ? m.gearEtaForward : 1 / m.gearEtaBack));
  const dragTorque = omega > 0 ? m.gearDragCoulomb + m.gearDragViscous * omega : 0;
  // torque the motor must give in the raising sense, the rotor's own inertia included
  const alpha = (a * n * m.ratio) / r;
  const motorTorque = motorSideMesh + (up ? dragTorque : -dragTorque) + m.rotorInertia * alpha;
  const shaft = motorTorque * (up ? omega : -omega);

  motorLossesAt(m, motorTorque, omega, scratchMotor);
  const motorElectric = shaft + scratchMotor.copper + scratchMotor.iron + scratchMotor.windage;
  const current = m.motorAmps * scratchMotor.current;
  const cable = 3 * current * current * m.cablePhaseOhms;
  const iPu = scratchMotor.current;
  const inverter =
    m.inverterLossRated *
    (INVERTER_LOSS_SHARE.fixed + INVERTER_LOSS_SHARE.linear * iPu + INVERTER_LOSS_SHARE.square * iPu * iPu);
  const dcLink = motorElectric + cable + inverter;
  const p = Math.abs(dcLink) / (m.motorW / m.motorEta);
  const supply =
    m.supplyLossRated * (SUPPLY_LOSS_SHARE.fixed + SUPPLY_LOSS_SHARE.linear * p + SUPPLY_LOSS_SHARE.square * p * p);
  const meter = dcLink + supply + m.fanW + m.brakesW + m.controlsW;

  out.v = v;
  out.force = force;
  out.hook = mass * G * speed;
  out.guide = guideForce * speed;
  out.reeving = reeving;
  out.drum = Math.abs(ropeAtDrum - drumOut);
  out.gearMesh = Math.abs(drumOut - motorSideMesh * omega);
  out.gearDrag = dragTorque * omega;
  out.motorCopper = scratchMotor.copper;
  out.motorIron = scratchMotor.iron;
  out.motorWindage = scratchMotor.windage;
  out.cable = cable;
  out.inverter = inverter;
  out.supply = supply;
  out.fan = m.fanW;
  out.brakes = m.brakesW;
  out.controls = m.controlsW;
  out.shaft = shaft;
  out.motorElectric = motorElectric;
  out.dcLink = dcLink;
  out.meter = meter;
  out.motorTorque = motorTorque;
  out.motorRpm = radToRpm(omega);
  out.drumRpm = radToRpm(omegaDrum);
  out.drumTorque = drumTorque;
  // the fall that carries the most: the one on the drum going up, the one on the anchor going down
  out.ropeTension = up ? tension : tension / Math.pow(m.sheaveEta, n - 1);
  out.ropeFactor = ropeFactor(m.ropeFmin, out.ropeTension);
  out.current = current;
  return out;
}

const scratch = newChainPoint();
const meterAt = (m: HoistSpec, mass: number, z: number, v: number): number =>
  chainAt(m, mass, z, v, 0, 0, scratch).meter;

/** The fastest the hook may go with this load, m/s (K8: rated speed at full load, up to 1.5 times at part load, at constant power). */
export const vMaxFor = (m: HoistSpec, mass: number): number =>
  m.vRated * Math.max(1, Math.min(EXTENDED_RANGE, m.massRated / Math.max(mass, 1)));

/** The motor's torque is the limit: a load the drive cannot start at all. */
export const tooHeavyFor = (m: HoistSpec, mass: number, z: number): boolean => {
  const torqueRated = m.motorW / rpmToRad(m.motorRpm);
  return chainAt(m, mass, z, m.vMin, 0, 0, scratch).motorTorque > OVERLOAD_TORQUE * torqueRated;
};

/** Bisection on an increasing function of the speed. */
function solveSpeed(f: (v: number) => number, lo: number, hi: number): number {
  let a = lo;
  let b = hi;
  for (let i = 0; i < 40; i++) {
    const c = 0.5 * (a + b);
    if (f(c) > 0) b = c;
    else a = c;
  }
  return 0.5 * (a + b);
}

/**
 * The speed of descent below which the machine gives nothing back (K49): where the meter crosses zero. Returns `null` if it never
 * crosses (a load too light to pay for its own drive at any allowed speed).
 */
export function cutInSpeed(m: HoistSpec, mass: number, z = m.stroke / 2): number | null {
  const max = vMaxFor(m, mass);
  if (meterAt(m, mass, z, -max) >= 0) return null;
  return solveSpeed((v) => -meterAt(m, mass, z, -v), 1e-5, max);
}

/** The speed of descent that delivers `power` W at the meter, or `null` above what the machine can give with this load. */
export function speedForOutput(m: HoistSpec, mass: number, z: number, power: number): number | null {
  const max = vMaxFor(m, mass);
  if (-meterAt(m, mass, z, -max) < power) return null;
  return solveSpeed((v) => -meterAt(m, mass, z, -v) - power, 1e-5, max);
}

/** The speed of ascent that takes `power` W at the meter, or `null` below what the slowest ascent asks. Capped at the top speed. */
export function speedForInput(m: HoistSpec, mass: number, z: number, power: number): number | null {
  if (meterAt(m, mass, z, m.vMin) > power) return null;
  const max = vMaxFor(m, mass);
  if (meterAt(m, mass, z, max) <= power) return max;
  return solveSpeed((v) => meterAt(m, mass, z, v) - power, m.vMin, max);
}

/**
 * Whether a load starts down on its own once the brakes are released and the motor is unpowered (K50): its torque, run backwards
 * through the sheaves and the gears, must beat the starting friction of the train.
 */
export function comesDownAlone(m: HoistSpec, mass: number, z: number): boolean {
  const rope = hangingRope(m.falls, m.ropeMassPerM, m.stroke, z);
  const force = (mass + rope) * G - m.guideFriction * mass * G;
  const tension = force / reevingSumDown(m.falls, m.sheaveEta);
  const drum = tension * (m.drumDiameter / 2) * m.drumBearing;
  return (drum * m.gearEtaBack) / m.ratio > m.breakawayTorque;
}

/** The lightest load that comes down on its own, kg (K50). Counted at the top of the stroke, where the rope helps least. */
export function lightestLoad(m: HoistSpec): number {
  let a = 0;
  let b = m.massRated;
  for (let i = 0; i < 40; i++) {
    const c = 0.5 * (a + b);
    if (comesDownAlone(m, c, m.stroke)) b = c;
    else a = c;
  }
  return 0.5 * (a + b);
}

export interface StrokeEnergy {
  /** Gross energy of the load over the stroke, m·g·h, Wh. */
  gross: number;
  /** Energy at the meter for a full stroke up and down, Wh, the machine stopped only for an instant in between. */
  input: number;
  output: number;
  up: number;
  down: number;
  roundTrip: number;
}

/** A whole stroke up at `vUp` and down at `vDown` (K47, K52): the energy at the meter integrated over the height, standing losses apart. */
export function strokeEnergy(m: HoistSpec, mass: number, vUp: number, vDown: number, height = m.stroke): StrokeEnergy {
  const nodes = 16;
  let input = 0;
  let output = 0;
  for (let i = 0; i < nodes; i++) {
    const z = ((i + 0.5) / nodes) * height;
    const dt = height / nodes;
    input += (meterAt(m, mass, z, vUp) * dt) / vUp;
    output -= (meterAt(m, mass, z, -vDown) * dt) / vDown;
  }
  input /= 3600;
  output /= 3600;
  const gross = (mass * G * height) / 3600;
  return { gross, input, output, up: gross / input, down: output / gross, roundTrip: output / input };
}

export interface EfficiencyCurve {
  /** Power at the hook, W, for 1 to `points` speeds up to the top speed at this load. */
  hook: number[];
  /** What the meter gives or takes at that hook power, W (the descent: negative below the cut-in). */
  out: number[];
  input: number[];
  /** Efficiencies in % (down and round trip at 0 below the cut-in, where the machine gives nothing). */
  down: number[];
  up: number[];
  roundTrip: number[];
}

/** Efficiency against power at a fixed load (K48), at mid-stroke. */
export function efficiencyCurve(m: HoistSpec, mass: number, points = 48): EfficiencyCurve {
  const max = vMaxFor(m, mass);
  const c: EfficiencyCurve = { hook: [], out: [], input: [], down: [], up: [], roundTrip: [] };
  const z = m.stroke / 2;
  for (let i = 1; i <= points; i++) {
    const v = (max * i) / points;
    const hook = mass * G * v;
    const out = -meterAt(m, mass, z, -v);
    const input = meterAt(m, mass, z, v);
    const down = Math.max(0, out / hook);
    const up = input > 0 ? hook / input : 0;
    c.hook.push(hook);
    c.out.push(out);
    c.input.push(input);
    c.down.push(100 * down);
    c.up.push(100 * up);
    c.roundTrip.push(100 * down * up);
  }
  return c;
}

export interface RampFigures {
  /** S7 eq. 14: 1 + P/(m g² τ), only the weight is accelerated. */
  weightOnly: number;
  /** The model: the torque at the end of the ramp over the steady torque, the rotor counted. */
  withRotor: number;
  /** Mass that the rotor is worth at the hook, kg: J·(n·i/r)². */
  rotorEquivalentMass: number;
  /** Kinetic energy of the rotor at speed, Wh: paid back at the stop, if the drive regenerates. */
  rotorEnergy: number;
  /** Whether the drive has the torque for this ramp. */
  withinOverload: boolean;
}

/** What a start costs (K53). */
export function rampFigures(m: HoistSpec, mass: number, ramp: number, v = m.vRated): RampFigures {
  const a = v / ramp;
  const steady = chainAt(m, mass, m.stroke / 2, v).motorTorque;
  const accel = chainAt(m, mass, m.stroke / 2, v, a).motorTorque;
  const omega = rpmToRad(m.motorRpm) * (v / m.vRated);
  const hookPower = mass * G * v;
  return {
    weightOnly: 1 + hookPower / (mass * G * G * ramp),
    withRotor: accel / steady,
    rotorEquivalentMass: m.rotorInertia * Math.pow((m.falls * m.ratio) / (m.drumDiameter / 2), 2),
    rotorEnergy: (0.5 * m.rotorInertia * omega * omega) / 3600,
    withinOverload: accel <= (OVERLOAD_TORQUE * m.motorW) / rpmToRad(m.motorRpm),
  };
}

export interface ShaftRow {
  /** rpm and N·m. */
  rpm: number;
  torque: number;
}

/** Speed and torque at each shaft when raising at full speed: for the "torque at each shaft" sheet and the hoist world. */
export function shaftsAt(
  m: HoistSpec,
  mass: number,
  v = m.vRated,
): { hookForce: number; ropeTension: number; drum: ShaftRow; stages: StageState[]; motor: ShaftRow } {
  const p = chainAt(m, mass, m.stroke / 2, v);
  const stageRatio = Math.pow(m.ratio, 1 / m.stages);
  const stageEta = Math.pow(m.gearEtaForward, 1 / m.stages);
  // the train is written from the slow shaft: the torque needed going up rises through 1/η, so the efficiency is inverted here
  const stages = driveTrain(
    rpmToRad(p.drumRpm),
    p.drumTorque,
    Array.from({ length: m.stages }, () => ({ ratio: stageRatio, efficiency: 1 / stageEta })),
  );
  return {
    hookForce: p.force,
    ropeTension: p.ropeTension,
    drum: { rpm: p.drumRpm, torque: p.drumTorque },
    stages,
    motor: { rpm: p.motorRpm, torque: p.motorTorque },
  };
}
