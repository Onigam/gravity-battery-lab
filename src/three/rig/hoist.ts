import * as THREE from 'three';
import { boltHead, group, mesh } from '@onigam/lab-kit/three';
import {
  DECK_PLATE,
  DRUM_R,
  DRUM_Z,
  FOOT_X,
  FRAME_FRONT,
  FRAME_REAR,
  GEARS,
  GOVERNOR,
  HOIST,
  HOIST_X,
  HOOK_BLOCK,
  MOTOR_Z,
  PLATE_IN,
  ROPE_R,
  windingX,
  woundAt,
  STROKE,
} from '../dims';
import type { MachineLook } from './look';
import { patchGroove } from './look';
import { buildSheaveX } from './weight';
import { TAU, box, boxFromTo, cyl, extrudeAlongX, gearX, latheX, ringX, rounded, sweep, webX } from './shapes';

// The hoist, one part at a time, in force order, on the maker's dimensions (S9 p. 1/55, `dims.HOIST`): on the feet the frame; on the frame the drum, and at its far end the disc of
// the drum brake; the gearbox at the other end; the motor running back along the drum beside it, with its brake, its fan and its encoder. In front of the drum the rope's
// return sheave and its fixed end. All in the frame of the deck: y = 0 on the channels' top, x and z those of the machine. A section (`hoist` world) cuts the plane of the two
// axes (y = axisY), so the gears, the rotor and the inside of the drum are real solids, and each part gives the rectangles that close its cut.

const A = HOIST.axisY;
const X = HOIST_X;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const dyn = <T extends THREE.Object3D>(o: T): T => {
  o.userData.dynamic = true;
  return o;
};

/** A rectangle of the section plane, in the frame of the deck: x0..x1, z0..z1, a colour, and how far above the plane it lies (a shaft over the wheel it goes through). */
export type CutRect = [number, number, number, number, number, number?];

/** Lifts of the section's caps, m: what lies on what, never in the same plane. */
export const CAP_LIFT = { hub: 0.0004, shaft: 0.0008 } as const;
/** The tone of a cut shaft: a darker steel than the wheels it goes through. */
export const SHAFT_CAP = 0x5d636a;
/** One tone per stage of the gear train, from the motor to the drum: the two wheels that mesh share it, so a stage reads as a pair. */
export const STAGE_CAP = [0xe0a92c, 0xc9661d, 0x96381c] as const;
/** How wide the band of the teeth is drawn in section, m: a few millimetres in truth, it must read from a metre away. */
const TEETH_BAND = 0.008;

/** A colour made darker, each channel by `k`. */
export const darker = (colour: number, k: number): number =>
  (Math.round(((colour >> 16) & 255) * k) << 16) |
  (Math.round(((colour >> 8) & 255) * k) << 8) |
  Math.round((colour & 255) * k);

export interface HoistPart {
  root: THREE.Group;
  cuts?: CutRect[];
}

export interface Hoist {
  root: THREE.Group;
  parts: Record<HoistId, THREE.Group>;
  cuts: Partial<Record<HoistId, CutRect[]>>;
  /** Rotating groups: the drum's own, and each gear shaft (from the motor's side, shaft 0). */
  drumRot: THREE.Group;
  drumBrakeRot: THREE.Group;
  motorRot: THREE.Group;
  shafts: THREE.Group[];
  /** Blur discs of the gears, shaft 0 to 2 (the drum's own wheel turns slowly). */
  blurGears: THREE.Object3D[];
  blurFan: THREE.Object3D;
  /** Pads and armature that move when the brakes release, and the telltale of the service brake. */
  brakeArmature: THREE.Group;
  caliperPads: THREE.Group[];
  guide: THREE.Group;
  returnRot: THREE.Group;
  limitRot: THREE.Group;
  governorRot: THREE.Group;
  encoderRot: THREE.Group;
  /** The rope wound on the drum: a tube whose drawn range grows with the winding. */
  wound: THREE.Mesh;
  /** Indices drawn per metre of rope. */
  woundIndicesPerMetre: number;
  /** Markers of the rope in the frame of their part: the axis of the drum, of the return sheave, the socket's mouth. */
  drumAxis: THREE.Object3D;
  returnAxis: THREE.Object3D;
  anchorMouth: THREE.Object3D;
  /** Where the motor's cable lands, in the frame of the deck. */
  terminal: THREE.Vector3;
}

export type HoistId =
  | 'hoist-base'
  | 'rope-drum'
  | 'hoist-gearbox'
  | 'hoist-motor'
  | 'motor-encoder'
  | 'service-brake'
  | 'drum-brake'
  | 'rope-guide'
  | 'rope-anchor'
  | 'overload-cell'
  | 'return-sheave'
  | 'limit-switch'
  | 'overspeed-governor';

export const HOIST_PARTS: HoistId[] = [
  'hoist-base',
  'rope-drum',
  'hoist-gearbox',
  'hoist-motor',
  'motor-encoder',
  'service-brake',
  'drum-brake',
  'rope-guide',
  'rope-anchor',
  'overload-cell',
  'return-sheave',
  'limit-switch',
  'overspeed-governor',
];

// ------------------------------------------------------------------------------------------------ the frame

function sidePlate(xIn: number, xOut: number): THREE.BufferGeometry {
  // a plate in the (z, y) plane, with the maker's lifting notches on top
  const zf = FRAME_FRONT;
  const zr = FRAME_REAR;
  const H = HOIST.height;
  const s = new THREE.Shape();
  s.moveTo(zf + 0.02, 0);
  s.lineTo(zr, 0);
  s.lineTo(zr, H - 0.03);
  s.lineTo(zr - 0.03, H);
  // two keyholes from the top
  for (const zn of [zf + 0.45, zf + 0.18]) {
    s.lineTo(zn + 0.022, H);
    s.lineTo(zn + 0.012, H - 0.05);
    s.absarc(zn, H - 0.075, 0.024, Math.PI * 0.2, Math.PI * 0.8, true);
    s.lineTo(zn - 0.022, H);
  }
  s.lineTo(zf + 0.03, H);
  s.lineTo(zf, H - 0.03);
  s.lineTo(zf, 0.02);
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(zf + 0.31, H - 0.075, 0.02, 0, TAU, true);
  s.holes.push(hole);
  return extrudeAlongX(s, xIn, xOut, 8);
}

