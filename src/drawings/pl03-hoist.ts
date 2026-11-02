import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import {
  DRUM_R,
  DRUM_Z,
  FOOT_X,
  FRAME_FRONT,
  FRAME_REAR,
  GOVERNOR,
  HOIST,
  HOIST_REAR,
  HOIST_X,
  HOOK_BLOCK,
  MOTOR_Z,
  ROPE_R,
  PLATE_IN,
  TOWER,
  windingX,
  woundAt,
} from '../three/dims';
import { balloon, cat, fig, FILL, grid, heading, marksLegend, mm, mmL, note, PAPER } from './draw';
import { gearCentres } from './pl06-drive';

// PL-G03: the hoist on the head frame, in plan, front elevation and side view at 1:10 and 1:15. The maker's dimensions (no mark) are read from `HOIST`; what the maker does not publish is an estimate (*).

export const ITEMS = [
  'hoist-base',
  'hoist-motor',
  'motor-encoder',
  'service-brake',
  'hoist-gearbox',
  'rope-drum',
  'drum-brake',
  'rope-guide',
  'rope-anchor',
  'return-sheave',
  'overload-cell',
  'limit-switch',
  'overspeed-governor',
] as const;

const X = HOIST_X;
const STEEL = FILL.steel;
const BLUE = '#d8e2ea';
const HOLES_Z = [FRAME_FRONT + HOIST.holeFromFront, FRAME_FRONT + HOIST.holeFromFront + HOIST.holes] as const;
const ANCHOR = HOIST.anchorBeamZ;

