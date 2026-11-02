import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { chainAt } from '../sim/chain';
import { FARM, FARM_MASS } from '../sim/machine';
import { fig, grid, heading, marksLegend, note, PAPER, RED } from './draw';

// PL-G07: the single-line diagram, with the power at each stage, both ways, from `chainAt`. A diagram, not a wiring plan: the ratings are estimates, and the regenerative supply is the lab's addition.

export const ITEMS = [
  'pv-inverter',
  'energy-meter',
  'ac-panel',
  'regen-supply',
  'dc-link',
  'motor-inverter',
  'brake-chopper',
  'brake-resistor',
  'motor-cable',
  'safety-controller',
  'emergency-stop',
  'control-ups',
  'battery-inverter',
  'lfp-module',
] as const;

const up = chainAt(FARM, FARM_MASS, FARM.stroke / 2, FARM.vRated);
const down = chainAt(FARM, FARM_MASS, FARM.stroke / 2, -FARM.vRated);

/** A power printed in kW, with the star of a model result. */
const kw = (w: number): L => l(`${nFr(Math.abs(w) / 1000, 2)} kW*`, `${nEn(Math.abs(w) / 1000, 2)} kW*`);

/** The power at each point of the line, raising and lowering at full speed, W: it adds up by construction. */
export const STAGES = {
  meter: [up.meter, down.meter],
  dcLinkIn: [up.dcLink, down.dcLink],
  motorIn: [up.motorElectric, down.motorElectric],
  shaft: [up.shaft, down.shaft],
  hook: [up.hook, down.hook],
} as const;

