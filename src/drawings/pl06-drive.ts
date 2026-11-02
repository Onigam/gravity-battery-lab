import { COLORS, Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { chainAt, shaftsAt } from '../sim/chain';
import { FARM, FARM_MASS } from '../sim/machine';
import { radToRpm } from '../sim/mech';
import { DRUM_R, GEARS, HOIST } from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mm, mmL, note, RED } from './draw';

// PL-G06: the drive train, from the rope to the motor. The gears are drawn to scale from `GEARS` (an estimate: the maker does not publish them), one line of shafts from the motor's axis to the drum's. Speeds and torques come from `shaftsAt`.

export const ITEMS = [
  'hoist-motor',
  'motor-encoder',
  'service-brake',
  'hoist-gearbox',
  'rope-drum',
  'drum-brake',
] as const;

/** A shaft: its name, its speed and torque raising at full speed. */
export interface ShaftRow {
  name: L;
  rpm: number;
  torque: number;
}

export function shaftRows(): ShaftRow[] {
  const s = shaftsAt(FARM, FARM_MASS);
  const st = s.stages;
  return [
    { name: l('Tambour', 'Drum'), rpm: s.drum.rpm, torque: s.drum.torque },
    { name: l('Arbre lent', 'Slow shaft'), rpm: radToRpm(st[0]!.omegaOut), torque: st[0]!.torqueOut },
    { name: l('Arbre intermédiaire', 'Middle shaft'), rpm: radToRpm(st[1]!.omegaOut), torque: st[1]!.torqueOut },
    { name: l('Moteur', 'Motor'), rpm: s.motor.rpm, torque: s.motor.torque },
  ];
}

const nl = (v: number, digits: number, unit: string, unitEn = unit): L =>
  l(`${nFr(v, digits)}${unit}*`, `${nEn(v, digits)}${unitEn}*`);

/** Where the shafts stand from the drum's axis, m: the motor's at the maker's 420 mm, then each stage's centre distance, in `GEARS`. */
export const gearCentres = (): [number, number, number, number] => {
  const st = GEARS.stages;
  const c0 = HOIST.drumToMotor;
  const c1 = c0 - (st[0].pinion + st[0].wheel);
  const c2 = c1 - (st[1].pinion + st[1].wheel);
  return [c0, c1, c2, c2 - (st[2].pinion + st[2].wheel)];
};

function gears(d: Drawing): void {
  // the train seen along the shafts, 1:4. The stages, from the motor's pinion to the wheel on the drum, add up to the maker's 420 mm between the axes.
  const v = d.view(78, 82, 1 / 4);
  const st = GEARS.stages;
  // from the motor at the right, each stage's pinion and wheel
  const [c0, c1, c2, c3] = gearCentres();
  const wheel = (x: number, r: number, teeth: number, fill: string, lift = 0): void => {
    v.circle([mm(x), 0], mm(r), { w: W.medium, fill });
    v.circle([mm(x), 0], 6, { w: W.thin, fill: INK });
    v.text([mm(x), mm(r) + lift], `${teeth}*`, { size: 1.8, anchor: 'middle', mono: true, baseline: 'bottom' });
  };
  wheel(c3, st[2].wheel, st[2].teethW, '#eae6dd');
  wheel(c2, st[1].wheel, st[1].teethW, '#eae6dd');
  wheel(c2, st[2].pinion, st[2].teethP, FILL.copper);
  wheel(c1, st[0].wheel, st[0].teethW, '#eae6dd');
  wheel(c1, st[1].pinion, st[1].teethP, FILL.copper);
  wheel(c0, st[0].pinion, st[0].teethP, FILL.copper);
  v.center([mm(c3 - 0.2), 0], [mm(c0 + 0.08), 0]);
  // the drum, in phantom around its axis
  v.circle([mm(c3), 0], mm(DRUM_R), { w: W.thin, dash: 'phantom', color: INK_2 });
  v.dim([mm(c3), 0], [mm(c0), 0], 58, { dir: 'h', label: cat(mmL(HOIST.drumToMotor, ''), ' mm'), size: 2 });
  v.dim([mm(c3), 0], [mm(c2), 0], 50, { dir: 'h', label: cat(mmL(c2 - c3, '*'), ' mm'), size: 1.9 });
  v.dim([mm(c2), 0], [mm(c1), 0], 50, { dir: 'h', label: cat(mmL(c1 - c2, '*'), ' mm'), size: 1.9 });
  v.dim([mm(c1), 0], [mm(c0), 0], 50, { dir: 'h', label: cat(mmL(c0 - c1, '*'), ' mm'), size: 1.9 });
  // what each wheel is
  const p = d.paper();
  const name = (x: number, fr: string, en: string): void => {
    const at = v.map([mm(x), 0]);
    p.text([at[0], at[1] + 43], l(fr, en), { size: 2, weight: 'bold', anchor: 'middle', baseline: 'top', halo: true });
  };
  name(c3, 'tambour', 'drum');
  name(c2, 'arbre lent', 'slow shaft');
  name(c1, 'intermédiaire', 'middle shaft');
  name(c0, 'moteur', 'motor');
}