function buildBase(look: MachineLook): { g: THREE.Group; cuts: CutRect[] } {
  const g = group('hoist-base');
  const t = HOIST.plateT;
  const plates: [number, number][] = [
    [PLATE_IN[0] - t, PLATE_IN[0]],
    [PLATE_IN[1], PLATE_IN[1] + t],
  ];
  for (const [a, b] of plates) g.add(mesh(sidePlate(a, b), look.hoist));
  // the feet: a flange on each side, out to e1, with the four M30 and their washers (S30), through the channel's flange, nuts under
  const zs = [FRAME_FRONT + HOIST.holeFromFront, FRAME_FRONT + HOIST.holeFromFront + HOIST.holes];
  FOOT_X.forEach((x) => {
    boxFromTo(g, look.hoist, [x - HOIST.footOuter, 0, FRAME_FRONT], [x + HOIST.footInner, HOIST.footT, FRAME_REAR]);
    for (const z of zs) {
      cyl(g, look.steel, 'y', 0.026, HOIST.footT, HOIST.footT + 0.004, x, z, 14);
      const head = boltHead(0.026, 0.018, look.steel);
      head.position.set(x, HOIST.footT + 0.004, z);
      g.add(head);
      cyl(g, look.steel, 'y', HOIST.bolt / 2, -0.05, HOIST.footT, x, z, 10);
      const nut = boltHead(0.026, 0.024, look.steel);
      nut.position.set(x, -0.012 - 0.03, z);
      g.add(nut);
    }
  });
  const hLen = PLATE_IN[1] - PLATE_IN[0];
  const cx = (PLATE_IN[0] + PLATE_IN[1]) / 2;
  // the front beam and the anchor beam, plate to plate
  const zFront = FRAME_FRONT + HOIST.frontBeamZ;
  box(g, look.hoistDark, hLen, HOIST.beamTop - 0.06, HOIST.beamW, cx, (HOIST.beamTop + 0.06) / 2, zFront);
  box(g, look.hoistDark, hLen, HOIST.beamTop - 0.1, HOIST.beamW, cx, (HOIST.beamTop + 0.1) / 2, HOIST.anchorBeamZ);
  // the tie at the rear, over the motor's side of the drum
  box(g, look.hoistDark, hLen, 0.06, 0.06, cx, HOIST.height - 0.05, FRAME_REAR - 0.06);
  // bearing housings of the drum, on the plates, and the plate's cover
  for (const [a, b] of plates) {
    const m = a < 0 ? a : b;
    const dir = a < 0 ? 1 : -1;
    g.add(mesh(ringX(0.1, 0.06, a - 0.002, b + 0.002, 28).translate(0, A, DRUM_Z), look.steel));
    if (dir < 0) cyl(g, look.steel, 'x', 0.1, m, m + 0.022, A, DRUM_Z, 28);
  }
  // cable tray along the rear
  box(g, look.steel, hLen, 0.012, 0.05, cx, HOIST.footT + 0.006, FRAME_REAR - 0.06);
  return {
    g,
    cuts: [
      [PLATE_IN[0] - t, PLATE_IN[0], FRAME_FRONT, DRUM_Z - 0.06, 0x8ea4b5],
      [PLATE_IN[0] - t, PLATE_IN[0], DRUM_Z + 0.06, FRAME_REAR, 0x8ea4b5],
      [PLATE_IN[1], PLATE_IN[1] + t, FRAME_FRONT, DRUM_Z - 0.06, 0x8ea4b5],
      [PLATE_IN[1], PLATE_IN[1] + t, DRUM_Z + 0.06, FRAME_REAR, 0x8ea4b5],
      [PLATE_IN[0], PLATE_IN[1], zFront - HOIST.beamW / 2, zFront + HOIST.beamW / 2, 0x8ea4b5],
      [PLATE_IN[0], PLATE_IN[1], HOIST.anchorBeamZ - HOIST.beamW / 2, HOIST.anchorBeamZ + HOIST.beamW / 2, 0x8ea4b5],
    ],
  };
}

// ------------------------------------------------------------------------------------------------ the drum and the wound rope

/** The rope on the drum as a tube along the helix, in the drum's frame: y = R cos α, z = R sin α, α = −π/2 − s/R; the tube's end is at the start of the winding, then grows. */
export function windingGeometry(
  segmentsPerTurn: number,
  sides: number,
): { geometry: THREE.BufferGeometry; indicesPerMetre: number } {
  const total = woundAt(STROKE) + 2;
  const circumference = TAU * DRUM_R;
  const n = Math.ceil((total / circumference) * segmentsPerTurn);
  const pos = new Float32Array((n + 1) * sides * 3);
  const nor = new Float32Array((n + 1) * sides * 3);
  const ds = circumference / segmentsPerTurn;
  for (let k = 0; k <= n; k++) {
    const s = k * ds;
    const a = -Math.PI / 2 - s / DRUM_R;
    const px = windingX(s);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let j = 0; j < sides; j++) {
      const b = (j / sides) * TAU;
      const radial = Math.cos(b);
      const axial = Math.sin(b);
      const o = (k * sides + j) * 3;
      pos[o] = px + ROPE_R * axial;
      pos[o + 1] = (DRUM_R + ROPE_R * radial) * ca;
      pos[o + 2] = (DRUM_R + ROPE_R * radial) * sa;
      nor[o] = axial;
      nor[o + 1] = radial * ca;
      nor[o + 2] = radial * sa;
    }
  }
  const idx = new Uint32Array(n * sides * 6);
  let w = 0;
  for (let k = 0; k < n; k++)
    for (let j = 0; j < sides; j++) {
      const a = k * sides + j;
      const b = k * sides + ((j + 1) % sides);
      const c = a + sides;
      const d = b + sides;
      idx[w++] = a;
      idx[w++] = c;
      idx[w++] = b;
      idx[w++] = b;
      idx[w++] = c;
      idx[w++] = d;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return { geometry: g, indicesPerMetre: (6 * sides) / ds };
}

