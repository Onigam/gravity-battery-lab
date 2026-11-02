import * as THREE from 'three';
import { emissive, group, MAT, mesh, rng } from '@onigam/lab-kit/three';
import { BLOCK, DECK_TOP, HALF_BLOCK, PAD, PAD_TOP, RISER, SHED, SITE } from '../dims';
import { patchMinWidth } from '../rig/look';
import { TAU, aimSegment, box, boxFromTo, cyl, sweep, unitSegment } from '../rig/shapes';
import { metricUV, woodMaterial } from './materials';

// What stands on the farm besides the buildings: the fence round the fall zone and its gate, the wind mast, the block yard and its spare blocks, the cable trench, the utility poles and
// the wires, the telehandler, round bales, a log pile, a water trough. No bare primitive stands in for any of them; no text; every wire ends on an insulator.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const galv = () => new THREE.MeshStandardMaterial({ color: 0xa6a9a6, metalness: 0.45, roughness: 0.66 });

/** Chain link as a mipmapped texture: from afar it fades to a soft haze instead of a shimmer. */
function chainLink(): THREE.DataTexture {
  const N = 64;
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const v = j / N;
      const d1 = Math.abs(((u + v) % 0.5) - 0.25) / 0.25;
      const d2 = Math.abs(((u - v + 1) % 0.5) - 0.25) / 0.25;
      const wire = Math.max(1 - Math.min(1, d1 * 4.4), 1 - Math.min(1, d2 * 4.4));
      const k = (j * N + i) * 4;
      data[k] = 150;
      data[k + 1] = 156;
      data[k + 2] = 156;
      data[k + 3] = Math.round(255 * Math.min(1, wire * 1.4));
    }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

const chainTexture = chainLink();