function line(d: Drawing): void {
  // the same drive read as a line, from the rope to the motor: where each brake acts, and which way the forces go
  const p = d.paper();
  const y = 182;
  const xs = [36, 92, 148, 204, 260];
  p.line([xs[0]!, y], [xs[4]!, y], { w: W.thick });
  const blk = (x: number, w: number, h: number, name: L, fill: string): void => {
    p.rect([x - w / 2, y - h / 2], [x + w / 2, y + h / 2], { w: W.medium, fill });
    p.text([x, y + h / 2 + 3], name, { size: 2, anchor: 'middle', weight: 'bold', baseline: 'top' });
  };
  blk(xs[0]!, 24, 22, l('Tambour', 'Drum'), FILL.steel);
  blk(xs[1]!, 12, 28, l('Frein de tambour', 'Drum brake'), '#c9c6bd');
  blk(xs[2]!, 28, 28, l('Réducteur', 'Gearbox'), '#d8e2ea');
  blk(xs[3]!, 12, 22, l('Frein de service', 'Service brake'), '#c9c6bd');
  blk(xs[4]!, 26, 20, l('Moteur et codeur', 'Motor and encoder'), '#d8e2ea');
  p.line([xs[0]! - 12, y + 11], [xs[0]! - 12, y + 26], { w: W.thick, color: COLORS.red });
  p.text([xs[0]! - 15, y + 26], l('câble', 'rope'), { size: 2, anchor: 'end', color: COLORS.red, baseline: 'middle' });
  // what each brake still holds if a shaft breaks between
  p.line([xs[1]! + 6, y - 22], [xs[3]! - 6, y - 22], { w: W.thin, color: RED });
  p.line([xs[2]!, y - 22], [xs[2]!, y - 14], { w: W.thin, color: RED });
  p.text(
    [xs[2]!, y - 25],
    l(
      'si un arbre casse ici, seul le frein de tambour tient la charge',
      'if a shaft breaks here, only the drum brake holds the load',
    ),
    {
      size: 2,
      anchor: 'middle',
      color: RED,
    },
  );
}

