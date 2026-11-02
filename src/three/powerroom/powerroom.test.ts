import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DC_LINK_V } from '../../sim/machine';
import { DEVICE, MODULE, SHED, SHELF } from '../dims';
import { boxOf, drawStats, finiteTree, stateWith, view } from '../test-utils';
import { POWER_PARTS } from './parts';
import { createPowerroomScene } from './scene';

const mod = createPowerroomScene();
mod.update(stateWith(), 1 / 60, view());

describe('the devices of the power room', () => {
  it('has the fourteen parts of the research, no more', () => {
    expect(mod.registry.ids().sort()).toEqual([...POWER_PARTS].sort());
    expect(POWER_PARTS.length).toBe(14);
  });

  it('every device stays inside the room', () => {
    for (const id of POWER_PARTS) {
      const b = boxOf(mod.registry.get(id)!.object);
      expect(b.min.x, id).toBeGreaterThan(-SHED.w / 2 - 0.001);
      expect(b.max.x, id).toBeLessThan(SHED.w / 2 + 0.001);
      expect(b.min.z, id).toBeGreaterThan(-0.002);
      expect(b.max.y, id).toBeLessThan(SHED.h + 0.001);
    }
  });

  it('every device is on the wall or the floor, nothing floats', () => {
    const wall = (id: string) => boxOf(mod.registry.get(id)!.object).min.z;
    for (const id of [
      'pv-inverter',
      'energy-meter',
      'ac-panel',
      'brake-chopper',
      'brake-resistor',
      'safety-controller',
      'battery-inverter',
    ])
      expect(Math.abs(wall(id)), id).toBeLessThan(0.006);
    for (const id of ['regen-supply', 'dc-link', 'motor-inverter', 'control-ups'])
      expect(Math.abs(boxOf(mod.registry.get(id)!.object).min.y), id).toBeLessThan(0.002);
    expect(boxOf(mod.registry.get('emergency-stop')!.object).max.x).toBeCloseTo(SHED.w / 2, 3);
  });

  it('the module stands on its shelf, at the size of the data sheet', () => {
    const g = mod.registry.get('lfp-module')!.object;
    // the shelf's top and the module's foot
    const b = boxOf(g);
    expect(Math.abs(b.min.y)).toBeLessThan(0.002);
    expect(MODULE.h).toBeCloseTo(0.162, 3);
    expect(MODULE.w).toBeCloseTo(0.442, 3);
    expect(MODULE.d).toBeCloseTo(0.42, 3);
    expect(SHELF.d).toBeGreaterThan(MODULE.d);
  });

  it('every conduit lands on the box it serves', () => {
    expect(mod.pieces.landings.length).toBeGreaterThanOrEqual(12);
    for (const { id, point } of mod.pieces.landings) {
      const b = boxOf(mod.registry.get(id)!.object);
      expect(b.clone().expandByScalar(0.01).containsPoint(point), `${id} at ${point.toArray()}`).toBe(true);
    }
  });

  it('the three cabinets stand side by side without touching', () => {
    const order = [DEVICE.regenSupply, DEVICE.dcLink, DEVICE.motorInverter];
    for (let i = 1; i < 3; i++)
      expect(order[i].x - order[i].w / 2).toBeGreaterThan(order[i - 1].x + order[i - 1].w / 2);
  });
});

describe('the state drives the room', () => {
  it('the link stays lit after the power goes, in proportion to its volts', () => {
    mod.update(stateWith({ dcVolts: DC_LINK_V, flowDirection: 0 }), 1 / 60, view());
    const lit = mod.pieces.ledDc.emissiveIntensity;
    expect(lit).toBeGreaterThan(1);
    mod.update(stateWith({ dcVolts: 20, flowDirection: 0 }), 1 / 60, view());
    expect(mod.pieces.ledDc.emissiveIntensity).toBe(0);
  });

  it('the resistor glows only with the chopper', () => {
    mod.update(stateWith({ chopperPower: 0 }), 1 / 60, view());
    expect(mod.pieces.coils.emissiveIntensity).toBe(0);
    mod.update(stateWith({ chopperPower: 13000 }), 1 / 60, view());
    expect(mod.pieces.coils.emissiveIntensity).toBeGreaterThan(2);
  });

  it('the bars of the module count its state of charge', () => {
    const on = () => mod.pieces.socBars.filter((b) => b.emissiveIntensity > 0.5).length;
    mod.update(stateWith({ soc: 0.2, lfpPower: 0 }), 1 / 60, view());
    expect(on()).toBe(1);
    mod.update(stateWith({ soc: 0.8, lfpPower: 0 }), 1 / 60, view());
    expect(on()).toBe(4);
  });

  it('the flows reverse with the machine', () => {
    const v = view({ schematic: true });
    const before = new Float32Array(mod.flows.object.geometry.attributes.position.array as ArrayLike<number>);
    mod.update(stateWith({ flowDirection: 1, chain: { ...stateWith().chain, meter: 8000 } }), 0.1, v);
    const a = new Float32Array(mod.flows.object.geometry.attributes.position.array as ArrayLike<number>);
    mod.update(stateWith({ flowDirection: -1, chain: { ...stateWith().chain, meter: -8000 } }), 0.1, v);
    const b = new Float32Array(mod.flows.object.geometry.attributes.position.array as ArrayLike<number>);
    // back where it was, in the path of the drive: the second step undid the first
    const d = (x: Float32Array, y: Float32Array) => {
      let s = 0;
      for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]);
      return s;
    };
    expect(d(before, a)).toBeGreaterThan(0);
    expect(d(before, b)).toBeLessThan(d(before, a));
  });
});

it('budget and sanity of the room', () => {
  const st = drawStats(mod.scene);
  // eslint-disable-next-line no-console
  console.log(`power-room: ${st.calls} calls, ${Math.round(st.triangles)} triangles`);
  expect(st.calls).toBeLessThan(120);
  expect(st.triangles).toBeLessThan(60000);
  expect(finiteTree(mod.scene)).toBe(true);
  expect(new THREE.Vector3().length()).toBe(0);
});
