import * as THREE from 'three';
import { clamp, damp, group, mesh } from '@onigam/lab-kit/three';
import type { PartRegistry, ViewOpts } from '@onigam/lab-kit/three';
import type { GravityState } from '../../sim/types';
import { DECK_TOP, DRUM_R, GEARS, GOVERNOR, HOOK_BLOCK, PAD_TOP, STROKE, liftAt, windingX, woundAt } from '../dims';
import { applyWear } from '../detail';
import { mergeStatic } from '../merge';
import { buildHoist, HOIST_PARTS, type Hoist, type HoistId } from './hoist';
import { machineLook, type MachineLook } from './look';
import { Rope, shortestTurn } from './rope';
import { RulerMarks } from './ruler';
import { aimSegment, box, boxFromTo, cyl, sweep, unitSegment, webX, latheX } from './shapes';
import {
  buildBracing,
  buildBuffers,
  buildHeadFrame,
  buildLadder,
  buildLegs,
  buildPad,
  buildRails,
  buildRiser,
  buildScale,
} from './structure';
import { buildBlocks, buildCarrier, buildHookBlock, buildSafety, buildShoes, buildTies } from './weight';

// One machine, one build function: `buildMachine` makes the whole thing, every part a group, the same dimensions and the same meshes in the `site`, `tower` and `hoist` worlds.
// A world decides only which of its groups it registers as selectable parts, and moves nothing: the tower stands at the origin of all three. `update` is the one place that reads
// the simulation for the machine, so the weight, the rope, the sheaves and the brakes do the same thing in every world.

export type TowerId =
  | 'foundation-pad'
  | 'tower-leg'
  | 'tower-bracing'
  | 'head-frame'
  | 'guide-rail'
  | 'end-buffer'
  | 'weight-carrier'
  | 'concrete-block'
  | 'stack-tie'
  | 'guide-shoe'
  | 'safety-gear'
  | 'hook-block'
  | 'hoist-rope'
  | 'service-ladder'
  | 'height-scale';

export const TOWER_PARTS: TowerId[] = [
  'foundation-pad',
  'tower-leg',
  'tower-bracing',
  'head-frame',
  'guide-rail',
  'end-buffer',
  'weight-carrier',
  'concrete-block',
  'stack-tie',
  'guide-shoe',
  'safety-gear',
  'hook-block',
  'hoist-rope',
  'service-ladder',
  'height-scale',
];

/** Largest speed at which a gear is drawn turning, rad/s; above it the blur disc takes over. */
const GEAR_VISUAL_MAX = 4;
/** Above this many teeth a second a wheel reads as turning backwards: the blur disc shows (lab-quality §1). */
const TEETH_PER_SECOND_MAX = 14;
/** The brakes' moves are drawn larger than life (they are a few tenths of a millimetre): metres at the armature and at the pads. */
const BRAKE_TRAVEL = { armature: 0.004, pad: 0.008 } as const;

export interface MachineOptions {
  /** Materials clipped by the `hoist` world's section: merged by material only, never baked into a shared one. */
  clipped?: boolean;
  /** Segments per turn and sides of the rope wound on the drum (fewer where the drum is only seen from afar). */
  windingDetail?: [number, number];
  /** Cells per metre of the wear, on the steel and the concrete. */
  wear?: number;
  /**
   * Bake everything that stands still into one mesh per material: for a world that shows the machine as a single part (the site). The same triangles at the same places (test), in
   * far fewer draw calls. The parts' own groups are then empty.
   */
  flat?: boolean;
}

