import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import {
  BLOCK,
  BUFFER,
  BUFFER_TOP,
  CARRIER,
  CROSSHEAD_TOP_Y0,
  CROSSHEAD_Y0,
  DECK_Y0,
  HALF_BLOCK,
  PAD_TOP,
  RAIL,
  RAIL_TIP,
  SADDLE_Y0,
  SAFETY,
  SHOE,
  STACK,
  STACK_TOP_Y0,
  TOWER,
} from '../three/dims';
import { CARRIER_MASS, FARM_MASS } from '../sim/machine';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, mmL, numL, PAPER } from './draw';

// PL-G05: the weight, from the buffers to the hook's saddle, at 1:25, with the plan at the level of the shoes and the details of a shoe and of the safety gear at 1:5. Layers as the 3D stacks them: two whole blocks a
// layer, a quarter turn each layer, the half blocks on top.

export const ITEMS = [
  'weight-carrier',
  'concrete-block',
  'stack-tie',
  'guide-shoe',
  'safety-gear',
  'guide-rail',
  'end-buffer',
] as const;

function elevation(d: Drawing): void {
  const v = d.view(95, 256, 1 / 25);
  const y0 = -PAD_TOP;
  const Y = (y: number): number => mm(y + y0);
  const half = CARRIER.deckSide / 2;
  // pad, buffers, deck
  v.line([mm(-1.45), Y(PAD_TOP)], [mm(1.45), Y(PAD_TOP)], { w: W.thick });
  for (const s of [-1, 1]) {
    v.rect([mm(s * BUFFER.x - BUFFER.r), Y(PAD_TOP)], [mm(s * BUFFER.x + BUFFER.r), Y(BUFFER_TOP)], {
      w: W.medium,
      fill: FILL.steel,
    });
  }
  v.rect([mm(-half), Y(BUFFER_TOP)], [mm(half), Y(DECK_Y0)], { w: W.medium, fill: '#e2cfc7' });
  // rails
  for (const s of [-1, 1]) {
    v.rect([mm(s * RAIL_TIP), Y(PAD_TOP)], [mm(s * RAIL.x), Y(CROSSHEAD_TOP_Y0 + 0.5)], {
      w: W.thin,
      fill: FILL.copper,
    });
  }
  // layers: whole, turned, whole, then the half blocks
  let y = DECK_Y0;
  const whole = STACK.blocks / 2;
  for (let i = 0; i < whole; i++) {
    const turned = i % 2 === 1;
    if (turned) {
      v.rect([mm(-BLOCK.width), Y(y)], [0, Y(y + BLOCK.height)], { w: W.medium, fill: FILL.concrete });
      v.rect([0, Y(y)], [mm(BLOCK.width), Y(y + BLOCK.height)], { w: W.medium, fill: FILL.concrete });
    } else {
      v.rect([mm(-BLOCK.length / 2), Y(y)], [mm(BLOCK.length / 2), Y(y + BLOCK.height)], {
        w: W.medium,
        fill: FILL.concrete,
      });
    }
    y += BLOCK.height;
  }
  v.rect([mm(-HALF_BLOCK.length / 2), Y(y)], [mm(HALF_BLOCK.length / 2), Y(y + HALF_BLOCK.height)], {
    w: W.medium,
    fill: FILL.concrete,
  });
  // uprights, crosshead, saddle
  for (const s of [-1, 1]) {
    v.rect(
      [mm(s * CARRIER.uprightX - CARRIER.uprightW / 2), Y(BUFFER_TOP)],
      [mm(s * CARRIER.uprightX + CARRIER.uprightW / 2), Y(CROSSHEAD_TOP_Y0)],
      { w: W.medium, fill: '#e2cfc7' },
    );
  }
  v.rect([mm(-CARRIER.uprightX), Y(CROSSHEAD_Y0)], [mm(CARRIER.uprightX), Y(CROSSHEAD_TOP_Y0)], {
    w: W.medium,
    fill: '#e2cfc7',
  });
  v.line([0, Y(CROSSHEAD_TOP_Y0)], [0, Y(SADDLE_Y0 + 0.3)], { w: W.thick, color: COLORS.red });
  // ties
  for (const s of [-1, 1])
    v.line(
      [mm((s * STACK.width) / 2 + s * 0.03), Y(DECK_Y0)],
      [mm((s * STACK.width) / 2 + s * 0.03), Y(STACK_TOP_Y0)],
      { w: W.medium, color: INK_2 },
    );
  // shoes and wedges on the rails
  const shoe = (yc: number, s: number): void => {
    v.rect([mm(s * (RAIL_TIP - 0.02)), Y(yc)], [mm(s * (RAIL_TIP + SHOE.w)), Y(yc + SHOE.h)], {
      w: W.thin,
      fill: FILL.steel,
    });
  };
  for (const s of [-1, 1]) {
    shoe(BUFFER_TOP, s);
    shoe(CROSSHEAD_TOP_Y0 - SHOE.h, s);
    v.rect(
      [mm(s * (RAIL_TIP - 0.02)), Y(SAFETY.shaftY - SAFETY.h / 2)],
      [mm(s * (RAIL_TIP + SAFETY.w)), Y(SAFETY.shaftY + SAFETY.h / 2)],
      { w: W.medium, fill: '#f0c9a8' },
    );
  }
  v.center([0, Y(PAD_TOP - 0.1)], [0, Y(SADDLE_Y0 + 0.4)]);
  // dims on the right
  const r = mm(RAIL.x + 0.1);
  const dim = (a: number, b: number, label: ReturnType<typeof mL>, off: number): void =>
    v.dim([r, Y(a)], [r, Y(b)], off, { dir: 'v', label, size: 1.95 });
  dim(PAD_TOP, BUFFER_TOP, cat(mmL(BUFFER.h, '*'), ' mm'), 4);
  dim(BUFFER_TOP, DECK_Y0, cat(mmL(CARRIER.h, '*'), ' mm'), 4);
  dim(DECK_Y0, DECK_Y0 + BLOCK.height, l('0,8 m', '0.8 m'), 4);
  dim(DECK_Y0 + 2 * BLOCK.height, DECK_Y0 + 3 * BLOCK.height, l('0,8 m', '0.8 m'), 4);
  dim(STACK_TOP_Y0 - HALF_BLOCK.height, STACK_TOP_Y0, l('0,4 m', '0.4 m'), 4);
  dim(DECK_Y0, STACK_TOP_Y0, fig('stackSize'), 16);
  v.dim([mm(-BLOCK.length / 2), Y(SADDLE_Y0 + 0.2)], [mm(BLOCK.length / 2), Y(SADDLE_Y0 + 0.2)], 0, {
    dir: 'h',
    label: l('1,6 m', '1.6 m'),
    size: 1.95,
  });
  v.dim([mm(-half), Y(BUFFER_TOP)], [mm(half), Y(BUFFER_TOP)], 7, { dir: 'h', label: mL(CARRIER.deckSide, '*') });
  // what is what, on the left
  const left = (x: number, y: number, dy: number, fr: string, en: string): void =>
    v.leader([mm(x), Y(y)], -(mm(x) * (1 / 25) + 62), dy, l(fr, en), { size: 1.9 });
  left(-RAIL_TIP, SAFETY.shaftY, 0, 'Parachute', 'Safety gear');
  left(-RAIL_TIP, CROSSHEAD_TOP_Y0 - SHOE.h / 2, 0, 'Patin', 'Guide shoe');
  left(-STACK.width / 2 - 0.03, DECK_Y0 + 1.2, 0, 'Tirant', 'Stack tie');
  left(-RAIL.x, DECK_Y0 + 2.2, 0, 'Rail', 'Guide rail');
  left(-BUFFER.x, PAD_TOP + BUFFER.h / 2, 0, 'Butée', 'Buffer');
}

