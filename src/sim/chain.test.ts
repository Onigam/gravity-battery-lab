import { describe, expect, it } from 'vitest';
import {
  chainAt,
  comesDownAlone,
  cutInSpeed,
  efficiencyCurve,
  lightestLoad,
  motorLossesAt,
  rampFigures,
  shaftsAt,
  speedForInput,
  speedForOutput,
  strokeEnergy,
  tooHeavyFor,
  vMaxFor,
} from './chain';
import { comparatorRows, raceLanes, ROUND_TRIP_CLAIMS } from './comparator';
import { diyLightest } from './diy';
import { energyWh } from './energy';
import { rung, rungEnergyTag, tagMark } from './ladder';
import {
  backDriven,
  CARRIER_MASS,
  designHoist,
  FARM,
  FARM_DESIGN,
  FARM_MASS,
  FARM_MOTOR_W,
  G,
  NOMINAL,
  standingAsleep,
  standingReady,
} from './machine';
import { rpmToRad } from './mech';
import { nightNeed } from './night';
import { presetParams, specFor } from './presets';
import { hangingRope, reevingSumDown, reevingSumUp } from './reeving';
import { answers, KIND, UNKIND } from './sensitivity';

// What the model has to find by itself. The research gives no target for K47 to K53, only an estimate to catch a bug: these tests pin what the
// model finds, so that a change of it shows, and they say where it stands against the estimate. No test forces a claimed efficiency.

const V = FARM.vRated;
const MID = FARM.stroke / 2;
const stroke = strokeEnergy(FARM, FARM_MASS, V, V);

describe('the chain adds up', () => {
  const lossesOf = (p: ReturnType<typeof chainAt>) =>
    p.guide +
    p.reeving +
    p.drum +
    p.gearMesh +
    p.gearDrag +
    p.motorCopper +
    p.motorIron +
    p.motorWindage +
    p.cable +
    p.inverter +
    p.supply +
    p.fan +
    p.brakes +
    p.controls;
  const weightPower = (z: number, v: number) =>
    (FARM_MASS + hangingRope(FARM.falls, FARM.ropeMassPerM, FARM.stroke, z)) * G * Math.abs(v);

  it('raising: the meter pays for the weight, its rope and every loss', () => {
    for (const v of [FARM.vMin, V / 3, V]) {
      const p = chainAt(FARM, FARM_MASS, MID, v);
      expect(p.meter).toBeCloseTo(weightPower(MID, v) + lossesOf(p), 3);
    }
  });
  it('lowering: the weight and its rope pay for what the meter receives and for every loss', () => {
    for (const v of [FARM.vMin, V / 3, V]) {
      const p = chainAt(FARM, FARM_MASS, MID, -v);
      expect(-p.meter).toBeCloseTo(weightPower(MID, v) - lossesOf(p), 3);
    }
  });
  it('the reeving of four falls costs the same both ways, almost: 97 %', () => {
    expect(reevingSumUp(4) / 4).toBeCloseTo(0.9704, 4);
    expect(4 / reevingSumDown(4)).toBeCloseTo(0.9699, 4);
  });
  it('a helical stage run backwards is nearly as good as forwards; a poor one locks', () => {
    expect(backDriven(0.98)).toBeCloseTo(0.9796, 4);
    expect(backDriven(0.5)).toBe(0);
    expect(backDriven(0.4)).toBe(0);
  });
  it('the motor loses at its rated point what its rated efficiency says, whatever the split', () => {
    const omega = rpmToRad(FARM.motorRpm);
    const l = motorLossesAt(FARM, FARM_MOTOR_W / omega, omega);
    expect(l.copper + l.iron + l.windage).toBeCloseTo(FARM_MOTOR_W * (1 / FARM.motorEta - 1), 6);
    expect(l.current).toBeCloseTo(1, 9);
  });
  it('the motor’s copper loss stays while the speed falls: the torque is what costs', () => {
    const omega = rpmToRad(FARM.motorRpm);
    const torque = 38;
    const fast = motorLossesAt(FARM, torque, omega);
    const slow = motorLossesAt(FARM, torque, omega / 50);
    expect(slow.copper).toBeCloseTo(fast.copper, 6);
    expect(slow.iron).toBeLessThan(fast.iron / 30);
  });
  it('magnetised with no torque, a share of the stator’s loss is still there', () => {
    const l = motorLossesAt(FARM, 0, rpmToRad(1000));
    expect(l.copper).toBeGreaterThan(0);
    expect(l.current).toBeCloseTo(Math.sqrt(1 - 0.82 * 0.82), 6);
  });
  it('the hook gives the same torque whatever the drum: only the speeds of the shafts depend on the unknown drum diameter', () => {
    const small = designHoist({ ...FARM_DESIGN, drumDiameter: 0.3 });
    const large = designHoist({ ...FARM_DESIGN, drumDiameter: 0.36 });
    expect(strokeEnergy(small, FARM_MASS, V, V).roundTrip).toBeCloseTo(stroke.roundTrip, 2);
    expect(strokeEnergy(large, FARM_MASS, V, V).roundTrip).toBeCloseTo(stroke.roundTrip, 2);
    // research §3: a drum of 14 to 17 rpm, a ratio of 170 to 205
    expect(small.ratio).toBeCloseTo(171, 0);
    expect(large.ratio).toBeCloseTo(205, 0);
    expect(FARM.ratio).toBeCloseTo(188, 0);
    expect(FARM.stages).toBe(3);
  });
  it('the shafts of the sheet: drum about 15 rpm and 8.5 kN·m, motor 2,900 rpm and 49 N·m', () => {
    const s = shaftsAt(FARM, FARM_MASS);
    expect(s.drum.rpm).toBeCloseTo(15.4, 1);
    expect(s.drum.torque / 1000).toBeCloseTo(8.5, 1);
    expect(s.motor.rpm).toBeCloseTo(2900, 0);
    expect(s.motor.torque).toBeCloseTo(48.5, 0);
    expect(s.stages).toHaveLength(3);
    // the last stage's output shaft is the motor's, before the gearbox's own drag
    expect(s.stages[2].omegaOut).toBeCloseTo(rpmToRad(2900), 3);
    expect(s.stages[2].torqueOut).toBeLessThan(s.motor.torque);
    expect(s.stages[2].torqueOut).toBeGreaterThan(s.motor.torque - 1);
  });
});

