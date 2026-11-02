import * as THREE from 'three';
import { PartRegistry } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { GravityState } from '../../sim/types';
import { DECK_TOP, DRUM_Z, FOOT_X, FRAME_FRONT, GOVERNOR, HOIST, HOIST_X, HOOK_BLOCK, MOTOR_Z } from '../dims';
import type { FlowDots } from '../common';
import { buildMachine, holdScenery, partsNow, type Machine } from '../rig/machine';
import { HOIST_PARTS, type HoistId } from '../rig/hoist';
import { RopeFlows } from '../rig/rope-flows';
import { anchor, hotspots, viewFrom, workshopScene, type HotspotDef } from '../world';
import { HoistCut } from './cut';

// The `hoist` world: up at the top of the tower, on its own head frame. It is the very machine of the `tower` world, built by the same function at the same place (the tower
// below it fades in the paper's fog, its rope goes down the shaft). The little roof is taken off to look down on it. 13 parts, in force order; the section is the plane of the
// two axes, the exploded view keeps to X and Z so that the plane stays right for every part, and the rope follows.

const HOTSPOTS: HotspotDef[] = [
  { id: 'hoist-motor', fr: 'Moteur-générateur', en: 'Motor-generator' },
  { id: 'hoist-gearbox', fr: 'Réducteur', en: 'Gearbox' },
  { id: 'rope-drum', fr: 'Tambour', en: 'Rope drum' },
  { id: 'service-brake', fr: 'Frein de service', en: 'Service brake' },
  { id: 'return-sheave', fr: 'Poulie de renvoi', en: 'Return sheave' },
  // at the machine's far end: a label reads to the right of its dot, so at 768 and 390 px this one ran off the view (kit request 19). It shows when selected, or with all the labels
  { id: 'drum-brake', fr: 'Frein de tambour', en: 'Drum brake', minor: true },
  { id: 'motor-encoder', fr: 'Codeur', en: 'Encoder', minor: true },
  { id: 'rope-guide', fr: 'Guide-câble', en: 'Rope guide', minor: true },
  { id: 'rope-anchor', fr: 'Point fixe du câble', en: 'Rope anchor', minor: true },
  { id: 'overload-cell', fr: 'Limiteur de charge', en: 'Overload cell', minor: true },
  { id: 'limit-switch', fr: 'Fin de course', en: 'Limit switch', minor: true },
  { id: 'overspeed-governor', fr: 'Limiteur de vitesse', en: 'Overspeed governor', minor: true },
  { id: 'hoist-base', fr: 'Châssis du treuil', en: 'Hoist base', minor: true },
];

/** Explode offsets, metres: along the motor's axis for what is on it, across for the rest. Y stays 0 (the section's plane must stay right). */
export const EXPLODE: Record<HoistId, [number, number, number]> = {
  'hoist-base': [0, 0, 0],
  'rope-drum': [0.25, 0, 0],
  'hoist-gearbox': [-1.15, 0, 0],
  'hoist-motor': [0.3, 0, 0.9],
  'service-brake': [0.75, 0, 0.9],
  'motor-encoder': [1.2, 0, 0.9],
  'drum-brake': [1.25, 0, 0],
  'limit-switch': [1.75, 0, 0],
  'rope-guide': [0, 0, -0.95],
  'return-sheave': [-0.2, 0, -1.25],
  'rope-anchor': [0.55, 0, -0.75],
  'overload-cell': [0.95, 0, -0.85],
  'overspeed-governor': [0.55, 0, 1.15],
};

/** Where to look at a part from when it is selected, where the home direction has something in front of it (kit 0.6.0). The rope anchor is under its beam: it is seen from below the deck. */
export const FRAMING: Partial<Record<HoistId, PartFraming>> = {
  'rope-anchor': { viewDir: viewFrom(-30, 80) },
  'drum-brake': { viewDir: viewFrom(20, 0) },
  'service-brake': { viewDir: viewFrom(8, 0) },
  'rope-guide': { viewDir: viewFrom(55, 0) },
  'overload-cell': { viewDir: viewFrom(30, 160) },
};