export function chainMaterial(repeatU: number, repeatV: number): THREE.MeshStandardMaterial {
  const t = chainTexture.clone();
  t.needsUpdate = true;
  t.repeat.set(repeatU, repeatV);
  return new THREE.MeshStandardMaterial({
    map: t,
    transparent: true,
    roughness: 0.6,
    metalness: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/** The fence on its circle: posts in concrete collars, top and bottom rails, the chain link, yellow triangles on some posts. A gap for the gate. */
export function buildFence(): THREE.Group {
  const g = group('exclusion-fence');
  const R = SITE.fenceR;
  const H = SITE.fenceH;
  const a0 = SITE.gate.angle;
  const half = Math.asin(SITE.gate.w / 2 / R);
  const start = a0 + half;
  const span = TAU - 2 * half;
  const n = Math.round((span * R) / 3.6);
  const postMat = galv();
  const collar = MAT.concrete();
  const sign = MAT.warningYellow();
  for (let i = 0; i <= n; i++) {
    const a = start + (i / n) * span;
    const x = R * Math.cos(a);
    const z = R * Math.sin(a);
    cyl(g, postMat, 'y', 0.032, 0, H, x, z, 8);
    cyl(g, collar, 'y', 0.13, 0, 0.1, x, z, 10);
    if (i % 7 === 3) {
      // a warning triangle on the outside, no words
      const t = new THREE.Shape();
      t.moveTo(-0.17, -0.14);
      t.lineTo(0.17, -0.14);
      t.lineTo(0, 0.17);
      t.closePath();
      const tg = new THREE.ExtrudeGeometry(t, { depth: 0.006, bevelEnabled: false });
      const m = mesh(tg, sign, [x * 1.003, 1.5, z * 1.003]);
      m.rotation.y = Math.atan2(x, z);
      g.add(m);
    }
  }
  const arc = (y: number, r: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n * 2; i++) {
      const a = start + (i / (n * 2)) * span;
      pts.push(V(R * Math.cos(a), y, R * Math.sin(a)));
    }
    g.add(mesh(sweep(pts, r, 6), postMat));
  };
  arc(H, 0.02);
  arc(0.14, 0.012);
  // the chain link: an open cylinder round the circle, its seam at the gate
  const link = new THREE.CylinderGeometry(R, R, H - 0.14, 96, 1, true, Math.PI / 2 - (start + span), span);
  link.translate(0, 0.14 + (H - 0.14) / 2, 0);
  const lm = mesh(link, chainMaterial(Math.round((span * R) / 0.32), Math.round((H - 0.14) / 0.32)));
  lm.castShadow = false;
  lm.userData.noShadow = true;
  g.add(lm);
  return g;
}

export interface Gate {
  group: THREE.Group;
  leaves: THREE.Group[];
  lamp: THREE.MeshStandardMaterial;
  anchor: THREE.Object3D;
}

/** Two leaves on two strong posts, a lock with its switch on the right-hand one, a lamp; a cable from the switch along the fence's foot to the trench. */
export function buildGate(): Gate {
  const a0 = SITE.gate.angle;
  const R = SITE.fenceR;
  const w = SITE.gate.w;
  const H = SITE.fenceH;
  const g = group('interlocked-gate', [R * Math.cos(a0), 0, R * Math.sin(a0)]);
  // the gate's frame: x along the chord, z out of the circle
  g.rotation.y = -a0 + Math.PI / 2;
  const post = galv();
  const lamp = emissive(0x53d36b, 2);
  const leaves: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const px = (s * w) / 2;
    cyl(g, post, 'y', 0.06, 0, H + 0.2, px, 0, 12);
    cyl(g, MAT.concrete(), 'y', 0.2, 0, 0.12, px, 0, 12);
    const leaf = group('leaf', [px, 0, 0]);
    leaf.userData.dynamic = true;
    const len = w / 2 - 0.06;
    const dir = -s;
    const lx = (v: number) => dir * v;
    // frame tubes
    box(leaf, post, len, 0.04, 0.04, lx(len / 2), H, 0);
    box(leaf, post, len, 0.04, 0.04, lx(len / 2), 0.2, 0);
    box(leaf, post, 0.04, H - 0.2, 0.04, lx(0.02), (H + 0.2) / 2, 0);
    box(leaf, post, 0.04, H - 0.2, 0.04, lx(len - 0.02), (H + 0.2) / 2, 0);
    // its chain link
    const panel = mesh(
      new THREE.PlaneGeometry(len - 0.06, H - 0.24),
      chainMaterial(Math.round(len / 0.32), Math.round((H - 0.24) / 0.32)),
      [lx(len / 2), (H + 0.2) / 2, 0],
    );
    panel.castShadow = false;
    panel.userData.noShadow = true;
    leaf.add(panel);
    // hinges
    for (const y of [0.45, H - 0.25]) cyl(g, MAT.steelBlack(), 'y', 0.02, y - 0.05, y + 0.05, px, 0.05, 8);
    g.add(leaf);
    leaves.push(leaf);
  }
  // the interlock: a box on the post, a lamp on it, its tongue on the other leaf
  box(g, MAT.warningYellow(), 0.14, 0.2, 0.08, w / 2 - 0.09, 1.25, 0.09);
  cyl(g, lamp, 'z', 0.02, 0.13, 0.14, w / 2 - 0.09, 1.3, 10);
  // its cable along the fence's foot, in a thin duct
  const anchor = new THREE.Object3D();
  anchor.position.set(0, H + 0.5, 0);
  anchor.userData.keep = true;
  g.add(anchor);
  return { group: g, leaves, lamp, anchor };
}

export interface Mast {
  group: THREE.Group;
  cups: THREE.Group;
  vane: THREE.Group;
  anchor: THREE.Object3D;
}

/** The wind mast: a galvanised tube on a plate, three guys to their anchors, cups and a vane at the top, a small box at its foot. */
export function buildMast(wireMat: THREE.MeshStandardMaterial): Mast {
  const s = SITE.mast;
  const g = group('wind-mast', [s.x, 0, s.z]);
  const m = galv();
  cyl(g, m, 'y', s.r, 0.02, s.h, 0, 0, 10, s.r * 0.65);
  box(g, MAT.concrete(), 0.9, 0.1, 0.9, 0, 0.05, 0);
  box(g, MAT.steelBlack(), 0.3, 0.02, 0.3, 0, 0.11, 0);
  box(g, MAT.enclosureGrey(), 0.22, 0.3, 0.12, 0, 1.2, s.r + 0.07);
  // guys at two thirds, three anchors
  const y = s.h * 0.66;
  const seg = unitSegment(6);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.4;
    const ax = 4.6 * Math.cos(a);
    const az = 4.6 * Math.sin(a);
    const anchorBlock = box(g, MAT.concrete(), 0.34, 0.18, 0.34, ax, 0.09, az);
    anchorBlock.castShadow = true;
    box(g, MAT.steelBlack(), 0.04, 0.12, 0.04, ax, 0.22, az);
    const w = new THREE.Mesh(seg, wireMat);
    w.castShadow = false;
    w.userData.noShadow = true;
    aimSegment(w, V(ax, 0.26, az), V(s.r * Math.cos(a), y, s.r * Math.sin(a)), 0.005);
    w.frustumCulled = false;
    g.add(w);
  }
  cyl(g, MAT.steelBlack(), 'y', s.r + 0.012, y - 0.03, y + 0.03, 0, 0, 10);
  // the head: a cross arm with the cups on one end, the vane on the other
  box(g, m, 0.8, 0.03, 0.03, 0, s.h + 0.03, 0);
  const cups = group('cups', [0.4, s.h + 0.05, 0]);
  cups.userData.dynamic = true;
  cups.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), MAT.steelBlack(), [0, 0.05, 0]));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    const arm = 0.16;
    const c = new THREE.SphereGeometry(0.045, 12, 8, 0, TAU, 0, Math.PI / 2);
    c.rotateZ(-Math.PI / 2);
    const cup = mesh(c, MAT.printWhite(), [arm * Math.cos(a), 0.1, arm * Math.sin(a)]);
    cup.rotation.y = -a + Math.PI / 2;
    cups.add(cup);
    const bar = new THREE.BoxGeometry(arm, 0.006, 0.006);
    bar.translate(arm / 2, 0, 0);
    const b = mesh(bar, MAT.steelBlack(), [0, 0.1, 0]);
    b.rotation.y = -a;
    cups.add(b);
  }
  g.add(cups);
  const vane = group('vane', [-0.4, s.h + 0.06, 0]);
  vane.userData.dynamic = true;
  box(vane, MAT.steelBlack(), 0.44, 0.012, 0.012, 0.06, 0.05, 0);
  box(vane, MAT.warningYellow(), 0.16, 0.1, 0.006, 0.22, 0.05, 0);
  g.add(vane);
  const anchor = new THREE.Object3D();
  anchor.position.set(0, s.h + 0.5, 0);
  anchor.userData.keep = true;
  g.add(anchor);
  return { group: g, cups, vane, anchor };
}