describe('K47: the round trip at full speed', () => {
  it('lands at 0.53: below the research’s estimate of 0.55 to 0.68, and below every claim in the sources', () => {
    expect(stroke.roundTrip).toBeCloseTo(0.533, 3);
    expect(stroke.up).toBeCloseTo(0.745, 3);
    expect(stroke.down).toBeCloseTo(0.716, 3);
    expect(stroke.roundTrip).toBeLessThan(0.55);
    for (const c of ROUND_TRIP_CLAIMS) expect(stroke.roundTrip, c.id).toBeLessThan(c.min);
  });
  it('why below: without the fan, the brakes, the controls and the cable, which the estimate left out, it would be 0.58, inside the estimate', () => {
    const up = chainAt(FARM, FARM_MASS, MID, V);
    const down = chainAt(FARM, FARM_MASS, MID, -V);
    const extra = (p: typeof up) => p.fan + p.brakes + p.controls;
    const chainUp = up.hook / (up.meter - extra(up) - up.cable);
    const chainDown = (-down.meter + extra(down) + down.cable) / down.hook;
    // the estimate's one-way chain was 0.74 to 0.82
    expect(chainUp).toBeCloseTo(0.77, 2);
    expect(chainDown).toBeCloseTo(0.76, 2);
    expect(chainUp * chainDown).toBeCloseTo(0.58, 2);
  });
  it('the honest range: 0.40 to 0.66 with every assumption at its kind or unkind end at once', () => {
    const kind = answers(KIND);
    const unkind = answers(UNKIND);
    expect(answers(NOMINAL).roundTrip).toBeCloseTo(stroke.roundTrip, 9);
    expect(kind.roundTrip).toBeCloseTo(0.657, 3);
    expect(unkind.roundTrip).toBeCloseTo(0.4, 3);
  });
  it('scale helps: the same structure at 1.5 kW gives 0.39, at about 300 kW 0.66', () => {
    const rt = (id: 'garden' | 'leith' | 'swiss') => {
      const p = presetParams(id);
      const s = specFor(id, p.motorKw, p.falls, p.stroke);
      if (s.kind !== 'hoist') throw new Error(id);
      const top = vMaxFor(s, p.mass);
      return strokeEnergy(s, p.mass, top, top).roundTrip;
    };
    expect(rt('garden')).toBeCloseTo(0.386, 2);
    expect(rt('leith')).toBeCloseTo(0.662, 2);
    expect(rt('swiss')).toBeCloseTo(0.661, 2);
  });
  it('K21 not retrieved: the model gives the Swiss block 0.66 where the test reports 0.75; its way down, 0.81, is close to the reported 0.795', () => {
    const p = presetParams('swiss');
    const s = specFor('swiss', p.motorKw, p.falls, p.stroke);
    if (s.kind !== 'hoist') throw new Error('swiss');
    const e = strokeEnergy(s, p.mass, s.vRated, s.vRated);
    expect(e.roundTrip).toBeLessThan(0.75);
    expect(e.roundTrip).toBeGreaterThan(0.6);
    expect(e.down).toBeCloseTo(0.81, 2);
    // the reported way up, 0.95, is far from the model's 0.81 and from the way down: the research called this asymmetry strange
    expect(e.up).toBeLessThan(0.9);
  });
  it('K20 not retrieved exactly: the model gives Edinburgh 238 kW where 250 kW is reported, 5 % less', () => {
    const p = presetParams('leith');
    const s = specFor('leith', p.motorKw, p.falls, p.stroke);
    if (s.kind !== 'hoist') throw new Error('leith');
    const out = -chainAt(s, p.mass, p.stroke / 2, -s.vRated).meter;
    expect(out / 1000).toBeCloseTo(238, 0);
  });
});

