import { describe, expect, it } from 'vitest';
import { cutInSpeed, speedForOutput, strokeEnergy } from './chain';
import { GravitySim, simulateDay } from './engine';
import { GOVERNOR_TRIP, FARM, FARM_MASS, G, MOTOR_RISE_ALARM } from './machine';
import { presetParams, PRESET_IDS, SCENARIO_IDS } from './presets';
import type { AlarmKey, GravityState, ScenarioId } from './types';

// The engine as the kit drives it: a frame at a time, at the clock of the strip. Every scenario is run and what it is meant to show is checked.

const FRAME = 1 / 30;

function run(sim: GravitySim, seconds: number, each?: (s: GravityState, t: number) => void): void {
  const n = Math.round(seconds / FRAME);
  for (let i = 0; i < n; i++) {
    sim.step(FRAME);
    each?.(sim.state, i * FRAME);
  }
}

function scenario(id: ScenarioId): GravitySim {
  const sim = new GravitySim();
  sim.applyScenario(id);
  return sim;
}

describe('the opening', () => {
  it('opens on the farm at noon, the weight at the bottom and the sun high: it climbs at once', () => {
    const sim = new GravitySim();
    expect(sim.params.preset).toBe('farm');
    expect(sim.state.z).toBe(0);
    expect(sim.state.hour).toBe(12);
    run(sim, 5);
    expect(sim.state.mode).toBe('raising');
    expect(sim.state.speedMpm).toBeCloseTo(4, 6);
    expect(sim.state.brakeReleased).toBe(true);
    expect(sim.state.flowDirection).toBe(1);
  });
  it('K36: from ready it is at full speed within the ramp, under two seconds and a half; asleep it takes its wake-up first', () => {
    const sim = new GravitySim();
    sim.set({ control: 'raise', raiseSpeed: 4 });
    run(sim, 2.5);
    expect(sim.state.speedMpm).toBeCloseTo(4, 6);
    const asleep = new GravitySim();
    asleep.set({ control: 'hold' });
    run(asleep, 70);
    expect(asleep.state.drive).toBe('sleep');
    asleep.set({ control: 'raise' });
    run(asleep, 10);
    expect(asleep.state.mode).toBe('waking');
    expect(asleep.state.z).toBe(0);
    run(asleep, 8);
    expect(asleep.state.mode).toBe('raising');
  });
});

describe('the integrator against the chain', () => {
  it('K52 again: a full stroke at the real clock gives what strokeEnergy says, within the ramps', () => {
    const sim = new GravitySim();
    sim.set({ control: 'lower', lowerPower: 13080 });
    sim.state.z = 20;
    run(sim, 310);
    expect(sim.state.z).toBeCloseTo(0, 6);
    const e = strokeEnergy(FARM, FARM_MASS, FARM.vRated, FARM.vRated);
    expect(sim.state.energyOut / e.output).toBeCloseTo(1, 1);
  });
  it('K47 again: a full cycle at the real clock, standing losses counted apart', () => {
    const sim = new GravitySim();
    sim.set({ control: 'raise', raiseSpeed: 4 });
    run(sim, 310);
    expect(sim.state.z).toBeCloseTo(20, 6);
    sim.set({ control: 'lower', lowerPower: 13080 });
    run(sim, 310);
    expect(sim.state.z).toBeCloseTo(0, 6);
    const s = sim.state;
    expect(s.energyOut / (s.energyIn - s.energyStanding)).toBeCloseTo(0.533, 1);
  });
  it('the same stroke gives the same energy at every clock: the integrator does not care about the step', () => {
    const outAt = (timeScale: number) => {
      const sim = new GravitySim();
      sim.set({ control: 'lower', lowerPower: 13080, timeScale });
      sim.state.z = 20;
      run(sim, 320 / timeScale);
      return sim.state.energyOut;
    };
    const base = outAt(1);
    expect(outAt(60) / base).toBeCloseTo(1, 2);
    expect(outAt(600) / base).toBeCloseTo(1, 1);
  });
  it('a step is cheap: under a tenth of a millisecond on average, even solving for the load', () => {
    const sim = new GravitySim();
    sim.set({ control: 'load', loadPower: 2000 });
    sim.state.z = 20;
    const t0 = performance.now();
    run(sim, 300);
    const each = (performance.now() - t0) / (300 / FRAME);
    expect(each).toBeLessThan(0.1);
  });
  it('the farm’s bus balances at every step', () => {
    const sim = new GravitySim();
    sim.set({ timeScale: 600, buffer: true });
    run(sim, 150, (s) => {
      expect(s.gridPower).toBeCloseTo(s.load + s.chain.meter + s.lfpPower - s.pv, 6);
    });
  });
  it('is deterministic', () => {
    const a = scenario('sunny-day');
    const b = scenario('sunny-day');
    run(a, 60);
    run(b, 60);
    expect(a.state.energyIn).toBe(b.state.energyIn);
    expect(a.state.z).toBe(b.state.z);
  });
});

