import { COLORS, Drawing, INK, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { chainAt } from '../sim/chain';
import { FARM, FARM_MASS, SHEAVE_EFFICIENCY } from '../sim/machine';
import { reevingSumDown, reevingSumUp, ropeLength, staticTension } from '../sim/reeving';
import { HOOK_BLOCK, ROPE_DIAMETER, STROKE } from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mL, note, numL, PAPER, RED } from './draw';

// PL-G04: the reeving, as a diagram (not to scale). The tension of each fall is the model's (`chainAt`, `reevingSum…`), at mid-stroke: T₁ = F / Σ ηᵏ going up, Σ η⁻ᵏ going down. The speed of each fall is arithmetic.

export const ITEMS = ['hook-block', 'hoist-rope'] as const;

const MID = FARM.stroke / 2;
const V = FARM.vRated;

/** Tension of the falls 1 to 4 (drum to anchor) at full speed, N. */
export function fallTensions(up: boolean): number[] {
  const p = chainAt(FARM, FARM_MASS, MID, up ? V : -V);
  const sum = up ? reevingSumUp(FARM.falls, SHEAVE_EFFICIENCY) : reevingSumDown(FARM.falls, SHEAVE_EFFICIENCY);
  const first = p.force / sum;
  const step = up ? SHEAVE_EFFICIENCY : 1 / SHEAVE_EFFICIENCY;
  return [0, 1, 2, 3].map((k) => first * step ** k);
}

/** Speed of the rope in each fall when the hook moves at `v`, in units of the hook's speed: from the drum to the anchor. */
export const FALL_SPEED = [4, 2, 2, 0] as const;

