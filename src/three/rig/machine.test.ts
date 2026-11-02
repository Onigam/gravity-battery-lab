import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  AXLE_ABOVE_SADDLE,
  BLOCK,
  BUFFER,
  BUFFER_TOP,
  DECK_PLATE,
  DECK_TOP,
  DECK_Y0,
  DRUM_R,
  DRUM_Z,
  FOOT_X,
  FRAME_FRONT,
  GOVERNOR,
  HOIST,
  HOIST_X,
  HOOK_BLOCK,
  HOOK_APPROACH,
  LADDER,
  LEG_TOP,
  PAD_TOP,
  SADDLE_Y0,
  STACK,
  STROKE,
  TOWER,
} from '../dims';
import { boxOf, finiteTree, gap, stateWith, view, world } from '../test-utils';
import { buildMachine, type Machine } from './machine';
import { shortestTurn } from './rope';

const atLift = (m: Machine, zFraction: number) => m.update(stateWith({ zFraction }), 1 / 60, view());

describe('the rope runs where it should', () => {
  const m = buildMachine();

  it('there really are four falls, on three sheaves, with the drum at one end and the socket at the other', () => {
    atLift(m, 0.5);
    expect(m.rope.falls.length).toBe(4);
    const [f1, f2, f3, f4] = m.rope.ends;
    const R = HOOK_BLOCK.sheaveR;
    const A = world(m.hoist.drumAxis);
    // fall 1 starts on the drum's surface
    expect(f1.a.z).toBeCloseTo(A.z - DRUM_R, 3);
    expect(f1.a.y).toBeCloseTo(A.y, 3);
    // and lands on sheave A's side: same sheave, the two sides of its pitch circle
    expect(f1.b.distanceTo(f2.a)).toBeCloseTo(2 * R, 3);
    // fall 2 and 3 reach the return sheave, a diameter apart
    expect(f2.b.distanceTo(f3.a)).toBeCloseTo(2 * R, 3);
    // sheave B: fall 3 down to it, fall 4 up from it
    expect(f3.b.distanceTo(f4.a)).toBeCloseTo(2 * R, 3);
    // fall 4 ends at the socket's mouth
    expect(f4.b.distanceTo(world(m.hoist.anchorMouth))).toBeLessThan(0.003);
  });

  it('each fall hangs straight enough: the fleet of fall 1 stays small, the others are plumb within what the anchor offset gives', () => {
    for (const z of [0, 0.25, 0.5, 0.75, 1]) {
      atLift(m, z);
      const [f1, f2, f3, f4] = m.rope.ends;
      const lean = (e: { a: THREE.Vector3; b: THREE.Vector3 }) =>
        Math.atan2(Math.hypot(e.a.x - e.b.x, e.a.z - e.b.z), Math.abs(e.a.y - e.b.y));
      // about 4 degrees down the shaft (the drum is long); only in the last metres of the stroke, where the fall is short, is it more
      expect(lean(f1), `fall 1 at ${z}`).toBeLessThan(z === 1 ? 0.28 : 0.09);
      expect(lean(f2)).toBeLessThan(1e-3);
      expect(lean(f3)).toBeLessThan(1e-3);
      expect(lean(f4), `fall 4 at ${z}`).toBeLessThan(z === 1 ? 0.5 : 0.1);
    }
  });

  it('every fall changes length with the lift: 20 m of stroke, 20 m of each fall', () => {
    atLift(m, 0);
    const bottom = m.rope.ends.map((e) => e.a.distanceTo(e.b));
    atLift(m, 1);
    const top = m.rope.ends.map((e) => e.a.distanceTo(e.b));
    bottom.forEach((b, i) => expect(b - top[i], `fall ${i + 1}`).toBeGreaterThan(STROKE - 0.2));
    bottom.forEach((b, i) => expect(b - top[i], `fall ${i + 1}`).toBeLessThan(STROKE + 0.2));
  });

  it("the distance from the deck to the hook saddle is the model's length of a fall", () => {
    for (const z of [0, 0.3, 1]) {
      const s = stateWith({ zFraction: z, z: z * STROKE, fallLength: STROKE - z * STROKE + HOOK_APPROACH });
      m.update(s, 1 / 60, view());
      const saddleY = SADDLE_Y0 + m.weight.position.y;
      expect(DECK_TOP - saddleY).toBeCloseTo(s.fallLength, 3);
    }
  });

  it('the rope on the drum grows by four times the lift, and the rope leaves it where the guide is', () => {
    atLift(m, 0);
    const w0 = m.drawn.woundM;
    atLift(m, 1);
    const w1 = m.drawn.woundM;
    // within a turn: the drawn rope stays in step with the drum's angle
    const turn = 2 * Math.PI * DRUM_R;
    expect(Math.abs(w1 - w0 - 4 * STROKE)).toBeLessThan(1.3 * turn);
    expect(world(m.hoist.guide).x).toBeCloseTo(m.drawn.departureX, 5);
    expect(m.rope.ends[0].a.x).toBeCloseTo(m.drawn.departureX, 5);
  });

  it('the rope stays attached in the exploded view', () => {
    const e = buildMachine();
    atLift(e, 0.3);
    // what the tower world's explode does: the head frame up, the hook block up
    e.parts['head-frame'].position.copy(e.explode['head-frame']);
    e.parts['hook-block'].position.copy(e.explode['hook-block']);
    atLift(e, 0.3);
    const [f1, f2, f3, f4] = e.rope.ends;
    const R = HOOK_BLOCK.sheaveR;
    const A = world(e.hoist.drumAxis);
    expect(f1.a.y).toBeCloseTo(A.y, 3);
    expect(f1.b.distanceTo(f2.a)).toBeCloseTo(2 * R, 3);
    expect(f2.b.distanceTo(f3.a)).toBeCloseTo(2 * R, 3);
    expect(f3.b.distanceTo(f4.a)).toBeCloseTo(2 * R, 3);
    expect(f4.b.distanceTo(world(e.hoist.anchorMouth))).toBeLessThan(0.003);
  });
});