describe('the scenarios', () => {
  it('there are ten, and each runs to its end with no bad number at any clock', () => {
    expect(SCENARIO_IDS).toHaveLength(10);
    for (const id of SCENARIO_IDS) {
      const sim = scenario(id);
      run(sim, 90, (s) => {
        for (const [k, v] of Object.entries(s)) {
          if (typeof v === 'number' && k !== 'ropeFactor') expect(Number.isFinite(v), `${id} ${k}`).toBe(true);
        }
        expect(s.z).toBeGreaterThanOrEqual(0);
        expect(s.z).toBeLessThanOrEqual(20);
      });
    }
  });

  it('a sunny day: the weight is up before noon, spent by midnight, and it gives back little of what it took', () => {
    const sim = scenario('sunny-day');
    expect(sim.params.timeScale).toBe(600);
    let fullAt = 0;
    run(sim, 144, (s) => {
      if (!fullAt && s.z >= 20 - 1e-6) fullAt = s.hour;
    });
    expect(fullAt).toBeGreaterThan(7);
    expect(fullAt).toBeLessThan(12);
    expect(sim.state.z).toBeLessThan(1e-6);
    expect(sim.state.energyOut / sim.state.energyIn).toBeLessThan(0.15);
    expect(sim.state.energyOut).toBeGreaterThan(100);
  });

  it('the kettle: over 9 kW for five minutes, 4.7 kettles’ worth, then nothing', () => {
    const sim = scenario('kettle');
    run(sim, 30);
    expect(-sim.state.chain.meter / 1000).toBeCloseTo(9.37, 1);
    expect(sim.state.load).toBe(2000);
    expect(sim.state.gridPower).toBeLessThan(0);
    run(sim, 280);
    expect(sim.state.z).toBeLessThan(0.01);
    expect(sim.state.alarms).toContain('storeEmpty');
  });

  it('the fridge on its own: the meter pays first, crosses zero on the way, and gives back only above the limit', () => {
    const sim = scenario('fridge-direct');
    const seen = new Set<AlarmKey>();
    let crossedAt = 0;
    const cut = (cutInSpeed(FARM, FARM_MASS) ?? 0) * FARM_MASS * G;
    run(sim, 56, (s) => {
      s.alarms.forEach((a) => seen.add(a));
      if (!crossedAt && s.chain.meter < 0 && s.mode === 'lowering' && s.chain.hook > 500) crossedAt = s.chain.hook;
    });
    expect(seen.has('belowCutIn')).toBe(true);
    expect(sim.state.chain.meter).toBeLessThan(0);
    expect(crossedAt / cut).toBeCloseTo(1, 1);
  });

  it('the fridge with a battery: one burst of 13 minutes empties the tower into it, and the fridge gets eight times what it got alone', () => {
    const sim = scenario('fridge-buffer');
    let bursts = 0;
    let was = false;
    let peak = 0;
    let burstClock = 0;
    run(sim, 200, (s) => {
      if (s.bursting && !was) bursts++;
      if (s.bursting) burstClock += sim.params.timeScale * FRAME;
      was = s.bursting;
      peak = Math.max(peak, -s.chain.meter);
    });
    expect(bursts).toBe(1);
    expect(sim.state.z).toBeLessThan(0.01);
    // the charge is the module's recommended 50 A, and the fridge's 100 W besides
    expect(peak / 1000).toBeCloseTo(2.6, 1);
    expect(burstClock / 60).toBeCloseTo(14, -1);
    expect(sim.state.energyOut).toBeCloseTo(568, 0);
    // the same battery with nothing up the tower
    const none = scenario('fridge-buffer');
    none.state.z = 0;
    run(none, 200);
    const fromTower = sim.state.loadServedWh - none.state.loadServedWh;
    expect(fromTower).toBeCloseTo(430, -1);
    // on its own, the fridge had 54 Wh of the stroke
    const alone = (100 * 20) / (speedForOutput(FARM, FARM_MASS, 10, 100) ?? 1) / 3600;
    expect(alone).toBeCloseTo(54, 0);
    expect(fromTower / alone).toBeCloseTo(8, 0);
  });

  it('getting through the night: the ghost stack grows with the night, from 2.5 towers to 14', () => {
    const sim = scenario('night');
    run(sim, 2);
    expect(sim.state.ghostTowers).toBeCloseTo(2.48, 1);
    run(sim, 45);
    expect(sim.params.nightKwh).toBeCloseTo(7, 6);
    expect(sim.state.ghostTowers).toBeCloseTo(14.3, 1);
    expect(sim.state.ghostTonnes).toBeCloseTo(287, 0);
    expect(sim.state.ghostVolume).toBeCloseTo(103, 0);
  });

  it('too light: first it stops paying, then it stops coming down by itself', () => {
    const sim = scenario('too-light');
    let stopsPaying = 0;
    let tooLight = 0;
    run(sim, 66, (s) => {
      if (!stopsPaying && s.alarms.includes('belowCutIn')) stopsPaying = sim.params.mass;
      if (!tooLight && s.alarms.includes('tooLight')) tooLight = sim.params.mass;
    });
    expect(stopsPaying).toBeGreaterThan(1000);
    expect(tooLight).toBeGreaterThan(0);
    expect(tooLight).toBeLessThan(500);
    expect(stopsPaying).toBeGreaterThan(tooLight);
  });

  it('the power cut: the resistor takes the power on the ramp, the brakes close, the link stays charged', () => {
    const sim = scenario('blackout');
    let chopper = 0;
    let volts = 0;
    run(sim, 16, (s) => {
      chopper = Math.max(chopper, s.chopperPower);
      volts = Math.max(volts, s.dcVolts);
    });
    expect(chopper / 1000).toBeGreaterThan(5);
    expect(volts).toBe(750);
    expect(sim.state.mode).toBe('hold');
    expect(sim.state.brakeReleased).toBe(false);
    expect(sim.state.energyDumped).toBeGreaterThan(0);
    expect(sim.state.energyDumped).toBeLessThan(5);
    expect(sim.state.alarms).toContain('gridLost');
    // still dangerous after 20 s
    run(sim, 20);
    expect(sim.state.dcVolts).toBeGreaterThan(300);
    // the grid comes back, and it stays stopped
    run(sim, 15);
    expect(sim.params.grid).toBe(true);
    expect(sim.state.mode).toBe('hold');
    expect(sim.state.alarms).not.toContain('gridLost');
  });

  it('overspeed: the governor trips, the wedges bite, the load is held within about 10 cm', () => {
    const sim = scenario('overspeed');
    let fellAt = 0;
    run(sim, 20, (s, t) => {
      if (!fellAt && s.mode === 'falling') fellAt = t;
    });
    expect(fellAt).toBeGreaterThan(4.9);
    const s = sim.state;
    expect(s.mode).toBe('tripped');
    expect(s.safetyGearSet).toBe(true);
    expect(s.fallPeak).toBeGreaterThan(GOVERNOR_TRIP);
    expect(s.fallPeak).toBeCloseTo(0.79, 1);
    expect(s.fallDrop).toBeCloseTo(0.095, 2);
    expect(s.fallTime).toBeLessThan(0.5);
    expect(s.alarms).toContain('safetyGear');
    // it stays stopped until it is started again
    const z = s.z;
    run(sim, 2);
    expect(sim.state.z).toBe(z);
    sim.reset();
    expect(sim.state.mode).toBe('hold');
    expect(sim.state.safetyGearSet).toBe(false);
  });

  it('without the safety gear the whole store falls: 19.8 m/s at the buffer, and it takes two seconds', () => {
    const sim = scenario('overspeed');
    sim.set({ safetyGear: false });
    run(sim, 6);
    sim.set({ slowMo: 1 });
    run(sim, 4);
    const s = sim.state;
    expect(s.mode).toBe('crashed');
    expect(s.impactSpeed).toBeCloseTo(Math.sqrt(2 * G * 0.99 * s.fallDrop), 0);
    expect(s.impactSpeed).toBeGreaterThan(15);
    expect(s.alarms).toContain('crash');
  });

  it('the wind: it stops above the limit, and only starts again below it by a margin', () => {
    const sim = scenario('wind-stop');
    const states: string[] = [];
    run(sim, 65, (s) => {
      const label = s.alarms.includes('windStop') ? 'stopped' : s.mode;
      if (states[states.length - 1] !== label) states.push(label);
    });
    expect(states).toContain('stopped');
    expect(states.indexOf('stopped')).toBeGreaterThan(0);
    expect(sim.params.wind).toBeLessThan(sim.params.windStop - 2);
    expect(sim.state.alarms).not.toContain('windStop');
    expect(sim.state.z).toBeLessThan(20);
  });

  it('the wind costs the weight almost nothing: just under the stop, half a percent more friction in the guides, themselves 1 % of the power', () => {
    const sim = scenario('wind-stop');
    sim.set({ wind: 17.5 });
    run(sim, 8);
    const still = scenario('wind-stop');
    still.set({ wind: 0 });
    run(still, 8);
    expect(sim.state.chain.guide / still.state.chain.guide).toBeCloseTo(1.005, 3);
  });

  it('the race: the tower is out in about twenty minutes while the module has hours left', () => {
    const sim = scenario('race');
    run(sim, 30);
    expect(sim.state.z).toBeLessThan(0.01);
    expect(sim.state.simTime / 60).toBeGreaterThan(21);
    const lanes = sim.getRace();
    expect(lanes?.[1].lasts).toBeGreaterThan(sim.state.simTime * 8);
  });
});

