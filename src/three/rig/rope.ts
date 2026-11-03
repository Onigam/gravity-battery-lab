import * as THREE from 'three';
import { group, mesh } from '@onigam/lab-kit/three';
import { DRUM_R, HOOK_BLOCK, ROPE_R } from '../dims';
import type { MachineLook } from './look';
import { TAU, aimSegment, sweep, unitSegment } from './shapes';

// The rope. One rope, from the drum: fall 1 down to sheave A, under it, fall 2 up to the return sheave, over it, fall 3 down to sheave B, under it, fall 4 up to the socket. Four
// falls: the segments are aimed every frame between markers that belong to the parts they touch, so they stay on their sheaves when a part moves in the exploded view, and
// their length follows the lift. What lies on a sheave is an arc in the sheave's groove. The turns on the drum are in `hoist.ts`; the short bridge here joins them to fall 1.

/** The paint line's length on the rope, m (estimate: a hand's width, readable from the landing). */
const PAINT_LENGTH = 0.08;

export interface RopePoints {
  /** Where fall 1 leaves the drum, and where the wound rope's last drawn ring is. */
  departure: THREE.Vector3;
  woundEnd: THREE.Vector3;
  axisA: THREE.Vector3;
  axisB: THREE.Vector3;
  axisReturn: THREE.Vector3;
  anchor: THREE.Vector3;
}

export interface FallEnds {
  a: THREE.Vector3;
  b: THREE.Vector3;
}

export class Rope {
  readonly root: THREE.Group;
  readonly falls: THREE.Mesh[] = [];
  readonly bridge: THREE.Mesh;
  readonly arcA: THREE.Mesh;
  readonly arcB: THREE.Mesh;
  readonly arcReturn: THREE.Mesh;
  /** The line of paint on the rope at the socket's mouth, told by the rope anchor's sheet: slipping shows between it and the socket. */
  readonly paintLine: THREE.Mesh;
  /** The two ends of each fall, last placed, in the frame of the machine. */
  readonly ends: FallEnds[];
  private readonly paintFrom = new THREE.Vector3();

  constructor(look: MachineLook) {
    this.root = group('hoist-rope');
    this.root.userData.dynamic = true;
    const seg = unitSegment(8);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(seg, look.rope);
      m.name = `fall-${i + 1}`;
      m.castShadow = false;
      m.receiveShadow = false;
      m.userData.noShadow = true;
      m.frustumCulled = false;
      this.root.add(m);
      this.falls.push(m);
    }
    this.paintLine = new THREE.Mesh(seg, look.scaleLight);
    this.paintLine.name = 'paint-line';
    this.paintLine.frustumCulled = false;
    this.paintLine.userData.noShadow = true;
    this.root.add(this.paintLine);
    this.bridge = new THREE.Mesh(seg, look.ropeWound);
    this.bridge.frustumCulled = false;
    this.bridge.userData.noShadow = true;
    this.root.add(this.bridge);
    const R = HOOK_BLOCK.sheaveR;
    // under a hook sheave: from +Z by the bottom to −Z
    const under: THREE.Vector3[] = [];
    const over: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      under.push(new THREE.Vector3(0, -R * Math.sin(a), R * Math.cos(a)));
      over.push(new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), 0));
    }
    const geoUnder = sweep(under, ROPE_R, 8);
    const geoOver = sweep(over, ROPE_R, 8);
    const arc = (g: THREE.BufferGeometry): THREE.Mesh => {
      const m = mesh(g, look.ropeWound);
      m.castShadow = false;
      m.userData.noShadow = true;
      this.root.add(m);
      return m;
    };
    this.arcA = arc(geoUnder);
    this.arcB = arc(geoUnder);
    this.arcReturn = arc(geoOver);
    this.ends = [0, 1, 2, 3].map(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }));
  }

  /** Put every piece of rope in place. All the points in the frame of the machine. */
  place(p: RopePoints): void {
    const R = HOOK_BLOCK.sheaveR;
    const set = (i: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
      const e = this.ends[i];
      e.a.set(ax, ay, az);
      e.b.set(bx, by, bz);
      aimSegment(this.falls[i], e.a, e.b, ROPE_R);
    };
    // the drum to sheave A's +Z side
    set(0, p.departure.x, p.departure.y, p.departure.z, p.axisA.x, p.axisA.y, p.axisA.z + R);
    // sheave A's −Z side to the return sheave's −X side
    set(1, p.axisA.x, p.axisA.y, p.axisA.z - R, p.axisReturn.x - R, p.axisReturn.y, p.axisReturn.z);
    // the return sheave's +X side to sheave B's −Z side
    set(2, p.axisReturn.x + R, p.axisReturn.y, p.axisReturn.z, p.axisB.x, p.axisB.y, p.axisB.z - R);
    // sheave B's +Z side to the socket
    set(3, p.axisB.x, p.axisB.y, p.axisB.z + R, p.anchor.x, p.anchor.y, p.anchor.z);
    const f4 = this.ends[3]!;
    this.paintFrom.copy(f4.b).lerp(f4.a, Math.min(1, PAINT_LENGTH / Math.max(f4.a.distanceTo(f4.b), 1e-6)));
    aimSegment(this.paintLine, f4.b, this.paintFrom, ROPE_R * 1.15);
    this.arcA.position.copy(p.axisA);
    this.arcB.position.copy(p.axisB);
    this.arcReturn.position.copy(p.axisReturn);
    aimSegment(this.bridge, p.woundEnd, p.departure, ROPE_R);
  }

  /** Length of rope in the falls, m. */
  fallsLength(): number {
    return this.ends.reduce((a, e) => a + e.a.distanceTo(e.b), 0);
  }
}

/** Shortest turn from one wrapped angle to another. */
export const shortestTurn = (from: number, to: number): number => {
  const d = (to - from) % TAU;
  return d > Math.PI ? d - TAU : d < -Math.PI ? d + TAU : d;
};

export const drumCircumference = (): number => TAU * DRUM_R;
