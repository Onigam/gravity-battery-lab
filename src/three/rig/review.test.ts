import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GravitySim } from '../../sim/engine';
import { DECK_TOP, DRUM_Z, GEARS, HOIST, HOOK_BLOCK, MOTOR_Z, ROPE_R, SITE, TOWER } from '../dims';
import { createHoistScene, FRAMING as HOIST_FRAMING } from '../hoist/scene';
import { SITE_MACHINE, createSiteScene, ghostLabel } from '../site/scene';
import { planVegetation } from '../site/vegetation';
import { boxOf, isolateOne, stateWith, view, world } from '../test-utils';
import { createTowerScene, FRAMING as TOWER_FRAMING, TOWER_CAMERA, TOWER_FOG } from '../tower/scene';
import { WORLD } from '../index';
import { CAP_LIFT, STAGE_CAP, type CutRect } from './hoist';
import { buildMachine, type Machine } from './machine';

// What the independent review found (docs/qa.md), held by tests so that it stays fixed: nothing standing in the void under isolate or exploded, the roof's posts gone with the roof, the
// groove drawn, the rope clear of the guide, a fog that spares the machine, a farm that stays on the ground, the rope's flows in the hoist world, gears that read in section.

const moving = () => stateWith({ zFraction: 0.4, motorBlur: true, drumAngle: 1, sheaveAngle: 1, v: 0.066 });

const allOn = (o: THREE.Object3D): boolean => {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
};

describe('D2. Isolate leaves nothing standing in the void', () => {
  it('tower: rope of the governor and motor cable go, the blur discs too, and come back', () => {
    const t = createTowerScene();
    isolateOne(t.registry, 'end-buffer', 'hidden');
    t.update(moving(), 1 / 60, view());
    expect(t.machine.governorRope.visible).toBe(false);
    expect(t.machine.riser.visible).toBe(false);
    expect(t.machine.hoist.blurFan.visible).toBe(false);
    for (const b of t.machine.hoist.blurGears) expect(b.visible).toBe(false);
    t.registry.setAllDisplay('solid');
    t.update(moving(), 1 / 60, view());
    expect(t.machine.governorRope.visible).toBe(true);
    expect(t.machine.riser.visible).toBe(true);
    expect(t.machine.hoist.blurFan.visible).toBe(true);
  });

  it('hoist: the rope goes too, it is no part here; the fan disc follows the motor, the gears discs the gearbox', () => {
    const h = createHoistScene();
    isolateOne(h.registry, 'hoist-gearbox', 'hidden');
    h.update(moving(), 1 / 60, view());
    expect(h.machine.governorRope.visible).toBe(false);
    expect(h.machine.riser.visible).toBe(false);
    expect(h.machine.rope.root.visible).toBe(false);
    expect(h.machine.hoist.blurFan.visible).toBe(false);
    isolateOne(h.registry, 'hoist-motor', 'hidden');
    h.update(moving(), 1 / 60, view());
    expect(h.machine.hoist.blurFan.visible).toBe(true);
    expect(h.machine.hoist.blurGears[0].visible).toBe(false);
    h.registry.setAllDisplay('solid');
    h.update(moving(), 1 / 60, view());
    expect(h.machine.rope.root.visible).toBe(true);
    expect(h.machine.governorRope.visible).toBe(true);
    expect(h.machine.hoist.blurFan.visible).toBe(true);
  });

  it('site: the ghost, its label and the flows stay out of an isolated part', () => {
    const sim = new GravitySim();
    const s = createSiteScene(() => sim.params);
    const big = stateWith({ zFraction: 0.2, ghostTonnes: 287, ghostBlocks: 201, ghostTowers: 14.3 });
    s.update(stateWith({ zFraction: 0.2, ghostTonnes: 128, ghostBlocks: 89, ghostTowers: 6.4 }), 0.1, view());
    for (let i = 0; i < 30; i++) s.update(big, 0.1, view({ schematic: true }));
    expect(s.ghost.blocks.visible).toBe(true);
    expect(s.flows.object.visible).toBe(true);
    isolateOne(s.registry, 'wind-mast', 'hidden');
    for (let i = 0; i < 30; i++) s.update(big, 0.1, view({ schematic: true }));
    expect(s.ghost.blocks.visible).toBe(false);
    expect(s.flows.object.visible).toBe(false);
    expect(s.machine.hoist.blurFan.visible).toBe(false);
  });
});