describe('K48: efficiency against power', () => {
  const c = efficiencyCurve(FARM, FARM_MASS, 48);
  it('rises all the way to the top speed at 20 t: the peak is not reached and it does not fall at full load', () => {
    for (let i = 1; i < c.down.length; i++) {
      expect(c.down[i]).toBeGreaterThanOrEqual(c.down[i - 1] - 1e-9);
      expect(c.up[i]).toBeGreaterThan(c.up[i - 1]);
    }
    expect(c.down[c.down.length - 1]).toBeCloseTo(72, 0);
  });
  it('the peak exists, just past what the hoist is allowed at 20 t: about 5.2 m/min', () => {
    const rt = (k: number) => strokeEnergy(FARM, FARM_MASS, V * k, V * k).roundTrip;
    expect(rt(1.3)).toBeCloseTo(0.546, 3);
    expect(rt(1.3)).toBeGreaterThan(rt(1));
    expect(rt(1.3)).toBeGreaterThan(rt(1.2));
    expect(rt(1.3)).toBeGreaterThan(rt(1.4));
    expect(rt(3)).toBeLessThan(rt(1));
  });
  it('a lighter load at the same speed is worse: the loss that does not fall with the load weighs more', () => {
    const at = (t: number) => strokeEnergy(FARM, t * 1000, V, V).roundTrip;
    expect(at(10)).toBeLessThan(at(20));
    expect(at(10)).toBeCloseTo(0.436, 2);
    expect(at(4)).toBeCloseTo(0.157, 2);
  });
  it('refutes "relatively constant above 20 % of rated power" for this machine: at 20 % the way down gives a third of its best, at 60 % about 90 %', () => {
    const at = (share: number) => {
      const v = V * share;
      return -chainAt(FARM, FARM_MASS, MID, -v).meter / (FARM_MASS * G * v);
    };
    expect(at(0.2)).toBeCloseTo(0.235, 2);
    expect(at(0.2) / at(1)).toBeLessThan(0.4);
    expect(at(0.6) / at(1)).toBeCloseTo(0.9, 1);
  });
});