function buildDrum(
  look: MachineLook,
  segmentsPerTurn: number,
  sides: number,
): {
  g: THREE.Group;
  rot: THREE.Group;
  wound: THREE.Mesh;
  indicesPerMetre: number;
  axis: THREE.Object3D;
  cuts: CutRect[];
} {
  const g = group('rope-drum');
  const rot = dyn(group('drum-rot', [0, A, DRUM_Z]));
  const x0 = PLATE_IN[0] + 0.006;
  const x1 = PLATE_IN[1] - 0.1;
  const R = HOIST.barrelR;
  const inner = R - HOIST.barrelWall;
  // the barrel: a tube with its inside, the groove drawn in its material. Never baked into a shared material: the merge would lose the patch
  const barrelMat = look.drum.clone();
  barrelMat.name = 'grooved-barrel';
  barrelMat.userData.noShare = true;
  patchGroove(barrelMat, HOIST.ropePitch, windingX(0), R);
  rot.add(mesh(ringX(R, inner, x0, x1, 48), barrelMat));
  // two flanges, the end discs inside the tube, the shaft through
  rot.add(mesh(ringX(HOIST.flangeR, 0.05, x0, x0 + HOIST.flangeT, 48), look.drum));
  rot.add(mesh(ringX(HOIST.flangeR, 0.05, x1 - HOIST.flangeT, x1, 48), look.drum));
  rot.add(mesh(ringX(inner + 0.001, 0.05, x0 + 0.03, x0 + 0.05, 32), look.steel));
  rot.add(mesh(ringX(inner + 0.001, 0.05, x1 - 0.05, x1 - 0.03, 32), look.steel));
  const shaftX0 = X(GEARS.stages[2].at - 0.03);
  const shaftX1 = PLATE_IN[1] + HOIST.plateT + 0.018;
  rot.add(
    mesh(
      new THREE.CylinderGeometry(0.05, 0.05, shaftX1 - shaftX0, 20)
        .rotateZ(Math.PI / 2)
        .translate((shaftX0 + shaftX1) / 2, 0, 0),
      look.bright,
    ),
  );
  // bolts on the end flange: they show the drum turning; a keyed collar on the shaft
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    cyl(
      rot,
      look.steel,
      'x',
      0.012,
      x1,
      x1 + 0.012,
      (HOIST.flangeR - 0.024) * Math.cos(a),
      (HOIST.flangeR - 0.024) * Math.sin(a),
      6,
    );
    cyl(
      rot,
      look.steel,
      'x',
      0.012,
      x0 + HOIST.flangeT,
      x0 + HOIST.flangeT + 0.012,
      (HOIST.flangeR - 0.024) * Math.cos(a),
      (HOIST.flangeR - 0.024) * Math.sin(a),
      6,
    );
  }
  // the three clamps of the rope's end, at the start of the winding (bolted plates over the groove)
  const xs = windingX(0);
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 - 0.3 - i * 0.42;
    const m = box(
      rot,
      look.steel,
      0.05,
      0.06,
      0.02,
      xs - i * 0.0015,
      (DRUM_R + ROPE_R + 0.008) * Math.cos(a),
      (DRUM_R + ROPE_R + 0.008) * Math.sin(a),
    );
    m.rotation.x = a + Math.PI / 2 + Math.PI / 2;
    const b = cyl(rot, look.bright, 'y', 0.008, 0, 0.012, 0, 0, 6);
    b.position.set(xs - i * 0.0015, (DRUM_R + ROPE_R + 0.02) * Math.cos(a), (DRUM_R + ROPE_R + 0.02) * Math.sin(a));
    b.rotation.x = a + Math.PI / 2 + Math.PI / 2;
  }
  // the wound rope (the drawn range is set each frame)
  const { geometry, indicesPerMetre } = windingGeometry(segmentsPerTurn, sides);
  const wound = mesh(geometry, look.ropeWound);
  wound.name = 'wound-rope';
  dyn(wound);
  wound.frustumCulled = false;
  rot.add(wound);
  g.add(rot);
  const axis = new THREE.Object3D();
  axis.position.set(0, A, DRUM_Z);
  axis.userData.keep = true;
  g.add(axis);
  const col = 0xb2b6ba;
  const z = DRUM_Z;
  return {
    g,
    rot,
    wound,
    indicesPerMetre,
    axis,
    cuts: [
      [x0, x1, z - R, z - inner, col],
      [x0, x1, z + inner, z + R, col],
      [x0, x0 + HOIST.flangeT, z - HOIST.flangeR, z - R, col],
      [x0, x0 + HOIST.flangeT, z + R, z + HOIST.flangeR, col],
      [x1 - HOIST.flangeT, x1, z - HOIST.flangeR, z - R, col],
      [x1 - HOIST.flangeT, x1, z + R, z + HOIST.flangeR, col],
      [x0 + 0.03, x0 + 0.05, z - inner, z - 0.05, 0x8d9196],
      [x0 + 0.03, x0 + 0.05, z + 0.05, z + inner, 0x8d9196],
      [x1 - 0.05, x1 - 0.03, z - inner, z - 0.05, 0x8d9196],
      [x1 - 0.05, x1 - 0.03, z + 0.05, z + inner, 0x8d9196],
      [shaftX0, shaftX1, z - 0.05, z + 0.05, SHAFT_CAP, CAP_LIFT.shaft],
    ],
  };
}

// ------------------------------------------------------------------------------------------------ the gearbox

/** The outline of the gearbox's body in the (z, y) plane: the hull of the two circles round the axes. */
function hullShape(r1: number, r2: number): THREE.Shape {
  const d = MOTOR_Z - DRUM_Z;
  const ang = Math.asin((r1 - r2) / d);
  const s = new THREE.Shape();
  s.absarc(DRUM_Z, A, r1, Math.PI / 2 + ang, -Math.PI / 2 - ang + TAU, false);
  s.absarc(MOTOR_Z, A, r2, -Math.PI / 2 - ang, Math.PI / 2 + ang, false);
  s.closePath();
  return s;
}

