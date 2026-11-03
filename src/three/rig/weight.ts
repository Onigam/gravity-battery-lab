import * as THREE from 'three';
import { boltHead, group, mesh, rng } from '@onigam/lab-kit/three';
import {
  AXLE_ABOVE_SADDLE,
  BLOCK,
  BUFFER,
  BUFFER_TOP,
  CARRIER,
  CROSSHEAD_TOP_Y0,
  CROSSHEAD_Y0,
  DECK_Y0,
  GOVERNOR,
  HALF_BLOCK,
  HOOK_BLOCK,
  RAIL,
  RAIL_TIP,
  RULER_ZERO,
  SADDLE_Y0,
  SAFETY,
  SCALE,
  SHOE,
  STACK,
  STACK_TOP_Y0,
} from '../dims';
import type { MachineLook } from './look';
import { box, boxFromTo, cyl, hBeamX, hBeamZ, hColumn, latheX, sweep, webX } from './shapes';

// What moves with the weight, all in the frame of the bottom of the stroke (the group that holds them follows the lift): the carrier and its sling, the blocks, the ties, the
// shoes, the safety gear and the hook block. The load hangs like this, and every link is drawn: sheaves → hook block → hook → link → crosshead → uprights → beams → deck →
// blocks. The rope comes from `rope.ts`, its ends are the markers placed here.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface StackSlot {
  kind: 'whole' | 'half';
  /** Index among the blocks of its kind. */
  i: number;
  /** Centre, in the frame of the bottom of the stroke. */
  x: number;
  y: number;
  z: number;
  /** Along X (false) or along Z (true). */
  turned: boolean;
}

/**
 * Where the blocks go for a stack of `blocks` whole and `halves` half blocks: two whole per layer from the deck up, a quarter turn each layer, then the half blocks, first in the
 * free half of an unfinished layer, then in a layer of their own. The blocks that stay are the bottom ones: blocks come off the top.
 */
export function stackLayout(blocks: number, halves: number): StackSlot[] {
  const slots: StackSlot[] = [];
  const W = BLOCK.width;
  const H = BLOCK.height;
  const HH = HALF_BLOCK.height;
  let y = DECK_Y0;
  const slot = (kind: 'whole' | 'half', i: number, layer: number, side: number, yBottom: number, h: number) => {
    const turned = layer % 2 === 1;
    slots.push({
      kind,
      i,
      x: turned ? (side * W) / 2 : 0,
      y: yBottom + h / 2,
      z: turned ? 0 : (side * W) / 2,
      turned,
    });
  };
  let layer = 0;
  let placed = 0;
  while (placed < blocks) {
    slot('whole', placed, layer, -1, y, H);
    placed++;
    if (placed < blocks) {
      slot('whole', placed, layer, 1, y, H);
      placed++;
      y += H;
      layer++;
    } else break;
  }
  let hPlaced = 0;
  if (blocks % 2 === 1 && halves > 0) {
    // the free half of the last whole layer: a half block on the deck side of it, the rest stays open
    slot('half', hPlaced, layer, 1, y, HH);
    hPlaced++;
  }
  if (blocks % 2 === 1) {
    y += H;
    layer++;
  }
  while (hPlaced < halves) {
    slot('half', hPlaced, layer, -1, y, HH);
    hPlaced++;
    if (hPlaced < halves) {
      slot('half', hPlaced, layer, 1, y, HH);
      hPlaced++;
    }
    y += HH;
    layer++;
  }
  return slots;
}

/** Height of the top of a stack, in the frame of the bottom of the stroke. */
export function stackTop(blocks: number, halves: number): number {
  const slots = stackLayout(blocks, halves);
  let top = DECK_Y0;
  for (const s of slots) top = Math.max(top, s.y + (s.kind === 'whole' ? BLOCK.height : HALF_BLOCK.height) / 2);
  return top;
}