describe('K49: the lowest useful power', () => {
  const v = cutInSpeed(FARM, FARM_MASS) ?? 0;
  const hook = FARM_MASS * G * v;
  it('below 1.9 kW at the hook (0.58 m/min) nothing comes out: higher than the research’s estimate of 1.2 kW', () => {
    expect(hook / 1000).toBeCloseTo(1.9, 1);
    expect(v * 60).toBeCloseTo(0.58, 2);
    expect(hook).toBeGreaterThan(1200);
    expect(chainAt(FARM, FARM_MASS, MID, -v * 0.9).meter).toBeGreaterThan(0);
    expect(chainAt(FARM, FARM_MASS, MID, -v * 1.1).meter).toBeLessThan(0);
  });
  it('why higher: the inverter carries the motor’s current at any speed, which the estimate left out; the torque is 78 % of rated, which lowers the copper', () => {
    const p = chainAt(FARM, FARM_MASS, MID, -v);
    expect(p.inverter).toBeCloseTo(416, 0);
    expect(p.motorCopper).toBeCloseTo(569, 0);
    expect(p.cable).toBeCloseTo(170, -1);
    expect(p.motorTorque / (FARM_MOTOR_W / rpmToRad(FARM.motorRpm))).toBeCloseTo(0.78, 2);
  });
  it('the range: 1.26 to 2.69 kW, with the estimate’s 1.2 kW just below the kindest end', () => {
    expect(answers(KIND).cutInHook / 1000).toBeCloseTo(1.26, 2);
    expect(answers(UNKIND).cutInHook / 1000).toBeCloseTo(2.69, 2);
    expect(answers(KIND).cutInHook).toBeGreaterThan(1200);
  });
  it('100 W can be had, at a price: 2.02 kW at the hook, 5 % efficiency, and the stroke is gone in about 32 minutes for about 54 Wh', () => {
    const fridge = speedForOutput(FARM, FARM_MASS, MID, 100) ?? 0;
    const atHook = FARM_MASS * G * fridge;
    expect(atHook / 1000).toBeCloseTo(2.02, 2);
    expect(100 / atHook).toBeCloseTo(0.05, 2);
    expect(FARM.stroke / fridge / 60).toBeCloseTo(32.4, 0);
    expect((100 * (FARM.stroke / fridge)) / 3600).toBeCloseTo(54, 0);
  });
  it('asking the hook itself for the fridge’s 100 W: the hoist cannot go that slowly, and at its slowest the meter pays 1.4 kW', () => {
    expect(100 / (FARM_MASS * G)).toBeLessThan(FARM.vMin);
    expect(chainAt(FARM, FARM_MASS, MID, -FARM.vMin).meter / 1000).toBeCloseTo(1.44, 2);
  });
  it('a smaller motor with a larger ratio lowers the limit, at the price of top speed and of efficiency', () => {
    const small = designHoist({ ...FARM_DESIGN, motorW: 5000 });
    expect(small.vRated * 60).toBeCloseTo(1.33, 2);
    expect(small.stages).toBe(4);
    const cut = (cutInSpeed(small, FARM_MASS) ?? 0) * FARM_MASS * G;
    expect(cut / 1000).toBeCloseTo(0.88, 2);
    expect(strokeEnergy(small, FARM_MASS, small.vRated, small.vRated).roundTrip).toBeCloseTo(0.44, 2);
  });
  it('the same structure, all sizes: below about a tenth to a third of the rated power, nothing', () => {
    const p = presetParams('garden');
    const garden = specFor('garden', p.motorKw, p.falls, p.stroke);
    if (garden.kind !== 'hoist') throw new Error('garden');
    expect((cutInSpeed(garden, p.mass) ?? 0) / garden.vRated).toBeCloseTo(0.29, 2);
    expect(v / V).toBeCloseTo(0.145, 2);
  });
});

describe('K50: the lightest load that comes down by itself', () => {
  it('on the tower, about 0.37 t: far under the 3.2 t of the empty carrier, so it is never the tower’s problem in service', () => {
    expect(lightestLoad(FARM)).toBeCloseTo(374, 0);
    expect(comesDownAlone(FARM, CARRIER_MASS, FARM.stroke)).toBe(true);
    expect(comesDownAlone(FARM, 200, FARM.stroke)).toBe(false);
  });
  it('the range, 0.2 to 0.65 t', () => {
    expect(answers(KIND).lightest).toBeCloseTo(219, 0);
    expect(answers(UNKIND).lightest).toBeCloseTo(645, 0);
  });
  it('in the courtyard, about 36 kg with a 3 cm roller and 1:27: its 12 kg stalls, as it did; every plausible roller says the same', () => {
    expect(diyLightest({ stages: 3, roller: 0.03 })).toBeCloseTo(36.5, 1);
    for (const roller of [0.01, 0.02, 0.03, 0.05, 0.08]) {
      expect(diyLightest({ stages: 3, roller })).toBeGreaterThan(12);
    }
    // his cure: more stages make it worse, the bigger roller is what helped
    expect(diyLightest({ stages: 4, roller: 0.03 })).toBeGreaterThan(diyLightest({ stages: 3, roller: 0.03 }));
    expect(diyLightest({ stages: 3, roller: 0.06 })).toBeLessThan(diyLightest({ stages: 3, roller: 0.03 }));
  });
  it('a lightness below which the machine stops paying comes long before: at 4 m/min, below about 2.7 t', () => {
    const paying = (t: number) => chainAt(FARM, t * 1000, MID, -V).meter < 0;
    expect(paying(3)).toBe(true);
    expect(paying(2.5)).toBe(false);
  });
});