function diagram(d: Drawing): void {
  const p = d.paper();
  const cx = 130;
  const yTop = 56;
  const yHook = 196;
  const f = [cx - 75, cx - 25, cx + 25, cx + 75];
  // head frame
  p.rect([f[0]! - 26, yTop - 34], [f[3]! + 26, yTop - 28], { w: W.medium, fill: FILL.steel, hatch: 'steel' });
  // drum over fall 1
  p.line([f[0]! - 13, yTop - 28], [f[0]! - 13, yTop - 2], { w: W.medium });
  p.circle([f[0]! - 13, yTop - 2], 13, { w: W.medium, fill: FILL.steel });
  p.text([f[0]! - 13, yTop - 2], l('tambour', 'drum'), {
    size: 2.1,
    anchor: 'middle',
    baseline: 'middle',
    weight: 'bold',
  });
  // return sheave between falls 2 and 3
  p.line([cx, yTop - 28], [cx, yTop], { w: W.medium });
  p.circle([cx, yTop], 25, { w: W.medium, fill: PAPER });
  p.circle([cx, yTop], 2, { w: W.thin, fill: INK });
  p.text([cx, yTop + 9], l('poulie de renvoi', 'return sheave'), { size: 2.1, anchor: 'middle', weight: 'bold' });
  // anchor over fall 4
  p.rect([f[3]! - 7, yTop - 28], [f[3]! + 7, yTop - 8], { w: W.medium, fill: FILL.copper });
  p.text([f[3]! + 9, yTop - 21], l('point fixe', 'anchor'), { size: 1.9, baseline: 'middle', weight: 'bold' });
  p.text([f[3]! + 9, yTop - 17], l('et limiteur', 'and overload'), { size: 1.9, baseline: 'middle', weight: 'bold' });
  p.text([f[3]! + 9, yTop - 13], l('de charge', 'cell'), { size: 1.9, baseline: 'middle', weight: 'bold' });
  // falls
  const yBottom = yHook;
  p.line([f[0]!, yTop - 2], [f[0]!, yBottom], { w: W.thick, color: COLORS.red });
  p.line([f[1]!, yTop], [f[1]!, yBottom], { w: W.thick, color: COLORS.red });
  p.line([f[2]!, yTop], [f[2]!, yBottom], { w: W.thick, color: COLORS.red });
  p.line([f[3]!, yTop - 8], [f[3]!, yBottom], { w: W.thick, color: COLORS.red });
  // hook block: two sheaves under the falls
  const r = (f[1]! - f[0]!) / 2;
  p.arc([f[0]! + r, yHook], r, 180, 360, { w: W.thick, color: COLORS.red });
  p.arc([f[2]! + r, yHook], r, 180, 360, { w: W.thick, color: COLORS.red });
  p.rect([f[0]! - 6, yHook + r + 2], [f[3]! + 6, yHook + r + 8], { w: W.medium, fill: FILL.steel });
  p.circle([f[0]! + r, yHook], 2, { w: W.thin, fill: INK });
  p.circle([f[2]! + r, yHook], 2, { w: W.thin, fill: INK });
  p.line([f[0]! + r, yHook], [f[0]! + r, yHook + r + 2], { w: W.thin });
  p.line([f[2]! + r, yHook], [f[2]! + r, yHook + r + 2], { w: W.thin });
  p.line([cx, yHook + r + 8], [cx, yHook + r + 16], { w: W.thick });
  p.text(
    [cx + 3, yHook + r + 14],
    l('crochet, puis le châssis et les blocs : 20 t', 'hook, then the carrier and the blocks: 20 t'),
    { size: 2.1, weight: 'bold', baseline: 'middle' },
  );
  p.text([cx, yHook + r + 5], l('moufle', 'hook block'), {
    size: 2.1,
    anchor: 'middle',
    baseline: 'middle',
    weight: 'bold',
  });
  // fall numbers and force labels
  const up = fallTensions(true);
  const down = fallTensions(false);
  const kn = (n: number): ReturnType<typeof l> => numL(n / 1000, 1, ' kN', '*');
  f.forEach((x, i) => {
    p.circle([x, 110], 3.4, { w: W.thin, fill: PAPER });
    p.text([x, 110], String(i + 1), { size: 2.4, weight: 'bold', anchor: 'middle', baseline: 'middle' });
    p.text([x + 3, 126], l('↑ monte', '↑ up'), { size: 1.7, color: INK_2, baseline: 'middle' });
    p.text([x + 3, 130], kn(up[i]!), { size: 2, mono: true, weight: 'bold', baseline: 'middle', color: RED });
    p.text([x + 3, 137], l('↓ descend', '↓ down'), { size: 1.7, color: INK_2, baseline: 'middle' });
    p.text([x + 3, 141], kn(down[i]!), { size: 2, mono: true, weight: 'bold', baseline: 'middle', color: RED });
  });
}

