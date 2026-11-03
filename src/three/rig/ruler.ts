import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import { G } from '../../sim/machine';
import { FARM_MASS, FARM_STROKE, HOOK_APPROACH, RULER_ZERO, SCALE, STROKE } from '../dims';
import type { MachineLook } from './look';

// What the ruler says. The voice and the sheet promise « metres on one side, watt-hours on the other », so it carries figures, and only figures the model gives: the height along the stroke and
// m·g·h. The 3D draws every machine on the farm's tower by its share of the stroke (`zFraction`), so a ruler written once would lie as soon as the visitor changes the mass or the stroke: it is
// worked out from the state and drawn again when they change. Whole numbers only, so no decimal mark that would differ between the languages; no thousands mark either, the same reason.
// Marks as the lab has them (`tagMark`) and as this part's sheet writes them (« 20 m, 1,09 kWh† »): the height is a source's or the visitor's, unmarked; the energy is arithmetic on it, †.

export interface RulerFigure {
  /** Share of the stroke. */
  f: number;
  text: string;
  unit: string;
}

export interface RulerPlan {
  metreBands: { f: number; major: boolean }[];
  energyBands: { f: number; major: boolean }[];
  metres: RulerFigure[];
  energy: RulerFigure[];
}

/** The smallest of 1, 2, 5 × 10ⁿ that divides `full` in at most `count` steps. */
const stepFor = (full: number, count: number): number => {
  const k = 10 ** Math.floor(Math.log10(full / count));
  for (const m of [1, 2, 5, 10]) if (full / (m * k) <= count + 1e-9) return m * k;
  return 10 * k;
};

const ENERGY_UNITS: [number, string][] = [
  [1e9, 'GWh'],
  [1e6, 'MWh'],
  [1e3, 'kWh'],
  [1, 'Wh'],
  [1e-3, 'mWh'],
];
/** A figure at the very top of the stroke is left out when it is nearer the last one than this share: their plates would touch. */
const TOP_GAP = 0.06;

function column(full: number, unit: string, majors: number, minors: number) {
  const major = Math.max(1, stepFor(full, majors));
  const minor = Math.min(major, stepFor(full, minors));
  const bands: { f: number; major: boolean }[] = [];
  for (let k = 0; k * minor <= full * (1 + 1e-9); k++) {
    const v = k * minor;
    bands.push({ f: v / full, major: Math.abs(v / major - Math.round(v / major)) < 1e-6 });
  }
  const figures: RulerFigure[] = [];
  for (let k = 0; k * major <= full * (1 + 1e-9); k++)
    figures.push({ f: (k * major) / full, text: String(Math.round(k * major)), unit });
  const last = figures[figures.length - 1]!;
  const whole = Math.round(full);
  if (Math.abs(full - whole) < full * 0.002 && 1 - last.f >= TOP_GAP) figures.push({ f: 1, text: String(whole), unit });
  return { bands, figures };
}

/** What the ruler carries for a stroke in metres and an energy at the top of it in Wh, both as the model has them. */
export function rulerPlan(strokeM: number, fullWh: number): RulerPlan {
  const m = column(strokeM, 'm', 5, 20);
  const [u, name] = ENERGY_UNITS.find(([x]) => fullWh / x >= 5) ?? ENERGY_UNITS[ENERGY_UNITS.length - 1]!;
  const e = column(fullWh / u, `${name}†`, 6, 12);
  return { metreBands: m.bands, energyBands: e.bands, metres: m.figures, energy: e.figures };
}

/** The state's stroke and energy at the top of it. A mass cannot be read from a state with the weight at the bottom but through the night's figures: `known` keeps the last one (kit request 18). */
export function modelOf(
  s: { z: number; fallLength: number; storedWh: number; ghostTonnes: number; ghostTowers: number },
  known: { mass: number },
): { strokeM: number; fullWh: number } {
  const strokeM = Math.max(s.fallLength - HOOK_APPROACH + s.z, 1e-3);
  if (s.ghostTowers > 0) known.mass = (s.ghostTonnes / s.ghostTowers) * 1000;
  else if (s.z > 1e-6) known.mass = (s.storedWh * 3600) / (G * s.z);
  return { strokeM, fullWh: (known.mass * G * strokeM) / 3600 };
}

