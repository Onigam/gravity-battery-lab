import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getLang, setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { GravitySim } from '../sim/engine';
import { isoLine, LADDER_BOX, RUNGS } from '../sim/ladder';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import {
  axisThroughZero,
  dayChartData,
  etaChartData,
  isoMarks,
  ladderChartData,
  liveChartData,
  lossSegments,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  outChartData,
  PRESET_KEYS,
  raceLeft,
  rungMarks,
  scaledEnergy,
  scaledPower,
  SCENARIO_KEYS,
  statusOf,
} from './model';
import { SimPanel } from './sim';
import { st, type SimKey } from './strings';
import { alarmText, STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './strip';
import { FakeElement, installFakeDom } from './test-dom';

// The simulation panel rendered by a stand-in for the DOM: that it builds, what it offers, that it follows the simulation and that a click does
// what it says, in both languages. The wording itself is held by strings.test.ts.

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

interface Fixture {
  sim: GravitySim;
  panel: SimPanel;
  root: FakeElement;
}

function open(lang: 'fr' | 'en' = 'fr', sim = new GravitySim()): Fixture {
  setLang(lang);
  const ctx = { sim, ui: { scene: 'device' }, gotoScene: () => undefined } as unknown as AppContext<GravitySim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement };
}

const str = (key: SimKey, lang: 'fr' | 'en' = 'fr'): string => {
  const before = getLang();
  setLang(lang);
  const text = st(key);
  setLang(before);
  return text;
};
const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
const run = (panel: SimPanel, sim: GravitySim, seconds: number): void => {
  for (let i = 0; i < seconds * 30; i++) {
    sim.step(1 / 30);
    panel.tick(1 / 30);
  }
};

