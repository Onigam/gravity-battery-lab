import { G } from './machine';
import { generatorAt, matchSpeed, type Generator } from './mech';

// The courtyard machine of the main video: a 12 V gear motor, printed planetary stages of 1:3, a roller, a pulley, rocks in a bag. What
// the video gives: 620 rpm at 12 V, 1:3 per stage, 12 kg stalling at 1:27, a final load of 46 kg, two LED bulbs (K29). What it does not
// give: height, final stage count, roller, power, run time (K30). So everything else here is an ESTIMATE and the results are ranges,
// not retrievals.

/** The gear motor: 620 rpm at 12 V (K29). */
export const DIY_MOTOR_RPM = 620;
export const DIY_MOTOR_VOLTS = 12;
/** Volts per rad/s at its output shaft. Derived from the two figures above, losses ignored. */
export const DIY_K = DIY_MOTOR_VOLTS / ((DIY_MOTOR_RPM * 2 * Math.PI) / 60);
/** Resistance of the circuit, Ω. **Estimate**: a 12 V motor of a few amps. */
export const DIY_OHMS = 1;
/** Torque at the gear motor's output needed to turn it backwards, N·m. **Estimate**: a small spur gearhead, about 10 % of its rated torque. */
export const DIY_BACKDRIVE = 0.2;
/** One printed stage of 1:3 (K29). Its efficiency is an **estimate**: printed plastic, no bearings to speak of. */
export const DIY_STAGE_RATIO = 3;
export const DIY_STAGE_ETA = 0.85;
/** The pulley at the top and the rope over it. **Estimate**. */
export const DIY_PULLEY_ETA = 0.9;
/** Roller radius, m. **Estimate**: not given (K30). */
export const DIY_ROLLER = 0.03;

export interface DiySetup {
  stages: number;
  roller: number;
}

export const DIY_FIRST: DiySetup = { stages: 3, roller: DIY_ROLLER };

const backEta = (stages: number): number => Math.pow(2 - 1 / DIY_STAGE_ETA, stages) * DIY_PULLEY_ETA;
const forwardEta = (stages: number): number => Math.pow(DIY_STAGE_ETA, stages) * DIY_PULLEY_ETA;
const ratioOf = (stages: number): number => Math.pow(DIY_STAGE_RATIO, stages);

/** The torque the load offers at the gear motor's output shaft on the way down, N·m. */
const loadTorque = (mass: number, s: DiySetup): number => (mass * G * s.roller * backEta(s.stages)) / ratioOf(s.stages);

/** The lightest load that comes down on its own, kg (K50 for this machine). */
export const diyLightest = (s: DiySetup = DIY_FIRST): number =>
  (DIY_BACKDRIVE * ratioOf(s.stages)) / (G * s.roller * backEta(s.stages));

/** The bulbs' voltage, V: they light at about the motor's voltage. **Estimate**. */
const generator: Generator = { voltsPerRad: DIY_K, resistance: DIY_OHMS, busVolts: 11, diodeDrop: 0 };

export interface DiyPoint {
  /** Speed of the load, m/s (0: stalled). */
  speed: number;
  hook: number;
  /** Electric power, W: to the bulbs on the way down, from the battery on the way up. */
  electric: number;
  motorRpm: number;
  current: number;
  efficiency: number;
}

/** The speed at which it settles on the way down: the load's torque against the generator's and the gearbox's. */
export function diyDescent(mass: number, s: DiySetup = DIY_FIRST): DiyPoint {
  const available = loadTorque(mass, s) - DIY_BACKDRIVE;
  const omegaMax = (10 * DIY_MOTOR_RPM * 2 * Math.PI) / 60;
  const omega = matchSpeed(
    () => available,
    (w) => generatorAt(generator, w).torque,
    omegaMax,
  );
  const stalled = available <= 0;
  // with a load just able to move and the voltage not reached, it speeds up to the bulbs' voltage: no current, no brake on it below that
  const settled = stalled ? 0 : omega;
  const speed = (settled / ratioOf(s.stages)) * s.roller;
  const point = generatorAt(generator, settled);
  const hook = mass * G * speed;
  return {
    speed,
    hook,
    electric: point.electricPower,
    motorRpm: (settled * 60) / (2 * Math.PI),
    current: point.current,
    efficiency: hook > 0 ? point.electricPower / hook : 0,
  };
}

/** The way up on the 12 V supply: a voltage against its back-EMF. Stalls if the motor's torque at standstill cannot lift it. */
export function diyAscent(mass: number, s: DiySetup = DIY_FIRST): DiyPoint {
  const torqueNeeded = (mass * G * s.roller) / (ratioOf(s.stages) * forwardEta(s.stages)) + DIY_BACKDRIVE;
  const current = torqueNeeded / DIY_K;
  const omega = (DIY_MOTOR_VOLTS - current * DIY_OHMS) / DIY_K;
  if (omega <= 0) {
    return { speed: 0, hook: 0, electric: 0, motorRpm: 0, current: DIY_MOTOR_VOLTS / DIY_OHMS, efficiency: 0 };
  }
  const speed = (omega / ratioOf(s.stages)) * s.roller;
  const hook = mass * G * speed;
  const electric = DIY_MOTOR_VOLTS * current;
  return { speed, hook, electric, motorRpm: (omega * 60) / (2 * Math.PI), current, efficiency: hook / electric };
}
