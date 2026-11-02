import * as THREE from 'three';
import { group, mesh, PartRegistry, clamp, MAT } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import { DC_LINK_V } from '../../sim/machine';
import type { GravityState } from '../../sim/types';
import { paperFloor, FlowDots } from '../common';
import { contactShadow } from '../detail';
import { DEVICE, ESTOP, MODULE, SHED, SHELF } from '../dims';
import { mergeStatic } from '../merge';
import { box, rounded, sweep } from '../rig/shapes';
import { anchor, hotspots, workshopScene, type HotspotDef } from '../world';
import { POWER_PARTS, buildPowerParts, buildTray, type PowerId, type PowerPieces } from './parts';
import { buildShedShell } from './room';

// The `power-room` world: inside the power shed, open towards the visitor, its devices on the back wall in the order the current flows. No section (the room is open already). The
// flows reverse with the state (`flowDirection`); the lamps answer it: the link's lamp stays on as long as the link holds a voltage, the resistor's coils glow with the power it
// takes, the module's bars count its state of charge, the meter blinks with the energy, the fans turn with the current.

const HOTSPOTS: HotspotDef[] = [
  { id: 'lfp-module', fr: 'Module LFP', en: 'LFP module' },
  { id: 'motor-inverter', fr: 'Variateur de levage', en: 'Hoist inverter' },
  { id: 'dc-link', fr: 'Bus continu', en: 'DC link' },
  { id: 'regen-supply', fr: 'Alimentation réversible', en: 'Regenerative supply' },
  { id: 'ac-panel', fr: 'Tableau général', en: 'Main AC panel' },
  { id: 'pv-inverter', fr: 'Onduleur solaire', en: 'Solar inverter' },
  { id: 'brake-resistor', fr: 'Résistance de freinage', en: 'Brake resistor', minor: true },
  { id: 'energy-meter', fr: 'Compteur d’énergie', en: 'Energy meter', minor: true },
  { id: 'brake-chopper', fr: 'Hacheur de freinage', en: 'Brake chopper', minor: true },
  { id: 'motor-cable', fr: 'Câble moteur', en: 'Motor cable', minor: true },
  { id: 'safety-controller', fr: 'Automate de sécurité', en: 'Safety controller', minor: true },
  { id: 'emergency-stop', fr: 'Arrêt d’urgence', en: 'Emergency stop', minor: true },
  { id: 'control-ups', fr: 'Onduleur de contrôle', en: 'Control UPS', minor: true },
  { id: 'battery-inverter', fr: 'Onduleur batterie', en: 'Battery inverter', minor: true },
];

/** Explode offsets, room frame, metres: off the wall, near and far by turns. */
export const EXPLODE: Record<PowerId, [number, number, number]> = {
  'pv-inverter': [0, 0.1, 0.8],
  'energy-meter': [0, 0.28, 1.05],
  'ac-panel': [0, 0.06, 0.75],
  'regen-supply': [0, 0.3, 1.25],
  'dc-link': [0, 0.08, 0.85],
  'motor-inverter': [0, 0.3, 1.25],
  'brake-chopper': [0, 0.12, 0.85],
  'brake-resistor': [0.2, 0.14, 1.05],
  'motor-cable': [0.45, 0, 0.55],
  'safety-controller': [-0.05, -0.05, 0.75],
  'emergency-stop': [-0.8, 0, 0],
  'control-ups': [0, 0, 1.05],
  'battery-inverter': [0.05, 0.1, 0.75],
  'lfp-module': [0, 0, 1.2],
};

