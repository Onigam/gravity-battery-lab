import {
  BLOCK,
  FARM,
  FARM_CABLE_LENGTH,
  FARM_DRUM_DIAMETER,
  FARM_FALLS,
  FARM_MASS,
  FARM_STROKE,
  G,
  HALF_BLOCK,
  HOOK_APPROACH,
  ROPE_DIAMETER,
  ROPE_ON_DRUM,
  STACK_BLOCKS,
  STACK_HALVES,
  STACK_HEIGHT,
  STACK_WIDTH,
  TOWER_HEIGHT,
} from '../sim/machine';
import { LFP } from '../sim/lfp';

// The one source of dimensions of the lab, in metres (BRIEF §5). The 3D, the drawings and the part sheets import from here; whatever the
// physics needs lives in `src/sim/machine.ts` and is imported, never retyped. Every constant says what it is:
//   reported    a maker's figure (S9 p. 1/55 = STAHL SH 6 stationary, 4/1, L4, 4HS7; S12 blocks; S13 the module)
//   derived     computed from the figures above, with the computation in the code
//   estimate    ours: no maker, the reason is given. The tower, its pad and the carrier are not designed: "not for construction".
//
// Frames. Machine frame = world frame of `tower`, `hoist` and `site` (the tower stands at the origin of all three): X along the drum, Y up, Z across
// the drum (+Z: the side of the motor), Y = 0 the farmyard. `HOIST_X(xH)` gives the machine's X of a position measured as the maker measures it:
// from the outer face of the gearbox, along the drum (e1, e7, e12...).

// ------------------------------------------------------------------------------------------------ re-exported from the physics

export {
  BLOCK,
  FARM_FALLS,
  FARM_MASS,
  FARM_STROKE,
  HALF_BLOCK,
  HOOK_APPROACH,
  ROPE_DIAMETER,
  STACK_BLOCKS,
  STACK_HALVES,
};
/** Whole stroke, m (reported K6 through the physics). */
export const STROKE = FARM_STROKE;
/** Rope radius, m (reported K13). */
export const ROPE_R = ROPE_DIAMETER / 2;
/** Drum pitch radius, m (estimate of the physics, `FARM_DRUM_DIAMETER`). The drawing S9 p. 1/55 reads 695 − 517 = 178 mm of radius: see `HOIST.drawnPitchRadius`. */
export const DRUM_R = FARM_DRUM_DIAMETER / 2;

// ------------------------------------------------------------------------------------------------ foundation and vertical datum

/** Pad (research §3: estimate, not calculated). `proud`: how far its top stands above the yard, estimate, so that the rain runs off and the top reads. */
export const PAD = { side: 7, thick: 1.5, proud: 0.15 } as const;
export const PAD_TOP = PAD.proud;
export const PAD_BOTTOM = PAD.proud - PAD.thick;

/** The soft stop (estimate: oil buffers for a 20 t load at 4 m/min). Four, under the carrier's beams. */
export const BUFFER = { h: 0.55, r: 0.09, rod: 0.04, x: 0.6, z: 0.6, plate: 0.3, plateT: 0.025 } as const;
export const BUFFER_TOP = PAD_TOP + BUFFER.h;

/**
 * The carrier and its sling (estimate, research §3: "buffer and carrier 1.0"). Beams under a deck plate, two uprights outside the stack, a crosshead over it: the load
 * hangs from the crosshead, the blocks only sit on the deck.
 */
export const CARRIER = {
  h: 0.45,
  deckSide: 1.75,
  deckT: 0.03,
  /** Beams under the deck, along X, at z = ±z (section: HEB-like). */
  beamZ: 0.6,
  beamW: 0.2,
  /** Cross-beams along Z, at the uprights. */
  strikeT: 0.03,
  /** Uprights at x = ±x, section side. */
  uprightX: 0.96,
  uprightW: 0.16,
  crossheadGap: 0.05,
  crossheadD: 0.2,
  crossheadW: 0.22,
  /** Hook saddle above the crosshead's top: room for the lug, the link and the bowl of the hook. */
  saddleAbove: 0.2,
} as const;

/** The stack (reported K17, K18). Whole blocks 2 per layer, turned a quarter turn each layer. */
export const STACK = {
  width: STACK_WIDTH,
  height: STACK_HEIGHT,
  blocks: STACK_BLOCKS,
  halves: STACK_HALVES,
  /** Studs of the block, S12: two on a whole block's top, sunk in the layer above. Radius and height estimated from the brochure's picture. */
  studR: 0.2,
  studH: 0.06,
} as const;