export const reevingSheet: DrawingSheet = {
  id: 'reeving',
  number: 'PL-G04',
  group: 'tower',
  title: l('Le mouflage et ses tensions', 'The reeving and its tensions'),
  description: l(
    'Un seul câble fait quatre brins : du tambour à la moufle, à la poulie de renvoi, à la moufle encore, puis au point fixe. Ce schéma n’est pas à l’échelle. Il donne la tension de chaque brin, à mi-course et à pleine vitesse, selon le modèle : le brin du tambour porte le plus en montant, celui du point fixe en descendant. Le tableau donne aussi la vitesse de chaque brin, du maximum côté tambour à zéro au point fixe.',
    'One rope makes four falls: from the drum to the hook block, to the return sheave, to the hook block again, then to the anchor. This diagram is not to scale. It gives the tension of each fall, at mid-stroke and full speed, by the model: the drum’s fall carries the most going up, the anchor’s going down. The table also gives the speed of each fall, from the fastest on the drum side to nothing at the anchor.',
  ),
  scene: 'tower',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le mouflage et ses tensions', 'The reeving and its tensions'),
      subtitle: l(
        'Schéma sans échelle, à mi-course et à pleine vitesse',
        'Diagram not to scale, at mid-stroke and full speed',
      ),
      number: 'PL-G04',
      scale: '—',
    });
    heading(d, 14, 14, l('QUATRE BRINS, TROIS POULIES', 'FOUR FALLS, THREE SHEAVES'));
    diagram(d);
    const x = 262;
    let y = 14;
    y = heading(d, x, y, l('CHAQUE BRIN', 'EACH FALL'));
    const up = fallTensions(true);
    const down = fallTensions(false);
    const speed = (k: number): ReturnType<typeof l> => numL(k * 4, 0, ' m/min', '†');
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Brin', 'Fall'), w: 10, align: 'middle' },
        { label: l('Montée', 'Up'), w: 28, align: 'end', mono: true },
        { label: l('Descente', 'Down'), w: 28, align: 'end', mono: true },
        { label: l('Vitesse du câble', 'Rope speed'), w: 30, align: 'end', mono: true },
        { label: l('Coefficient en montée', 'Factor going up'), w: 22, align: 'end', mono: true },
      ],
      [0, 1, 2, 3].map((i) => [
        String(i + 1),
        numL(up[i]! / 1000, 1, ' kN', '*'),
        numL(down[i]! / 1000, 1, ' kN', '*'),
        speed(FALL_SPEED[i]!),
        l(`${nFr(FARM.ropeFmin / up[i]!, 2)}*`, `${nEn(FARM.ropeFmin / up[i]!, 2)}*`),
      ]),
    );
    y += 3;
    y = heading(d, x, y, l('LE CÂBLE', 'THE ROPE'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Grandeur', 'Quantity'), w: 80 },
        { label: l('Valeur', 'Value'), w: 38, align: 'end', mono: true },
      ],
      [
        [l('Diamètre', 'Diameter'), cat(String(ROPE_DIAMETER * 1000), ' mm')],
        [l('Force de rupture minimale', 'Minimum breaking force'), l('315 kN', '315 kN')],
        [l('Coefficient minimal du constructeur', 'Maker’s minimum factor'), '5'],
        [
          l('Par brin, sans frottement', 'Per fall, no friction'),
          numL(staticTension(FARM_MASS, FARM.falls) / 1000, 0, ' kN', '†'),
        ],
        [l('Coefficient, sans frottement', 'Factor, no friction'), fig('ropeFactorStatic')],
        [l('Coefficient, brin le plus chargé', 'Factor, most loaded fall'), fig('ropeFactor')],
        [
          l('Longueur : 4 × 20 m, plus les tours gardés', 'Length: 4 × 20 m, plus the turns kept'),
          mL(ropeLength(FARM.falls, STROKE), '*'),
        ],
        [l('Masse', 'Mass'), fig('ropeKg')],
        [l('Câble levé, poids en bas', 'Rope lifted, weight down'), fig('ropeHangBottom')],
        [l('Câble levé, poids en haut', 'Rope lifted, weight up'), fig('ropeHangTop')],
        [l('Part de l’énergie d’une course', 'Share of a stroke’s energy'), fig('ropeEnergyPct')],
        [l('Diamètre des poulies, 18 × le câble', 'Sheave diameter, 18 × the rope'), mL(2 * HOOK_BLOCK.sheaveR, '*')],
        [l('Rendement d’une poulie', 'Efficiency of a sheave'), fig('sheaveEta')],
      ],
    );
    y += 3;
    y = note(
      d,
      x,
      y,
      118,
      l(
        'Quatre brins divisent la force par quatre, et multiplient par quatre la longueur à enrouler : le mouflage change la force et la vitesse, jamais l’énergie. Les poulies en prennent une petite part à chaque passage.',
        'Four falls divide the force by four, and multiply the length to wind by four: reeving changes the force and the speed, never the energy. The sheaves take a small share at each pass.',
      ),
    );
    marksLegend(d, x, y, 118);
    return d;
  },
};
