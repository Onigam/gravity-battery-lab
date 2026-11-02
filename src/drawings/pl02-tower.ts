import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import {
  BUFFER,
  BUFFER_TOP,
  CARRIER,
  CROSSHEAD_TOP_Y0,
  DECK_TOP,
  DECK_Y0,
  HOIST,
  LADDER,
  LEG_TOP,
  levelY,
  PAD,
  PAD_BOTTOM,
  PAD_TOP,
  PANEL_H,
  RAIL,
  SADDLE_Y0,
  SCALE,
  STACK,
  STACK_TOP_Y0,
  STROKE,
  TOWER,
  WH100_M,
} from '../three/dims';
import { lf } from '../data/part-helpers';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, mmL, note, numL, PAPER } from './draw';

// PL-G02: the tower in elevation and in plan. Every level comes from dims.ts, so the chain of heights adds up by construction, and it is what the research's estimate of 28 m is made of.

export const ITEMS = [
  'foundation-pad',
  'tower-leg',
  'tower-bracing',
  'head-frame',
  'guide-rail',
  'end-buffer',
  'service-ladder',
  'height-scale',
] as const;

const legHalf = TOWER.legSide / 2;

function elevation(d: Drawing): void {
  const v = d.view(82, 268, 1 / 125);
  const L = TOWER.legX;
  // the ground, the pad
  v.line([mm(-6), 0], [mm(6), 0], { w: W.medium });
  v.rect([mm(-PAD.side / 2), mm(PAD_BOTTOM)], [mm(PAD.side / 2), mm(PAD_TOP)], {
    w: W.medium,
    fill: FILL.concrete,
    hatch: 'earth',
  });
  // legs, struts, X bracing in each panel
  for (const s of [-1, 1])
    v.rect([mm(s * L - legHalf), mm(PAD_TOP)], [mm(s * L + legHalf), mm(LEG_TOP)], { w: W.medium, fill: FILL.steel });
  for (let i = 0; i < TOWER.panels; i++) {
    v.line([mm(-L), mm(levelY(i))], [mm(L), mm(levelY(i))], { w: W.thin });
    v.line([mm(-L), mm(levelY(i))], [mm(L), mm(levelY(i + 1))], { w: W.thin, color: INK_2 });
    v.line([mm(L), mm(levelY(i))], [mm(-L), mm(levelY(i + 1))], { w: W.thin, color: INK_2 });
  }
  // rails
  for (const s of [-1, 1])
    v.line([mm(s * RAIL.x), mm(PAD_TOP)], [mm(s * RAIL.x), mm(RAIL.top)], { w: W.medium, color: COLORS.copper });
  // buffers, carrier and stack at the bottom of the stroke
  for (const s of [-1, 1])
    v.rect([mm(s * BUFFER.x - BUFFER.r), mm(PAD_TOP)], [mm(s * BUFFER.x + BUFFER.r), mm(BUFFER_TOP)], {
      w: W.thin,
      fill: FILL.steel,
    });
  const W2 = CARRIER.deckSide / 2;
  const weight = (lift: number, phantom: boolean): void => {
    const s = phantom ? { w: W.thin, color: INK_2, dash: 'phantom' as const } : { w: W.medium, fill: FILL.concrete };
    v.rect([mm(-W2), mm(BUFFER_TOP + lift)], [mm(W2), mm(DECK_Y0 + lift)], s);
    v.rect([mm(-STACK.width / 2), mm(DECK_Y0 + lift)], [mm(STACK.width / 2), mm(STACK_TOP_Y0 + lift)], s);
    v.rect([mm(-CARRIER.uprightX), mm(STACK_TOP_Y0 + lift)], [mm(CARRIER.uprightX), mm(CROSSHEAD_TOP_Y0 + lift)], s);
  };
  weight(0, false);
  weight(STROKE, true);
  // rope, from the hook to the hoist
  v.line([0, mm(SADDLE_Y0)], [0, mm(DECK_TOP)], { w: W.thin, color: COLORS.copper });
  // head frame, hoist, roof
  v.rect([mm(-L - legHalf), mm(LEG_TOP)], [mm(L + legHalf), mm(DECK_TOP)], { w: W.medium, fill: FILL.steel });
  v.rect([mm(-HOIST.e1 / 2), mm(DECK_TOP)], [mm(HOIST.e1 / 2), mm(DECK_TOP + HOIST.height)], {
    w: W.medium,
    fill: '#d8e2ea',
  });
  v.polyline(
    [
      [mm(-L - TOWER.roofOverhang), mm(TOWER.eavesY)],
      [0, mm(TOWER.height)],
      [mm(L + TOWER.roofOverhang), mm(TOWER.eavesY)],
    ],
    { w: W.medium, closed: true, fill: FILL.roof },
  );
  for (const s of [-1, 1]) v.line([mm(s * L), mm(DECK_TOP)], [mm(s * L), mm(TOWER.eavesY)], { w: W.thin });
  v.center([0, mm(PAD_BOTTOM - 0.3)], [0, mm(TOWER.height + 0.5)]);
  // the chain of levels, right of the tower
  const right = mm(L + legHalf);
  const chain: [number, number, ReturnType<typeof mL>][] = [
    [0, DECK_Y0, mL(DECK_Y0, '*')],
    [DECK_Y0, STACK_TOP_Y0, fig('stackSize')],
    [STACK_TOP_Y0, SADDLE_Y0, mL(SADDLE_Y0 - STACK_TOP_Y0, '*')],
    [SADDLE_Y0, SADDLE_Y0 + STROKE, l('20 m', '20 m')],
    [SADDLE_Y0 + STROKE, DECK_TOP, l('0,83 m', '0.83 m')],
    [DECK_TOP, TOWER.height, mL(TOWER.height - DECK_TOP, '*')],
  ];
  for (const [a, b, label] of chain) v.dim([right, mm(a)], [right, mm(b)], 8, { dir: 'v', label, size: 1.9 });
  // overall, pad, plan width
  v.dim([mm(-L - legHalf), 0], [mm(-L - legHalf), mm(TOWER.height)], -22, { dir: 'v', label: fig('towerM') });
  v.dim([mm(-PAD.side / 2), mm(PAD_BOTTOM)], [mm(-PAD.side / 2), mm(PAD_TOP)], -5, {
    dir: 'v',
    label: fig('padDepth'),
    size: 1.8,
  });
  // the kilowatt-hour ruler, drawn beside the stroke
  const ru = mm(L + 1.75);
  const zero = mm(SADDLE_Y0);
  v.line([ru, zero], [ru, zero + mm(STROKE)], { w: W.medium });
  for (let m2 = 0; m2 <= STROKE + 1e-6; m2 += 5) {
    v.line([ru, zero + mm(m2)], [ru + 500, zero + mm(m2)], { w: W.thin });
    v.text([ru + 700, zero + mm(m2)], numL((m2 * 1000 * FARM_WH_PER_M) / 1000, 0, ' Wh', '†'), {
      size: 1.75,
      baseline: 'middle',
    });
  }
}