describe('alarms and limits', () => {
  it('K10: the 70 % duty means one stroke is nothing, and hours at full load are not', () => {
    const sim = new GravitySim();
    sim.set({ control: 'raise', raiseSpeed: 4 });
    run(sim, 310);
    expect(sim.state.motorRise).toBeLessThan(40);
    expect(sim.state.alarms).not.toContain('motorHot');
    // going up and down for ever, at the rated loss
    const busy = new GravitySim();
    busy.set({ timeScale: 60 });
    for (let i = 0; i < 12 && !busy.state.alarms.includes('motorHot'); i++) {
      busy.set({ control: 'raise', raiseSpeed: 4 });
      run(busy, 5.2);
      busy.set({ control: 'lower', lowerPower: 13080 });
      run(busy, 5.2);
    }
    expect(busy.state.motorRise).toBeGreaterThan(40);
    expect(busy.state.motorRise).toBeLessThan(MOTOR_RISE_ALARM * 1.5);
  });
  it('two falls at 20 t: the rope is overloaded, the overload cell refuses, and it does not move', () => {
    const sim = new GravitySim();
    sim.set({ falls: 2, control: 'raise' });
    run(sim, 3);
    expect(sim.state.alarms).toContain('overload');
    expect(sim.state.alarms).toContain('ropeFactor');
    expect(sim.state.z).toBe(0);
  });
  it('the gate stops it', () => {
    const sim = new GravitySim();
    sim.set({ control: 'raise' });
    run(sim, 3);
    sim.set({ gateOpen: true });
    run(sim, 5);
    expect(sim.state.mode).toBe('hold');
    expect(sim.state.alarms).toContain('gateOpen');
  });
  it('holding, it costs only the standing power: 284 W ready, 40 W asleep', () => {
    const sim = new GravitySim();
    sim.set({ control: 'hold', sleepWhenIdle: false });
    run(sim, 70);
    expect(sim.state.chain.meter).toBeCloseTo(284, 0);
    sim.set({ sleepWhenIdle: true });
    run(sim, 2);
    expect(sim.state.chain.meter).toBeCloseTo(40, 0);
    expect(sim.state.drive).toBe('sleep');
  });
  it('holding at the bottom or at the top says so', () => {
    const sim = new GravitySim();
    sim.set({ control: 'lower' });
    run(sim, 2);
    expect(sim.state.alarms).toContain('storeEmpty');
    sim.state.z = 20;
    sim.set({ control: 'raise' });
    run(sim, 2);
    expect(sim.state.alarms).toContain('storeFull');
  });
  it('a static rope factor shows when it holds', () => {
    const sim = new GravitySim();
    sim.set({ control: 'hold' });
    run(sim, 2);
    expect(sim.state.ropeTension / 1000).toBeCloseTo(49.4, 1);
    expect(sim.state.ropeFactor).toBeCloseTo(6.38, 1);
  });
});