describe('K51: tonnes and towers for a night', () => {
  it('7 kWh gross is 128 t; through the tower’s bursts and a battery, 287 t, or 14 towers of 20 t, or 103 m³ of concrete', () => {
    const n = nightNeed(7, FARM, FARM_MASS, 1);
    expect(n.tonnesGross).toBeCloseTo(128.4, 1);
    expect(n.tonnes).toBeCloseTo(287, 0);
    expect(n.towers).toBeCloseTo(14.3, 1);
    expect(n.volume).toBeCloseTo(103, 0);
    expect(n.blocks).toBeCloseTo(100, 0);
    expect(n.towerEta).toBeCloseTo(0.52, 2);
  });
  it('1 kWh is 50 t, or 2.5 towers; 3 kWh, 128 t, or 6.4', () => {
    expect(nightNeed(1, FARM, FARM_MASS, 1).towers).toBeCloseTo(2.48, 2);
    expect(nightNeed(3, FARM, FARM_MASS, 1).towers).toBeCloseTo(6.42, 2);
  });
  it('the kindest figure, full speed all night with no battery, a load no house asks: 179 t for 7 kWh', () => {
    expect(nightNeed(7, FARM, FARM_MASS, 1).tonnesFullSpeed).toBeCloseTo(179, 0);
  });
  it('more modules let the tower burst faster, so at better efficiency: fewer tonnes', () => {
    expect(nightNeed(7, FARM, FARM_MASS, 2).tonnes).toBeLessThan(nightNeed(7, FARM, FARM_MASS, 1).tonnes);
  });
});

describe('K52: what a full stroke delivers', () => {
  it('780 Wh of the 1,090, 0.72 of it: just under the research’s 0.8 to 0.9 kWh', () => {
    expect(stroke.output).toBeCloseTo(780, 0);
    expect(stroke.gross).toBeCloseTo(energyWh(FARM_MASS, 20), 6);
    expect(stroke.output).toBeLessThan(800);
  });
  it('the range, 658 to 878 Wh', () => {
    expect(answers(KIND).deliveredWh).toBeCloseTo(878, 0);
    expect(answers(UNKIND).deliveredWh).toBeCloseTo(658, 0);
  });
});

describe('K53: what a start costs', () => {
  it('the weight alone asks 1.007 times the power at 13 kW and 1 s, as the published formula says', () => {
    expect(rampFigures(FARM, FARM_MASS, 1).weightOnly).toBeCloseTo(1.0068, 4);
  });
  it('the formula forgets the rotor: through 188:1 and four falls it is worth about 2,075 t at the hook, a hundred times the load', () => {
    const r = rampFigures(FARM, FARM_MASS, 1);
    expect(r.rotorEquivalentMass / 1000).toBeCloseTo(2075, 0);
    expect(r.withRotor).toBeCloseTo(1.63, 2);
    expect(r.withinOverload).toBe(false);
  });
  it('so the shortest ramp the maker offers, 1.5 s, is about what the motor can do, and the lab’s 2 s asks 1.32 times the torque', () => {
    expect(rampFigures(FARM, FARM_MASS, 2).withRotor).toBeCloseTo(1.32, 2);
    expect(rampFigures(FARM, FARM_MASS, 2).withinOverload).toBe(true);
  });
  it('and yet the energy of the start is almost nothing, 1.3 Wh, and given back at the stop: S6 is right about the energy', () => {
    const r = rampFigures(FARM, FARM_MASS, 2);
    expect(r.rotorEnergy).toBeCloseTo(1.28, 2);
    expect(r.rotorEnergy / stroke.gross).toBeLessThan(0.002);
  });
});

describe('standing losses, the debt no estimate counted', () => {
  it('asleep, the controls draw 40 W: 0.96 kWh a day, about what the weight holds', () => {
    expect(standingAsleep(FARM)).toBe(40);
    expect((standingAsleep(FARM) * 24) / 1000).toBeCloseTo(0.96, 2);
  });
  it('ready to answer in a second, 284 W: 6.8 kWh a day, six times what the weight holds', () => {
    expect(standingReady(FARM)).toBeCloseTo(284, 0);
    expect((standingReady(FARM) * 24) / stroke.gross).toBeCloseTo(6.26, 1);
  });
});

