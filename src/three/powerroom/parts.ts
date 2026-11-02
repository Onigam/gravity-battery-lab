import * as THREE from 'three';
import { boltHead, emissive, glass, group, mesh, MAT } from '@onigam/lab-kit/three';
import { CABINET_PLINTH, DEVICE, ESTOP, MODULE, SHED, SHELF } from '../dims';
import { box, boxFromTo, cyl, rounded, sweep } from '../rig/shapes';

// The fourteen devices of the power room, each its own group in the frame of the room, on the back wall in the order the current flows: the roof's inverter, the meter, the main
// panel, the supply that can push back, the DC link, the hoist's inverter, the chopper and its resistor; the module and its inverter on their shelf at the right-hand end; the
// safety chain low on the left. No device carries writing: the names are the labels'. Conduits are drawn from each device to the tray along the wall, and each ends on its box
// (the test measures it); the lights and the coils answer the state in `scene.ts`.

export type PowerId =
  | 'pv-inverter'
  | 'energy-meter'
  | 'ac-panel'
  | 'regen-supply'
  | 'dc-link'
  | 'motor-inverter'
  | 'brake-chopper'
  | 'brake-resistor'
  | 'motor-cable'
  | 'safety-controller'
  | 'emergency-stop'
  | 'control-ups'
  | 'battery-inverter'
  | 'lfp-module';

export const POWER_PARTS: PowerId[] = [
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
];

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const TRAY_Y = SHED.h - 0.28;
const TRAY_Z = 0.12;

const paint = (color: number, roughness = 0.5) => new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness });

const M = {
  cabinet: paint(0xa9adae, 0.5),
  cabinetDark: paint(0x7d8285, 0.55),
  white: paint(0xbdbfbc, 0.5),
  graphite: paint(0x34373a, 0.55),
  steel: MAT.steel(),
  bright: MAT.inox(),
  copper: MAT.copperBright(),
  cable: new THREE.MeshStandardMaterial({ color: 0x1e2022, roughness: 0.75 }),
  conduit: paint(0x6d7174, 0.5),
  din: MAT.zinc(),
  redPaint: paint(0x8f2a20, 0.55),
  yellow: paint(0xb9860f, 0.55),
  black: MAT.printBlack(),
  grey: MAT.printGrey(),
  glassDark: paint(0x12161a, 0.2),
};

export interface PowerPieces {
  /** Lights that answer the state. */
  ledPv: THREE.MeshStandardMaterial;
  ledMeter: THREE.MeshStandardMaterial;
  ledRegen: THREE.MeshStandardMaterial;
  ledDc: THREE.MeshStandardMaterial;
  ledInv: THREE.MeshStandardMaterial;
  ledChopper: THREE.MeshStandardMaterial;
  coils: THREE.MeshStandardMaterial;
  ledUps: THREE.MeshStandardMaterial;
  ledSafetyOk: THREE.MeshStandardMaterial;
  ledSafetyStop: THREE.MeshStandardMaterial;
  ledBatInv: THREE.MeshStandardMaterial;
  socBars: THREE.MeshStandardMaterial[];
  /** The fans of the cabinets, turning with the current. */
  fans: THREE.Group[];
  /** Conduit ends, for the attachment tests: [device, point]. */
  landings: { id: PowerId; point: THREE.Vector3 }[];
  /** The paths of the current, in the room's frame, for "Flows". */
  paths: {
    grid: THREE.Vector3[];
    pv: THREE.Vector3[];
    house: THREE.Vector3[];
    drive: THREE.Vector3[];
    brake: THREE.Vector3[];
    battery: THREE.Vector3[];
  };
  /** Where the cable leaves the room, floor hatch. */
  hatch: THREE.Vector3;
}

/** A box on the back wall: the body and a door a little in front of it, with a seam round it, hinges on the left and a handle on the right. */
function enclosure(
  g: THREE.Group,
  d: { x: number; y: number; w: number; h: number; d: number },
  body: THREE.Material = M.cabinet,
  door: THREE.Material = M.cabinet,
): void {
  const { x, y, w, h, d: dp } = d;
  box(g, body, w, h, dp, x, y + h / 2, dp / 2);
  // the door: 8 mm in front, 8 mm smaller on each side, so that a dark seam reads
  box(g, door, w - 0.016, h - 0.016, 0.012, x, y + h / 2, dp + 0.006);
  box(g, M.black, w - 0.012, h - 0.012, 0.004, x, y + h / 2, dp + 0.001);
  for (const hy of [y + 0.12, y + h - 0.12]) box(g, M.steel, 0.012, 0.05, 0.016, x - w / 2 + 0.002, hy, dp + 0.004);
  box(g, M.black, 0.018, 0.09, 0.022, x + w / 2 - 0.04, y + h / 2, dp + 0.022);
}

/** Louvres on a door. */
function louvres(g: THREE.Group, x: number, y: number, z: number, w: number, n: number, step: number): void {
  for (let i = 0; i < n; i++) box(g, M.cabinetDark, w, 0.009, 0.006, x, y + i * step, z);
}

function lamp(g: THREE.Group, mat: THREE.Material, x: number, y: number, z: number, r = 0.011): THREE.Mesh {
  return cyl(g, mat, 'z', r, z, z + 0.008, x, y, 12);
}

