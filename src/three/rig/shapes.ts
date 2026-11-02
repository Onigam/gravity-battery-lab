import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mesh } from '@onigam/lab-kit/three';

// The solids of the machine, all built from dimensions passed in (no number of the machine lives here). Geometry only, so everything runs in Node under vitest.

export type V = [number, number, number];
export const TAU = Math.PI * 2;

/** A box of w × h × d centred on (x, y, z), added to `parent`. */
export function box(
  parent: THREE.Object3D,
  mat: THREE.Material,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = mesh(new THREE.BoxGeometry(w, h, d), mat, [x, y, z]);
  parent.add(m);
  return m;
}

/** A box given by its two opposite corners. */
export function boxFromTo(parent: THREE.Object3D, mat: THREE.Material, a: V, b: V): THREE.Mesh {
  return box(
    parent,
    mat,
    Math.abs(b[0] - a[0]),
    Math.abs(b[1] - a[1]),
    Math.abs(b[2] - a[2]),
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2,
  );
}

/** A cylinder along an axis, from `a` to `b` on that axis, centred on (u, v) of the two others, in the order x, y, z without the axis. */
export function cyl(
  parent: THREE.Object3D,
  mat: THREE.Material,
  axis: 'x' | 'y' | 'z',
  r: number,
  a: number,
  b: number,
  u = 0,
  v = 0,
  segments = 20,
  rEnd = r,
): THREE.Mesh {
  const g = new THREE.CylinderGeometry(rEnd, r, Math.abs(b - a), segments);
  const flip = b < a;
  if (flip) g.rotateX(Math.PI);
  const mid = (a + b) / 2;
  if (axis === 'x') {
    g.rotateZ(-Math.PI / 2);
    g.translate(mid, u, v);
  } else if (axis === 'z') {
    g.rotateX(Math.PI / 2);
    g.translate(u, v, mid);
  } else g.translate(u, mid, v);
  const m = mesh(g, mat);
  parent.add(m);
  return m;
}

/** A solid of revolution about X: `profile` is a list of (x, r), walked so that the faces look outwards. */
export function latheX(profile: [number, number][], segments = 32): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    profile.map(([x, r]) => new THREE.Vector2(r, x)),
    segments,
  );
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** The same about Z. */
export function latheZ(profile: [number, number][], segments = 32): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    profile.map(([z, r]) => new THREE.Vector2(r, z)),
    segments,
  );
  g.rotateX(Math.PI / 2);
  return g;
}

/** A hollow ring around X, from x0 to x1, with its four faces. */
export function ringX(outer: number, inner: number, x0: number, x1: number, segments = 32): THREE.BufferGeometry {
  return latheX(
    [
      [x0, inner],
      [x0, outer],
      [x1, outer],
      [x1, inner],
      [x0, inner],
    ],
    segments,
  );
}

/** A shape (in a plane x, y) extruded along X from x0 to x1: the shape's x stays z of the world's plane, its y stays y. */
export function extrudeAlongX(shape: THREE.Shape, x0: number, x1: number, curve = 16): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: x1 - x0, bevelEnabled: false, curveSegments: curve });
  g.rotateY(-Math.PI / 2); // +Z (the depth) goes to −X and the shape's x to +Z
  g.translate(x1, 0, 0);
  return g;
}

/** A disc with teeth: `n` teeth between the radii `root` and `tip`, along X from x0 to x1; a small hole if `bore`. */
export function gearX(n: number, root: number, tip: number, x0: number, x1: number, bore = 0): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const step = TAU / n;
  for (let i = 0; i < n; i++) {
    const a = i * step;
    const pt = (r: number, f: number) => [r * Math.cos(a + f * step), r * Math.sin(a + f * step)] as const;
    const [x0p, y0p] = pt(root, 0);
    if (i === 0) s.moveTo(x0p, y0p);
    else s.lineTo(x0p, y0p);
    s.lineTo(...pt(tip, 0.2));
    s.lineTo(...pt(tip, 0.45));
    s.lineTo(...pt(root, 0.65));
  }
  s.closePath();
  if (bore > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, bore, 0, TAU, true);
    s.holes.push(h);
  }
  return extrudeAlongX(s, x0, x1, 6);
}

/** A disc with `holes` round lightening holes, along X from x0 to x1. */
export function webX(
  r: number,
  x0: number,
  x1: number,
  holes: number,
  holeR: number,
  at: number,
): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, TAU, false);
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * TAU;
    const h = new THREE.Path();
    h.absarc(at * Math.cos(a), at * Math.sin(a), holeR, 0, TAU, true);
    s.holes.push(h);
  }
  return extrudeAlongX(s, x0, x1, 18);
}