/** Deck of the carrier at the bottom of the stroke, m (derived). */
export const DECK_Y0 = BUFFER_TOP + CARRIER.h;
/** Top of the full stack at the bottom of the stroke, m (derived). */
export const STACK_TOP_Y0 = DECK_Y0 + STACK.height;
export const CROSSHEAD_Y0 = STACK_TOP_Y0 + CARRIER.crossheadGap;
export const CROSSHEAD_TOP_Y0 = CROSSHEAD_Y0 + CARRIER.crossheadD;
/** Hook saddle at the bottom of the stroke, m (derived). */
export const SADDLE_Y0 = CROSSHEAD_TOP_Y0 + CARRIER.saddleAbove;

/** Hook to foot plane at the top of the stroke (reported S9: C = 0.83 m for 4/1), and hoist's foot plane: the top of the head frame's beams, m (derived). */
export const DECK_TOP = SADDLE_Y0 + STROKE + HOOK_APPROACH;

/** Stroke of the machine drawn at a fraction of the stroke: the 3D uses the state's `zFraction` (a preset may have another stroke). */
export const liftAt = (zFraction: number): number => Math.min(1, Math.max(0, zFraction)) * STROKE;

// ------------------------------------------------------------------------------------------------ the tower

/** The lattice (research §3: estimate, structural design not done). */
export const TOWER = {
  /** Top of the roof, m (estimate of the physics). */
  height: TOWER_HEIGHT,
  /** Half the plan at the legs: 3.6 × 3.6 m. */
  legX: 1.8,
  /** Leg: an H section of this side, flange and web. */
  legSide: 0.25,
  legFlange: 0.02,
  legWeb: 0.014,
  panels: 7,
  /** Base plate of a leg, side and thickness; anchor bolts. */
  basePlate: 0.55,
  basePlateT: 0.03,
  /** Horizontal struts: a channel-like H of this depth. */
  strutD: 0.16,
  /** Diagonals: an angle of this side and thickness, on the outer face of the lattice. */
  angleSide: 0.12,
  angleT: 0.012,
  /** Ring beam of the head frame under the deck plane. */
  ringD: 0.3,
  ringW: 0.25,
  /** Clear shaft (research §3), between the feet of the rails. */
  shaft: 2.4,
  /** Hoist channels: the two beams the feet bolt on, the section of S9's drawing, depth and flange. */
  channelD: 0.2,
  channelW: 0.1,
  /** Roof posts, and the eaves. */
  eavesY: 27.2,
  roofOverhang: 0.35,
  rail: 1.1,
} as const;

export const LEG_TOP = DECK_TOP - TOWER.ringD;
/** Height of a panel of the lattice, m (derived). */
export const PANEL_H = (LEG_TOP - PAD_TOP - TOWER.basePlateT) / TOWER.panels;
/** Level `i` of the lattice (0 = the base plates' top, TOWER.panels = the legs' top), m. */
export const levelY = (i: number): number => PAD_TOP + TOWER.basePlateT + i * PANEL_H;

/** Rear edge of the opening in the deck where the falls go through, m (estimate: clear of fall 1). */
export const DECK_OPENING_REAR = 0.3;

/** Thickness of the checker plates of the deck, on top of the beams, m (estimate). */
export const DECK_PLATE = 0.012;

/** Guide rails (estimate: a T rail of lift practice), blade towards the shaft. */
export const RAIL = {
  /** Back of the blade, on the shaft's half width. */
  x: TOWER.shaft / 2,
  blade: 0.08,
  bladeT: 0.016,
  footT: 0.014,
  footW: 0.14,
  /** Bracket: from the foot to the lattice's strut on x = ±legX. */
  bracketW: 0.12,
  bracketT: 0.014,
  top: DECK_TOP - TOWER.ringD - 0.06,
} as const;
export const RAIL_TIP = RAIL.x - RAIL.blade;

/** Shoes, top and bottom of each upright (estimate). */
export const SHOE = { h: 0.26, w: 0.14, slot: RAIL.bladeT + 0.004, liner: 0.006, topGap: 0.08 } as const;
/** The wedges of the safety gear: a block under each lower shoe (estimate); they rise this far on the rail when they set. */
export const SAFETY = { h: 0.3, w: 0.15, wedgeTravel: 0.06, shaftY: DECK_Y0 - 0.32 } as const;

