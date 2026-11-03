import * as THREE from 'three';
import { emissive, group, MAT, mesh } from '@onigam/lab-kit/three';
import { SITE } from '../dims';
import { box } from '../rig/shapes';
import { ashlarMaterial, metricUV, plasterMaterial, sheetMaterial, tileMaterial, woodMaterial } from './materials';

// The farm's buildings, at their true sizes. A timber barn with a solar roof on its south slope (90 modules, 36 kWp, as the research assumes), a stone-and-render farmhouse with a
// clay roof and windows that light up with the evening load. Procedural textures from `materials.ts`, no writing anywhere.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** A gable wall, a pentagon in the plane of X and Y (Z its thickness), base at y = 0. */
function gableGeometry(span: number, eaves: number, ridge: number, thick: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-span / 2, 0);
  s.lineTo(span / 2, 0);
  s.lineTo(span / 2, eaves);
  s.lineTo(0, ridge);
  s.lineTo(-span / 2, eaves);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  g.translate(0, 0, -thick / 2);
  return g;
}

/** A pitched roof over a rectangle, ridge along X: two slabs. Returns the slope, for what stands on it. */
function pitchedRoof(
  parent: THREE.Object3D,
  len: number,
  span: number,
  eaves: number,
  ridge: number,
  over: number,
  mats: [THREE.Material, THREE.Material],
  uv: [number, number],
  t = 0.14,
): { pitch: number; slope: number } {
  const pitch = Math.atan2(ridge - eaves, span / 2);
  const run = span / 2 + over;
  const slope = run / Math.cos(pitch);
  [-1, 1].forEach((s, i) => {
    const g = new THREE.BoxGeometry(len + 2 * over, t, slope);
    metricUV(g, uv[0], uv[1]);
    const m = mesh(g, mats[i]);
    const zMid = (s * run) / 2;
    m.position.set(0, ridge - (run / 2) * Math.tan(pitch) + (t / 2) * Math.cos(pitch) - 0.02, zMid);
    m.rotation.x = s * pitch;
    parent.add(m);
  });
  return { pitch, slope };
}

export interface Barn {
  group: THREE.Group;
  /** Where the roof's cable comes down, in the site's frame. */
  cableOut: THREE.Vector3;
  anchor: THREE.Object3D;
  /** Where its name's dot stands on the roof, by the width of the view (review D47). */
  labelAt: { wide: THREE.Vector3; narrow: THREE.Vector3 };
}