/** A block with a small chamfer, its studs on top, the lifting anchor. Along X; `length` × `width` × `height`. Vertex colours break the sameness of the concrete. */
export function blockGeometry(length: number, width: number, height: number, seed: number): THREE.BufferGeometry {
  const c = 0.022;
  const g = new THREE.BoxGeometry(length - 2 * c, height - 2 * c, width - 2 * c, 1, 1, 1);
  const shell = new THREE.BoxGeometry(length, height - 2 * c, width - 2 * c);
  const a = new THREE.BoxGeometry(length - 2 * c, height, width - 2 * c);
  const b = new THREE.BoxGeometry(length - 2 * c, height - 2 * c, width);
  g.dispose();
  const list = [shell, a, b];
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const r = rng(seed);
  const col: number[] = [];
  const tone = 0.88 + 0.2 * r();
  for (const part of list) {
    const base = pos.length / 3;
    const p = part.attributes.position;
    const n = part.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      const v = tone * (0.95 + 0.08 * r());
      col.push(v, v, v * 0.985);
    }
    const ix = part.index!;
    for (let i = 0; i < ix.count; i++) idx.push(base + ix.getX(i));
  }
  // the studs of the top: two on a whole block, two on a half block
  for (const sx of [-1, 1]) {
    const s = new THREE.CylinderGeometry(STACK.studR * 0.82, STACK.studR, STACK.studH, 20, 1);
    s.translate((sx * length) / 4, height / 2 + STACK.studH / 2, 0);
    const base = pos.length / 3;
    const p = s.attributes.position;
    const n = s.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      const v = tone * 0.96;
      col.push(v, v, v * 0.985);
    }
    const ix = s.index!;
    for (let i = 0; i < ix.count; i++) idx.push(base + ix.getX(i));
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setIndex(idx);
  return out;
}

export interface Blocks {
  root: THREE.Group;
  whole: THREE.Group[];
  halves: THREE.Group[];
  /** Show `blocks` whole and `halves` half blocks in place; returns the height of the top. */
  show(blocks: number, halves: number): number;
}

/** All the blocks of the machine, the extra ones hidden. Each its own group: the explode lifts them apart, the state chooses how many. */
export function buildBlocks(look: MachineLook): Blocks {
  const root = group('concrete-block');
  const whole: THREE.Group[] = [];
  const halves: THREE.Group[] = [];
  // block's own material with vertex colours: each block its tone
  const mat = look.block.clone();
  mat.vertexColors = true;
  for (let i = 0; i < STACK.blocks; i++) {
    const g = group(`block-${i}`);
    g.add(mesh(blockGeometry(BLOCK.length, BLOCK.width, BLOCK.height, 100 + i), mat));
    // lifting anchors: two recessed pins on the side
    root.add(g);
    whole.push(g);
  }
  for (let i = 0; i < STACK.halves; i++) {
    const g = group(`half-${i}`);
    g.add(mesh(blockGeometry(HALF_BLOCK.length, HALF_BLOCK.width, HALF_BLOCK.height, 200 + i), mat));
    root.add(g);
    halves.push(g);
  }
  const show = (blocks: number, nh: number): number => {
    const n = Math.min(blocks, STACK.blocks);
    const h = Math.min(nh, STACK.halves);
    const slots = stackLayout(n, h);
    whole.forEach((g) => (g.visible = false));
    halves.forEach((g) => (g.visible = false));
    for (const s of slots) {
      const g = s.kind === 'whole' ? whole[s.i] : halves[s.i];
      g.visible = true;
      g.position.set(s.x, s.y, s.z);
      g.rotation.y = s.turned ? Math.PI / 2 : 0;
    }
    return stackTop(n, h);
  };
  show(STACK.blocks, STACK.halves);
  return { root, whole, halves, show };
}