describe('what the panel offers', () => {
  it('opens on the farm with its nine starting points, a "custom" entry and one chip per scenario', () => {
    const { root } = open();
    const options = root.find('select')[0].find('option');
    expect(options.map((o) => o.textContent)).toEqual([...PRESET_IDS.map((id) => str(PRESET_KEYS[id])), str('custom')]);
    expect(root.find('button.part-chip').map((c) => c.textContent)).toEqual(
      SCENARIO_IDS.map((id) => str(SCENARIO_KEYS[id])),
    );
    expect(PRESET_IDS).toHaveLength(9);
    expect(SCENARIO_IDS).toHaveLength(10);
  });
  it('shows six live figures first, each with its mark, and folds the controls', () => {
    const { root } = open();
    const boxes = root.find('.readout');
    expect(boxes).toHaveLength(6);
    expect(boxes.map((b) => b.textContent).join(' ')).toMatch(/†/);
    expect(boxes.map((b) => b.textContent).join(' ')).toMatch(/\*/);
    const sections = root.find('details.sim-section');
    expect(sections.map((s) => s.find('summary')[0].textContent)).toEqual([
      str('secControl'),
      str('secMachine'),
      str('secNight'),
      str('secSite'),
      str('secMore'),
      str('secRungs'),
    ]);
    for (const s of sections) expect(s.open).toBe(false);
  });
  it('has the sliders and switches of the plan', () => {
    const { root } = open();
    const inputs = root.find('input');
    expect(inputs.filter((i) => i.getAttribute('type') === 'range')).toHaveLength(13);
    expect(inputs.filter((i) => i.getAttribute('type') === 'checkbox')).toHaveLength(6);
    expect(root.find('select')).toHaveLength(3); // starting point, order, falls
  });
  it('draws the six charts', () => {
    expect(open().root.find('canvas')).toHaveLength(6);
  });
  it('writes every text in both languages and never a bad value', () => {
    for (const lang of ['fr', 'en'] as const) {
      const { root } = open(lang);
      for (const b of root.find('button')) {
        expect(b.textContent.length + (b.getAttribute('aria-label') ?? '').length).toBeGreaterThan(0);
      }
      expect(root.textContent).not.toMatch(/undefined|NaN|\[object/);
    }
    expect(open('fr').root.textContent).not.toEqual(open('en').root.textContent);
  });
  it('quotes the aha in both languages', () => {
    expect(open('fr').root.textContent).toMatch(/367\s*mètres/);
    expect(open('en').root.textContent).toMatch(/367\s*metres/);
  });
  it('says that the battery wins, plainly', () => {
    expect(open('en').root.textContent).toContain('the battery wins');
    expect(open('fr').root.textContent).toContain('la batterie gagne');
  });
  it('leaves the warning about the suspended load to the tower world and the Sources, where the research puts it', () => {
    expect(open('en').root.textContent).not.toMatch(/suspended load/);
  });
  it('names the lines of equal energy on the chart, with what is known of each machine one click away', () => {
    expect(isoMarks().map((m) => m.wh)).toEqual([1, 1e3, 1e6, 1e9]);
    for (const m of isoMarks()) {
      expect(m.y).toBeGreaterThan(LADDER_BOX.yMin);
      expect(m.y).toBeLessThan(LADDER_BOX.yMax);
    }
    expect(open('en').root.textContent).toContain(RUNGS[3].note.en);
    expect(open('fr').root.textContent).toContain(RUNGS[3].note.fr);
  });
});

describe('what a click does', () => {
  it('a preset replaces the machine, and the panel drops what it does not have', () => {
    const { sim, root, panel } = open();
    const select = root.find('select')[0];
    select.value = 'nant';
    select.dispatch('change', { target: select });
    expect(sim.params.preset).toBe('nant');
    expect(sim.spec.kind).toBe('energy');
    expect(root.find('canvas')).toHaveLength(1);
    expect(root.textContent).toContain(str('statusEnergy'));
    run(panel, sim, 2);
    expect(root.textContent).not.toMatch(/undefined|NaN/);
  });
  it('every preset opens without a bad value', () => {
    for (const id of PRESET_IDS) {
      const sim = new GravitySim();
      sim.applyPreset(id);
      const { root, panel } = open('en', sim);
      run(panel, sim, 3);
      expect(root.textContent, id).not.toMatch(/undefined|NaN|\[object/);
    }
  });
  it('a scenario chip starts its scenario, and its note says what it shows', () => {
    const { sim, root, panel } = open();
    button(root, str('scenarioFridgeDirect')).click();
    expect(sim.scenario).toBe('fridge-direct');
    expect(root.textContent).toContain(str('noteFridgeDirect'));
    run(panel, sim, 1);
    expect(root.textContent).toContain(str('noteFridgeDirect'));
  });
  it('every scenario runs in the panel, in both languages, without a bad value', () => {
    for (const lang of ['fr', 'en'] as const) {
      for (const id of SCENARIO_IDS) {
        const sim = new GravitySim();
        sim.applyScenario(id);
        const { root, panel } = open(lang, sim);
        run(panel, sim, 6);
        expect(root.textContent, id).not.toMatch(/undefined|NaN|\[object/);
      }
    }
  });
  it('a slider moves the simulation, and a scenario moves the slider', () => {
    const { sim, root, panel } = open();
    const inputs = root.find('input').filter((i) => i.getAttribute('type') === 'range');
    const mass = inputs[3];
    mass.value = '12000';
    mass.dispatch('input', { target: mass });
    expect(sim.params.mass).toBe(12000);
    button(root, str('scenarioFridgeDirect')).click();
    const after = root.find('input').filter((i) => i.getAttribute('type') === 'range');
    const lowerPower = after[1];
    run(panel, sim, 30);
    expect(sim.params.lowerPower).toBeGreaterThan(1000);
    expect(Number(lowerPower.value)).toBeCloseTo(sim.params.lowerPower, -2);
  });
  it('the reset button starts the last choice again', () => {
    const { sim, root, panel } = open();
    run(panel, sim, 10);
    expect(sim.state.z).toBeGreaterThan(0);
    root.find('button.btn')[0].click();
    expect(sim.state.z).toBe(0);
  });
  it('a chart drawn again as the machine changes', () => {
    const { sim, panel } = open();
    sim.set({ mass: 6000 });
    expect(() => run(panel, sim, 2)).not.toThrow();
  });
});

describe('what the panel plots', () => {
  it('readouts: the meter is what the machine gives, tagged an estimate; the hook is tagged as computed', () => {
    const sim = new GravitySim();
    sim.set({ control: 'lower', lowerPower: 13080 });
    sim.state.z = 20;
    for (let i = 0; i < 90; i++) sim.step(1 / 30);
    const r = mainReadouts(sim.state);
    const by = (key: SimKey) => r.find((x) => x.key === key);
    expect(by('liveMeter')?.value).toBeCloseTo(9.36, 1);
    expect(by('liveMeter')?.unit).toBe('kW');
    expect(by('liveMeter')?.tag).toBe('estimate');
    expect(by('liveHook')?.value).toBeCloseTo(13.08, 2);
    expect(by('liveHook')?.tag).toBe('derived');
    expect(by('liveEta')?.value).toBeCloseTo(71.6, 0);
    expect(moreReadouts(sim.state, 'rpm').every((x) => Number.isFinite(x.value))).toBe(true);
  });
  it('the chain’s segments add up to what the weight gives, going down', () => {
    const sim = new GravitySim();
    sim.set({ control: 'lower', lowerPower: 13080 });
    sim.state.z = 20;
    for (let i = 0; i < 90; i++) sim.step(1 / 30);
    const sum = lossSegments(sim.state).reduce((a, x) => a + x.watts, 0);
    // the weight's hook power and the little the rope adds
    expect(sum).toBeGreaterThan(sim.state.chain.hook);
    expect(sum).toBeLessThan(sim.state.chain.hook * 1.01);
    expect(lossSegments(sim.state)[0].key).toBe('chainOut');
  });
  it('holding, no segments: the status line and the standing power speak', () => {
    const sim = new GravitySim();
    sim.set({ control: 'hold' });
    sim.step(1 / 30);
    expect(lossSegments(sim.state)).toEqual([]);
    expect(statusOf(sim.state, sim.params, 'hoist').key).toBe('statusHold');
    for (let i = 0; i < 30 * 70; i++) sim.step(1 / 30);
    expect(statusOf(sim.state, sim.params, 'hoist').key).toBe('statusSleep');
  });
  it('the status: the worst thing first', () => {
    const sim = new GravitySim();
    sim.applyScenario('overspeed');
    for (let i = 0; i < 30 * 20; i++) sim.step(1 / 30);
    expect(statusOf(sim.state, sim.params, 'hoist')).toEqual({ key: 'statusTripped', tone: 'warn' });
    sim.applyScenario('fridge-direct');
    for (let i = 0; i < 30 * 8; i++) sim.step(1 / 30);
    expect(statusOf(sim.state, sim.params, 'hoist')).toEqual({ key: 'statusBelowCutIn', tone: 'warn' });
  });
  it('the out chart has zero on a tick, and shows the meter below it at low power', () => {
    const sim = new GravitySim();
    const curve = sim.getCurve();
    if (!curve) throw new Error('curve');
    const d = outChartData(curve);
    expect(d.unit).toBe('kW');
    expect(d.yMin).toBeLessThan(0);
    expect(d.yMax).toBe(-2 * d.yMin);
    expect(d.ys.out[0]).toBeLessThan(0);
    expect(d.ys.out[d.ys.out.length - 1]).toBeCloseTo(9.36, 1);
    expect(d.ys.ideal[d.ys.ideal.length - 1]).toBeCloseTo(13.08, 2);
    expect(etaChartData(curve).ys.roundTrip[47]).toBeCloseTo(53, 0);
  });
  it('axes', () => {
    expect(axisThroughZero(13.08).yMin).toBeCloseTo(-6.6, 9);
    expect(axisThroughZero(13.08).yMax).toBeCloseTo(13.2, 9);
    expect(niceCeil3(14)).toBe(15);
    expect(niceCeil3(0)).toBe(3);
  });
  it('the ladder: every machine is inside the box, between the right lines of energy', () => {
    const box = LADDER_BOX;
    for (const m of rungMarks()) {
      expect(m.x, m.id).toBeGreaterThanOrEqual(box.xMin);
      expect(m.x, m.id).toBeLessThanOrEqual(box.xMax);
      expect(m.y, m.id).toBeGreaterThanOrEqual(box.yMin);
      expect(m.y, m.id).toBeLessThanOrEqual(box.yMax);
    }
    expect(rungMarks()).toHaveLength(RUNGS.length);
    // the 1 kWh line passes through one tonne at 367 m
    const line = isoLine(1000);
    const at = (x: number) => line[0][1] + ((x - line[0][0]) * (line[1][1] - line[0][1])) / (line[1][0] - line[0][0]);
    expect(at(Math.log10(366.97))).toBeCloseTo(0, 4);
    const d = ladderChartData();
    expect(d.xs[0]).toBe(box.xMin);
    expect(d.xs[d.xs.length - 1]).toBe(box.xMax);
    for (const col of Object.values(d.ys)) expect(col).toHaveLength(d.xs.length);
  });
  it('a day and the last minute', () => {
    const sim = new GravitySim();
    const d = dayChartData(sim.getDay());
    expect(d.xs.length).toBeGreaterThan(280);
    expect(Math.max(...d.height.z)).toBeCloseTo(20, 6);
    for (let i = 0; i < 90; i++) sim.step(1 / 30);
    const live = liveChartData(sim.scope);
    expect(live.xs[live.xs.length - 1]).toBe(0);
    expect(live.xs[0]).toBeLessThan(0);
    expect(live.hook[live.hook.length - 1]).toBeCloseTo(13.08, 1);
  });
  it('the race’s bars empty with the clock', () => {
    expect(raceLeft(100, 0)).toBe(1);
    expect(raceLeft(100, 50)).toBe(0.5);
    expect(raceLeft(100, 200)).toBe(0);
    expect(raceLeft(0, 10)).toBe(0);
  });
  it('scaled units', () => {
    expect(scaledPower(13080)).toEqual({ value: 13.08, digits: 2, unit: 'kW' });
    expect(scaledPower(100)).toEqual({ value: 100, digits: 0, unit: 'W' });
    expect(scaledPower(900e6).unit).toBe('MW');
    expect(scaledEnergy(1090)).toEqual({ value: 1.09, digits: 2, unit: 'kWh' });
    expect(scaledEnergy(0.06).digits).toBe(2);
  });
});

describe('the strip', () => {
  it('shows four live values, the time of the day and the alarms, in both languages', () => {
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      const sim = new GravitySim();
      sim.applyScenario('blackout');
      for (let i = 0; i < 30 * 13; i++) sim.step(1 / 30);
      expect(stripValues(sim)).toHaveLength(4);
      expect(stripClock(sim).time).toMatch(/^\d\d:\d\d$/);
      const alarms = stripAlarms(sim);
      expect(alarms.map((a) => a.key)).toContain('gridLost');
      expect(alarms.find((a) => a.key === 'gridLost')?.severe).toBe(true);
      for (const a of alarms) expect(a.label.length).toBeGreaterThan(2);
    }
  });
  it('has a text for every alarm', () => {
    const keys = [
      'belowCutIn',
      'tooLight',
      'stalled',
      'overload',
      'ropeFactor',
      'storeFull',
      'storeEmpty',
      'gateOpen',
      'windStop',
      'gridLost',
      'chopper',
      'motorHot',
      'overspeed',
      'safetyGear',
      'crash',
    ] as const;
    for (const k of keys) expect(alarmText(k).length, k).toBeGreaterThan(2);
  });
  it('offers one clock for each pace of the machine', () => {
    expect(STRIP_SPEEDS).toEqual([1, 60, 600, 3600]);
  });
});
