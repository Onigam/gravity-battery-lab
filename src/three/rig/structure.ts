import * as THREE from 'three';
import { boltHead, group, mesh } from '@onigam/lab-kit/three';
import {
  BUFFER,
  DECK_OPENING_REAR,
  DECK_PLATE,
  DECK_TOP,
  FOOT_X,
  FRAME_FRONT,
  LADDER,
  LEG_TOP,
  PAD,
  PAD_BOTTOM,
  PAD_TOP,
  PANEL_H,
  RAIL,
  RISER,
  SCALE,
  STROKE,
  TOWER,
  WH100_M,
  levelY,
} from '../dims';
import type { MachineLook } from './look';
import { angleBar, between, box, boxFromTo, boxes, cyl, hBeamX, hBeamZ, hColumn, rounded, sweep } from './shapes';

// The steel that stands still: the pad, the four legs, the lattice, the rails, the buffers, the ladder, the ruler, the head frame with its deck and its roof. Everything is
// measured from `dims.ts`, and every member ends on another one (structure.test checks the ends): a bracket reaches its strut, a stile reaches the pad and the deck.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const L = TOWER.legX;
const HALF_LEG = TOWER.legSide / 2;

/** The concrete pad with its chamfer, its anchor sleeves and the plinths under the rails. */
export function buildPad(look: MachineLook): THREE.Group {
  const g = group('foundation-pad');
  const s = PAD.side;
  const chamfer = 0.05;
  // a pad with a chamfered top: a prism whose top is a little smaller than its body
  const body = new THREE.BoxGeometry(s, PAD.thick - chamfer, s);
  body.translate(0, PAD_BOTTOM + (PAD.thick - chamfer) / 2, 0);
  g.add(mesh(body, look.concrete));
  const top = new THREE.CylinderGeometry(((s - 2 * chamfer) / 2) * Math.SQRT2, (s / 2) * Math.SQRT2, chamfer, 4, 1);
  top.rotateY(Math.PI / 4);
  top.translate(0, PAD_TOP - chamfer / 2, 0);
  g.add(mesh(top.toNonIndexed(), look.concrete));
  (g.children[1] as THREE.Mesh).geometry.computeVertexNormals();
  return g;
}

/** One leg: its H column, its base plate, the anchors, the stiffeners, one splice at mid height. */
function buildLeg(look: MachineLook, sx: number, sz: number): THREE.Group {
  const g = group(`leg-${sx}-${sz}`);
  const x = sx * L;
  const z = sz * L;
  const y0 = PAD_TOP + TOWER.basePlateT;
  const column = hColumn(TOWER.legSide, TOWER.legFlange, TOWER.legWeb, LEG_TOP - y0);
  g.add(mesh(column, look.galvanised, [x, y0, z]));
  // the base plate, on the pad
  box(g, look.galvanisedDark, TOWER.basePlate, TOWER.basePlateT, TOWER.basePlate, x, PAD_TOP + TOWER.basePlateT / 2, z);
  // four anchors in the plate, with nuts and threads
  const a = TOWER.basePlate / 2 - 0.05;
  for (const ax of [-a, a])
    for (const az of [-a, a]) {
      cyl(g, look.steel, 'y', 0.012, PAD_TOP, y0 + 0.06, x + ax, z + az, 8);
      const nut = boltHead(0.024, 0.024, look.steel);
      nut.position.set(x + ax, y0, z + az);
      g.add(nut);
    }
  // stiffeners beside the flanges
  const stiff = new THREE.Shape();
  stiff.moveTo(0, 0);
  stiff.lineTo(0.14, 0);
  stiff.lineTo(0, 0.2);
  stiff.closePath();
  const geo = new THREE.ExtrudeGeometry(stiff, { depth: 0.012, bevelEnabled: false });
  for (const side of [-1, 1]) {
    const m = mesh(geo, look.galvanisedDark, [x + side * (HALF_LEG - 0.001), y0, z - 0.006]);
    if (side < 0) m.scale.x = -1;
    g.add(m);
  }
  // a bolted splice every other level, as a 25 m leg comes in lengths a truck can carry
  for (const lvl of [2, 4, 6]) {
    const y = levelY(lvl);
    for (const side of [-1, 1]) {
      box(g, look.galvanisedDark, 0.012, 0.44, TOWER.legSide - 0.01, x + side * (HALF_LEG + 0.006), y, z);
      for (const dy of [-0.15, -0.05, 0.05, 0.15])
        for (const dz of [-0.07, 0.07])
          cyl(
            g,
            look.steel,
            'x',
            0.012,
            x + side * (HALF_LEG + 0.012),
            x + side * (HALF_LEG + 0.024),
            y + dy,
            z + dz,
            6,
          );
    }
  }
  return g;
}

