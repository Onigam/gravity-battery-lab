import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '@onigam/lab-kit/three';
import { smoothstep as ss } from '../common';
import { fbm, patchWind, sceneryTextures, vnoise } from './materials';
import { FOOTPRINTS, insideFence, onFarmland, terrainHeight, trackDistance } from './terrain';

// The plants of the farm, all instanced: a row of Lombardy poplars along the west track, oaks with a real trunk and a crown of lobes round the yard, apple trees by the house, hedges along
// the fields, tree belts on the far edge of the plain (a plain, flat on purpose: nothing rises but trees and buildings), tufts of grass and wild flowers in the meadow. Each species
// is one geometry (a unit tree: height 1, the foot at the origin) with its colours in the vertices and a per-vertex sway; the geometry code is Mill Lab's. The placement is
// deterministic (a seeded generator) and keeps off the fence, the tracks, the buildings and the home view's sight line of the tower.

export interface Inst {
  x: number;
  y: number;
  z: number;
  /** Height (trees) or size (shrubs, cards, rocks), m. */
  s: number;
  /** Width relative to the height. */
  w: number;
  rot: number;
  /** Lean from the vertical, radians, towards `leanDir`. */
  lean: number;
  leanDir: number;
  /** A number in 0..1 that picks the tint. */
  tint: number;
}

// ------------------------------------------------------------------------------------------------ geometry (Mill Lab's)

class Mesher {
  pos: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  sway: number[] = [];
  nor: number[] = [];
  idx: number[] = [];
  get n(): number {
    return this.pos.length / 3;
  }
  vert(
    x: number,
    y: number,
    z: number,
    c: THREE.Color,
    u: number,
    v: number,
    sw: number,
    nx = 0,
    ny = 0,
    nz = 0,
  ): number {
    this.pos.push(x, y, z);
    this.col.push(c.r, c.g, c.b);
    this.uv.push(u, v);
    this.sway.push(sw);
    this.nor.push(nx, ny, nz);
    return this.n - 1;
  }
  tri(a: number, b: number, c: number): void {
    this.idx.push(a, b, c);
  }
  build(normals: 'smooth' | 'given' = 'smooth'): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.sway, 1));
    g.setIndex(this.idx);
    if (normals === 'given') g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    else g.computeVertexNormals();
    return g;
  }
}

const unitIco = new Map<number, THREE.BufferGeometry>();
function ico(detail: number): THREE.BufferGeometry {
  let g = unitIco.get(detail);
  if (!g) {
    const raw = new THREE.IcosahedronGeometry(1, detail);
    raw.deleteAttribute('normal');
    raw.deleteAttribute('uv');
    g = mergeVertices(raw, 1e-4);
    unitIco.set(detail, g);
  }
  return g;
}

const C = (hex: number): THREE.Color => new THREE.Color(hex);

/** A tapered tube along a polyline (a trunk or a limb): rings of `sides` points, bark UVs, little sway. */
function tube(
  m: Mesher,
  pts: [number, number, number][],
  radii: number[],
  sides: number,
  ca: THREE.Color,
  cb: THREE.Color,
  uvk = 12,
): void {
  const rings: number[][] = [];
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const tmp = new THREE.Color();
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = new THREE.Vector3(...pts[Math.max(0, i - 1)]);
    const c = new THREE.Vector3(...pts[Math.min(pts.length - 1, i + 1)]);
    t.subVectors(c, a).normalize();
    const ref = Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    n.crossVectors(t, ref).normalize();
    b.crossVectors(t, n).normalize();
    if (i > 0) len += new THREE.Vector3(...pts[i]).distanceTo(new THREE.Vector3(...pts[i - 1]));
    tmp.copy(ca).lerp(cb, i / Math.max(1, pts.length - 1));
    const ring: number[] = [];
    for (let s = 0; s <= sides; s++) {
      const ang = (s / sides) * Math.PI * 2;
      const cx = Math.cos(ang);
      const cz = Math.sin(ang);
      const r = radii[i];
      ring.push(
        m.vert(
          pts[i][0] + (n.x * cx + b.x * cz) * r,
          pts[i][1] + (n.y * cx + b.y * cz) * r,
          pts[i][2] + (n.z * cx + b.z * cz) * r,
          tmp,
          (s / sides) * 2,
          len * uvk,
          0.12 * Math.min(1, pts[i][1]) ** 2,
        ),
      );
    }
    rings.push(ring);
  }
  for (let i = 0; i < rings.length - 1; i++)
    for (let s = 0; s < sides; s++) {
      const a = rings[i][s];
      const b2 = rings[i][s + 1];
      const c = rings[i + 1][s];
      const d = rings[i + 1][s + 1];
      m.tri(a, c, b2);
      m.tri(b2, c, d);
    }
}
/**
 * A crown: many small clusters of leaves in a volume, lit as one volume (each vertex's normal leans towards the crown's own outward direction, so that the mass has a light side and
 * a dark side), darker low and inside. A tree is not a few big blobs: it is this.
 */