/** What one metre of the stroke keeps, Wh: the sheet's ruler, from the dimension that the 3D ruler uses (100 Wh every `WH100_M` metres). */
const FARM_WH_PER_M = 100 / WH100_M;

function plan(d: Drawing): void {
  const v = d.view(218, 98, 1 / 50);
  const L = TOWER.legX;
  v.rect([mm(-PAD.side / 2), mm(-PAD.side / 2)], [mm(PAD.side / 2), mm(PAD.side / 2)], {
    w: W.medium,
    fill: FILL.concrete,
  });
  // lattice outline, shaft
  v.rect([mm(-L), mm(-L)], [mm(L), mm(L)], { w: W.thin, color: INK_2 });
  v.rect([mm(-TOWER.shaft / 2), mm(-TOWER.shaft / 2)], [mm(TOWER.shaft / 2), mm(TOWER.shaft / 2)], {
    w: W.thin,
    dash: 'hidden',
    color: INK_2,
  });
  // legs with their base plates
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const bp = TOWER.basePlate / 2;
      v.rect([mm(sx * L - bp), mm(sz * L - bp)], [mm(sx * L + bp), mm(sz * L + bp)], { w: W.thin, fill: PAPER });
      v.rect([mm(sx * L - legHalf), mm(sz * L - legHalf)], [mm(sx * L + legHalf), mm(sz * L + legHalf)], {
        w: W.medium,
        fill: FILL.steel,
      });
    }
  // rails with the blade towards the shaft
  for (const s of [-1, 1]) {
    v.rect([mm(s * RAIL.x), mm(-RAIL.footW / 2)], [mm(s * (RAIL.x + RAIL.footT)), mm(RAIL.footW / 2)], {
      w: W.medium,
      fill: FILL.copper,
    });
    v.rect([mm(s * (RAIL.x - RAIL.blade)), mm(-RAIL.bladeT / 2)], [mm(s * RAIL.x), mm(RAIL.bladeT / 2)], {
      w: W.medium,
      fill: FILL.copper,
    });
  }
  // the stack's footprint
  v.rect([mm(-STACK.width / 2), mm(-STACK.width / 2)], [mm(STACK.width / 2), mm(STACK.width / 2)], {
    w: W.medium,
    fill: FILL.concrete,
  });
  v.line([mm(-STACK.width / 2), 0], [mm(STACK.width / 2), 0], { w: W.thin });
  // ladder on the −Z face
  v.rect([mm(LADDER.x - LADDER.w / 2), mm(LADDER.z - 0.06)], [mm(LADDER.x + LADDER.w / 2), mm(LADDER.z + 0.06)], {
    w: W.medium,
    fill: PAPER,
  });
  // dimensions
  v.dim([mm(-PAD.side / 2), mm(PAD.side / 2)], [mm(PAD.side / 2), mm(PAD.side / 2)], -4, {
    dir: 'h',
    label: fig('padSide'),
  });
  v.dim([mm(-L), mm(-PAD.side / 2)], [mm(L), mm(-PAD.side / 2)], 4, { dir: 'h', label: fig('towerPlan') });
  v.dim([mm(-TOWER.shaft / 2), mm(-L)], [mm(TOWER.shaft / 2), mm(-L)], 12, { dir: 'h', label: fig('shaftClear') });
  v.dim([mm(PAD.side / 2), mm(-STACK.width / 2)], [mm(PAD.side / 2), mm(STACK.width / 2)], 4, {
    dir: 'v',
    label: l('1,6 m', '1.6 m'),
  });
}