/** The block yard: a hard standing next to the pad, spare blocks in stacks, half blocks on pallets, the place marked for the crane's outriggers. */
export function buildYard(
  blockGeo: (l: number, w: number, h: number, seed: number) => THREE.BufferGeometry,
  blockMat: THREE.Material,
): THREE.Group {
  const y = SITE.yard;
  const g = group('block-yard', [y.x, 0, y.z]);
  // the hard standing: a low slab of crushed stone
  const gravel = new THREE.MeshStandardMaterial({ color: 0xa79f8c, roughness: 1 });
  box(g, gravel, y.w, 0.05, y.d, 0, 0.025, 0);
  const kerb = MAT.concrete();
  for (const s of [-1, 1]) {
    box(g, kerb, y.w + 0.2, 0.1, 0.12, 0, 0.05, (s * (y.d + 0.12)) / 2);
    box(g, kerb, 0.12, 0.1, y.d, (s * (y.w + 0.12)) / 2, 0.05, 0);
  }
  const top = 0.05;
  const place = (x: number, z: number, lay: number, along: boolean, half: boolean, seed: number) => {
    const geo = half
      ? blockGeo(HALF_BLOCK.length, HALF_BLOCK.width, HALF_BLOCK.height, seed)
      : blockGeo(BLOCK.length, BLOCK.width, BLOCK.height, seed);
    const h = half ? HALF_BLOCK.height : BLOCK.height;
    const m = mesh(geo, blockMat, [x, top + 0.0 + lay * BLOCK.height + h / 2, z]);
    if (along) m.rotation.y = Math.PI / 2;
    g.add(m);
  };
  // a stack of two layers, one of one, a row of half blocks
  let seed = 300;
  place(-3.6, -2, 0, false, false, seed++);
  place(-3.6, -1.2, 0, false, false, seed++);
  place(-1.8, -2, 0, false, false, seed++);
  place(-1.8, -1.2, 0, false, false, seed++);
  place(-3.2, -1.6, 1, true, false, seed++);
  place(-2.4, -1.6, 1, true, false, seed++);
  place(1.4, -2.2, 0, false, false, seed++);
  place(3.2, -2.2, 0, false, false, seed++);
  place(-3, 1.9, 0, false, true, seed++);
  place(-1.2, 1.9, 0, false, true, seed++);
  place(0.6, 1.9, 0, false, true, seed++);
  // the crane's four pads: steel plates on the stone
  const plate = MAT.steelBlack();
  for (const [x, z] of [
    [-5.4, -3.6],
    [5.4, -3.6],
    [-5.4, 3.6],
    [5.4, 3.6],
  ] as const)
    box(g, plate, 1, 0.03, 1, x, top + 0.015, z);
  // lifting chains hung on a stand
  box(g, galv(), 0.06, 1.4, 0.06, 3.6, top + 0.7, 2);
  box(g, galv(), 0.7, 0.06, 0.06, 3.6, top + 1.38, 2);
  box(g, MAT.steelBlack(), 0.5, 0.012, 0.45, 3.6, top + 0.006, 2);
  return g;
}