function crown(
  m: Mesher,
  n: number,
  spot: (i: number, r: () => number) => { x: number; y: number; z: number; rx: number; ry: number; rz: number },
  centre: (p: THREE.Vector3, out: THREE.Vector3) => THREE.Vector3,
  o: {
    lo: THREE.Color;
    hi: THREE.Color;
    seed: number;
    detail?: number;
    blend?: number;
    yMin: number;
    yMax: number;
    uvk?: number;
  },
): void {
  const g = ico(o.detail ?? 0);
  const p = g.attributes.position;
  const ix = g.index!;
  const r = rng(o.seed);
  const tmp = new THREE.Color();
  const q = new THREE.Vector3();
  const c = new THREE.Vector3();
  const nr = new THREE.Vector3();
  const blend = o.blend ?? 0.72;
  for (let k = 0; k < n; k++) {
    const sp = spot(k, r);
    const base = m.n;
    const tone = 0.82 + 0.34 * r();
    for (let i = 0; i < p.count; i++) {
      const ux = p.getX(i);
      const uy = p.getY(i);
      const uz = p.getZ(i);
      const f = 1 + 0.3 * (vnoise(ux * 2.1 + k * 0.7, uy * 2.1 + uz * 1.7 + k) - 0.5);
      q.set(sp.x + ux * sp.rx * f, sp.y + uy * sp.ry * f, sp.z + uz * sp.rz * f);
      centre(q, c);
      nr.set(q.x - c.x, q.y - c.y, q.z - c.z).normalize();
      nr.multiplyScalar(blend)
        .add(
          c
            .set(ux, uy, uz)
            .normalize()
            .multiplyScalar(1 - blend),
        )
        .normalize();
      const h = ss(o.yMin, o.yMax, q.y);
      tmp
        .copy(o.lo)
        .lerp(o.hi, h * 0.85 + 0.15 * r())
        .multiplyScalar(tone);
      const u = o.uvk ?? 8;
      m.vert(
        q.x,
        q.y,
        q.z,
        tmp,
        (q.x + 0.5 * q.z) * u,
        (q.y + 0.3 * q.z) * u,
        Math.min(1, Math.max(0, q.y)) ** 2,
        nr.x,
        nr.y,
        nr.z,
      );
    }
    for (let i = 0; i < ix.count; i++) m.idx.push(base + ix.getX(i));
  }
}

/** A Lombardy poplar: a straight trunk that goes on through the crown, and a tall narrow flame of leaves, its branches all rising. */
function poplarGeometry(): { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry } {
  const wood = new Mesher();
  tube(
    wood,
    [
      [0, 0, 0],
      [0.003, 0.2, 0],
      [0, 0.45, 0.003],
      [0.002, 0.8, 0],
    ],
    [0.018, 0.013, 0.009, 0.003],
    7,
    C(0x4d4338),
    C(0x6b6254),
  );
  const lv = new Mesher();
  const profile = (t: number) =>
    0.022 + 0.098 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.72) * (1 - 0.25 * t);
  crown(
    lv,
    30,
    (_, r) => {
      const t = Math.pow(r(), 0.85);
      const y = 0.13 + 0.86 * t;
      const rad = profile(t);
      const a = r() * Math.PI * 2;
      const d = rad * Math.sqrt(0.2 + 0.6 * r());
      return {
        x: Math.cos(a) * d,
        y,
        z: Math.sin(a) * d,
        rx: 0.05 + 0.02 * r(),
        ry: 0.085 + 0.04 * r(),
        rz: 0.05 + 0.02 * r(),
      };
    },
    (p, c) => c.set(0, p.y, 0),
    { lo: C(0x4a6a28), hi: C(0x93ad45), seed: 11, yMin: 0.1, yMax: 1, uvk: 14, detail: 1 },
  );
  return { wood: wood.build(), leaves: lv.build('given') };
}