describe('D4. Exploded, what cannot follow its part does not stay behind', () => {
  it('tower: governor rope and cable leave, the rope stays on its sheaves and on the socket', () => {
    const t = createTowerScene();
    t.registry.setAllFactors(1);
    t.update(moving(), 1 / 60, view());
    expect(t.machine.governorRope.visible).toBe(false);
    expect(t.machine.riser.visible).toBe(false);
    expect(allOn(t.machine.rope.root)).toBe(true);
    const [f1, f2, f3, f4] = t.machine.rope.ends;
    const R = HOOK_BLOCK.sheaveR;
    expect(f1.b.distanceTo(f2.a)).toBeCloseTo(2 * R, 3);
    expect(f2.b.distanceTo(f3.a)).toBeCloseTo(2 * R, 3);
    expect(f3.b.distanceTo(f4.a)).toBeCloseTo(2 * R, 3);
    expect(f4.b.distanceTo(world(t.machine.hoist.anchorMouth))).toBeLessThan(0.003);
    t.registry.setAllFactors(0);
    t.update(moving(), 1 / 60, view());
    expect(t.machine.governorRope.visible).toBe(true);
    expect(t.machine.riser.visible).toBe(true);
  });

  it('hoist: the same, and the rope stays', () => {
    const h = createHoistScene();
    h.registry.setAllFactors(1);
    h.update(moving(), 1 / 60, view());
    expect(h.machine.governorRope.visible).toBe(false);
    expect(h.machine.riser.visible).toBe(false);
    expect(allOn(h.machine.rope.root)).toBe(true);
    expect(h.machine.rope.ends[3].b.distanceTo(world(h.machine.hoist.anchorMouth))).toBeLessThan(0.003);
  });
});

describe('D3. The roof takes its posts with it', () => {
  it('nothing of the head frame stands above its hand rails but the roof', () => {
    const m = buildMachine();
    m.update(stateWith({ zFraction: 0.2 }), 1 / 60, view());
    const head = m.parts['head-frame'];
    const box = new THREE.Box3();
    const walk = (o: THREE.Object3D) => {
      if (o === m.roof || o === m.hoist.root) return;
      if ((o as THREE.Mesh).isMesh) box.union(new THREE.Box3().setFromObject(o, true));
      for (const c of o.children) walk(c);
    };
    head.updateWorldMatrix(true, true);
    walk(head);
    expect(box.max.y).toBeLessThan(DECK_TOP + TOWER.rail + 0.05);
    // and the roof does carry them: from the deck to the eaves
    const roof = boxOf(m.roof);
    expect(roof.min.y).toBeLessThan(DECK_TOP + 0.01);
    expect(roof.max.y).toBeGreaterThan(TOWER.eavesY);
  });

  it('the hoist world has no roof, and looks from the motor’s side', () => {
    const h = createHoistScene();
    expect(h.machine.roof.visible).toBe(false);
    const dir = h.home.position.clone().sub(h.home.target);
    expect(dir.z).toBeGreaterThan(0);
    expect(dir.x).toBeGreaterThan(0);
    expect(dir.y).toBeGreaterThan(dir.length() * 0.7);
  });
});

describe('D5. The drum is grooved', () => {
  const barrel = (m: Machine): THREE.Mesh | undefined => {
    let found: THREE.Mesh | undefined;
    m.hoist.drumRot.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && (mesh.material as THREE.Material).name === 'grooved-barrel') found = mesh;
    });
    return found;
  };
  it.each([
    ['tower', {}],
    ['hoist', { clipped: true }],
    ['site', SITE_MACHINE],
  ])('in the %s world the barrel keeps its patched material, the merge leaves it alone', (_, o) => {
    const b = barrel(buildMachine(o));
    expect(b).toBeDefined();
    const mat = b!.material as THREE.MeshStandardMaterial;
    expect(mat.userData.noShare).toBe(true);
    expect(mat.customProgramCacheKey()).toContain('groove');
    expect(mat.vertexColors).toBe(false);
    b!.geometry.computeBoundingSphere();
    let onBarrel = 0;
    const p = b!.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) if (Math.abs(Math.hypot(p.getY(i), p.getZ(i)) - HOIST.barrelR) < 1e-3) onBarrel++;
    expect(onBarrel).toBeGreaterThan(40);
  });
});

