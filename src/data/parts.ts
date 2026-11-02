import type { PartInfo } from '@onigam/lab-kit/content';
import { DIM_SPECS } from './parts/dim-specs';
import { HOIST_PARTS } from './parts/hoist';
import { POWER_ROOM_PARTS } from './parts/power-room';
import { SITE_PARTS } from './parts/site';
import { TOWER_PARTS } from './parts/tower';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the order of docs/research.md §4: `site` 10, `tower` 15,
// `hoist` 13, `power-room` 14. The ids are the contract with the 3D role: data.test.ts holds them against that list. The dimension rows of each sheet are read from
// src/three/dims.ts in ./parts/dim-specs.ts and appended here, so that no length is typed twice.
export const PARTS: PartInfo[] = [...SITE_PARTS, ...TOWER_PARTS, ...HOIST_PARTS, ...POWER_ROOM_PARTS].map((p) => ({
  ...p,
  specs: [...p.specs, ...(DIM_SPECS[p.id] ?? [])],
}));