export interface PowerroomScene extends SceneModule<GravityState> {
  pieces: PowerPieces;
  flows: FlowDots;
  scenery(): THREE.Object3D[];
  drawn: { meterPhase: number };
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const FLOWS_W = 2000;

export function createPowerroomScene(): PowerroomScene {
  const scene = workshopScene({
    name: 'power-room',
    fog: [26, 46],
    key: [-1.8, 7.4, 8.4],
    target: [0, 1.0, 1.0],
    shadowHalf: 5.4,
    shadowFar: 22,
  });
  scene.add(paperFloor(46, 8, -0.1405));
  const contact = contactShadow(SHED.w + 0.5, SHED.d + 0.5, 0.8, 0.4);
  contact.position.set(0, -0.137, SHED.d / 2);
  scene.add(contact);
  // softer than the drafting table: pale walls return the light
  for (const c of scene.children) {
    if ((c as THREE.HemisphereLight).isHemisphereLight) (c as THREE.HemisphereLight).intensity = 0.62;
    const d = c as THREE.DirectionalLight;
    if (d.isDirectionalLight && d.castShadow) d.intensity = 1.5;
  }

  const shell = buildShedShell({ closed: false });
  scene.add(shell.group);
  const tray = buildTray();
  scene.add(tray);

  // near detail, scenery: a lamp, a board, a stool, a drum of cable, a fire extinguisher, floor markings
  const props = group('props');
  scene.add(props);
  // the floor's marking: the clear zone in front of the three cabinets, closed against the back wall and the shelf
  const floorEdge = new THREE.MeshStandardMaterial({ color: 0xb9860f, roughness: 0.7 });
  const zoneX = [DEVICE.regenSupply.x - 0.655, SHELF.x - SHELF.w / 2 + 0.03] as const;
  const zoneZ = 1.1;
  const tape = 0.05;
  box(props, floorEdge, zoneX[1] - zoneX[0], 0.003, tape, (zoneX[0] + zoneX[1]) / 2, 0.0015, zoneZ);
  box(props, floorEdge, tape, 0.003, zoneZ, zoneX[0], 0.0015, zoneZ / 2);
  box(props, floorEdge, tape, 0.003, zoneZ - SHELF.d, zoneX[1], 0.0015, (zoneZ + SHELF.d) / 2);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c4,
    roughness: 0.3,
    emissive: 0xd8cdb0,
    emissiveIntensity: 0.6,
  });
  box(props, lampMat, 1.1, 0.06, 0.12, -0.4, SHED.h - 0.04, 1.2);
  // a fire extinguisher on the floor by the wall: a shouldered red bottle on a black foot, a valve with its lever and gauge, a hose down to a nozzle clipped on its side
  const ext = group('extinguisher', [-2.75, 0, 1.05]);
  const bottle = new THREE.LatheGeometry(
    [
      [0, 0.02],
      [0.072, 0.02],
      [0.076, 0.03],
      [0.076, 0.42],
      [0.07, 0.45],
      [0.05, 0.475],
      [0.022, 0.49],
      [0, 0.49],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    20,
  );
  ext.add(mesh(bottle, MAT.redPaint()));
  const blackMat = MAT.printBlack();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xa9adb0, roughness: 0.4, metalness: 0.7 });
  const cylY = (r: number, y0: number, y1: number, x = 0, z = 0, seg = 14) =>
    mesh(new THREE.CylinderGeometry(r, r, y1 - y0, seg), blackMat, [x, (y0 + y1) / 2, z]);
  ext.add(cylY(0.08, 0, 0.022, 0, 0, 20));
  ext.add(cylY(0.018, 0.49, 0.53));
  box(ext, blackMat, 0.03, 0.025, 0.05, 0, 0.545, 0);
  // the carrying handle and the lever above it
  const lever = box(ext, steelMat, 0.018, 0.006, 0.11, 0, 0.565, 0.045);
  lever.rotation.x = -0.2;
  box(ext, steelMat, 0.018, 0.006, 0.1, 0, 0.545, 0.05);
  // the gauge on the valve
  const gauge = new THREE.CylinderGeometry(0.014, 0.014, 0.008, 12);
  gauge.rotateX(Math.PI / 2);
  ext.add(mesh(gauge, steelMat, [0.03, 0.53, -0.012]));
  // the label band
  box(ext, new THREE.MeshStandardMaterial({ color: 0xe8e0cd, roughness: 0.8 }), 0.09, 0.14, 0.004, 0, 0.24, 0.076);
  // the hose, from the valve down the side to the nozzle in its clip
  const hose = [
    new THREE.Vector3(-0.015, 0.535, 0),
    new THREE.Vector3(-0.07, 0.52, 0),
    new THREE.Vector3(-0.1, 0.42, 0.01),
    new THREE.Vector3(-0.095, 0.2, 0.02),
    new THREE.Vector3(-0.088, 0.12, 0.02),
  ];
  ext.add(mesh(sweep(rounded(hose, 0.03, 4), 0.007, 6), blackMat));
  ext.add(mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.08, 10), blackMat, [-0.088, 0.09, 0.02]));
  box(ext, steelMat, 0.02, 0.012, 0.02, -0.08, 0.2, 0.02);
  props.add(ext);
  // a drum of cable by the door: wood, on its flange
  const drum = group('cable-drum', [2.4, 0, 2.5]);
  const flangeG = new THREE.CylinderGeometry(0.28, 0.28, 0.025, 28);
  const coreG = new THREE.CylinderGeometry(0.11, 0.11, 0.26, 18);
  const coilG = new THREE.CylinderGeometry(0.2, 0.2, 0.25, 18);
  const drumWood = new THREE.MeshStandardMaterial({ color: 0x74664f, roughness: 0.9 });
  drum.add(mesh(flangeG, drumWood, [0, 0.0125, 0]));
  drum.add(mesh(flangeG, drumWood, [0, 0.0125 + 0.28, 0]));
  drum.add(mesh(coreG, drumWood, [0, 0.155, 0]));
  drum.add(mesh(coilG, MAT.printBlack(), [0, 0.155, 0]));
  props.add(drum);
  mergeStatic(drum);
  mergeStatic(props);
  mergeStatic(tray);
  mergeStatic(shell.group);

  const registry = new PartRegistry();
  const roots = {} as Record<PowerId, THREE.Group>;
  for (const id of POWER_PARTS) {
    roots[id] = group(id);
    scene.add(roots[id]);
  }
  const pieces = buildPowerParts(roots);
  for (const id of POWER_PARTS) mergeStatic(roots[id]);
  for (const f of pieces.fans) mergeStatic(f);

  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: PowerId, x: number, y: number, z: number) => {
    anchors[id] = anchor(roots[id], x, y, z, `${id}-label`);
    anchors[id].userData.keep = true;
  };
  const D = DEVICE;
  at('lfp-module', SHELF.x - 0.1, SHELF.y + SHELF.t + MODULE.h + 0.04, MODULE.d);
  at(
    'motor-inverter',
    D.motorInverter.x - 0.15,
    D.motorInverter.y + D.motorInverter.h - 0.12,
    D.motorInverter.d + 0.03,
  );
  at('dc-link', D.dcLink.x - 0.15, 1.55, D.dcLink.d + 0.03);
  at('regen-supply', D.regenSupply.x - 0.15, 1.12, D.regenSupply.d + 0.03);
  at('ac-panel', D.acPanel.x - 0.2, D.acPanel.y + 0.72, D.acPanel.d);
  at('pv-inverter', D.pvInverter.x - 0.1, D.pvInverter.y + D.pvInverter.h - 0.1, D.pvInverter.d + 0.02);
  at('brake-resistor', D.brakeResistor.x - 0.2, D.brakeResistor.y + 0.42, D.brakeResistor.d + 0.05);
  at('energy-meter', D.energyMeter.x, D.energyMeter.y + 0.07, D.energyMeter.d + 0.02);
  at('brake-chopper', D.brakeChopper.x - 0.1, D.brakeChopper.y + 0.14, D.brakeChopper.d + 0.02);
  at('motor-cable', pieces.hatch.x - 0.2, 0.08, pieces.hatch.z);
  at('safety-controller', D.safetyController.x - 0.1, D.safetyController.y + 0.45, 0.13);
  at('emergency-stop', SHED.w / 2 - 0.08, ESTOP.y + 0.05, ESTOP.z);
  at('control-ups', D.controlUps.x - 0.05, D.controlUps.y + 0.38, D.controlUps.d + 0.01);
  at('battery-inverter', D.batteryInverter.x - 0.15, D.batteryInverter.y + 0.34, D.batteryInverter.d + 0.02);

  for (const id of POWER_PARTS) registry.add(id, roots[id], V(...EXPLODE[id]));

  // under X-ray the cabinets' skins go and what they hide stays (the metal family, not the paint)
  const inner = (['regen-supply', 'dc-link', 'motor-inverter'] as PowerId[]).map((id) => ({
    id,
    meshes: registry
      .get(id)!
      .meshes.filter((m) => (m.userData.solidMaterial as THREE.MeshStandardMaterial).metalness > 0.5),
  }));

  const flows = new FlowDots(170, { color: 0xff8a3d, size: 5, pixels: true, throughWalls: true, opacity: 0.95 });
  scene.add(flows.object);
  const pGrid = flows.addPath(pieces.paths.grid, 24);
  const pPv = flows.addPath(pieces.paths.pv, 28);
  const pHouse = flows.addPath(pieces.paths.house, 18);
  const pDrive = flows.addPath(pieces.paths.drive, 46);
  const pBrake = flows.addPath(pieces.paths.brake, 26);
  const pBattery = flows.addPath(pieces.paths.battery, 28);
  const drawn = { meterPhase: 0 };
  /** Metres per second of a dot for a power of `w` watts, capped so that it reads. */
  const dotSpeed = (w: number): number => clamp(Math.abs(w) / FLOWS_W, 0, 2) * Math.sign(w);

  const mod: PowerroomScene = {
    id: 'power-room',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    pieces,
    flows,
    drawn,
    scenery: () => [shell.group, tray, props],
    home: { position: V(-0.3, 1.75, 6.4), target: V(0.28, 1.12, 0.6) },
    minDistance: 0.25,
    maxDistance: 25,
    declutter: true,
    homePadding: 0.78,
    update(s, dt, view) {
      let solids = 0;
      for (const id of registry.ids()) if (registry.get(id)!.display === 'solid') solids++;
      if (solids > 1)
        for (const { id, meshes } of inner)
          if (registry.get(id)!.display === 'ghost') for (const m of meshes) m.material = m.userData.solidMaterial;
      const meter = s.chain.meter;
      // lamps
      pieces.ledPv.emissiveIntensity = s.pv > 1 ? 2.2 : 0;
      drawn.meterPhase += (Math.abs(meter) / 1000) * 0.5 * dt * view.slowMo;
      pieces.ledMeter.emissiveIntensity = Math.abs(meter) > 1 && drawn.meterPhase % 1 < 0.18 ? 2.8 : 0.04;
      const running = s.flowDirection !== 0;
      pieces.ledRegen.emissiveIntensity = running ? 2.2 : s.drive === 'sleep' ? 0 : 0.7;
      pieces.ledInv.emissiveIntensity = running ? 2.2 : s.drive === 'sleep' ? 0 : 0.7;
      // the link holds its charge long after the power goes: the lamp says so, in proportion
      pieces.ledDc.emissiveIntensity = 3.2 * clamp(s.dcVolts / DC_LINK_V, 0, 1.3) * (s.dcVolts > 30 ? 1 : 0);
      const dump = clamp(s.chopperPower / 13000, 0, 1);
      pieces.ledChopper.emissiveIntensity = s.chopperPower > 0 ? 2.6 : 0;
      pieces.coils.emissiveIntensity = dump * 3.4;
      // the safety chain: the second lamp of every module is red when a stop is in force
      const stop = s.alarms.some(
        (a) => a === 'gateOpen' || a === 'windStop' || a === 'overspeed' || a === 'safetyGear' || a === 'overload',
      );
      pieces.ledSafetyOk.emissiveIntensity = stop ? 0.15 : 2;
      pieces.ledSafetyStop.emissiveIntensity = stop ? 2.6 : 0;
      pieces.ledUps.color.set(s.alarms.includes('gridLost') ? 0xffb040 : 0x53d36b);
      pieces.ledUps.emissive.copy(pieces.ledUps.color);
      pieces.ledBatInv.emissiveIntensity = Math.abs(s.lfpPower) > 1 ? 2.2 : 0.3;
      // the module's bars count the state of charge; the top one breathes when it charges
      const bars = s.soc * pieces.socBars.length;
      pieces.socBars.forEach((b, i) => {
        const on = bars > i + 0.02;
        const top = on && bars < i + 1 + 0.02;
        b.emissiveIntensity = on ? (top && s.lfpPower > 1 ? 1.2 + 1 * Math.sin(view.time * 4) : 2) : 0.02;
      });
      // fans follow the power through the cabinets
      const spin = clamp(Math.abs(meter) / 4000, 0, 1) * 5;
      for (const f of pieces.fans) f.rotation.z += spin * dt * view.slowMo;
      // "Flows": each path with its own speed, reversing with the machine
      flows.object.visible = view.schematic;
      if (view.schematic) {
        const dir = s.flowDirection;
        flows.advance(pDrive, dir * dotSpeed(Math.abs(meter)) || 0, dt);
        flows.advance(pGrid, dotSpeed(s.gridPower), dt);
        flows.advance(pPv, dotSpeed(s.pv), dt);
        flows.advance(pHouse, dotSpeed(s.load), dt);
        flows.advance(pBrake, s.chopperPower > 0 ? dotSpeed(s.chopperPower) : 0, dt);
        flows.advance(pBattery, dotSpeed(s.lfpPower), dt);
        flows.place();
      }
    },
  };
  return mod;
}