/** An oak: a short thick trunk, big limbs that spread low, and a broad domed crown wider than it is tall, in clumps. */
function oakGeometry(): { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry } {
  const wood = new Mesher();
  const ca = C(0x45392d);
  const cb = C(0x665745);
  tube(
    wood,
    [
      [0, 0, 0],
      [0.006, 0.12, 0.002],
      [0.012, 0.26, 0.006],
      [0.014, 0.36, 0.01],
    ],
    [0.058, 0.046, 0.038, 0.03],
    9,
    ca,
    cb,
  );
  const limbs: [number, number, number, number][] = [
    [0.05, 0.3, 0.12, 0.5],
    [-0.1, 0.28, -0.04, 0.46],
    [0.02, 0.32, -0.13, 0.52],
    [-0.04, 0.34, 0.12, 0.56],
    [0.13, 0.34, -0.06, 0.48],
  ];
  for (const [lx, ly, lz, h] of limbs) {
    tube(
      wood,
      [
        [0.012, ly - 0.06, 0.006],
        [lx * 1.5, ly + 0.05, lz * 1.5],
        [lx * 2.8, h, lz * 2.8],
        [lx * 3.6, h + 0.16, lz * 3.6],
      ],
      [0.024, 0.017, 0.01, 0.004],
      6,
      ca,
      cb,
    );
  }
  const lv = new Mesher();
  const clumps: [number, number, number, number][] = [
    [0, 0.72, 0, 0.3],
    [0.26, 0.6, 0.12, 0.25],
    [-0.27, 0.6, -0.1, 0.25],
    [0.05, 0.6, 0.3, 0.25],
    [-0.08, 0.6, -0.31, 0.25],
    [0.2, 0.72, -0.2, 0.22],
    [-0.2, 0.74, 0.2, 0.22],
    [0.4, 0.5, -0.1, 0.17],
    [-0.4, 0.5, 0.1, 0.17],
    [0.12, 0.48, 0.42, 0.17],
    [-0.1, 0.5, -0.42, 0.17],
  ];
  crown(
    lv,
    52,
    (i, r) => {
      const cl = clumps[i % clumps.length];
      const a = r() * Math.PI * 2;
      const e = Math.acos(1 - 1.5 * r());
      const d = cl[3] * (0.65 + 0.35 * r());
      return {
        x: cl[0] + Math.cos(a) * Math.sin(e) * d,
        y: cl[1] + Math.cos(e) * d * 0.8,
        z: cl[2] + Math.sin(a) * Math.sin(e) * d,
        rx: 0.085 + 0.045 * r(),
        ry: 0.07 + 0.035 * r(),
        rz: 0.085 + 0.045 * r(),
      };
    },
    (p, c) => {
      // the nearest clump, for the dappled light of a crown in lumps
      let best = clumps[0];
      let bd = Infinity;
      for (const k of clumps) {
        const d = (p.x - k[0]) ** 2 + (p.y - k[1]) ** 2 + (p.z - k[2]) ** 2;
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      return c.set(best[0] * 0.8, best[1] * 0.9, best[2] * 0.8);
    },
    { lo: C(0x365421), hi: C(0x7ca03f), seed: 21, yMin: 0.34, yMax: 0.98, uvk: 9, detail: 1 },
  );
  return { wood: wood.build(), leaves: lv.build('given') };
}

/** A shrub, a hedge's piece, a tree of the far belts: a low mass in small clusters. */
function shrubGeometry(n = 6, detail = 1): THREE.BufferGeometry {
  const m = new Mesher();
  crown(
    m,
    n,
    (_, r) => {
      const a = r() * Math.PI * 2;
      const e = Math.acos(1 - 1.5 * r());
      const d = 0.2 + 0.3 * r();
      return {
        x: Math.cos(a) * Math.sin(e) * d,
        y: 0.34 + Math.cos(e) * d * 0.9,
        z: Math.sin(a) * Math.sin(e) * d,
        rx: 0.24,
        ry: 0.21,
        rz: 0.24,
      };
    },
    (p, c) => c.set(0, 0.3, 0).setY(0.3 + 0 * p.y),
    { lo: C(0x3f5d26), hi: C(0x8ca94c), seed: 50, yMin: 0.05, yMax: 0.95, uvk: 3, detail },
  );
  return m.build('given');
}

/** Crossed cards (quads) of width `w` and height `h`, normals straight up so that they light like the ground, alpha cut out by the sprite. */
function cardGeometry(w: number, h: number, cards: number, tint = C(0xffffff)): THREE.BufferGeometry {
  const m = new Mesher();
  for (let k = 0; k < cards; k++) {
    const a = (k / cards) * Math.PI;
    const dx = Math.cos(a) * w * 0.5;
    const dz = Math.sin(a) * w * 0.5;
    const v0 = m.vert(-dx, 0, -dz, tint, 0, 0, 0, 0, 1, 0);
    const v1 = m.vert(dx, 0, dz, tint, 1, 0, 0, 0, 1, 0);
    const v2 = m.vert(dx, h, dz, tint, 1, 1, 1, 0, 1, 0);
    const v3 = m.vert(-dx, h, -dz, tint, 0, 1, 1, 0, 1, 0);
    m.tri(v0, v1, v2);
    m.tri(v0, v2, v3);
  }
  return m.build('given');
}

// ------------------------------------------------------------------------------------------------ placement

// ------------------------------------------------------------------------------------------------ the plan

export interface VegetationPlan {
  poplars: Inst[];
  oaks: Inst[];
  apples: Inst[];
  belts: Inst[];
  hedges: Inst[];
  /** The hedges round the farm, seen from close: a richer geometry. */
  hedgesNear: Inst[];
  shrubs: Inst[];
  tufts: Inst[];
  flowers: Inst[];
}

const inst = (x: number, z: number, s: number, w: number, r: () => number): Inst => ({
  x,
  y: terrainHeight(x, z),
  z,
  s,
  w,
  rot: r() * Math.PI * 2,
  lean: 0,
  leanDir: 0,
  tint: r(),
});

/** The line of sight from the home camera to the tower: tall things keep off it. */
const CAM = { x: 66, z: 98 };
const sightDistance = (x: number, z: number): number => {
  const dx = CAM.x;
  const dz = CAM.z;
  const t = Math.max(0, Math.min(1.4, (x * dx + z * dz) / (dx * dx + dz * dz)));
  return Math.hypot(dx * t - x, dz * t - z);
};

function spotOk(x: number, z: number, r: number): boolean {
  if (insideFence(x, z, r + 1.6)) return false;
  if (trackDistance(x, z).d < r + 2.2) return false;
  for (const f of FOOTPRINTS) if (x > f.x0 - r && x < f.x1 + r && z > f.z0 - r && z < f.z1 + r) return false;
  return true;
}

export function planVegetation(): VegetationPlan {
  const r = rng(1802);
  const plan: VegetationPlan = {
    poplars: [],
    oaks: [],
    apples: [],
    belts: [],
    hedges: [],
    hedgesNear: [],
    shrubs: [],
    tufts: [],
    flowers: [],
  };

  // ---- Lombardy poplars: a row along the west of the farm, and a few behind the barn
  for (let z = -120; z < 95; z += 10.5 + 3 * r()) {
    const x = -104 + 2.5 * (r() - 0.5);
    if (!spotOk(x, z, 1)) continue;
    plan.poplars.push(inst(x, z, 18 + 8 * r(), 0.95 + 0.25 * r(), r));
  }
  // ---- oaks: big single trees in the meadow and round the yard, as a farm keeps them for the shade
  const oakSpots: [number, number][] = [
    [-40, 46],
    [-78, 26],
    [-88, -8],
    [-20, -56],
    [8, -60],
    [74, 18],
    [84, -30],
    [84, 44],
    [-62, 64],
    [36, 64],
    [-84, -58],
  ];
  for (const [x0, z0] of oakSpots) {
    const x = x0 + (r() - 0.5) * 3;
    const z = z0 + (r() - 0.5) * 3;
    if (!spotOk(x, z, 2) || sightDistance(x, z) < 9) continue;
    plan.oaks.push(inst(x, z, 13 + 5 * r(), 1.05 + 0.25 * r(), r));
  }
  // ---- apple trees: an orchard east of the house
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++) {
      const x = 72 + i * 6.5 + (r() - 0.5);
      const z = -58 + j * 6.5 + (r() - 0.5);
      if (spotOk(x, z, 1)) plan.apples.push(inst(x, z, 5 + 1.4 * r(), 1.05 + 0.2 * r(), r));
    }
  // ---- hedges: lines along the far parcels' edges, thick and continuous, and the home meadow's edge to the south and the east
  const hedgeLine = (ax: number, az: number, bx: number, bz: number, step = 2.6, far = false) => {
    const len = Math.hypot(bx - ax, bz - az);
    for (let d = 0; d < len && plan.hedges.length < 480; d += step * (0.7 + 0.6 * r())) {
      const t = d / len;
      const x = ax + (bx - ax) * t + (r() - 0.5) * 1.2;
      const z = az + (bz - az) * t + (r() - 0.5) * 1.2;
      if (trackDistance(x, z).d < 4 || sightDistance(x, z) < 8 || (far && !onFarmland(x, z))) continue;
      (far ? plan.hedges : plan.hedgesNear).push(inst(x, z, 2.4 + 1.3 * r(), 1.5 + 0.5 * r(), r));
    }
  };
  hedgeLine(-96, 72, 92, 72, 3.2);
  hedgeLine(92, 72, 92, -68, 3.2);
  hedgeLine(-96, 72, -96, -68, 3.2);
  hedgeLine(-96, -68, 92, -68, 3.2);
  for (let ix = -3; ix <= 3; ix++) hedgeLine(ix * 110 - 30, -520, ix * 110 + 50, 520, 7.5, true);
  for (let iz = -2; iz <= 2; iz++) if (iz !== 0) hedgeLine(-520, iz * 172 + 40, 520, iz * 172 - 20, 7.5, true);
  // ---- tree belts on the far edge of the plain, in lines along the fields: nothing else rises on this horizon
  const beltLine = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az);
    for (let d = 0; d < len && plan.belts.length < 480; d += 15 * (0.7 + 0.6 * r())) {
      const t = d / len;
      const x = ax + (bx - ax) * t + (r() - 0.5) * 8;
      const z = az + (bz - az) * t + (r() - 0.5) * 8;
      if (trackDistance(x, z).d < 12) continue;
      plan.belts.push(inst(x, z, 14 + 9 * r(), 1.5 + 0.4 * r(), r));
    }
  };
  beltLine(-1500, -640, 1500, -760);
  beltLine(-1400, -1040, 1400, -940);
  beltLine(-720, 480, -640, -900);
  beltLine(720, 400, 660, -900);
  beltLine(-1300, 760, -700, 760);
  beltLine(520, 700, 1300, 660);
  // ---- shrubs: in the corners of the yard, by the buildings and along the fence's foot, in groups; none alone in the meadow
  const clump = (cx: number, cz: number, n: number, spread: number) => {
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * spread;
      const z = cz + (r() - 0.5) * spread;
      if (!spotOk(x, z, 0.9)) continue;
      plan.shrubs.push(inst(x, z, 1.1 + 1.1 * r(), 1.3, r));
    }
  };
  clump(-52, -32, 6, 4);
  clump(-30, -40, 5, 5);
  clump(30, -48, 6, 5);
  clump(64, -30, 4, 4);
  clump(70, -56, 5, 4);
  clump(-40, 30, 3, 3);
  clump(-90, 20, 8, 6);
  clump(80, 0, 6, 5);
  clump(42, -42, 5, 3);
  // ---- tufts and flowers in the meadow, the fence ring included
  for (let i = 0; i < 9000 && plan.tufts.length < 900; i++) {
    const x = -96 + r() * 188;
    const z = -66 + r() * 132;
    if (trackDistance(x, z).d < 2.4) continue;
    if (Math.max(Math.abs(x), Math.abs(z)) < 10) continue;
    if (fbm(x * 0.08 + 1, z * 0.08, 2) < 0.42 && r() > 0.3) continue;
    let bad = false;
    for (const f of FOOTPRINTS) if (x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1) bad = true;
    if (bad || (x > -76 && x < -28 && z > -28 && z < 8)) continue;
    plan.tufts.push(inst(x, z, 0.45 + 0.5 * r(), 1, r));
  }
  for (let i = 0; i < 12000 && plan.flowers.length < 380; i++) {
    const x = -90 + r() * 180;
    const z = -64 + r() * 128;
    if (trackDistance(x, z).d < 2.4 || Math.max(Math.abs(x), Math.abs(z)) < 10) continue;
    const patch = fbm(x * 0.07 + 11, z * 0.07 - 4, 3);
    if (patch < 0.58 || (x > -76 && x < -28 && z > -28 && z < 8)) continue;
    let bad = false;
    for (const f of FOOTPRINTS) if (x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1) bad = true;
    if (bad) continue;
    const f = inst(x, z, 0.32 + 0.3 * r(), 1, r);
    f.tint = (Math.floor(patch * 17) % 4) / 3 + 0.04 * r();
    plan.flowers.push(f);
  }
  return plan;
}

