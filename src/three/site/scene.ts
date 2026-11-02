import * as THREE from 'three';
import { clamp, damp, emissive, group, PartRegistry } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import { BLOCK, DECK_TOP, PANEL_H, SHED, SITE, STACK, TOWER, levelY } from '../dims';
import type { GravityParams, GravityState } from '../../sim/types';
import { FlowDots } from '../common';
import { mergeStatic } from '../merge';
import { buildShedShell } from '../powerroom/room';
import { buildMachine, type Machine } from '../rig/machine';
import { blockGeometry } from '../rig/weight';
import { anchor, hotspots, type HotspotDef } from '../world';
import { buildBarn, buildHouse } from './buildings';
import { WIND, textureStats } from './materials';
import {
  buildFence,
  buildGate,
  buildMast,
  buildPaddock,
  buildTelehandler,
  buildTrench,
  buildYard,
  buildYardProps,
  pole,
  wire,
  wireMaterial,
} from './props';
import { createSky } from './sky';
import { buildTerrain } from './terrain';
import { buildVegetation, planVegetation } from './vegetation';

// The `site` world: a flat farmyard, on purpose (no hill, no lake, so no pumped storage). The barn with its solar roof, the house, the tower behind its fence, the power shed, the
// cable trench, the supply. The machine is the one of the `tower` world, the same function at the same place; the sky follows the clock of the simulation, the weight rises at noon
// and the windows light up in the evening. The ghost is what a whole night would take, in real blocks on the meadow and in towers along the far side of the farm: it appears when
// the night's slider moves (it is the answer to that question) or with "Flows".

const HOTSPOTS: HotspotDef[] = [
  { id: 'machine-tower', fr: 'Tour de stockage', en: 'Storage tower', goto: 'tower' },
  { id: 'power-shed', fr: 'Local électrique', en: 'Power shed', goto: 'power-room' },
  { id: 'barn-solar-roof', fr: 'Toit solaire de la grange', en: 'Barn solar roof' },
  { id: 'farmhouse', fr: 'Maison', en: 'Farmhouse' },
  { id: 'block-yard', fr: 'Aire à blocs', en: 'Block yard' },
  { id: 'exclusion-fence', fr: 'Clôture de sécurité', en: 'Exclusion fence', minor: true },
  { id: 'interlocked-gate', fr: 'Portail asservi', en: 'Interlocked gate', minor: true },
  { id: 'cable-trench', fr: 'Tranchée de câbles', en: 'Cable trench', minor: true },
  { id: 'grid-connection', fr: 'Branchement au réseau', en: 'Grid connection', minor: true },
  { id: 'wind-mast', fr: 'Mât anémométrique', en: 'Wind mast', minor: true },
];

/** Explode offsets, site frame, metres: every part rises by its own amount. */
export const EXPLODE: Record<string, [number, number, number]> = {
  'machine-tower': [0, 12, 0],
  'barn-solar-roof': [0, 9, 0],
  farmhouse: [0, 7, 0],
  'power-shed': [0, 6, 0],
  'cable-trench': [0, 2.4, 0],
  'grid-connection': [0, 4, 0],
  'exclusion-fence': [0, 3, 0],
  'interlocked-gate': [0, 4.4, 0],
  'wind-mast': [0, 5, 0],
  'block-yard': [0, 3.4, 0],
};

/** The machine as the site builds it: the winding coarser (it is never seen closer than a selected tower), everything that stands still baked. */
export const SITE_MACHINE = { windingDetail: [12, 4] as [number, number], wear: 5, flat: true };