export interface HoistScene extends SceneModule<GravityState> {
  machine: Machine;
  cut: HoistCut;
  flows: FlowDots;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function createHoistScene(): HoistScene {
  const y = DECK_TOP;
  const scene = workshopScene({
    name: 'hoist',
    fog: [17, 36],
    key: [-2.6, y + 8, -5],
    target: [0.4, y + 0.2, 0.3],
    shadowHalf: 6,
    shadowFar: 26,
  });
  const machine = buildMachine({ clipped: true, wear: 26 });
  scene.add(machine.root);
  machine.roof.visible = false;

  const anchors: Record<string, THREE.Object3D> = {};
  const parts = machine.hoist.parts;
  const at = (id: HoistId, px: number, py: number, pz: number) => {
    anchors[id] = anchor(parts[id], px, py, pz, `${id}-label`);
    anchors[id].userData.keep = true;
  };
  const A = HOIST.axisY;
  // the home view looks down from the motor's side, and labels read to the right of their dots: motor and brake on their near flanks, the drum further along, so that each has its row
  at('hoist-motor', HOIST_X(0.62), A + 0.05, MOTOR_Z + 0.185);
  at('hoist-gearbox', HOIST_X(0.05), A + 0.25, DRUM_Z);
  at('rope-drum', HOIST_X(1.62), A + 0.17, DRUM_Z - 0.1);
  at('service-brake', HOIST_X(1.1), A - 0.06, MOTOR_Z + 0.15);
  at('drum-brake', HOIST_X(HOIST.discAt), A + 0.34, DRUM_Z + 0.12);
  at('return-sheave', -0.2, A + 0.22, -HOOK_BLOCK.sheaveR);
  at('motor-encoder', HOIST_X(1.3), A - 0.03, MOTOR_Z + 0.04);
  at('rope-guide', HOIST_X(1.85), A + 0.22, DRUM_Z - 0.12);
  at('rope-anchor', HOOK_BLOCK.sheaveX + 0.05, 0.2, 0.0);
  at('overload-cell', HOOK_BLOCK.sheaveX, HOIST.beamTop + 0.15, 0.06);
  at('limit-switch', HOIST_X(2.52), A - 0.05, DRUM_Z - 0.12);
  at('overspeed-governor', GOVERNOR.x, GOVERNOR.topY + 0.34, GOVERNOR.z);
  at('hoist-base', FOOT_X[1], 0.05, FRAME_FRONT);

  const cut = new HoistCut();
  for (const id of HOIST_PARTS) cut.attach(id, parts[id], machine.hoist.cuts[id]);

  const registry = new PartRegistry();
  for (const id of HOIST_PARTS) registry.add(id, parts[id], V(...EXPLODE[id]), undefined, FRAMING[id]);

  // X-ray looks through the shells; what is in them stays solid (the gears, the rotor, the stator): a shell is a painted surface, the rest is what it hides.
  // (a painted surface is the family of low metalness)
  const inner: { id: HoistId; meshes: THREE.Mesh[] }[] = (
    ['hoist-gearbox', 'hoist-motor', 'service-brake'] as HoistId[]
  ).map((id) => ({
    id,
    meshes: registry
      .get(id)!
      .meshes.filter((m) => (m.userData.solidMaterial as THREE.MeshStandardMaterial).metalness > 0.3),
  }));

  // "Flows": the rope running, as in the `tower` world, kept to what this world looks at: from a little under the deck to the drum. Fall 4 stays still: it ends on the socket
  const flows = new RopeFlows(scene, machine, { counts: [14, 20, 4], floorY: y - 0.5, onDrum: true });

  const mod: HoistScene = {
    id: 'hoist',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    machine,
    cut,
    flows: flows.dots,
    // from above the motor's side: the motor and its brake near, the drum behind them, the gearbox on the left, nothing in front (a roof's posts stood here: they left with it)
    home: { position: V(0.42 + 1.4, y + 0.3 + 5, 0.32 + 2.6), target: V(0.42, y + 0.3, 0.32) },
    minDistance: 0.35,
    maxDistance: 22,
    homePadding: 1.12,
    declutter: true,
    update(s, dt, view) {
      machine.blurAllowed.fan = registry.get('hoist-motor')!.display !== 'hidden';
      machine.blurAllowed.gears = registry.get('hoist-gearbox')!.display !== 'hidden';
      machine.update(s, dt, view);
      holdScenery(machine, registry, { rope: true });
      flows.update(s, dt, view.schematic && !partsNow(registry).hidden);
      cut.update(view.cutaway, registry);
      // the shells' insides stay solid under X-ray while nothing is selected (a selected part's X-ray ghosts every other part entirely)
      let solids = 0;
      for (const id of registry.ids()) if (registry.get(id)!.display === 'solid') solids++;
      const shellMode = solids > 1;
      for (const { id, meshes } of inner) {
        const ghost = registry.get(id)!.display === 'ghost';
        if (ghost && shellMode) for (const m of meshes) m.material = m.userData.solidMaterial;
      }
    },
  };
  return mod;
}