describe('D21. Fall 1 touches nothing of the rope guide', () => {
  const m = buildMachine();
  it.each([0, 0.25, 0.5, 0.75, 1])('at %s of the stroke', (z) => {
    m.update(stateWith({ zFraction: z }), 1 / 60, view());
    m.root.updateMatrixWorld(true);
    const { a, b } = m.rope.ends[0];
    const dir = b.clone().sub(a).normalize();
    for (const dz of [-ROPE_R, 0, ROPE_R]) {
      const ray = new THREE.Raycaster(a.clone().setZ(a.z + dz), dir, 0, 1.2);
      const hits = ray.intersectObject(m.hoist.parts['rope-guide'], true);
      expect(hits.length, `offset ${dz}`).toBe(0);
    }
  });
});

describe('D1. The fog spares the machine', () => {
  it('from the camera’s limit the whole machine is nearer than the fog’s start, and the fog closes before the far plane', () => {
    const t = createTowerScene();
    t.update(stateWith({ zFraction: 0 }), 1 / 60, view());
    expect(t.maxDistance).toBe(TOWER_CAMERA.max);
    expect(t.far).toBe(TOWER_CAMERA.far);
    expect(t.near).toBe(TOWER_CAMERA.near);
    const dir = t.home.position.clone().sub(t.home.target).normalize();
    const cam = t.home.target.clone().addScaledVector(dir, t.maxDistance);
    const pad = boxOf(t.machine.parts['foundation-pad']);
    const farCorner = new THREE.Vector3(pad.min.x, pad.max.y, pad.min.z);
    expect(cam.distanceTo(farCorner)).toBeLessThan(TOWER_FOG[0]);
    expect(TOWER_FOG[1]).toBeLessThan(TOWER_CAMERA.far);
    const fog = t.scene.fog as THREE.Fog;
    expect(fog.near).toBe(TOWER_FOG[0]);
  });
});

describe('D8. The farm stays on the ground', () => {
  it('no explode tool in this world; a guide’s parts still drop in from their offsets', () => {
    expect(WORLD.site.explode).toBe(false);
    const sim = new GravitySim();
    const s = createSiteScene(() => sim.params);
    expect(s.registry.get('machine-tower')!.explode.y).toBeGreaterThan(0);
  });
});