/** A rigid conduit from a device to the tray, with a gland at the box and a bracket on the wall. Records its landing. */
function conduit(
  g: THREE.Group,
  pieces: PowerPieces,
  id: PowerId,
  pts: THREE.Vector3[],
  r = 0.014,
  mat: THREE.Material = M.conduit,
): void {
  g.add(mesh(sweep(rounded(pts, 0.05, 4), r, 8), mat));
  const end = pts[pts.length - 1];
  cyl(g, M.black, 'y', r + 0.008, end.y - 0.012, end.y + 0.012, end.x, end.z, 10);
  pieces.landings.push({ id, point: end.clone() });
}

export function buildPowerParts(roots: Record<PowerId, THREE.Group>): PowerPieces {
  const pieces: PowerPieces = {
    ledPv: emissive(0x53d36b, 0),
    ledMeter: emissive(0xff4030, 0),
    ledRegen: emissive(0x53d36b, 0),
    ledDc: emissive(0xff5a30, 0),
    ledInv: emissive(0x53d36b, 0),
    ledChopper: emissive(0xffb040, 0),
    coils: (() => {
      // dull metal when cold, only the glow is orange
      const m = emissive(0xff5a1e, 0);
      m.color.set(0x5d5a56);
      return m;
    })(),
    ledUps: emissive(0x53d36b, 2),
    ledSafetyOk: emissive(0x53d36b, 2),
    ledSafetyStop: emissive(0xff3020, 0),
    ledBatInv: emissive(0x53d36b, 0),
    socBars: [0, 1, 2, 3].map(() => emissive(0x53d36b, 0)),
    fans: [],
    landings: [],
    paths: { grid: [], pv: [], house: [], drive: [], brake: [], battery: [] },
    hatch: V(0, 0, 0),
  };
  const D = DEVICE;

  // ---- the roof's inverter: a white box with its fins, its isolator, a dark window
  {
    const g = roots['pv-inverter'];
    const d = D.pvInverter;
    enclosure(g, d, M.white, M.white);
    for (let i = 0; i < 9; i++)
      box(g, M.cabinetDark, 0.006, d.h * 0.8, 0.14, d.x + d.w / 2 + 0.006 + 0, d.y + d.h / 2, 0.07 + 0.001 * i);
    for (let i = 0; i < 9; i++)
      box(
        g,
        M.cabinetDark,
        0.012,
        d.h - 0.12,
        0.008,
        d.x - d.w / 2 - 0.006,
        d.y + 0.06 + ((d.h - 0.12) / 8) * i * 0 + (d.h - 0.12) / 2,
        0.03 + i * 0.018,
      );
    box(g, M.glassDark, d.w * 0.5, 0.1, 0.004, d.x, d.y + d.h - 0.17, d.d + 0.013);
    lamp(g, pieces.ledPv, d.x + d.w * 0.34, d.y + d.h - 0.17, d.d + 0.012);
    // the DC isolator: a rotary knob, red on yellow
    box(g, M.yellow, 0.08, 0.08, 0.008, d.x - d.w * 0.28, d.y + 0.13, d.d + 0.014);
    cyl(g, M.redPaint, 'z', 0.024, d.d + 0.018, d.d + 0.05, d.x - d.w * 0.28, d.y + 0.13, 12);
    // glands on its underside
    for (const s of [-1, 1]) cyl(g, M.black, 'y', 0.012, d.y - 0.022, d.y, d.x + s * 0.09, d.d / 2, 8);
  }

  // ---- the meter: a small grey housing, a dark window, a red lamp that blinks with the energy
  {
    const g = roots['energy-meter'];
    const d = D.energyMeter;
    box(g, M.black, d.w, d.h, d.d, d.x, d.y + d.h / 2, d.d / 2);
    box(g, M.grey, d.w - 0.02, d.h - 0.02, 0.012, d.x, d.y + d.h / 2, d.d + 0.006);
    const lens = mesh(new THREE.BoxGeometry(d.w - 0.07, 0.08, 0.004), M.glassDark, [
      d.x,
      d.y + d.h * 0.68,
      d.d + 0.014,
    ]);
    g.add(lens);
    lamp(g, pieces.ledMeter, d.x + 0.07, d.y + d.h * 0.42, d.d + 0.012, 0.009);
    box(g, M.grey, d.w - 0.06, 0.05, 0.006, d.x, d.y + d.h * 0.24, d.d + 0.012);
    const seal = cyl(g, M.bright, 'z', 0.006, d.d + 0.012, d.d + 0.02, d.x - 0.08, d.y + 0.04, 8);
    seal.castShadow = false;
  }

  // ---- the main panel: a shallow cabinet with a clear door, rails of breakers behind it, the main switch and the copper
  {
    const g = roots['ac-panel'];
    const d = D.acPanel;
    box(g, M.cabinet, d.w, d.h, d.d - 0.03, d.x, d.y + d.h / 2, (d.d - 0.03) / 2);
    // rails of breakers: each a little black block with its white toggle
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const y = d.y + 0.2 + r * 0.22;
      box(g, M.din, d.w - 0.1, 0.03, 0.01, d.x, y, d.d - 0.06);
      const n = 14 - (r === 0 ? 4 : 0);
      for (let i = 0; i < n; i++) {
        const x = d.x - (d.w - 0.14) / 2 + (i + 0.5) * ((d.w - 0.14) / 14);
        box(g, M.black, 0.036, 0.09, 0.05, x, y, d.d - 0.035);
        box(g, r === 3 && i < 4 ? M.redPaint : M.white, 0.014, 0.02, 0.012, x, y + 0.004, d.d - 0.006);
      }
    }
    // the busbars behind
    for (let i = 0; i < 3; i++)
      box(g, M.copper, d.w - 0.12, 0.012, 0.012, d.x, d.y + d.h - 0.12 - i * 0.03, d.d - 0.06);
    // the main switch
    box(g, M.yellow, 0.1, 0.1, 0.008, d.x + d.w / 2 - 0.1, d.y + d.h - 0.1, d.d - 0.012);
    cyl(g, M.redPaint, 'z', 0.03, d.d - 0.01, d.d + 0.025, d.x + d.w / 2 - 0.1, d.y + d.h - 0.1, 12);
    // the door: clear, a frame round it, a handle
    const pane = glass(0.16);
    box(g, pane, d.w - 0.02, d.h - 0.02, 0.006, d.x, d.y + d.h / 2, d.d + 0.004).castShadow = false;
    box(g, M.cabinetDark, d.w, 0.02, 0.012, d.x, d.y + 0.01, d.d);
    box(g, M.cabinetDark, d.w, 0.02, 0.012, d.x, d.y + d.h - 0.01, d.d);
    box(g, M.cabinetDark, 0.02, d.h, 0.012, d.x - d.w / 2 + 0.01, d.y + d.h / 2, d.d);
    box(g, M.cabinetDark, 0.02, d.h, 0.012, d.x + d.w / 2 - 0.01, d.y + d.h / 2, d.d);
    box(g, M.black, 0.018, 0.09, 0.02, d.x + d.w / 2 - 0.04, d.y + d.h / 2, d.d + 0.012);
  }

  // ---- the three cabinets of the drive, side by side on a plinth
  const plinth = CABINET_PLINTH;
  const fan = (g: THREE.Group, x: number, y: number, z: number, r = 0.075): THREE.Group => {
    const f = group('fan', [x, y, z]);
    f.userData.dynamic = true;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const blade = mesh(
        new THREE.BoxGeometry(0.03, r * 0.8, 0.004),
        M.black,
        [Math.sin(a) * r * 0.5, Math.cos(a) * r * 0.5, 0],
        [0.3, 0, -a],
      );
      f.add(blade);
    }
    g.add(f);
    pieces.fans.push(f);
    // the ring and its guard
    const ring = new THREE.TorusGeometry(r, 0.006, 6, 24);
    ring.translate(x, y, z + 0.004);
    g.add(mesh(ring, M.steel));
    box(g, M.steel, 2 * r, 0.004, 0.004, x, y, z + 0.012);
    box(g, M.steel, 0.004, 2 * r, 0.004, x, y, z + 0.012);
    return f;
  };
  // the regenerative supply: louvres, a fan, a panel of lamps; the link's bars come out of its top
  {
    const g = roots['regen-supply'];
    const d = D.regenSupply;
    box(g, M.graphite, d.w, plinth, d.d - 0.03, d.x, plinth / 2, (d.d - 0.03) / 2);
    enclosure(g, { ...d, y: plinth, h: d.h + d.y - plinth });
    const top = plinth + (d.h + d.y - plinth);
    louvres(g, d.x, plinth + 0.18, d.d + 0.014, d.w - 0.14, 12, 0.03);
    fan(g, d.x, top - 0.3, d.d + 0.012);
    lamp(g, pieces.ledRegen, d.x - d.w * 0.3, top - 0.1, d.d + 0.012);
    // a choke behind the door shows as a square boss
    box(g, M.cabinetDark, d.w * 0.5, 0.2, 0.012, d.x, plinth + 0.72, d.d + 0.014);
  }
  // the DC link: a window on the capacitors, the warning lamp that stays on while the link is charged, a yellow triangle (no writing)
  {
    const g = roots['dc-link'];
    const d = D.dcLink;
    box(g, M.graphite, d.w, plinth, d.d - 0.03, d.x, plinth / 2, (d.d - 0.03) / 2);
    enclosure(g, { ...d, y: plinth, h: d.h + d.y - plinth });
    const top = plinth + (d.h + d.y - plinth);
    // the row of capacitors, behind a clear window in the door
    const zFront = d.d + 0.012;
    box(g, M.black, d.w - 0.1, 0.62, 0.006, d.x, plinth + 0.62, zFront + 0.002);
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++) {
        const cx = d.x - 0.14 + c * 0.095;
        const cy = plinth + 0.42 + r * 0.2;
        const can = cyl(g, M.din, 'z', 0.034, zFront + 0.003, zFront + 0.022, cx, cy, 16);
        can.userData.cap = false;
        cyl(g, M.black, 'z', 0.018, zFront + 0.022, zFront + 0.024, cx, cy, 12);
      }
    const window = glass(0.16);
    box(g, window, d.w - 0.09, 0.64, 0.004, d.x, plinth + 0.62, zFront + 0.028).castShadow = false;
    // the warning: a triangle and the lamp
    const tri = new THREE.Shape();
    tri.moveTo(-0.05, -0.04);
    tri.lineTo(0.05, -0.04);
    tri.lineTo(0, 0.05);
    tri.closePath();
    const triG = new THREE.ExtrudeGeometry(tri, { depth: 0.004, bevelEnabled: false });
    triG.translate(d.x - 0.12, top - 0.17, zFront + 0.002);
    g.add(mesh(triG, M.yellow));
    lamp(g, pieces.ledDc, d.x + 0.04, top - 0.17, zFront + 0.002, 0.016);
    // the bars across, on top: a copper link to its two neighbours
    const yBar = top + 0.05;
    for (const dz of [0.12, 0.22]) {
      box(
        g,
        M.copper,
        D.motorInverter.x - D.regenSupply.x,
        0.012,
        0.03,
        (D.motorInverter.x + D.regenSupply.x) / 2,
        yBar,
        dz,
      );
      for (const x of [D.regenSupply.x, d.x, D.motorInverter.x]) box(g, M.copper, 0.03, 0.05, 0.03, x, top + 0.025, dz);
    }
    box(
      g,
      M.white,
      D.motorInverter.x - D.regenSupply.x + 0.1,
      0.012,
      0.2,
      (D.motorInverter.x + D.regenSupply.x) / 2,
      yBar + 0.03,
      0.17,
    );
    for (const x of [D.regenSupply.x - 0.05, D.motorInverter.x + 0.05])
      box(g, M.white, 0.012, 0.04, 0.2, x, yBar + 0.012, 0.17);
  }
  // the hoist's inverter: its fans, a panel with a dark window and a keypad, big terminals out of the bottom for the motor cable
  {
    const g = roots['motor-inverter'];
    const d = D.motorInverter;
    box(g, M.graphite, d.w, plinth, d.d - 0.03, d.x, plinth / 2, (d.d - 0.03) / 2);
    enclosure(g, { ...d, y: plinth, h: d.h + d.y - plinth });
    const top = plinth + (d.h + d.y - plinth);
    fan(g, d.x, plinth + 0.3, d.d + 0.012);
    louvres(g, d.x, plinth + 0.5, d.d + 0.014, d.w - 0.14, 8, 0.03);
    box(g, M.graphite, 0.22, 0.16, 0.012, d.x, top - 0.26, d.d + 0.016);
    box(g, M.glassDark, 0.17, 0.05, 0.004, d.x, top - 0.225, d.d + 0.023);
    for (let i = 0; i < 6; i++)
      box(
        g,
        M.grey,
        0.022,
        0.018,
        0.006,
        d.x - 0.06 + (i % 3) * 0.06,
        top - 0.28 - Math.floor(i / 3) * 0.03,
        d.d + 0.024,
      );
    lamp(g, pieces.ledInv, d.x + 0.18, top - 0.08, d.d + 0.012);
  }

  // ---- what is behind the cabinets' doors: under X-ray the steel skin goes, these stay (metal family; `scene.ts`)
  const inside = (id: PowerId, d: { x: number; d: number }, parts: 'supply' | 'link' | 'inverter') => {
    const g = roots[id];
    const z = d.d / 2;
    const y0 = plinth;
    // a heat sink up the back, its fins on the door's side
    box(g, MAT.aluDark(), 0.32, 0.5, 0.04, d.x, y0 + 0.45, 0.06);
    for (let i = 0; i < 8; i++) box(g, MAT.aluDark(), 0.006, 0.5, 0.05, d.x - 0.14 + i * 0.04, y0 + 0.45, 0.105);
    // the busbars from top to bottom
    for (const dx of [-0.12, 0, 0.12]) box(g, M.copper, 0.022, 1.24, 0.008, d.x + dx, y0 + 0.82, z + 0.09);
    if (parts === 'supply') {
      // the choke: a steel core, three copper coils
      box(g, MAT.laminations(), 0.34, 0.2, 0.09, d.x, y0 + 0.95, z);
      for (const dx of [-0.11, 0, 0.11])
        cyl(g, M.copper, 'x', 0.05, d.x + dx - 0.035, d.x + dx + 0.035, y0 + 0.95, z, 14);
    } else if (parts === 'link') {
      // the capacitors, rows of cans on the bars
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 3; c++)
          cyl(g, M.din, 'z', 0.032, z - 0.08, z + 0.06, d.x - 0.11 + c * 0.11, y0 + 0.32 + r * 0.19, 14);
    } else {
      // three power modules on the heat sink, the stack's capacitors above
      for (let i = 0; i < 3; i++) box(g, MAT.aluDark(), 0.09, 0.14, 0.03, d.x - 0.11 + i * 0.11, y0 + 0.45, 0.145);
      for (let c = 0; c < 3; c++) cyl(g, M.din, 'z', 0.03, z - 0.06, z + 0.06, d.x - 0.11 + c * 0.11, y0 + 0.92, 14);
    }
  };
  inside('regen-supply', D.regenSupply, 'supply');
  inside('dc-link', D.dcLink, 'link');
  inside('motor-inverter', D.motorInverter, 'inverter');

  // ---- the chopper on the wall: fins, a lamp; the resistor's cable on its side
  {
    const g = roots['brake-chopper'];
    const d = D.brakeChopper;
    enclosure(g, d, M.cabinet, M.cabinet);
    for (let i = 0; i < 6; i++)
      box(g, M.cabinetDark, d.w - 0.12, 0.012, 0.012, d.x, d.y + 0.12 + i * 0.05, d.d + 0.016);
    lamp(g, pieces.ledChopper, d.x + d.w * 0.3, d.y + d.h - 0.09, d.d + 0.012);
  }

  // ---- the resistor: an open steel cage on brackets, its coils inside that glow with the power it takes, a vent in the wall above
  {
    const g = roots['brake-resistor'];
    const d = D.brakeResistor;
    const frame = M.steel;
    const y0 = d.y;
    const y1 = d.y + d.h;
    const zf = d.d + 0.04;
    // brackets on the wall
    for (const s of [-1, 1])
      boxFromTo(
        g,
        frame,
        [d.x + s * (d.w / 2 - 0.04) - 0.012, y0 - 0.03, 0],
        [d.x + s * (d.w / 2 - 0.04) + 0.012, y0, zf],
      );
    // the cage's frame: edges
    for (const [x, z] of [
      [-1, 0.05],
      [1, 0.05],
      [-1, zf],
      [1, zf],
    ] as const)
      box(g, frame, 0.012, d.h, 0.012, d.x + (x * d.w) / 2, (y0 + y1) / 2, z);
    for (const y of [y0, y1]) {
      box(g, frame, d.w, 0.012, 0.012, d.x, y, zf);
      box(g, frame, d.w, 0.012, 0.012, d.x, y, 0.05);
      box(g, frame, 0.012, 0.012, zf - 0.05, d.x - d.w / 2, y, (0.05 + zf) / 2);
      box(g, frame, 0.012, 0.012, zf - 0.05, d.x + d.w / 2, y, (0.05 + zf) / 2);
    }
    // the wall of bars in front
    for (let i = 1; i < 12; i++) box(g, frame, 0.004, d.h, 0.004, d.x - d.w / 2 + (i * d.w) / 12, (y0 + y1) / 2, zf);
    // coils: long resistors from side to side, on insulators
    const coilMat = pieces.coils;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) {
        const y = y0 + 0.08 + r * 0.1;
        const z = 0.11 + c * 0.1;
        cyl(g, coilMat, 'x', 0.016, d.x - d.w / 2 + 0.04, d.x + d.w / 2 - 0.04, y, z, 8);
        cyl(g, M.white, 'x', 0.022, d.x - d.w / 2 + 0.012, d.x - d.w / 2 + 0.04, y, z, 8);
        cyl(g, M.white, 'x', 0.022, d.x + d.w / 2 - 0.04, d.x + d.w / 2 - 0.012, y, z, 8);
      }
    // the vent, in the wall above it
    box(g, M.cabinetDark, d.w * 0.7, 0.18, 0.012, d.x, y1 + 0.22, 0.009);
    for (let i = 0; i < 5; i++) box(g, M.black, d.w * 0.66, 0.012, 0.008, d.x, y1 + 0.15 + i * 0.035, 0.018);
  }

  // ---- the motor's cable: out of the inverter's bottom, along the plinth, down into a floor hatch
  {
    const g = roots['motor-cable'];
    const d = D.motorInverter;
    const hatch = V(d.x + 0.42, 0, 0.62);
    pieces.hatch = hatch;
    const start = V(d.x - 0.08, plinth + 0.1, d.d + 0.02);
    const pts = rounded(
      [
        start,
        V(d.x - 0.08, plinth + 0.02, d.d + 0.09),
        V(d.x + 0.05, 0.02, d.d + 0.16),
        V(hatch.x, 0.02, hatch.z - 0.05),
        V(hatch.x, -0.25, hatch.z),
      ],
      0.08,
      5,
    );
    g.add(mesh(sweep(pts, 0.0175, 8), M.cable));
    // a second, thinner: the brakes and the sensors
    const ptsB = pts.map((p) => p.clone().add(V(0.05, 0.002, 0.01)));
    g.add(mesh(sweep(ptsB, 0.008, 6), M.grey));
    // the cable's gland on the door's foot, the plate under it
    cyl(g, M.black, 'z', 0.026, d.d - 0.002, d.d + 0.04, start.x, start.y, 12);
    // the hatch: a steel frame on the slab, with the gap
    const hw = 0.28;
    boxFromTo(g, M.steel, [hatch.x - hw, 0, hatch.z - hw], [hatch.x + hw, 0.012, hatch.z - hw + 0.04]);
    boxFromTo(g, M.steel, [hatch.x - hw, 0, hatch.z + hw - 0.04], [hatch.x + hw, 0.012, hatch.z + hw]);
    boxFromTo(g, M.steel, [hatch.x - hw, 0, hatch.z - hw], [hatch.x - hw + 0.04, 0.012, hatch.z + hw]);
    boxFromTo(g, M.steel, [hatch.x + hw - 0.04, 0, hatch.z - hw], [hatch.x + hw, 0.012, hatch.z + hw]);
    boxFromTo(
      g,
      M.black,
      [hatch.x - hw + 0.04, 0, hatch.z - hw + 0.04],
      [hatch.x + hw - 0.04, 0.004, hatch.z + hw - 0.04],
    );
    pieces.landings.push({ id: 'motor-cable', point: start.clone() });
  }

  // ---- the safety controller: an open plate with its modules on a rail, each with its lamps, and the wires in a duct
  {
    const g = roots['safety-controller'];
    const d = D.safetyController;
    box(g, M.cabinetDark, d.w, d.h, 0.03, d.x, d.y + d.h / 2, 0.015);
    box(g, M.din, d.w - 0.04, 0.03, 0.012, d.x, d.y + d.h * 0.62, 0.036);
    for (let i = 0; i < 6; i++) {
      const x = d.x - d.w / 2 + 0.06 + i * 0.075;
      box(g, i === 0 ? M.graphite : M.white, 0.06, 0.16, 0.09, x, d.y + d.h * 0.62, 0.075);
      lamp(g, i % 3 === 2 ? pieces.ledSafetyStop : pieces.ledSafetyOk, x, d.y + d.h * 0.62 + 0.055, 0.12, 0.006);
      lamp(g, pieces.ledSafetyOk, x, d.y + d.h * 0.62 + 0.03, 0.12, 0.004);
    }
    box(g, M.grey, d.w - 0.04, 0.06, 0.04, d.x, d.y + d.h * 0.28, 0.05);
    box(g, M.grey, d.w - 0.04, 0.06, 0.04, d.x, d.y + d.h - 0.06, 0.05);
    for (let i = 0; i < 6; i++)
      box(
        g,
        i % 2 ? M.redPaint : MAT.cableBlue(),
        0.004,
        d.h * 0.2,
        0.004,
        d.x - d.w / 2 + 0.06 + i * 0.075,
        d.y + d.h * 0.42,
        0.06,
      );
  }

  // ---- the emergency stop: on the door's wall, a yellow box with its red mushroom
  {
    const g = roots['emergency-stop'];
    const x = SHED.w / 2;
    const z = ESTOP.z;
    const y = ESTOP.y;
    box(g, M.yellow, 0.04, 0.12, 0.09, x - 0.02, y, z);
    cyl(g, M.grey, 'x', 0.022, x - 0.04, x - 0.052, y, z, 16);
    cyl(g, M.redPaint, 'x', ESTOP.r, x - 0.052, x - 0.066, y, z, 20);
    cyl(g, M.redPaint, 'x', ESTOP.r + 0.008, x - 0.066, x - 0.08, y, z, 20, ESTOP.r - 0.008);
    // its conduit, up the wall to the tray
    const end = V(x - 0.016, y + 0.06, z);
    g.add(
      mesh(
        sweep(
          rounded([end, V(x - 0.016, TRAY_Y, z), V(x - 0.016, TRAY_Y, TRAY_Z), V(x - 0.12, TRAY_Y, TRAY_Z)], 0.05),
          0.008,
          6,
        ),
        M.conduit,
      ),
    );
    pieces.landings.push({ id: 'emergency-stop', point: end.clone() });
  }

  // ---- the control UPS: a tower on the floor, a lamp, a grid
  {
    const g = roots['control-ups'];
    const d = D.controlUps;
    box(g, M.graphite, d.w, d.h, d.d, d.x, d.y + d.h / 2, d.d / 2);
    box(g, M.black, d.w, d.y, d.d - 0.02, d.x, d.y / 2, d.d / 2);
    box(g, M.black, d.w - 0.05, 0.2, 0.004, d.x, d.y + 0.17, d.d + 0.002);
    for (let i = 0; i < 6; i++) box(g, M.grey, d.w - 0.08, 0.008, 0.002, d.x, d.y + 0.09 + i * 0.03, d.d + 0.005);
    lamp(g, pieces.ledUps, d.x, d.y + d.h - 0.1, d.d, 0.012);
    box(g, M.glassDark, d.w - 0.1, 0.05, 0.004, d.x, d.y + d.h - 0.17, d.d + 0.002);
  }

  // ---- the battery's inverter on the wall over the shelf
  {
    const g = roots['battery-inverter'];
    const d = D.batteryInverter;
    enclosure(g, d, M.white, M.white);
    for (let i = 0; i < 6; i++) box(g, M.cabinetDark, d.w - 0.12, 0.012, 0.01, d.x, d.y + 0.1 + i * 0.04, d.d + 0.015);
    lamp(g, pieces.ledBatInv, d.x, d.y + d.h - 0.09, d.d + 0.012);
  }

  // ---- the shelf and its module, 40 kg and 4.8 kWh: the same room as the machine that holds a quarter of it
  {
    const g = roots['lfp-module'];
    const s = SHELF;
    const yTop = s.y + s.t;
    // a steel rack against the wall, not a table: four angle uprights, a wooden shelf up here and a lower one with what a shed keeps
    const wood = paint(0x5f5344, 0.85);
    box(g, wood, s.w, s.t, s.d, s.x, s.y + s.t / 2, s.d / 2);
    const rackTop = s.y + 0.86;
    for (const dx of [-s.w / 2 + 0.02, s.w / 2 - 0.02])
      for (const dz of [0.02, s.d - 0.02]) {
        box(g, M.steel, 0.04, rackTop, 0.008, s.x + dx, rackTop / 2, dz);
        box(g, M.steel, 0.008, rackTop, 0.04, s.x + dx, rackTop / 2, dz);
      }
    for (const y of [s.y - 0.012, 0.13]) {
      box(g, M.steel, s.w, 0.024, 0.024, s.x, y, 0.02);
      box(g, M.steel, s.w, 0.024, 0.024, s.x, y, s.d - 0.02);
      for (const dx of [-s.w / 2 + 0.02, s.w / 2 - 0.02]) box(g, M.steel, 0.024, 0.024, s.d, s.x + dx, y, s.d / 2);
    }
    box(g, wood, s.w - 0.02, 0.025, s.d - 0.02, s.x, 0.155, s.d / 2);
    // on the lower shelf: a box of spares and a coil of cable
    box(g, M.grey, 0.34, 0.16, 0.26, s.x - 0.22, 0.25, 0.24);
    const coil = new THREE.TorusGeometry(0.1, 0.022, 8, 18);
    coil.rotateX(Math.PI / 2);
    coil.translate(s.x + 0.2, 0.19, 0.26);
    g.add(mesh(coil, M.cable));
    // the module itself, with the reported size. Black-and-white rack front, handles, terminals, four bars for the state of charge
    const m = MODULE;
    const x = s.x;
    const y = yTop;
    const zFront = 0.03 + m.d;
    box(g, M.white, m.w, m.h, m.d, x, y + m.h / 2, 0.03 + m.d / 2);
    box(g, M.graphite, m.w, m.h, 0.012, x, y + m.h / 2, zFront + 0.006);
    for (const s2 of [-1, 1]) {
      box(g, M.steel, 0.02, m.h - 0.03, 0.05, x + s2 * (m.w / 2 + 0.008), y + m.h / 2, zFront - 0.015);
      box(g, M.black, 0.024, 0.06, 0.018, x + s2 * (m.w / 2 + 0.018), y + m.h / 2, zFront + 0.018);
    }
    pieces.socBars.forEach((b, i) =>
      box(g, b, 0.03, 0.012, 0.004, x - 0.16 + i * 0.04, y + m.h - 0.035, zFront + 0.013),
    );
    box(g, M.redPaint, 0.03, 0.03, 0.012, x + 0.13, y + 0.05, zFront + 0.014);
    box(g, M.black, 0.03, 0.03, 0.012, x + 0.17, y + 0.05, zFront + 0.014);
    // the two battery leads, up to the inverter's belly
    const dB = D.batteryInverter;
    const leadTo = (col: THREE.Material, dx: number, tx: number) =>
      g.add(
        mesh(
          sweep(
            rounded(
              [
                V(x + dx, y + 0.05, zFront + 0.02),
                V(x + dx, y + 0.05, zFront + 0.08),
                V(x + dx, y + m.h + 0.03, zFront + 0.08),
                V(tx, dB.y - 0.03, dB.d - 0.06),
                V(tx, dB.y + 0.005, dB.d - 0.06),
              ],
              0.04,
            ),
            0.008,
            6,
          ),
          col,
        ),
      );
    leadTo(M.redPaint, 0.13, dB.x + 0.06);
    leadTo(M.cable, 0.17, dB.x + 0.12);
    pieces.landings.push({ id: 'lfp-module', point: V(x + 0.13, y + 0.05, zFront + 0.02) });
  }

  // ---- the tray along the wall and the conduits from it (the tray itself is scenery: it is in scene.ts)
  const top = (d: { y: number; h: number }) => d.y + d.h;
  const cabinetTop = D.regenSupply.y + D.regenSupply.h;
  conduit(
    roots['pv-inverter'],
    pieces,
    'pv-inverter',
    [V(D.pvInverter.x, TRAY_Y, TRAY_Z), V(D.pvInverter.x, top(D.pvInverter), TRAY_Z)],
    0.016,
  );
  conduit(roots['energy-meter'], pieces, 'energy-meter', [
    V(D.energyMeter.x, TRAY_Y, TRAY_Z),
    V(D.energyMeter.x, top(D.energyMeter), 0.06),
  ]);
  conduit(
    roots['ac-panel'],
    pieces,
    'ac-panel',
    [V(D.acPanel.x - 0.15, TRAY_Y, TRAY_Z), V(D.acPanel.x - 0.15, top(D.acPanel), TRAY_Z)],
    0.02,
  );
  conduit(
    roots['ac-panel'],
    pieces,
    'ac-panel',
    [V(D.acPanel.x + 0.15, TRAY_Y, TRAY_Z), V(D.acPanel.x + 0.15, top(D.acPanel), TRAY_Z)],
    0.02,
  );
  conduit(
    roots['regen-supply'],
    pieces,
    'regen-supply',
    [V(D.regenSupply.x - 0.2, TRAY_Y, TRAY_Z), V(D.regenSupply.x - 0.2, cabinetTop, TRAY_Z)],
    0.02,
  );
  conduit(roots['brake-chopper'], pieces, 'brake-chopper', [
    V(D.brakeChopper.x, TRAY_Y, TRAY_Z),
    V(D.brakeChopper.x, top(D.brakeChopper), TRAY_Z),
  ]);
  // chopper to resistor: a short cable, side by side
  const dC = D.brakeChopper;
  const dR = D.brakeResistor;
  roots['brake-resistor'].add(
    mesh(
      sweep(
        rounded(
          [
            V(dC.x + dC.w / 2, dC.y + 0.3, 0.12),
            V(dR.x - dR.w / 2 - 0.04, dC.y + 0.3, 0.12),
            V(dR.x - dR.w / 2 + 0.012, dR.y + 0.08, 0.11),
          ],
          0.05,
        ),
        0.012,
        8,
      ),
      M.cable,
    ),
  );
  pieces.landings.push({ id: 'brake-resistor', point: V(dR.x - dR.w / 2 + 0.012, dR.y + 0.08, 0.11) });
  conduit(
    roots['safety-controller'],
    pieces,
    'safety-controller',
    [
      V(D.safetyController.x - 0.16, TRAY_Y, TRAY_Z),
      V(D.safetyController.x - 0.32, 1.2, 0.03),
      V(D.safetyController.x - 0.16, top(D.safetyController), 0.05),
    ],
    0.009,
  );
  conduit(
    roots['control-ups'],
    pieces,
    'control-ups',
    [V(D.controlUps.x, TRAY_Y, TRAY_Z), V(D.controlUps.x - 0.3, 1.2, 0.03), V(D.controlUps.x, top(D.controlUps), 0.05)],
    0.009,
  );
  // the battery's inverter: its conduit goes down between the chopper and the resistor
  const xB = (dC.x + dC.w / 2 + (dR.x - dR.w / 2)) / 2;
  conduit(roots['battery-inverter'], pieces, 'battery-inverter', [
    V(xB, TRAY_Y, TRAY_Z),
    V(xB, D.batteryInverter.y + D.batteryInverter.h + 0.04, TRAY_Z),
    V(D.batteryInverter.x - 0.1, D.batteryInverter.y + D.batteryInverter.h + 0.04, 0.1),
    V(D.batteryInverter.x - 0.1, top(D.batteryInverter), 0.1),
  ]);

  // ---- bolts of the wall plates
  for (const [id, d] of [
    ['pv-inverter', D.pvInverter],
    ['brake-chopper', D.brakeChopper],
    ['battery-inverter', D.batteryInverter],
  ] as const) {
    for (const sx of [-1, 1]) {
      const n = boltHead(0.01, 0.006, M.steel);
      n.rotation.x = Math.PI / 2;
      n.position.set(d.x + sx * (d.w / 2 + 0.03), d.y + d.h - 0.03, 0.002);
      roots[id].add(n);
      box(roots[id], M.steel, 0.05, 0.03, 0.004, d.x + sx * (d.w / 2 + 0.012), d.y + d.h - 0.03, 0.002);
    }
  }

  // ---- the flows: where the current goes, in the room's frame
  const zPath = TRAY_Z;
  const yT = TRAY_Y;
  const down = (x: number, y: number) => [V(x, yT, zPath), V(x, y, zPath), V(x, yT, zPath)];
  pieces.paths.grid = [
    V(-SHED.w / 2, yT, zPath),
    ...down(D.energyMeter.x, D.energyMeter.y + 0.15),
    V(D.acPanel.x - 0.15, yT, zPath),
    V(D.acPanel.x - 0.15, D.acPanel.y + D.acPanel.h - 0.2, zPath),
  ];
  pieces.paths.pv = [
    V(D.pvInverter.x, SHED.h, zPath),
    V(D.pvInverter.x, D.pvInverter.y + 0.3, zPath),
    V(D.pvInverter.x, yT, zPath),
    V(D.acPanel.x - 0.15, yT, zPath),
    V(D.acPanel.x - 0.15, D.acPanel.y + D.acPanel.h - 0.2, zPath),
  ];
  pieces.paths.house = [
    V(D.acPanel.x - 0.15, D.acPanel.y + D.acPanel.h - 0.2, zPath),
    V(D.acPanel.x - 0.15, yT, zPath),
    V(-SHED.w / 2, yT, zPath),
  ];
  pieces.paths.drive = [
    V(D.acPanel.x + 0.15, D.acPanel.y + D.acPanel.h - 0.2, zPath),
    V(D.acPanel.x + 0.15, yT, zPath),
    V(D.regenSupply.x - 0.2, yT, zPath),
    V(D.regenSupply.x - 0.2, cabinetTop - 0.3, zPath),
    V(D.regenSupply.x, cabinetTop + 0.05, 0.17),
    V(D.dcLink.x, cabinetTop + 0.05, 0.17),
    V(D.motorInverter.x, cabinetTop + 0.05, 0.17),
    V(D.motorInverter.x, 0.6, D.motorInverter.d),
    V(D.motorInverter.x - 0.08, plinth + 0.1, D.motorInverter.d + 0.02),
    V(pieces.hatch.x - 0.2, 0.03, D.motorInverter.d + 0.14),
    V(pieces.hatch.x, 0.02, pieces.hatch.z - 0.05),
    V(pieces.hatch.x, -0.25, pieces.hatch.z),
  ];
  pieces.paths.brake = [
    V(D.dcLink.x, cabinetTop + 0.05, 0.17),
    V(D.dcLink.x, yT, zPath),
    V(D.brakeChopper.x, yT, zPath),
    V(D.brakeChopper.x, D.brakeChopper.y + 0.3, zPath),
    V(D.brakeResistor.x - 0.2, D.brakeResistor.y + 0.2, 0.15),
    V(D.brakeResistor.x + 0.2, D.brakeResistor.y + 0.2, 0.15),
  ];
  pieces.paths.battery = [
    V(D.acPanel.x + 0.15, yT, zPath),
    V(xB, yT, zPath),
    V(xB, D.batteryInverter.y + D.batteryInverter.h + 0.04, zPath),
    V(D.batteryInverter.x, D.batteryInverter.y + D.batteryInverter.h - 0.1, 0.1),
    V(D.batteryInverter.x + 0.09, D.batteryInverter.y + 0.05, 0.1),
    V(x2(), SHELF.y + 0.1, 0.45),
  ];
  return pieces;
}