function buildGearbox(look: MachineLook): {
  g: THREE.Group;
  shafts: THREE.Group[];
  blur: THREE.Object3D[];
  cuts: CutRect[];
} {
  const g = group('hoist-gearbox');
  const t = 0.016;
  const xa = X(0);
  const xb = X(HOIST.gearboxEnd);
  const r1 = HOIST.gearboxDrumR;
  const r2 = HOIST.gearboxMotorR;
  // the shell: a hull with a hull-shaped hole, the two end plates
  const shell = hullShape(r1, r2);
  const hole = hullShape(r1 - t, r2 - t);
  shell.holes.push(new THREE.Path(hole.getPoints(24).reverse()));
  g.add(mesh(extrudeAlongX(shell, xa + t, xb - t, 24), look.hoist));
  g.add(mesh(extrudeAlongX(hullShape(r1, r2), xa, xa + t, 24), look.hoist));
  // the end plate on the motor's side has the holes the shafts come through: a plain plate with a boss round each
  const endInner = hullShape(r1, r2);
  const h1 = new THREE.Path();
  h1.absarc(DRUM_Z, A, 0.052, 0, TAU, true);
  const h2 = new THREE.Path();
  h2.absarc(MOTOR_Z, A, 0.05, 0, TAU, true);
  endInner.holes.push(h1, h2);
  g.add(mesh(extrudeAlongX(endInner, xb - t, xb, 24), look.hoist));
  // ribs on the outer face and bolts round its edge
  const zMid = (DRUM_Z + MOTOR_Z) / 2;
  box(g, look.hoistDark, 0.012, 0.012, MOTOR_Z - DRUM_Z, xa - 0.006, A + r2 * 0.5, zMid);
  box(g, look.hoistDark, 0.012, 0.012, MOTOR_Z - DRUM_Z, xa - 0.006, A - r2 * 0.5, zMid);
  const edge = hullShape(r1 - 0.014, r2 - 0.014).getPoints(10);
  for (let i = 0; i < edge.length; i += 3) cyl(g, look.steel, 'x', 0.009, xa, xa - 0.008, edge[i].y, edge[i].x, 6);
  // the drain and the breather
  cyl(g, look.brake, 'y', 0.012, A + r1 - 0.002, A + r1 + 0.03, X(0.2), DRUM_Z, 8);

  // the gears: every shaft on the line between the two axes, so that the plane of the section goes through them all. From the motor: shaft 0 carries the first pinion and is
  // the motor's; shaft 1 wheel 1 and pinion 2; shaft 2 wheel 2 and pinion 3; shaft 3 wheel 3 and is the drum's.
  const st = GEARS.stages;
  const zS: number[] = [MOTOR_Z];
  st.forEach((s, i) => zS.push(zS[i] - (s.pinion + s.wheel)));
  const w = GEARS.width;
  const shafts: THREE.Group[] = [];
  const blur: THREE.Object3D[] = [];
  const gearMat = look.bright;
  const addGear = (parent: THREE.Group, n: number, r: number, at: number, width: number = w) => {
    const tooth = 2.2 * (r / n) * 1.0;
    parent.add(mesh(gearX(n, r - tooth * 0.55, r + tooth * 0.55, X(at) - width / 2, X(at) + width / 2), gearMat));
    parent.add(
      mesh(
        new THREE.CylinderGeometry(r * 0.35, r * 0.35, width + 0.012, 18).rotateZ(Math.PI / 2).translate(X(at), 0, 0),
        look.steel,
      ),
    );
  };
  const blurDisc = (parent: THREE.Group, r: number, at: number) => {
    const d = mesh(
      new THREE.CylinderGeometry(r, r, w + 0.003, 40).rotateZ(Math.PI / 2).translate(X(at), 0, 0),
      look.blur,
    );
    d.castShadow = false;
    d.userData.noShadow = true;
    d.userData.dynamic = true;
    d.visible = false;
    parent.add(d);
    return d;
  };
  // shaft 0: the first pinion, on the motor's shaft
  const s0 = dyn(group('shaft-0', [0, A, zS[0]]));
  addGear(s0, st[0].teethP, st[0].pinion, st[0].at);
  blur.push(blurDisc(s0, st[0].pinion * 1.15, st[0].at));
  shafts.push(s0);
  g.add(s0);
  // shafts 1 and 2
  for (let i = 1; i < 3; i++) {
    const r = dyn(group(`shaft-${i}`, [0, A, zS[i]]));
    addGear(r, st[i - 1].teethW, st[i - 1].wheel, st[i - 1].at);
    addGear(r, st[i].teethP, st[i].pinion, st[i].at);
    const a = X(st[i - 1].at - 0.04);
    const b = X(st[i].at + 0.04);
    r.add(
      mesh(
        new THREE.CylinderGeometry(0.014 + 0.006 * i, 0.014 + 0.006 * i, b - a, 14)
          .rotateZ(Math.PI / 2)
          .translate((a + b) / 2, 0, 0),
        look.bright,
      ),
    );
    blur.push(blurDisc(r, st[i - 1].wheel * 1.03, st[i - 1].at));
    shafts.push(r);
    g.add(r);
    // the shaft's two bearings, static, against the housing
    cyl(g, look.steel, 'x', 0.03, a - 0.02, a, A, zS[i], 14);
    cyl(g, look.steel, 'x', 0.03, b, b + 0.02, A, zS[i], 14);
  }
  // shaft 3: the last wheel, on the drum's shaft
  const s3 = dyn(group('shaft-3', [0, A, zS[3]]));
  addGear(s3, st[2].teethW, st[2].wheel, st[2].at, w + 0.012);
  shafts.push(s3);
  g.add(s3);
  const col = 0x8ea4b5;
  // a wheel in section: its body in the stage's tone, a darker band where the teeth are, meeting its partner's on the pitch circle; a steel hub, as `addGear` draws it
  const wheelCut = (stage: number, zc: number, r: number): CutRect[] => {
    const x0 = X(st[stage].at) - w / 2;
    const x1 = X(st[stage].at) + w / 2;
    const tone = STAGE_CAP[stage];
    const teeth = darker(tone, 0.5);
    const hub = r * 0.35;
    const band = Math.min(TEETH_BAND, (r - hub) / 2);
    return [
      [x0, x1, zc - r + band, zc - hub, tone],
      [x0, x1, zc + hub, zc + r - band, tone],
      [x0, x1, zc - r, zc - r + band, teeth],
      [x0, x1, zc + r - band, zc + r, teeth],
      [x0 - 0.006, x1 + 0.006, zc - hub, zc + hub, 0x3b4046, CAP_LIFT.hub],
    ];
  };
  const cuts: CutRect[] = [
    // the walls in the plane
    [xa, xb, DRUM_Z - r1, DRUM_Z - r1 + t, col],
    [xa, xb, MOTOR_Z + r2 - t, MOTOR_Z + r2, col],
    [xa, xa + t, DRUM_Z - r1 + t, MOTOR_Z + r2 - t, col],
    [xb - t, xb, DRUM_Z - r1 + t, DRUM_Z - 0.052, col],
    [xb - t, xb, DRUM_Z + 0.052, MOTOR_Z - 0.05, col],
    [xb - t, xb, MOTOR_Z + 0.05, MOTOR_Z + r2 - t, col],
    // the gears, a pair per stage: pinion on one shaft, wheel on the next
    ...st.flatMap((s, i): CutRect[] => [...wheelCut(i, zS[i], s.pinion), ...wheelCut(i, zS[i + 1], s.wheel)]),
    // intermediate shafts
    [X(st[0].at - 0.04), X(st[1].at + 0.04), zS[1] - 0.02, zS[1] + 0.02, SHAFT_CAP, CAP_LIFT.shaft],
    [X(st[1].at - 0.04), X(st[2].at + 0.04), zS[2] - 0.026, zS[2] + 0.026, SHAFT_CAP, CAP_LIFT.shaft],
  ];
  return { g, shafts, blur, cuts };
}

// ------------------------------------------------------------------------------------------------ the motor, its brake, its fan, its encoder