export const driveSheet: DrawingSheet = {
  id: 'drive-train',
  number: 'PL-G06',
  group: 'hoist',
  title: l('La transmission : vitesses et couples', 'The drive: speeds and torques'),
  description: l(
    'Les engrenages dessinés à l’échelle, de l’axe du moteur à celui du tambour : le constructeur publie seulement l’entraxe de 420 mm, et le rapport et les dents sont des estimations. Le tableau donne la vitesse et le couple de chaque arbre, selon le modèle, à pleine vitesse. La ligne du bas montre où agit chaque frein, et pourquoi il en faut deux.',
    'The gears drawn to scale, from the motor’s axis to the drum’s: the maker publishes only the 420 mm between centres, and the ratio and the teeth are estimates. The table gives the speed and the torque of each shaft, by the model, at full speed. The bottom line shows where each brake acts, and why two are needed.',
  ),
  scene: 'hoist',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La transmission : vitesses et couples', 'The drive: speeds and torques'),
      subtitle: l('Du moteur au tambour, à pleine vitesse', 'From the motor to the drum, at full speed'),
      number: 'PL-G06',
      scale: '1:4',
    });
    heading(d, 14, 14, cat(l('LE RÉDUCTEUR, DANS L’AXE DES ARBRES', 'THE GEARBOX, ALONG THE SHAFTS'), ' 1:4'));
    gears(d);
    heading(d, 14, 148, l('LA MÊME CHAÎNE, EN LIGNE', 'THE SAME CHAIN, AS A LINE'));
    line(d);
    const x = 282;
    let y = 14;
    y = heading(d, x, y, l('CHAQUE ARBRE, EN MONTÉE À PLEINE VITESSE', 'EACH SHAFT, CLIMBING AT FULL SPEED'));
    const rows = shaftRows();
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Arbre', 'Shaft'), w: 44 },
        { label: l('Vitesse', 'Speed'), w: 38, align: 'end', mono: true },
        { label: l('Couple', 'Torque'), w: 42, align: 'end', mono: true },
      ],
      rows.map((r) => [
        r.name,
        nl(r.rpm, r.rpm < 100 ? 1 : 0, ' tr/min', ' rpm'),
        nl(r.torque, r.torque < 100 ? 1 : 0, ' N·m'),
      ]),
    );
    y += 3;
    y = heading(d, x, y, l('LA CHAÎNE', 'THE CHAIN'));
    const up = chainAt(FARM, FARM_MASS, FARM.stroke / 2, FARM.vRated);
    const down = chainAt(FARM, FARM_MASS, FARM.stroke / 2, -FARM.vRated);
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Grandeur', 'Quantity'), w: 72 },
        { label: l('Valeur', 'Value'), w: 52, align: 'end', mono: true },
      ],
      [
        [l('Rapport du réducteur', 'Gearbox ratio'), fig('ratio')],
        [l('Étages', 'Stages'), fig('stages')],
        [l('Rendement par engrènement', 'Efficiency per mesh'), fig('meshEta')],
        [l('Rendement du réducteur', 'Efficiency of the gearbox'), fig('gearTotal')],
        [l('Diamètre du tambour', 'Drum diameter'), fig('drumM')],
        [l('Vitesse au crochet', 'Speed at the hook'), l('4 m/min', '4 m/min')],
        [l('Moteur', 'Motor'), l('15 kW, 28 A', '15 kW, 28 A')],
        [l('Couple moteur, en descente', 'Motor torque, coming down'), nl(down.motorTorque, 1, ' N·m')],
        [l('Puissance à l’arbre, en montée', 'Shaft power, climbing'), nl(up.shaft / 1000, 2, ' kW')],
        [l('Pertes des engrenages, en montée', 'Gear losses, climbing'), nl(up.gearMesh + up.gearDrag, 0, ' W')],
        [l('Freins, tant que le poids bouge', 'Brakes, as long as the weight moves'), fig('brakesW')],
      ],
    );
    y += 3;
    y = note(
      d,
      x,
      y,
      124,
      l(
        'Le couple moteur dépend de la vitesse du crochet et de celle du moteur, pas du diamètre du tambour : un autre tambour changerait les vitesses des arbres, aucune énergie.',
        'The motor’s torque depends on the hook’s speed and the motor’s own, not on the drum’s diameter: another drum would change the speeds of the shafts, and no energy.',
      ),
    );
    marksLegend(d, x, y, 124);
    return d;
  },
};
