import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GravitySim } from '../../sim/engine';
import { DECK_TOP, MOTOR_CABLE_M, PAD_BOTTOM, PAD_TOP, PV_WATTS, SHED, SITE, TOWER } from '../dims';
import { boxOf, drawStats, finiteTree, stateWith, view } from '../test-utils';
import { createSiteScene, ghostLabel } from './scene';
import { terrainHeight, trackDistance } from './terrain';
import { OAK_SPRAYS, POPLAR_SPRAYS, planVegetation } from './vegetation';
import { sceneryTextures } from './materials';

const sim = new GravitySim();
const params = { ...sim.params };
const mod = createSiteScene(() => params);
mod.update(stateWith({ zFraction: 0.2 }), 1 / 60, view());

describe('the farm is flat on purpose', () => {
  it('the land is level in the yard and never rises to be a hill', () => {
    for (const [x, z] of [
      [0, 0],
      [30, 30],
      [-60, -40],
      [47, -38],
      [100, 0],
    ])
      expect(terrainHeight(x, z)).toBe(0);
    let top = 0;
    for (let x = -2400; x <= 2400; x += 80)
      for (let z = -2400; z <= 2400; z += 80) top = Math.max(top, Math.abs(terrainHeight(x, z)));
    expect(top).toBeLessThanOrEqual(SITE.flatHeight);
  });
});

describe('nothing floats, nothing sinks', () => {
  const lowest = (o: THREE.Object3D) => boxOf(o).min.y;
  it.each([
    ['barn-solar-roof', 0.005],
    ['farmhouse', 0.005],
    ['exclusion-fence', 0.005],
    ['interlocked-gate', 0.005],
    ['wind-mast', 0.005],
    ['block-yard', 0.005],
    ['cable-trench', 0.005],
    ['grid-connection', 0.005],
  ])('%s stands on the ground', (id, tol) => {
    const e = mod.registry.get(id)!;
    expect(Math.abs(lowest(e.object))).toBeLessThan(tol);
  });

  it('the power shed sits on its slab, the slab in the ground', () => {
    const b = boxOf(mod.registry.get('power-shed')!.object);
    expect(b.min.y).toBeLessThan(0);
    expect(b.min.y).toBeGreaterThan(-0.2);
  });

  it('the tower stands on its pad, whose top is a little above the ground', () => {
    // the machine's parts are baked here: the machine's whole box says it, and its own tests say the rest
    const p = boxOf(mod.machine.root);
    expect(p.min.y).toBeLessThan(-1);
    expect(p.min.y).toBeCloseTo(PAD_BOTTOM, 2);
    expect(PAD_TOP).toBeGreaterThan(0);
  });

  it('every plant stands on the land', () => {
    const plan = planVegetation();
    for (const list of [plan.poplars, plan.oaks, plan.apples, plan.hedges, plan.hedgesNear, plan.belts, plan.shrubs])
      for (const t of list) expect(Math.abs(t.y - terrainHeight(t.x, t.z))).toBeLessThan(1e-6);
  });

  it('nothing is planted in the fence, on a track, or on a building', () => {
    const plan = planVegetation();
    for (const list of [plan.poplars, plan.oaks, plan.apples]) {
      for (const t of list) {
        expect(Math.hypot(t.x, t.z)).toBeGreaterThan(SITE.fenceR);
        expect(trackDistance(t.x, t.z).d).toBeGreaterThan(1.8);
      }
    }
  });
});

describe('the site is at scale', () => {
  it("the fence is the fall zone: its radius, the tower's height", () => {
    expect(SITE.fenceR).toBe(TOWER.height);
    const b = boxOf(mod.registry.get('exclusion-fence')!.object);
    expect((b.max.x - b.min.x) / 2).toBeCloseTo(SITE.fenceR, 0);
  });

  it("the roof is the research's 36 kWp", () => {
    expect(PV_WATTS).toBe(36000);
    const barn = SITE.barn;
    expect(SITE.pv.rows * (SITE.pv.h + SITE.pv.gap)).toBeLessThan(Math.hypot(barn.span / 2, barn.ridge - barn.eaves));
    expect(SITE.pv.cols * (SITE.pv.w + SITE.pv.gap)).toBeLessThan(barn.len);
  });

  it('nothing but the fence, the gate, the mast, the yard, the trench is inside the fall zone', () => {
    for (const id of ['barn-solar-roof', 'farmhouse', 'power-shed', 'grid-connection']) {
      const b = boxOf(mod.registry.get(id)!.object);
      const near = new THREE.Vector3(
        Math.max(b.min.x, Math.min(0, b.max.x)),
        0,
        Math.max(b.min.z, Math.min(0, b.max.z)),
      );
      expect(near.length(), id).toBeGreaterThan(SITE.fenceR);
    }
  });

  it('the shed is the room of the power-room world, walls and all', () => {
    const b = boxOf(mod.registry.get('power-shed')!.object);
    // inner width + two walls
    expect(b.max.x - b.min.x).toBeGreaterThanOrEqual(SHED.w + 2 * SHED.wall);
    expect(b.max.x - b.min.x).toBeLessThan(SHED.w + 2 * SHED.wall + 0.8);
  });

  it("the motor cable drawn is the model's 55 m, from the shed up the tower, within 7 %", () => {
    let len = 0;
    const line = mod.trenchLine;
    for (let i = 1; i < line.length; i++) len += line[i].distanceTo(line[i - 1]);
    // from the top of the riser to the terminal box: along the deck
    const top = line[line.length - 1];
    expect(top.y).toBeCloseTo(DECK_TOP + 0.12, 3);
    len += 2.6;
    expect(Math.abs(len - MOTOR_CABLE_M) / MOTOR_CABLE_M).toBeLessThan(0.07);
  });
});

