import { COLORS, Drawing, INK_2, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { MOTOR_CABLE_M, PAD, SHED, SITE, TOWER } from '../three/dims';
import { balloon, FILL, fig, grid, heading, marksLegend, mL, mm, note, PAPER } from './draw';

// PL-G01: the farm in plan, with the fall zone, the trench and the buildings, and a section that shows why the circle has that radius. Everything is read from `SITE`, `SHED`, `PAD` and `TOWER`.

/** Plan: X east, Z south; paper up is north. */
const P = (x: number, z: number): Pt => [mm(x), -mm(z)];
const SCALE = 1 / 500;

export const LAYOUT = { planX: 170, planY: 126, sectionX: 115, sectionY: 280 } as const;

export const ITEMS = [
  'machine-tower',
  'exclusion-fence',
  'interlocked-gate',
  'power-shed',
  'cable-trench',
  'grid-connection',
  'wind-mast',
  'block-yard',
  'barn-solar-roof',
  'farmhouse',
] as const;

function plan(d: Drawing): void {
  const v = d.view(LAYOUT.planX, LAYOUT.planY, SCALE);
  // the field
  v.rect(P(-78, -52), P(66, 34), { w: W.thin, fill: FILL.field, color: INK_2, dash: 'phantom' });
  // fall zone
  v.circle(P(0, 0), mm(SITE.fenceR), { w: W.medium, color: COLORS.accent, dash: 'hidden', fill: '#f8efe6' });
  // pad and tower
  v.rect(P(-PAD.side / 2, -PAD.side / 2), P(PAD.side / 2, PAD.side / 2), { w: W.thin, fill: FILL.concrete });
  v.rect(P(-TOWER.legX, -TOWER.legX), P(TOWER.legX, TOWER.legX), { w: W.thick, fill: FILL.steel });
  v.center(P(-8, 0), P(8, 0));
  v.center(P(0, -8), P(0, 8));
  // the trench, from the shed to the foot of the tower
  v.line(P(SHED.x + SHED.w / 2, SITE.trench.z), P(-TOWER.legX, SITE.trench.z), {
    w: W.thick,
    color: COLORS.acL,
    dash: 'hidden',
  });
  // shed
  v.rect(P(SHED.x - SHED.w / 2, SHED.z - SHED.d / 2), P(SHED.x + SHED.w / 2, SHED.z + SHED.d / 2), {
    w: W.medium,
    fill: FILL.roof,
  });
  // yard
  v.rect(
    P(SITE.yard.x - SITE.yard.w / 2, SITE.yard.z - SITE.yard.d / 2),
    P(SITE.yard.x + SITE.yard.w / 2, SITE.yard.z + SITE.yard.d / 2),
    {
      w: W.thin,
      fill: FILL.concrete,
    },
  );
  // the gate on the circle
  const a = SITE.gate.angle;
  const half = SITE.gate.w / 2 / SITE.fenceR;
  const on = (t: number): Pt => P(SITE.fenceR * Math.cos(t), SITE.fenceR * Math.sin(t));
  v.line(on(a - half), on(a + half), { w: W.thick, color: COLORS.red });
  // the mast
  v.circle(P(SITE.mast.x, SITE.mast.z), mm(0.7), { w: W.medium, fill: PAPER });
  // barn, its roof
  const b = SITE.barn;
  v.rect(P(b.x - b.len / 2, b.z - b.span / 2), P(b.x + b.len / 2, b.z + b.span / 2), { w: W.medium, fill: FILL.roof });
  v.line(P(b.x - b.len / 2, b.z), P(b.x + b.len / 2, b.z), { w: W.thin });
  // the house
  const h = SITE.house;
  v.rect(P(h.x - h.w / 2, h.z - h.d / 2), P(h.x + h.w / 2, h.z + h.d / 2), { w: W.medium, fill: FILL.roof });
  v.line(P(h.x - h.w / 2, h.z), P(h.x + h.w / 2, h.z), { w: W.thin });
  // the grid: the pole west of the shed, and the drop to its wall
  v.line(P(SITE.pole.x, SITE.pole.z), P(SHED.x - SHED.w / 2, SHED.z), { w: W.medium, color: COLORS.acN });
  v.circle(P(SITE.pole.x, SITE.pole.z), mm(0.5), { w: W.medium, fill: PAPER, color: COLORS.acN });
  // dimensions
  v.dim(P(0, 0), P(SITE.fenceR, 0), 0, { dir: 'h', label: fig('fenceM') });
  v.dim(P(-SHED.x + 2 * SHED.x, SHED.z + SHED.d / 2 + 2), P(0, SHED.z + SHED.d / 2 + 2), 6, {
    dir: 'h',
    label: mL(-SHED.x, '*'),
  });
  v.dim(P(b.x - b.len / 2, b.z - b.span / 2), P(b.x + b.len / 2, b.z - b.span / 2), -3, {
    dir: 'h',
    label: mL(b.len, '*'),
  });
  v.dim(P(b.x + b.len / 2, b.z - b.span / 2), P(b.x + b.len / 2, b.z + b.span / 2), 3, {
    dir: 'v',
    label: mL(b.span, '*'),
  });
  v.dim(P(h.x - h.w / 2, h.z - h.d / 2), P(h.x + h.w / 2, h.z - h.d / 2), -3, { dir: 'h', label: mL(h.w, '*') });
  v.dim(
    P(SITE.yard.x - SITE.yard.w / 2, SITE.yard.z + SITE.yard.d / 2),
    P(SITE.yard.x + SITE.yard.w / 2, SITE.yard.z + SITE.yard.d / 2),
    5,
    {
      dir: 'h',
      label: mL(SITE.yard.w, '*'),
    },
  );
  // balloons
  const at = (pt: Pt): Pt => v.map(pt);
  const put = (n: number, pt: Pt, dx = 0, dy = 0): void => {
    const q = at(pt);
    balloon(d, q[0] + dx, q[1] + dy, n);
  };
  put(1, P(0, 0), 6, -6);
  put(2, on(-Math.PI / 5), 3, -3);
  put(3, on(a), 0, 4.5);
  put(4, P(SHED.x, SHED.z), 0, -6);
  put(5, P(-18, SITE.trench.z), 0, -4);
  put(6, P(SITE.pole.x, SITE.pole.z), 0, 5);
  put(7, P(SITE.mast.x, SITE.mast.z), 4, 0);
  put(8, P(SITE.yard.x, SITE.yard.z));
  put(9, P(b.x, b.z));
  put(10, P(h.x, h.z));
  // north
  const n = at(P(58, 26));
  const p = d.paper();
  p.line([n[0], n[1] + 6], [n[0], n[1] - 3], { w: W.medium });
  p.polyline(
    [
      [n[0] - 1.4, n[1] - 1],
      [n[0], n[1] - 4],
      [n[0] + 1.4, n[1] - 1],
    ],
    { w: W.medium, fill: PAPER, closed: true },
  );
  p.text([n[0] + 2.5, n[1] - 3], 'N', { size: 2.4, weight: 'bold', baseline: 'middle' });
}

function section(d: Drawing): void {
  // the tower, and where it would land: why the fence has that radius
  const v = d.view(LAYOUT.sectionX, LAYOUT.sectionY, SCALE);
  v.line([-mm(45), 0], [mm(45), 0], { w: W.medium });
  v.rect([-mm(TOWER.legX), 0], [mm(TOWER.legX), mm(TOWER.height)], { w: W.medium, fill: FILL.steel });
  v.arc([mm(TOWER.legX), 0], mm(TOWER.height), 0, 90, { w: W.thin, color: COLORS.accent, dash: 'hidden' });
  v.line([mm(TOWER.legX), 0], [mm(TOWER.legX + TOWER.height), 0], { w: W.thick, color: COLORS.accent });
  v.line([-mm(SITE.fenceR), 0], [-mm(SITE.fenceR), mm(SITE.fenceH)], { w: W.medium, color: COLORS.accent });
  v.line([mm(SITE.fenceR), 0], [mm(SITE.fenceR), mm(SITE.fenceH)], { w: W.medium, color: COLORS.accent });
  v.rect([mm(SHED.x - SHED.w / 2), 0], [mm(SHED.x + SHED.w / 2), mm(SHED.h)], { w: W.medium, fill: FILL.roof });
  v.rect([mm(SITE.mast.x) - 150, 0], [mm(SITE.mast.x) + 150, mm(SITE.mast.h)], { w: W.thin, fill: FILL.steel });
  v.dim([mm(TOWER.legX), 0], [mm(TOWER.legX), mm(TOWER.height)], -13, { dir: 'v', label: fig('towerM') });
  v.dim([mm(SITE.mast.x), 0], [mm(SITE.mast.x), mm(SITE.mast.h)], 3, { dir: 'v', label: mL(SITE.mast.h, '*') });
  // what stands where
  const q = d.paper();
  const name = (x: number, fr: string, en: string): void => {
    const at = v.map([mm(x), 0]);
    q.text([at[0], at[1] + 3.5], l(fr, en), { size: 1.85, anchor: 'middle', baseline: 'top' });
  };
  name(SHED.x, 'local', 'shed');
  name(-SITE.fenceR, 'clôture', 'fence');
  name(0, 'tour', 'tower');
  name(TOWER.legX + TOWER.height / 2 + 1, 'où elle arriverait', 'where it would land');
}

export const sitePlan: DrawingSheet = {
  id: 'site-plan',
  number: 'PL-G01',
  group: 'site',
  title: l('La ferme : plan et zone de chute', 'The farm: plan and fall zone'),
  description: l(
    'Le plan de la ferme au 1:500, la tour au centre de sa zone de chute, le local, la tranchée et les bâtiments. La coupe montre pourquoi la clôture a ce rayon : c’est la hauteur de la tour, un choix du lab, car aucune règle n’a été trouvée. Toute la cour y est réservée pour un seul kilowattheure.',
    'The plan of the farm at 1:500, the tower at the centre of its fall zone, the shed, the trench and the buildings. The section shows why the fence has that radius: it is the height of the tower, a choice of the lab, as no rule could be found. The whole yard is set aside for a single kilowatt-hour.',
  ),
  scene: 'site',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La ferme : plan et zone de chute', 'The farm: plan and fall zone'),
      subtitle: l('Plan et coupe, à la même échelle', 'Plan and section, at the same scale'),
      number: 'PL-G01',
      scale: '1:500',
    });
    heading(d, 14, 14, l('PLAN', 'PLAN'));
    plan(d);
    heading(d, 14, 198, l('COUPE : SI LA TOUR TOMBAIT', 'SECTION: IF THE TOWER FELL'));
    section(d);
    const x = 322;
    const names: [string, string][] = [
      ['Tour de stockage', 'Storage tower'],
      ['Clôture de sécurité', 'Exclusion fence'],
      ['Portail asservi', 'Interlocked gate'],
      ['Local électrique', 'Power shed'],
      ['Tranchée de câbles', 'Cable trench'],
      ['Branchement au réseau', 'Grid connection'],
      ['Mât anémométrique', 'Wind mast'],
      ['Aire à blocs', 'Block yard'],
      ['Toit solaire de la grange', 'Barn solar roof'],
      ['Maison', 'Farmhouse'],
    ];
    grid(
      d,
      x,
      14,
      [
        { label: l('N°', 'No.'), w: 8, align: 'middle' },
        { label: l('Pièce', 'Part'), w: 76 },
      ],
      names.map(([fr, en], i) => [String(i + 1), l(fr, en)]),
    );
    let y = 74;
    y = heading(d, x, y, l('À RETENIR', 'WORTH KEEPING'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Grandeur', 'Quantity'), w: 52 },
        { label: l('Valeur', 'Value'), w: 32, align: 'end', mono: true },
      ],
      [
        [l('Rayon de la clôture', 'Radius of the fence'), fig('fenceM')],
        [l('Surface réservée', 'Area set aside'), fig('fenceArea')],
        [l('Hauteur de la tour', 'Height of the tower'), fig('towerM')],
        [l('Câble moteur en tout', 'Motor cable in all'), mL(MOTOR_CABLE_M, '*')],
        [l('Toit solaire', 'Solar roof'), fig('pvKwp')],
        [l('Énergie brute gardée', 'Gross energy kept'), fig('grossKwh')],
      ],
    );
    y = note(
      d,
      x,
      y + 3,
      84,
      l(
        'Plat, à dessein : ni colline ni lac, donc pas de pompage. Le rayon de la clôture est une hypothèse du lab. Le module de batterie du local garde plus de quatre fois ce que garde la tour.',
        'Flat, on purpose: no hill, no lake, so no pumped storage. The radius of the fence is the lab’s assumption. The battery module in the shed keeps more than four times what the tower keeps.',
      ),
    );
    marksLegend(d, x, y + 1, 84);
    return d;
  },
};