/** The barn and its solar roof, one part: as the research counts it. */
export function buildBarn(): Barn {
  const b = SITE.barn;
  const g = group('barn-solar-roof', [b.x, 0, b.z]);
  const wall = woodMaterial(0x8a7a66, 0.92);
  const wallDark = woodMaterial(0x655749, 0.94);
  const footing = ashlarMaterial(0xc6c0b4);
  // a footing of blocks all round
  const hF = 0.7;
  for (const s of [-1, 1]) {
    const f = new THREE.BoxGeometry(b.len + 0.3, hF, 0.34);
    metricUV(f, 1.2);
    f.translate(0, hF / 2, (s * b.span) / 2);
    g.add(mesh(f, footing));
    const fe = new THREE.BoxGeometry(0.34, hF, b.span);
    metricUV(fe, 1.2);
    fe.translate((s * b.len) / 2, hF / 2, 0);
    g.add(mesh(fe, footing));
  }
  // walls of boards, vertical: the texture turned by metricUV's U and V
  const addBoards = (w: number, h: number, x: number, y: number, z: number, along: 'x' | 'z') => {
    const geo = along === 'x' ? new THREE.BoxGeometry(w, h, 0.18) : new THREE.BoxGeometry(0.18, h, w);
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    const uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const a = along === 'x' ? p.getX(i) : p.getZ(i);
      uv.setXY(i, (p.getY(i) + (Math.abs(n.getY(i)) > 0.5 ? a : 0)) / 0.8, a / 0.8);
    }
    geo.translate(x, y, z);
    g.add(mesh(geo, wall));
  };
  addBoards(b.len, b.eaves - hF, 0, hF + (b.eaves - hF) / 2, -b.span / 2, 'x');
  // the south wall has the big door in its middle: wall each side, a lintel over, the sliding leaves
  const doorW = 6.4;
  const doorH = 4;
  const sideW = (b.len - doorW) / 2;
  for (const s of [-1, 1])
    addBoards(sideW, b.eaves - hF, s * (doorW / 2 + sideW / 2), hF + (b.eaves - hF) / 2, b.span / 2, 'x');
  addBoards(doorW, b.eaves - doorH, 0, doorH + (b.eaves - doorH) / 2, b.span / 2, 'x');
  // the door: two leaves of darker boards, braced, on a rail
  const leaf = (x: number) => {
    const geo = new THREE.BoxGeometry(doorW / 2, doorH, 0.09);
    const p = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getY(i) / 0.8, p.getX(i) / 0.8);
    geo.translate(x, doorH / 2, b.span / 2 + 0.13);
    g.add(mesh(geo, wallDark));
    const steel = MAT.steelBlack();
    const d = Math.hypot(doorW / 2 - 0.2, doorH - 0.3);
    const brace = mesh(new THREE.BoxGeometry(0.1, d, 0.03), wallDark, [x, doorH / 2, b.span / 2 + 0.19]);
    brace.rotation.z = (x > 0 ? 1 : -1) * Math.atan2(doorW / 2 - 0.2, doorH - 0.3);
    g.add(brace);
    box(g, wallDark, doorW / 2 - 0.06, 0.12, 0.04, x, doorH - 0.15, b.span / 2 + 0.19);
    box(g, wallDark, doorW / 2 - 0.06, 0.12, 0.04, x, 0.15, b.span / 2 + 0.19);
    box(g, steel, 0.04, 0.3, 0.05, x + (x > 0 ? -1 : 1) * (doorW / 4 - 0.12), 1.15, b.span / 2 + 0.2);
  };
  leaf(-doorW / 4);
  leaf(doorW / 4);
  box(g, MAT.steelBlack(), doorW + 2, 0.08, 0.06, 0, doorH + 0.08, b.span / 2 + 0.13);
  // gable walls in boards
  for (const s of [-1, 1]) {
    const geo = gableGeometry(b.span, b.eaves, b.ridge, 0.18);
    const p = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getY(i) / 0.8, p.getX(i) / 0.8);
    geo.rotateY(Math.PI / 2);
    geo.translate((s * b.len) / 2, 0, 0);
    g.add(mesh(geo, wall));
  }
  // the roof: sheet on both slopes
  const roofMat = sheetMaterial(0x8b8f8c);
  const over = 0.5;
  const { pitch, slope } = pitchedRoof(g, b.len, b.span, b.eaves, b.ridge, over, [roofMat, roofMat], [0.76, 0.76]);
  // ridge cap and barge boards
  box(g, MAT.zinc(), b.len + 2 * over + 0.06, 0.06, 0.5, 0, b.ridge + 0.06, 0);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const m = mesh(new THREE.BoxGeometry(0.06, 0.24, slope), wallDark);
      m.position.set(
        sx * (b.len / 2 + over + 0.03),
        b.ridge - ((b.span / 2 + over) / 2) * Math.tan(pitch),
        (sz * (b.span / 2 + over)) / 2,
      );
      m.rotation.x = sz * pitch;
      g.add(m);
    }
  // ---- the solar modules on the south slope: 5 rows of 18 (36 kWp), on rails, a little above the sheet
  const pv = SITE.pv;
  const cell = pvMaterial();
  const frame = MAT.alu();
  const stepX = pv.w + pv.gap;
  const stepS = pv.h + pv.gap;
  const array = group('array');
  array.rotation.x = pitch;
  array.position.set(0, b.ridge - 0.12, 0);
  const s0 = 0.55;
  // along the slope from under the ridge, +z down it
  const width = pv.cols * stepX;
  for (let c = 0; c < pv.cols; c++)
    for (let r = 0; r < pv.rows; r++) {
      const x = -width / 2 + (c + 0.5) * stepX;
      const s = s0 + (r + 0.5) * stepS;
      array.add(mesh(new THREE.BoxGeometry(pv.w, 0.03, pv.h), cell, [x, 0.28, s]));
      array.add(mesh(new THREE.BoxGeometry(pv.w + 0.02, 0.022, pv.h + 0.02), frame, [x, 0.265, s]));
    }
  // rails under the modules, feet on the sheet
  for (let r = 0; r <= pv.rows; r++) {
    const s = s0 + r * stepS;
    array.add(mesh(new THREE.BoxGeometry(width + 0.4, 0.05, 0.05), frame, [0, 0.22, s]));
    for (let k = -4; k <= 4; k++)
      array.add(mesh(new THREE.BoxGeometry(0.04, 0.2, 0.05), frame, [(k * width) / 9, 0.12, s]));
  }
  g.add(array);
  // the roof's cable down the south-east corner
  const eaveZ = b.span / 2;
  const cx = b.len / 2 - 0.25;
  const conduit = new THREE.CylinderGeometry(0.025, 0.025, b.eaves - 0.25, 8);
  conduit.translate(cx, 0.25 + (b.eaves - 0.25) / 2, eaveZ + 0.12);
  g.add(mesh(conduit, MAT.pvcGrey()));
  const anchor = new THREE.Object3D();
  const labelAt = {
    wide: V(-b.len / 2 + 3, b.eaves + 0.4, b.span / 2 - 0.6),
    narrow: V(-3, b.ridge + 1.1, 2.5),
  };
  anchor.position.copy(labelAt.wide);
  anchor.userData.keep = true;
  g.add(anchor);
  return { group: g, cableOut: V(b.x + cx, 4.8, b.z + eaveZ + 0.16), anchor, labelAt };
}