export interface SiteScene extends SceneModule<GravityState> {
  machine: Machine;
  ghost: { blocks: THREE.InstancedMesh; towers: THREE.InstancedMesh; shown: number };
  gate: { leaves: THREE.Group[] };
  sun: THREE.DirectionalLight;
  house: { panes: THREE.MeshStandardMaterial; light: THREE.PointLight };
  scenery(): THREE.Object3D[];
  trenchLine: THREE.Vector3[];
  flows: FlowDots;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** A translucent copper for what the ghost is: not a thing, a quantity. Double the depth write off: its faces overlap without a fight. */
const ghostMaterial = (opacity: number): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({
    color: 0xd8824a,
    transparent: true,
    opacity,
    roughness: 0.55,
    metalness: 0,
    depthWrite: false,
    emissive: 0x8a4a22,
    emissiveIntensity: 0.4,
  });

/** One ghost tower: the machine's lattice, legs and diagonals, in one geometry, its foot at y = 0, height 1 for an instance scaled by the height. */
function ghostTowerGeometry(): THREE.BufferGeometry {
  const L = TOWER.legX;
  const top = TOWER.height;
  const pos: number[] = [];
  const idx: number[] = [];
  const addBox = (a: THREE.Vector3, b: THREE.Vector3, t: number) => {
    const d = b.clone().sub(a);
    const len = d.length();
    const up = V(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, d.clone().normalize());
    const g = new THREE.BoxGeometry(t, len, t);
    g.translate(0, len / 2, 0);
    g.applyQuaternion(q);
    g.translate(a.x, a.y, a.z);
    const base = pos.length / 3;
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) pos.push(p.getX(i), p.getY(i) / top, p.getZ(i));
    const ix = g.index!;
    for (let i = 0; i < ix.count; i++) idx.push(base + ix.getX(i));
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) addBox(V(sx * L, 0, sz * L), V(sx * L, DECK_TOP, sz * L), 0.26);
  for (let i = 0; i < TOWER.panels; i++) {
    const y0 = levelY(i);
    const y1 = y0 + PANEL_H;
    for (const s of [-1, 1]) {
      addBox(V(-L, y0, s * L), V(L, y1, s * L), 0.14);
      addBox(V(L, y0, s * L), V(-L, y1, s * L), 0.14);
      addBox(V(s * L, y0, -L), V(s * L, y1, L), 0.14);
      addBox(V(s * L, y0, L), V(s * L, y1, -L), 0.14);
    }
  }
  // the head: a block where the hoist and the roof are
  addBox(V(0, DECK_TOP, 0), V(0, top, 0), 3.4);
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  out.computeVertexNormals();
  return out;
}

