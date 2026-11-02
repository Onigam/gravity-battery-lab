import * as THREE from 'three';
import { group, mesh, emissive } from '@onigam/lab-kit/three';
import { SHED } from '../dims';
import { box, boxFromTo } from '../rig/shapes';
import { metricUV, plasterMaterial, sheetMaterial, woodMaterial } from '../site/materials';

// The shell of the power shed: its slab, its walls, its door and its window, in the frame of the room (back wall's inner face on z = 0, the door side on x = +w/2, floor at y = 0).
// One function for the two worlds: the `site` shows it closed, with a front wall and a roof; the `power-room` shows it open towards the visitor.

export interface ShedShell {
  group: THREE.Group;
  /** The lamp over the door, lit by the state where it matters. */
  pane: THREE.MeshStandardMaterial;
}

export function buildShedShell(opts: { closed: boolean }): ShedShell {
  const g = group('shed-shell');
  const { w, d, h, wall } = SHED;
  const wallMat = plasterMaterial(0xb8bcc0, h);
  const inside = plasterMaterial(0xc4c8cc);
  const slab = new THREE.MeshStandardMaterial({ color: 0x7c7e80, roughness: 0.9 });
  // the slab, a little proud of the yard
  boxFromTo(g, slab, [-w / 2 - wall, -0.14, -wall], [w / 2 + wall, 0, d + wall]);
  const addWall = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material) => {
    const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    metricUV(geo, 1.6);
    geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    g.add(mesh(geo, mat));
  };
  // back wall
  addWall(-w / 2 - wall, w / 2 + wall, 0, h, -wall, 0, wallMat);
  // inner skin of the back wall, paler
  addWall(-w / 2, w / 2, 0, h, 0, 0.004, inside);
  // left wall
  addWall(-w / 2 - wall, -w / 2, 0, h, 0, d + wall, wallMat);
  // right wall, with the door and the window
  const doorZ: [number, number] = [1.15, 2.15];
  const winZ: [number, number] = [2.5, 3.4];
  const winY: [number, number] = [1.05, 2.05];
  const xr0 = w / 2;
  const xr1 = w / 2 + wall;
  addWall(xr0, xr1, 0, h, 0, doorZ[0], wallMat);
  addWall(xr0, xr1, 2.1, h, doorZ[0], doorZ[1], wallMat);
  addWall(xr0, xr1, 0, h, doorZ[1], winZ[0], wallMat);
  addWall(xr0, xr1, 0, winY[0], winZ[0], winZ[1], wallMat);
  addWall(xr0, xr1, winY[1], h, winZ[0], winZ[1], wallMat);
  addWall(xr0, xr1, 0, h, winZ[1], d + wall, wallMat);
  // the door: planks, a frame, a handle
  const doorMat = woodMaterial(0x66584a);
  const door = new THREE.BoxGeometry(0.05, 2.08, doorZ[1] - doorZ[0] - 0.02);
  metricUV(door, 0.8);
  door.translate(xr0 + wall / 2, 1.05, (doorZ[0] + doorZ[1]) / 2);
  g.add(mesh(door, doorMat));
  const frame = new THREE.MeshStandardMaterial({ color: 0x4d463f, roughness: 0.8 });
  box(g, frame, wall + 0.02, 0.06, doorZ[1] - doorZ[0] + 0.08, xr0 + wall / 2, 2.12, (doorZ[0] + doorZ[1]) / 2);
  for (const z of doorZ) box(g, frame, wall + 0.02, 2.12, 0.05, xr0 + wall / 2, 1.06, z);
  const steel = new THREE.MeshStandardMaterial({ color: 0x6c7075, metalness: 0.7, roughness: 0.4 });
  for (const x of [xr0 - 0.01, xr1 + 0.01]) box(g, steel, 0.03, 0.03, 0.12, x, 1.02, doorZ[1] - 0.1);
  // the window: a frame, a cross, the pane (sky-light)
  const pane = emissive(0xd7e4ee, 0.55);
  pane.transparent = true;
  pane.opacity = 0.75;
  box(
    g,
    pane,
    0.012,
    winY[1] - winY[0],
    winZ[1] - winZ[0],
    xr0 + wall * 0.6,
    (winY[0] + winY[1]) / 2,
    (winZ[0] + winZ[1]) / 2,
  ).castShadow = false;
  const winFrame = new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.6 });
  const zm = (winZ[0] + winZ[1]) / 2;
  const ym = (winY[0] + winY[1]) / 2;
  box(g, winFrame, 0.05, 0.04, winZ[1] - winZ[0], xr0 + wall * 0.6, winY[0] + 0.02, zm);
  box(g, winFrame, 0.05, 0.04, winZ[1] - winZ[0], xr0 + wall * 0.6, winY[1] - 0.02, zm);
  box(g, winFrame, 0.05, winY[1] - winY[0], 0.04, xr0 + wall * 0.6, ym, winZ[0] + 0.02);
  box(g, winFrame, 0.05, winY[1] - winY[0], 0.04, xr0 + wall * 0.6, ym, winZ[1] - 0.02);
  box(g, winFrame, 0.04, 0.03, winZ[1] - winZ[0], xr0 + wall * 0.6, ym, zm);
  box(g, winFrame, 0.04, winY[1] - winY[0], 0.03, xr0 + wall * 0.6, ym, zm);
  if (opts.closed) {
    addWall(-w / 2 - wall, w / 2 + wall, 0, h, d, d + wall, wallMat);
    // a pent roof of sheet, sloping to the north, with an overhang
    const roofMat = sheetMaterial(0x8a8f8a);
    const over = 0.35;
    const rise = 0.5;
    const len = Math.hypot(d + 2 * wall + 2 * over, rise);
    const sheet = new THREE.BoxGeometry(w + 2 * wall + 2 * over, 0.05, len);
    metricUV(sheet, 0.76);
    const m = mesh(sheet, roofMat);
    m.position.set(0, h + rise / 2 + 0.05, d / 2);
    m.rotation.x = Math.atan2(rise, d + 2 * wall + 2 * over);
    g.add(m);
    // the gable triangles under the sheet, on the two ends
    for (const x of [-w / 2 - wall / 2, w / 2 + wall / 2]) {
      const s = new THREE.Shape();
      s.moveTo(-wall, 0);
      s.lineTo(d + wall, 0);
      s.lineTo(d + wall, rise);
      s.closePath();
      const tri = new THREE.ExtrudeGeometry(s, { depth: wall, bevelEnabled: false });
      tri.rotateY(-Math.PI / 2);
      tri.translate(x + wall / 2, h, 0);
      metricUV(tri, 1.6);
      g.add(mesh(tri, wallMat));
    }
    // and a wall along the high side
    addWall(-w / 2 - wall, w / 2 + wall, h, h + rise, d, d + wall, wallMat);
  }
  return { group: g, pane };
}
