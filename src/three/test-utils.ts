import * as THREE from 'three';
import type { PartRegistry, ViewOpts } from '@onigam/lab-kit/three';
import { GravitySim } from '../sim/engine';
import type { GravityParams, GravityState } from '../sim/types';

// Helpers of the 3D tests: view options, simulation states, bounding boxes of what is drawn.

export const view = (patch: Partial<ViewOpts> = {}): ViewOpts => ({
  slowMo: 1,
  cutaway: false,
  schematic: false,
  time: 1,
  ...patch,
});

/** A state of the simulation after some running; `params` edits the simulation first, `over` overrides fields of the state (extreme poses). */
export function stateWith(
  over: Partial<GravityState> = {},
  params: Partial<GravityParams> = {},
  seconds = 0.2,
): GravityState {
  const sim = new GravitySim();
  sim.set(params);
  for (let i = 0; i < 60 * seconds; i++) sim.step(1 / 60);
  return { ...sim.state, ...over };
}

/** The box of an object's meshes (precise), everything under it. */
export const boxOf = (o: THREE.Object3D): THREE.Box3 => {
  o.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(o, true);
};

/** Distance between two boxes, m: 0 if they touch. */
export function gap(a: THREE.Box3, b: THREE.Box3): number {
  const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x);
  const dy = Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y);
  const dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z);
  return Math.hypot(dx, dy, dz);
}

export const world = (o: THREE.Object3D): THREE.Vector3 => {
  o.updateWorldMatrix(true, false);
  return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
};

/** True when every object of the tree has finite transforms and finite first vertices. */
export function finiteTree(root: THREE.Object3D): boolean {
  let ok = true;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const v = [
      o.position.x,
      o.position.y,
      o.position.z,
      o.rotation.x,
      o.rotation.y,
      o.rotation.z,
      o.scale.x,
      o.scale.y,
      o.scale.z,
    ];
    if (!v.every(Number.isFinite)) ok = false;
    const m = (o as THREE.Mesh).geometry?.attributes?.position;
    if (m && !(Number.isFinite(m.array[0]) && Number.isFinite(m.array[m.array.length - 1]))) ok = false;
  });
  return ok;
}

export function isolateOne(reg: PartRegistry, id: string, mode: 'hidden' | 'ghost'): void {
  for (const other of reg.ids()) reg.setDisplay(other, other === id ? 'solid' : mode);
}

/** Draw calls (visible meshes, each instanced mesh once) and triangles (instances counted) of a scene, as the colour pass would issue them. */
export function drawStats(root: THREE.Object3D): { calls: number; triangles: number } {
  let calls = 0;
  let triangles = 0;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return;
    const g = m.geometry;
    const n =
      (g.drawRange.count === Infinity ? (g.index ? g.index.count : g.attributes.position.count) : g.drawRange.count) /
      3;
    const inst = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1;
    calls++;
    triangles += n * inst;
  });
  return { calls, triangles };
}