export interface Trench {
  group: THREE.Group;
  /** The cable's centre line, for the current's dots and the test of its length. */
  line: THREE.Vector3[];
}

/** The trench from the shed to the pad: a shallow precast duct, kerbs and lids in one-metre lengths, three lifted so that the cables show. */
export function buildTrench(): Trench {
  const t = SITE.trench;
  const g = group('cable-trench');
  const x0 = SHED.x + SHED.w / 2 + SHED.wall;
  const x1 = -PAD.side / 2;
  const concrete = new THREE.MeshStandardMaterial({ color: 0xaba79c, roughness: 0.95 });
  const concreteDark = new THREE.MeshStandardMaterial({ color: 0x8f8c82, roughness: 0.95 });
  const len = x1 - x0;
  const midX = (x0 + x1) / 2;
  // floor and kerbs
  box(g, concreteDark, len, 0.03, t.w, midX, 0.015, t.z);
  for (const s of [-1, 1]) box(g, concrete, len, t.h, 0.08, midX, t.h / 2, t.z + (s * (t.w + 0.08)) / 2);
  // the cables lying in it
  const cable = new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.75 });
  const offs: [number, number][] = [
    [-0.14, 0.018],
    [0.02, 0.024],
    [0.14, 0.012],
  ];
  for (const [dz, r] of offs) {
    const c = new THREE.CylinderGeometry(r, r, len, 8);
    c.rotateZ(Math.PI / 2);
    c.translate(midX, 0.03 + r, t.z + dz);
    g.add(mesh(c, cable));
  }
  // the lids
  const open = new Set([3, 14, 21]);
  const n = Math.floor(len);
  for (let i = 0; i < n; i++) {
    if (open.has(i)) continue;
    const m = box(g, concrete, 0.96, 0.05, t.w + 0.1, x0 + (i + 0.5) * (len / n), t.h + 0.025, t.z);
    m.position.y += (i * 7) % 3 === 0 ? 0.001 : 0;
  }
  // one lifted lid leaning on the kerb
  const lid = box(g, concrete, 0.96, 0.05, t.w + 0.1, x0 + 14.5 * (len / n), 0.2, t.z + 0.85);
  lid.rotation.x = 0.28;
  // the last stretch on the pad, in a steel cover, up to the riser
  const yPad = PAD_TOP;
  const steelCover = MAT.steelBlack();
  boxFromTo(g, steelCover, [x1, yPad, RISER.z - 0.14], [RISER.x + 0.02, yPad + 0.05, RISER.z + 0.14]);
  boxFromTo(
    g,
    steelCover,
    [x1 - 0.02, 0, Math.min(t.z, RISER.z) - 0.14],
    [x1 + 0.28, yPad + 0.05, Math.max(t.z, RISER.z) + 0.14],
  );
  const line = [
    V(x0, 0.08, t.z),
    V(x1, 0.08, t.z),
    V(x1 + 0.14, yPad + 0.04, t.z),
    V(x1 + 0.14, yPad + 0.04, RISER.z),
    V(RISER.x, yPad + 0.04, RISER.z),
    V(RISER.x, DECK_TOP + 0.12, RISER.z),
  ];
  return { group: g, line };
}