function buildMotor(look: MachineLook): {
  g: THREE.Group;
  rot: THREE.Group;
  blurFan: THREE.Object3D;
  terminal: THREE.Vector3;
  cuts: CutRect[];
} {
  const g = group('hoist-motor');
  const x0 = X(HOIST.gearboxEnd);
  const x1 = X(HOIST.motorEnd);
  const R = HOIST.motorR;
  // a ribbed frame, hollow
  g.add(mesh(gearX(40, R, HOIST.ribR, x0 + 0.03, x1 - 0.03, R - 0.012).translate(0, A, MOTOR_Z), look.hoist));
  // the end shields, each side, closed but for the shaft
  g.add(mesh(ringX(R + 0.008, 0.042, x0, x0 + 0.03, 40).translate(0, A, MOTOR_Z), look.hoistDark));
  g.add(mesh(ringX(R + 0.008, 0.042, x1 - 0.03, x1, 40).translate(0, A, MOTOR_Z), look.hoistDark));
  // the stator's lamination stack with the copper of its coils coming out each side
  const lamA = x0 + 0.1;
  const lamB = x1 - 0.1;
  g.add(mesh(ringX(R - 0.012, 0.102, lamA, lamB, 48).translate(0, A, MOTOR_Z), look.laminations));
  g.add(mesh(ringX(0.135, 0.104, lamA - 0.05, lamA, 28).translate(0, A, MOTOR_Z), look.copper));
  g.add(mesh(ringX(0.135, 0.104, lamB, lamB + 0.05, 28).translate(0, A, MOTOR_Z), look.copper));
  // the terminal box on top, its gland and the lifting eye
  const tbX = X(0.74);
  const tbTop = A + HOIST.ribR + 0.1;
  box(g, look.hoist, 0.22, 0.1, 0.18, tbX, A + HOIST.ribR + 0.045, MOTOR_Z);
  box(g, look.hoistDark, 0.235, 0.012, 0.195, tbX, tbTop - 0.002, MOTOR_Z);
  const terminal = V(tbX + 0.07, A + HOIST.ribR + 0.045, MOTOR_Z + 0.09);
  cyl(g, look.brake, 'z', 0.02, MOTOR_Z + 0.09, MOTOR_Z + 0.118, tbX + 0.07, A + HOIST.ribR + 0.045, 12);
  // motor mounts to the gearbox: a flange
  g.add(
    mesh(ringX(HOIST.gearboxMotorR + 0.02, 0.042, x0 - 0.002, x0 + 0.018, 40).translate(0, A, MOTOR_Z), look.hoistDark),
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const r = HOIST.gearboxMotorR + 0.006;
    cyl(g, look.steel, 'x', 0.009, x0 + 0.018, x0 + 0.03, A + r * Math.cos(a), MOTOR_Z + r * Math.sin(a), 6);
  }
  // the forced fan: a hood behind the brake with a grille, and the fan itself turning inside, with a blur disc
  const hoodA = X(HOIST.brakeEnd);
  const hoodB = X(HOIST.hoodEnd);
  g.add(
    mesh(ringX(HOIST.brakeR + 0.01, HOIST.brakeR - 0.004, hoodA, hoodB, 40).translate(0, A, MOTOR_Z), look.hoistDark),
  );
  for (const r of [0.045, 0.08, 0.115, 0.145]) {
    const ring = new THREE.TorusGeometry(r, 0.004, 6, 28);
    ring.rotateY(Math.PI / 2);
    ring.translate(hoodB, A, MOTOR_Z);
    g.add(mesh(ring, look.steel));
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    box(g, look.steel, 0.004, 2 * (HOIST.brakeR - 0.004), 0.006, hoodB, A, MOTOR_Z).rotation.x = a;
  }
  // the small fan motor on the hood's top, with its plug
  box(g, look.hoist, 0.06, 0.05, 0.07, (hoodA + hoodB) / 2, A + HOIST.brakeR + 0.03, MOTOR_Z);
  // what turns: the shaft from the gearbox to the fan, the rotor, the fan
  const rot = dyn(group('motor-rot', [0, A, MOTOR_Z]));
  const shaftA = X(GEARS.stages[0].at - 0.03);
  const shaftB = hoodB - 0.004;
  rot.add(
    mesh(
      new THREE.CylinderGeometry(0.03, 0.03, shaftB - shaftA, 18)
        .rotateZ(Math.PI / 2)
        .translate((shaftA + shaftB) / 2, 0, 0),
      look.bright,
    ),
  );
  rot.add(mesh(gearX(26, 0.086, 0.094, lamA + 0.004, lamB - 0.004, 0.03), look.laminations));
  rot.add(mesh(ringX(0.094, 0.03, lamA - 0.008, lamA + 0.004, 26), look.copper));
  rot.add(mesh(ringX(0.094, 0.03, lamB - 0.004, lamB + 0.008, 26), look.copper));
  // fan blades
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    const blade = box(
      rot,
      look.hoistDark,
      0.028,
      0.1,
      0.005,
      (hoodA + hoodB) / 2 + 0.01,
      0.09 * Math.cos(a),
      0.09 * Math.sin(a),
    );
    blade.rotation.x = a;
  }
  const blurFan = mesh(
    new THREE.CylinderGeometry(HOIST.brakeR - 0.008, HOIST.brakeR - 0.008, 0.03, 36)
      .rotateZ(Math.PI / 2)
      .translate((hoodA + hoodB) / 2 + 0.01, 0, 0),
    look.blur,
  );
  blurFan.castShadow = false;
  blurFan.userData.noShadow = true;
  blurFan.userData.dynamic = true;
  blurFan.visible = false;
  rot.add(blurFan);
  g.add(rot);
  const col = 0x8ea4b5;
  const z = MOTOR_Z;
  return {
    g,
    rot,
    blurFan,
    terminal,
    cuts: [
      [x0 + 0.03, x1 - 0.03, z - R, z - R + 0.012, col],
      [x0 + 0.03, x1 - 0.03, z + R - 0.012, z + R, col],
      [x0, x0 + 0.03, z - R, z - 0.042, 0x7b90a2],
      [x0, x0 + 0.03, z + 0.042, z + R, 0x7b90a2],
      [x1 - 0.03, x1, z - R, z - 0.042, 0x7b90a2],
      [x1 - 0.03, x1, z + 0.042, z + R, 0x7b90a2],
      [lamA, lamB, z - R + 0.012, z - 0.102, 0x7d848c],
      [lamA, lamB, z + 0.102, z + R - 0.012, 0x7d848c],
      [lamA - 0.05, lamA, z - 0.135, z - 0.104, 0xd2792f],
      [lamA - 0.05, lamA, z + 0.104, z + 0.135, 0xd2792f],
      [lamB, lamB + 0.05, z - 0.135, z - 0.104, 0xd2792f],
      [lamB, lamB + 0.05, z + 0.104, z + 0.135, 0xd2792f],
      [lamA, lamB, z - 0.09, z + 0.09, 0x6c7178],
      [shaftA, shaftB, z - 0.03, z + 0.03, SHAFT_CAP, CAP_LIFT.shaft],
    ],
  };
}

