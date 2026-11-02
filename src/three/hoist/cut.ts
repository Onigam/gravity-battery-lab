import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { PartRegistry } from '@onigam/lab-kit/three';
import { DECK_TOP, HOIST } from '../dims';
import type { CutRect } from '../rig/hoist';

// The section of the `hoist` world: the horizontal plane through the two axes, the drum's and the motor's (both on y = axisY, as the maker draws them). The half above it comes off,
// so the gear train, the rotor in its stator and the inside of the drum lie open from above. The materials of the hoist's parts are clipped (three's own clipping, shadows
// included) and flat caps close what is cut, from the rectangles each part gives. The exploded view moves the parts along X and Z only, so the plane stays right for all of them.

const PLANE_Y = DECK_TOP + HOIST.axisY;
/** What a cap's colour is multiplied by, linear. */
const CAP_DIM = 0.42;

export class HoistCut {
  readonly plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), PLANE_Y);
  private readonly materials = new Map<THREE.Material, THREE.Side>();
  private readonly caps: { partId: string; mesh: THREE.Mesh }[] = [];
  private on: boolean | undefined;

  /** Every material under `root` is clipped by the tool; `rects` become its caps. */
  attach(partId: string, root: THREE.Object3D, rects: CutRect[] = []): void {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.cap) return;
      const mat = m.material as THREE.Material;
      if (!this.materials.has(mat)) this.materials.set(mat, mat.side);
    });
    const byColour = new Map<number, THREE.BufferGeometry[]>();
    for (const [x0, x1, z0, z1, colour, lift = 0] of rects) {
      const g = new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(z1 - z0));
      g.rotateX(-Math.PI / 2);
      g.translate((x0 + x1) / 2, HOIST.axisY + 0.0005 + lift, (z0 + z1) / 2);
      const list = byColour.get(colour) ?? [];
      list.push(g);
      byColour.set(colour, list);
    }
    for (const [colour, list] of byColour) {
      const geo = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      const m = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          // this world is lit hard from above, and a cut face looks straight at it: the colour is kept low so that it stays a colour
          color: new THREE.Color(colour).multiplyScalar(CAP_DIM),
          roughness: 0.75,
          metalness: 0.05,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      );
      m.userData.cap = true;
      m.userData.ownerPart = partId;
      m.userData.noShadow = true;
      m.castShadow = false;
      m.receiveShadow = false;
      m.visible = false;
      m.name = `cap-${partId}`;
      root.add(m);
      this.caps.push({ partId, mesh: m });
    }
  }

  update(on: boolean, registry: PartRegistry | null): void {
    if (on !== this.on) {
      this.on = on;
      for (const [mat, side] of this.materials) {
        mat.clippingPlanes = on ? [this.plane] : [];
        mat.clipShadows = on;
        mat.side = on ? THREE.DoubleSide : side;
        mat.needsUpdate = true;
      }
    }
    for (const c of this.caps) {
      const part = registry?.get(c.partId);
      c.mesh.visible = on && (!part || part.display === 'solid');
    }
  }
}