const x2 = (): number => SHELF.x + 0.13;

/** The tray along the top of the back wall, scenery: every conduit starts from it. */
export function buildTray(): THREE.Group {
  const g = group('tray');
  const y = TRAY_Y;
  const z = TRAY_Z;
  const x0 = -SHED.w / 2 + 0.005;
  const x1 = SHED.w / 2 - 0.005;
  const mat = paint(0x6d7174, 0.55);
  box(g, mat, x1 - x0, 0.008, 0.16, (x0 + x1) / 2, y - 0.03, z);
  box(g, mat, x1 - x0, 0.05, 0.006, (x0 + x1) / 2, y - 0.01, z - 0.08);
  box(g, mat, x1 - x0, 0.05, 0.006, (x0 + x1) / 2, y - 0.01, z + 0.08);
  // the brackets on the wall
  for (let x = x0 + 0.5; x < x1; x += 1) box(g, mat, 0.03, 0.03, 0.16, x, y - 0.05, 0.08);
  // the cables in the tray
  for (const [dy, dz, r] of [
    [0.012, -0.04, 0.012],
    [0.012, 0, 0.016],
    [0.012, 0.04, 0.012],
  ] as const) {
    const c = new THREE.CylinderGeometry(r, r, x1 - x0, 8);
    c.rotateZ(Math.PI / 2);
    c.translate((x0 + x1) / 2, y - 0.03 + dy, z + dz);
    g.add(mesh(c, M.cable));
  }
  return g;
}

export { TRAY_Y, TRAY_Z };