// ---------------------------------------------------------------------------------- the letters: strokes on a grid 4 wide and 6 high

const GLYPHS: Record<string, number[][]> = {
  '0': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 1]],
  '1': [
    [1, 5, 2, 6, 2, 0],
    [1, 0, 3, 0],
  ],
  '2': [[0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 0, 0, 4, 0]],
  '3': [
    [0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3, 1.5, 3],
    [3, 3, 4, 2, 4, 1, 3, 0, 1, 0, 0, 1],
  ],
  '4': [[3, 0, 3, 6, 0, 2, 4, 2]],
  '5': [[4, 6, 0, 6, 0, 3.4, 3, 3.4, 4, 2.4, 4, 1, 3, 0, 1, 0, 0, 1]],
  '6': [[4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3, 0, 3]],
  '7': [[0, 6, 4, 6, 1.5, 0]],
  '8': [
    [1, 3, 0, 4, 0, 5, 1, 6, 3, 6, 4, 5, 4, 4, 3, 3, 1, 3],
    [1, 3, 0, 2, 0, 1, 1, 0, 3, 0, 4, 1, 4, 2, 3, 3],
  ],
  '9': [[0, 1, 1, 0, 3, 0, 4, 1, 4, 5, 3, 6, 1, 6, 0, 5, 0, 4, 1, 3, 4, 3]],
  m: [
    [0, 0, 0, 4],
    [0, 3.2, 0.8, 4, 1.6, 4, 2, 3.2, 2, 0],
    [2, 3.2, 2.8, 4, 3.6, 4, 4, 3.2, 4, 0],
  ],
  W: [[0, 6, 1, 0, 2, 4, 3, 0, 4, 6]],
  h: [
    [0, 6, 0, 0],
    [0, 3.2, 1, 4, 3, 4, 4, 3, 4, 0],
  ],
  k: [
    [0, 6, 0, 0],
    [4, 4, 0, 1.6],
    [1.2, 2.6, 4, 0],
  ],
  M: [[0, 0, 0, 6, 2, 2, 4, 6, 4, 0]],
  G: [[4, 5, 3, 6, 1, 6, 0, 5, 0, 1, 1, 0, 3, 0, 4, 1, 4, 3, 2, 3]],
  '†': [
    [2, 6, 2, 0],
    [0.6, 4.2, 3.4, 4.2],
  ],
};

const GRID_W = 4;
const GRID_H = 6;
const GAP = 1.3;
/** Figures' height, m, the unit's, the width of a stroke at each, and the plate's height. Read from about 7 m when selected. */
const FIGURE_H = 0.14;
const UNIT_H = 0.099;
const FIGURE_STROKE = 0.018;
const UNIT_STROKE = 0.013;
const PLATE_H = 0.195;
const PLATE_PAD = 0.015;
/** Air between a figure and its unit, m. */
const UNIT_AIR = 0.02;
/** How far in front of the strip's face the bands and the plates' faces stand. */
const FACE = 0.004;

/** The mark rides high and small, like a mark in the texts, with a little air before it: written like a letter, « Wh† » read as « Wht ». */
const MARK = '†';
const MARK_H = 0.07;
const MARK_STROKE = 0.01;
const MARK_AIR = 0.018;

const widthOf = (t: string, h: number): number => (t.length * (GRID_W + GAP) - GAP) * (h / GRID_H);
/** The width of a unit written with its mark, if it has one. */
const unitWidth = (unit: string): number => {
  const name = unit.replace(MARK, '');
  return widthOf(name, UNIT_H) + (unit.includes(MARK) ? MARK_AIR + widthOf(MARK, MARK_H) : 0);
};

/** The share of the stroke from which a figure is the last one. */
const LAST_ROW = 0.985;
/**
 * The two figures of the top of the stroke sit just under their bands: level with them, the plate of the metres stood behind the joint of the +X +Z leg (the gusset's foot is 6 cm over the band), and
 * the weight stays up there from the fifth minute (review D59). The bands themselves, and the index, stay true.
 */
