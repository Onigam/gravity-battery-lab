// Drawing helpers shared by the sheets: text wrapping, notes, tables, the legend of the marks, labels with their mark. Everything draws through the kit's View. Ported from Mill Lab's
// src/drawings/draw.ts and geom.ts, and trimmed. A number on a sheet goes through `mL`, `mmL` or `fig`, so that it is read from src/three/dims.ts or src/sim with its mark.
import { COLORS, INK_2, W, type Drawing, type Text } from '@onigam/lab-kit/drawings';
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { FIG, markOf, type Fig, type FigName } from '../data/figures';
import { nEn, nFr } from '../data/units';

export const PAPER = COLORS.paper;
export const HEAD_FILL = '#efe6d3';
export const RED = COLORS.red;
export const FILL = {
  steel: '#e6e4de',
  concrete: '#e4e0d6',
  earth: '#ece4d2',
  copper: '#f0d2ba',
  roof: '#e6d3c4',
  field: '#f0ecdf',
} as const;

/** A model length in metres, as the sheets draw it: model millimetres. */
export const mm = (m: number): number => m * 1000;

export type Mark = '' | '†' | '*';

const trimFr = (s: string): string => (s.includes(',') ? s.replace(/0+$/, '').replace(/,$/, '') : s);
const trimEn = (s: string): string => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);

/** A length in metres, printed in metres: at most `digits` decimals, no trailing zero, with its mark. */
export const mL = (m: number, mark: Mark, digits = 2): L =>
  l(`${trimFr(nFr(m, digits))} m${mark}`, `${trimEn(nEn(m, digits))} m${mark}`);

/** A length in metres, printed in millimetres, with its mark. */
export const mmL = (m: number, mark: Mark, prefix = ''): L =>
  l(`${prefix}${nFr(m * 1000, 0)}${mark}`, `${prefix}${nEn(m * 1000, 0)}${mark}`);

/** A number and its unit, with its mark. */
export const numL = (v: number, digits: number, unit: string | readonly [string, string], mark: Mark): L => {
  const [uf, ue] = typeof unit === 'string' ? [unit, unit] : unit;
  return l(`${nFr(v, digits)}${uf}${mark}`, `${nEn(v, digits)}${ue}${mark}`);
};

/** A figure of src/data/figures.ts, with its unit and mark, the way the texts print it. */
export function fig(name: FigName): L {
  const f = FIG[name] as Fig;
  const uf = typeof f.u === 'string' ? f.u : f.u ? f.u[0] : '';
  const ue = typeof f.u === 'string' ? f.u : f.u ? f.u[1] : '';
  const pre = f.pre ?? '';
  return l(`${nFr(f.v, f.d)}${uf}${markOf(f.s)}`, `${pre}${nEn(f.v, f.d)}${ue}${markOf(f.s)}`);
}

/** Texts joined, each resolved in its language. */
export const cat = (...parts: (L | string)[]): L =>
  l(
    parts.map((p) => (typeof p === 'string' ? p : p.fr)).join(''),
    parts.map((p) => (typeof p === 'string' ? p : p.en)).join(''),
  );

// ------------------------------------------------------------------------------------------------ text

/** Width estimate of a text of the given cap height, in paper mm (a little pessimistic: sheets must not overflow). */
export function estW(s: string, size: number, mono = false, bold = false): number {
  return s.length * size * (mono ? 0.86 : bold ? 0.82 : 0.74);
}