export const towerSheet: DrawingSheet = {
  id: 'tower-elevation',
  number: 'PL-G02',
  group: 'tower',
  title: l('La tour : élévation et plan', 'The tower: elevation and plan'),
  description: l(
    'L’élévation au 1:125 montre le poids en bas de sa course, et en pointillé en haut. La chaîne de cotes additionne ce qui fait la hauteur : sur toute la tour, seuls les 20 m de course gardent de l’énergie, et la règle le dit en wattheures. Le plan au 1:50 montre les montants, les rails et le puits. La tour et son massif sont des estimations : ils ne sont pas calculés.',
    'The elevation at 1:125 shows the weight at the bottom of its stroke, and dotted at the top. The chain of dimensions adds up what makes the height: of the whole tower, only the 20 m of stroke keep any energy, and the ruler says so in watt-hours. The plan at 1:50 shows the legs, the rails and the shaft. The tower and its pad are estimates: they are not calculated.',
  ),
  scene: 'tower',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La tour : élévation et plan', 'The tower: elevation and plan'),
      subtitle: l(
        'Le poids en bas de sa course ; en pointillé, en haut',
        'The weight at the bottom of its stroke; dotted, at the top',
      ),
      number: 'PL-G02',
      scale: '1:125 · 1:50',
    });
    heading(d, 14, 14, cat(l('ÉLÉVATION', 'ELEVATION'), ' 1:125'));
    elevation(d);
    heading(d, 150, 14, cat(l('PLAN', 'PLAN'), ' 1:50'));
    plan(d);
    const x = 306;
    let y = 14;
    y = heading(d, x, y, l('PIÈCES ET PROFILS', 'PARTS AND SECTIONS'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Pièce', 'Part'), w: 58 },
        { label: l('Taille', 'Size'), w: 42, align: 'end', mono: true },
      ],
      [
        [l('Massif de fondation', 'Foundation pad'), fig('padM3')],
        [l('Montant, profil en H', 'Leg, H section'), cat(mmL(TOWER.legSide, '*'), ' mm')],
        [l('Platine', 'Base plate'), cat(mmL(TOWER.basePlate, '*'), ' mm')],
        [l('Panneaux', 'Panels'), numL(TOWER.panels, 0, '', '*')],
        [l('Hauteur d’un panneau', 'Height of a panel'), mL(PANEL_H, '*')],
        [l('Diagonale, cornière', 'Diagonal, an angle'), cat(mmL(TOWER.angleSide, '*'), ' mm')],
        [l('Rail : lame', 'Rail: blade'), cat(mmL(RAIL.blade, '*'), ' mm')],
        [l('Butée, hauteur', 'Buffer, height'), cat(mmL(BUFFER.h, '*'), ' mm')],
        [l('Échelle, largeur', 'Ladder, width'), cat(mmL(LADDER.w, '*'), ' mm')],
        [l('Règle, repère tous les', 'Ruler, a mark every'), mL(SCALE.band, '*')],
      ],
    );
    y += 3;
    y = heading(d, x, y, l('CE QUE FAIT LA HAUTEUR', 'WHAT MAKES THE HEIGHT'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Du sol jusqu’à', 'From the yard to'), w: 58 },
        { label: l('Niveau', 'Level'), w: 42, align: 'end', mono: true },
      ],
      [
        [l('Plateau, poids en bas', 'Deck, weight down'), mL(DECK_Y0, '*')],
        [l('Haut de la pile', 'Top of the stack'), mL(STACK_TOP_Y0, '*')],
        [l('Selle du crochet', 'Hook saddle'), mL(SADDLE_Y0, '*')],
        [l('La même, poids en haut', 'The same, weight up'), mL(SADDLE_Y0 + STROKE, '*')],
        [l('Plancher de tête', 'Head floor'), mL(DECK_TOP, '*')],
        [l('Faîtage', 'Ridge'), fig('towerM')],
      ],
    );
    y += 3;
    marksLegend(d, x, y, 100);
    note(
      d,
      150,
      190,
      146,
      lf(
        'Sur les {towerM} de la tour, seuls les 20 m de course gardent de l’énergie : {grossKwh} au sommet de la règle. Le reste sert à loger le poids, son crochet et le treuil. Ni les montants ni le massif ne sont calculés ; le modèle ne connaît pas la tour.',
        'Of the tower’s {towerM}, only the 20 m of stroke keep any energy: {grossKwh} at the top of the ruler. The rest houses the weight, its hook and the hoist. Neither the legs nor the pad are calculated; the model does not know the tower.',
      ),
      { size: 2 },
    );
    return d;
  },
};