describe('the controls', () => {
  it('keeps the parameters inside their ranges, and an edit makes the preset custom', () => {
    const sim = new GravitySim();
    sim.set({ mass: 1e9 });
    expect(sim.params.mass).toBe(20000);
    expect(sim.params.preset).toBe('custom');
    sim.set({ mass: 1 });
    expect(sim.params.mass).toBe(200);
    sim.set({ falls: 3 });
    expect(sim.params.falls).toBe(4);
  });
  it('the clock, the slow motion and the calculators do not make a preset custom', () => {
    const sim = new GravitySim();
    sim.set({ timeScale: 60, slowMo: 0.2, running: true, ladderTonnes: 2, ladderHeight: 100, nightKwh: 4 });
    expect(sim.params.preset).toBe('farm');
  });
  it('a preset keeps the visitor’s clock; a scenario brings its own, and an edit takes a moved quantity away from it', () => {
    const sim = new GravitySim();
    sim.set({ timeScale: 60 });
    sim.applyPreset('garden');
    expect(sim.params.timeScale).toBe(60);
    sim.applyScenario('sunny-day');
    expect(sim.params.timeScale).toBe(600);
    sim.applyScenario('night');
    sim.set({ nightKwh: 2 });
    run(sim, 10);
    expect(sim.params.nightKwh).toBe(2);
  });
  it('pause stops everything', () => {
    const sim = new GravitySim();
    sim.set({ running: false });
    run(sim, 5);
    expect(sim.state.z).toBe(0);
    expect(sim.state.simTime).toBe(0);
  });
  it('a shortened stroke brings the height down with it', () => {
    const sim = new GravitySim();
    sim.state.z = 20;
    sim.set({ stroke: 5, control: 'hold' });
    expect(sim.state.z).toBe(5);
  });
  it('tells the 3D what it needs: blocks from the mass, a fraction of the stroke, shafts capped for the eye', () => {
    const sim = new GravitySim();
    sim.set({ mass: 8000 });
    run(sim, 1);
    expect(sim.state.blocks).toBe(2);
    sim.set({ mass: 20000, stroke: 10, control: 'raise' });
    run(sim, 30);
    expect(sim.state.zFraction).toBeCloseTo(sim.state.z / 10, 9);
    expect(sim.state.motorBlur).toBe(true);
    const before = sim.state.motorAngle;
    sim.step(FRAME);
    const delta = Math.abs(sim.state.motorAngle - before);
    expect(Math.min(delta, 2 * Math.PI - delta)).toBeLessThanOrEqual(12 * FRAME + 1e-9);
  });
});

