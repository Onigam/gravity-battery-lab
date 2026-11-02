import * as THREE from 'three';
import { PartRegistry } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { GravityState } from '../../sim/types';
import { fadeFloor, paperFloor, type FlowDots } from '../common';
import { contactShadow } from '../detail';
import {
  BLOCK,
  CROSSHEAD_TOP_Y0,
  DECK_TOP,
  LADDER,
  PAD,
  PAD_BOTTOM,
  PAD_TOP,
  RAIL,
  SADDLE_Y0,
  SCALE,
  TOWER,
  levelY,
} from '../dims';
import { buildMachine, holdScenery, partsNow, TOWER_PARTS, type Machine, type TowerId } from '../rig/machine';
import { RopeFlows } from '../rig/rope-flows';
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

/**
 * What selecting a part brings the camera to, and from where (kit 0.6.0). A leg or a rail is 25 m long and its box a tower: what can be read of it is a stretch of it, seen from where nothing
 * stands in front. A part that rides on the weight keeps its own box, which follows it. The envelope and a part shown alone keep the whole part.
 */
export const FRAMING: Partial<Record<TowerId, PartFraming>> = {
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
    frame: zone(SCALE.x - 0.25, SCALE.x + 0.25, 6.8, 9, SCALE.z - 0.1, SCALE.z + 0.1),
    viewDir: viewFrom(8, 15),
  },
  'hoist-rope': { frame: zone(-0.5, 0.5, 5, 7.4, -0.35, 0.35), viewDir: viewFrom(20, 0) },
  'hook-block': { viewDir: viewFrom(8, 30) },
  'safety-gear': { viewDir: viewFrom(8, 0) },
  'guide-shoe': { viewDir: viewFrom(8, 0) },
  'stack-tie': { viewDir: viewFrom(8, 80) },
  'weight-carrier': { viewDir: viewFrom(8, 0) },
  'concrete-block': { viewDir: viewFrom(30, 0) },
};

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
  at('head-frame', 1.1, DECK_TOP + 1.2, TOWER.legX);
  at('hook-block', 0.3, SADDLE_Y0 + 0.75, 0.25);
  at('hoist-rope', -0.18, 14, 0.18);
  at('concrete-block', BLOCK.length / 2, SADDLE_Y0 - 1.0, BLOCK.length / 2);
  at('guide-rail', -RAIL.x, 10.5, 0);
  // on the pad's near edge, left of the corner: the toolbar covers what is lower, and the label reads to the right of its dot
  at('foundation-pad', -1.2, PAD_TOP, PAD.side / 2 - 0.15);
  at('weight-carrier', 1.04, 2.45, 0);
  at('stack-tie', -0.83, CROSSHEAD_TOP_Y0 - 0.25, 0.83);
  at('guide-shoe', -1.1, CROSSHEAD_TOP_Y0 + 0.9, 0);
  at('safety-gear', 1.1, 1.2, 0);
  at('end-buffer', -0.6, 0.3, 0.6);
  at('tower-leg', -TOWER.legX, 20, TOWER.legX);
  at('tower-bracing', TOWER.legX, 17, 0.3);
  at('service-ladder', LADDER.x, 12.4, LADDER.z);
  at('height-scale', SCALE.x, 8.9, SCALE.z);

  const registry = new PartRegistry();
  for (const id of TOWER_PARTS)
    registry.add(id, machine.parts[id], machine.explode[id], machine.custom[id], FRAMING[id]);
  // the rope's frame goes where the hook block is: from there the four falls can be told apart
  const ropeFrame = registry.get('hoist-rope')!.frame!;

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
      // two metres and a half of the falls, just above the hook block
      const [f1, , , f4] = machine.rope.ends;
      const hookY = (f1.b.y + f4.a.y) / 2;
      ropeFrame.min.set(-0.5, hookY - 0.3, -0.35);
      ropeFrame.max.set(0.5, hookY + 2.2, 0.35);
      flows.update(s, dt, view.schematic && !partsNow(registry).hidden);
    },
  };
  return mod;
}
