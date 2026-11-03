import * as THREE from 'three';
import { mesh } from '@onigam/lab-kit/three';
import { PAD, SHED, SITE, TOWER } from '../dims';
import { smoothstep as ss } from '../common';
import { fbm, patchDetail, sceneryTextures, vnoise } from './materials';

// The land of the farm: a plain, flat on purpose (no hill, no lake, so no pumped storage here). Y = 0 over the whole yard; a few centimetres of undulation further out, capped by
// `SITE.flatHeight`, just enough for the far fields not to read as a table. One mesh: the kinds of ground (grass, gravel, soil) are mixed by the vertices, so tracks and yards are
// painted on it and nothing can fight it for the depth. Parcels of wheat, pasture and plough out to the horizon, hedges along their edges (vegetation.ts).

export const TRACKS: { pts: [number, number][]; width: number }[] = [
  // from the road, far to the south, to the gate of the machine
  {
    pts: [
      [-6, 900],
      [-5, 300],
      [-4.5, 90],
      [-3.6, 34],
      [-3.5, 26],
    ],
    width: 3.6,
  },
  // to the barn
  {
    pts: [
      [-4.5, 90],
      [-28, 62],
      [-44, 30],
      [-46, -8],
      [-48, -24],
    ],
    width: 3.4,
  },
  // to the house
  {
    pts: [
      [-4.5, 90],
      [24, 60],
      [38, 30],
      [42, -8],
      [44, -26],
    ],
    width: 3.2,
  },
];

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/** Hard yards: gravel. */
const YARDS: Rect[] = [
  // barn's and the shed's yard
  { x0: -76, x1: -28, z0: -28, z1: 8 },
  // the house's
  { x0: 33, x1: 62, z0: -33, z1: -24 },
];

const distToSeg = (x: number, z: number, a: [number, number], b: [number, number]): number => {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z);
};

export function trackDistance(x: number, z: number): { d: number; half: number } {
  let d = Infinity;
  let half = 2;
  for (const t of TRACKS) {
    for (let i = 0; i < t.pts.length - 1; i++) {
      const e = distToSeg(x, z, t.pts[i], t.pts[i + 1]);
      if (e < d) {
        d = e;
        half = t.width / 2;
      }
    }
  }
  return { d, half };
}

const rectDist = (x: number, z: number, r: Rect): number =>
  Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));

const yardMask = (x: number, z: number): number => {
  let m = 0;
  for (const y of YARDS) m = Math.max(m, 1 - ss(0, 5, rectDist(x, z, y) + (fbm(x * 0.13, z * 0.13, 2) - 0.5) * 4));
  return m;
};

/** The ring of the fence and the machine's hard ground: short worn grass, a gravel apron round the pad. */
const apronMask = (x: number, z: number): number => {
  const half = PAD.side / 2 + 2.6;
  return (
    1 -
    ss(
      0,
      1.8,
      Math.hypot(Math.max(Math.abs(x) - half, 0), Math.max(Math.abs(z) - half, 0)) +
        (vnoise(x * 0.5, z * 0.5) - 0.5) * 0.9,
    )
  );
};

/** The farm's ground plan: inside this rectangle the fields leave room for the yard, the meadow, the barn and the house. */
const FARM: Rect = { x0: -96, x1: 92, z0: -68, z1: 72 };

/** A parcel of the far fields: an index from the point. Parcels are about 90 by 170 m, in a slightly skewed grid. */
function parcelOf(x: number, z: number): { ix: number; iz: number; u: number; v: number } {
  const w = 94;
  const h = 172;
  const px = x + 0.08 * z;
  const pz = z - 0.05 * x;
  const fx = px / w;
  const fz = pz / h;
  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  return { ix, iz, u: fx - ix, v: fz - iz };
}