describe('every preset', () => {
  it('runs, and the energy-only marks do not move', () => {
    for (const id of PRESET_IDS) {
      const sim = new GravitySim();
      sim.applyPreset(id);
      run(sim, 10, (s) => {
        expect(Number.isFinite(s.z), id).toBe(true);
        expect(Number.isFinite(s.chain.meter), id).toBe(true);
      });
      if (id === 'gravitylight' || id === 'rudong' || id === 'nant') {
        expect(sim.state.v).toBe(0);
        expect(sim.spec.kind).toBe('energy');
      }
    }
  });
  it('energies: 16 Wh, 0.75 Wh, 61 mWh, 2.04 kWh, 3.9 kWh, 681 kWh, 100 MWh, 20 GWh', () => {
    const stored = (id: (typeof PRESET_IDS)[number]) => {
      const sim = new GravitySim();
      sim.applyPreset(id);
      sim.set({ control: 'hold' });
      sim.step(FRAME);
      return sim.state.storedWh;
    };
    expect(stored('garden')).toBeCloseTo(16.35, 1);
    expect(stored('diy')).toBeCloseTo(0.75, 2);
    expect(stored('gravitylight')).toBeCloseTo(0.0613, 3);
    expect(stored('leith') / 1000).toBeCloseTo(2.04, 2);
    expect(stored('swiss') / 1000).toBeCloseTo(3.9, 1);
    expect(stored('shaft') / 1000).toBeCloseTo(681, 0);
    expect(stored('rudong') / 1e6).toBeCloseTo(100, 0);
    expect(stored('nant') / 1e9).toBeCloseTo(20, 0);
  });
  it('the courtyard stalls at 12 kg and settles at 46 kg, with no hoist to help it', () => {
    const sim = new GravitySim();
    sim.applyPreset('diy');
    run(sim, 3);
    expect(sim.state.mode).toBe('lowering');
    expect(sim.state.speedMpm / 60).toBeCloseTo(0.068, 3);
    expect(-sim.state.chain.meter).toBeCloseTo(3.1, 1);
    sim.set({ mass: 12 });
    run(sim, 1);
    expect(sim.state.v).toBe(0);
    expect(sim.state.alarms).toContain('stalled');
  });
  it('the garden: 16 Wh of store, and 40 W of controls use them up in 25 minutes', () => {
    const p = presetParams('garden');
    expect((p.mass * G * p.stroke) / 3600 / 40).toBeCloseTo(0.409, 2);
  });
});