/** Greedy word wrap into lines no wider than `maxW`. */
export function wrap(s: string, maxW: number, size: number, mono = false, bold = false): string[] {
  const out: string[] = [];
  for (const par of s.split('\n')) {
    let line = '';
    for (const word of par.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && estW(next, size, mono, bold) > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

export interface ParaOpts {
  size?: number;
  lineH?: number;
  color?: string;
  bold?: boolean;
  mono?: boolean;
  bullet?: string;
}

/** Wrapped paragraph in paper space. Returns the y below it. */
export function note(d: Drawing, x: number, y: number, w: number, text: Text, o: ParaOpts = {}): number {
  const size = o.size ?? 1.9;
  const lh = o.lineH ?? size * 1.62;
  const indent = o.bullet ? size * 2.2 : 0;
  const lines = wrap(tr(text), w - indent, size, o.mono, o.bold);
  const p = d.paper();
  if (o.bullet) p.text([x, y], o.bullet, { size, baseline: 'top', weight: 'bold', color: o.color });
  lines.forEach((ln, i) =>
    p.text([x + indent, y + i * lh], ln, {
      size,
      baseline: 'top',
      color: o.color,
      weight: o.bold ? 'bold' : 'normal',
      mono: o.mono,
    }),
  );
  return y + lines.length * lh + size * 0.55;
}

/** A small bold heading in paper space (a view or a block title). Returns the y below it. */
export function heading(
  d: Drawing,
  x: number,
  y: number,
  text: Text,
  o: { size?: number; color?: string } = {},
): number {
  const size = o.size ?? 2.5;
  d.paper().text([x, y], text, { size, weight: 'bold', baseline: 'top', color: o.color });
  return y + size * 1.9;
}

// ------------------------------------------------------------------------------------------------ tables

export interface Cell {
  t: Text;
  bold?: boolean;
  mono?: boolean;
  color?: string;
}
export interface Col {
  label: Text;
  w: number;
  align?: 'start' | 'middle' | 'end';
  mono?: boolean;
}

/** Table with word-wrapped cells. Returns its height. */
export function grid(
  d: Drawing,
  x: number,
  y: number,
  cols: Col[],
  rows: (Cell | Text)[][],
  o: { size?: number; pad?: number; lineH?: number } = {},
): number {
  const p = d.paper();
  const size = o.size ?? 1.85;
  const lh = o.lineH ?? size * 1.55;
  const pad = o.pad ?? 0.8;
  const total = cols.reduce((a, c) => a + c.w, 0);
  const cell = (c: Cell | Text): Cell =>
    typeof c === 'string' || 'fr' in (c as object) ? { t: c as Text } : (c as Cell);
  const lay = (t: Text, c: Col, ce: Cell): string[] => wrap(tr(t), c.w - 2.8, size, ce.mono ?? c.mono, ce.bold);
  const headLines = cols.map((c) => lay(c.label, c, { t: c.label, bold: true }));
  const headH = Math.max(...headLines.map((x2) => x2.length)) * lh + pad * 2;
  const body = rows.map((r) => r.map((c, i) => ({ ce: cell(c), lines: lay(cell(c).t, cols[i]!, cell(c)) })));
  const heights = body.map((r) => Math.max(...r.map((c) => c.lines.length)) * lh + pad * 2);
  const h = headH + heights.reduce((a, b) => a + b, 0);
  p.rect([x, y], [x + total, y + h], { w: W.medium, fill: PAPER });
  p.rect([x, y], [x + total, y + headH], { w: W.thin, fill: HEAD_FILL });
  const put = (lines: string[], cx: number, cy: number, c: Col, ce: Cell): void => {
    const align = c.align ?? 'start';
    const tx = align === 'start' ? cx + 1.3 : align === 'end' ? cx + c.w - 1.3 : cx + c.w / 2;
    lines.forEach((ln, i) =>
      p.text([tx, cy + pad + i * lh + lh * 0.1], ln, {
        size,
        anchor: align,
        baseline: 'top',
        mono: ce.mono ?? c.mono,
        weight: ce.bold ? 'bold' : 'normal',
        color: ce.color,
      }),
    );
  };
  let cx = x;
  cols.forEach((c, i) => {
    if (i) p.line([cx, y], [cx, y + h], { w: W.thin });
    put(headLines[i]!, cx, y, c, { t: c.label, bold: true });
    cx += c.w;
  });
  let ry = y + headH;
  body.forEach((r, ri) => {
    p.line([x, ry], [x + total, ry], { w: W.thin });
    let rx = x;
    r.forEach((c, ci) => {
      put(c.lines, rx, ry, cols[ci]!, c.ce);
      rx += cols[ci]!.w;
    });
    ry += heights[ri]!;
  });
  return h;
}

// ------------------------------------------------------------------------------------------------ boxes, legends

/** The legend of the marks that follow every figure on the sheets. Returns the y below it. */
export function marksLegend(d: Drawing, x: number, y: number, w: number): number {
  const p = d.paper();
  const rows: [string, L][] = [
    ['123', l('donné par une source publiée', 'given by a published source')],
    ['123†', l('calculé à partir de chiffres publiés', 'computed from published figures')],
    ['123*', l('estimation de ce lab, ou résultat de son modèle', 'an estimate of this lab, or a result of its model')],
  ];
  const lh = 3.4;
  const lines = rows.map(([, t]) => wrap(tr(t), w - 14, 1.8));
  const h = 3 + lines.reduce((a, ln) => a + ln.length * lh, 0) + 1.5;
  p.rect([x, y], [x + w, y + h], { w: W.thin, color: INK_2, fill: PAPER });
  let yy = y + 3;
  rows.forEach(([m], i) => {
    p.text([x + 1.5, yy], m, { size: 1.8, baseline: 'middle', mono: true, weight: 'bold' });
    lines[i]!.forEach((ln, j) => p.text([x + 12, yy + j * lh], ln, { size: 1.8, baseline: 'middle' }));
    yy += lines[i]!.length * lh;
  });
  return y + h + 1.5;
}

/** A numbered balloon in paper space. */
export function balloon(d: Drawing, x: number, y: number, n: number | string): void {
  const p = d.paper();
  p.circle([x, y], 2.6, { w: W.thin, fill: PAPER });
  p.text([x, y], String(n), { size: 2, weight: 'bold', anchor: 'middle', baseline: 'middle' });
}