describe('the state drives the picture', () => {
  it('the weight is at the fraction of the stroke the state says, on the site too', () => {
    mod.update(stateWith({ zFraction: 0.5 }), 1 / 60, view());
    expect(mod.machine.weight.position.y).toBeCloseTo(10, 5);
  });

  it('the windows light at night, when the house asks, not at noon', () => {
    for (let i = 0; i < 40; i++) mod.update(stateWith({ hour: 13, load: 500, zFraction: 0.2 }), 0.1, view());
    expect(mod.house.panes.emissiveIntensity).toBeLessThan(0.01);
    for (let i = 0; i < 40; i++) mod.update(stateWith({ hour: 21, load: 500, zFraction: 0.2 }), 0.1, view());
    expect(mod.house.panes.emissiveIntensity).toBeGreaterThan(0.5);
  });

  it('the gate swings with the parameter', () => {
    params.gateOpen = false;
    for (let i = 0; i < 40; i++) mod.update(stateWith({ zFraction: 0.2 }), 0.1, view());
    expect(Math.abs(mod.gate.leaves[0].rotation.y)).toBeLessThan(0.01);
    params.gateOpen = true;
    for (let i = 0; i < 40; i++) mod.update(stateWith({ zFraction: 0.2 }), 0.1, view());
    expect(Math.abs(mod.gate.leaves[0].rotation.y)).toBeGreaterThan(1);
    params.gateOpen = false;
  });

  it('the ghost appears when the answer changes, with real blocks, and shows none when there is no answer', () => {
    const s = stateWith({ zFraction: 0.2, ghostTonnes: 128, ghostBlocks: 89, ghostTowers: 6.4, ghostVolume: 46 });
    const m = createSiteScene(() => params);
    m.update(s, 1 / 60, view());
    expect(m.ghost.shown).toBe(0);
    const more = { ...s, ghostTonnes: 287, ghostBlocks: 201, ghostTowers: 14.3, ghostVolume: 103 };
    for (let i = 0; i < 30; i++) m.update(more, 0.1, view());
    expect(m.ghost.blocks.count).toBe(201);
    expect(m.ghost.towers.count).toBe(15);
    expect(m.ghost.blocks.visible).toBe(true);
    const none = { ...s, ghostTonnes: 0, ghostBlocks: 0, ghostTowers: 0, ghostVolume: 0 };
    for (let i = 0; i < 40; i++) m.update(none, 0.1, view());
    expect(m.ghost.blocks.visible).toBe(false);
  });
});

