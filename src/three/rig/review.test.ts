import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GravitySim } from '../../sim/engine';
import { G } from '../../sim/machine';
import {
  DECK_TOP,
  DRUM_R,
  DRUM_Z,
  GEARS,
  HOIST,
  HOOK_BLOCK,
  MOTOR_Z,
  ROPE_R,
  RULER_ZERO,
  SCALE,
  SITE,
  STROKE,
  TOWER,
  liftAt,
} from '../dims';
import { createHoistScene, FRAMING as HOIST_FRAMING } from '../hoist/scene';
import { SITE_MACHINE, createSiteScene, ghostLabel } from '../site/scene';
import { planVegetation } from '../site/vegetation';
import { boxOf, isolateOne, stateWith, view, world } from '../test-utils';
import { fitTangent } from '../world';
import { createTowerScene, FRAMING as TOWER_FRAMING, TOWER_CAMERA, TOWER_FOG } from '../tower/scene';
import { WORLD } from '../index';
import { CAP_LIFT, STAGE_CAP, type CutRect } from './hoist';
import { buildMachine, type Machine } from './machine';
import { modelOf, rulerPlan } from './ruler';
import { partPoints } from './sight';

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

describe('D42. What is named can be seen, wherever the weight is', () => {
  const t = createTowerScene();
  const S = Math.sin((20 * Math.PI) / 180);
  /** Where the kit puts the camera for this part at this padding. */
  const eyeOf = (id: string, padding: number): { eye: THREE.Vector3; box: THREE.Box3 } => {
    const e = t.registry.get(id)!;
    const box = t.registry.frameBounds(id);
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
    const eye = box
      .getCenter(new THREE.Vector3())
      .addScaledVector(e.viewDir!.clone().normalize(), (radius * padding) / S);
    return { eye, box };
  };
  /** A ray to each point: does anything but the part itself stop it? Everything counts here, the hoist too. */
  const seen = (id: string, eye: THREE.Vector3, points: THREE.Vector3[]): number => {
    t.scene.updateMatrixWorld(true);
    const own = new Set<THREE.Object3D>(t.registry.get(id)!.meshes);
    const solids: THREE.Object3D[] = [];
    t.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || own.has(m)) return;
      for (let q: THREE.Object3D | null = m; q; q = q.parent) if (!q.visible) return;
      if ((m.material as THREE.Material).transparent) return;
      solids.push(m);
    });
    const rc = new THREE.Raycaster();
    let n = 0;
    for (const p of points) {
      const dir = p.clone().sub(eye);
      const dist = dir.length();
      rc.set(eye, dir.normalize());
      rc.far = dist - 0.03;
      if (rc.intersectObjects(solids, false).length === 0) n++;
    }
    return n / points.length;
  };
  /** Points along the falls, inside what the frame holds. */
  const onFalls = (box: THREE.Box3): THREE.Vector3[] => {
    const out: THREE.Vector3[] = [];
    for (const f of t.machine.rope.ends)
      for (let i = 0; i <= 40; i++) {
        const p = f.a.clone().lerp(f.b, i / 40);
        if (box.containsPoint(p)) out.push(p);
      }
    return out.filter((_, i) => i % 3 === 0);
  };
  /** Points along the rope wound on the drum, as far as it is drawn, inside what the frame holds. */
  const onDrum = (box: THREE.Box3): THREE.Vector3[] => {
    const w = t.machine.hoist.wound;
    w.updateWorldMatrix(true, false);
    const pos = w.geometry.attributes.position as THREE.BufferAttribute;
    const count = w.geometry.index
      ? Math.min(pos.count, (w.geometry.drawRange.count * pos.count) / w.geometry.index.count)
      : pos.count;
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < count; i += 37) {
      const p = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(w.matrixWorld);
      if (box.containsPoint(p)) out.push(p);
    }
    return out;
  };

  it('the hook block, from where it is asked for, at every height of the stroke and at both framings', () => {
    for (let k = 0; k <= 25; k++) {
      const z = k / 25;
      t.update(stateWith({ zFraction: z }), 1 / 60, view());
      t.scene.updateMatrixWorld(true);
      for (const padding of [2.4, 1.9]) {
        const { eye } = eyeOf('hook-block', padding);
        const points = partPoints(t.registry.get('hook-block')!.meshes, 30)();
        expect(seen('hook-block', eye, points), `${z} ${padding}`).toBeGreaterThan(0.6);
      }
      expect(t.registry.get('hook-block')!.viewDir!.y, 'the camera cannot go lower').toBeGreaterThan(-0.1);
    }
  });

  it('under the head frame, the falls just above the block; above it, the rope on the drum', () => {
    for (let k = 0; k <= 25; k++) {
      const z = k / 25;
      t.update(stateWith({ zFraction: z }), 1 / 60, view());
      t.scene.updateMatrixWorld(true);
      const high = z > 0.9;
      for (const padding of [2.4, 1.9]) {
        const { eye, box } = eyeOf('hoist-rope', padding);
        // half of each turn of the rope lies behind the drum: what counts is the half that faces the camera
        const axis = t.machine.drumAxisInRoot();
        const facing = (p: THREE.Vector3) => (p.y - axis.y) * (eye.y - axis.y) + (p.z - axis.z) * (eye.z - axis.z) > 0;
        const points = high ? onDrum(box).filter(facing) : onFalls(box);
        expect(points.length, `${z}`).toBeGreaterThan(4);
        expect(seen('hoist-rope', eye, points), `${z} ${padding}`).toBeGreaterThan(0.5);
      }
    }
  });

  it('what is wound on the drum is the rope here: outlined, picked and isolated with it; and only here', () => {
    const wound = t.machine.hoist.wound;
    expect(t.registry.get('hoist-rope')!.meshes).toContain(wound);
    expect(t.registry.get('head-frame')!.meshes).not.toContain(wound);
    expect(t.registry.partOf(wound)).toBe('hoist-rope');
    const h = createHoistScene();
    expect(h.registry.get('rope-drum')!.meshes).toContain(h.machine.hoist.wound);
  });

  it('the rope’s name stays on the rope, wherever the weight is', () => {
    const dot = t.hotspots.find((h) => h.partId === 'hoist-rope')!.anchor;
    for (const z of [0, 0.3, 0.6, 0.85, 0.9, 0.95, 1]) {
      t.update(stateWith({ zFraction: z }), 1 / 60, view());
      t.scene.updateMatrixWorld(true);
      const p = world(dot);
      const [f1] = t.machine.rope.ends;
      const axis = t.machine.drumAxisInRoot();
      const onFall1 = new THREE.Line3(f1.a, f1.b).closestPointToPoint(p, true, new THREE.Vector3()).distanceTo(p);
      const onTheDrum = Math.abs(Math.hypot(p.y - axis.y, p.z - axis.z) - DRUM_R);
      expect(Math.min(onFall1, onTheDrum), `at ${z}`).toBeLessThan(0.03);
      // and on what is drawn: on the winding, beyond where the rope leaves the drum
      if (onFall1 > 0.03) expect(p.x, `at ${z}`).toBeGreaterThan(f1.a.x);
    }
  });

  it('a part keeps its direction when asked to in a page, for a try', () => {
    const e = t.registry.get('hook-block')!;
    const before = e.viewDir;
    e.viewDir = new THREE.Vector3(0, 1, 0);
    expect(e.viewDir.y).toBe(1);
    e.viewDir = undefined;
    expect(e.viewDir).toBeDefined();
    expect(before).toBeDefined();
  });
});