function diagram(d: Drawing): void {
  const p = d.paper();
  const Y = 96;
  const AC = COLORS.acL;
  const DC = COLORS.dcPos;
  const SIG = COLORS.signal;
  const dev = (x: number, y: number, w: number, h: number, fr: string, en: string): void => {
    p.rect([x - w / 2, y - h / 2], [x + w / 2, y + h / 2], { w: W.medium, fill: PAPER });
    const frs = fr.split('\n');
    const ens = en.split('\n');
    const n = Math.max(frs.length, ens.length);
    for (let i = 0; i < n; i++)
      p.text([x, y + (i - (n - 1) / 2) * 3], l(frs[i] ?? '', ens[i] ?? ''), {
        size: 2,
        anchor: 'middle',
        baseline: 'middle',
        weight: 'bold',
      });
  };
  const wire = (a: [number, number], b: [number, number], c: string, w: number = W.medium): void =>
    void p.line(a, b, { w, color: c });
  const tag = (x: number, y: number, t: L, anchor: 'start' | 'middle' | 'end' = 'middle'): void =>
    void p.text([x, y], t, { size: 1.8, color: RED, mono: true, anchor, baseline: 'middle' });

  // ---- the panel and its sources
  const xPanel = 70;
  dev(xPanel, Y, 30, 26, 'Tableau\ngénéral', 'Main\nAC panel');
  // roof, solar inverter
  dev(34, 40, 34, 13, 'Toit solaire', 'Solar roof');
  dev(34, 62, 34, 13, 'Onduleur\nsolaire', 'Solar\ninverter');
  wire([34, 46.5], [34, 55.5], DC);
  wire([34, 68.5], [34, 88], AC);
  wire([34, 88], [xPanel - 15, 88], AC);
  // grid
  dev(34, Y + 6, 28, 12, 'Réseau 400 V', 'Grid 400 V');
  wire([48, Y + 6], [xPanel - 15, Y + 6], AC);
  // house
  dev(34, Y + 28, 28, 12, 'Maison', 'House');
  wire([48, Y + 28], [xPanel - 8, Y + 28], AC);
  wire([xPanel - 8, Y + 13], [xPanel - 8, Y + 28], AC);
  // ---- the machine's line: meter, regen supply, link, inverter, cable, motor
  const xs = { meter: 112, supply: 150, link: 188, inv: 226, motor: 278 };
  dev(xs.meter, Y, 20, 16, 'Compteur\nd’énergie', 'Energy\nmeter');
  dev(xs.supply, Y, 26, 18, 'Alimentation\nréversible', 'Regenerative\nsupply');
  dev(xs.link, Y, 22, 18, 'Bus\ncontinu', 'DC\nlink');
  p.text([xs.supply, Y + 11], l('ajout du lab', 'the lab’s addition'), {
    size: 1.75,
    color: RED,
    anchor: 'middle',
    baseline: 'top',
  });
  dev(xs.inv, Y, 24, 18, 'Variateur\nde levage', 'Hoist\ninverter');
  p.circle([xs.motor, Y], 11, { w: W.medium, fill: PAPER });
  p.text([xs.motor, Y], 'M/G', { size: 2.4, weight: 'bold', anchor: 'middle', baseline: 'middle' });
  wire([xPanel + 15, Y], [xs.meter - 10, Y], AC);
  wire([xs.meter + 10, Y], [xs.supply - 13, Y], AC);
  wire([xs.supply + 13, Y], [xs.link - 11, Y], DC);
  wire([xs.link + 11, Y], [xs.inv - 12, Y], DC);
  wire([xs.inv + 12, Y], [xs.motor - 11, Y], AC);
  p.text([(xs.inv + xs.motor) / 2 + 1, Y + 3.5], fig('cableM'), { size: 1.8, anchor: 'middle', baseline: 'top' });
  p.text([(xs.inv + xs.motor) / 2 + 1, Y - 3], l('câble moteur', 'motor cable'), {
    size: 1.85,
    weight: 'bold',
    anchor: 'middle',
  });
  // the powers on the line, both ways
  const both = (x: number, a: number, b: number): void => {
    tag(x, Y - 20, l('↑', '↑'));
    tag(x, Y - 16, kw(a));
    tag(x, Y + 15, l('↓', '↓'));
    tag(x, Y + 19, kw(b));
  };
  both((xPanel + 15 + xs.meter - 10) / 2 + 8, up.meter, down.meter);
  both((xs.supply + 13 + xs.link - 11) / 2, up.dcLink, down.dcLink);
  both((xs.inv + 12 + xs.motor - 11) / 2, up.motorElectric, down.motorElectric);
  tag(xs.motor + 14, Y - 4, l('arbre ↑', 'shaft ↑'), 'start');
  tag(xs.motor + 14, Y, kw(up.shaft), 'start');
  tag(xs.motor + 14, Y + 4, l('arbre ↓', 'shaft ↓'), 'start');
  tag(xs.motor + 14, Y + 8, kw(down.shaft), 'start');
  // chopper and resistor off the link
  dev(xs.link, Y + 40, 24, 12, 'Hacheur', 'Chopper');
  dev(xs.link, Y + 62, 26, 12, 'Résistance', 'Resistor');
  wire([xs.link, Y + 9], [xs.link, Y + 34], DC);
  wire([xs.link, Y + 46], [xs.link, Y + 56], DC);
  p.text([xs.link + 15, Y + 40], fig('chopperV'), { size: 1.85, baseline: 'middle' });
  // battery inverter and module off the panel
  dev(xPanel + 34, Y + 42, 26, 13, 'Onduleur\nbatterie', 'Battery\ninverter');
  dev(xPanel + 34, Y + 64, 26, 13, 'Module LFP', 'LFP module');
  wire([xPanel, Y + 13], [xPanel, Y + 42], AC);
  wire([xPanel, Y + 42], [xPanel + 21, Y + 42], AC);
  wire([xPanel + 34, Y + 48.5], [xPanel + 34, Y + 57.5], DC);
  // ---- the safety chain, in a different line
  const yS = 30;
  dev(xs.inv + 2, yS, 30, 13, 'Automate\nde sécurité', 'Safety\ncontroller');
  dev(xs.link - 24, yS, 26, 13, 'Onduleur\nde contrôle', 'Control\nUPS');
  wire([xs.link - 11, yS], [xs.inv - 13, yS], SIG, W.thin);
  const inputs: [string, string][] = [
    ['Portail', 'Gate'],
    ['Arrêt d’urgence', 'Emergency stop'],
    ['Fins de course', 'Limit switches'],
    ['Limiteurs', 'Governor, cell'],
    ['Vent', 'Wind'],
  ];
  const bus = xs.inv + 24;
  inputs.forEach(([fr, en], i) => {
    const y = 17 + i * 6.5;
    p.text([bus + 12, y], l(fr, en), { size: 1.9, baseline: 'middle' });
    wire([bus, y], [bus + 11, y], SIG, W.thin);
  });
  wire([bus, 17], [bus, 17 + 4 * 6.5], SIG, W.thin);
  wire([xs.inv + 17, yS], [bus, yS], SIG, W.thin);
  wire([xs.inv + 2, yS + 6.5], [xs.inv + 2, Y - 9], SIG, W.thin);
  p.text([xs.inv + 4, (yS + Y) / 2 - 2], l('contacteur et freins', 'contactor and brakes'), {
    size: 1.8,
    color: SIG,
    baseline: 'middle',
  });
}