describe('D9, D10. Trees that are trees, gravel that is gravel', () => {
  const sprayMesh = (name: string) => mod.scene.getObjectByName(name) as THREE.InstancedMesh;

  it.each([
    ['oak-sprays', OAK_SPRAYS, 18],
    ['poplar-sprays', POPLAR_SPRAYS, 26],
  ])('%s: many sprays, each small, with leaves cut out of them', (name, count, tallest) => {
    const m = sprayMesh(name);
    expect(m).toBeDefined();
    const mat = m.material as THREE.MeshStandardMaterial;
    expect(mat.alphaTest).toBeGreaterThan(0);
    expect(mat.map?.name).toBe('sprays');
    const g = m.geometry;
    expect(g.index!.count / 3).toBe(2 * count);
    // a card's diagonal, at the height of the tallest tree of the species, in metres: the leaves on it are a fifteenth of that
    const p = g.attributes.position;
    let largest = 0;
    for (let i = 0; i < p.count; i += 4) {
      const a = new THREE.Vector3().fromBufferAttribute(p, i);
      const c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
      largest = Math.max(largest, a.distanceTo(c));
    }
    expect(largest * tallest).toBeLessThan(3.5);
  });

  it('the sprite has leaves and gaps, thickest in the middle: its small mipmaps stay a round blob', () => {
    const t = sceneryTextures().sprays;
    const { data, width: N } = t.image as { data: Uint8Array; width: number };
    let inner = 0;
    let innerN = 0;
    let corner = 0;
    let cornerN = 0;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const r = Math.hypot((i + 0.5) / N - 0.5, (j + 0.5) / N - 0.5);
        const a = data[(j * N + i) * 4 + 3] / 255;
        if (r < 0.3) {
          inner += a;
          innerN++;
        } else if (r > 0.52) {
          corner += a;
          cornerN++;
        }
      }
    expect(inner / innerN).toBeGreaterThan(0.65);
    expect(corner / cornerN).toBeLessThan(0.05);
  });

  it('the gravel is small stones with no pattern of spots: its mean stays neutral, its bright runs short', () => {
    const t = sceneryTextures().ground;
    const { data, width: N } = t.image as { data: Uint8Array; width: number };
    let sum = 0;
    for (let i = 0; i < N * N; i++) sum += data[i * 4 + 1] / 255;
    const mean = sum / (N * N);
    expect(Math.abs(mean - 0.5)).toBeLessThan(0.02);
    // the length of a run of light texels along a row, in metres (the tile is 2.2 m): a stone, not a paving slab
    let runs = 0;
    let total = 0;
    for (let j = 0; j < N; j += 7) {
      let inRun = false;
      for (let i = 0; i < N; i++) {
        const light = data[(j * N + i) * 4 + 1] / 255 > mean;
        if (light) total++;
        if (light && !inRun) runs++;
        inRun = light;
      }
    }
    expect(((total / runs) * 2.2) / N).toBeLessThan(0.07);
  });
});

it('the budgets of the site', () => {
  const st = drawStats(mod.scene);
  // numbers printed for the report
  // eslint-disable-next-line no-console
  console.log(`site: ${st.calls} calls, ${Math.round(st.triangles)} triangles`);
  expect(finiteTree(mod.scene)).toBe(true);
});

describe('review: what a selected part leaves on the farm, the ground, the ghost’s label', () => {
  it('D58. X-ray with a part selected: the many layers of the tower and the yard stay faint, and solid again after', () => {
    const m = createSiteScene(() => params);
    m.update(stateWith(), 1 / 60, view());
    for (const id of m.registry.ids()) m.registry.setDisplay(id, id === 'cable-trench' ? 'solid' : 'ghost');
    m.update(stateWith(), 1 / 60, view());
    for (const id of ['machine-tower', 'block-yard']) {
      const mat = m.registry.get(id)!.meshes[0]!.material as THREE.MeshBasicMaterial;
      expect(mat.opacity, id).toBeLessThan(0.03);
      expect(mat.transparent, id).toBe(true);
      expect(mat.depthWrite, id).toBe(false);
    }
    m.registry.setAllDisplay('solid');
    m.update(stateWith(), 1 / 60, view());
    for (const id of ['machine-tower', 'block-yard']) {
      const mesh = m.registry.get(id)!.meshes[0]!;
      expect(mesh.material, id).toBe(mesh.userData.solidMaterial);
    }
  });

  it('D51. No vertex of the land is left without a ground: all weights at zero is the black burn', () => {
    const ground = (mod as unknown as { scene: THREE.Scene }).scene.getObjectByName('terrain-ground') as
      THREE.Mesh | undefined;
    let mesh = ground;
    if (!mesh)
      mod.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.geometry?.attributes?.aMix) mesh = m;
      });
    const mix = mesh!.geometry.attributes.aMix!;
    let empty = 0;
    for (let i = 0; i < mix.count; i++) if (mix.getX(i) + mix.getY(i) + mix.getZ(i) < 0.01) empty++;
    expect(empty).toBe(0);
  });

  it('D52. The ghost counts in towers only for the farm’s machine, in its label and in what it draws', () => {
    const lab = ghostLabel({ ghostTonnes: 612, ghostTowers: 48929.7 }, 3, false);
    expect(lab.fr).toBe('612 t*, pour 3 kWh*');
    expect(lab.en).toBe('612 t*, for 3 kWh*');
    const p = { ...new GravitySim().params };
    const m = createSiteScene(() => p);
    const st = stateWith({ zFraction: 0.2, ghostTonnes: 128, ghostBlocks: 89, ghostTowers: 6.4 });
    for (let i = 0; i < 10; i++) m.update(st, 0.1, view({ schematic: true }));
    expect(m.ghost.towers.count).toBe(7);
    expect(m.ghost.label.fr).toContain('tours');
    p.machine = 'gravitylight';
    for (let i = 0; i < 10; i++) m.update(st, 0.1, view({ schematic: true }));
    expect(m.ghost.towers.count).toBe(0);
    expect(m.ghost.label.fr).not.toContain('tours');
  });
});