describe('D13. Flows in the hoist world', () => {
  const positions = (h: ReturnType<typeof createHoistScene>) => {
    const a = h.flows.object.geometry.attributes.position;
    return Array.from({ length: h.flows.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(a, i));
  };
  it('off by default, on with the tool, off while a part is isolated', () => {
    const h = createHoistScene();
    h.update(moving(), 1 / 60, view());
    expect(h.flows.object.visible).toBe(false);
    h.update(moving(), 1 / 60, view({ schematic: true }));
    expect(h.flows.object.visible).toBe(true);
    isolateOne(h.registry, 'rope-drum', 'hidden');
    h.update(moving(), 1 / 60, view({ schematic: true }));
    expect(h.flows.object.visible).toBe(false);
  });

  it('every dot is where this world looks, on the rope, and the rope runs up to the drum while raising', () => {
    const h = createHoistScene();
    h.update(moving(), 1 / 60, view({ schematic: true }));
    const R = HOOK_BLOCK.sheaveR;
    const onFall = (p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) =>
      new THREE.Line3(a, b).closestPointToPoint(p, true, new THREE.Vector3()).distanceTo(p);
    const [f1, f2, f3, f4] = h.machine.rope.ends;
    const axisR = f3.a.clone().add(f2.b).multiplyScalar(0.5);
    const axisD = h.machine.drumAxisInRoot();
    for (const p of positions(h)) {
      expect(p.y).toBeGreaterThan(DECK_TOP - 0.51);
      const nearest = Math.min(
        onFall(p, f1.a, f1.b),
        onFall(p, f2.a, f2.b),
        onFall(p, f3.a, f3.b),
        onFall(p, f4.a, f4.b),
        Math.abs(p.distanceTo(axisR) - R),
        Math.abs(Math.hypot(p.y - axisD.y, p.z - axisD.z) - (axisD.z - f1.a.z)),
      );
      expect(nearest).toBeLessThan(0.002);
    }
    // the first path's dots are on fall 1 or on the drum: those on fall 1, below the drum's axis, rise while raising
    const before = positions(h)
      .slice(0, 14)
      .map((p) => p.clone());
    h.update(moving(), 0.05, view({ schematic: true }));
    const after = positions(h).slice(0, 14);
    const rises = before
      .map((p, i) => ({ p, q: after[i] }))
      .filter(({ p, q }) => p.y < axisD.y - 0.01 && q.y < axisD.y - 0.01)
      .map(({ p, q }) => q.y - p.y);
    expect(rises.length).toBeGreaterThan(0);
    for (const r of rises) expect(r).toBeGreaterThan(0);
  });

  it('in the tower world too, as before', () => {
    const t = createTowerScene();
    t.update(moving(), 1 / 60, view({ schematic: true }));
    expect(t.flows.object.visible).toBe(true);
    expect(t.flows.count).toBe(88);
  });
});

describe('D15. The ghost says what it is', () => {
  it('its label reads the state, in both languages, with its marks', () => {
    const lab = ghostLabel({ ghostTonnes: 128.2, ghostTowers: 6.41 }, 3);
    expect(lab.fr).toBe('128 t*, 6,4 tours*, pour 3 kWh*');
    expect(lab.en).toBe('128 t*, 6.4 towers*, for 3 kWh*');
    expect(ghostLabel({ ghostTonnes: 40, ghostTowers: 2 }, 7.5).en).toBe('40 t*, 2.0 towers*, for 7.5 kWh*');
  });

  it('the hotspot follows the state and stands over the stacks', () => {
    const sim = new GravitySim();
    const s = createSiteScene(() => sim.params);
    const st = stateWith({ zFraction: 0.2, ghostTonnes: 128, ghostBlocks: 89, ghostTowers: 6.4 });
    s.update(st, 0.1, view());
    for (let i = 0; i < 10; i++) s.update(st, 0.1, view({ schematic: true }));
    expect(s.ghost.label.fr).toContain('128 t*');
    expect(s.ghost.label.fr).toContain('6,4 tours*');
    const hot = s.hotspots.find((h) => h.anchor === s.ghost.anchor)!;
    expect(hot.partId).toBe('block-yard');
    expect(s.ghost.anchor.position.x).toBeCloseTo(SITE.ghost.x, 3);
    expect(s.ghost.anchor.position.y).toBeGreaterThan(2);
  });
});

describe('D19. Gears that read in section', () => {
  const m = buildMachine({ clipped: true });
  const rects = m.hoist.cuts['hoist-gearbox']!;
  const st = GEARS.stages;
  const inStage = (i: number) => rects.filter((r) => r[4] === STAGE_CAP[i]);
  it('one tone per stage, none the same', () => {
    expect(new Set(STAGE_CAP).size).toBe(3);
    for (let i = 0; i < 3; i++) expect(inStage(i).length).toBe(4);
  });

  it('a stage’s two wheels mesh on the pitch line: their teeth bands meet, and no two faces share a plane', () => {
    const flat = rects.filter((r) => (r[5] ?? 0) === 0);
    const overlap = (a: CutRect, b: CutRect) =>
      Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 1e-6 && Math.min(a[3], b[3]) - Math.max(a[2], b[2]) > 1e-6;
    for (let i = 0; i < flat.length; i++)
      for (let j = i + 1; j < flat.length; j++) expect(overlap(flat[i], flat[j]), `${i} and ${j}`).toBe(false);
    // the shafts: from the motor's axis, stage by stage, to the drum's
    let z = MOTOR_Z;
    st.forEach((s) => {
      z -= s.pinion + s.wheel;
    });
    expect(z).toBeCloseTo(DRUM_Z, 2);
    expect(rects.some((r) => r[5] === CAP_LIFT.shaft)).toBe(true);
    expect(rects.some((r) => r[5] === CAP_LIFT.hub)).toBe(true);
  });
});

describe('D6, D7. Selecting brings you close, in front of what you selected', () => {
  it('the worlds’ paddings hold what the review tried', () => {
    expect(WORLD.hoist.partPadding).toBe(1.4);
    expect(WORLD['power-room'].partPadding).toBe(1.8);
    expect(WORLD.site.partPadding).toBe(1.3);
  });

  it('what is too long to read whole frames a stretch of itself, inside the part', () => {
    const t = createTowerScene();
    t.update(stateWith({ zFraction: 0.3 }), 1 / 60, view());
    for (const id of ['tower-leg', 'tower-bracing', 'guide-rail', 'service-ladder', 'height-scale', 'hoist-rope']) {
      const e = t.registry.get(id)!;
      expect(e.frame, id).toBeDefined();
      const size = e.frame!.getSize(new THREE.Vector3());
      expect(Math.max(size.x, size.y, size.z), id).toBeLessThan(5);
      const whole = boxOf(e.object);
      expect(whole.intersectsBox(e.frame!), id).toBe(true);
    }
  });

  it('the rope’s frame follows the hook block, wherever the weight is', () => {
    const t = createTowerScene();
    for (const z of [0, 0.5, 1]) {
      t.update(stateWith({ zFraction: z }), 1 / 60, view());
      const hook = boxOf(t.machine.parts['hook-block']);
      expect(t.registry.get('hoist-rope')!.frame!.intersectsBox(hook), `at ${z}`).toBe(true);
    }
  });

  /** Rays from where the camera stands to points of the part: how many arrive. Merged meshes, so the points are vertices, spread over the part. */
  const reach = (
    mod: { scene: THREE.Scene; registry: ReturnType<typeof createTowerScene>['registry'] },
    id: string,
    distance: number,
  ): number => {
    mod.scene.updateMatrixWorld(true);
    const e = mod.registry.get(id)!;
    const box = e.frame ?? new THREE.Box3().setFromObject(e.object, true);
    const center = box.getCenter(new THREE.Vector3());
    const eye = center.clone().addScaledVector(e.viewDir!.clone().normalize(), distance);
    const own = new Set<THREE.Object3D>(e.meshes);
    const points: THREE.Vector3[] = [];
    const counts = e.meshes.map((m) => m.geometry.attributes.position.count);
    const total = counts.reduce((a, b) => a + b, 0);
    e.meshes.forEach((m, k) => {
      const n = Math.max(1, Math.round((60 * counts[k]) / total));
      const step = Math.max(1, Math.floor(counts[k] / n));
      for (let i = 0; i < counts[k]; i += step) {
        const w = new THREE.Vector3()
          .fromBufferAttribute(m.geometry.attributes.position, i)
          .applyMatrix4(m.matrixWorld);
        if (!e.frame || box.containsPoint(w)) points.push(w);
      }
    });
    const some = points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 16)) === 0);
    const rc = new THREE.Raycaster();
    let seen = 0;
    for (const p of some) {
      const dir = p.clone().sub(eye);
      const dist = dir.length();
      rc.set(eye, dir.normalize());
      rc.far = dist + 0.02;
      const shown = (o: THREE.Object3D) => {
        for (let q: THREE.Object3D | null = o; q; q = q.parent) if (!q.visible) return false;
        return true;
      };
      const hit = rc
        .intersectObjects(mod.scene.children, true)
        .find(
          (h) =>
            (h.object as THREE.Mesh).isMesh && shown(h.object) && !(h.object as THREE.InstancedMesh).isInstancedMesh,
        );
      if (!hit || own.has(hit.object) || hit.distance >= dist - 0.02) seen++;
    }
    return seen / some.length;
  };

  it('the parts the review could not see, from their own directions: at least half of the rays arrive', () => {
    const h = createHoistScene();
    h.update(stateWith({ zFraction: 0.2 }), 1 / 60, view());
    for (const [id, d] of [
      ['rope-anchor', 0.88],
      ['service-brake', 1.13],
      ['drum-brake', 1.47],
    ] as const)
      expect(reach(h, id, d), id).toBeGreaterThan(0.5);
    expect(Object.keys(HOIST_FRAMING).length).toBeGreaterThanOrEqual(5);
    const t = createTowerScene();
    t.update(stateWith({ zFraction: 0.2 }), 1 / 60, view());
    for (const [id, d] of [
      ['guide-shoe', 12.9],
      ['guide-rail', 9.7],
      ['stack-tie', 13.5],
    ] as const)
      expect(reach(t, id, d), id).toBeGreaterThan(0.5);
    expect(TOWER_FRAMING['safety-gear']?.viewDir).toBeDefined();
  });
});

describe('D33, D34. What reads as what it is', () => {
  it('no grass grows on the yard’s hard standing', () => {
    const plan = planVegetation();
    const y = SITE.yard;
    for (const list of [plan.tufts, plan.flowers])
      for (const t of list) {
        const inside = Math.abs(t.x - y.x) < y.w / 2 && Math.abs(t.z - y.z) < y.d / 2;
        expect(inside, `${t.x}, ${t.z}`).toBe(false);
      }
  });

  it('the encoder’s wire lies on the machine, it does not arch over it', () => {
    const m = buildMachine();
    m.update(stateWith({ zFraction: 0.2 }), 1 / 60, view());
    const b = boxOf(m.hoist.parts['motor-encoder']);
    expect(b.max.y).toBeLessThan(DECK_TOP + HOIST.axisY + HOIST.ribR + 0.06);
  });
});
