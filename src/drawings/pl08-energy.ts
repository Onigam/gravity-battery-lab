import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { chainAt } from '../sim/chain';
import { ISO_ENERGIES, isoLine, LADDER_BOX, RUNGS, rungEnergyTag, rungEnergyWh, tagMark } from '../sim/ladder';
import { FARM, FARM_MASS, G } from '../sim/machine';
import { hangingRope } from '../sim/reeving';
import { lf } from '../data/part-helpers';
import { fig, FILL, grid, heading, marksLegend, note, PAPER, RED } from './draw';

// PL-G08: where the power goes (a Sankey, at full speed, in the model), and where this tower stands among the real machines: mass against height, log-log, with lines of equal energy. All the numbers are `chainAt` and `RUNGS`.

export const ITEMS = ['machine-tower'] as const;

const up = chainAt(FARM, FARM_MASS, FARM.stroke / 2, FARM.vRated);
const down = chainAt(FARM, FARM_MASS, FARM.stroke / 2, -FARM.vRated);

export interface Loss {
  name: L;
  w: number;
}

/** The losses of one way, from the meter's side to the hook's, in the order the power crosses them, W. */
export function lossesOf(p: typeof up): Loss[] {
  return [
    { name: l('Auxiliaires', 'Auxiliaries'), w: p.fan + p.brakes + p.controls },
    { name: l('Alimentation', 'Supply'), w: p.supply },
    { name: l('Variateur', 'Inverter'), w: p.inverter },
    { name: l('Câble', 'Cable'), w: p.cable },
    { name: l('Moteur', 'Motor'), w: p.motorCopper + p.motorIron + p.motorWindage },
    { name: l('Réducteur', 'Gearbox'), w: p.gearMesh + p.gearDrag },
    { name: l('Tambour et poulies', 'Drum and sheaves'), w: p.drum + p.reeving },
    { name: l('Rails', 'Guides'), w: p.guide },
  ];
}

const KW = (w: number): L => l(`${nFr(w / 1000, 2)} kW*`, `${nEn(w / 1000, 2)} kW*`);

/** The power that the rope hanging at mid-stroke takes on the way up and gives back on the way down, W: it is lifted with the load. */
export const ropePower = (): number =>
  hangingRope(FARM.falls, FARM.ropeMassPerM, FARM.stroke, FARM.stroke / 2) * G * FARM.vRated;

/** A band that loses a share at each stage, drawn from left to right. `hookFirst`: the descent, which starts at the hook. */
function sankey(
  d: Drawing,
  x0: number,
  y0: number,
  width: number,
  scale: number,
  startW: number,
  losses: Loss[],
  title: L,
  endLabel: L,
): void {
  const p = d.paper();
  p.text([x0, y0 - 15], title, { size: 2.3, weight: 'bold', baseline: 'top' });
  const n = losses.length;
  let top = y0 + 4;
  let h = startW * scale;
  p.text([x0, top + h / 2], KW(startW), { size: 2, mono: true, weight: 'bold', baseline: 'middle', color: RED });
  const xStart = x0 + 20;
  const stepX = (width - 20) / n;
  losses.forEach((ls, i) => {
    const x = xStart + i * stepX;
    const lossH = ls.w * scale;
    p.polyline(
      [
        [x, top],
        [x + stepX, top + lossH],
        [x + stepX, top + h],
        [x, top + h],
      ],
      { w: W.thin, closed: true, fill: '#d8e2ea', color: INK_2 },
    );
    // the share lost: a small triangle going up, and its label
    p.polyline(
      [
        [x, top],
        [x + stepX, top + lossH],
        [x + stepX * 0.5, top - 3],
      ],
      { w: W.thin, closed: true, fill: '#f0c9a8', color: INK_2 },
    );
    p.text([x + stepX * 0.5, top - 6.2], ls.name, { size: 1.55, anchor: 'middle', baseline: 'middle' });
    p.text([x + stepX * 0.5, top - 3.9 - 5], l(`${nFr(ls.w, 0)} W*`, `${nEn(ls.w, 0)} W*`), {
      size: 1.6,
      mono: true,
      anchor: 'middle',
      baseline: 'middle',
    });
    top += lossH;
    h -= lossH;
  });
  p.text([xStart + n * stepX + 2, top + h / 2], endLabel, {
    size: 2,
    mono: true,
    weight: 'bold',
    baseline: 'middle',
    color: RED,
  });
}

/** The log-log chart: paper box, log10 height (m) on X, log10 mass (t) on Y, from `LADDER_BOX`. */
export const CHART = { x: 250, y: 26, w: 154, h: 118 } as const;