/** A wooden utility pole with its crossarm and three insulators. */
export function pole(parent: THREE.Object3D, x: number, z: number, h: number = SITE.pole.h, rot = 0): THREE.Vector3[] {
  const wood = woodMaterial(0x6b5a48, 0.92);
  const p = new THREE.CylinderGeometry(0.095, 0.15, h, 10);
  metricUV(p, 0.8);
  p.translate(x, h / 2, z);
  parent.add(mesh(p, wood));
  const arm = group('arm', [x, h - 0.42, z]);
  arm.rotation.y = rot;
  const armW = 1.5;
  arm.add(mesh(new THREE.BoxGeometry(armW, 0.1, 0.1), wood));
  // the brace
  const ins: THREE.Vector3[] = [];
  const white = new THREE.MeshStandardMaterial({ color: 0xd8d4c4, roughness: 0.35 });
  for (const dx of [-0.65, 0, 0.65]) {
    const m = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.14, 8), white, [dx, 0.12, 0]);
    arm.add(m);
    const v = V(x + dx * Math.cos(rot), h - 0.42 + 0.2, z - dx * Math.sin(rot));
    ins.push(v);
  }
  parent.add(arm);
  return ins;
}

/** The telehandler parked by the gate, a machine a farm has: tyres, cab, boom lowered, forks on the ground. Length along Z. */
export function buildTelehandler(x: number, z: number, rot: number): THREE.Group {
  const g = group('telehandler', [x, 0, z]);
  g.rotation.y = rot;
  const body = new THREE.MeshStandardMaterial({ color: 0xc66a1f, roughness: 0.55, metalness: 0.15 });
  const dark = MAT.steelBlack();
  const tyre = MAT.rubber();
  const wheel = (wx: number, wz: number) => {
    const t = new THREE.CylinderGeometry(0.62, 0.62, 0.42, 22);
    t.rotateZ(Math.PI / 2);
    t.translate(wx, 0.62, wz);
    g.add(mesh(t, tyre));
    const h = new THREE.CylinderGeometry(0.3, 0.3, 0.44, 14);
    h.rotateZ(Math.PI / 2);
    h.translate(wx, 0.62, wz);
    g.add(mesh(h, body));
    // lugs on the tyre: a ring of low blocks, so that it reads as a tractor's
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      box(g, tyre, 0.44, 0.06, 0.14, wx, 0.62 + 0.62 * Math.sin(a), wz + 0.62 * Math.cos(a)).rotation.x = -a;
    }
  };
  for (const s of [-1, 1]) {
    wheel(s * 1.04, 1.45);
    wheel(s * 1.04, -1.45);
  }
  // chassis and engine
  boxFromTo(g, dark, [-0.75, 0.45, -2.2], [0.75, 0.75, 2.2]);
  boxFromTo(g, body, [-0.15, 0.75, -2.4], [0.8, 1.55, 0.4]);
  // cab
  const glassy = new THREE.MeshStandardMaterial({ color: 0x2b3940, roughness: 0.2, metalness: 0.2 });
  boxFromTo(g, glassy, [-0.92, 0.85, -0.6], [-0.2, 2.35, 1.1]);
  boxFromTo(g, body, [-0.95, 2.35, -0.65], [-0.17, 2.45, 1.15]);
  for (const zz of [-0.62, 1.12])
    for (const xx of [-0.94, -0.18]) boxFromTo(g, dark, [xx - 0.03, 0.85, zz - 0.03], [xx + 0.03, 2.38, zz + 0.03]);
  // the boom: lowered, along the machine on its right, from the rear to beyond the front
  const boom = group('boom', [0.2, 1.65, -1.9]);
  boom.rotation.x = 0.21;
  boxFromTo(boom, body, [-0.18, -0.2, 0], [0.18, 0.2, 3.9]);
  boxFromTo(boom, dark, [-0.13, -0.15, 3.9], [0.13, 0.15, 5.1]);
  g.add(boom);
  // the fork plate and forks on the ground
  const fz = 3.3;
  boxFromTo(g, dark, [-0.46, 0.05, fz], [0.86, 0.8, fz + 0.1]);
  for (const fx of [-0.3, 0.7]) boxFromTo(g, dark, [fx - 0.06, 0.02, fz + 0.05], [fx + 0.06, 0.08, fz + 1.2]);
  // the boom's lower end reaches the fork plate
  const tip = sweep([V(0.2, 1.05, fz - 0.2), V(0.2, 0.8, fz + 0.05)], 0.08, 8);
  g.add(mesh(tip, dark));
  // lamp on the cab's roof
  cyl(g, MAT.warningYellow(), 'y', 0.05, 2.45, 2.56, -0.55, 0.2, 10);
  return g;
}