export function buildLegs(look: MachineLook): {
  root: THREE.Group;
  legs: { group: THREE.Group; dir: THREE.Vector3 }[];
} {
  const root = group('tower-leg');
  const legs: { group: THREE.Group; dir: THREE.Vector3 }[] = [];
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const g = buildLeg(look, sx, sz);
      root.add(g);
      legs.push({ group: g, dir: V(sx, 0, sz).normalize() });
    }
  return { root, legs };
}

/**
 * The bracing of one face: horizontal struts at every level, two diagonals per panel crossing on the outer side of the struts, gussets with bolts at the ends. `n` is the
 * outward normal of the face, ±X or ±Z.
 */
function buildFace(look: MachineLook, n: THREE.Vector3): THREE.Group {
  const g = group('face');
  const across = Math.abs(n.x) > 0.5 ? V(0, 0, 1) : V(1, 0, 0);
  const span = 2 * L - TOWER.legSide; // between the flanges of the legs
  const outer = L + HALF_LEG - 0.005;
  const strutY = (i: number) => levelY(i);
  const place = (u: number, y: number, w: number) => V(n.x * w + across.x * u, y, n.z * w + across.z * u);
  for (let i = 1; i <= TOWER.panels; i++) {
    if (i === TOWER.panels) break; // the top level is the ring beam of the head frame
    const beam =
      Math.abs(n.x) > 0.5
        ? hBeamZ(TOWER.strutD * 0.8, TOWER.strutD, 0.012, 0.009, span)
        : hBeamX(TOWER.strutD * 0.8, TOWER.strutD, 0.012, 0.009, span);
    g.add(mesh(beam, look.galvanised, [n.x * L, strutY(i), n.z * L]));
  }
  // diagonals: from the inner corner of a leg at one level to the other leg at the next, on the outer face
  const u0 = L - HALF_LEG;
  const dLen = Math.hypot(2 * u0, PANEL_H);
  const geo = angleBar(TOWER.angleSide, TOWER.angleT, dLen);
  const inward = n.clone().multiplyScalar(-1);
  for (let i = 0; i < TOWER.panels; i++) {
    const y0 = strutY(i) + (i === 0 ? 0.06 : 0);
    const y1 = strutY(i + 1) - (i === TOWER.panels - 1 ? 0.02 : 0);
    const len = Math.hypot(2 * u0, y1 - y0);
    const one = i === 0 || i === TOWER.panels - 1 ? angleBar(TOWER.angleSide, TOWER.angleT, len) : geo;
    for (const [s, w] of [
      [1, outer],
      [-1, outer - 2 * TOWER.angleT],
    ] as const) {
      const a = place(-s * u0, y0, w);
      const b = place(s * u0, y1, w);
      const m = mesh(one, look.galvanised);
      between(m, a, b, inward);
      g.add(m);
    }
    // the bolt at the crossing
    const c = place(0, (y0 + y1) / 2, outer);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 6), look.steel);
    bolt.position.copy(c);
    bolt.rotation.set(Math.abs(n.z) > 0.5 ? Math.PI / 2 : 0, 0, Math.abs(n.x) > 0.5 ? Math.PI / 2 : 0);
    bolt.castShadow = true;
    g.add(bolt);
    // gusset plates where the diagonals land on the legs
    for (const sU of [-1, 1])
      for (const y of [y0, y1]) {
        const p = place(sU * (u0 - 0.1), y + (y === y0 ? 0.1 : -0.1), outer + 0.003);
        const size: [number, number, number] = Math.abs(n.x) > 0.5 ? [0.012, 0.34, 0.3] : [0.3, 0.34, 0.012];
        box(g, look.galvanisedDark, size[0], size[1], size[2], p.x, p.y, p.z);
      }
  }
  return g;
}