function buildServiceBrake(look: MachineLook): { g: THREE.Group; armature: THREE.Group; cuts: CutRect[] } {
  const g = group('service-brake');
  const a = X(HOIST.motorEnd);
  const b = X(HOIST.brakeEnd);
  const R = HOIST.brakeR;
  // the body, open inside
  g.add(mesh(ringX(R, R - 0.012, a, b, 40).translate(0, A, MOTOR_Z), look.brake));
  // the magnet: a ring holding the coil and the springs, fixed
  const mid = a + (b - a) * 0.28;
  g.add(mesh(ringX(R - 0.012, 0.05, a, mid, 36).translate(0, A, MOTOR_Z), look.laminations));
  g.add(mesh(ringX(R - 0.042, R - 0.074, mid - 0.012, mid + 0.0005, 30).translate(0, A, MOTOR_Z), look.copper));
  // the armature, pulled by the coil when the brake is released
  const armature = dyn(group('armature'));
  armature.add(mesh(ringX(R - 0.016, 0.06, mid + 0.003, mid + 0.015, 36).translate(0, A, MOTOR_Z), look.steel));
  g.add(armature);
  // two friction discs on the motor's shaft (carried by the fan's end of the shaft: turning, seen in the section), and the fixed plate
  const d1 = mid + 0.024;
  const d2 = mid + 0.05;
  g.add(mesh(ringX(R - 0.022, 0.034, d1, d1 + 0.016, 36).translate(0, A, MOTOR_Z), look.brake));
  g.add(mesh(ringX(R - 0.022, 0.034, d2, d2 + 0.016, 36).translate(0, A, MOTOR_Z), look.brake));
  g.add(mesh(ringX(R - 0.012, 0.05, d1 + 0.018, d2 - 0.002, 36).translate(0, A, MOTOR_Z), look.steel));
  g.add(mesh(ringX(R - 0.012, 0.05, d2 + 0.018, b, 36).translate(0, A, MOTOR_Z), look.laminations));
  // three screws along its side, the hand-release lever on top, the coil's plug
  for (let i = 0; i < 3; i++) {
    const t = Math.PI / 6 + (i * TAU) / 3;
    cyl(
      g,
      look.bright,
      'x',
      0.008,
      a - 0.004,
      b + 0.004,
      A + (R + 0.002) * Math.cos(t),
      MOTOR_Z + (R + 0.002) * Math.sin(t),
      6,
    );
  }
  const lever = [V((a + b) / 2, A + R - 0.01, MOTOR_Z), V((a + b) / 2 + 0.01, A + R + 0.1, MOTOR_Z + 0.04)];
  g.add(mesh(sweep(lever, 0.01, 8), look.red));
  box(g, look.brake, 0.05, 0.03, 0.04, (a + b) / 2 + 0.02, A + R + 0.012, MOTOR_Z - 0.09);
  const z = MOTOR_Z;
  return {
    g,
    armature,
    cuts: [
      [a, b, z - R, z - R + 0.012, 0x4a4e55],
      [a, b, z + R - 0.012, z + R, 0x4a4e55],
      [a, mid, z - R + 0.012, z - 0.05, 0x7d848c],
      [a, mid, z + 0.05, z + R - 0.012, 0x7d848c],
      [d1, d1 + 0.016, z - R + 0.022, z - 0.034, 0x2a2d31],
      [d1, d1 + 0.016, z + 0.034, z + R - 0.022, 0x2a2d31],
      [d2, d2 + 0.016, z - R + 0.022, z - 0.034, 0x2a2d31],
      [d2, d2 + 0.016, z + 0.034, z + R - 0.022, 0x2a2d31],
      [d2 + 0.018, b, z - R + 0.012, z - 0.05, 0x7d848c],
      [d2 + 0.018, b, z + 0.05, z + R - 0.012, 0x7d848c],
    ],
  };
}

function buildEncoder(look: MachineLook, cableTo: THREE.Vector3): { g: THREE.Group; rot: THREE.Group } {
  const g = group('motor-encoder');
  const a = X(HOIST.hoodEnd);
  const b = X(HOIST.encoderEnd);
  // a bracket from the hood's grille, the sensor's body, the marked disc at its back
  cyl(g, look.steel, 'x', 0.05, a - 0.004, a + 0.01, A, MOTOR_Z, 24);
  cyl(g, look.brake, 'x', 0.042, a + 0.01, b - 0.008, A, MOTOR_Z, 24);
  const rot = dyn(group('encoder-rot', [0, A, MOTOR_Z]));
  // the disc: half white, half dark, so that the speed reads
  const half = (s: 1 | -1, m: THREE.Material) => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 0.036, s > 0 ? 0 : Math.PI, s > 0 ? Math.PI : TAU, false);
    shape.closePath();
    const mm = mesh(extrudeAlongX(shape, b - 0.008, b, 10), m);
    return mm;
  };
  rot.add(half(1, look.scaleLight), half(-1, look.scaleDark));
  g.add(rot);
  // the plug and its cable, back to the terminal box: it comes round the hood's edge and lies along the machine's flank, clipped on, up to the box's end: a wire never stands in the air
  const plug = V(a + 0.03, A + 0.058, MOTOR_Z);
  box(g, look.steel, 0.024, 0.02, 0.02, plug.x, plug.y - 0.01, plug.z);
  const flank = (x: number, r: number) => V(x, A + r * Math.SQRT1_2, MOTOR_Z + r * Math.SQRT1_2);
  const WIRE = 0.006;
  const hoodR = HOIST.brakeR + 0.01 + WIRE;
  const brakeR = HOIST.brakeR + WIRE + 0.001;
  const ribR = HOIST.ribR + WIRE;
  const brakeX = [X(HOIST.brakeEnd), X(HOIST.motorEnd)] as const;
  const landing = V(cableTo.x + 0.04, cableTo.y - 0.015, cableTo.z - 0.03);
  const path = rounded(
    [
      plug,
      V(plug.x, A + 0.1, MOTOR_Z + 0.03),
      flank(a + 0.012, hoodR * 0.86),
      flank(a - 0.03, hoodR),
      flank(brakeX[0] + 0.01, hoodR),
      flank(brakeX[0] - 0.012, brakeR),
      flank(brakeX[1] + 0.012, brakeR),
      flank(brakeX[1] - 0.02, ribR),
      flank(landing.x + 0.09, ribR),
      V(landing.x + 0.035, landing.y - 0.012, landing.z + 0.03),
      landing,
    ],
    0.014,
    4,
  );
  g.add(mesh(sweep(path, WIRE, 6), look.cable));
  // two clips on the way
  for (const x of [(a + brakeX[0]) / 2, brakeX[0] - 0.05]) {
    const p = flank(x, x > brakeX[0] ? hoodR : brakeR);
    const clip = box(g, look.steel, 0.012, 0.012, 0.022, p.x, p.y, p.z);
    clip.rotation.x = -Math.PI / 4;
  }
  return { g, rot };
}

function buildDrumBrake(look: MachineLook): { g: THREE.Group; rot: THREE.Group; pads: THREE.Group[]; cuts: CutRect[] } {
  const g = group('drum-brake');
  const rot = dyn(group('disc-rot', [0, A, DRUM_Z]));
  const x = X(HOIST.discAt);
  const t = HOIST.discT;
  rot.add(mesh(webX(HOIST.discR, x - t / 2, x + t / 2, 8, 0.02, HOIST.discR - 0.1), look.bright));
  // the hub to the drum's shaft
  cyl(rot, look.steel, 'x', 0.09, x - 0.03, x + 0.03, 0, 0, 22);
  // a mark on the disc
  box(rot, look.red, t + 0.002, 0.03, 0.02, x, HOIST.discR - 0.03, 0);
  g.add(rot);
  // the caliper on the rear-top of the disc: two arms from a block bolted on the plate, a pad each side, a spring stack, the thruster
  const ang = 0.9;
  const rPad = HOIST.discR - 0.04;
  const yC = A + rPad * Math.sin(ang);
  const zC = DRUM_Z + rPad * Math.cos(ang);
  const xPlate = PLATE_IN[1];
  const yoke = group('caliper');
  yoke.position.set(0, yC, zC);
  yoke.rotation.x = -(Math.PI / 2 - ang);
  boxFromTo(yoke, look.yellow, [x - 0.065, -0.06, -0.05], [xPlate, 0.06, -0.03]);
  boxFromTo(yoke, look.yellow, [x - 0.065, -0.06, 0.03], [xPlate, 0.06, 0.05]);
  boxFromTo(yoke, look.yellow, [x - 0.065, 0.045, -0.05], [x - 0.04, 0.09, 0.05]);
  boxFromTo(yoke, look.yellow, [x + 0.04, 0.045, -0.05], [xPlate, 0.09, 0.05]);
  // the spring stack on its outer arm and the thruster that lifts it off
  yoke.add(
    mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.09, 14).rotateZ(Math.PI / 2).translate(x - 0.11, 0.05, 0),
      look.steel,
    ),
  );
  yoke.add(
    mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.02, 10).rotateZ(Math.PI / 2).translate(x - 0.165, 0.05, 0),
      look.red,
    ),
  );
  g.add(yoke);
  const pads: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const p = dyn(group('pad', [0, 0, 0]));
    boxFromTo(p, look.brake, [x + s * (t / 2), -0.05, -0.028], [x + s * (t / 2 + 0.018), 0.05, 0.028]);
    boxFromTo(p, look.steel, [x + s * (t / 2 + 0.018), -0.04, -0.02], [x + s * (t / 2 + 0.04), 0.06, 0.02]);
    yoke.add(p);
    pads.push(p);
  }
  return {
    g,
    rot,
    pads,
    cuts: [
      [x - t / 2, x + t / 2, DRUM_Z - HOIST.discR, DRUM_Z - 0.09, 0xd9dcdf],
      [x - t / 2, x + t / 2, DRUM_Z + 0.09, DRUM_Z + HOIST.discR, 0xd9dcdf],
      [x - 0.03, x + 0.03, DRUM_Z - 0.09, DRUM_Z + 0.09, 0x8d9196],
    ],
  };
}