export interface House {
  group: THREE.Group;
  panes: THREE.MeshStandardMaterial;
  light: THREE.PointLight;
  lineIn: THREE.Vector3;
  anchor: THREE.Object3D;
  /** Where its name's dot stands on the ridge, by the width of the view. */
  labelAt: { wide: THREE.Vector3; narrow: THREE.Vector3 };
}

/** The farmhouse: rendered walls on a stone plinth, clay tiles, a chimney, shutters, a door, windows that light up in the evening. */
export function buildHouse(): House {
  const h = SITE.house;
  const g = group('farmhouse', [h.x, 0, h.z]);
  const render = plasterMaterial(0xd9ceb7, h.eaves);
  const stone = ashlarMaterial(0xc6bfb0);
  const plinthH = 0.6;
  const panes = emissive(0xffd79a, 0);
  panes.color.set(0x2b3238);
  // the walls, a rectangle with a thin plinth
  const addWall = (
    w: number,
    hh: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: THREE.Material,
    tile = 1.6,
  ) => {
    const geo = new THREE.BoxGeometry(w, hh, d);
    metricUV(geo, tile);
    geo.translate(x, y, z);
    g.add(mesh(geo, m));
  };
  addWall(h.w, h.eaves, h.d, 0, h.eaves / 2, 0, render);
  addWall(h.w + 0.1, plinthH, h.d + 0.1, 0, plinthH / 2, 0, stone, 1.2);
  for (const s of [-1, 1]) {
    const gable = gableGeometry(h.d, 0.001, h.ridge - h.eaves, 0.3);
    metricUV(gable, 1.6);
    gable.rotateY(Math.PI / 2);
    gable.translate((s * (h.w - 0.3)) / 2, h.eaves, 0);
    g.add(mesh(gable, render));
  }
  const tiles = tileMaterial();
  pitchedRoof(g, h.w, h.d, h.eaves, h.ridge, 0.42, [tiles, tiles], [0.9, 1.2], 0.2);
  box(g, MAT.printBlack(), h.w + 0.92, 0.1, 0.32, 0, h.ridge + 0.06, 0);
  // chimney
  addWall(0.7, 2.6, 0.55, h.w * 0.27, h.ridge - 0.2, -0.4, stone, 1.2);
  box(g, MAT.concrete(), 0.82, 0.08, 0.67, h.w * 0.27, h.ridge + 1.13, -0.4);
  // windows and shutters of the south front; two storeys
  const zF = h.d / 2;
  const shutter = woodMaterial(0x4e6d75, 0.85);
  const sill = MAT.concrete();
  const win = (x: number, y: number, w: number, hh: number, shutters = true) => {
    box(g, panes, w, hh, 0.02, x, y, zF + 0.005).castShadow = false;
    const fm = MAT.printWhite();
    box(g, fm, w + 0.09, 0.06, 0.05, x, y + hh / 2 + 0.03, zF + 0.02);
    box(g, fm, 0.05, hh, 0.05, x - w / 2 - 0.02, y, zF + 0.02);
    box(g, fm, 0.05, hh, 0.05, x + w / 2 + 0.02, y, zF + 0.02);
    box(g, fm, 0.035, hh, 0.03, x, y, zF + 0.02);
    box(g, fm, w, 0.03, 0.03, x, y + hh * 0.18, zF + 0.02);
    box(g, sill, w + 0.18, 0.06, 0.12, x, y - hh / 2 - 0.03, zF + 0.05);
    if (shutters)
      for (const s of [-1, 1]) {
        const sg = new THREE.BoxGeometry(w / 2 + 0.03, hh + 0.03, 0.04);
        metricUV(sg, 0.8);
        sg.translate(x + s * (w * 0.75 + 0.07), y, zF + 0.03);
        g.add(mesh(sg, shutter));
      }
  };
  for (const x of [-4.4, -1.6, 1.6, 4.4]) win(x, 3.75, 0.95, 1.2);
  for (const x of [-4.4, 4.4]) win(x, 1.55, 1.05, 1.3);
  win(-1.6, 1.55, 1.05, 1.3);
  // the door
  const doorW = 1.05;
  const door = new THREE.BoxGeometry(doorW, 2.2, 0.08);
  metricUV(door, 0.8);
  door.translate(1.6, 1.1 + 0.02, zF + 0.01);
  g.add(mesh(door, woodMaterial(0x5a3f2c, 0.85)));
  box(g, stone, doorW + 0.3, 0.14, 0.14, 1.6, 2.3, zF + 0.05);
  for (const s of [-1, 1]) box(g, stone, 0.16, 2.3, 0.14, 1.6 + (s * (doorW + 0.16)) / 2, 1.15, zF + 0.05);
  box(g, stone, 1.8, 0.15, 0.9, 1.6, 0.075, zF + 0.45);
  // a porch light, and the room's warm light through the windows at night
  const light = new THREE.PointLight(0xffc98a, 0, 16, 1.6);
  light.position.set(0, 2.4, zF + 2.4);
  g.add(light);
  // gutters
  for (const s of [-1, 1]) cylinderX(g, MAT.zinc(), h.w + 0.84, 0.05, 0, h.eaves - 0.03, s * (h.d / 2 + 0.37));
  const anchor = new THREE.Object3D();
  // at the ridge's left end where the name reads to the right. Narrow, it reads to the left of a point further along, so as to clear the shed's name
  const labelAt = { wide: V(-h.w / 2 + 0.5, h.ridge + 1.2, 0), narrow: V(-h.w / 2 + 4, h.ridge + 1.2, 0) };
  anchor.position.copy(labelAt.wide);
  anchor.userData.keep = true;
  g.add(anchor);
  return { group: g, panes, light, lineIn: V(h.x - h.w / 2 - 0.1, 4.2, h.z + 1), anchor, labelAt };
}

/** The face of a module: 6 × 10 cells in a mipmapped texture, so that from afar it goes to an even dark blue instead of sparkling. */
function pvMaterial(): THREE.MeshStandardMaterial {
  const W = 96;
  const H = 160;
  const data = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W;
      const v = (j + 0.5) / H;
      const gapU = Math.abs(((u * 6) % 1) - 0.5) > 0.46;
      const gapV = Math.abs(((v * 10) % 1) - 0.5) > 0.46;
      const k = (j * W + i) * 4;
      const line = gapU || gapV;
      data[k] = line ? 150 : 30;
      data[k + 1] = line ? 158 : 42;
      data[k + 2] = line ? 170 : 74;
      data[k + 3] = 255;
    }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.32, metalness: 0.35, envMapIntensity: 0.9 });
}

function cylinderX(
  parent: THREE.Object3D,
  m: THREE.Material,
  len: number,
  r: number,
  x: number,
  y: number,
  z: number,
): void {
  const c = new THREE.CylinderGeometry(r, r, len, 8);
  c.rotateZ(Math.PI / 2);
  c.translate(x, y, z);
  parent.add(mesh(c, m));
}
