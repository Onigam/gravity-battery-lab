import * as THREE from 'three';
import { PartRegistry } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { GravityState } from '../../sim/types';
import { fadeFloor, paperFloor, type FlowDots } from '../common';
import { contactShadow } from '../detail';
import {
  BLOCK,
  CARRIER,
  CROSSHEAD_Y0,
  CROSSHEAD_TOP_Y0,
  DECK_TOP,
  HOOK_BLOCK,
  LADDER,
  LEG_TOP,
  PAD,
  PAD_BOTTOM,
  PAD_TOP,
  RAIL,
  RULER_ZERO,
  SADDLE_Y0,
  SCALE,
  SHOE,
  TOWER,
  levelY,
} from '../dims';
import { buildMachine, holdScenery, partsNow, TOWER_PARTS, type Machine, type TowerId } from '../rig/machine';
import type { FallEnds } from '../rig/rope';
import { RopeFlows } from '../rig/rope-flows';
import { clearestDir, partPoints } from '../rig/sight';
import { anchor, hotspots, viewFrom, workshopScene, type HotspotDef } from '../world';

// The `tower` world: the machine and its weight, standing on the drafting table, on its pad. A lattice one can see through, so no section; the exploded view lifts the blocks
// apart, takes the head frame and the hoist up, pulls the lattice open, and the rope stays on its sheaves. "Flows" shows the rope running: 4 v on fall 1, 2 v on falls 2 and 3,
// nothing on fall 4, the one that ends on the socket.

const HOTSPOTS: HotspotDef[] = [
  { id: 'head-frame', fr: 'Portique et treuil', en: 'Head frame and hoist', goto: 'hoist' },
  { id: 'hook-block', fr: 'Moufle', en: 'Hook block' },
  { id: 'hoist-rope', fr: 'Câble de levage', en: 'Hoist rope' },
  { id: 'concrete-block', fr: 'Blocs de béton', en: 'Concrete blocks' },
  { id: 'guide-rail', fr: 'Rail de guidage', en: 'Guide rail' },
  { id: 'foundation-pad', fr: 'Massif de fondation', en: 'Foundation pad' },
  { id: 'weight-carrier', fr: 'Châssis de charge', en: 'Weight carrier', minor: true },
  { id: 'stack-tie', fr: 'Tirant de pile', en: 'Stack tie', minor: true },
  { id: 'guide-shoe', fr: 'Patin de guidage', en: 'Guide shoe', minor: true },
  { id: 'safety-gear', fr: 'Parachute', en: 'Safety gear', minor: true },
  { id: 'end-buffer', fr: 'Butée amortissante', en: 'End buffer', minor: true },
  { id: 'tower-leg', fr: 'Montant', en: 'Tower leg', minor: true },
  { id: 'tower-bracing', fr: 'Contreventement', en: 'Bracing', minor: true },
  { id: 'service-ladder', fr: 'Échelle et ligne de vie', en: 'Ladder and fall arrest', minor: true },
  { id: 'height-scale', fr: 'Échelle des kilowattheures', en: 'Kilowatt-hour scale', minor: true },
];

export interface TowerScene extends SceneModule<GravityState> {
  machine: Machine;
  flows: FlowDots;
}

/** The camera's planes and its limit around the target, m: a 30 m tower seen whole, exploded too, from any side, and layers of steel a few millimetres apart. */
export const TOWER_CAMERA = { near: 0.05, far: 140, max: 72 } as const;
/** Fog start and end, m: behind the machine seen from the camera's limit, closing before the far plane. */
export const TOWER_FOG: [number, number] = [86, 135];

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const zone = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  new THREE.Box3(V(x0, y0, z0), V(x1, y1, z1));
const L = TOWER.legX;

/** The way the home view looks at the tower: what has nothing else to ask for is seen from here, so that a click never inherits the direction of the part before it (review D43). */
const HOME_DIR = V(12, 17 - 13.2, 37).normalize();

/**
 * What selecting a part brings the camera to, and from where (kit 0.6.0). A leg or a rail is 25 m long and its box a tower: what can be read of it is a stretch of it, seen from where nothing
 * stands in front. A part that rides on the weight keeps its own box, which follows it, and this is the first direction it tries (`RIDING`). Every part has a direction: without one the
 * kit keeps the camera's, and the part before it decides what stands in front. The envelope and a part shown alone keep the whole part.
 */