describe('D43. A click never inherits the direction of the part before it', () => {
  it.each([
    ['tower', () => createTowerScene()],
    ['hoist', () => createHoistScene()],
  ])('every part of the %s world says where it is seen from', (_, make) => {
    const w = make();
    w.update(stateWith({ zFraction: 0.3 }), 1 / 60, view());
    for (const id of w.registry.ids()) expect(w.registry.get(id)!.viewDir, id).toBeDefined();
  });
});

describe('D7. The ruler carries its figures, and they stay true to the model', () => {
  const plan = (mass: number, stroke: number) => rulerPlan(stroke, (mass * G * stroke) / 3600);

  it('the farm: metres every 5 m, watt-hours every 200 Wh, and what the sheet says at the top', () => {
    const p = plan(20000, 20);
    expect(p.metres.map((f) => f.text)).toEqual(['0', '5', '10', '15', '20']);
    expect(p.energy.map((f) => f.text)).toEqual(['0', '200', '400', '600', '800', '1000', '1090']);
    expect(new Set(p.metres.map((f) => f.unit))).toEqual(new Set(['m']));
    expect(new Set(p.energy.map((f) => f.unit))).toEqual(new Set(['Wh†']));
    // a metre band a metre, one band for 100 Wh
    expect(p.metreBands.length).toBe(21);
    expect(p.energyBands.length).toBe(11);
  });

  it('each figure stands where the model has that height and that energy', () => {
    for (const [mass, stroke] of [
      [20000, 20],
      [10000, 20],
      [20000, 7],
      [1000, 6],
      [12.5, 1.8],
      [34100, 42],
      [500000, 500],
      [367e6, 100],
      [25e9, 294],
    ] as const) {
      const p = plan(mass, stroke);
      for (const f of p.metres) expect(Number(f.text), `${mass} ${stroke}`).toBeCloseTo(f.f * stroke, 3);
      const full = (mass * G * stroke) / 3600;
      const unit = { 'mWh†': 1e-3, 'Wh†': 1, 'kWh†': 1e3, 'MWh†': 1e6, 'GWh†': 1e9 }[p.energy[0]!.unit]!;
      for (const f of p.energy)
        expect(Math.abs(Number(f.text) * unit - f.f * full), `${mass} ${stroke}`).toBeLessThan(0.5 * unit + 1e-9);
      // whole numbers only, at every machine: no decimal mark to get wrong in either language
      for (const f of [...p.metres, ...p.energy]) expect(f.text, `${mass} ${stroke}`).toMatch(/^\d+$/);
      expect(p.energy.length).toBeGreaterThanOrEqual(2);
      expect(p.metres.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('it reads the state: another mass or another stroke, another ruler, and the index on the carrier reads the height and the energy', () => {
    const m = buildMachine();
    const sim = new GravitySim();
    for (let i = 0; i < 6; i++) sim.step(1 / 60);
    m.update(sim.state, 1 / 60, view());
    expect(m.ruler.plan.energy.map((f) => f.text)).toContain('1090');
    sim.set({ mass: 10000 });
    for (let i = 0; i < 6; i++) sim.step(1 / 60);
    m.update(sim.state, 1 / 60, view());
    expect(m.ruler.plan.energy.map((f) => f.text)).toContain('500');
    expect(m.ruler.plan.energy.map((f) => f.text)).not.toContain('1090');

    const known = { mass: 20000 };
    expect(
      modelOf({ z: 0, fallLength: 20.83, storedWh: 0, ghostTonnes: 128, ghostTowers: 6.4 }, known).fullWh,
    ).toBeCloseTo(1090, 0);
    expect(
      modelOf({ z: 10, fallLength: 10.83, storedWh: 272.5, ghostTonnes: 0, ghostTowers: 0 }, known).fullWh,
    ).toBeCloseTo(545, 0);
    expect(modelOf({ z: 0, fallLength: 6.83, storedWh: 0, ghostTonnes: 0, ghostTowers: 0 }, known).strokeM).toBeCloseTo(
      6,
      6,
    );
  });

  it('the index on the carrier stands on the zero at the bottom and on the last figure at the top', () => {
    const m = buildMachine();
    const tip = (z: number) => {
      m.update(stateWith({ zFraction: z }), 1 / 60, view());
      m.root.updateMatrixWorld(true);
      return liftAt(z) + RULER_ZERO;
    };
    expect(tip(0)).toBeCloseTo(RULER_ZERO, 6);
    expect(tip(1)).toBeCloseTo(RULER_ZERO + STROKE, 6);
    const carrier = boxOf(m.parts['weight-carrier']);
    const ruler = boxOf(m.parts['height-scale']);
    expect(ruler.max.y).toBeGreaterThan(RULER_ZERO + STROKE);
    expect(ruler.min.y).toBeLessThan(RULER_ZERO);
    expect(carrier.max.z).toBeGreaterThan(SCALE.z);
  });

  it('no figure stands behind the leg, nor reaches the shaft where the carrier runs', () => {
    const m = buildMachine();
    m.update(stateWith({ zFraction: 0.5 }), 1 / 60, view());
    const b = boxOf(m.parts['height-scale']);
    expect(b.max.x).toBeLessThan(TOWER.legX - TOWER.legSide / 2);
    expect(b.min.z).toBeGreaterThan(0.876 + 0.3);
  });
});

describe('D57. The paint line the rope anchor’s sheet tells of', () => {
  it('stands on the rope at the socket’s mouth, a little thicker than the rope, a hand long, in the exploded view too', () => {
    const m = buildMachine();
    m.update(stateWith({ zFraction: 0.4 }), 1 / 60, view());
    m.root.updateMatrixWorld(true);
    const b = boxOf(m.rope.paintLine);
    const mouth = world(m.hoist.anchorMouth);
    expect(b.clone().expandByScalar(0.002).containsPoint(mouth)).toBe(true);
    const size = b.getSize(new THREE.Vector3());
    expect(size.y).toBeGreaterThan(0.05);
    expect(size.y).toBeLessThan(0.12);
    expect(size.x).toBeGreaterThan(2 * ROPE_R);
    const t = createTowerScene();
    t.registry.setAllFactors(1);
    t.update(stateWith({ zFraction: 0.4 }), 1 / 60, view());
    t.scene.updateMatrixWorld(true);
    expect(
      boxOf(t.machine.rope.paintLine).clone().expandByScalar(0.002).containsPoint(world(t.machine.hoist.anchorMouth)),
    ).toBe(true);
  });
});

describe('D56. The pad and the head frame read when selected', () => {
  it('each frames a part of itself, nearer than its whole box allows', () => {
    const t = createTowerScene();
    t.update(stateWith({ zFraction: 0.2 }), 1 / 60, view());
    t.scene.updateMatrixWorld(true);
    for (const id of ['foundation-pad', 'head-frame']) {
      const e = t.registry.get(id)!;
      const r = e.frame!.getBoundingSphere(new THREE.Sphere()).radius;
      const whole = boxOf(e.object).getBoundingSphere(new THREE.Sphere()).radius;
      expect(r, id).toBeLessThan(0.75 * whole);
      expect(boxOf(e.object).intersectsBox(e.frame!), id).toBe(true);
    }
  });
});

describe('The recheck of 3 November: D59, D60, D61, D63', () => {
  /** Rays from `eye` to `points`, stopped by anything shown but the part itself; everything counts, the hoist too. */
  const seenFrom = (
    t: ReturnType<typeof createTowerScene>,
    id: string,
    eye: THREE.Vector3,
    points: THREE.Vector3[],
  ) => {
    t.scene.updateMatrixWorld(true);
    const own = new Set<THREE.Object3D>(t.registry.get(id)!.meshes);
    const solids: THREE.Object3D[] = [];
    t.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || own.has(m)) return;
      for (let q: THREE.Object3D | null = m; q; q = q.parent) if (!q.visible) return;
      if ((m.material as THREE.Material).transparent) return;
      solids.push(m);
    });
    const rc = new THREE.Raycaster();
    let n = 0;
    for (const p of points) {
      const dir = p.clone().sub(eye);
      const dist = dir.length();
      rc.set(eye, dir.normalize());
      rc.far = dist - 0.03;
      if (rc.intersectObjects(solids, false).length === 0) n++;
    }
    return n / points.length;
  };
  /** A camera with a panel 310 px wide beside a view of 690 × 902, the 768 × 1024 layout. */
  const narrowCamera = () => {
    const c = new THREE.PerspectiveCamera(40, 690 / 902);
    c.setViewOffset(690, 902, 155, 0, 690, 902);
    return c;
  };
  const eyeFor = (t: ReturnType<typeof createTowerScene>, id: string, tan: number, padding: number) => {
    const box = t.registry.frameBounds(id);
    const r = box.getBoundingSphere(new THREE.Sphere()).radius;
    return box
      .getCenter(new THREE.Vector3())
      .addScaledVector(t.registry.get(id)!.viewDir!.clone().normalize(), (r * padding) / (tan / Math.hypot(1, tan)));
  };
  const TAN = Math.tan((20 * Math.PI) / 180);

  it('D59. With the weight at the top, the 20 m and the 1090 Wh are both in the frame and in sight, at both framings, wide and narrow', () => {
    const t = createTowerScene();
    t.update(stateWith({ zFraction: 1 }), 1 / 60, view());
    t.scene.updateMatrixWorld(true);
    const reading = t.machine.ruler.reading(1, true);
    const frame = t.registry.frameBounds('height-scale');
    for (const p of reading.points) expect(frame.containsPoint(p)).toBe(true);
    for (const camera of [undefined, narrowCamera()]) {
      t.sight.camera = camera;
      const tan = camera ? fitTangent(camera) : TAN;
      for (const padding of [2.4, 1.9])
        expect(
          seenFrom(t, 'height-scale', eyeFor(t, 'height-scale', tan, padding), reading.points),
        ).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('D59. The ruler’s frame goes with the index, whatever the height, and holds a figure of each kind', () => {
    const t = createTowerScene();
    for (const z of [0, 0.25, 0.5, 0.75, 1]) {
      t.update(stateWith({ zFraction: z }), 1 / 60, view());
      const frame = t.registry.frameBounds('height-scale');
      const index = RULER_ZERO + z * STROKE;
      // the index, or at most half the distance between two figures from it
      expect(Math.min(Math.abs(frame.min.y - index), Math.abs(frame.max.y - index)), `${z}`).toBeLessThan(2.6);
      const size = frame.getSize(new THREE.Vector3());
      expect(size.y, `${z}`).toBeLessThan(2);
      // D63: small enough to be read on a phone
      expect(frame.getBoundingSphere(new THREE.Sphere()).radius, `${z}`).toBeLessThan(1.1);
      const dot = world(t.hotspots.find((h) => h.partId === 'height-scale')!.anchor);
      expect(frame.clone().expandByScalar(0.1).containsPoint(dot), `${z}`).toBe(true);
    }
  });

  it('D60. A selected part’s name stands in what is framed', () => {
    const t = createTowerScene();
    for (const z of [0, 0.3, 0.6, 1]) {
      t.update(stateWith({ zFraction: z }), 1 / 60, view());
      t.scene.updateMatrixWorld(true);
      for (const id of ['tower-leg', 'service-ladder', 'guide-rail', 'tower-bracing']) {
        const dot = world(t.hotspots.find((h) => h.partId === id)!.anchor);
        expect(t.registry.frameBounds(id).clone().expandByScalar(0.1).containsPoint(dot), `${id} at ${z}`).toBe(true);
      }
    }
  });

  it('D61. A narrow view stands more than twice as far: the sight is tested from there', () => {
    expect(fitTangent(new THREE.PerspectiveCamera(40, 1280 / 800))).toBeCloseTo(TAN, 5);
    const c = narrowCamera();
    expect(fitTangent(c) / TAN).toBeCloseTo(380 / 902, 3);
    const t = createTowerScene();
    t.sight.camera = c;
    for (const z of [0, 0.25, 0.5, 0.75, 1]) {
      t.update(stateWith({ zFraction: z }), 1 / 60, view());
      t.scene.updateMatrixWorld(true);
      const points = partPoints(t.registry.get('hook-block')!.meshes, 30)();
      for (const padding of [2.4, 1.9])
        expect(
          seenFrom(t, 'hook-block', eyeFor(t, 'hook-block', fitTangent(c), padding), points),
          `${z} ${padding}`,
        ).toBeGreaterThan(0.6);
    }
  });
});