const LAST_ROW_DROP = 0.21;
const bandY = (f: number): number => RULER_ZERO + f * STROKE;
const plateY = (f: number): number => bandY(f) - (f >= LAST_ROW ? LAST_ROW_DROP : 0);
const figureWidth = (f: RulerFigure): number => widthOf(f.text, FIGURE_H) + UNIT_AIR + unitWidth(f.unit);
/** How far from the strip's axis the plates start, m. */
const PLATE_FROM_AXIS = SCALE.w / 2 + 0.01;

/** The nearest figure to a share of the stroke. */
const nearest = (list: RulerFigure[], f: number): RulerFigure =>
  list.reduce((a, b) => (Math.abs(b.f - f) < Math.abs(a.f - f) ? b : a));

/** What can be read at a height: a figure of each kind, the nearest to the index and the nearest to that one, with their bands. */
export interface RulerReading {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Points of the two plates' faces, for the sight. */
  points: THREE.Vector3[];
}

class Tris {
  readonly pos: number[] = [];
  readonly nor: number[] = [];
  private tri(a: number[], b: number[], c: number[], n: number[]): void {
    this.pos.push(...a, ...b, ...c);
    this.nor.push(...n, ...n, ...n);
  }
  quad(a: number[], b: number[], c: number[], d: number[], n: number[]): void {
    this.tri(a, b, c, n);
    this.tri(a, c, d, n);
  }
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
  }
  /** A written line, its left end at `x` and its foot at `y`, flat on the plane `z`. */
  text(t: string, x: number, y: number, z: number, h: number, stroke: number): void {
    const u = h / GRID_H;
    [...t].forEach((c, k) => {
      const left = x + k * (GRID_W + GAP) * u;
      for (const line of GLYPHS[c] ?? []) {
        for (let i = 0; i + 3 < line.length; i += 2) {
          const ax = left + line[i]! * u;
          const ay = y + line[i + 1]! * u;
          const bx = left + line[i + 2]! * u;
          const by = y + line[i + 3]! * u;
          const len = Math.hypot(bx - ax, by - ay) || 1;
          const dx = ((bx - ax) / len) * (stroke / 2);
          const dy = ((by - ay) / len) * (stroke / 2);
          this.quad(
            [ax - dx + dy, ay - dy - dx, z],
            [bx + dx + dy, by + dy - dx, z],
            [bx + dx - dy, by + dy + dx, z],
            [ax - dx - dy, ay - dy + dx, z],
            [0, 0, 1],
          );
        }
      }
    });
  }
  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    return g;
  }
}

/** A figure, its unit and its mark, on one line centred on `y`. */
function writeFigure(t: Tris, f: RulerFigure, x: number, y: number, z: number): void {
  const foot = y - FIGURE_H / 2;
  t.text(f.text, x, foot, z, FIGURE_H, FIGURE_STROKE);
  const name = f.unit.replace(MARK, '');
  const xUnit = x + widthOf(f.text, FIGURE_H) + UNIT_AIR;
  t.text(name, xUnit, foot, z, UNIT_H, UNIT_STROKE);
  if (f.unit.includes(MARK))
    t.text(MARK, xUnit + widthOf(name, UNIT_H) + MARK_AIR, foot + FIGURE_H - MARK_H, z, MARK_H, MARK_STROKE);
}

/** The bands, plates and figures of the ruler: one mesh a material, never baked, drawn again when the model changes. */
export class RulerMarks {
  readonly root: THREE.Group;
  private readonly pale: THREE.Mesh;
  private readonly dark: THREE.Mesh;
  private readonly copper: THREE.Mesh;
  private key = '';
  private readonly known = { mass: FARM_MASS };
  /** What it says now. */
  plan: RulerPlan;

  constructor(look: MachineLook) {
    this.root = group('ruler-marks');
    this.root.userData.dynamic = true;
    const part = (mat: THREE.Material, name: string): THREE.Mesh => {
      const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      m.name = name;
      m.castShadow = false;
      m.userData.noShadow = true;
      this.root.add(m);
      return m;
    };
    this.pale = part(look.scaleLight, 'ruler-pale');
    this.dark = part(look.scaleDark, 'ruler-dark');
    this.copper = part(look.scaleCopper, 'ruler-copper');
    this.plan = rulerPlan(FARM_STROKE, (FARM_MASS * G * FARM_STROKE) / 3600);
    this.draw(this.plan);
  }