describe('a day of the machine', () => {
  const nominal = simulateDay(presetParams('farm'));
  it('direct: 2.43 kWh in, 0.17 kWh out: 7 %, the house spending it slowly and the standby the rest', () => {
    expect(nominal.energyIn / 1000).toBeCloseTo(2.43, 1);
    expect(nominal.energyOut / 1000).toBeCloseTo(0.17, 2);
    expect(nominal.roundTrip).toBeCloseTo(0.069, 2);
    expect(nominal.standing).toBeCloseTo(941, -1);
    expect(nominal.served / nominal.asked).toBeLessThan(0.1);
  });
  it('with a battery: 23 % for the tower, and the night is served, by the battery, not by the tower', () => {
    const d = simulateDay({ ...presetParams('farm'), buffer: true });
    expect(d.roundTrip).toBeCloseTo(0.23, 2);
    expect(d.served / d.asked).toBeCloseTo(1, 1);
    // the tower gave under a quarter of what the house asked
    expect(d.energyOut / d.asked).toBeLessThan(0.25);
  });
  it('the drive kept ready: 8.2 kWh in for the same little out, 2 %', () => {
    const d = simulateDay({ ...presetParams('farm'), sleepWhenIdle: false });
    expect(d.energyIn / 1000).toBeCloseTo(8.15, 1);
    expect(d.roundTrip).toBeCloseTo(0.021, 2);
  });
  it('crawling up on whatever sun there is, instead of waiting for it, costs more for the same lift', () => {
    const d = simulateDay({ ...presetParams('farm'), waitForSun: false });
    expect(d.energyIn).toBeGreaterThan(nominal.energyIn);
  });
  it('the hours run through the day', () => {
    expect(nominal.hours[0]).toBeLessThan(0.1);
    expect(nominal.hours[nominal.hours.length - 1]).toBeGreaterThan(23.5);
    expect(Math.max(...nominal.z)).toBeCloseTo(20, 6);
    expect(Math.max(...nominal.pv)).toBeCloseTo(27, 0);
  });
});