function planView(d: Drawing): void {
  const v = d.view(222, 66, 1 / 25);
  const half = STACK.width / 2;
  v.rect([mm(-TOWER.shaft / 2), mm(-0.95)], [mm(TOWER.shaft / 2), mm(0.95)], {
    w: W.thin,
    dash: 'hidden',
    color: INK_2,
  });
  v.rect([mm(-half), mm(-half)], [mm(half), mm(half)], { w: W.medium, fill: FILL.concrete });
  v.line([mm(-half), 0], [mm(half), 0], { w: W.thin });
  for (const sx of [-1, 1]) {
    v.rect([mm(sx * RAIL_TIP), mm(-RAIL.bladeT / 2)], [mm(sx * RAIL.x), mm(RAIL.bladeT / 2)], {
      w: W.medium,
      fill: FILL.copper,
    });
    v.rect([mm(sx * RAIL.x), mm(-RAIL.footW / 2)], [mm(sx * (RAIL.x + RAIL.footT)), mm(RAIL.footW / 2)], {
      w: W.medium,
      fill: FILL.copper,
    });
    v.rect([mm(sx * (RAIL_TIP - 0.02)), mm(-SHOE.w / 2)], [mm(sx * (RAIL_TIP + 0.07)), mm(SHOE.w / 2)], {
      w: W.thin,
      fill: FILL.steel,
      opacity: 0.75,
    });
    for (const sz of [-1, 1])
      v.circle([mm(sx * (half + 0.03)), mm(sz * (half + 0.03))], 20, { w: W.medium, fill: PAPER });
  }
  v.dim([mm(-TOWER.shaft / 2), mm(-0.95)], [mm(TOWER.shaft / 2), mm(-0.95)], 5, { dir: 'h', label: fig('shaftClear') });
  v.dim([mm(-half), mm(half)], [mm(half), mm(half)], -3, { dir: 'h', label: l('1,6 m', '1.6 m') });
}