function plan(d: Drawing): void {
  const v = d.view(114, 124, 1 / 10);
  // channels under the feet
  for (const x of FOOT_X)
    v.rect([mm(x - TOWER.channelW / 2), mm(FRAME_FRONT - 0.2)], [mm(x + TOWER.channelW / 2), mm(HOIST_REAR + 0.1)], {
      w: W.thin,
      dash: 'hidden',
      color: INK_2,
    });
  // the frame's plates, feet and cross-beams
  v.rect([mm(PLATE_IN[0] - HOIST.plateT), mm(FRAME_FRONT)], [mm(PLATE_IN[0]), mm(FRAME_REAR)], {
    w: W.medium,
    fill: BLUE,
  });
  v.rect([mm(PLATE_IN[1]), mm(FRAME_FRONT)], [mm(PLATE_IN[1] + HOIST.plateT), mm(FRAME_REAR)], {
    w: W.medium,
    fill: BLUE,
  });
  v.rect([mm(PLATE_IN[0]), mm(ANCHOR - HOIST.beamW / 2)], [mm(PLATE_IN[1]), mm(ANCHOR + HOIST.beamW / 2)], {
    w: W.thin,
    fill: BLUE,
  });
  // the gearbox at the left, along the motor's and the drum's axes
  v.rect([mm(X(0)), mm(DRUM_Z - HOIST.gearboxDrumR)], [mm(X(HOIST.gearboxEnd)), mm(MOTOR_Z + HOIST.gearboxMotorR)], {
    w: W.medium,
    fill: BLUE,
  });
  // the motor beside the drum, its brake, its fan hood, its encoder
  v.rect([mm(X(HOIST.gearboxEnd)), mm(MOTOR_Z - HOIST.motorR)], [mm(X(HOIST.motorEnd)), mm(MOTOR_Z + HOIST.motorR)], {
    w: W.medium,
    fill: BLUE,
  });
  v.rect([mm(X(HOIST.motorEnd)), mm(MOTOR_Z - HOIST.brakeR)], [mm(X(HOIST.brakeEnd)), mm(MOTOR_Z + HOIST.brakeR)], {
    w: W.medium,
    fill: '#c9c6bd',
  });
  v.rect([mm(X(HOIST.brakeEnd)), mm(MOTOR_Z - HOIST.motorR)], [mm(X(HOIST.hoodEnd)), mm(MOTOR_Z + HOIST.motorR)], {
    w: W.thin,
    fill: PAPER,
  });
  v.rect([mm(X(HOIST.hoodEnd)), mm(MOTOR_Z - 0.05)], [mm(X(HOIST.encoderEnd)), mm(MOTOR_Z + 0.05)], {
    w: W.medium,
    fill: STEEL,
  });
  v.center([mm(X(0)), mm(MOTOR_Z)], [mm(X(HOIST.encoderEnd)), mm(MOTOR_Z)]);
  // the drum, grooved, its flanges and its brake disc
  const dx0 = X(HOIST.gearboxEnd);
  const dx1 = PLATE_IN[1];
  v.rect([mm(dx0), mm(DRUM_Z - HOIST.barrelR)], [mm(dx1), mm(DRUM_Z + HOIST.barrelR)], { w: W.medium, fill: STEEL });
  const wound0 = windingX(woundAt(0));
  const wound1 = windingX(woundAt(20));
  for (let x = wound1; x <= wound0 + 1e-6; x += HOIST.ropePitch * 3)
    v.line([mm(x), mm(DRUM_Z - HOIST.barrelR)], [mm(x), mm(DRUM_Z + HOIST.barrelR)], { w: 0.1, color: INK_2 });
  v.center([mm(X(0)), mm(DRUM_Z)], [mm(dx1 + 0.05), mm(DRUM_Z)]);
  v.rect(
    [mm(X(HOIST.discAt)), mm(DRUM_Z - HOIST.discR)],
    [mm(X(HOIST.discAt) + HOIST.discT), mm(DRUM_Z + HOIST.discR)],
    { w: W.medium, fill: '#c9c6bd' },
  );
  // the holes: four, Ø34
  for (const x of FOOT_X)
    for (const z of HOLES_Z) v.circle([mm(x), mm(z)], mm(HOIST.hole / 2), { w: W.medium, fill: PAPER });
  // falls and sheaves on the plan: the two falls of the hook's sheave, the return sheave, the anchor
  const R = HOOK_BLOCK.sheaveR;
  const ax = -HOOK_BLOCK.sheaveX;
  const dot = mm(ROPE_R) * 1.6;
  for (const [fx, fz] of [
    [ax, R],
    [ax, -R],
    [-ax, -R],
    [-ax, R],
  ] as const)
    v.circle([mm(fx), mm(fz)], dot, { w: W.thin, color: COLORS.red, fill: COLORS.red });
  v.rect([mm(-HOOK_BLOCK.sheaveX), mm(-R - 0.03)], [mm(HOOK_BLOCK.sheaveX), mm(-R + 0.03)], {
    w: W.medium,
    fill: FILL.copper,
  });
  v.rect([mm(HOOK_BLOCK.sheaveX - 0.05), mm(ANCHOR - 0.05)], [mm(HOOK_BLOCK.sheaveX + 0.05), mm(ANCHOR + 0.05)], {
    w: W.medium,
    fill: FILL.copper,
  });
  // the governor, and the limit switch on the end of the drum
  v.circle([mm(GOVERNOR.x), mm(GOVERNOR.z)], mm(GOVERNOR.r), { w: W.medium, fill: PAPER });
  const lx = PLATE_IN[1] + HOIST.plateT;
  v.rect([mm(lx), mm(DRUM_Z - 0.06)], [mm(lx + 0.108), mm(DRUM_Z + 0.06)], { w: W.medium, fill: '#d8e2ea' });
  // dimensions, from the maker
  const top = mm(HOIST_REAR);
  const low = mm(FRAME_FRONT);
  v.dim([mm(X(0)), top], [mm(X(HOIST.e1)), top], -13, { dir: 'h', label: mmL(HOIST.e1, ''), size: 2 });
  v.dim([mm(X(0)), top], [mm(X(HOIST.e2)), top], -6, { dir: 'h', label: mmL(HOIST.e2, ''), size: 2 });
  v.dim([mm(FOOT_X[0]), low], [mm(FOOT_X[1]), low], 10, { dir: 'h', label: mmL(HOIST.e12, ''), size: 2 });
  v.dim([mm(X(0)), low], [mm(FOOT_X[0]), low], 10, { dir: 'h', label: mmL(HOIST.e7, ''), size: 2 });
  v.dim([mm(X(0)), mm(FRAME_FRONT)], [mm(X(0)), mm(HOIST_REAR)], -7, {
    dir: 'v',
    label: mmL(HOIST.overall, ''),
    size: 2,
  });
  v.dim([mm(X(0)), mm(FRAME_FRONT)], [mm(X(0)), mm(FRAME_REAR)], -15, {
    dir: 'v',
    label: mmL(HOIST.frameW, ''),
    size: 2,
  });
  v.dim([mm(X(HOIST.e1)), mm(DRUM_Z)], [mm(X(HOIST.e1)), mm(MOTOR_Z)], 5, {
    dir: 'v',
    label: mmL(HOIST.drumToMotor, ''),
    size: 2,
  });
  v.dim([mm(X(HOIST.e1)), mm(HOLES_Z[0])], [mm(X(HOIST.e1)), mm(HOLES_Z[1])], 14, {
    dir: 'v',
    label: mmL(HOIST.holes, ''),
    size: 2,
  });
  // balloons
  const m = (x: number, z: number): [number, number] => v.map([mm(x), mm(z)]);
  const put = (n: number, x: number, z: number, dx = 0, dy = 0): void => {
    const q = m(x, z);
    balloon(d, q[0] + dx, q[1] + dy, n);
  };
  put(1, X(HOIST.gearboxEnd + 0.5), FRAME_REAR - 0.04);
  put(2, X(0.75), MOTOR_Z);
  put(3, X(HOIST.encoderEnd), MOTOR_Z, 5, 0);
  put(4, X(HOIST.brakeEnd - 0.06), MOTOR_Z);
  put(5, X(0.25), MOTOR_Z - 0.22);
  put(6, X(1.2), DRUM_Z);
  put(7, X(HOIST.discAt), DRUM_Z - HOIST.discR, 0, 5);
  put(8, windingX(woundAt(20)) + 0.1, DRUM_Z - HOIST.barrelR, 0, -3);
  put(9, lx + 0.054, DRUM_Z, 0, -8);
  put(10, 0, -R, 0, 6);
  put(11, HOOK_BLOCK.sheaveX, ANCHOR, 6, -1);
  put(12, GOVERNOR.x, GOVERNOR.z);
}