export function buildBracing(look: MachineLook): {
  root: THREE.Group;
  faces: { group: THREE.Group; dir: THREE.Vector3 }[];
} {
  const root = group('tower-bracing');
  const faces: { group: THREE.Group; dir: THREE.Vector3 }[] = [];
  for (const n of [V(1, 0, 0), V(-1, 0, 0), V(0, 0, 1), V(0, 0, -1)]) {
    const g = buildFace(look, n);
    root.add(g);
    faces.push({ group: g, dir: n });
  }
  return { root, faces };
}

/** The T rails, one per side, with a bracket out to the strut at every level and a foot on the pad. */
export function buildRails(look: MachineLook): {
  root: THREE.Group;
  rails: { group: THREE.Group; dir: THREE.Vector3 }[];
} {
  const root = group('guide-rail');
  const rails: { group: THREE.Group; dir: THREE.Vector3 }[] = [];
  for (const s of [-1, 1]) {
    const g = group(`rail-${s}`);
    const y0 = PAD_TOP + 0.02;
    const len = RAIL.top - y0;
    const midY = y0 + len / 2;
    // blade pointing to the shaft, foot on the bracket's side
    box(g, look.steel, RAIL.blade, len, RAIL.bladeT, s * (RAIL.x - RAIL.blade / 2), midY, 0);
    box(g, look.steel, RAIL.footT, len, RAIL.footW, s * (RAIL.x + RAIL.footT / 2), midY, 0);
    // the rail stands on a plate on the pad
    box(g, look.galvanisedDark, 0.34, 0.02, 0.3, s * (RAIL.x + 0.04), PAD_TOP + 0.01, 0);
    for (const dz of [-0.11, 0.11]) {
      const nut = boltHead(0.018, 0.016, look.steel);
      nut.position.set(s * (RAIL.x + 0.14), PAD_TOP + 0.02, dz);
      g.add(nut);
    }
    // a bracket at every level, from the rail's foot to the strut's flange
    const xIn = RAIL.x + RAIL.footT;
    const xOut = L - (TOWER.strutD * 0.8) / 2;
    for (let i = 1; i < TOWER.panels; i++) {
      const y = levelY(i);
      box(g, look.galvanisedDark, xOut - xIn, RAIL.bracketT, RAIL.bracketW, (s * (xIn + xOut)) / 2, y, 0);
      box(g, look.galvanisedDark, 0.012, 0.14, RAIL.bracketW + 0.03, s * (xIn + 0.006), y, 0);
      box(g, look.galvanisedDark, 0.012, TOWER.strutD, RAIL.bracketW + 0.03, s * (xOut - 0.006), y, 0);
      // clips on the rail's foot
      for (const dz of [-0.055, 0.055]) box(g, look.steel, 0.02, 0.05, 0.03, s * (RAIL.x + 0.02), y + 0.05, dz);
      for (const dz of [-0.055, 0.055]) box(g, look.steel, 0.02, 0.05, 0.03, s * (RAIL.x + 0.02), y - 0.05, dz);
    }
    // top bracket, up to the ring beam
    const yTop = RAIL.top - 0.03;
    const xRing = L - TOWER.ringW / 2;
    box(g, look.galvanisedDark, xRing - xIn, RAIL.bracketT, RAIL.bracketW, (s * (xIn + xRing)) / 2, yTop, 0);
    box(g, look.galvanisedDark, 0.012, 0.12, RAIL.bracketW + 0.03, s * (xRing - 0.006), yTop + 0.06, 0);
    root.add(g);
    rails.push({ group: g, dir: V(s, 0, 0) });
  }
  return { root, rails };
}