describe('things turn the right way', () => {
  const m = buildMachine();
  const step = (mm: Machine, drum: number) => {
    const s = stateWith({ drumAngle: drum, sheaveAngle: drum, zFraction: 0.5, brakeReleased: true });
    mm.update(s, 1 / 60, view());
  };

  it('raising: the drum winds the rope on, its rope side rising', () => {
    step(m, 0);
    const y0 = new THREE.Vector3(0, 0, -DRUM_R).applyEuler(m.hoist.drumRot.rotation);
    step(m, 0.1);
    const y1 = new THREE.Vector3(0, 0, -DRUM_R).applyEuler(m.hoist.drumRot.rotation);
    expect(y1.y).toBeGreaterThan(y0.y);
  });

  it('the sheaves turn with the rope that runs over them, at their own speed', () => {
    const before = { ...m.drawn };
    step(m, 0.2);
    const dA = m.drawn.sheaveA - before.sheaveA;
    const dB = m.drawn.sheaveB - before.sheaveB;
    const dR = m.drawn.sheaveReturn - before.sheaveReturn;
    // A: fall 1's side (+Z) rises; rotation.x < 0 raises +Z
    expect(dA).toBeLessThan(0);
    // B: fall 3's side (−Z) rises, so rotation.x > 0
    expect(dB).toBeGreaterThan(0);
    // the rim speeds of the reeving: 3, 2 and 1 for 4 on the drum
    expect(Math.abs(dA / dR)).toBeCloseTo(3 / 2, 3);
    expect(Math.abs(dA / dB)).toBeCloseTo(3, 3);
    // the return sheave, around Z, takes fall 2 going down on its −X side when raising
    const holder = m.hoist.returnRot.parent!;
    expect(holder.rotation.y).toBeCloseTo(Math.PI / 2, 5);
    expect(dR).toBeGreaterThan(0);
  });

  it('the motor turns against the drum, through an odd number of meshes', () => {
    const s = stateWith({ motorAngle: 1, drumAngle: 0.5, sheaveAngle: 0.5, zFraction: 0.2 });
    m.update(s, 1 / 60, view());
    expect(m.hoist.motorRot.rotation.x).toBeCloseTo(-1, 6);
  });

  it('the wrapped angle of the simulation is unwrapped frame to frame', () => {
    expect(shortestTurn(6.2, 0.1)).toBeCloseTo(0.1 + 2 * Math.PI - 6.2, 6);
    expect(shortestTurn(0.1, 6.2)).toBeCloseTo(-(0.1 + 2 * Math.PI - 6.2), 6);
  });

  it('shows the blur on the fan only when the state says it', () => {
    m.update(stateWith({ motorBlur: true, zFraction: 0.2 }), 1 / 60, view());
    expect(m.hoist.blurFan.visible).toBe(true);
    m.update(stateWith({ motorBlur: false, zFraction: 0.2 }), 1 / 60, view());
    expect(m.hoist.blurFan.visible).toBe(false);
  });
});