export interface Machine {
  root: THREE.Group;
  look: MachineLook;
  hoistLook: MachineLook;
  /** The small roof over the hoist: the `hoist` world takes it off, to look down on the machine. */
  roof: THREE.Group;
  parts: Record<TowerId, THREE.Group>;
  hoist: Hoist;
  /** The moving group: its y is the lift. */
  weight: THREE.Group;
  rope: Rope;
  /** What the ruler says, from the state. */
  ruler: RulerMarks;
  governorRope: THREE.Group;
  riser: THREE.Group;
  /** Explode offsets of the `tower` world's parts, and the custom motions (a leg each way, a block each way). */
  explode: Record<TowerId, THREE.Vector3>;
  custom: Partial<Record<TowerId, (f: number) => void>>;
  /** What is drawn now, for the tests and the flows: lift, wound rope, angles. */
  drawn: {
    lift: number;
    woundM: number;
    departureX: number;
    sheaveA: number;
    sheaveB: number;
    sheaveReturn: number;
    governor: number;
    blocks: number;
    halves: number;
    stackTop: number;
  };
  /** May the blur discs show? A world says no while the part that holds them is hidden: the state's blur would put them back in mid-air every frame. */
  blurAllowed: { fan: boolean; gears: boolean };
  /** The drum's axis now, in the machine's frame. */
  drumAxisInRoot(): THREE.Vector3;
  /** Rope speeds of the falls now, m/s, signed along the path from the hook to the drum, drawn in the flows. */
  update(s: GravityState, dt: number, view: ViewOpts): void;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** What the registry says of a world's parts this frame: is one hidden (isolate, or a step of a guide), has one left its place (the exploded view)? */
export function partsNow(reg: PartRegistry): { hidden: boolean; exploded: boolean } {
  let hidden = false;
  let exploded = false;
  for (const id of reg.ids()) {
    const p = reg.get(id)!;
    if (p.display === 'hidden') hidden = true;
    if (p.factor > 0) exploded = true;
  }
  return { hidden, exploded };
}

/**
 * What belongs to no selectable part, and so would stay standing in the void (lab-quality §1): the governor's rope and its lower sheave, the motor's cable. Neither follows a part
 * that leaves in the exploded view, and neither is hidden by the registry. They show only when every part is there and in its place. Where the rope is no part (the `hoist` world),
 * `rope: true` hides it with the rest while a part is hidden; exploded, it stays, aimed at its markers.
 */
export function holdScenery(m: Machine, reg: PartRegistry, o: { rope?: boolean } = {}): void {
  const { hidden, exploded } = partsNow(reg);
  const clear = !hidden && !exploded;
  m.governorRope.visible = clear;
  m.riser.visible = clear;
  if (o.rope) m.rope.root.visible = !hidden;
}

export function buildMachine(o: MachineOptions = {}): Machine {
  const look = machineLook();
  const root = group('machine');
  // the hoist's section clips the materials under the hoist: their baked material must be its own
  const mergeOpts = {};
  const hoistMerge = o.clipped ? { bakeKey: 'hoist-cut' } : {};

  // ---- what stands still
  const pad = buildPad(look);
  const legs = buildLegs(look);
  const bracing = buildBracing(look);
  const rails = buildRails(look);
  const buffers = buildBuffers(look);
  const ladder = buildLadder(look);
  const scale = buildScale(look);
  // what the ruler says follows the model: never baked
  const ruler = new RulerMarks(look);
  scale.add(ruler.root);
  const headFrame = buildHeadFrame(look);
  const head = headFrame.root;

  // ---- the hoist, on the head frame: it goes up with it in the exploded view. Its own materials: the section of the `hoist` world clips them and nothing else
  const hoistLook = machineLook();
  const hoist = buildHoist(hoistLook, { windingDetail: o.windingDetail });
  hoist.root.position.y = DECK_TOP;
  head.add(hoist.root);

  // ---- what moves with the weight
  const weight = group('weight');
  const carrier = buildCarrier(look);
  const blocks = buildBlocks(look);
  const ties = buildTies(look);
  const shoes = buildShoes(look);
  const safety = buildSafety(look);
  const hook = buildHookBlock(look);
  weight.add(carrier.root, blocks.root, ties.root, shoes.root, safety.root, hook.root);

  const rope = new Rope(look);

  // ---- the governor's rope, scenery in every world: from the deck to the weighted sheave on the pad
  const governorRope = group('governor-rope');
  const gr = GOVERNOR.r;
  const yGovTop = DECK_TOP + GOVERNOR.topY;
  const yGovBot = PAD_TOP + GOVERNOR.bottomY;
  const seg = unitSegment(6);
  const strands: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(seg, look.governorRope);
    m.castShadow = false;
    m.userData.noShadow = true;
    m.frustumCulled = false;
    aimSegment(
      m,
      V(GOVERNOR.x, yGovBot, GOVERNOR.z + s * gr),
      V(GOVERNOR.x, yGovTop, GOVERNOR.z + s * gr),
      GOVERNOR.ropeR,
    );
    governorRope.add(m);
    strands.push(m);
  }
  const arcPts = (sign: 1 | -1) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      pts.push(V(GOVERNOR.x, (sign > 0 ? yGovTop : yGovBot) + sign * gr * Math.sin(a), GOVERNOR.z + gr * Math.cos(a)));
    }
    return pts;
  };
  governorRope.add(mesh(sweep(arcPts(1), GOVERNOR.ropeR, 6), look.ropeWound));
  governorRope.add(mesh(sweep(arcPts(-1), GOVERNOR.ropeR, 6), look.ropeWound));
  // the sheave on the pad, its arm and its weight: a stand on the pad, a hinge, an arm, a cast weight that keeps the loop taut
  const lower = group('governor-lower');
  boxFromTo(
    lower,
    look.hoistDark,
    [GOVERNOR.x - 0.09, PAD_TOP, GOVERNOR.z - 0.3],
    [GOVERNOR.x + 0.09, PAD_TOP + 0.014, GOVERNOR.z + 0.36],
  );
  for (const s of [-1, 1])
    boxFromTo(
      lower,
      look.hoist,
      [GOVERNOR.x + s * 0.052 - 0.006, PAD_TOP, GOVERNOR.z - 0.06],
      [GOVERNOR.x + s * 0.052 + 0.006, yGovBot + 0.05, GOVERNOR.z + 0.06],
    );
  cyl(lower, look.bright, 'x', 0.016, GOVERNOR.x - 0.06, GOVERNOR.x + 0.06, yGovBot, GOVERNOR.z, 12);
  const lowerRot = group('lower-rot', [GOVERNOR.x, yGovBot, GOVERNOR.z]);
  lowerRot.userData.dynamic = true;
  lowerRot.add(
    mesh(
      latheX(
        [
          [-0.015, gr - 0.02],
          [-0.015, gr + 0.012],
          [-0.004, gr - 0.004],
          [0.004, gr - 0.004],
          [0.015, gr + 0.012],
          [0.015, gr - 0.02],
          [-0.015, gr - 0.02],
        ],
        28,
      ),
      look.drum,
    ),
  );
  lowerRot.add(mesh(webX(gr - 0.016, -0.005, 0.005, 4, 0.024, 0.08), look.steel));
  lower.add(lowerRot);
  // the counterweight on the far end of the stand
  box(lower, look.brake, 0.12, 0.09, 0.14, GOVERNOR.x, PAD_TOP + 0.014 + 0.045, GOVERNOR.z + 0.28);
  governorRope.add(lower);

  // ---- the cable up the leg to the motor's terminal box
  const riser = buildRiser(look, hoist.terminal.clone().setY(hoist.terminal.y + DECK_TOP));

  // ---- merges: every part into one mesh per material, the turning groups inside their own frame
  for (const r of [pad, ladder, scale, governorRope]) mergeStatic(r, mergeOpts);
  mergeStatic(lower, mergeOpts);
  mergeStatic(lowerRot, mergeOpts);
  for (const l of legs.legs) mergeStatic(l.group, mergeOpts);
  for (const f of bracing.faces) mergeStatic(f.group, mergeOpts);
  for (const r of rails.rails) mergeStatic(r.group, mergeOpts);
  mergeStatic(buffers.root, mergeOpts);
  for (const s of shoes.shoes) mergeStatic(s.group, mergeOpts);
  mergeStatic(riser, mergeOpts);
  for (const r of [
    carrier.root,
    ties.root,
    ties.cap,
    safety.root,
    hook.root,
    hook.sheaveA,
    hook.sheaveB,
    ...safety.wedges,
    safety.flag,
  ])
    mergeStatic(r, mergeOpts);
  const turning = [
    hoist.drumRot,
    hoist.drumBrakeRot,
    hoist.motorRot,
    ...hoist.shafts,
    hoist.returnRot,
    hoist.limitRot,
    hoist.governorRot,
    hoist.encoderRot,
    hoist.brakeArmature,
    hoist.guide,
    ...hoist.caliperPads,
  ];
  for (const r of turning) mergeStatic(r, hoistMerge);
  for (const id of HOIST_PARTS) mergeStatic(hoist.parts[id], hoistMerge);
  // the head frame: only its own steel (the hoist's parts are groups of their own, with a partId once a world registers them; here they are skipped by a flag)
  hoist.root.userData.dynamic = true;
  mergeStatic(head, mergeOpts);
  hoist.root.userData.dynamic = false;
  mergeStatic(headFrame.roof, mergeOpts);
  if (o.flat) {
    weight.add(carrier.root, blocks.root, ties.root, shoes.root, safety.root, hook.root);
    const flat = group('flat');
    root.add(pad, legs.root, bracing.root, rails.root, buffers.root, ladder, scale, head, governorRope, riser);
    weight.userData.dynamic = true;
    rope.root.userData.dynamic = true;
    mergeStatic(root, mergeOpts);
    weight.userData.dynamic = false;
    void flat;
  }
  const wear = o.wear ?? 7;
  for (const r of [
    pad,
    legs.root,
    bracing.root,
    rails.root,
    buffers.root,
    ladder,
    head,
    carrier.root,
    shoes.root,
    hook.root,
    safety.root,
  ])
    applyWear(r, wear);
  applyWear(blocks.root, wear * 1.6);

  const parts: Record<TowerId, THREE.Group> = {
    'foundation-pad': pad,
    'tower-leg': legs.root,
    'tower-bracing': bracing.root,
    'head-frame': head,
    'guide-rail': rails.root,
    'end-buffer': buffers.root,
    'weight-carrier': carrier.root,
    'concrete-block': blocks.root,
    'stack-tie': ties.root,
    'guide-shoe': shoes.root,
    'safety-gear': safety.root,
    'hook-block': hook.root,
    'hoist-rope': rope.root,
    'service-ladder': ladder,
    'height-scale': scale,
  };
  root.add(
    pad,
    legs.root,
    bracing.root,
    rails.root,
    buffers.root,
    ladder,
    scale,
    head,
    weight,
    rope.root,
    governorRope,
    riser,
  );

  // ---- explode (the `tower` world)
  const explode: Record<TowerId, THREE.Vector3> = {
    'foundation-pad': V(0, 0, 0),
    'tower-leg': V(0, 0, 0),
    'tower-bracing': V(0, 0, 0),
    'head-frame': V(0, 5, 0),
    'guide-rail': V(0, 0, 0),
    'end-buffer': V(0, 0, 0),
    'weight-carrier': V(0, 0, 0),
    'concrete-block': V(0, 0, 0),
    'stack-tie': V(0, 2.6, 0),
    'guide-shoe': V(0, 0, 0),
    'safety-gear': V(0, 0, 1.7),
    'hook-block': V(0, 3.8, 0),
    'hoist-rope': V(0, 0, 0),
    'service-ladder': V(0, 0, -1.9),
    'height-scale': V(0, 0, 1.2),
  };
  const outward = (items: { group: THREE.Group; dir: THREE.Vector3 }[], dist: number) => {
    const bases = items.map((i) => i.group.position.clone());
    return (f: number) => items.forEach((it, k) => it.group.position.copy(bases[k]).addScaledVector(it.dir, dist * f));
  };
  // the blocks: each layer rises over the one below, a metre of gap at f = 1
  let blockFactor = 0;
  const custom: Partial<Record<TowerId, (f: number) => void>> = {
    'tower-leg': outward(legs.legs, 1.5),
    'tower-bracing': outward(bracing.faces, 3),
    'guide-rail': outward(rails.rails, 0.3),
    'guide-shoe': outward(shoes.shoes, 0.7),
    'concrete-block': (f) => {
      blockFactor = f;
      applyBlocksLift();
    },
  };
  const applyBlocksLift = () => {
    const all = [...blocks.whole, ...blocks.halves];
    for (const g of all) {
      if (g.userData.baseY === undefined) g.userData.baseY = g.position.y;
      const layer = Math.round((g.userData.baseY - 1.15) / 0.8);
      g.position.y = g.userData.baseY + (layer + 1) * 0.42 * blockFactor;
    }
  };

  // ---- the state
  const drawn: Machine['drawn'] = {
    lift: 0,
    woundM: woundAt(0),
    departureX: windingX(woundAt(0)),
    sheaveA: 0,
    sheaveB: 0,
    sheaveReturn: 0,
    governor: 0,
    blocks: -1,
    halves: -1,
    stackTop: 0,
  };
  let lastDrum: number | null = null;
  let released = 0;
  let setGear = 0;
  const gearPhase = [0, 0, 0, 0];
  const st = GEARS.stages;
  const ratio3 = st[2].wheel / st[2].pinion;
  const ratio2 = ratio3 * (st[1].wheel / st[1].pinion);
  const inv = new THREE.Matrix4();
  const toRoot = (o: THREE.Object3D, out: THREE.Vector3) => out.setFromMatrixPosition(o.matrixWorld).applyMatrix4(inv);
  const pts = {
    departure: V(0, 0, 0),
    woundEnd: V(0, 0, 0),
    axisA: V(0, 0, 0),
    axisB: V(0, 0, 0),
    axisReturn: V(0, 0, 0),
    anchor: V(0, 0, 0),
  };
  const axisDrum = V(0, 0, 0);
  const R = DRUM_R;
  const ds = (2 * Math.PI * R) / (o.windingDetail?.[0] ?? 28);

  let lastSheave = 0;
  let woundDrawn: number | null = null;
  const blurAllowed = { fan: true, gears: true };
  const update: Machine['update'] = (s, dt) => {
    const lift = liftAt(s.zFraction);
    drawn.lift = lift;
    weight.position.y = lift;
    ruler.update(s);

    // ---- blocks and ties: how many, from the state
    if (s.blocks !== drawn.blocks || s.halves !== drawn.halves) {
      drawn.blocks = s.blocks;
      drawn.halves = s.halves;
      for (const g of [...blocks.whole, ...blocks.halves]) delete g.userData.baseY;
      drawn.stackTop = blocks.show(s.blocks, s.halves);
      ties.set(drawn.stackTop);
      applyBlocksLift();
    }

    // ---- the turning parts: the drum follows the state's angle, the others follow it by their share of the rope (lab-quality §1)
    const dTheta = lastDrum === null ? 0 : shortestTurn(lastDrum, s.drumAngle);
    const dRope = lastDrum === null ? 0 : shortestTurn(lastSheave, s.sheaveAngle);
    lastDrum = s.drumAngle;
    lastSheave = s.sheaveAngle;
    hoist.drumRot.rotation.x = s.drumAngle;
    hoist.drumBrakeRot.rotation.x = s.drumAngle;
    hoist.shafts[3].rotation.x = s.drumAngle;
    hoist.limitRot.rotation.x = s.drumAngle / 8;
    // The sheave A's rim runs at 3 v, the return sheave's at 2 v, sheave B's at v, the drum's at 4 v (K13's reeving: one fall each). Signs of the state: positive when raising.
    const k = (R / HOOK_BLOCK.sheaveR) * dRope;
    drawn.sheaveA -= (k * 3) / 4;
    drawn.sheaveB += (k * 1) / 4;
    drawn.sheaveReturn += (k * 2) / 4;
    hook.sheaveA.rotation.x = drawn.sheaveA;
    hook.sheaveB.rotation.x = drawn.sheaveB;
    hoist.returnRot.rotation.x = drawn.sheaveReturn;
    // the governor's rope runs with the weight: a quarter of the drum's rope speed
    drawn.governor += (R * dRope) / (4 * GOVERNOR.r);
    hoist.governorRot.rotation.x = drawn.governor;
    lowerRot.rotation.x = drawn.governor;

    // ---- the motor, three meshes up the train: it turns the other way from the drum
    hoist.motorRot.rotation.x = -s.motorAngle;
    hoist.shafts[0].rotation.x = -s.motorAngle;
    hoist.encoderRot.rotation.x = -s.motorAngle;
    hoist.blurFan.visible = s.motorBlur && blurAllowed.fan;
    if (dt > 0) {
      const rate = Math.abs(dTheta) / dt;
      const rates = [ratio2 * rate, ratio3 * rate];
      for (let i = 0; i < 2; i++) {
        const shown = Math.min(rates[i], GEAR_VISUAL_MAX);
        const sign = i === 0 ? 1 : -1;
        gearPhase[i + 1] += sign * Math.sign(dTheta) * shown * dt;
        hoist.shafts[i + 1].rotation.x = gearPhase[i + 1];
        const teeth = st[i].teethW * (rates[i] / (2 * Math.PI));
        hoist.blurGears[i + 1].visible = teeth > TEETH_PER_SECOND_MAX && blurAllowed.gears;
      }
      hoist.blurGears[0].visible = s.motorBlur && blurAllowed.gears;
    }

    // ---- brakes: spring-applied, released while the machine moves
    released = damp(released, s.brakeReleased ? 1 : 0, 10, Math.min(dt, 0.1));
    hoist.brakeArmature.position.x = -BRAKE_TRAVEL.armature * released;
    hoist.caliperPads[0].position.x = -BRAKE_TRAVEL.pad * released;
    hoist.caliperPads[1].position.x = BRAKE_TRAVEL.pad * released;
    setGear = damp(setGear, s.safetyGearSet ? 1 : 0, 12, Math.min(dt, 0.1));
    safety.set(setGear);

    // ---- the winding: how much rope is on the drum, where it leaves, in step with the drum's own angle
    const wantWound = woundAt(lift);
    if (woundDrawn === null) {
      woundDrawn = wantWound + R * shortestTurn(wantWound / R, s.drumAngle);
    } else woundDrawn += R * dTheta;
    const span = 1.2 * Math.PI * R;
    while (woundDrawn - wantWound > span) woundDrawn -= 2 * Math.PI * R;
    while (wantWound - woundDrawn > span) woundDrawn += 2 * Math.PI * R;
    const woundM = clamp(woundDrawn, ds, woundAt(STROKE) + 1.5);
    drawn.woundM = woundM;
    const xDep = windingX(woundM);
    drawn.departureX = xDep;
    const segments = Math.floor(woundM / ds);
    hoist.wound.geometry.setDrawRange(0, Math.floor(segments * (o.windingDetail?.[1] ?? 6) * 6));
    hoist.guide.position.x = xDep;

    // ---- the rope, last: every end read from the part that holds it
    root.updateWorldMatrix(true, false);
    root.updateMatrixWorld(true);
    inv.copy(root.matrixWorld).invert();
    toRoot(hoist.drumAxis, axisDrum);
    // the part may have moved along X in the exploded view: its axis marker says by how much
    pts.departure.set(axisDrum.x + xDep, axisDrum.y, axisDrum.z - R);
    // the last ring drawn, on the drum: a little past the tangent, up the drum's side
    const sk = segments * ds;
    const aEnd = -Math.PI / 2 + (woundM - sk) / R;
    pts.woundEnd.set(axisDrum.x + windingX(sk), axisDrum.y + R * Math.cos(aEnd), axisDrum.z + R * Math.sin(aEnd));
    toRoot(hook.axisA, pts.axisA);
    toRoot(hook.axisB, pts.axisB);
    toRoot(hoist.returnAxis, pts.axisReturn);
    toRoot(hoist.anchorMouth, pts.anchor);
    rope.place(pts);
  };
  const machine: Machine = {
    root,
    look,
    hoistLook,
    roof: headFrame.roof,
    parts,
    hoist,
    weight,
    rope,
    ruler,
    governorRope,
    riser,
    explode,
    custom,
    drawn,
    blurAllowed,
    drumAxisInRoot: () => axisDrum.clone(),
    update,
  };
  return machine;
}

export type { HoistId };