/** The carrier: deck, beams, strike plates over the buffers, uprights, crosshead, the lug and the link the hook sits in. */
export function buildCarrier(look: MachineLook): { root: THREE.Group; link: THREE.Object3D } {
  const g = group('weight-carrier');
  const c = CARRIER;
  const uX = c.uprightX;
  const under = DECK_Y0 - c.deckT;
  const bottom = BUFFER_TOP + c.strikeT;
  const beamD = under - bottom;
  // deck
  box(g, look.carrier, c.deckSide, c.deckT, c.deckSide, 0, DECK_Y0 - c.deckT / 2, 0);
  // two beams along X, from upright to upright
  const beamLen = 2 * uX;
  for (const s of [-1, 1]) {
    g.add(mesh(hBeamX(c.beamW, beamD, 0.024, 0.016, beamLen), look.carrier, [0, (under + bottom) / 2, s * c.beamZ]));
    // strike plates over each buffer: the machine's weight lands here at the end of the stroke
    for (const x of [-BUFFER.x, BUFFER.x])
      box(g, look.steel, 0.3, c.strikeT, 0.3, x, BUFFER_TOP + c.strikeT / 2, s * BUFFER.z);
    box(g, look.steel, 2 * BUFFER.x + 0.3, c.strikeT, c.beamW, 0, BUFFER_TOP + c.strikeT / 2, s * c.beamZ);
  }
  // two cross-beams along Z at the uprights
  for (const s of [-1, 1])
    g.add(mesh(hBeamZ(c.uprightW, beamD, 0.02, 0.014, c.deckSide), look.carrier, [s * uX, (under + bottom) / 2, 0]));
  // the uprights: two H columns outside the stack, from the beams to the crosshead
  const yTop = CROSSHEAD_TOP_Y0;
  for (const s of [-1, 1]) {
    const col = hColumn(c.uprightW, 0.018, 0.012, yTop - bottom);
    g.add(mesh(col, look.carrier, [s * uX, bottom, 0]));
  }
  // crosshead: a deep box beam over the stack, on the uprights
  const yC = (CROSSHEAD_Y0 + CROSSHEAD_TOP_Y0) / 2;
  const len = 2 * uX + c.uprightW;
  g.add(mesh(hBeamX(c.crossheadW, c.crossheadD, 0.025, 0.02, len), look.carrier, [0, yC, 0]));
  for (const s of [-1, 1])
    box(g, look.carrier, 0.012, c.crossheadD, c.crossheadW, s * (uX - c.uprightW / 2 - 0.01), yC, 0);
  // the lug on the crosshead and the link: its top bar lies in the hook's saddle
  const link = group('hook-link');
  const lugTop = CROSSHEAD_TOP_Y0 + 0.07;
  box(link, look.carrier, 0.1, lugTop - CROSSHEAD_TOP_Y0, 0.05, 0, (lugTop + CROSSHEAD_TOP_Y0) / 2, 0);
  cyl(link, look.bright, 'z', 0.02, -0.05, 0.05, 0, lugTop - 0.025, 12);
  const barR = 0.024;
  const barY = SADDLE_Y0 + barR;
  const loop = [
    V(0, lugTop - 0.045, -0.03),
    V(0.07, lugTop - 0.035, -0.03),
    V(0.11, lugTop + 0.05, -0.03),
    V(0.11, barY - 0.01, -0.03),
    V(0.07, barY, -0.03),
    V(0, barY, -0.03),
    V(-0.07, barY, -0.03),
    V(-0.11, barY - 0.01, -0.03),
    V(-0.11, lugTop + 0.05, -0.03),
    V(-0.07, lugTop - 0.035, -0.03),
    V(0, lugTop - 0.045, -0.03),
  ];
  // a closed link of round bar, in the plane of the hook's throat
  link.add(
    mesh(
      sweep(
        loop.map((p) => p.clone().setZ(0)),
        barR,
        10,
      ),
      look.bright,
    ),
  );
  g.add(link);
  // tell-tale arm to the ruler
  const arm = mesh(
    sweep([V(uX + c.uprightW / 2, RULER_ZERO, 0.05), V(SCALE.x - 0.1, RULER_ZERO, SCALE.z - 0.12)], 0.012, 6),
    look.yellow,
  );
  g.add(arm);
  // the index at its end, in front of the strip
  box(g, look.red, 0.2, 0.025, 0.02, SCALE.x, RULER_ZERO, SCALE.z + 0.012);
  boxFromTo(
    g,
    look.yellow,
    [SCALE.x - 0.1, RULER_ZERO - 0.01, SCALE.z - 0.12],
    [SCALE.x - 0.09, RULER_ZERO + 0.01, SCALE.z + 0.016],
  );
  return { root: g, link };
}

export interface Ties {
  root: THREE.Group;
  rods: THREE.Mesh[];
  /** The top bars and their nuts: at the top of the stack. */
  cap: THREE.Group;
  set(top: number): void;
}

/** Four threaded rods at the stack's corners, from the deck up to a pair of bars over the top block. */
export function buildTies(look: MachineLook): Ties {
  const root = group('stack-tie');
  const half = STACK.width / 2 + 0.03;
  const rods: THREE.Mesh[] = [];
  const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 1, 10);
  rodGeo.translate(0, 0.5, 0);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const m = mesh(rodGeo, look.bright, [sx * half, DECK_Y0, sz * half]);
      m.userData.dynamic = true;
      root.add(m);
      rods.push(m);
      // the nut on the deck
      const nut = boltHead(0.032, 0.03, look.steel);
      nut.position.set(sx * half, DECK_Y0, sz * half);
      root.add(nut);
    }
  const cap = group('tie-cap');
  cap.userData.dynamic = true;
  for (const s of [-1, 1]) {
    cap.add(mesh(new THREE.BoxGeometry(2 * half + 0.1, 0.05, 0.05), look.carrier, [0, 0.025, s * half]));
    for (const sx of [-1, 1]) {
      const nut = boltHead(0.032, 0.03, look.steel);
      nut.position.set(sx * half, 0.05, s * half);
      cap.add(nut);
    }
  }
  // the bars rest on two cross-members over the studs
  for (const s of [-1, 1])
    cap.add(mesh(new THREE.BoxGeometry(0.05, 0.05, 2 * half), look.carrier, [s * 0.4, 0.025, 0]));
  root.add(cap);
  const set = (top: number) => {
    const yTop = top + STACK.studH;
    for (const r of rods) r.scale.y = Math.max(0.05, yTop + 0.1 - DECK_Y0);
    cap.position.y = yTop;
  };
  set(STACK_TOP_Y0);
  return { root, rods, cap, set };
}