export const FRAMING: Record<TowerId, PartFraming> = {
  // the pad's near corner and a leg's foot: the whole slab reads as a thin line from the distance that holds it
  'foundation-pad': {
    frame: zone(-0.5, PAD.side / 2, PAD_BOTTOM, PAD_TOP + 0.6, 1, PAD.side / 2),
    viewDir: viewFrom(24, 28),
  },
  // the deck and what stands on it, not the roof over it
  'head-frame': { frame: zone(-1.9, 1.9, LEG_TOP, DECK_TOP + 1.3, -1.9, 1.9), viewDir: viewFrom(16, 25) },
  'end-buffer': { viewDir: HOME_DIR },
  'tower-leg': { frame: zone(L - 0.5, L + 0.5, PAD_TOP, levelY(1), L - 0.5, L + 0.5), viewDir: viewFrom(20, 30) },
  'tower-bracing': { frame: zone(-L, L, levelY(2), levelY(3), L - 0.2, L + 0.2), viewDir: viewFrom(8, 15) },
  'guide-rail': {
    frame: zone(RAIL.x - 0.15, L, levelY(2) - 1.3, levelY(2) + 1.3, -0.3, 0.3),
    viewDir: viewFrom(8, -30),
  },
  'service-ladder': {
    frame: zone(LADDER.x - 0.5, LADDER.x + 0.5, levelY(1), levelY(2), LADDER.z - 0.5, LADDER.z + 0.1),
    viewDir: viewFrom(8, 200),
  },
  'height-scale': {
    // a stretch with a figure of each kind: 10 m and 600 Wh, at the farm's figures
    frame: zone(SCALE.x - 0.72, SCALE.x + 0.36, RULER_ZERO + 9.8, RULER_ZERO + 11.5, SCALE.z - 0.05, SCALE.z + 0.05),
    viewDir: viewFrom(6, -10),
  },
  'hoist-rope': { frame: zone(-0.5, 0.5, 5, 7.4, -0.35, 0.35), viewDir: viewFrom(15, 0) },
  'hook-block': { viewDir: viewFrom(8, 30) },
  'safety-gear': { viewDir: viewFrom(8, 0) },
  'guide-shoe': { viewDir: viewFrom(8, 0) },
  'stack-tie': { viewDir: viewFrom(8, 80) },
  'weight-carrier': { viewDir: viewFrom(8, 0) },
  'concrete-block': { viewDir: viewFrom(30, 0) },
};

/** Where to look from when the first direction is blocked: around the shaft's corners, then level, then from just under (the kit's orbit stops at about 5° under the target). */
const ROUND_THE_SHAFT = [
  [8, 60],
  [8, 300],
  [8, 120],
  [8, 240],
  [15, 120],
  [15, 240],
  [0, 60],
  [0, 300],
  [0, 120],
  [0, 240],
  [-5, 60],
  [-5, 300],
  [-5, 120],
  [-5, 240],
].map(([e, b]) => viewFrom(e!, b!));

/** What is as wide as the shaft is seen square on: from a corner, a leg stands in front of it. */
const SQUARE_ON = [
  [8, 180],
  [20, 0],
  [20, 180],
  [0, 0],
  [0, 180],
  [8, 90],
  [8, 270],
  [-5, 0],
  [-5, 180],
].map(([e, b]) => viewFrom(e!, b!));

/** Rope seen across its two pairs of falls: along Z they stand apart. */
const ALONG_THE_FALLS = [
  [8, 0],
  [8, 180],
  [15, 180],
  [25, 0],
  [25, 180],
  [0, 0],
  [0, 180],
  [-5, 0],
  [-5, 180],
].map(([e, b]) => viewFrom(e!, b!));

/** What rides on the weight, whose line of sight changes with the height (`rig/sight.ts`), and what else it tries. */
const RIDING: Partial<Record<TowerId, THREE.Vector3[]>> = {
  'hook-block': ROUND_THE_SHAFT,
  'weight-carrier': SQUARE_ON,
  'concrete-block': SQUARE_ON,
  'stack-tie': SQUARE_ON,
  'guide-shoe': SQUARE_ON,
  'safety-gear': SQUARE_ON,
};

/** The camera's half field of view, as the kit has it (`fov` 40°), and the paddings the sight is tested at: the app's frame and the voice's. */
const SIN_HALF_FOV = Math.sin((20 * Math.PI) / 180);
const SIGHT_PADDINGS = [2.4, 1.9] as const;
/** What is not tested for the sight: thin, far from the line of sight, or the head frame, which comes in by its own steel. */
const THIN_TO_THE_EYE: TowerId[] = [
  'head-frame',
  'hoist-rope',
  'foundation-pad',
  'end-buffer',
  'service-ladder',
  'hook-block',
];
/** How much of the falls the rope's frame holds above the hook block's axle, and how far above it its name's dot stands, m. */
const ROPE_FRAME_UP = 2.2;
const ROPE_DOT_UP = 3;