/** Round bales, a log pile, a water trough, pallets: what a yard is full of. */
export function buildYardProps(): THREE.Group {
  const g = group('yard-props');
  const r = rng(77);
  const strawA = new THREE.MeshStandardMaterial({ color: 0xc8a960, roughness: 1 });
  const strawB = new THREE.MeshStandardMaterial({ color: 0xb49447, roughness: 1 });
  // round bales in a row by the barn, some on their ends
  const bale = (x: number, z: number, lying: boolean) => {
    const c = new THREE.CylinderGeometry(0.75, 0.75, 1.2, 18);
    if (lying) {
      c.rotateZ(Math.PI / 2);
      c.rotateY(r() * 0.3);
    }
    c.translate(x, lying ? 0.75 : 0.6, z);
    g.add(mesh(c, r() > 0.5 ? strawA : strawB));
    const rings = new THREE.TorusGeometry(0.76, 0.008, 4, 22);
    if (lying) rings.rotateY(Math.PI / 2);
    else rings.rotateX(Math.PI / 2);
    for (const k of [-0.3, 0, 0.3]) {
      const rg = rings.clone();
      if (lying) rg.translate(x + k, 0.75, z);
      else rg.translate(x, 0.6 + k, z);
      g.add(mesh(rg, strawB));
    }
  };
  const bx = SITE.barn.x + SITE.barn.len / 2 + 3;
  for (let i = 0; i < 5; i++) bale(bx, SITE.barn.z - 6 + i * 2.1, true);
  bale(bx + 1.6, SITE.barn.z - 4.8, true);
  bale(bx + 1.6, SITE.barn.z - 2.7, false);
  // a log pile against the house's east wall
  const logMat = woodMaterial(0x7a5e42, 0.95);
  const lx = SITE.house.x + SITE.house.w / 2 + 1;
  const lz = SITE.house.z + 1;
  for (let lay = 0; lay < 5; lay++)
    for (let i = 0; i < 12 - lay; i++) {
      const c = new THREE.CylinderGeometry(0.09, 0.09, 1.1, 8);
      c.rotateX(Math.PI / 2);
      metricUV(c, 0.6);
      c.translate(lx + (i - (11 - lay) / 2) * 0.19 + 0.3 * (lay % 2) * 0.1, 0.09 + lay * 0.17, lz);
      g.add(mesh(c, logMat));
    }
  // a water trough on the meadow
  const trough = MAT.concrete();
  const tx = 34;
  const tz = -13;
  boxFromTo(g, trough, [tx - 1.4, 0, tz - 0.42], [tx + 1.4, 0.15, tz + 0.42]);
  for (const s of [-1, 1]) {
    boxFromTo(
      g,
      trough,
      [tx - 1.4, 0.15, tz + s * 0.42 - (s > 0 ? 0.08 : 0)],
      [tx + 1.4, 0.56, tz + s * 0.42 + (s < 0 ? 0.08 : 0)],
    );
    boxFromTo(
      g,
      trough,
      [tx + s * 1.4 - (s > 0 ? 0.08 : 0), 0.15, tz - 0.42],
      [tx + s * 1.4 + (s < 0 ? 0.08 : 0), 0.56, tz + 0.42],
    );
  }
  const water = new THREE.MeshStandardMaterial({ color: 0x4d6a78, roughness: 0.2, metalness: 0.3 });
  boxFromTo(g, water, [tx - 1.33, 0.15, tz - 0.35], [tx + 1.33, 0.47, tz + 0.35]);
  // pallets of half blocks' lifting gear by the gate: a stack of pallets
  const palletWood = woodMaterial(0xa18760, 0.9);
  for (let i = 0; i < 4; i++) {
    for (const dz of [-0.45, 0, 0.45])
      boxFromTo(
        g,
        palletWood,
        [-8 - 0.6, 0.02 + i * 0.145, 33 + dz - 0.05],
        [-8 + 0.6, 0.12 + i * 0.145, 33 + dz + 0.05],
      );
    for (const dx of [-0.5, 0, 0.5])
      boxFromTo(
        g,
        palletWood,
        [-8 + dx - 0.05, 0.12 + i * 0.145, 33 - 0.5],
        [-8 + dx + 0.05, 0.145 + i * 0.145, 33 + 0.5],
      );
  }
  return g;
}