/** One oil buffer, the foot at the pad's top: base plate, body, rod and head. */
function buildBuffer(look: MachineLook): THREE.Group {
  const g = group('buffer');
  const y = PAD_TOP;
  box(g, look.brake, BUFFER.plate, BUFFER.plateT, BUFFER.plate, 0, y + BUFFER.plateT / 2, 0);
  const bodyH = BUFFER.h * 0.55;
  cyl(g, look.yellow, 'y', BUFFER.r, y + BUFFER.plateT, y + BUFFER.plateT + bodyH, 0, 0, 24);
  cyl(g, look.brake, 'y', BUFFER.r + 0.012, y + BUFFER.plateT + bodyH - 0.03, y + BUFFER.plateT + bodyH, 0, 0, 24);
  const rodTop = y + BUFFER.h - 0.03;
  cyl(g, look.bright, 'y', BUFFER.rod, y + BUFFER.plateT + bodyH, rodTop, 0, 0, 16);
  cyl(g, look.rubber, 'y', BUFFER.rod + 0.03, rodTop, y + BUFFER.h, 0, 0, 20);
  const a = BUFFER.plate / 2 - 0.035;
  for (const ax of [-a, a])
    for (const az of [-a, a]) {
      const nut = boltHead(0.016, 0.014, look.steel);
      nut.position.set(ax, y + BUFFER.plateT, az);
      g.add(nut);
    }
  return g;
}

export function buildBuffers(look: MachineLook): { root: THREE.Group } {
  const root = group('end-buffer');
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const g = buildBuffer(look);
      g.position.set(sx * BUFFER.x, 0, sz * BUFFER.z);
      root.add(g);
    }
  return { root };
}

/** The ladder up the −Z face: two stiles, rungs, stand-offs at every level, a rail of fall arrest down its middle with its runner, a landing cage at the top. */
export function buildLadder(look: MachineLook): THREE.Group {
  const g = group('service-ladder');
  const y0 = PAD_TOP;
  const y1 = LADDER.top;
  const z = LADDER.z;
  for (const s of [-1, 1]) {
    box(g, look.galvanised, LADDER.stile, y1 - y0, LADDER.stile, LADDER.x + (s * LADDER.w) / 2, (y0 + y1) / 2, z);
    // foot plate on the pad
    box(g, look.galvanisedDark, 0.1, 0.012, 0.1, LADDER.x + (s * LADDER.w) / 2, y0 + 0.006, z);
  }
  // rungs
  const n = Math.floor((y1 - y0 - 0.3) / LADDER.rung);
  for (let i = 1; i <= n; i++) {
    const y = y0 + i * LADDER.rung;
    cyl(g, look.galvanised, 'x', 0.012, LADDER.x - LADDER.w / 2, LADDER.x + LADDER.w / 2, y, z, 8);
  }
  // stand-offs to the struts of the −Z face, then the rail of the fall arrest in the ladder's middle
  const zStrut = -(L + (TOWER.strutD * 0.8) / 2);
  for (let i = 1; i < TOWER.panels; i++) {
    const y = levelY(i);
    for (const s of [-1, 1])
      boxFromTo(
        g,
        look.galvanisedDark,
        [LADDER.x + (s * LADDER.w) / 2 - 0.03, y - 0.02, z],
        [LADDER.x + (s * LADDER.w) / 2 + 0.03, y + 0.02, zStrut],
      );
  }
  // the top stand-offs, to the ring beam
  for (const s of [-1, 1]) {
    const y = LEG_TOP + TOWER.ringD / 2;
    boxFromTo(
      g,
      look.galvanisedDark,
      [LADDER.x + (s * LADDER.w) / 2 - 0.03, y - 0.02, z],
      [LADDER.x + (s * LADDER.w) / 2 + 0.03, y + 0.02, -(L + TOWER.ringW / 2)],
    );
  }
  // the fall-arrest rail: a thin yellow-capped T on the rungs
  box(g, look.steel, 0.022, y1 - y0 - 0.25, 0.018, LADDER.x, (y0 + y1 - 0.25) / 2 + 0.25, z + 0.02);
  box(g, look.yellow, 0.05, 0.12, 0.05, LADDER.x, y0 + 1.1, z + 0.035);
  // a cage from 2.5 m up: hoops and bars
  const yCage0 = y0 + 2.5;
  const hoop = new THREE.TorusGeometry(0.38, 0.008, 6, 20, Math.PI);
  hoop.rotateX(-Math.PI / 2);
  hoop.rotateZ(0);
  const step = 1.2;
  const hoops = Math.floor((y1 - yCage0) / step);
  for (let i = 0; i <= hoops; i++) {
    const y = yCage0 + i * step;
    g.add(mesh(hoop, look.galvanised, [LADDER.x, y, z]));
    // the hoop's two ends reach the stiles
    for (const s of [-1, 1])
      cyl(g, look.galvanised, 'x', 0.008, LADDER.x + (s * LADDER.w) / 2, LADDER.x + s * 0.38, y, z, 6);
  }
  for (const a of [Math.PI * 0.22, Math.PI * 0.5, Math.PI * 0.78]) {
    const bx = LADDER.x + 0.38 * Math.cos(a);
    const bz = z - 0.38 * Math.sin(a);
    box(g, look.galvanised, 0.03, hoops * step, 0.008, bx, yCage0 + (hoops * step) / 2, bz);
  }
  return g;
}

