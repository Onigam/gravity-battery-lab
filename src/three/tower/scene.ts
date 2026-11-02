import * as THREE from 'three';
import { PartRegistry, clamp } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { GravityState } from '../../sim/types';
import { paperFloor, FlowDots } from '../common';
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
} from '../dims';
import { buildMachine, TOWER_PARTS, type Machine } from '../rig/machine';
import { anchor, hotspots, workshopScene, type HotspotDef } from '../world';

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

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function createTowerScene(): TowerScene {
  const scene = workshopScene({
    name: 'tower',
    // the camera's far plane in a world that is not the site is 60 m (kit): the fog closes before it
    fog: [48, 59],
    key: [20, 44, 26],
    target: [0, 12, 0],
    shadowHalf: 24,
    shadowFar: 110,
  });
  scene.add(paperFloor(62, 8, PAD_BOTTOM));
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
  at('foundation-pad', PAD.side / 2, PAD_TOP - 0.5, PAD.side / 2);
  at('weight-carrier', 1.04, 2.45, 0);
  at('stack-tie', -0.83, CROSSHEAD_TOP_Y0 - 0.25, 0.83);
  at('guide-shoe', -1.1, CROSSHEAD_TOP_Y0 + 0.9, 0);
  at('safety-gear', 1.1, 1.2, 0);
  at('end-buffer', -0.6, 0.3, 0.6);
  at('tower-leg', -TOWER.legX, 20, TOWER.legX);
  at('tower-bracing', TOWER.legX, 7.6, 0.3);
  at('service-ladder', LADDER.x, 12.4, LADDER.z);
  at('height-scale', SCALE.x, 8.9, SCALE.z);

  const registry = new PartRegistry();
  for (const id of TOWER_PARTS) registry.add(id, machine.parts[id], machine.explode[id], machine.custom[id]);

  // ---- "Flows": the rope running, in dots: up fall 1; over the return sheave from fall 3 to fall 2; fall 4 does not move
  const flows = new FlowDots(90, { color: 0xff8a3d, size: 5, pixels: true, throughWalls: true, opacity: 0.95 });
  scene.add(flows.object);
  const paths = () => {
    const [f1, f2, f3, f4] = machine.rope.ends;
    return { one: [f1.b, f1.a], over: [f3.b, f3.a, f2.b, f2.a], four: [f4.a, f4.b] };
  };
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
  const p0 = paths();
  const pOne = flows.addPath(
    p0.one.map((p) => p.clone()),
    26,
  );
  const pOver = flows.addPath(
    p0.over.map((p) => p.clone()),
    44,
  );
  const pFour = flows.addPath(
    p0.four.map((p) => p.clone()),
    18,
  );

  const mod: TowerScene = {
    id: 'tower',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    machine,
    flows,
    // nearly square on the +Z face: from there the legs stand clear of the stack, the rails and the rope
    home: { position: V(12, 17, 37), target: V(0, 13.2, 0) },
    minDistance: 1.2,
    maxDistance: 52,
    homePadding: 1.2,
    update(s, dt, view) {
      machine.update(s, dt, view);
      flows.object.visible = view.schematic;
      if (view.schematic) {
        const p = paths();
        flows.setPath(pOne, p.one);
        flows.setPath(pOver, p.over);
        flows.setPath(pFour, p.four);
        // rope speeds: 4 v and 2 v, capped for the eye. Direction of the state's raising along each path.
        const u = clamp(s.v * 4, -3, 3);
        flows.advance(pOne, u, dt);
        flows.advance(pOver, u / 2, dt);
        flows.advance(pFour, 0, dt);
        flows.place();
      }
    },
  };
  return mod;
}