function front(d: Drawing): void {
  const v = d.view(114, 228, 1 / 10);
  // channels, feet level, frame
  v.line([mm(X(0) - 0.08), 0], [mm(X(HOIST.e1) + 0.08), 0], { w: W.medium });
  for (const x of FOOT_X)
    v.rect([mm(x - TOWER.channelW / 2), -mm(TOWER.channelD)], [mm(x + TOWER.channelW / 2), 0], {
      w: W.thin,
      fill: STEEL,
      hatch: 'steel',
    });
  v.rect([mm(PLATE_IN[0] - HOIST.plateT), 0], [mm(PLATE_IN[0]), mm(HOIST.height)], { w: W.medium, fill: BLUE });
  v.rect([mm(PLATE_IN[1]), 0], [mm(PLATE_IN[1] + HOIST.plateT), mm(HOIST.height)], { w: W.medium, fill: BLUE });
  // gearbox and drum
  v.rect(
    [mm(X(0)), mm(HOIST.axisY - HOIST.gearboxDrumR)],
    [mm(X(HOIST.gearboxEnd)), mm(HOIST.axisY + HOIST.gearboxDrumR)],
    { w: W.medium, fill: BLUE },
  );
  v.rect(
    [mm(X(HOIST.gearboxEnd)), mm(HOIST.axisY - HOIST.barrelR)],
    [mm(PLATE_IN[1]), mm(HOIST.axisY + HOIST.barrelR)],
    { w: W.medium, fill: STEEL },
  );
  v.center([mm(X(0)), mm(HOIST.axisY)], [mm(PLATE_IN[1] + 0.05), mm(HOIST.axisY)]);
  v.rect(
    [mm(X(HOIST.discAt)), mm(HOIST.axisY - HOIST.discR)],
    [mm(X(HOIST.discAt) + HOIST.discT), mm(HOIST.axisY + HOIST.discR)],
    { w: W.medium, fill: '#c9c6bd' },
  );
  // the rope goes down from the drum
  v.line([mm(windingX(woundAt(0))), mm(HOIST.axisY)], [mm(windingX(woundAt(0))), -mm(0.18)], {
    w: W.medium,
    color: COLORS.red,
  });
  // dims
  v.dim([mm(X(HOIST.e1) + 0.03), 0], [mm(X(HOIST.e1) + 0.03), mm(HOIST.height)], 5, {
    dir: 'v',
    label: mmL(HOIST.height, ''),
    size: 2,
  });
  v.dim([mm(X(0)), 0], [mm(X(0)), mm(HOIST.axisY)], -5, { dir: 'v', label: mmL(HOIST.axisY, ''), size: 2 });
}

function side(d: Drawing): void {
  // looking along the drum, 1:15: the frame, the drum and the motor's axis, the gear stages between them
  const v = d.view(310, 165, 1 / 15);
  const ox = -FRAME_FRONT;
  const Z = (z: number): number => mm(z + ox);
  v.line([Z(FRAME_FRONT - 0.1), 0], [Z(HOIST_REAR + 0.1), 0], { w: W.medium });
  v.rect([Z(FRAME_FRONT), 0], [Z(FRAME_REAR), mm(HOIST.height)], { w: W.medium, fill: BLUE });
  v.circle([Z(DRUM_Z), mm(HOIST.axisY)], mm(DRUM_R), { w: W.medium, fill: STEEL });
  v.circle([Z(MOTOR_Z), mm(HOIST.axisY)], mm(HOIST.motorR), { w: W.medium, fill: PAPER });
  v.line([Z(DRUM_Z - DRUM_R), mm(HOIST.axisY)], [Z(DRUM_Z - DRUM_R), -mm(0.14)], { w: W.medium, color: COLORS.red });
  for (const c of gearCentres())
    v.circle([Z(DRUM_Z + c), mm(HOIST.axisY)], 12, { w: W.thin, color: INK_2, fill: INK_2 });
  v.dim([Z(FRAME_FRONT), mm(HOIST.height)], [Z(FRAME_REAR), mm(HOIST.height)], -4, {
    dir: 'h',
    label: mmL(HOIST.frameW, ''),
    size: 2,
  });
  v.dim([Z(FRAME_FRONT), 0], [Z(HOIST_REAR), 0], 6, { dir: 'h', label: mmL(HOIST.overall, ''), size: 2 });
  v.dim([Z(DRUM_Z), 0], [Z(MOTOR_Z), 0], 14, { dir: 'h', label: mmL(HOIST.drumToMotor, ''), size: 2 });
}