describe('nothing floats, nothing sinks', () => {
  const m = buildMachine();
  atLift(m, 0);

  it('the pad stands in the ground, and its top is a little above it', () => {
    const b = boxOf(m.parts['foundation-pad']);
    expect(b.max.y).toBeCloseTo(PAD_TOP, 3);
    expect(b.min.y).toBeLessThan(-1);
  });

  it('the legs stand on the pad, within a few millimetres', () => {
    const b = boxOf(m.parts['tower-leg']);
    expect(Math.abs(b.min.y - PAD_TOP)).toBeLessThan(0.004);
    expect(b.max.y).toBeCloseTo(LEG_TOP, 2);
  });

  it('the rails stand on the pad and their brackets reach the struts', () => {
    const rails = boxOf(m.parts['guide-rail']);
    expect(Math.abs(rails.min.y - PAD_TOP)).toBeLessThan(0.004);
    const bracing = boxOf(m.parts['tower-bracing']);
    expect(rails.max.x).toBeGreaterThan(TOWER.legX - TOWER.ringW / 2 - 0.01);
    expect(bracing.min.x).toBeLessThan(rails.min.x);
  });

  it('the buffers stand on the pad, and the carrier lands on them at the bottom of the stroke', () => {
    const buf = boxOf(m.parts['end-buffer']);
    expect(Math.abs(buf.min.y - PAD_TOP)).toBeLessThan(0.004);
    expect(buf.max.y).toBeCloseTo(BUFFER_TOP, 3);
    const carrier = boxOf(m.parts['weight-carrier']);
    expect(Math.abs(carrier.min.y - BUFFER_TOP)).toBeLessThan(0.003);
  });

  it('the ladder stands on the pad and reaches the deck, on stand-offs that reach the steel', () => {
    const b = boxOf(m.parts['service-ladder']);
    expect(Math.abs(b.min.y - PAD_TOP)).toBeLessThan(0.004);
    expect(b.max.y).toBeGreaterThan(DECK_TOP + 1);
    expect(b.max.z).toBeGreaterThan(-(TOWER.legX + TOWER.ringW / 2) - 0.01);
    expect(LADDER.z).toBeLessThan(-TOWER.legX);
  });

  it("the head frame sits on the legs, with its roof at the tower's height", () => {
    const b = boxOf(m.parts['head-frame']);
    expect(Math.abs(b.min.y - (LEG_TOP - 0.02))).toBeLessThan(0.004);
    // the machine's whole height is the research's: 28 m
    expect(b.max.y).toBeLessThanOrEqual(TOWER.height + 0.02);
    expect(b.max.y).toBeGreaterThan(TOWER.height - 0.05);
  });

  it("the hoist's feet rest on the channels, within a millimetre", () => {
    const base = boxOf(m.hoist.parts['hoist-base']);
    expect(base.max.y).toBeCloseTo(DECK_TOP + HOIST.height, 2);
    // the bolts go through the channel's flange and no further (their nuts): the rest is the rays' test, below
    expect(base.min.y).toBeGreaterThan(DECK_TOP - 0.1);
    expect(FOOT_X[1] - FOOT_X[0]).toBeCloseTo(HOIST.e12, 6);
  });

  it('the blocks lie on the deck, on each other, and the stack is the published one', () => {
    const blocks = m.parts['concrete-block'];
    const b = boxOf(blocks);
    expect(b.max.x - b.min.x).toBeCloseTo(STACK.width, 2);
    expect(b.max.z - b.min.z).toBeCloseTo(STACK.width, 2);
    // top of the full stack over the deck, the studs apart
    const deck = 0.7 + 0.45;
    expect(b.min.y).toBeCloseTo(deck, 3);
    expect(b.max.y - deck).toBeCloseTo(STACK.height + STACK.studH, 3);
  });
});

