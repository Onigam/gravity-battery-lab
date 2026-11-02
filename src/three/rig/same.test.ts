import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createHoistScene } from '../hoist/scene';
import { HOIST_PARTS } from './hoist';
import { buildMachine, TOWER_PARTS } from './machine';
import { SITE_MACHINE, createSiteScene } from '../site/scene';
import { createTowerScene } from '../tower/scene';
import { boxOf, drawStats, finiteTree, stateWith, view } from '../test-utils';
import { createPowerroomScene } from '../powerroom/scene';
import { DECK_TOP, DECK_Y0, FOOT_X, HOIST, STROKE } from '../dims';
import { GravitySim } from '../../sim/engine';

// One machine, the same everywhere (lab-quality §2): the site, the tower and the hoist worlds build it with the same function, at the same place. Each shared part is measured
// in each world and compared within 3 mm, in two poses of the lift.

const sim = new GravitySim();
const TOL = 0.003;

const close = (a: THREE.Box3, b: THREE.Box3, tol: number, name: string) => {
  for (const k of ['x', 'y', 'z'] as const) {
    expect(Math.abs(a.min[k] - b.min[k]), `${name} min ${k}`).toBeLessThan(tol);
    expect(Math.abs(a.max[k] - b.max[k]), `${name} max ${k}`).toBeLessThan(tol);
  }
};

describe('the same machine in the three worlds', () => {
  // the site's machine, part by part: its parts are the same function's with the same options, before everything that stands still is baked (the bake is tested below)
  const site = buildMachine({ ...SITE_MACHINE, flat: false });
  const tower = createTowerScene();
  const hoist = createHoistScene();
  for (const z of [0, 0.62]) {
    const s = stateWith({ zFraction: z });
    for (const id of TOWER_PARTS) {
      it(`${id} at lift ${z}: site = tower = hoist`, () => {
        site.update(s, 1 / 60, view());
        tower.update(s, 1 / 60, view());
        hoist.update(s, 1 / 60, view());
        const t = boxOf(tower.machine.parts[id]);
        close(boxOf(site.parts[id]), t, TOL, `${id} in the site`);
        close(boxOf(hoist.machine.parts[id]), t, TOL, `${id} in the hoist world`);
      });
    }
    for (const id of HOIST_PARTS) {
      it(`${id} at lift ${z}: the same three times`, () => {
        site.update(s, 1 / 60, view());
        tower.update(s, 1 / 60, view());
        hoist.update(s, 1 / 60, view());
        const t = boxOf(tower.machine.hoist.parts[id]);
        close(boxOf(site.hoist.parts[id]), t, TOL, `${id} in the site`);
        close(boxOf(hoist.machine.hoist.parts[id]), t, TOL, `${id} in the hoist world`);
      });
    }
  }

  it("baking the site's machine changes the draw calls, not the machine: same triangles, same bounds", () => {
    const flat = createSiteScene(() => sim.params).machine;
    const s = stateWith({ zFraction: 0.3 });
    flat.update(s, 1 / 60, view());
    site.update(s, 1 / 60, view());
    const a = boxOf(flat.root);
    const b = boxOf(site.root);
    close(a, b, TOL, 'the machine');
    const tris = (o: THREE.Object3D) => {
      let n = 0;
      o.traverse((c) => {
        const m = c as THREE.Mesh;
        if (!m.isMesh || !m.geometry) return;
        const g = m.geometry;
        n += (g.index ? g.index.count : g.attributes.position.count) / 3;
      });
      return n;
    };
    expect(tris(flat.root)).toBe(tris(site.root));
    expect(drawStats(flat.root).calls).toBeLessThan(0.7 * drawStats(site.root).calls);
  });

  it('the part is not redrawn simpler: the same number of meshes of the hoist in each world', () => {
    const count = (o: THREE.Object3D) => {
      let n = 0;
      o.traverse((c) => {
        if ((c as THREE.Mesh).isMesh && !c.userData.cap) n++;
      });
      return n;
    };
    // only the rope wound on the drum is coarser on the site, in its segments, not in its length
    expect(count(site.hoist.root)).toBe(count(tower.machine.hoist.root));
  });

  it('the wound rope is the same length whatever its detail', () => {
    const coarse = buildMachine({ windingDetail: [12, 4] });
    const fine = buildMachine({ windingDetail: [28, 6] });
    const s = stateWith({ zFraction: 0.4 });
    coarse.update(s, 1 / 60, view());
    fine.update(s, 1 / 60, view());
    expect(Math.abs(coarse.drawn.woundM - fine.drawn.woundM)).toBeLessThan(1e-6);
    expect(Math.abs(coarse.drawn.departureX - fine.drawn.departureX)).toBeLessThan(1e-6);
  });
});