export const hoistSheet: DrawingSheet = {
  id: 'hoist-layout',
  number: 'PL-G03',
  group: 'hoist',
  title: l('Le treuil et le portique de tête', 'The hoist and the head frame'),
  description: l(
    'Le treuil en plan, de face et de côté. Les cotes sans marque sont celles que publie le constructeur du treuil de référence : longueur le long du tambour, écart des pieds, quatre trous de Ø34 pour des boulons M30. Le diamètre du tambour, le rapport et les poulies n’y sont pas : ce sont des estimations du lab. Les points rouges sont les brins du câble.',
    'The hoist in plan, from the front and from the side. Dimensions with no mark are those the maker of the reference hoist publishes: length along the drum, spacing of the feet, four Ø34 holes for M30 bolts. The drum’s diameter, the ratio and the sheaves are not among them: they are the lab’s estimates. The red dots are the falls of the rope.',
  ),
  scene: 'hoist',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le treuil et le portique de tête', 'The hoist and the head frame'),
      subtitle: l('Plan, face et côté, cotes en millimètres', 'Plan, front and side, dimensions in millimetres'),
      number: 'PL-G03',
      scale: '1:10 · 1:15',
    });
    heading(d, 14, 11, cat(l('PLAN', 'PLAN'), ' 1:10'));
    plan(d);
    heading(d, 14, 172, cat(l('FACE', 'FRONT'), ' 1:10'));
    front(d);
    heading(d, 300, 122, cat(l('CÔTÉ, DANS L’AXE DU TAMBOUR', 'SIDE, ALONG THE DRUM'), ' 1:15'));
    side(d);
    const x = 300;
    const names: [string, string][] = [
      ['Châssis du treuil', 'Hoist base'],
      ['Moteur-générateur', 'Motor-generator'],
      ['Codeur', 'Encoder'],
      ['Frein de service', 'Service brake'],
      ['Réducteur', 'Gearbox'],
      ['Tambour', 'Rope drum'],
      ['Frein de tambour', 'Drum brake'],
      ['Guide-câble', 'Rope guide'],
      ['Fin de course', 'Limit switch'],
      ['Poulie de renvoi', 'Return sheave'],
      ['Point fixe et limiteur de charge', 'Rope anchor and overload cell'],
      ['Limiteur de vitesse', 'Overspeed governor'],
    ];
    grid(
      d,
      x,
      14,
      [
        { label: l('N°', 'No.'), w: 8, align: 'middle' },
        { label: l('Pièce', 'Part'), w: 50 },
        { label: l('Taille', 'Size'), w: 48, align: 'end', mono: true },
      ],
      names.map(([fr, en], i) => [
        String(i + 1),
        l(fr, en),
        [
          l('1 321 kg', '1,321 kg'),
          l('15 kW', '15 kW'),
          cat(mmL(HOIST.encoderEnd - HOIST.hoodEnd, '*'), ' mm'),
          cat('Ø', mmL(2 * HOIST.brakeR, '*')),
          fig('ratio'),
          cat('Ø', mmL(2 * DRUM_R, '*')),
          cat('Ø', mmL(2 * HOIST.discR, '*')),
          cat(mmL(HOIST.ropePitch, '*'), ' mm'),
          l('2 niveaux', '2 levels'),
          cat('Ø', mmL(2 * HOOK_BLOCK.sheaveR, '*')),
          fig('overloadLoad'),
          cat('Ø', mmL(2 * GOVERNOR.r, '*')),
        ][i]!,
      ]),
      { size: 1.75, lineH: 2.7 },
    );
    const y = note(
      d,
      x,
      186,
      106,
      l(
        'Fixation : 4 × M30-8.8 dans des trous de Ø34. Un treuil n’est pas vendu pour ce service.',
        'Fixing: 4 × M30-8.8 in Ø34 holes. A hoist is not sold for this duty.',
      ),
      { size: 1.8 },
    );
    marksLegend(d, x, y, 106);
    return d;
  },
};