describe('the helpers behind the controls', () => {
  it('a load too heavy for the motor is refused, and so is two falls at 20 t', () => {
    expect(tooHeavyFor(FARM, FARM_MASS, MID)).toBe(false);
    const two = specFor('farm', 15, 2, 20);
    if (two.kind !== 'hoist') throw new Error('farm');
    expect(two.massRated).toBe(10000);
    expect(two.vRated * 60).toBeCloseTo(8, 6);
    expect(tooHeavyFor(two, FARM_MASS, MID)).toBe(true);
    expect(tooHeavyFor(two, 10000, MID)).toBe(false);
  });
  it('up to 6 m/min at part load, and only there', () => {
    expect(vMaxFor(FARM, FARM_MASS) * 60).toBeCloseTo(4, 9);
    expect(vMaxFor(FARM, 15000) * 60).toBeCloseTo(5.33, 2);
    expect(vMaxFor(FARM, 10000) * 60).toBeCloseTo(6, 9);
  });
  it('the speed for a power, both ways, and nothing where there is none', () => {
    const out = speedForOutput(FARM, FARM_MASS, MID, 5000) ?? 0;
    expect(-chainAt(FARM, FARM_MASS, MID, -out).meter).toBeCloseTo(5000, 1);
    expect(speedForOutput(FARM, FARM_MASS, MID, 20000)).toBeNull();
    const up = speedForInput(FARM, FARM_MASS, MID, 8000) ?? 0;
    expect(chainAt(FARM, FARM_MASS, MID, up).meter).toBeCloseTo(8000, 1);
    expect(speedForInput(FARM, FARM_MASS, MID, 500)).toBeNull();
    expect(speedForInput(FARM, FARM_MASS, MID, 50000)).toBeCloseTo(V, 9);
  });
});

describe('the comparator', () => {
  const rows = comparatorRows();
  it('has three sides, each number tagged', () => {
    expect(rows.map((r) => r.id)).toEqual(['tower', 'module', 'reservoir']);
    expect(rows[0].tags.roundTrip).toBe('model');
    expect(rows[0].tags.cost).toBe('estimate');
    expect(rows[2].tags.roundTrip).toBe('reported');
  });
  it('a module beats the tower by 2,200 times per kilo and about 400 to 1,000 times on price', () => {
    expect(rows[1].whPerKg / rows[0].whPerKg).toBeCloseTo(2202, 0);
    expect(rows[0].costMin / rows[1].costMax).toBeGreaterThan(390);
  });
  it('through its inverter at the recommended current the module still returns 87 %, far above the tower', () => {
    expect(rows[1].roundTripMin).toBeCloseTo(0.872, 2);
    expect(rows[1].roundTripMin).toBeGreaterThan(rows[0].roundTripMax);
  });
  it('the race at 1 kW: 21 minutes, 4.3 hours, 14 hours', () => {
    const [tower, module, water] = raceLanes(FARM, FARM_MASS, 1000);
    expect(tower.lasts / 60).toBeCloseTo(21.3, 0);
    expect(module.lasts / 3600).toBeCloseTo(4.29, 1);
    expect(water.lasts / 3600).toBeCloseTo(14, 0);
    expect(module.stored / tower.stored).toBeCloseTo(4.4, 1);
  });
  it('the tower’s lane is 0 when the load is beyond it', () => {
    expect(raceLanes(FARM, FARM_MASS, 20000)[0].lasts).toBe(0);
  });
  it('a rung’s energy carries the status its source gives it, one figure one mark', () => {
    expect(tagMark(rungEnergyTag(rung('farm')))).toBe('†');
    expect(tagMark(rungEnergyTag(rung('leith')))).toBe('†');
    expect(tagMark(rungEnergyTag(rung('gravitylight')))).toBe('†');
    expect(tagMark(rungEnergyTag(rung('rudong')))).toBe('');
    expect(tagMark(rungEnergyTag(rung('ares')))).toBe('');
    expect(tagMark(rungEnergyTag(rung('nant')))).toBe('');
    expect(tagMark(rungEnergyTag(rung('garden')))).toBe('*');
    expect(tagMark(rungEnergyTag(rung('diy')))).toBe('*');
  });
  it('a fridge’s 100 W is not beyond it: the tower serves it, for about half an hour, at its price', () => {
    expect(raceLanes(FARM, FARM_MASS, 100)[0].lasts / 60).toBeCloseTo(32, 0);
  });
});