// ------------------------------------------------------------------------------------------------ the meshes

const tints = [C(0xf3f0dc), C(0xdfe8c2), C(0xffffff), C(0xe7efcf), C(0xd6e3b3), C(0xf0e6b8), C(0xcfe0b4)];

export interface Vegetation {
  group: THREE.Group;
  meshes: THREE.InstancedMesh[];
  counts: Record<string, number>;
}

/** Alpha cards are lit like the ground: do not flip the normal on the back face. */
function keepNormalUp(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey();
  mat.customProgramCacheKey = () => `${prevKey}|up`;
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n  normal = normalize( vNormal );',
    );
  };
  return mat;
}

/** An apple tree: a short forked trunk, a low round crown as wide as tall, open under the branches. */
function appleGeometry(): { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry } {
  const wood = new Mesher();
  const ca = C(0x4e4032);
  const cb = C(0x6d5c48);
  tube(
    wood,
    [
      [0, 0, 0],
      [0.01, 0.2, 0],
      [0.03, 0.36, 0.02],
    ],
    [0.05, 0.04, 0.028],
    7,
    ca,
    cb,
  );
  tube(
    wood,
    [
      [0.01, 0.24, 0],
      [0.15, 0.42, 0.06],
      [0.24, 0.55, 0.05],
    ],
    [0.026, 0.018, 0.01],
    5,
    ca,
    cb,
  );
  tube(
    wood,
    [
      [0.01, 0.24, 0],
      [-0.13, 0.43, -0.05],
      [-0.22, 0.56, -0.08],
    ],
    [0.026, 0.018, 0.01],
    5,
    ca,
    cb,
  );
  tube(
    wood,
    [
      [0.03, 0.34, 0.02],
      [0.02, 0.55, 0.14],
      [0.02, 0.7, 0.2],
    ],
    [0.022, 0.015, 0.009],
    5,
    ca,
    cb,
  );
  const lv = new Mesher();
  crown(
    lv,
    22,
    (_, r) => {
      const a = r() * Math.PI * 2;
      const e = Math.acos(1 - 1.65 * r());
      const d = 0.2 + 0.2 * r();
      return {
        x: Math.cos(a) * Math.sin(e) * d,
        y: 0.62 + Math.cos(e) * d * 0.82,
        z: Math.sin(a) * Math.sin(e) * d,
        rx: 0.15,
        ry: 0.12,
        rz: 0.15,
      };
    },
    (p, c) => c.set(0, 0.56, 0).setY(0.56 + 0 * p.y),
    { lo: C(0x466a2b), hi: C(0x93b24c), seed: 90, yMin: 0.32, yMax: 1, uvk: 7, detail: 1 },
  );
  return { wood: wood.build(), leaves: lv.build('given') };
}