function shoeDetail(d: Drawing): void {
  // a shoe across the rail's blade, 1:2: the play is what this detail is about. Paper is X across the blade (Z of the machine), Y along it (X of the machine)
  const v = d.view(226, 170, 1 / 2);
  const bt = RAIL.bladeT / 2;
  const slot = SHOE.slot / 2;
  const liner = SHOE.liner;
  v.rect([mm(-bt), 0], [mm(bt), mm(RAIL.blade)], { w: W.medium, fill: FILL.copper, hatch: 'steel' });
  v.rect([mm(-slot - liner), mm(0.0)], [mm(-slot), mm(RAIL.blade * 0.7)], { w: W.medium, fill: '#f3dfb4' });
  v.rect([mm(slot), 0], [mm(slot + liner), mm(RAIL.blade * 0.7)], { w: W.medium, fill: '#f3dfb4' });
  v.rect([mm(-SHOE.w / 2), mm(RAIL.blade * 0.7)], [mm(SHOE.w / 2), mm(RAIL.blade * 0.7 + 0.024)], {
    w: W.medium,
    fill: FILL.steel,
  });
  v.rect([mm(-SHOE.w / 2), -mm(0.016)], [mm(-slot - liner), mm(RAIL.blade * 0.7 + 0.024)], {
    w: W.thin,
    fill: FILL.steel,
  });
  v.rect([mm(slot + liner), -mm(0.016)], [mm(SHOE.w / 2), mm(RAIL.blade * 0.7 + 0.024)], {
    w: W.thin,
    fill: FILL.steel,
  });
  v.dim([mm(-bt), 0], [mm(bt), 0], 7, { dir: 'h', label: cat(mmL(RAIL.bladeT, '*'), ' mm'), size: 1.9 });
  v.dim([mm(-slot), 0], [mm(slot), 0], 13, { dir: 'h', label: cat(mmL(SHOE.slot, '*'), ' mm'), size: 1.9 });
  v.dim([mm(-SHOE.w / 2), -mm(0.016)], [mm(SHOE.w / 2), -mm(0.016)], 18, {
    dir: 'h',
    label: cat(mmL(SHOE.w, '*'), ' mm'),
    size: 1.9,
  });
  v.dim([mm(SHOE.w / 2), 0], [mm(SHOE.w / 2), mm(RAIL.blade)], 3, {
    dir: 'v',
    label: cat(mmL(RAIL.blade, '*'), ' mm'),
    size: 1.9,
  });
}