  /** Read the state; draw again only when the model has changed. */
  update(s: Parameters<typeof modelOf>[0]): void {
    const { strokeM, fullWh } = modelOf(s, this.known);
    const key = `${strokeM.toFixed(3)}|${fullWh.toPrecision(5)}`;
    if (key === this.key) return;
    this.key = key;
    this.plan = rulerPlan(strokeM, fullWh);
    this.draw(this.plan);
  }

  /** What to frame to read the ruler with the weight at this share of the stroke. */
  reading(f: number, withPoints = false): RulerReading {
    const metre = nearest(this.plan.metres, f);
    const energy = nearest(this.plan.energy, metre.f);
    const ys = [plateY(metre.f), plateY(energy.f)];
    const bands = [bandY(metre.f), bandY(energy.f)];
    const r: RulerReading = {
      x0: SCALE.x - PLATE_FROM_AXIS - figureWidth(energy) - 2 * PLATE_PAD - 0.02,
      x1: SCALE.x + PLATE_FROM_AXIS + figureWidth(metre) + 2 * PLATE_PAD + 0.02,
      y0: Math.min(...ys, ...bands) - PLATE_H / 2 - 0.06,
      y1: Math.max(...ys, ...bands) + PLATE_H / 2 + 0.06,
      points: [],
    };
    if (withPoints) {
      const row = (x0: number, x1: number, y: number): void => {
        for (const u of [0.1, 0.3, 0.5, 0.7, 0.9])
          for (const v of [-0.3, 0.3])
            r.points.push(new THREE.Vector3(x0 + (x1 - x0) * u, y + v * PLATE_H, SCALE.z + FACE));
      };
      const inner = PLATE_FROM_AXIS;
      row(SCALE.x + inner, SCALE.x + inner + figureWidth(metre) + 2 * PLATE_PAD, ys[0]!);
      row(SCALE.x - inner - figureWidth(energy) - 2 * PLATE_PAD, SCALE.x - inner, ys[1]!);
    }
    return r;
  }

  private draw(plan: RulerPlan): void {
    const pale = new Tris();
    const dark = new Tris();
    const copper = new Tris();
    const zBack = SCALE.z - SCALE.thick;
    const zFace = SCALE.z + FACE;
    const halfW = SCALE.w / 2;
    // the metres on the strip's right half, the watt-hours on its left: the names run out to the sides, and the leg is on the right
    for (const b of plan.metreBands) {
      const w = b.major ? halfW : halfW * 0.72;
      const h = b.major ? 0.045 : 0.025;
      pale.box(SCALE.x, SCALE.x + w, bandY(b.f) - h, bandY(b.f) + h, SCALE.z, zFace);
    }
    for (const b of plan.energyBands) {
      const w = b.major ? halfW : halfW * 0.72;
      const h = b.major ? 0.045 : 0.025;
      copper.box(SCALE.x - w, SCALE.x, bandY(b.f) - h, bandY(b.f) + h, SCALE.z, zFace);
    }
    const edge = PLATE_FROM_AXIS;
    for (const f of plan.metres) {
      const y = plateY(f.f);
      const wide = figureWidth(f);
      const x0 = SCALE.x + edge;
      pale.box(x0, x0 + wide + 2 * PLATE_PAD, y - PLATE_H / 2, y + PLATE_H / 2, zBack, zFace);
      writeFigure(dark, f, x0 + PLATE_PAD, y, zFace + 0.002);
    }
    for (const f of plan.energy) {
      const y = plateY(f.f);
      const wide = figureWidth(f);
      const x1 = SCALE.x - edge;
      copper.box(x1 - wide - 2 * PLATE_PAD, x1, y - PLATE_H / 2, y + PLATE_H / 2, zBack, zFace);
      writeFigure(pale, f, x1 - PLATE_PAD - wide, y, zFace + 0.002);
    }
    for (const [mesh, tris] of [
      [this.pale, pale],
      [this.dark, dark],
      [this.copper, copper],
    ] as const) {
      mesh.geometry.dispose();
      mesh.geometry = tris.geometry();
    }
  }
}
