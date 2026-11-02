import * as THREE from 'three';
import { PartRegistry } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { GravityState } from '../../sim/types';
import { DECK_TOP, DRUM_Z, FOOT_X, FRAME_FRONT, GOVERNOR, HOIST, HOIST_X, HOOK_BLOCK, MOTOR_Z } from '../dims';
import { buildMachine, type Machine } from '../rig/machine';
import { HOIST_PARTS, type HoistId } from '../rig/hoist';
import { anchor, hotspots, workshopScene, type HotspotDef } from '../world';
import { HoistCut } from './cut';

// The `hoist` world: up at the top of the tower, on its own head frame. It is the very machine of the `tower` world, built by the same function at the same place (the tower
// below it fades in the paper's fog, its rope goes down the shaft). The little roof is taken off to look down on it. 13 parts, in force order; the section is the plane of the
// two axes, the exploded view keeps to X and Z so that the plane stays right for every part, and the rope follows.

const HOTSPOTS: HotspotDef[] = [
  { id: 'hoist-motor', fr: 'Moteur-générateur', en: 'Motor-generator' },
  { id: 'hoist-gearbox', fr: 'Réducteur', en: 'Gearbox' },
  { id: 'rope-drum', fr: 'Tambour', en: 'Rope drum' },
  { id: 'service-brake', fr: 'Frein de service', en: 'Service brake' },
  { id: 'drum-brake', fr: 'Frein de tambour', en: 'Drum brake' },
  { id: 'return-sheave', fr: 'Poulie de renvoi', en: 'Return sheave' },
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

export interface HoistScene extends SceneModule<GravityState> {
  machine: Machine;
  cut: HoistCut;
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
  // on the motor's flank, facing the camera of the home view: above it, its label ran over the service brake's
  at('hoist-motor', HOIST_X(0.62), A + 0.05, MOTOR_Z - 0.19);
  at('hoist-gearbox', HOIST_X(0.05), A + 0.25, DRUM_Z);
  at('rope-drum', HOIST_X(1.5), A + 0.17, DRUM_Z - 0.1);
  at('service-brake', HOIST_X(1.08), A + 0.2, MOTOR_Z + 0.05);
  at('drum-brake', HOIST_X(HOIST.discAt), A + 0.34, DRUM_Z + 0.12);
  at('return-sheave', -0.2, A + 0.22, -HOOK_BLOCK.sheaveR);
  at('motor-encoder', HOIST_X(1.3), A - 0.03, MOTOR_Z + 0.04);
  at('rope-guide', HOIST_X(1.85), A + 0.22, DRUM_Z - 0.12);
  at('rope-anchor', HOOK_BLOCK.sheaveX + 0.05, 0.0, 0.0);
  at('overload-cell', HOOK_BLOCK.sheaveX, HOIST.beamTop + 0.09, 0.06);
  at('limit-switch', HOIST_X(2.52), A - 0.05, DRUM_Z - 0.12);
  at('overspeed-governor', GOVERNOR.x, GOVERNOR.topY + 0.34, GOVERNOR.z);
  at('hoist-base', FOOT_X[1], 0.05, FRAME_FRONT);

  const cut = new HoistCut();
  for (const id of HOIST_PARTS) cut.attach(id, parts[id], machine.hoist.cuts[id]);

  const registry = new PartRegistry();
  for (const id of HOIST_PARTS) registry.add(id, parts[id], V(...EXPLODE[id]));

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

  const mod: HoistScene = {
    id: 'hoist',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    machine,
    cut,
    home: { position: V(-3.3, y + 3.6, -4.4), target: V(0.42, y + 0.3, 0.32) },
    minDistance: 0.35,
    maxDistance: 22,
    homePadding: 1.12,
    update(s, dt, view) {
      machine.update(s, dt, view);
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