/** Boxes merged into one geometry, each given as [w, h, d, x, y, z]. */
export function boxes(list: [number, number, number, number, number, number][]): THREE.BufferGeometry {
  const parts = list.map(([w, h, d, x, y, z]) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

/** An H section along Y, foot at y = 0: flanges across Z, web along Z... the flanges face ±X. */
export function hColumn(side: number, tf: number, tw: number, length: number): THREE.BufferGeometry {
  return boxes([
    [tf, length, side, -(side - tf) / 2, length / 2, 0],
    [tf, length, side, (side - tf) / 2, length / 2, 0],
    [side - 2 * tf, length, tw, 0, length / 2, 0],
  ]);
}

/** An H beam along X, centred: flanges on top and bottom. */
export function hBeamX(w: number, depth: number, tf: number, tw: number, length: number): THREE.BufferGeometry {
  return boxes([
    [length, tf, w, 0, (depth - tf) / 2, 0],
    [length, tf, w, 0, -(depth - tf) / 2, 0],
    [length, depth - 2 * tf, tw, 0, 0, 0],
  ]);
}

/** The same along Z. */
export function hBeamZ(w: number, depth: number, tf: number, tw: number, length: number): THREE.BufferGeometry {
  return boxes([
    [w, tf, length, 0, (depth - tf) / 2, 0],
    [w, tf, length, 0, -(depth - tf) / 2, 0],
    [tw, depth - 2 * tf, length, 0, 0, 0],
  ]);
}

/** An angle along +Y from y = 0 to `length`: two legs of `side`, thickness `t`, the corner at the origin, the legs along +X and +Z of its own frame. */
export function angleBar(side: number, t: number, length: number): THREE.BufferGeometry {
  return boxes([
    [side, length, t, side / 2, length / 2, t / 2],
    [t, length, side - t, t / 2, length / 2, t + (side - t) / 2],
  ]);
}

/** A mesh placed so that its local +Y runs from a to b, its local +Z as near as can be to `facing`. The geometry's length must be |ab|. */
export function between(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, facing: THREE.Vector3): THREE.Object3D {
  const y = new THREE.Vector3().subVectors(b, a).normalize();
  const x = new THREE.Vector3().crossVectors(y, facing).normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  const mat = new THREE.Matrix4().makeBasis(x, y, z);
  m.quaternion.setFromRotationMatrix(mat);
  m.position.copy(a);
  return m;
}

/**
 * A tube of varying radius along a polyline, parallel-transported rings, closed at both ends. `radii` one per point (or one for all). For the hook, the wires, the cables.
 */
export function sweep(points: THREE.Vector3[], radii: number[] | number, sides = 8): THREE.BufferGeometry {
  const n = points.length;
  const rad = (i: number) => (typeof radii === 'number' ? radii : radii[i]);
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const t = new THREE.Vector3();
  let u = new THREE.Vector3();
  const first = new THREE.Vector3().subVectors(points[1], points[0]).normalize();
  u.set(Math.abs(first.y) > 0.9 ? 1 : 0, Math.abs(first.y) > 0.9 ? 0 : 1, 0);
  u.addScaledVector(first, -u.dot(first)).normalize();
  const prevT = first.clone();
  const q = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    t.subVectors(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]).normalize();
    q.setFromUnitVectors(prevT, t);
    u = u.clone().applyQuaternion(q).normalize();
    prevT.copy(t);
    const v = new THREE.Vector3().crossVectors(t, u).normalize();
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * TAU;
      const nx = u.x * Math.cos(a) + v.x * Math.sin(a);
      const ny = u.y * Math.cos(a) + v.y * Math.sin(a);
      const nz = u.z * Math.cos(a) + v.z * Math.sin(a);
      pos.push(points[i].x + nx * rad(i), points[i].y + ny * rad(i), points[i].z + nz * rad(i));
      nor.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < n - 1; i++)
    for (let s = 0; s < sides; s++) {
      const a = i * sides + s;
      const b = i * sides + ((s + 1) % sides);
      const c = a + sides;
      const d = b + sides;
      idx.push(a, b, c, b, d, c);
    }
  // the two ends: a fan on a centre vertex
  const end = (i: number, dir: 1 | -1) => {
    const centre = pos.length / 3;
    const p = points[i];
    const d = new THREE.Vector3()
      .subVectors(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)])
      .normalize()
      .multiplyScalar(dir);
    pos.push(p.x, p.y, p.z);
    nor.push(d.x, d.y, d.z);
    for (let s = 0; s < sides; s++) {
      const a = i * sides + s;
      const b = i * sides + ((s + 1) % sides);
      if (dir > 0) idx.push(centre, a, b);
      else idx.push(centre, b, a);
    }
  };
  end(n - 1, 1);
  end(0, -1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/** Points on a straight polyline with rounded corners (a cable on a wall). */
export function rounded(points: THREE.Vector3[], bend = 0.06, steps = 4): THREE.Vector3[] {
  const out: THREE.Vector3[] = [points[0].clone()];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const a = p.clone().sub(points[i - 1]);
    const b = points[i + 1].clone().sub(p);
    const r = Math.min(bend, a.length() / 2, b.length() / 2);
    const p0 = p.clone().addScaledVector(a.normalize(), -r);
    const p1 = p.clone().addScaledVector(b.normalize(), r);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const q = new THREE.Vector3()
        .addScaledVector(p0, (1 - t) * (1 - t))
        .addScaledVector(p, 2 * t * (1 - t))
        .addScaledVector(p1, t * t);
      out.push(q);
    }
  }
  out.push(points[points.length - 1].clone());
  return out;
}

/** A unit rope segment: a cylinder of radius 1 from y = 0 to y = 1, open ended. Scaled and aimed by `aimSegment`. */
export function unitSegment(sides = 8): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(1, 1, 1, sides, 1, false);
  g.translate(0, 0.5, 0);
  return g;
}

const UP = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3();
/** Aim a unit segment from a to b at radius r, in the parent's frame. */
export function aimSegment(m: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number): void {
  tmp.subVectors(b, a);
  const len = tmp.length();
  m.position.copy(a);
  m.scale.set(r, Math.max(1e-4, len), r);
  if (len > 1e-6) m.quaternion.setFromUnitVectors(UP, tmp.divideScalar(len));
}
