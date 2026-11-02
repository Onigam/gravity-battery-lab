import * as THREE from 'three';
import { clamp } from '@onigam/lab-kit/three';
import type { GravityState } from '../../sim/types';
import { FlowDots } from '../common';
import { HOOK_BLOCK } from '../dims';
import type { Machine } from './machine';

// "Flows" in the `tower` and `hoist` worlds: the rope running, in dots, read each frame from the ends of the falls, so that they stay on the rope in the exploded view too. The rope
// comes up fall 3, over the return sheave, down fall 2, round sheave A and up fall 1 to the drum: 2 v on falls 2 and 3, 4 v on fall 1, nothing on fall 4, which ends on the socket.

export interface RopeFlowOptions {
  /** Dots on fall 1, on falls 3 and 2, on fall 4. */
  counts: [number, number, number];
  /** How far down the shaft to draw, m: a world that looks at the deck keeps its dots where the eye is. */
  floorY?: number;
  /** Carry fall 1's dots half a turn onto the drum, where a world shows it close up. */
  onDrum?: boolean;
}

const ARC_STEPS = 12;

export class RopeFlows {
  readonly dots: FlowDots;
  private readonly one: number;
  private readonly over: number;
  private readonly four: number;

  constructor(
    scene: THREE.Scene,
    private readonly machine: Machine,
    private readonly o: RopeFlowOptions,
  ) {
    const [a, b, c] = o.counts;
    this.dots = new FlowDots(a + b + c, { color: 0xff8a3d, size: 5, pixels: true, throughWalls: true, opacity: 0.95 });
    scene.add(this.dots.object);
    // the points are replaced on the first frame; the dots keep their share of the length
    const unit = () => [new THREE.Vector3(), new THREE.Vector3(0, 1, 0)];
    this.one = this.dots.addPath(unit(), a);
    this.over = this.dots.addPath(unit(), b);
    this.four = this.dots.addPath(unit(), c);
  }

  /** The three paths, in the machine's frame, each in the direction the rope runs while raising. */
  paths(): { one: THREE.Vector3[]; over: THREE.Vector3[]; four: THREE.Vector3[] } {
    const [f1, f2, f3, f4] = this.machine.rope.ends;
    const low = this.o.floorY;
    // the end of a fall that lies below the floor, brought up to it along the fall
    const cut = (from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 => {
      if (low === undefined || from.y >= low) return from.clone();
      return from.clone().lerp(to, Math.min(1, (low - from.y) / (to.y - from.y)));
    };
    // over the return sheave, from fall 3's side (+X) to fall 2's (−X)
    const c = f3.a.clone().add(f2.b).multiplyScalar(0.5);
    const R = HOOK_BLOCK.sheaveR;
    const arc: THREE.Vector3[] = [];
    for (let i = 0; i <= ARC_STEPS; i++) {
      const t = (i / ARC_STEPS) * Math.PI;
      arc.push(new THREE.Vector3(c.x + R * Math.cos(t), c.y + R * Math.sin(t), c.z));
    }
    const one = [cut(f1.b, f1.a), f1.a.clone()];
    if (this.o.onDrum) {
      // up the side of the drum it leaves and over its top
      const axis = this.machine.drumAxisInRoot();
      const r = axis.z - f1.a.z;
      for (let i = 1; i <= ARC_STEPS; i++) {
        const t = (i / ARC_STEPS) * Math.PI;
        one.push(new THREE.Vector3(f1.a.x, axis.y + r * Math.sin(t), axis.z - r * Math.cos(t)));
      }
    }
    return {
      one,
      over: [cut(f3.b, f3.a), ...arc, cut(f2.a, f2.b)],
      four: [cut(f4.a, f4.b), f4.b.clone()],
    };
  }

  update(s: GravityState, dt: number, on: boolean): void {
    this.dots.object.visible = on;
    if (!on) return;
    const p = this.paths();
    this.dots.setPath(this.one, p.one);
    this.dots.setPath(this.over, p.over);
    this.dots.setPath(this.four, p.four);
    // rope speeds: 4 v and 2 v, capped for the eye. Direction of the state's raising along each path.
    const u = clamp(s.v * 4, -3, 3);
    this.dots.advance(this.one, u, dt);
    this.dots.advance(this.over, u / 2, dt);
    this.dots.advance(this.four, 0, dt);
    this.dots.place();
  }
}