/** The small wooden paddock fence north of the house, posts and two rails. */
export function buildPaddock(): THREE.Group {
  const g = group('paddock');
  const wood = woodMaterial(0x7c6a52, 0.92);
  const pts: [number, number][] = [
    [28, -24],
    [28, -6],
    [62, -6],
  ];
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.round(len / 3);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const c = new THREE.CylinderGeometry(0.06, 0.07, 1.3, 7);
      c.translate(ax + (bx - ax) * t, 0.65, az + (bz - az) * t);
      metricUV(c, 0.8);
      g.add(mesh(c, wood));
    }
    for (const y of [0.55, 1.05]) {
      const rail = new THREE.BoxGeometry(0.06, 0.09, len);
      metricUV(rail, 0.8);
      const m = mesh(rail, wood, [(ax + bx) / 2, y, (az + bz) / 2]);
      m.rotation.y = Math.atan2(bx - ax, bz - az);
      g.add(m);
    }
  }
  return g;
}

/** A wire between two points, with a sag, as a run of short unit segments under the smallest-width material. */
export function wire(
  parent: THREE.Object3D,
  a: THREE.Vector3,
  b: THREE.Vector3,
  mat: THREE.MeshStandardMaterial,
  sag = 0.5,
  r = 0.008,
): THREE.Vector3[] {
  const seg = unitSegment(5);
  const pts: THREE.Vector3[] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = a.clone().lerp(b, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(seg, mat);
    m.castShadow = false;
    m.userData.noShadow = true;
    m.frustumCulled = false;
    aimSegment(m, pts[i], pts[i + 1], r);
    parent.add(m);
  }
  return pts;
}

export const wireMaterial = (): THREE.MeshStandardMaterial =>
  patchMinWidth(new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.6, metalness: 0.2 }), 1);