export function createSiteScene(params: () => GravityParams): SiteScene {
  const tBuild = performance.now();
  const scene = new THREE.Scene();
  scene.name = 'site';
  // ACES at 1, the site of the other labs; a film capture turns the occlusion on, a metre and a half of reach
  scene.userData.look = { ao: true, aoRadius: 1.5 };
  const registry = new PartRegistry();
  const sky = createSky(scene);
  sky.focusShadow(V(-8, 0, -14), 92);

  // ---- the land and the plants
  const terrain = buildTerrain();
  scene.add(terrain.group);
  const plan = planVegetation();
  const plants = buildVegetation(plan);
  scene.add(plants.group);
  const tLand = performance.now();

  // ---- the machine: the same function as in the `tower` and `hoist` worlds, the winding a little coarser (it is never seen closer than a selected tower)
  const machine = buildMachine(SITE_MACHINE);
  scene.add(machine.root);

  // ---- the farm
  const barn = buildBarn();
  const house = buildHouse();
  const shedRoot = group('power-shed', [SHED.x, 0, SHED.z]);
  const shed = buildShedShell({ closed: true });
  shedRoot.add(shed.group);
  mergeStatic(barn.group);
  mergeStatic(house.group);
  mergeStatic(shed.group);
  scene.add(barn.group, house.group, shedRoot);
  const fence = buildFence();
  mergeStatic(fence);
  const gate = buildGate();
  mergeStatic(gate.group);
  for (const l of gate.leaves) mergeStatic(l);
  const wires = wireMaterial();
  const mast = buildMast(wires);
  mergeStatic(mast.group);
  mergeStatic(mast.cups);
  mergeStatic(mast.vane);
  const yardBlocksMat = machine.look.block.clone();
  yardBlocksMat.vertexColors = true;
  const yard = buildYard(blockGeometry, yardBlocksMat);
  mergeStatic(yard);
  const trench = buildTrench();
  mergeStatic(trench.group);
  scene.add(fence, gate.group, mast.group, yard, trench.group);

  // ---- the wires: the supply into the shed (a part); the roof's cable, the house's line and the line away over the plain (scenery)
  const gridRoot = group('grid-connection');
  const props = group('farm-props');
  const shedWestX = SHED.x - SHED.w / 2 - SHED.wall;
  const pGrid = V(SITE.pole.x, 0, SITE.pole.z);
  const ins = pole(gridRoot, pGrid.x, pGrid.z);
  // the box on the shed's west wall, the drop from the pole to it
  const gridBox = V(shedWestX - 0.08, 2.1, SHED.z + 1.4);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xc9ccc9, roughness: 0.5, metalness: 0.2 });
  const gb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.36), boxMat);
  gb.position.copy(gridBox);
  gb.castShadow = true;
  gridRoot.add(gb);
  const dropLine = wire(gridRoot, ins[1], gridBox.clone().setX(gridBox.x - 0.08), wires, 0.35, 0.01);
  // the line back across the plain: poles to the horizon, out to the west-south-west
  let last = ins;
  const lineWest: THREE.Vector3[] = [ins[1].clone()];
  for (let i = 1; i <= 6; i++) {
    const nx = pGrid.x - i * 44;
    const nz = pGrid.z + i * 9;
    const next = pole(props, nx, nz);
    for (let k = 0; k < 3; k++) wire(props, last[k], next[k], wires, 0.6);
    last = next;
    lineWest.push(next[1].clone());
  }
  // the roof's cable to the shed: a pole on the way, then along the eaves into the shed's north wall
  const pv = pole(props, -46, -16, 6.2);
  const shedRoofIn = V(SHED.x - 1.2, 2.3, SHED.z - SHED.wall - 0.02);
  const roofLine = [
    ...wire(props, barn.cableOut, pv[0], wires, 0.2, 0.012),
    ...wire(props, pv[0], shedRoofIn, wires, 0.3, 0.012),
  ];
  // the house's line: from the shed's roof by poles north of the fence
  const hp1 = pole(props, -22, -34, 7);
  const hp2 = pole(props, 20, -37, 7);
  const shedOut = V(SHED.x + 1.8, 2.5, SHED.z - SHED.wall - 0.02);
  const houseLine = [
    ...wire(props, shedOut, hp1[1], wires, 0.5),
    ...wire(props, hp1[1], hp2[1], wires, 0.7),
    ...wire(props, hp2[1], house.lineIn, wires, 0.6),
  ];

  // ---- what a yard has
  props.add(buildYardProps(), buildPaddock());
  const handler = buildTelehandler(6, 33, -1.05);
  props.add(handler);
  mergeStatic(handler);
  scene.add(gridRoot, props);
  mergeStatic(gridRoot);
  mergeStatic(props);

  // a bulb over the shed's door, under the eaves
  const shedBulb = emissive(0xffd79a, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), shedBulb);
  bulb.position.set(SHED.w / 2 + SHED.wall + 0.1, 2.32, 1.65);
  bulb.castShadow = false;
  shedRoot.add(bulb);
  // ---- labels
  const anchors: Record<string, THREE.Object3D> = {};
  anchors['machine-tower'] = anchor(machine.root, -1, TOWER.height + 1.4, 1, 'machine-label');
  anchors['machine-tower'].userData.keep = true;
  anchors['power-shed'] = anchor(shedRoot, 0, SHED.h + 1.4, SHED.d / 2, 'shed-label');
  anchors['power-shed'].userData.keep = true;
  anchors['barn-solar-roof'] = barn.anchor;
  anchors.farmhouse = house.anchor;
  anchors['block-yard'] = anchor(yard, 0, 2.2, 0, 'yard-label');
  anchors['block-yard'].userData.keep = true;
  anchors['exclusion-fence'] = anchor(fence, SITE.fenceR * 0.72, SITE.fenceH + 0.3, SITE.fenceR * 0.694, 'fence-label');
  anchors['exclusion-fence'].userData.keep = true;
  anchors['interlocked-gate'] = gate.anchor;
  anchors['cable-trench'] = anchor(trench.group, -16, 0.5, SITE.trench.z, 'trench-label');
  anchors['cable-trench'].userData.keep = true;
  anchors['grid-connection'] = anchor(gridRoot, pGrid.x, SITE.pole.h + 0.5, pGrid.z, 'grid-label');
  anchors['grid-connection'].userData.keep = true;
  anchors['wind-mast'] = mast.anchor;

  registry.add('machine-tower', machine.root, V(...EXPLODE['machine-tower']));
  registry.add('barn-solar-roof', barn.group, V(...EXPLODE['barn-solar-roof']));
  registry.add('farmhouse', house.group, V(...EXPLODE.farmhouse));
  registry.add('power-shed', shedRoot, V(...EXPLODE['power-shed']));
  registry.add('cable-trench', trench.group, V(...EXPLODE['cable-trench']));
  registry.add('grid-connection', gridRoot, V(...EXPLODE['grid-connection']));
  registry.add('exclusion-fence', fence, V(...EXPLODE['exclusion-fence']));
  registry.add('interlocked-gate', gate.group, V(...EXPLODE['interlocked-gate']));
  registry.add('wind-mast', mast.group, V(...EXPLODE['wind-mast']));
  registry.add('block-yard', yard, V(...EXPLODE['block-yard']));

  // ---- the ghost: real blocks on the meadow, and towers along the far side
  const GHOST_MAX = 420;
  const ghostGeo = new THREE.BoxGeometry(BLOCK.length * 0.97, BLOCK.height * 0.97, BLOCK.width * 0.97);
  const ghostBlocks = new THREE.InstancedMesh(ghostGeo, ghostMaterial(0.42), GHOST_MAX);
  ghostBlocks.name = 'ghost-blocks';
  ghostBlocks.count = 0;
  ghostBlocks.castShadow = false;
  ghostBlocks.frustumCulled = false;
  ghostBlocks.userData.noShadow = true;
  const TOWERS_MAX = 24;
  const ghostTowers = new THREE.InstancedMesh(ghostTowerGeometry(), ghostMaterial(0.3), TOWERS_MAX);
  ghostTowers.name = 'ghost-towers';
  ghostTowers.count = 0;
  ghostTowers.castShadow = false;
  ghostTowers.frustumCulled = false;
  ghostTowers.userData.noShadow = true;
  scene.add(ghostBlocks, ghostTowers);
  const m4 = new THREE.Matrix4();
  const layoutGhost = (s: GravityState) => {
    const n = Math.min(GHOST_MAX, Math.round(s.ghostBlocks));
    ghostBlocks.count = n;
    const g = SITE.ghost;
    for (let i = 0; i < n; i++) {
      // stacks like the machine's: two blocks a layer, a quarter turn each layer, three layers; columns in a block
      const col = Math.floor(i / 6);
      const inCol = i % 6;
      const layer = Math.floor(inCol / 2);
      const side = inCol % 2 === 0 ? -1 : 1;
      const cx = col % g.cols;
      const cz = Math.floor(col / g.cols);
      const turned = layer % 2 === 1;
      const x = g.x + cx * (STACK.width + 0.5);
      const z = g.z + cz * (STACK.width + 0.5);
      m4.makeRotationY(turned ? Math.PI / 2 : 0);
      m4.setPosition(
        x + (turned ? (side * BLOCK.width) / 2 : 0),
        BLOCK.height / 2 + layer * BLOCK.height,
        z + (turned ? 0 : (side * BLOCK.width) / 2),
      );
      ghostBlocks.setMatrixAt(i, m4);
    }
    ghostBlocks.instanceMatrix.needsUpdate = true;
    // the towers, in a row: the last is as tall as what is left of a tower
    const nT = Math.min(TOWERS_MAX, Math.ceil(s.ghostTowers));
    ghostTowers.count = nT;
    const t = g.tower;
    for (let i = 0; i < nT; i++) {
      const frac = i === nT - 1 && s.ghostTowers % 1 > 0.02 ? s.ghostTowers % 1 : 1;
      m4.makeScale(1, TOWER.height * frac, 1);
      m4.setPosition(t.x + i * t.dx, 0, t.z + i * t.dz);
      ghostTowers.setMatrixAt(i, m4);
    }
    ghostTowers.instanceMatrix.needsUpdate = true;
  };

  // ---- "Flows": the current, along the wires and the trench
  const flows = new FlowDots(150, { color: 0xff8a3d, size: 5, pixels: true, throughWalls: true, opacity: 0.95 });
  scene.add(flows.object);
  const fTrench = flows.addPath(trench.line, 40);
  const fRoof = flows.addPath(roofLine, 24);
  const fHouse = flows.addPath(houseLine, 40);
  const fGrid = flows.addPath([...lineWest.slice().reverse(), ...dropLine], 40);

  let ghostAlpha = 0;
  let ghostBase: number | null = null;
  let ghostKey = '';
  let wingFlap = 0;
  const lightUp = { k: 0 };
  const mod: SiteScene = {
    id: 'site',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    machine,
    ghost: { blocks: ghostBlocks, towers: ghostTowers, shown: 0 },
    gate,
    sun: sky.sun,
    house: { panes: house.panes, light: house.light },
    trenchLine: trench.line,
    flows,
    scenery: () => [terrain.group, plants.group, props, machine.root],
    home: { position: V(64, 31, 96), target: V(0, 6, -13) },
    minDistance: 2,
    maxDistance: 340,
    update(s, dt, view) {
      const p = params();
      sky.update(s.hour, view.time);
      WIND.time.value = view.time;
      machine.update(s, dt, view);

      // ---- the windows: a warm light from when the sun goes, in proportion to what the house asks
      const dark = sky.night;
      const on = dark > 0.25 && s.load > 0;
      lightUp.k = damp(lightUp.k, on ? clamp(0.5 + s.load / 1500, 0.5, 1) : 0, 3, Math.min(dt, 0.1));
      house.panes.emissiveIntensity = lightUp.k * 2.1;
      house.light.intensity = lightUp.k * 42;
      // the tower's obstruction lamp and the yard's bulb on the shed: on as soon as the light goes
      const dusk = clamp((dark - 0.2) * 2, 0, 1);
      machine.look.beacon.emissiveIntensity = 0.25 + dusk * 3.6;
      shedBulb.emissiveIntensity = dusk * 3.2;

      // ---- the gate follows the parameter: each leaf swings inwards
      const open = p.gateOpen ? 1 : 0;
      wingFlap = damp(wingFlap, open, 3, Math.min(dt, 0.1));
      gate.leaves[0].rotation.y = -wingFlap * 1.4;
      gate.leaves[1].rotation.y = wingFlap * 1.4;
      gate.lamp.color.set(p.gateOpen ? 0xff3020 : 0x53d36b);
      gate.lamp.emissive.copy(gate.lamp.color);

      // ---- the wind mast: the cups spin with the wind, capped for the eye
      mast.cups.rotation.y += Math.min(p.wind * 0.9, 18) * dt * view.slowMo;
      mast.vane.rotation.y = 0.3 + 0.12 * Math.sin(view.time * 0.6);

      // ---- the ghost: appears when the question is asked, follows the answer
      if (ghostBase === null) ghostBase = s.ghostTonnes;
      const asked = Math.abs(s.ghostTonnes - ghostBase) > 1e-3 || view.schematic;
      const want = asked && s.ghostTonnes > 0 ? 1 : 0;
      ghostAlpha = damp(ghostAlpha, want, 4, Math.min(dt, 0.1));
      const shown = ghostAlpha > 0.01;
      ghostBlocks.visible = shown;
      ghostTowers.visible = shown;
      if (shown) {
        (ghostBlocks.material as THREE.MeshStandardMaterial).opacity = 0.42 * ghostAlpha;
        (ghostTowers.material as THREE.MeshStandardMaterial).opacity = 0.3 * ghostAlpha;
        const key = `${Math.round(s.ghostBlocks)}|${s.ghostTowers.toFixed(2)}`;
        if (key !== ghostKey) {
          ghostKey = key;
          layoutGhost(s);
        }
      }
      mod.ghost.shown = shown ? ghostBlocks.count : 0;

      // ---- "Flows": the machine's current through the trench, the sun's from the roof, the house's, the grid's
      flows.object.visible = view.schematic;
      if (view.schematic) {
        const speed = (w: number) => clamp(Math.abs(w) / 1500, 0, 8) * Math.sign(w);
        flows.advance(fTrench, s.flowDirection * Math.abs(speed(s.chain.meter)), dt);
        flows.advance(fRoof, speed(s.pv), dt);
        flows.advance(fHouse, speed(s.load), dt);
        flows.advance(fGrid, p.grid ? speed(s.gridPower) : 0, dt);
        flows.place();
      }
    },
  };
  // the first build: the budget of docs (console, as Mill Lab's)
  // eslint-disable-next-line no-console
  console.info(
    `[site] world built in ${Math.round(performance.now() - tBuild)} ms: land ${Math.round(tLand - tBuild)} ms (textures ${Math.round(textureStats().ms)} ms)`,
  );
  return mod;
}