/** The ruler: a strip on stand-offs near the +X +Z leg, one band a metre on its left half, one a hundred watt-hours on its right half; no writing, the names are the labels'. */
export function buildScale(look: MachineLook): THREE.Group {
  const g = group('height-scale');
  const y0 = levelY(0) + 0.4;
  const zFace = SCALE.z;
  const len = STROKE + 2.2;
  box(g, look.galvanisedDark, SCALE.w + 0.02, len, SCALE.thick, SCALE.x, y0 + len / 2, zFace - SCALE.thick / 2);
  // bands of the metre scale, the fifth a longer one
  const zFront = zFace + 0.002;
  const halfW = SCALE.w / 2;
  for (let m = 0; m <= STROKE; m++) {
    const y = y0 + 1.1 + m;
    const major = m % 5 === 0;
    box(
      g,
      major ? look.scaleDark : look.scaleLight,
      major ? halfW : halfW * 0.72,
      major ? 0.09 : 0.05,
      0.004,
      SCALE.x - halfW / 2 - (major ? 0 : 0.012),
      y,
      zFront,
    );
  }
  // bands of the watt-hour scale: copper, one per 100 Wh
  for (let h = 0, k = 0; h <= STROKE + 1e-6; h += WH100_M, k++) {
    const y = y0 + 1.1 + h;
    box(
      g,
      look.scaleCopper,
      k % 5 === 0 ? halfW : halfW * 0.72,
      k % 5 === 0 ? 0.09 : 0.05,
      0.004,
      SCALE.x + halfW / 2 + (k % 5 === 0 ? 0 : 0.012),
      y,
      zFront,
    );
  }
  // stand-offs out to the struts of the +Z face
  const zStrut = L - (TOWER.strutD * 0.8) / 2;
  for (let i = 1; i < TOWER.panels; i++) {
    const y = levelY(i);
    if (y < y0 || y > y0 + len) continue;
    boxFromTo(
      g,
      look.galvanisedDark,
      [SCALE.x - 0.05, y - 0.02, zFace - SCALE.thick],
      [SCALE.x + 0.05, y + 0.02, zStrut],
    );
  }
  // its foot: a post down to the pad
  boxFromTo(
    g,
    look.galvanisedDark,
    [SCALE.x - 0.03, PAD_TOP, zFace - SCALE.thick - 0.05],
    [SCALE.x + 0.03, y0 + 0.1, zFace - SCALE.thick],
  );
  box(g, look.galvanisedDark, 0.16, 0.012, 0.16, SCALE.x, PAD_TOP + 0.006, zFace - SCALE.thick - 0.025);
  return g;
}

/**
 * The head frame: the ring beam on the legs, the two channels the hoist's feet bolt on (the section of S9's drawing), the plates of the deck around the opening where the falls
 * go through, the handrails, the posts and the small roof over the hoist.
 */
