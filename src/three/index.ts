import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { GravityParams, GravityState } from '../sim/types';
import { createHoistScene as buildHoistScene } from './hoist/scene';
import { createPowerroomScene as buildPowerroomScene } from './powerroom/scene';
import { createSiteScene as buildSiteScene } from './site/scene';
import { createTowerScene as buildTowerScene } from './tower/scene';

// The four worlds, all `lazyModule`s: nothing is built until the visitor goes there. Use the result as the `module` of the `SceneDef`, and spread `WORLD[id]` next to it.
// The site reads three things the state does not hold (research: `wind`, `gateOpen` and `grid` are in `params`): the application gives it the parameters.

export const createSiteScene = (params: () => GravityParams): SceneModule<GravityState> =>
  lazyModule<GravityState>('site', () => buildSiteScene(params));
export const createTowerScene = (): SceneModule<GravityState> =>
  lazyModule<GravityState>('tower', () => buildTowerScene());
export const createHoistScene = (): SceneModule<GravityState> =>
  lazyModule<GravityState>('hoist', () => buildHoistScene());
export const createPowerroomScene = (): SceneModule<GravityState> =>
  lazyModule<GravityState>('power-room', () => buildPowerroomScene());

/** What `src/lab.ts` needs to know of each world, as `SceneDef` fields. */
export const WORLD = {
  site: {
    /** A landscape to the kit (authored home pose, far plane 4000 m). No section here. */
    cutaway: false,
    xrayNeedsSelection: true,
    partPadding: 2.6,
    stepFrame: { padding: 1.6, minRadius: 2 },
    xrayShell: (id: string): boolean => id === 'barn-solar-roof' || id === 'farmhouse' || id === 'power-shed',
  },
  tower: {
    /** A lattice one can see through: a section would teach nothing (research §4). */
    cutaway: false,
    partPadding: 2.4,
    stepFrame: { padding: 1.5, minRadius: 0.6 },
    xrayShell: (id: string): boolean =>
      id === 'concrete-block' ||
      id === 'tower-bracing' ||
      id === 'service-ladder' ||
      id === 'height-scale' ||
      id === 'stack-tie',
  },
  hoist: {
    /** The section through the axes of the drum and the motor is the hero view here. */
    cutaway: true,
    partPadding: 2.2,
    stepFrame: { padding: 1.5, minRadius: 0.2 },
    xrayShell: (id: string): boolean => id === 'hoist-gearbox' || id === 'hoist-motor' || id === 'service-brake',
  },
  'power-room': {
    /** The room is open already: no section (lab-quality §2). */
    cutaway: false,
    partPadding: 2,
    stepFrame: { padding: 1.5, minRadius: 0.25 },
    xrayShell: (id: string): boolean => id === 'motor-inverter' || id === 'dc-link' || id === 'regen-supply',
  },
} as const;