// ------------------------------------------------------------------------------------------------ the rope's fittings

function buildGuide(look: MachineLook): { g: THREE.Group; move: THREE.Group } {
  const g = group('rope-guide');
  // the fixed bar over the anchor beam: the guide's fork slides on it, it cannot turn with the drum
  const barY = HOIST.beamTop + 0.04;
  const barZ = HOIST.anchorBeamZ + 0.04;
  cyl(g, look.bright, 'x', 0.012, PLATE_IN[0], PLATE_IN[1], barY, barZ, 10);
  // brackets on the plates
  for (const x of PLATE_IN) box(g, look.steel, 0.02, 0.06, 0.05, x + (x < 0 ? 0.01 : -0.01), barY - 0.015, barZ);
  const move = dyn(group('guide-move'));
  const Rg = DRUM_R + 0.04;
  const w = 0.072;
  // a split ring round the drum, open at the rope's way out, its fork on the bar. In the (z, y) plane the rope leaves on the −z side, at (DRUM_Z − R, A), and hangs straight down: the
  // ring's lower lip stops above where that plumb line crosses its outer radius, with a rope's width to spare
  const gapUp = 0.32;
  const gapDown = Math.atan2(Math.sqrt(Rg * Rg - DRUM_R * DRUM_R), DRUM_R) + (2 * ROPE_R) / Rg + 0.03;
  const ring = new THREE.Shape();
  ring.absarc(0, 0, Rg, Math.PI + gapDown, Math.PI - gapUp + TAU, false);
  ring.absarc(0, 0, Rg - 0.016, Math.PI - gapUp + TAU, Math.PI + gapDown, true);
  ring.closePath();
  const geo = extrudeAlongX(ring, -w / 2, w / 2, 26);
  geo.translate(0, A, DRUM_Z);
  move.add(mesh(geo, look.yellow));
  // the inner tooth that rides the groove, and the arm to the bar
  box(move, look.brake, 0.018, 0.018, 0.02, 0, A + Rg - 0.024, DRUM_Z);
  const armTop = V(0, A + Rg - 0.02, DRUM_Z - 0.11);
  move.add(mesh(sweep([armTop, V(0, barY + 0.02, barZ + 0.03), V(0, barY + 0.02, barZ)], 0.008, 8), look.yellow));
  // the fork on the bar
  box(move, look.yellow, 0.04, 0.03, 0.032, 0, barY + 0.006, barZ);
  g.add(move);
  return { g, move };
}

function buildAnchor(look: MachineLook): { g: THREE.Group; mouth: THREE.Object3D } {
  const g = group('rope-anchor');
  const x = HOOK_BLOCK.sheaveX;
  const z = ANCHOR_Z;
  const yBeamUnder = 0.1;
  // the wedge socket: tapered body, its wedge's rope tail, the clevis pin under the beam
  const y0 = -0.03;
  const y1 = yBeamUnder - 0.03;
  const body = new THREE.CylinderGeometry(0.038, 0.022, y1 - y0, 14);
  body.translate(x, (y0 + y1) / 2, z);
  g.add(mesh(body, look.yellow));
  // the tie rod up through the beam to the cell on top
  cyl(g, look.bright, 'y', 0.016, y1, HOIST.beamTop + 0.078, x, z, 12);
  // the fork and its pin
  box(g, look.steel, 0.1, 0.03, 0.05, x, y1 + 0.012, z);
  cyl(g, look.bright, 'x', 0.012, x - 0.06, x + 0.06, y1 - 0.004, z, 10);
  const mouth = new THREE.Object3D();
  mouth.position.set(x, y0, z);
  mouth.userData.keep = true;
  g.add(mouth);
  return { g, mouth };
}

const ANCHOR_Z = 0.06;

function buildCell(look: MachineLook): THREE.Group {
  const g = group('overload-cell');
  const x = HOOK_BLOCK.sheaveX;
  const z = ANCHOR_Z;
  const y = HOIST.beamTop;
  // a washer on the beam, the cell's ring, the nut, its cable
  cyl(g, look.steel, 'y', 0.042, y, y + 0.008, x, z, 20);
  cyl(g, look.bright, 'y', 0.036, y + 0.008, y + 0.058, x, z, 22);
  cyl(g, look.copper, 'y', 0.037, y + 0.03, y + 0.036, x, z, 22);
  const nut = boltHead(0.026, 0.02, look.steel);
  nut.position.set(x, y + 0.058, z);
  g.add(nut);
  box(g, look.brake, 0.02, 0.014, 0.014, x + 0.04, y + 0.03, z);
  const end = V(PLATE_IN[1] - 0.04, y + 0.018, z - 0.02);
  g.add(mesh(sweep([V(x + 0.05, y + 0.03, z), V(x + 0.3, y + 0.01, z - 0.02), end], 0.005, 6), look.cable));
  box(g, look.brake, 0.05, 0.03, 0.04, end.x + 0.018, y + 0.015, z - 0.02);
  return g;
}

function buildReturnSheave(look: MachineLook): { g: THREE.Group; rot: THREE.Group; axis: THREE.Object3D } {
  const g = group('return-sheave');
  const R = HOOK_BLOCK.sheaveR;
  const z = -R;
  const y = HOIST.returnY;
  const holder = group('return-holder', [0, y, z]);
  holder.rotation.y = Math.PI / 2;
  holder.userData.dynamic = true;
  const rot = dyn(buildSheaveX(look, R, HOOK_BLOCK.sheaveW));
  holder.add(rot);
  g.add(holder);
  // the axle from beam to beam, and its bosses
  const zF = FRAME_FRONT + HOIST.frontBeamZ + HOIST.beamW / 2;
  const zA = HOIST.anchorBeamZ - HOIST.beamW / 2;
  cyl(g, look.bright, 'z', 0.03, zF, zA, 0, y, 14);
  for (const zz of [zF, zA - 0.024]) cyl(g, look.steel, 'z', 0.05, zz, zz + 0.024, 0, y, 18);
  const axis = new THREE.Object3D();
  axis.position.set(0, y, z);
  axis.userData.keep = true;
  g.add(axis);
  return { g, rot, axis };
}

