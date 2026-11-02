import { G, HOOK_APPROACH, ROPE_ON_DRUM, SHEAVE_EFFICIENCY } from './machine';

// The rope and its falls. One rope from the drum, down to the hook block, up to a return sheave, down again, up to a fixed anchor:
// four falls and three sheaves. Every sheave costs a little, in a direction that depends on which way the rope runs: going up the
// fall on the drum carries the most, going down it carries the least.

/** Sum of the tensions of the falls in units of the drum-side tension, raising: 1 + η + η² + … */
export function reevingSumUp(falls: number, eta = SHEAVE_EFFICIENCY): number {
  let sum = 0;
  let term = 1;
  for (let i = 0; i < falls; i++) {
    sum += term;
    term *= eta;
  }
  return sum;
}

/** The same, lowering: 1 + 1/η + 1/η² + … */
export const reevingSumDown = (falls: number, eta = SHEAVE_EFFICIENCY): number => reevingSumUp(falls, 1 / eta);

/** Rope speed at the drum, m/s. */
export const ropeSpeed = (falls: number, v: number): number => falls * Math.abs(v);

/** The tension of one fall before any friction, N (K13: 20 t on 4 falls, 49 kN). */
export const staticTension = (mass: number, falls: number): number => (mass * G) / falls;

/** The rope's safety factor: minimum breaking force over the tension (K13). */
export const ropeFactor = (fmin: number, tension: number): number => (tension > 0 ? fmin / tension : Infinity);

/** Length of one fall when the hook is at height `z` of the stroke, m. */
export const fallLength = (stroke: number, z: number): number => Math.max(0, stroke - z) + HOOK_APPROACH;

/** The whole rope, m (K14: 4 × 20 m plus the turns kept on the drum). */
export const ropeLength = (falls: number, stroke: number): number => falls * stroke + ROPE_ON_DRUM;

/**
 * Mass of the rope that the drum is lifting along with the load, kg: all the rope hanging at that moment, since the drum takes rope
 * in at the top (S6 eq. 15 counts it at its longest). About 137 kg at the bottom of the farm's stroke, 5 kg at the top.
 */
export const hangingRope = (falls: number, massPerMetre: number, stroke: number, z: number): number =>
  falls * massPerMetre * fallLength(stroke, z);