export const wiringSheet: DrawingSheet = {
  id: 'single-line',
  number: 'PL-G07',
  group: 'power-room',
  title: l('Le schéma électrique, dans les deux sens', 'The electrical diagram, both ways'),
  description: l(
    'Le courant dans l’ordre où il passe, du toit et du réseau jusqu’au moteur. Les chiffres en rouge sont les puissances à pleine vitesse, en montée et en descente, selon le modèle : à chaque étage il en manque un peu. L’alimentation réversible est un ajout du lab : le treuil publié a seulement un hacheur et une résistance. La chaîne de sécurité, à part, tient le contacteur et les freins. Ce schéma n’est pas un plan de câblage.',
    'The current in the order it passes, from the roof and the grid to the motor. The figures in red are the powers at full speed, climbing and coming down, by the model: at each stage a little is missing. The regenerative supply is the lab’s addition: the published hoist has only a chopper and a resistor. The safety chain, apart, holds the contactor and the brakes. This diagram is not a wiring plan.',
  ),
  scene: 'power-room',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le schéma électrique, dans les deux sens', 'The electrical diagram, both ways'),
      subtitle: l('Schéma unifilaire, à pleine vitesse', 'Single-line diagram, at full speed'),
      number: 'PL-G07',
      scale: '—',
    });
    heading(d, 14, 14, l('LE COURANT', 'THE CURRENT'));
    diagram(d);
    const x = 296;
    let y = 150;
    y = heading(
      d,
      14,
      186 - 2,
      l('CE QUI SE PERD À CHAQUE ÉTAGE, À PLEINE VITESSE', 'WHAT IS LOST AT EACH STAGE, AT FULL SPEED'),
    );
    const row = (fr: string, en: string, a: number, b: number): [L, L, L] => [
      l(fr, en),
      l(`${nFr(a, 0)} W*`, `${nEn(a, 0)} W*`),
      l(`${nFr(b, 0)} W*`, `${nEn(b, 0)} W*`),
    ];
    grid(
      d,
      14,
      y,
      [
        { label: l('Étage', 'Stage'), w: 120 },
        { label: l('Montée', 'Climbing'), w: 34, align: 'end', mono: true },
        { label: l('Descente', 'Coming down'), w: 34, align: 'end', mono: true },
      ],
      [
        row('Alimentation réversible', 'Regenerative supply', up.supply, down.supply),
        row('Variateur de levage', 'Hoist inverter', up.inverter, down.inverter),
        row('Câble moteur', 'Motor cable', up.cable, down.cable),
        row(
          'Ventilateur, freins, contrôle',
          'Fan, brakes, controls',
          up.fan + up.brakes + up.controls,
          down.fan + down.brakes + down.controls,
        ),
      ],
      { size: 1.8, lineH: 2.8 },
    );
    y = 156;
    y = note(
      d,
      x,
      y,
      110,
      l(
        'Au compteur, à pleine vitesse : la machine prend en montée, rend en descente. Les valeurs de ce schéma ne sont pas mesurées : elles viennent du modèle, avec ses hypothèses. Le bus continu reste chargé après la coupure.',
        'At the meter, at full speed: the machine takes when climbing and gives back when coming down. The values on this diagram are not measured: they come from the model, with its assumptions. The DC link stays charged after power-off.',
      ),
      { size: 1.85 },
    );
    y += 1;
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Grandeur', 'Quantity'), w: 72 },
        { label: l('Valeur', 'Value'), w: 38, align: 'end', mono: true },
      ],
      [
        [l('Bus continu, en service', 'DC link, in service'), fig('dcV')],
        [l('Le hacheur s’ouvre à', 'The chopper opens at'), fig('chopperV')],
        [l('Veille, variateur endormi', 'Standby, drive asleep'), fig('controlsW')],
        [l('Veille, variateur prêt', 'Standby, drive ready'), fig('readyW')],
        [l('Rien sous, au crochet', 'Nothing below, at the hook'), fig('cutInKw')],
        [l('Module LFP', 'LFP module'), l('4,8 kWh, 40 kg', '4.8 kWh, 40 kg')],
      ],
      { size: 1.8, lineH: 2.8 },
    );
    marksLegend(d, x, y + 2, 110);
    return d;
  },
};