export function buildHeadFrame(look: MachineLook): { root: THREE.Group; roof: THREE.Group } {
  const g = group('head-frame');
  const roof = group('roof');
  roof.userData.dynamic = true;
  g.add(roof);
  const yRing = LEG_TOP + TOWER.ringD / 2;
  // ring beam
  const ringLen = 2 * L + TOWER.ringW;
  for (const s of [-1, 1]) {
    g.add(mesh(hBeamX(TOWER.ringW, TOWER.ringD, 0.022, 0.014, ringLen), look.galvanised, [0, yRing, s * L]));
    g.add(
      mesh(hBeamZ(TOWER.ringW, TOWER.ringD, 0.022, 0.014, 2 * L - TOWER.ringW), look.galvanised, [s * L, yRing, 0]),
    );
  }
  // cap plates on the legs
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) box(g, look.galvanisedDark, 0.34, 0.02, 0.34, sx * L, LEG_TOP - 0.01, sz * L);
  // the hoist's channels, along Z from ring to ring: top flange at the deck's plane, opening towards the falls
  const chLen = 2 * L - TOWER.ringW;
  const cD = TOWER.channelD;
  const cW = TOWER.channelW;
  for (const x of FOOT_X) {
    const ch = boxes([
      [cW, 0.012, chLen, x, DECK_TOP - 0.006, 0],
      [cW, 0.012, chLen, x, DECK_TOP - cD + 0.006, 0],
      [0.01, cD - 0.024, chLen, x, DECK_TOP - cD / 2, 0],
    ]);
    g.add(mesh(ch, look.galvanisedDark));
    // bearing stubs on the ring beams
    for (const s of [-1, 1])
      box(g, look.galvanisedDark, cW + 0.06, 0.012, 0.1, x, DECK_TOP - cD - 0.006, s * (L - TOWER.ringW / 2 - 0.05));
  }
  // a cross channel carries the deck plates' edges and the governor
  // the plates lie on the beams: never in the plane of a beam's top, which would flicker
  const plate = (x0: number, x1: number, z0: number, z1: number) =>
    boxFromTo(g, look.checker, [x0, DECK_TOP + 0.0005, z0], [x1, DECK_TOP + DECK_PLATE, z1]);
  const inner = L + TOWER.ringW / 2;
  // front strip, left strip, the rear part: an opening stays for the falls, between the channels, in front of the motor
  plate(-inner, inner, -inner, FRAME_FRONT - 0.06);
  plate(-inner, FOOT_X[0] - cW / 2, FRAME_FRONT - 0.06, DECK_OPENING_REAR);
  plate(-inner, inner, DECK_OPENING_REAR, inner);
  plate(FOOT_X[1] + cW / 2, inner, FRAME_FRONT - 0.06, DECK_OPENING_REAR);
  // beams under the plates' inner edges, channel to ring
  box(g, look.galvanisedDark, 2 * L - TOWER.ringW, 0.1, 0.06, 0, DECK_TOP - 0.052, FRAME_FRONT - 0.09);
  box(g, look.galvanisedDark, 2 * L - TOWER.ringW, 0.1, 0.06, 0, DECK_TOP - 0.052, DECK_OPENING_REAR + 0.03);
  // handrails: two rails and posts round the deck, a gap where the ladder arrives
  const yr = DECK_TOP + TOWER.rail;
  const r = L + TOWER.ringW / 2 - 0.02;
  const postAt: [number, number][] = [];
  for (let i = 0; i <= 4; i++) {
    const u = -r + (i * 2 * r) / 4;
    postAt.push([u, r], [r, u], [-r, u]);
    if (Math.abs(u - LADDER.x) > 0.6) postAt.push([u, -r]);
  }
  for (const [x, z] of postAt) cyl(g, look.yellow, 'y', 0.018, DECK_TOP, yr, x, z, 8);
  const railRun = (a: [number, number], b: [number, number]) => {
    for (const y of [yr, DECK_TOP + TOWER.rail / 2 + 0.02])
      g.add(mesh(sweep([V(a[0], y, a[1]), V(b[0], y, b[1])], 0.016, 6), look.yellow));
  };
  railRun([r, r], [-r, r]);
  railRun([r, -r], [r, r]);
  railRun([-r, -r], [-r, r]);
  railRun([-r, -r], [LADDER.x - 0.34, -r]);
  railRun([LADDER.x + 0.34, -r], [r, -r]);
  // toe boards
  box(g, look.yellow, 2 * r, 0.1, 0.006, 0, DECK_TOP + 0.05, r);
  box(g, look.yellow, 0.006, 0.1, 2 * r, r, DECK_TOP + 0.05, 0);
  box(g, look.yellow, 0.006, 0.1, 2 * r, -r, DECK_TOP + 0.05, 0);
  // the roof's posts on the legs' heads, then purlins and a pitched sheet: ridge along X, the ridge at the tower's height
  const eaves = TOWER.eavesY;
  // the lamp's top is the tower's height
  const ridge = TOWER.height - 0.17;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      g.add(
        mesh(hColumn(0.14, 0.012, 0.009, eaves - DECK_TOP), look.galvanised, [
          sx * (L - 0.02),
          DECK_TOP,
          sz * (L - 0.02),
        ]),
      );
      // knee braces
      const a = V(sx * (L - 0.02), eaves - 0.75, sz * (L - 0.02));
      const b = V(sx * (L - 0.02), eaves - 0.05, sz * (L - 0.75));
      const len = a.distanceTo(b);
      const m = mesh(angleBar(0.06, 0.008, len), look.galvanisedDark);
      between(m, a, b, V(sx, 0, 0));
      g.add(m);
    }
  // eaves beams and rafters
  const zE = L + TOWER.roofOverhang;
  const xE = L + TOWER.roofOverhang;
  const slope = Math.hypot(zE, ridge - eaves + (TOWER.roofOverhang * (ridge - eaves)) / L);
  const pitch = Math.atan2(ridge - eaves, L);
  for (const s of [-1, 1]) box(roof, look.galvanised, 2 * L, 0.12, 0.1, 0, eaves, s * (L - 0.02));
  for (const x of [-L, -L / 3, L / 3, L]) {
    for (const s of [-1, 1]) {
      const a = V(x, eaves + 0.06 - TOWER.roofOverhang * Math.tan(pitch), s * zE);
      const b = V(x, ridge - 0.07, 0);
      const len = a.distanceTo(b);
      const m = mesh(new THREE.BoxGeometry(0.07, len, 0.09), look.galvanised);
      m.geometry.translate(0, len / 2, 0);
      between(m, a, b, V(0, 1, 0));
      roof.add(m);
    }
  }
  // the sheets
  const sheet = new THREE.BoxGeometry(2 * xE, 0.012, slope);
  for (const s of [-1, 1]) {
    const m = mesh(sheet, look.roof);
    const zMid = (s * zE) / 2;
    const yMid = ridge - 0.006 - (zE / 2) * Math.tan(pitch);
    m.position.set(0, yMid, zMid);
    m.rotation.x = s * pitch;
    roof.add(m);
  }
  // the ridge cap, and the obstruction lamp on its middle
  box(roof, look.roof, 2 * xE, 0.02, 0.2, 0, ridge - 0.006, 0);
  cyl(roof, look.steel, 'y', 0.012, ridge, ridge + 0.1, 0, 0, 8);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), look.beacon);
  beacon.position.set(0, ridge + 0.12, 0);
  beacon.castShadow = false;
  roof.add(beacon);
  return { root: g, roof };
}