/** The rope at the top of the stroke: what is left of it hangs inside the ring beam, and all the rest lies on the drum. The stretch of the deck that holds both, and from where. */
export const ROPE_ON_DRUM = {
  frame: zone(-0.35, 1.15, LEG_TOP, DECK_TOP + 0.75, -0.3, 0.7),
  viewDir: viewFrom(25, 160),
} as const;

export function createTowerScene(): TowerScene {
  const scene = workshopScene({
    name: 'tower',
    fog: TOWER_FOG,
    key: [20, 44, 26],
    target: [0, 12, 0],
    shadowHalf: 24,
    shadowFar: 110,
  });
  scene.add(fadeFloor(paperFloor(62, 8, PAD_BOTTOM), 14, 52));
  const contact = contactShadow(PAD.side, PAD.side, 1.4, 0.5);
  contact.position.y = PAD_BOTTOM + 0.004;
  scene.add(contact);

  const machine = buildMachine({ wear: 7 });
  scene.add(machine.root);

  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: (typeof TOWER_PARTS)[number], x: number, y: number, z: number) => {
    anchors[id] = anchor(machine.parts[id], x, y, z, `${id}-label`);
    anchors[id].userData.keep = true;
  };
  // the labels of what is low are spread over the height of the sling: at the overview they cannot all be side by side
  // near the top of the stroke the block, the rope and the head frame's names all come together: 1.6 m apart they keep to their rows at the overview
  at('head-frame', 1.1, TOWER.eavesY + 0.4, TOWER.legX);
  at('hook-block', 0.3, SADDLE_Y0, 0.25);
  // moved every frame: on fall 1, above the hook block, then on the return sheave (`update`)
  at('hoist-rope', -0.18, 14, 0.18);
  at('concrete-block', BLOCK.length / 2, SADDLE_Y0 - 1.6, BLOCK.length / 2);
  at('guide-rail', -RAIL.x, 10.5, 0);
  // on the pad's near edge, left of the corner: the toolbar covers what is lower, and the label reads to the right of its dot
  at('foundation-pad', -1.2, PAD_TOP, PAD.side / 2 - 0.15);
  at('weight-carrier', 1.04, 2.45, 0);
  at('stack-tie', -0.83, CROSSHEAD_TOP_Y0 - 0.25, 0.83);
  // on the upper left shoe, under the hook's name
  at('guide-shoe', -(CARRIER.uprightX + 0.15), CROSSHEAD_Y0 - SHOE.topGap - SHOE.h / 2, SHOE.w / 2);
  at('safety-gear', 1.1, 1.2, 0);
  at('end-buffer', -0.6, 0.3, 0.6);
  at('tower-leg', -TOWER.legX, 20, TOWER.legX);
  at('tower-bracing', TOWER.legX, 17, 0.3);
  at('service-ladder', LADDER.x, 12.4, LADDER.z);
  at('height-scale', SCALE.x, RULER_ZERO + 10.6, SCALE.z);

  const registry = new PartRegistry();
  for (const id of TOWER_PARTS)
    registry.add(id, machine.parts[id], machine.explode[id], machine.custom[id], FRAMING[id]);

  // ---- the rope is one piece, from the socket to its last turn on the drum: here, where the drum is no part, what is wound on it belongs to the rope. It is outlined, picked and isolated with it
  const headEntry = registry.get('head-frame')!;
  const ropeEntry = registry.get('hoist-rope')!;
  const wound = machine.hoist.wound;
  headEntry.meshes.splice(headEntry.meshes.indexOf(wound), 1);
  wound.userData.ownerPart = 'hoist-rope';
  ropeEntry.meshes.push(wound);

  // ---- what can stand between the camera and what rides on the weight: the lattice and the steel of the head frame, not the thousands of triangles of the hoist, far above it
  const under = (m: THREE.Object3D, top: THREE.Object3D): boolean => {
    for (let p: THREE.Object3D | null = m; p; p = p.parent) if (p === top) return true;
    return false;
  };
  const headSteel = headEntry.meshes.filter((m) => !under(m, machine.hoist.root));
  const steelFor = (id: TowerId): THREE.Mesh[] => {
    const out = [...headSteel];
    for (const other of TOWER_PARTS) {
      if (other === id || THIN_TO_THE_EYE.includes(other)) continue;
      out.push(...registry.get(other)!.meshes);
    }
    return out;
  };
  const distancesFor = (box: THREE.Box3): number[] => {
    const r = box.getBoundingSphere(new THREE.Sphere()).radius;
    return SIGHT_PADDINGS.map((p) => (r * p) / SIN_HALF_FOV);
  };
  /** The kit reads a part's `viewDir` when it frames it, and only then: from here on it is worked out at that moment, for the height the weight is at. */
  const askedWhenFramed = (id: TowerId, read: () => THREE.Vector3): void => {
    let forced: THREE.Vector3 | undefined;
    Object.defineProperty(registry.get(id)!, 'viewDir', {
      configurable: true,
      enumerable: true,
      get: () => forced ?? read(),
      set: (v: THREE.Vector3 | undefined) => {
        forced = v;
      },
    });
  };
  for (const id of Object.keys(RIDING) as TowerId[]) {
    const dirs = [FRAMING[id].viewDir!, ...RIDING[id]!];
    const steel = steelFor(id);
    const points = partPoints(registry.get(id)!.meshes, id === 'hook-block' ? 16 : 10);
    // the hook block is small and in the open: all of it or another side. The safety gear rides inside the sling, and half of it is all there is to see
    const clear = id === 'hook-block' ? 0.85 : id === 'safety-gear' ? 0.45 : 0.7;
    askedWhenFramed(id, () => {
      const box = registry.frameBounds(id);
      return clearestDir(box.getCenter(new THREE.Vector3()), points(), dirs, distancesFor(box), steel, clear);
    });
  }

  // ---- the rope's frame goes where the hook block is: from there the four falls can be told apart. When the falls have gone up into the head frame it goes to the drum, where the rope now is
  const ropeFrame = ropeEntry.frame!;
  const ropeDirs = [FRAMING['hoist-rope'].viewDir!, ...ALONG_THE_FALLS];
  const ropeSteel = steelFor('hoist-rope');
  const inSight = { high: false };
  askedWhenFramed('hoist-rope', () => {
    if (inSight.high) return ROPE_ON_DRUM.viewDir;
    const [f1, f2, f3, f4] = machine.rope.ends;
    const points: THREE.Vector3[] = [];
    for (const f of [f1!, f2!, f3!, f4!]) {
      // from the end at the hook, a third and two thirds of what the frame holds
      const low = f.a.y < f.b.y ? f.a : f.b;
      const high = f.a.y < f.b.y ? f.b : f.a;
      const span = high.y - low.y;
      for (const up of [0.8, 1.6]) points.push(low.clone().lerp(high, Math.min(1, up / Math.max(span, 1e-6))));
    }
    return clearestDir(ropeFrame.getCenter(new THREE.Vector3()), points, ropeDirs, distancesFor(ropeFrame), ropeSteel);
  });

  // ---- "Flows": the rope running, in dots
  const flows = new RopeFlows(scene, machine, { counts: [26, 44, 18] });
  machine.update(
    {
      zFraction: 0,
      blocks: 6,
      halves: 2,
      drumAngle: 0,
      sheaveAngle: 0,
      motorAngle: 0,
      brakeReleased: false,
      safetyGearSet: false,
      motorBlur: false,
      motorRpm: 0,
    } as GravityState,
    0,
    { slowMo: 1, cutaway: false, schematic: false, time: 0 },
  );

  const mod: TowerScene = {
    id: 'tower',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    machine,
    flows: flows.dots,
    // nearly square on the +Z face: from there the legs stand clear of the stack, the rails and the rope
    home: { position: V(12, 17, 37), target: V(0, 13.2, 0) },
    minDistance: 1.2,
    maxDistance: TOWER_CAMERA.max,
    near: TOWER_CAMERA.near,
    far: TOWER_CAMERA.far,
    homePadding: 1.2,
    declutter: true,
    update(s, dt, view) {
      machine.blurAllowed.fan = machine.blurAllowed.gears = registry.get('head-frame')!.display !== 'hidden';
      machine.update(s, dt, view);
      holdScenery(machine, registry);
      // two metres and a half of the falls, just above the hook block, as long as they are under the head frame; then the drum, where the rope has gone
      const [f1, f2, f3, f4] = machine.rope.ends as [FallEnds, FallEnds, FallEnds, FallEnds];
      const hookY = (f1.b.y + f4.a.y) / 2;
      inSight.high = hookY + ROPE_FRAME_UP > LEG_TOP;
      if (inSight.high) ropeFrame.copy(ROPE_ON_DRUM.frame);
      else {
        ropeFrame.min.set(-0.5, hookY - 0.3, -0.35);
        ropeFrame.max.set(0.5, hookY + ROPE_FRAME_UP, 0.35);
      }
      // its name stays on the rope: on fall 1, three metres above the hook block, or over the return sheave
      const dot = anchors['hoist-rope']!.position;
      if (inSight.high) dot.set((f2.b.x + f3.a.x) / 2, f2.b.y + HOOK_BLOCK.sheaveR + 0.02, f2.b.z);
      else dot.lerpVectors(f1.b, f1.a, Math.min(LEG_TOP - 0.2 - hookY, ROPE_DOT_UP) / Math.max(f1.a.y - f1.b.y, 1e-6));
      flows.update(s, dt, view.schematic && !partsNow(registry).hidden);
    },
  };
  return mod;
}