describe('the machine holds together through every scenario and preset of the physics', () => {
  const m = buildMachine();
  const room = createPowerroomScene();
  const siteWorld = createSiteScene(() => live.params);
  const live = new GravitySim();
  const attached = () => {
    const [f1, f2, f3, f4] = m.rope.ends;
    expect(f1.b.distanceTo(f2.a)).toBeCloseTo(0.36, 3);
    expect(f2.b.distanceTo(f3.a)).toBeCloseTo(0.36, 3);
    expect(f3.b.distanceTo(f4.a)).toBeCloseTo(0.36, 3);
    expect(f1.a.y).toBeCloseTo(DECK_TOP + HOIST.axisY, 3);
  };
  const run = (steps: number) => {
    for (let i = 0; i < steps; i++) {
      live.step(1 / 30);
      m.update(live.state, 1 / 30, view());
      room.update(live.state, 1 / 30, view({ schematic: true }));
      siteWorld.update(live.state, 1 / 30, view({ schematic: true }));
    }
  };
  it.each([
    'sunny-day',
    'kettle',
    'fridge-direct',
    'fridge-buffer',
    'night',
    'too-light',
    'blackout',
    'overspeed',
    'wind-stop',
    'race',
  ])('scenario %s', (id) => {
    live.applyScenario(id);
    run(90);
    attached();
    expect(finiteTree(m.root)).toBe(true);
    expect(finiteTree(room.scene)).toBe(true);
    expect(m.drawn.lift).toBeGreaterThanOrEqual(0);
    expect(m.drawn.lift).toBeLessThanOrEqual(STROKE);
    expect(m.drawn.departureX).toBeGreaterThan(FOOT_X[0]);
    expect(m.drawn.departureX).toBeLessThan(FOOT_X[1]);
  });
  it.each(['farm', 'garden', 'diy', 'gravitylight', 'leith', 'swiss', 'shaft', 'rudong', 'nant'])('preset %s', (id) => {
    live.applyPreset(id);
    run(30);
    attached();
    expect(finiteTree(m.root)).toBe(true);
  });
  it('the blocks come off the top as the mass falls, and the stack stays on the deck', () => {
    live.applyPreset('farm');
    live.set({ mass: 8000 });
    run(4);
    expect(m.drawn.blocks).toBeLessThan(6);
    expect(m.drawn.stackTop).toBeLessThan(DECK_Y0 + 2.8);
    expect(m.drawn.stackTop).toBeGreaterThan(DECK_Y0);
    live.applyPreset('farm');
    run(2);
    expect(m.drawn.stackTop).toBeCloseTo(DECK_Y0 + 2.8, 5);
  });
  it('the fall of the overspeed scenario: the weight comes down and the wedges set', () => {
    live.applyScenario('overspeed');
    run(240);
    expect(live.state.safetyGearSet).toBe(true);
    m.update(live.state, 1, view());
    expect(m.parts['safety-gear'].getObjectByName('wedge')!.position.y).toBeGreaterThan(0.03);
  });
});

describe('budgets', () => {
  const site = createSiteScene(() => sim.params);
  const tower = createTowerScene();
  const hoist = createHoistScene();
  it.each([
    ['site', site, 220, 400000],
    ['tower', tower, 170, 180000],
    ['hoist', hoist, 170, 180000],
  ] as const)('%s stays inside its budget', (_, mod, calls, tris) => {
    mod.update(stateWith({ zFraction: 0.3 }), 1 / 60, view());
    const st = drawStats(mod.scene);
    // eslint-disable-next-line no-console
    console.log(`${mod.id}: ${st.calls} calls, ${Math.round(st.triangles)} triangles`);
    expect(st.calls).toBeLessThan(calls);
    expect(st.triangles).toBeLessThan(tris);
  });
});