/** Hook block (reported e10 = 0.756 m from saddle to top at 4/1; the rest estimate). Two sheaves on one axle along X. */
export const HOOK_BLOCK = {
  e10: 0.756,
  /** Sheave pitch radius: 18 × rope (S6 table 7, estimate of the research). */
  sheaveR: (18 * ROPE_DIAMETER) / 2,
  sheaveRim: 0.025,
  sheaveW: 0.06,
  /** The two sheaves at x = ±: the width of the return sheave between them. */
  sheaveX: (18 * ROPE_DIAMETER) / 2,
} as const;
/** Hook saddle to sheave axle, m (derived: the block's top is the sheave's rim). */
export const AXLE_ABOVE_SADDLE = HOOK_BLOCK.e10 - HOOK_BLOCK.sheaveR - HOOK_BLOCK.sheaveRim;

// ------------------------------------------------------------------------------------------------ the hoist

/**
 * The hoist, as S9 p. 1/55 measures it (SH 6, stationary, 4/1, L4, motor 4HS7): along the drum from the gearbox's outer face, across the drum from the frame's front edge.
 * The maker's page reads: e1 2468, e7 495, e12 1940 (between the two rows of holes), 32 from a hole to the foot's outer edge, 50 to its inner edge, e2 1310 (the motor runs
 * back along the drum, beside it), frame 924 across, overall 1314, motor axis 199 from the rear, drum axis 420 from the motor's, axis 240 over the feet, overall height 460,
 * 4 × Ø34 holes (M30), 410 between the holes of a foot, 50 from the front.
 */
export const HOIST = {
  e1: 2.468,
  e2: 1.31,
  e7: 0.495,
  e12: 1.94,
  footOuter: 0.032,
  footInner: 0.05,
  frameW: 0.924,
  overall: 1.314,
  motorFromRear: 0.199,
  drumToMotor: 0.42,
  axisY: 0.24,
  height: 0.46,
  hole: 0.034,
  bolt: 0.03,
  holes: 0.41,
  holeFromFront: 0.05,
  /** The drum's pitch radius that the drawing implies (reported as positions, derived): rope force 517 from the front, axis 695 from the front. Not used: the physics takes 0.33 m. */
  drawnPitchRadius: 0.178,
  /** Thickness of a side plate of the frame (estimate). */
  plateT: 0.03,
  footT: 0.022,
  /** Where sheave A hangs, from the gearbox's face (estimate): clear of the left channel, near the end of the winding. */
  sheaveA: 0.64,
  /** Rope pitch on the drum (estimate: 1.05 × Ø, usual for grooved drums). */
  ropePitch: 0.021,
  /** Where the winding starts, from the gearbox's face (estimate: leaves room for the drum brake's disc). */
  ropeStart: 2.27,
  /** Flanges of the barrel and barrel's crest radius (estimate). */
  barrelR: DRUM_R - 0.004,
  barrelWall: 0.02,
  flangeR: DRUM_R + 0.045,
  flangeT: 0.018,
  /** Sections along the motor's axis, from the gearbox's face (estimates inside e2). */
  motorEnd: 1.02,
  brakeEnd: 1.14,
  hoodEnd: 1.25,
  encoderEnd: 1.31,
  motorR: 0.175,
  ribR: 0.192,
  brakeR: 0.16,
  /** Gearbox outline around the two axes, and its end (the side plate). */
  gearboxDrumR: 0.22,
  gearboxMotorR: 0.16,
  gearboxEnd: 0.516,
  /** Drum brake: a disc on the drum's end, inside the frame (estimate). */
  discR: 0.235,
  discT: 0.022,
  discAt: 2.34,
  /** Return sheave (estimate): the same as the hook's. */
  returnY: 0.24,
  /** Cross-beams of the frame, front and anchor (estimates). */
  frontBeamZ: 0.06,
  beamW: 0.105,
  anchorBeamZ: 0.0725,
  beamTop: 0.3,
} as const;