/** Four shoes round the rails' blades: a body bolted to the upright, a liner each side of the blade. */
export function buildShoes(look: MachineLook): {
  root: THREE.Group;
  shoes: { group: THREE.Group; dir: THREE.Vector3 }[];
} {
  const root = group('guide-shoe');
  const shoes: { group: THREE.Group; dir: THREE.Vector3 }[] = [];
  const x0 = CARRIER.uprightX + CARRIER.uprightW / 2;
  const x1 = RAIL.x - 0.005;
  const slot = SHOE.slot / 2;
  const levels = [DECK_Y0 + 0.2, CROSSHEAD_Y0 - SHOE.topGap - SHOE.h / 2];
  for (const s of [-1, 1]) {
    // a pair per side: they leave the rail together in the exploded view
    const g = group('shoes');
    for (const y of levels) {
      // the body: a plate on the upright, two cheeks either side of the blade
      box(g, look.brake, 0.018, SHOE.h + 0.08, SHOE.w + 0.06, s * (x0 + 0.009), y, 0);
      box(g, look.brake, RAIL_TIP - x0 - 0.012, SHOE.h, SHOE.w, (s * (x0 + 0.012 + RAIL_TIP)) / 2, y, 0);
      for (const side of [-1, 1]) {
        const cheek = (SHOE.w - slot * 2) / 2;
        box(g, look.brake, x1 - RAIL_TIP, SHOE.h, cheek, (s * (x1 + RAIL_TIP)) / 2, y, side * (slot + cheek / 2));
        box(
          g,
          look.yellow,
          x1 - RAIL_TIP,
          SHOE.h - 0.02,
          SHOE.liner,
          (s * (x1 + RAIL_TIP)) / 2,
          y,
          side * (slot - SHOE.liner / 2 + 0.001),
        );
      }
      // bolts through the plate
      for (const dy of [-1, 1])
        for (const dz of [-1, 1])
          cyl(
            g,
            look.steel,
            'x',
            0.012,
            s * (x0 + 0.018),
            s * (x0 + 0.03),
            y + dy * (SHOE.h / 2 + 0.02),
            dz * (SHOE.w / 2 + 0.01),
            6,
          );
    }
    root.add(g);
    shoes.push({ group: g, dir: V(s, 0, 0) });
  }
  return { root, shoes };
}

export interface SafetyGear {
  root: THREE.Group;
  /** The wedges: they rise on the rails when the gear sets. */
  wedges: THREE.Group[];
  /** The bright flag: it swings out when the gear has set. */
  flag: THREE.Group;
  /** Where the governor rope is gripped, a marker in the frame of the weight. */
  clamp: THREE.Object3D;
  set(on: number): void;
}

