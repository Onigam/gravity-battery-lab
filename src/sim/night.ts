import { chainAt, speedForOutput, strokeEnergy, vMaxFor } from './chain';
import { massFor } from './energy';
import { bufferPathEfficiency, lfpMaxPower } from './lfp';
import { BLOCK, CARRIER_MASS, FARM_MASS, G, HALF_BLOCK, STACK_BLOCKS, STACK_HALVES, type HoistSpec } from './machine';
import type { MachineSpec } from './presets';

// The « aha »: how much it takes to get through a night (K43, K51). The gross figure is one line of E = m·g·h; the rest is the model's
// own efficiency, along the only path that makes sense for a night's small load: the tower in bursts into a battery, the battery
// following the house.

/** The night's energy is spread over these hours, h, to find the mean load the battery's inverter works at (day.ts: 18:00 to 07:00). */
const NIGHT_HOURS = 13;

/** Concrete in the 20 t: 6 × 1.024 + 2 × 0.512 m³ (K17, K18). */
export const STACK_VOLUME =
  STACK_BLOCKS * (BLOCK.length * BLOCK.width * BLOCK.height) +
  STACK_HALVES * (HALF_BLOCK.length * HALF_BLOCK.width * HALF_BLOCK.height);
/** The stack's mass. */
export const STACK_MASS = FARM_MASS - CARRIER_MASS;

export interface NightNeed {
  /** The night, Wh. */
  wh: number;
  /** Mass at this stroke with no loss at all, tonnes (K43: 7 kWh at 20 m, 128 t). */
  tonnesGross: number;
  /** One-way efficiency of the path: the tower's and the battery's, 0 to 1. */
  towerEta: number;
  bufferEta: number;
  eta: number;
  /** Mass at this stroke with the model's losses, tonnes (K51). */
  tonnes: number;
  /** Machines of this load: the stack on the farmyard. */
  towers: number;
  /** Whole blocks, and m³ of concrete. */
  blocks: number;
  volume: number;
  /** The same night through the tower alone at full speed, a load it could never follow: the kindest possible figure, tonnes. */
  tonnesFullSpeed: number;
}

/**
 * The tower's own efficiency on the way down when it fills the buffer at the buffer's recommended current: `speedForOutput` of the
 * charge power, at mid-stroke.
 */
export function burstDown(spec: HoistSpec, mass: number, modules: number): number {
  const z = spec.stroke / 2;
  const v = speedForOutput(spec, mass, z, lfpMaxPower(modules, 0.5)) ?? vMaxFor(spec, mass);
  const p = chainAt(spec, mass, z, -v);
  return p.hook > 0 ? Math.max(0, -p.meter / p.hook) : 0;
}

/** Whole blocks (half blocks counted as half) in a load made like the farm's: 16.8 t of concrete in each 20 t. */
const blocksIn = (tonnes: number): number => (tonnes * 1000 * (STACK_MASS / FARM_MASS)) / BLOCK.mass;
/** Concrete in that load, m³. */
const concreteIn = (tonnes: number): number => (tonnes * 1000 * STACK_VOLUME) / FARM_MASS;

export function nightNeed(nightKwh: number, spec: MachineSpec, mass: number, modules: number): NightNeed {
  const wh = nightKwh * 1000;
  const stroke = spec.stroke;
  const tonnesGross = massFor(wh, stroke) / 1000;
  if (spec.kind !== 'hoist') {
    return {
      wh,
      tonnesGross,
      towerEta: 0,
      bufferEta: 0,
      eta: 0,
      tonnes: tonnesGross,
      towers: tonnesGross / (mass / 1000),
      blocks: blocksIn(tonnesGross),
      volume: concreteIn(tonnesGross),
      tonnesFullSpeed: tonnesGross,
    };
  }
  const towerEta = burstDown(spec, mass, modules);
  const charge = Math.min(lfpMaxPower(modules, 0.5), Math.max(1, towerEta * mass * G * vMaxFor(spec, mass)));
  const bufferEta = bufferPathEfficiency(wh / NIGHT_HOURS, charge, modules);
  const eta = towerEta * bufferEta;
  const tonnes = eta > 0 ? massFor(wh / eta, stroke) / 1000 : Infinity;
  const top = vMaxFor(spec, mass);
  const direct = strokeEnergy(spec, mass, top, top).down;
  return {
    wh,
    tonnesGross,
    towerEta,
    bufferEta,
    eta,
    tonnes,
    towers: tonnes / (mass / 1000),
    blocks: blocksIn(tonnes),
    volume: concreteIn(tonnes),
    tonnesFullSpeed: direct > 0 ? massFor(wh / direct, stroke) / 1000 : Infinity,
  };
}