function chart(d: Drawing): void {
  const p = d.paper();
  const b = LADDER_BOX;
  const X = (lx: number): number => CHART.x + ((lx - b.xMin) / (b.xMax - b.xMin)) * CHART.w;
  const Y = (ly: number): number => CHART.y + CHART.h - ((ly - b.yMin) / (b.yMax - b.yMin)) * CHART.h;
  p.rect([CHART.x, CHART.y], [CHART.x + CHART.w, CHART.y + CHART.h], { w: W.medium, fill: PAPER });
  // grid: powers of ten
  for (let e = 0; e <= 3; e++) {
    p.line([X(e), CHART.y], [X(e), CHART.y + CHART.h], { w: W.thin, color: '#d5d2c8' });
    p.text([X(e), CHART.y + CHART.h + 3], l(nFr(10 ** e, 0), nEn(10 ** e, 0)), {
      size: 1.9,
      anchor: 'middle',
      mono: true,
      baseline: 'top',
    });
  }
  for (let e = b.yMin; e <= b.yMax; e += 2) {
    p.line([CHART.x, Y(e)], [CHART.x + CHART.w, Y(e)], { w: W.thin, color: '#d5d2c8' });
    const [v2, u] = e >= 0 ? [10 ** e, ' t'] : [10 ** (e + 3), ' kg'];
    p.text([CHART.x - 1.5, Y(e)], l(`${nFr(v2, 0)}${u}`, `${nEn(v2, 0)}${u}`), {
      size: 1.8,
      anchor: 'end',
      mono: true,
      baseline: 'middle',
    });
  }
  p.text([CHART.x + CHART.w / 2, CHART.y + CHART.h + 8], l('Hauteur (m)', 'Height (m)'), {
    size: 2.1,
    weight: 'bold',
    anchor: 'middle',
    baseline: 'top',
  });
  p.text([CHART.x - 26, CHART.y + CHART.h / 2], l('Masse', 'Mass'), {
    size: 2.1,
    weight: 'bold',
    anchor: 'middle',
    rotate: 90,
    baseline: 'middle',
  });
  // lines of equal energy
  const units = ['1 Wh', '1 kWh', '1 MWh', '1 GWh'];
  ISO_ENERGIES.forEach((wh, i) => {
    const pts = isoLine(wh);
    if (pts.length < 2) return;
    p.line([X(pts[0]![0]), Y(pts[0]![1])], [X(pts[1]![0]), Y(pts[1]![1])], {
      w: W.thin,
      color: COLORS.acL,
      dash: 'hidden',
    });
    const mid = 0.12;
    const lx = pts[0]![0] + (pts[1]![0] - pts[0]![0]) * mid;
    const ly = pts[0]![1] + (pts[1]![1] - pts[0]![1]) * mid;
    p.text([X(lx) + 1, Y(ly) - 1.5], units[i]!, { size: 1.9, color: COLORS.acL, weight: 'bold' });
  });
  // the machines
  RUNGS.forEach((r, i) => {
    const x = X(Math.log10(r.height));
    const y = Y(Math.log10(r.mass / 1000));
    const mine = r.id === 'farm';
    p.circle([x, y], mine ? 2.8 : 2.3, {
      w: W.medium,
      fill: mine ? '#f0c9a8' : r.built ? '#d8e2ea' : PAPER,
      color: r.built ? undefined : INK_2,
    });
    p.text([x, y], String(i + 1), { size: 1.6, weight: 'bold', anchor: 'middle', baseline: 'middle' });
  });
}

function energyLabel(wh: number, mark: string): L {
  const a = Math.abs(wh);
  const [v, u] =
    a >= 1e9 ? [wh / 1e9, 'GWh'] : a >= 1e6 ? [wh / 1e6, 'MWh'] : a >= 1000 ? [wh / 1000, 'kWh'] : [wh, 'Wh'];
  const digits = v < 10 ? 2 : v < 100 ? 1 : 0;
  return l(`${nFr(v, digits)} ${u}${mark}`, `${nEn(v, digits)} ${u}${mark}`);
}

const RUNG_NAMES: Record<string, [string, string]> = {
  gravitylight: ['Lampe à poids', 'Weight-driven lamp'],
  diy: ['La cour, en vidéo', 'The courtyard, on video'],
  garden: ['Un jardin', 'A garden'],
  farm: ['La tour de ce lab', 'This lab’s tower'],
  leith: ['Édimbourg, 2021', 'Edinburgh, 2021'],
  swiss: ['Tessin, un bloc, 2020', 'Ticino, one block, 2020'],
  'green-gravity': ['Puits en Australie', 'Shaft in Australia'],
  shaft: ['Idée de puits de mine', 'Mine-shaft idea'],
  ares: ['Train en pente, idée', 'Train on a slope, idea'],
  rudong: ['Rudong, Chine', 'Rudong, China'],
  nant: ['Nant de Drance', 'Nant de Drance'],
};