/** A wedge housing round each rail under the lower shoe, a shaft across under the carrier to set both at once, an arm that reaches the governor's rope. */
export function buildSafety(look: MachineLook): SafetyGear {
  const root = group('safety-gear');
  const wedges: THREE.Group[] = [];
  const y = DECK_Y0 - 0.2;
  const x0 = CARRIER.uprightX + CARRIER.uprightW / 2;
  const x1 = RAIL.x - 0.005;
  for (const s of [-1, 1]) {
    // the housing on the upright, open towards the blade
    box(root, look.red, 0.016, SAFETY.h + 0.08, SAFETY.w + 0.06, s * (x0 + 0.008), y, 0);
    box(root, look.red, RAIL_TIP - x0 - 0.016, SAFETY.h, SAFETY.w, (s * (x0 + 0.016 + RAIL_TIP)) / 2, y, 0);
    const wedge = group('wedge');
    wedge.userData.dynamic = true;
    for (const side of [-1, 1]) {
      const cheek = (SAFETY.w - SHOE.slot) / 2;
      const geo = new THREE.BoxGeometry(x1 - RAIL_TIP, SAFETY.h, cheek);
      wedge.add(mesh(geo, look.red, [(s * (x1 + RAIL_TIP)) / 2, y, side * (SHOE.slot / 2 + cheek / 2)]));
      // the hardened insert facing the blade
      wedge.add(
        mesh(new THREE.BoxGeometry(x1 - RAIL_TIP, SAFETY.h - 0.04, 0.006), look.bright, [
          (s * (x1 + RAIL_TIP)) / 2,
          y,
          side * (SHOE.slot / 2 + 0.002),
        ]),
      );
    }
    root.add(wedge);
    wedges.push(wedge);
  }
  // the shaft across, under the beams: it lifts both wedges, its bearings hang off the uprights
  const yS = SAFETY.shaftY;
  cyl(root, look.bright, 'x', 0.02, -x0, x0, yS, -0.14, 12);
  for (const s of [-1, 1]) {
    box(
      root,
      look.steel,
      0.05,
      BUFFER_TOP + 0.04 - yS + 0.06,
      0.05,
      s * (CARRIER.uprightX - 0.09),
      yS + (BUFFER_TOP + 0.04 - yS + 0.06) / 2 - 0.03,
      -0.14,
    );
    // and the lever from the shaft to the wedge
    box(root, look.steel, 0.04, 0.03, 0.16, s * (x0 - 0.02), yS, -0.07);
  }
  // the arm to the governor's rope: along Z on the outside of the +X upright, up to the grip
  const yArm = GOVERNOR.clampY;
  box(
    root,
    look.yellow,
    0.02,
    0.04,
    GOVERNOR.z - GOVERNOR.r + 0.02,
    x0 + 0.01,
    yArm,
    (GOVERNOR.z - GOVERNOR.r - 0.02) / 2,
  );
  // the grip on the rope
  const clampZ = GOVERNOR.z - GOVERNOR.r;
  box(root, look.red, 0.05, 0.1, 0.04, GOVERNOR.x, yArm, clampZ);
  const clamp = new THREE.Object3D();
  clamp.position.set(GOVERNOR.x, yArm, clampZ);
  clamp.userData.keep = true;
  root.add(clamp);
  // a red flag on the housing: it swings out when the gear has set
  const flag = group('flag');
  flag.userData.dynamic = true;
  flag.position.set(x0 + 0.02, y + 0.13, 0.12);
  flag.add(mesh(new THREE.BoxGeometry(0.018, 0.1, 0.06), look.red, [0, 0, 0.03]));
  root.add(flag);
  return {
    root,
    wedges,
    flag,
    clamp,
    set(on) {
      for (const w of wedges) w.position.y = on * SAFETY.wedgeTravel;
      flag.rotation.x = on * 1.4;
    },
  };
}

export interface HookBlock {
  root: THREE.Group;
  /** The sheaves, turned by the machine. */
  sheaveA: THREE.Group;
  sheaveB: THREE.Group;
  /** Sheave axes, markers at the pitch circle's centre (A at x = −sheaveX, B at +sheaveX). */
  axisA: THREE.Object3D;
  axisB: THREE.Object3D;
}

/** One sheave, around X at x = 0: rim with the groove, web with five holes (they show it turning), hub. */
export function buildSheaveX(look: MachineLook, pitchR: number, w: number): THREE.Group {
  const g = group('sheave');
  const R = pitchR;
  const o = R + HOOK_BLOCK.sheaveRim;
  const groove = R - 0.002;
  const rim = latheX(
    [
      [-w / 2, R - 0.03],
      [-w / 2, o],
      [-w / 2 + 0.008, o],
      [-0.012, groove + 0.012],
      [0, groove],
      [0.012, groove + 0.012],
      [w / 2 - 0.008, o],
      [w / 2, o],
      [w / 2, R - 0.03],
      [-w / 2, R - 0.03],
    ],
    36,
  );
  g.add(mesh(rim, look.drum));
  g.add(mesh(webX(R - 0.025, -0.012, 0.012, 5, R * 0.2, R * 0.56), look.steel));
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, w, 18).rotateZ(Math.PI / 2), look.steel));
  // the eye reads the turn from the web's five windows: no tag on it, it would need explaining
  return g;
}