describe('moving parts reach what drives them', () => {
  const m = buildMachine();
  for (const z of [0, 0.5, 1]) {
    atLift(m, z);
    it(`at ${z * 100} % of the stroke: the shoes grip the rails, the safety gear too`, () => {
      atLift(m, z);
      const shoes = boxOf(m.parts['guide-shoe']);
      const rails = boxOf(m.parts['guide-rail']);
      expect(gap(shoes, rails)).toBeLessThan(0.003);
      expect(shoes.max.x).toBeGreaterThan(HOIST.height); // a sanity check of frames
      const safety = boxOf(m.parts['safety-gear']);
      expect(gap(safety, rails)).toBeLessThan(0.003);
    });
    it(`at ${z * 100} %: the hook block sits on the carrier's link`, () => {
      atLift(m, z);
      const hook = boxOf(m.parts['hook-block']);
      const carrier = boxOf(m.parts['weight-carrier']);
      expect(gap(hook, carrier)).toBeLessThan(0.002);
    });
    it(`at ${z * 100} %: the carrier's clamp is on the governor's rope`, () => {
      atLift(m, z);
      const clamp = world(
        m.parts['safety-gear'].getObjectByName('wedge')!.parent!.children.find((c) => c.userData.keep)!,
      );
      expect(clamp.x).toBeCloseTo(GOVERNOR.x, 3);
      expect(clamp.z).toBeCloseTo(GOVERNOR.z - GOVERNOR.r, 3);
    });
  }

  it('the ties stand on the deck and hold a cap on the top block, also with fewer blocks', () => {
    m.update(stateWith({ blocks: 3, halves: 1, zFraction: 0.2 }), 1 / 60, view());
    const top = m.drawn.stackTop;
    // 2 layers of whole blocks, one half on the second layer's top... the stack is what stackLayout says
    expect(top).toBeGreaterThan(1.15);
    const cap = m.parts['stack-tie'].getObjectByName('tie-cap')!;
    expect(cap.position.y).toBeCloseTo(top + STACK.studH, 5);
    m.update(stateWith({ blocks: 6, halves: 2, zFraction: 0.2 }), 1 / 60, view());
    expect(m.drawn.stackTop).toBeCloseTo(1.15 + STACK.height, 5);
  });

  it("the gear train adds up: from the motor's axis to the drum's, the maker's 420 mm", () => {
    const shafts = m.hoist.shafts.map((s) => world(s).z);
    expect(Math.abs(shafts[3] - DRUM_Z)).toBeLessThan(0.001);
    expect(shafts[0] - shafts[3]).toBeCloseTo(HOIST.drumToMotor, 2);
  });

  it('the axle and the sheaves hang as the maker draws the block', () => {
    expect(AXLE_ABOVE_SADDLE + HOOK_BLOCK.sheaveR + HOOK_BLOCK.sheaveRim).toBeCloseTo(0.756, 6);
    // the block's top at the top of the stroke: 74 mm under the deck, as C − e10 says
    expect(DECK_TOP - (SADDLE_Y0 + STROKE + 0.756)).toBeCloseTo(HOOK_APPROACH - 0.756, 6);
  });

  it('the winding of the rope fits between the plates of the frame', () => {
    expect(HOIST_X(HOIST.ropeStart)).toBeLessThan(HOIST_X(HOIST.discAt) - HOIST.discT);
    atLift(m, 1);
    expect(m.drawn.departureX).toBeGreaterThan(FOOT_X[0] + HOIST.footInner);
  });
});