function buildLimit(look: MachineLook): { g: THREE.Group; rot: THREE.Group } {
  const g = group('limit-switch');
  const x0 = PLATE_IN[1] + HOIST.plateT;
  // the geared switch on the plate's outer face, in line with the drum's shaft
  box(g, look.hoistDark, 0.018, 0.14, 0.14, x0 + 0.009, A, DRUM_Z);
  box(g, look.brake, 0.09, 0.11, 0.12, x0 + 0.018 + 0.045, A, DRUM_Z);
  box(g, look.steel, 0.095, 0.012, 0.125, x0 + 0.018 + 0.045, A + 0.06, DRUM_Z);
  // the gland and its cable going back to the frame's tray
  cyl(g, look.steel, 'y', 0.012, A - 0.055, A - 0.08, x0 + 0.06, DRUM_Z, 10);
  g.add(
    mesh(
      sweep(
        [
          V(x0 + 0.06, A - 0.08, DRUM_Z),
          V(x0 + 0.05, HOIST.footT + 0.03, DRUM_Z + 0.04),
          V(x0 - 0.03, HOIST.footT + 0.02, FRAME_REAR - 0.06),
        ],
        0.005,
        6,
      ),
      look.cable,
    ),
  );
  // the window with a turning cam: seen from the side, it counts the drum's turns
  const rot = dyn(group('limit-rot', [x0 + 0.018 + 0.09, A, DRUM_Z]));
  rot.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 18).rotateZ(Math.PI / 2), look.bright));
  rot.add(mesh(new THREE.BoxGeometry(0.01, 0.052, 0.01), look.red));
  g.add(rot);
  return { g, rot };
}

function buildGovernor(look: MachineLook): { g: THREE.Group; rot: THREE.Group } {
  const g = group('overspeed-governor');
  const { x, z, r, topY } = GOVERNOR;
  // the stand: a base plate on the deck, two cheeks, a bearing each side
  boxFromTo(g, look.hoistDark, [x - 0.1, DECK_PLATE, z - 0.24], [x + 0.1, DECK_PLATE + 0.014, z + 0.24]);
  for (const s of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(z - 0.18, DECK_PLATE);
    shape.lineTo(z + 0.18, DECK_PLATE);
    shape.lineTo(z + 0.05, topY + 0.04);
    shape.lineTo(z - 0.05, topY + 0.04);
    shape.closePath();
    g.add(mesh(extrudeAlongX(shape, x + s * 0.052 - 0.006, x + s * 0.052 + 0.006, 4), look.hoist));
    cyl(g, look.steel, 'x', 0.03, x + s * 0.058, x + s * 0.07, topY, z, 14);
  }
  // the switch box at the side
  box(g, look.brake, 0.05, 0.08, 0.1, x + 0.1, DECK_PLATE + 0.054, z + 0.12);
  const rot = dyn(group('governor-rot', [x, topY, z]));
  const R = r;
  const w = 0.03;
  rot.add(
    mesh(
      latheX(
        [
          [-w / 2, R - 0.02],
          [-w / 2, R + 0.012],
          [-0.004, R - 0.004],
          [0.004, R - 0.004],
          [w / 2, R + 0.012],
          [w / 2, R - 0.02],
          [-w / 2, R - 0.02],
        ],
        32,
      ),
      look.drum,
    ),
  );
  rot.add(mesh(webX(R - 0.016, -0.005, 0.005, 4, 0.024, 0.08), look.steel));
  cyl(rot, look.bright, 'x', 0.016, -0.05, 0.05, 0, 0, 12);
  // the two flyweights on the sheave's face: they tell the speed to the switch
  for (const s of [-1, 1]) {
    const y = s * 0.075;
    const m = box(rot, look.yellow, 0.02, 0.05, 0.075, 0.018, y, s * 0.02);
    m.rotation.x = s * 0.5;
    box(rot, look.steel, 0.012, 0.024, 0.012, 0.018, y * 0.6, -s * 0.01);
  }
  g.add(rot);
  return { g, rot };
}

// ------------------------------------------------------------------------------------------------ all of it

export interface HoistOptions {
  /** Segments per turn and sides of the wound rope. */
  windingDetail?: [number, number];
}

export function buildHoist(look: MachineLook, o: HoistOptions = {}): Hoist {
  const root = group('hoist');
  const [segs, sides] = o.windingDetail ?? [28, 6];
  const base = buildBase(look);
  const drum = buildDrum(look, segs, sides);
  const gear = buildGearbox(look);
  const motor = buildMotor(look);
  const brake = buildServiceBrake(look);
  const enc = buildEncoder(look, motor.terminal);
  const dBrake = buildDrumBrake(look);
  const guide = buildGuide(look);
  const anchor = buildAnchor(look);
  const cell = buildCell(look);
  const ret = buildReturnSheave(look);
  const limit = buildLimit(look);
  const gov = buildGovernor(look);
  const parts: Record<HoistId, THREE.Group> = {
    'hoist-base': base.g,
    'rope-drum': drum.g,
    'hoist-gearbox': gear.g,
    'hoist-motor': motor.g,
    'motor-encoder': enc.g,
    'service-brake': brake.g,
    'drum-brake': dBrake.g,
    'rope-guide': guide.g,
    'rope-anchor': anchor.g,
    'overload-cell': cell,
    'return-sheave': ret.g,
    'limit-switch': limit.g,
    'overspeed-governor': gov.g,
  };
  for (const id of HOIST_PARTS) root.add(parts[id]);
  return {
    root,
    parts,
    cuts: {
      'hoist-base': base.cuts,
      'rope-drum': drum.cuts,
      'hoist-gearbox': gear.cuts,
      'hoist-motor': motor.cuts,
      'service-brake': brake.cuts,
      'drum-brake': dBrake.cuts,
    },
    drumRot: drum.rot,
    drumBrakeRot: dBrake.rot,
    motorRot: motor.rot,
    shafts: gear.shafts,
    blurGears: gear.blur,
    blurFan: motor.blurFan,
    brakeArmature: brake.armature,
    caliperPads: dBrake.pads,
    guide: guide.move,
    returnRot: ret.rot,
    limitRot: limit.rot,
    governorRot: gov.rot,
    encoderRot: enc.rot,
    wound: drum.wound,
    woundIndicesPerMetre: drum.indicesPerMetre,
    drumAxis: drum.axis,
    returnAxis: ret.axis,
    anchorMouth: anchor.mouth,
    terminal: motor.terminal,
  };
}

export { ANCHOR_Z };