/** The hoist's X in the machine frame, from a position measured from the gearbox's outer face. Sheave A at x = −sheaveX puts the hook's axis on the tower's axis. */
export const HOIST_X = (xH: number): number => xH - HOIST.sheaveA - HOOK_BLOCK.sheaveX;
/** Falls 1 and 4 hang at z = +sheave radius, falls 2 and 3 at −: so the drum's axis is one drum radius behind fall 1 (derived). */
export const DRUM_Z = HOOK_BLOCK.sheaveR + DRUM_R;
/** The frame's front edge (rope side), its rear edge, the motor's axis, the hoist's rear face (derived from the maker's figures). */
export const FRAME_FRONT = DRUM_Z - (HOIST.overall - HOIST.motorFromRear - HOIST.drumToMotor);
export const FRAME_REAR = FRAME_FRONT + HOIST.frameW;
export const MOTOR_Z = DRUM_Z + HOIST.drumToMotor;
export const HOIST_REAR = FRAME_FRONT + HOIST.overall;
/** Rows of holes along the drum, the machine's X (derived from e7 and e12). */
export const FOOT_X: readonly [number, number] = [
  HOIST_X(HOIST.e1 - HOIST.footOuter - HOIST.e12),
  HOIST_X(HOIST.e1 - HOIST.footOuter),
];
/** Inner faces of the frame's plates, the machine's X (derived). */
export const PLATE_IN: readonly [number, number] = [FOOT_X[0] + HOIST.footInner, FOOT_X[1] - HOIST.footInner];
/** Where the rope stands on the drum, X, when `wound` metres of it are wound (derived: the pitch over the circumference). */
export const windingX = (wound: number): number =>
  HOIST_X(HOIST.ropeStart) - (HOIST.ropePitch * wound) / (2 * Math.PI * DRUM_R);
/** Rope wound on the drum at a lift, m (derived: four falls, plus the turns that stay, K14). */
export const woundAt = (lift: number): number => ROPE_ON_DRUM + FARM_FALLS * lift;

/**
 * Gear stages (estimate; research: ratio unknown, about 170 to 205). Straight line of shafts from the motor's axis to the drum's: the ratios multiply to the physics' ratio
 * and the centre distances add up to the maker's 420 mm. Radii are pitch radii.
 */
export const GEARS = {
  stages: [
    { pinion: 0.014, wheel: 0.084, at: 0.12, teethP: 13, teethW: 78 },
    { pinion: 0.02, wheel: 0.114, at: 0.25, teethP: 14, teethW: 80 },
    { pinion: 0.029, wheel: 0.1595, at: 0.38, teethP: 16, teethW: 88 },
  ],
  width: 0.05,
} as const;
/** The physics' ratio (derived there, K8 and K10). */
export const GEAR_RATIO = FARM.ratio;

/** Overspeed governor (estimate, lift practice): a sheave on the deck, a rope loop down the shaft to a weighted sheave on the pad, gripped by the carrier. */
export const GOVERNOR = {
  x: 1.03,
  z: 0.85,
  r: 0.15,
  ropeR: 0.004,
  /** Height of the axis over the deck, and over the pad. */
  topY: 0.36,
  bottomY: 0.32,
  /** Height of the carrier's clamp, in the frame of the weight: under the deck. */
  clampY: DECK_Y0 - 0.2,
} as const;

/** Lifting ruler, on stand-offs off the lattice near the leg (research §4, estimate of place). One mark a metre, one a hundred watt-hours. */
export const SCALE = { x: 1.25, z: 1.62, w: 0.16, thick: 0.012, band: 1, whBand: 0.1 } as const;
/** Where the ruler's zero stands: the height of the index on the carrier at the bottom of the stroke, m (derived). */
export const RULER_INDEX_ABOVE_DECK = 0.06;
export const RULER_ZERO = DECK_Y0 + RULER_INDEX_ABOVE_DECK;
/** Metres of lift for 100 Wh at 20 t (derived: m·g·h, K1). */
export const WH100_M = (100 * 3600) / (FARM_MASS * G);

/** Ladder on the −Z face (estimate). */
export const LADDER = {
  x: -0.9,
  z: -(TOWER.legX + 0.34),
  w: 0.46,
  rung: 0.3,
  stile: 0.03,
  top: DECK_TOP + 1.05,
} as const;

/** Cable riser up the leg (the leg at −X, +Z, facing the trench), m. */
export const RISER = { x: -(TOWER.legX + TOWER.legSide / 2 + 0.04), z: TOWER.legX, w: 0.1 } as const;

// ------------------------------------------------------------------------------------------------ power shed and its devices

/** The shed, inside faces of the walls (estimate: a small farm building; the same in `site` and `power-room`). X along the back wall; Z towards the door. */
export const SHED = {
  w: 6,
  d: 3.8,
  h: 2.7,
  wall: 0.25,
  /** The shed's centre in the site, m: the trench and the cable come out of the rule that the cable is 55 m (below). */
  x: -35,
  z: 2,
} as const;

/** LFP module, as the physics has it (reported K31). */
export const MODULE = { w: LFP.width, d: LFP.depthMm, h: LFP.height, kg: LFP.mass } as const;

/**
 * The devices along the walls, in the order the current flows, left to right on the back wall (x in the room, y the bottom of the box, w × h × d; all estimates of a drive
 * cabinet at 15 kW, none is any maker's).
 */