describe('contacts, measured by a ray from inside the body to what carries it', () => {
  const m = buildMachine();
  atLift(m, 0);
  const own = (o: THREE.Object3D) => o.children.filter((c) => (c as THREE.Mesh).isMesh);
  const down = (targets: THREE.Object3D[], x: number, y: number, z: number): number => {
    m.root.updateMatrixWorld(true);
    const hit = new THREE.Raycaster(new THREE.Vector3(x, y, z), new THREE.Vector3(0, -1, 0)).intersectObjects(
      targets,
      true,
    );
    return hit.length ? hit[0].distance : Infinity;
  };

  it('a foot of the hoist on its channel: within a millimetre', () => {
    const y = DECK_TOP + 0.01;
    for (const x of FOOT_X)
      expect(
        Math.abs(down(own(m.parts['head-frame']), x + 0.015, y, FRAME_FRONT + 0.25) - 0.01),
        `foot at ${x}`,
      ).toBeLessThan(0.001);
  });

  it('the governor on the deck plate, the plates on the beams', () => {
    const plate = own(m.parts['head-frame']);
    expect(down(plate, GOVERNOR.x, DECK_TOP + DECK_PLATE + 0.002, GOVERNOR.z)).toBeLessThan(0.0025);
    // under the governor's base plate, the deck is where it says
    expect(down(plate, GOVERNOR.x, DECK_TOP + 0.5, GOVERNOR.z) - (0.5 - DECK_PLATE)).toBeLessThan(0.0015);
  });

  it('a block on the deck, a block on a block', () => {
    const deck = own(m.parts['weight-carrier']);
    expect(down(deck, 0.2, DECK_Y0 + 0.01, -0.4)).toBeLessThan(0.0102);
    const blocks = m.parts['concrete-block'].children.map((c) => c);
    // above the first layer's top, the second layer's underside rests on it
    expect(down(blocks, 0.2, DECK_Y0 + BLOCK.height + 0.01, -0.4)).toBeLessThan(0.0102);
  });

  it('the buffers and the legs on the pad', () => {
    const pad = own(m.parts['foundation-pad']);
    for (const [x, z] of [
      [BUFFER.x, BUFFER.z],
      [TOWER.legX, TOWER.legX],
      [-TOWER.legX, -TOWER.legX],
    ])
      expect(down(pad, x, PAD_TOP + 0.01, z)).toBeLessThan(0.0102);
  });

  it('at the top of the stroke the block stops under the deck and clear of the socket', () => {
    atLift(m, 1);
    const hook = boxOf(m.parts['hook-block']);
    expect(hook.max.y).toBeLessThan(DECK_TOP);
    expect(hook.max.y).toBeLessThan(world(m.hoist.anchorMouth).y);
    atLift(m, 0);
  });
});

it('the whole tree is finite in every pose', () => {
  const m = buildMachine();
  for (const z of [0, 0.5, 1]) {
    m.update(stateWith({ zFraction: z }), 1 / 60, view());
    expect(finiteTree(m.root)).toBe(true);
  }
});
