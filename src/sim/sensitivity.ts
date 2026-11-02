import { cutInSpeed, lightestLoad, strokeEnergy } from './chain';
import { designHoist, FARM_DESIGN, FARM_MASS, G, NOMINAL, type Assumptions } from './machine';

// How much the answers depend on what no source gives. Two sets, each at the kind end of the range of every assumption or at its
// unkind end, all at once: the two ends of what the model can honestly say, not two likely machines. docs/physics.md §7 quotes them.

export const KIND: Assumptions = {
  sheaveEta: 0.99,
  guideFriction: 0.005,
  stageEta: 0.985,
  gearNoLoad: 0.005,
  motorEta: 0.94,
  driveEta: 0.98,
  fanW: 60,
  drumBrakeW: 80,
  controlsW: 15,
  cableScale: 0.6,
};

export const UNKIND: Assumptions = {
  sheaveEta: 0.97,
  guideFriction: 0.025,
  stageEta: 0.97,
  gearNoLoad: 0.02,
  motorEta: 0.91,
  driveEta: 0.96,
  fanW: 150,
  drumBrakeW: 300,
  controlsW: 80,
  cableScale: 1.5,
};

export interface Answers {
  up: number;
  down: number;
  roundTrip: number;
  deliveredWh: number;
  /** Below this at the hook the machine gives nothing, W. */
  cutInHook: number;
  cutInMpm: number;
  /** The lightest load that comes down on its own, kg. */
  lightest: number;
}

export function answers(a: Assumptions): Answers {
  const m = designHoist(FARM_DESIGN, a);
  const e = strokeEnergy(m, FARM_MASS, m.vRated, m.vRated);
  const v = cutInSpeed(m, FARM_MASS) ?? 0;
  return {
    up: e.up,
    down: e.down,
    roundTrip: e.roundTrip,
    deliveredWh: e.output,
    cutInHook: FARM_MASS * G * v,
    cutInMpm: v * 60,
    lightest: lightestLoad(m),
  };
}

export const SENSITIVITY = {
  nominal: () => answers(NOMINAL),
  kind: () => answers(KIND),
  unkind: () => answers(UNKIND),
};