/** The motor's cable up the leg, in a tray; ends in the motor's terminal box. Scenery in the `tower` and `hoist` worlds; `terminal` in the machine frame. */
export function buildRiser(look: MachineLook, terminal: THREE.Vector3): THREE.Group {
  const g = group('cable-riser');
  const x = RISER.x;
  const z = RISER.z;
  const y0 = PAD_TOP;
  const y1 = DECK_TOP + 0.12;
  // the tray on the leg
  boxFromTo(g, look.galvanisedDark, [x - 0.018, y0, z - RISER.w / 2], [x + 0.018, y1, z - RISER.w / 2 + 0.004]);
  boxFromTo(g, look.galvanisedDark, [x - 0.018, y0, z + RISER.w / 2 - 0.004], [x + 0.018, y1, z + RISER.w / 2]);
  boxFromTo(g, look.galvanisedDark, [x + 0.018, y0, z - RISER.w / 2], [x + 0.024, y1, z + RISER.w / 2]);
  for (let i = 1; i < TOWER.panels; i++) box(g, look.galvanisedDark, 0.04, 0.06, 0.04, x + 0.03, levelY(i), z);
  const pts = rounded(
    [
      V(x - 0.005, y0, z),
      V(x - 0.005, y1, z),
      V(x + 0.45, y1 + 0.05, z - 0.25),
      V(terminal.x - 0.2, y1 + 0.1, terminal.z + 0.1),
      V(terminal.x, y1 + 0.06, terminal.z + 0.2),
      V(terminal.x, terminal.y, terminal.z + 0.06),
    ],
    0.14,
    5,
  );
  g.add(mesh(sweep(pts, 0.0165, 8), look.cable));
  return g;
}