/** The hook block: two sheaves on an axle, side plates, a traverse below, the swivel, the hook with its latch, sitting on the link. */
export function buildHookBlock(look: MachineLook): HookBlock {
  const root = group('hook-block');
  const axleY = SADDLE_Y0 + AXLE_ABOVE_SADDLE;
  const sx = HOOK_BLOCK.sheaveX;
  const w = HOOK_BLOCK.sheaveW;
  const R = HOOK_BLOCK.sheaveR;
  const sheaveA = buildSheaveX(look, R, w);
  sheaveA.position.set(-sx, axleY, 0);
  sheaveA.userData.dynamic = true;
  const sheaveB = buildSheaveX(look, R, w);
  sheaveB.position.set(sx, axleY, 0);
  sheaveB.userData.dynamic = true;
  root.add(sheaveA, sheaveB);
  // the axle and its plates: outer plates beyond the sheaves, a double plate between them
  const plateX = [-(sx + w / 2 + 0.012), -(sx - w / 2 - 0.012), sx - w / 2 - 0.012, sx + w / 2 + 0.012];
  cyl(root, look.bright, 'x', 0.035, plateX[0] - 0.02, plateX[3] + 0.02, axleY, 0, 16);
  const traverseY = axleY - R - 0.09;
  for (const x of plateX) {
    const s = new THREE.Shape();
    const hw = R * 0.62;
    s.moveTo(-hw, traverseY - 0.035 - axleY);
    s.lineTo(hw, traverseY - 0.035 - axleY);
    s.lineTo(hw, 0.0);
    s.absarc(0, 0, hw, 0, Math.PI, false);
    s.lineTo(-hw, traverseY - 0.035 - axleY);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false, curveSegments: 18 });
    geo.rotateY(Math.PI / 2);
    geo.translate(x - 0.006, axleY, 0);
    root.add(mesh(geo, look.yellow));
  }
  // nuts of the axle
  for (const x of [plateX[0] - 0.02, plateX[3] + 0.02]) {
    cyl(root, look.steel, 'x', 0.045, x, x + (x < 0 ? -0.022 : 0.022), axleY, 0, 6);
  }
  // the traverse: a block across, with the swivel's housing
  box(root, look.yellow, 2 * sx + w + 0.06, 0.07, R * 1.24, 0, traverseY, 0);
  cyl(root, look.steel, 'y', 0.09, traverseY - 0.035, traverseY - 0.1, 0, 0, 22);
  // the hook: a shank from the swivel to the bowl, a tapered hook whose saddle is at SADDLE_Y0. Bowl radius and section from a forged hook of 20 t, estimate.
  const bowl = 0.1;
  const bowlC = SADDLE_Y0 + bowl;
  const pts: THREE.Vector3[] = [];
  const rad: number[] = [];
  const shankTop = traverseY - 0.08;
  pts.push(V(0, shankTop, 0));
  rad.push(0.045);
  pts.push(V(0, bowlC + bowl + 0.13, 0));
  rad.push(0.045);
  pts.push(V(0, bowlC + bowl + 0.08, 0));
  rad.push(0.052);
  pts.push(V(0, bowlC + bowl + 0.03, 0.01));
  rad.push(0.055);
  // around the bowl, centred in the z axis, from the back over the saddle to the point
  const start = Math.PI * 0.5;
  const end = -Math.PI * 1.05;
  const nArc = 16;
  const zC = 0;
  for (let i = 0; i <= nArc; i++) {
    const t = i / nArc;
    const a = start + (end - start) * t;
    // the section's centre runs at a radius of bowl + half the section under the saddle
    const sec = 0.058 * (1 - 0.62 * Math.pow(t, 1.8));
    pts.push(V(0, bowlC + (bowl + sec) * Math.sin(a), zC + (bowl + sec) * Math.cos(a)));
    rad.push(sec);
  }
  root.add(mesh(sweep(pts, rad, 12), look.yellow));
  // the latch across the throat
  const tip = pts[pts.length - 1];
  const latch = sweep(
    [
      V(0, bowlC + bowl + 0.05, 0.05),
      tip
        .clone()
        .setZ(tip.z - 0.01)
        .setY(tip.y + 0.02),
    ],
    0.007,
    6,
  );
  root.add(mesh(latch, look.bright));
  // markers of the rope
  const axisA = new THREE.Object3D();
  axisA.position.set(-sx, axleY, 0);
  axisA.userData.keep = true;
  const axisB = new THREE.Object3D();
  axisB.position.set(sx, axleY, 0);
  axisB.userData.keep = true;
  root.add(axisA, axisB);
  return { root, sheaveA, sheaveB, axisA, axisB };
}