export const weightSheet: DrawingSheet = {
  id: 'weight-stack',
  number: 'PL-G05',
  group: 'tower',
  title: l('Le poids : blocs, châssis et parachute', 'The weight: blocks, carrier and safety gear'),
  description: l(
    'Le poids posé sur ses butées, au 1:25 : le plateau, trois couches de deux blocs tournées d’un quart de tour, puis deux demi-blocs, le cadre qui le tient et le crochet. Le plan montre la pile dans le puits, entre ses deux rails. Le détail d’un patin au 1:2 montre le jeu sur la lame. Les tailles des blocs sont publiées ; le châssis et ses patins sont des estimations.',
    'The weight resting on its buffers, at 1:25: the deck, three layers of two blocks turned a quarter turn, then two half blocks, the frame that holds it and the hook. The plan shows the stack in the shaft, between its two rails. The detail of a shoe at 1:2 shows the play on the blade. The sizes of the blocks are published; the carrier and its shoes are estimates.',
  ),
  scene: 'tower',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le poids : blocs, châssis et parachute', 'The weight: blocks, carrier and safety gear'),
      subtitle: l(
        'Poids posé sur ses butées, en bas de course',
        'The weight resting on its buffers, at the bottom of the stroke',
      ),
      number: 'PL-G05',
      scale: '1:25 · 1:2',
    });
    heading(d, 14, 14, cat(l('ÉLÉVATION', 'ELEVATION'), ' 1:25'));
    elevation(d);
    heading(d, 176, 14, cat(l('PLAN, AU NIVEAU DES PATINS', 'PLAN, AT THE SHOES'), ' 1:25'));
    planView(d);
    heading(d, 176, 116, cat(l('UN PATIN SUR SON RAIL', 'A SHOE ON ITS RAIL'), ' 1:2'));
    shoeDetail(d);
    const x = 288;
    let y = 14;
    y = heading(d, x, y, l('LES MASSES', 'THE MASSES'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Élément', 'Item'), w: 70 },
        { label: l('Masse', 'Mass'), w: 48, align: 'end', mono: true },
      ],
      [
        [l('Bloc entier, 6 ×', 'Whole block, 6 ×'), l('environ 2 400 kg', 'about 2,400 kg')],
        [l('Demi-bloc, 2 ×', 'Half block, 2 ×'), l('environ 1 200 kg', 'about 1,200 kg')],
        [l('La pile', 'The stack'), fig('stackT')],
        [l('Châssis, palonnier et moufle', 'Carrier, beam and hook block'), numL(CARRIER_MASS / 1000, 1, ' t', '*')],
        [{ t: l('Au crochet', 'At the hook'), bold: true }, numL(FARM_MASS / 1000, 0, ' t', '')],
      ],
    );
    y += 3;
    y = heading(d, x, y, l('LE BÉTON', 'THE CONCRETE'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Élément', 'Item'), w: 70 },
        { label: l('Taille', 'Size'), w: 48, align: 'end', mono: true },
      ],
      [
        [l('Bloc entier', 'Whole block'), l('1,6 × 0,8 × 0,8 m', '1.6 × 0.8 × 0.8 m')],
        [l('Demi-bloc', 'Half block'), l('1,6 × 0,8 × 0,4 m', '1.6 × 0.8 × 0.4 m')],
        [l('Un bloc entier', 'One whole block'), fig('blockM3')],
        [l('La pile', 'The stack'), fig('stackM3')],
        [l('Un bloc levé de 20 m', 'A block raised 20 m'), fig('blockWh')],
      ],
    );
    y += 3;
    y = heading(d, x, y, l('LE PARACHUTE', 'THE SAFETY GEAR'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Grandeur', 'Quantity'), w: 70 },
        { label: l('Valeur', 'Value'), w: 48, align: 'end', mono: true },
      ],
      [
        [l('Bloc de coins', 'Wedge block'), cat(mmL(SAFETY.h, '*'), ' mm')],
        [l('Course des coins', 'Travel of the wedges'), cat(mmL(SAFETY.wedgeTravel, '*'), ' mm')],
        [l('Le limiteur déclenche à', 'The governor trips at'), fig('governorMs')],
        [l('Délai avant morsure', 'Delay before the bite'), fig('governorDelayMs')],
        [l('Décélération', 'Deceleration'), fig('wedgeG')],
        [l('Vitesse atteinte', 'Speed reached'), fig('fallPeak')],
        [l('Hauteur perdue', 'Height lost'), fig('fallCm')],
        [l('Jeu du patin sur la lame', 'Play of a shoe on the blade'), fig('shoePlay')],
      ],
    );
    y += 3;
    marksLegend(d, x, y, 118);
    return d;
  },
};