export const energySheet: DrawingSheet = {
  id: 'energy-chain',
  number: 'PL-G08',
  group: 'chart',
  title: l('L’énergie : la chaîne et l’échelle', 'The energy: the chain and the scale'),
  description: lf(
    'À gauche, où passe la puissance à pleine vitesse : ce qui part à chaque étage, selon le modèle. À droite, les machines réelles sur un seul graphique, la masse contre la hauteur, avec des lignes d’égale énergie. Une tonne à {kwhHeight}, c’est un kilowattheure : de la lampe au lac, tout se lit sur ces droites. La tour de ce lab est le point numéro quatre.',
    'On the left, where the power goes at full speed: what leaves at each stage, by the model. On the right, the real machines on one chart, mass against height, with lines of equal energy. One tonne at {kwhHeight} is a kilowatt-hour: from the lamp to the lake, everything reads on these lines. This lab’s tower is point number four.',
  ),
  scene: 'site',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('L’énergie : la chaîne et l’échelle', 'The energy: the chain and the scale'),
      subtitle: l('Le modèle, puis les machines réelles', 'The model, then the real machines'),
      number: 'PL-G08',
      scale: '—',
    });
    heading(d, 14, 14, l('OÙ PASSE LA PUISSANCE, À PLEINE VITESSE', 'WHERE THE POWER GOES, AT FULL SPEED'));
    const scale = 0.0035;
    sankey(
      d,
      14,
      44,
      176,
      scale,
      up.meter,
      lossesOf(up),
      l('EN MONTÉE : DU COMPTEUR AU POIDS ET À SON CÂBLE', 'CLIMBING: FROM THE METER TO THE WEIGHT AND ITS ROPE'),
      KW(up.hook + ropePower()),
    );
    sankey(
      d,
      14,
      134,
      176,
      scale,
      down.hook + ropePower(),
      lossesOf(down).reverse(),
      l('EN DESCENTE : DU POIDS ET DE SON CÂBLE AU COMPTEUR', 'COMING DOWN: FROM THE WEIGHT AND ITS ROPE TO THE METER'),
      KW(-down.meter),
    );
    let y = 192;
    y = note(
      d,
      14,
      y,
      200,
      lf(
        'Ces bandes sont le modèle, pas une mesure : personne n’a mesuré une machine de cette taille. Sur la montée et la descente, l’aller-retour à pleine vitesse fait {roundTrip}, entre {roundTripLow} et {roundTripHigh} selon les hypothèses. Auxiliaires : ventilateur, freins, contrôle.',
        'These bands are the model, not a measurement: nobody has measured a machine of this size. Over the climb and the descent, the round trip at full speed is {roundTrip}, between {roundTripLow} and {roundTripHigh} depending on the assumptions. Auxiliaries: fan, brakes, controls.',
      ),
    );
    grid(
      d,
      14,
      y + 1,
      [
        { label: l('Par kilo, à 20 m', 'Per kilo, at 20 m'), w: 66 },
        { label: l('Un module', 'One module'), w: 66 },
        { label: l('Un module garde', 'One module keeps'), w: 68 },
      ],
      [[fig('whPerKg'), fig('lfpWhPerKg'), fig('towersPerModule')]],
      { size: 1.9 },
    );
    heading(d, 232, 14, l('LES MACHINES RÉELLES : MASSE ET HAUTEUR', 'THE REAL MACHINES: MASS AND HEIGHT'));
    chart(d);
    const rows = RUNGS.map((r, i) => {
      const [fr, en] = RUNG_NAMES[r.id] ?? [r.id, r.id];
      return [String(i + 1), l(fr, en), energyLabel(rungEnergyWh(r), tagMark(rungEnergyTag(r)))];
    });
    const half = Math.ceil(rows.length / 2);
    const cols = [
      { label: l('N°', 'No.'), w: 7, align: 'middle' as const },
      { label: l('Machine', 'Machine'), w: 50 },
      { label: l('Énergie', 'Energy'), w: 26, align: 'end' as const, mono: true },
    ];
    grid(d, 232, 158, cols, rows.slice(0, half), { size: 1.75, lineH: 2.7, pad: 0.55 });
    grid(d, 320, 158, cols, rows.slice(half), { size: 1.75, lineH: 2.7, pad: 0.55 });
    marksLegend(d, 232, 208, 84);
    sentence(d);
    return d;
  },
};

/** The sentence of the sheet, the one the whole lab turns on. */
function sentence(d: Drawing): void {
  const p = d.paper();
  p.rect([320, 208], [403, 222], { w: W.thin, fill: FILL.field });
  p.text([361.5, 212], lf('Une tonne, {kwhHeight}', 'One tonne, {kwhHeight}'), {
    size: 2.6,
    weight: 'bold',
    anchor: 'middle',
    baseline: 'middle',
  });
  p.text([361.5, 217.5], l('un kilowattheure', 'one kilowatt-hour'), {
    size: 2.1,
    anchor: 'middle',
    baseline: 'middle',
  });
}