const parcelHash = (ix: number, iz: number): number => {
  let h = Math.imul(ix + 7, 374761393) + Math.imul(iz + 3, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export const onFarmland = (x: number, z: number): boolean => x < FARM.x0 || x > FARM.x1 || z < FARM.z0 || z > FARM.z1;

/** The lines hedges follow: edge distance to the nearest parcel boundary, outside the farm. */
export function fieldEdges(x: number, z: number): number {
  const { u, v } = parcelOf(x, z);
  return Math.min(u, 1 - u) * 94 < Math.min(v, 1 - v) * 172 ? Math.min(u, 1 - u) * 94 : Math.min(v, 1 - v) * 172;
}

/** The land's height, m: zero on the farm, a few centimetres of nothing elsewhere. */
export function terrainHeight(x: number, z: number): number {
  const r = Math.max(Math.abs(x), Math.abs(z));
  const out = ss(110, 260, r);
  if (out <= 0) return 0;
  return out * (SITE.flatHeight * 2 * (fbm(x * 0.006 + 4, z * 0.006 - 2, 3) - 0.5));
}

/** Colour of the ground: three kinds, grass, gravel and soil, in sRGB bytes. */
function groundColour(x: number, z: number, out: THREE.Color, mix: { g: number; s: number; d: number }): void {
  const n = fbm(x * 0.05 + 7, z * 0.05 - 3, 3);
  const nf = fbm(x * 0.4, z * 0.4, 2);
  const inFarm = !onFarmland(x, z);
  let r: number;
  let g: number;
  let b: number;
  let wGrass = 1;
  let wGravel = 0;
  let wSoil = 0;
  if (inFarm) {
    // the meadow of the yard, grazed and a little patchy
    const k = 0.72 + 0.4 * n + 0.14 * (nf - 0.5);
    r = 112 * k;
    g = 137 * k;
    b = 62 * k;
    const dry = ss(0.55, 0.78, fbm(x * 0.07 - 2, z * 0.07 + 5, 3));
    r += dry * 34;
    g += dry * 16;
    b += dry * 2;
  } else {
    const p = parcelOf(x, z);
    const h = parcelHash(p.ix, p.iz);
    const k = 0.86 + 0.24 * n + 0.1 * (nf - 0.5);
    if (h < 0.3) {
      // wheat, ripe, with drill lines
      const lines = 0.94 + 0.06 * Math.sin(p.u * 94 * 2.4);
      r = 190 * k * lines;
      g = 161 * k * lines;
      b = 84 * k * lines;
    } else if (h < 0.62) {
      // pasture
      r = 108 * k;
      g = 137 * k;
      b = 66 * k;
    } else if (h < 0.82) {
      // plough
      const furrows = 0.9 + 0.1 * Math.sin(p.v * 172 * 2.2);
      r = 116 * k * furrows;
      g = 92 * k * furrows;
      b = 66 * k * furrows;
      wGrass = 0;
      wSoil = 1;
    } else {
      // maize
      const lines = 0.93 + 0.07 * Math.sin(p.u * 94 * 1.6);
      r = 94 * k * lines;
      g = 122 * k * lines;
      b = 56 * k * lines;
    }
    // the headland: a paler rim where the machines turn
    const edge = fieldEdges(x, z);
    const rim = 1 - ss(1.5, 6, edge);
    r = r + (150 - r) * rim * 0.35;
    g = g + (146 - g) * rim * 0.35;
    b = b + (92 - b) * rim * 0.35;
  }
  // yard and apron: gravel
  const yard = Math.max(yardMask(x, z), apronMask(x, z));
  if (yard > 0) {
    const t = yard * (0.75 + 0.25 * nf);
    const k = 0.9 + 0.2 * n;
    r += (166 * k - r) * t;
    g += (156 * k - g) * t;
    b += (136 * k - b) * t;
    wGravel = t;
    wGrass *= 1 - t;
    wSoil *= 1 - t;
  }
  // tracks: two ruts and a grass spine, on gravel
  const tr = trackDistance(x, z);
  if (tr.d < tr.half + 2) {
    const t = 1 - ss(tr.half - 0.2, tr.half + 0.9 + (vnoise(x * 0.3, z * 0.3) - 0.5), tr.d);
    if (t > 0) {
      const spine = 1 - ss(0.18, 0.55, tr.d);
      const rut = ss(0.5, 0.75, tr.d) * (1 - ss(1.1, 1.35, tr.d));
      const k = 0.92 + 0.18 * n;
      const cr = 158 * k * (1 - rut * 0.1);
      const cg = 148 * k * (1 - rut * 0.1);
      const cb = 126 * k * (1 - rut * 0.12);
      r += (cr + (104 - cr) * spine * 0.6 - r) * t;
      g += (cg + (124 - cg) * spine * 0.6 - g) * t;
      b += (cb + (72 - cb) * spine * 0.6 - b) * t;
      wGravel = Math.max(wGravel, t * (1 - spine));
      // the spine is grass, also where the track crosses a field that has none: no weight at all would leave the ground black under its detail (review D51)
      wGrass = Math.max(wGrass * (1 - t * (1 - spine)), t * spine);
      wSoil *= 1 - t;
    }
  }
  // soft ring of worn ground just inside the fence: where the cutter goes round
  const rr = Math.hypot(x, z);
  const fenceRing = (1 - ss(0.4, 1.2, Math.abs(rr - SITE.fenceR))) * 0.5;
  if (fenceRing > 0 && inFarm) {
    r += (128 - r) * fenceRing;
    g += (130 - g) * fenceRing;
    b += (76 - b) * fenceRing;
  }
  const sum = wGrass + wGravel + wSoil || 1;
  mix.g = wGrass / sum;
  mix.s = wGravel / sum;
  mix.d = wSoil / sum;
  out.setRGB(Math.min(1, r / 255), Math.min(1, g / 255), Math.min(1, b / 255), THREE.SRGBColorSpace);
}

/** The coordinates of the grid along one axis: fine near the farm, coarser towards the horizon. */
function gridLine(): number[] {
  const out: number[] = [];
  const steps: [number, number][] = [
    [-2400, 200],
    [-900, 80],
    [-420, 28],
    [-190, 6],
    [-104, 2],
    [104, 6],
    [190, 28],
    [420, 80],
    [900, 200],
    [2400, 0],
  ];
  for (let i = 0; i < steps.length - 1; i++) {
    const [a, s] = steps[i];
    const [b] = steps[i + 1];
    for (let v = a; v < b - 1e-6; v += s) out.push(v);
  }
  out.push(2400);
  return out;
}

export interface Terrain {
  group: THREE.Group;
  ground: THREE.Mesh;
  grid: { xs: number[]; zs: number[] };
}

export function buildTerrain(): Terrain {
  const xs = gridLine();
  const zs = gridLine();
  const nx = xs.length;
  const nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  const col = new Float32Array(nx * nz * 3);
  const mix = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  const c = new THREE.Color();
  const m = { g: 1, s: 0, d: 0 };
  const TILE = 2.2;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const x = xs[i];
      const z = zs[j];
      const o = j * nx + i;
      pos[o * 3] = x;
      pos[o * 3 + 1] = terrainHeight(x, z);
      pos[o * 3 + 2] = z;
      groundColour(x, z, c, m);
      col[o * 3] = c.r;
      col[o * 3 + 1] = c.g;
      col[o * 3 + 2] = c.b;
      mix[o * 3] = m.g;
      mix[o * 3 + 1] = m.s;
      mix[o * 3 + 2] = m.d;
      uv[o * 2] = x / TILE;
      uv[o * 2 + 1] = z / TILE;
    }
  const idx: number[] = [];
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const d = a + nx;
      const e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aMix', new THREE.BufferAttribute(mix, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = patchDetail(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: sceneryTextures().ground,
      vertexColors: true,
      roughness: 1,
      metalness: 0,
    }),
    {
      tile: TILE,
      mix: true,
      macro: 0.13,
      bump: 2.2,
    },
  );
  const ground = mesh(g, mat);
  ground.name = 'ground';
  ground.castShadow = false;
  ground.userData.noShadow = true;
  const group = new THREE.Group();
  group.name = 'terrain';
  group.add(ground);
  return { group, ground, grid: { xs, zs } };
}

/** Where buildings stand: the plants keep off these. */
export const FOOTPRINTS: Rect[] = [
  {
    x0: SITE.barn.x - SITE.barn.len / 2 - 1,
    x1: SITE.barn.x + SITE.barn.len / 2 + 1,
    z0: SITE.barn.z - SITE.barn.span / 2 - 1,
    z1: SITE.barn.z + SITE.barn.span / 2 + 1,
  },
  {
    x0: SITE.house.x - SITE.house.w / 2 - 1,
    x1: SITE.house.x + SITE.house.w / 2 + 1,
    z0: SITE.house.z - SITE.house.d / 2 - 1,
    z1: SITE.house.z + SITE.house.d / 2 + 1,
  },
  { x0: SHED.x - SHED.w / 2 - 1.5, x1: SHED.x + SHED.w / 2 + 1.5, z0: SHED.z - 1.5, z1: SHED.z + SHED.d + 1.5 },
];

export const insideFence = (x: number, z: number, margin = 0): boolean => Math.hypot(x, z) < SITE.fenceR + margin;
export const TOWER_R = TOWER.legX;