export const DEVICE = {
  pvInverter: { x: -2.4, y: 1.15, w: 0.5, h: 0.72, d: 0.2 },
  energyMeter: { x: -1.72, y: 1.42, w: 0.26, h: 0.36, d: 0.12 },
  acPanel: { x: -1.08, y: 0.9, w: 0.72, h: 1.1, d: 0.2 },
  regenSupply: { x: -0.25, y: 0.62, w: 0.62, h: 1.5, d: 0.36 },
  dcLink: { x: 0.42, y: 0.62, w: 0.52, h: 1.5, d: 0.36 },
  motorInverter: { x: 1.04, y: 0.62, w: 0.54, h: 1.5, d: 0.36 },
  brakeChopper: { x: 1.72, y: 1.4, w: 0.4, h: 0.6, d: 0.24 },
  brakeResistor: { x: 2.42, y: 1.55, w: 0.72, h: 0.46, d: 0.32 },
  safetyController: { x: -2.4, y: 0.22, w: 0.5, h: 0.62, d: 0.16 },
  controlUps: { x: -1.42, y: 0.08, w: 0.3, h: 0.55, d: 0.44 },
  batteryInverter: { x: 2.4, y: 0.72, w: 0.46, h: 0.6, d: 0.2 },
} as const;
/** Bay of the three cabinets on their plinth (estimate). */
export const CABINET_PLINTH = 0.1;
/** The shelf the module sits on, on the right-hand end of the room. Height, depth, width (estimate). */
export const SHELF = { x: 2.12, y: 0.42, w: 1.0, d: 0.55, t: 0.04 } as const;
/** Emergency stop: its height (estimate, usual) and its place by the door, on the right wall. */
export const ESTOP = { y: 1.35, r: 0.03, z: 0.9 } as const;

// ------------------------------------------------------------------------------------------------ the site

/**
 * The farm (research §3: fence radius = tower height, roof 36 kWp, all assumptions; plan and buildings estimates). X east, Z south, Y up, the tower at the origin. Flat on
 * purpose: `SITE.flatHeight` caps any undulation of the fields.
 */
export const SITE = {
  fenceR: TOWER_HEIGHT,
  fenceH: 2.2,
  flatHeight: 0.18,
  /** Barn: span across the ridge, length along it, height of the eaves and of the ridge. Ridge along X, roof slopes facing south and north. */
  barn: { x: -58, z: -38, len: 24, span: 18, eaves: 5, ridge: 8.5 },
  /** 90 modules of 400 W (estimate, S13 sizes nothing here): 36 kWp as the research assumes. */
  pv: { rows: 5, cols: 18, w: 1.13, h: 1.76, watts: 400, gap: 0.02 },
  house: { x: 47, z: -38, w: 13, d: 8, eaves: 5.2, ridge: 8.2 },
  yard: { x: 8, z: 15, w: 13, d: 9 },
  gate: { angle: Math.PI / 2 + 0.14, w: 4.2 },
  mast: { x: 19, z: -10, h: 10, r: 0.05 },
  ghost: { x: 30, z: 17, cols: 6, tower: { x: -64, z: -68, dx: 10, dz: -1.5 } },
  /** The supply's pole (estimate): west of the shed, outside the fall zone. The 3D and PL-G01 read it from here. */
  pole: { h: 8.5, x: SHED.x - SHED.w / 2 - SHED.wall - 8, z: SHED.z + 7 },
  trench: { z: 3, w: 0.7, h: 0.12 },
} as const;

/** The motor cable as the model has it (reported as a model's choice: 55 m): the trench and the riser add up to it (test). */
export const MOTOR_CABLE_M = FARM_CABLE_LENGTH;

/** Peak power of the roof as drawn, W (derived: rows × columns × watts). */
export const PV_WATTS = SITE.pv.rows * SITE.pv.cols * SITE.pv.watts;

// ------------------------------------------------------------------------------------------------ colours

/** Paints and metals of the machine, in one place. */
export const COLOURS = {
  galvanised: 0x7f868b,
  galvanisedDark: 0x6c7277,
  concrete: 0x8d8f90,
  concreteDark: 0x76787a,
  block: 0x8f908e,
  carrier: 0x5c3027,
  hoist: 0x2a5573,
  hoistDark: 0x214560,
  yellow: 0xc29018,
  steel: 0x6c7075,
  drum: 0x71767b,
  brake: 0x2a2d31,
  rope: 0x4f5154,
  ropeLight: 0x80837f,
  checker: 0x71746f,
  roof: 0x7f8a84,
} as const;