export function buildVegetation(plan: VegetationPlan): Vegetation {
  const tex = sceneryTextures();
  const group = new THREE.Group();
  group.name = 'vegetation';
  const meshes: THREE.InstancedMesh[] = [];
  const counts: Record<string, number> = {};
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const colour = new THREE.Color();

  const barkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex.bark, vertexColors: true, roughness: 1 });
  const leafMat = (flutter = 0.004, amp = 0.014) =>
    patchWind(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: tex.leaves,
        vertexColors: true,
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
      { amp, flutter, speed: 1.1 },
    );
  const make = (
    name: string,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    list: Inst[],
    opts: { shadow?: boolean; tint?: (i: Inst) => THREE.Color; size: (i: Inst, s: THREE.Vector3) => void },
  ): void => {
    if (list.length === 0) return;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    im.name = name;
    list.forEach((it, i) => {
      q.setFromAxisAngle(up, it.rot);
      opts.size(it, scl);
      pos.set(it.x, it.y - 0.05, it.z);
      m4.compose(pos, q, scl);
      im.setMatrixAt(i, m4);
      im.setColorAt(i, opts.tint ? opts.tint(it) : colour.set(0xffffff));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = opts.shadow ?? false;
    im.receiveShadow = true;
    im.frustumCulled = false;
    im.userData.noShadow = !opts.shadow;
    counts[name] = list.length;
    group.add(im);
    meshes.push(im);
  };
  const treeSize = (it: Inst, s: THREE.Vector3) => s.set(it.s * it.w, it.s, it.s * it.w);
  const leafTint = (it: Inst) =>
    colour.copy(tints[Math.floor(it.tint * tints.length) % tints.length]).multiplyScalar(0.92 + 0.16 * it.tint);
  const woodTint = () => colour.set(0xffffff);

  const poplar = poplarGeometry();
  make('poplar-wood', poplar.wood, barkMat, plan.poplars, { shadow: true, size: treeSize, tint: woodTint });
  make('poplar-leaves', poplar.leaves, leafMat(0.004, 0.012), plan.poplars, {
    shadow: true,
    size: treeSize,
    tint: leafTint,
  });
  const oak = oakGeometry();
  make('oak-wood', oak.wood, barkMat, plan.oaks, { shadow: true, size: treeSize, tint: woodTint });
  make('oak-leaves', oak.leaves, leafMat(), plan.oaks, { shadow: true, size: treeSize, tint: leafTint });
  const apple = appleGeometry();
  make('apple-wood', apple.wood, barkMat, plan.apples, { shadow: true, size: treeSize, tint: woodTint });
  make('apple-leaves', apple.leaves, leafMat(0.004, 0.012), plan.apples, {
    shadow: true,
    size: treeSize,
    tint: leafTint,
  });
  // far belts and hedges: the same mass as a shrub, cheap, no shadow
  const shrub = shrubGeometry(5);
  // the far masses set the budget of the world (under 400,000 triangles): three lobes for a tree half a kilometre away and more, four for a low hedge in the fields
  make('belts', shrubGeometry(3, 0), leafMat(0, 0.006), plan.belts, {
    size: treeSize,
    tint: (it) => colour.setHSL(0.27 + 0.04 * it.tint, 0.3, 0.72 + 0.2 * it.tint),
  });
  make('hedges', shrubGeometry(4, 0), leafMat(0, 0.01), plan.hedges, {
    size: treeSize,
    tint: (it) => colour.setHSL(0.27 + 0.03 * it.tint, 0.28, 0.72 + 0.18 * it.tint),
  });
  make('hedges-near', shrubGeometry(3, 1), leafMat(0.003, 0.012), plan.hedgesNear, {
    size: treeSize,
    tint: (it) => colour.setHSL(0.27 + 0.03 * it.tint, 0.28, 0.72 + 0.18 * it.tint),
  });
  make('shrubs', shrub, leafMat(0.003, 0.02), plan.shrubs, {
    size: treeSize,
    tint: (it) => colour.copy(tints[Math.floor(it.tint * tints.length) % tints.length]).multiplyScalar(0.9),
  });
  const card = (map: THREE.Texture) =>
    keepNormalUp(
      patchWind(
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map,
          vertexColors: true,
          alphaTest: 0.42,
          side: THREE.DoubleSide,
          roughness: 1,
        }),
        { amp: 0.09, speed: 1.6 },
      ),
    );
  make('tufts', cardGeometry(0.6, 0.5, 2), card(tex.tuft), plan.tufts, {
    size: (it, s) => s.set(it.s, it.s, it.s),
    tint: (it) => colour.setHSL(0.24 + 0.04 * it.tint, 0.2, 0.84 + 0.22 * it.tint),
  });
  const flowerColours = [0xffffff, 0xffd84a, 0xe9a6ff, 0xff9fb6];
  make('flowers', cardGeometry(0.26, 0.5, 2), card(tex.flowers), plan.flowers, {
    size: (it, s) => s.set(it.s, it.s, it.s),
    tint: (it) => colour.set(flowerColours[Math.min(3, Math.floor(it.tint * 4))]),
  });
  return { group, meshes, counts };
}
