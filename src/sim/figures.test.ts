import { describe, expect, it } from 'vitest';
import { chainAt } from './chain';
import {
  BRICKS_COST,
  headFor,
  LEITH_COST,
  lfpCo2Kg,
  massCostPerKwh,
  NANT,
  PACK_COST,
  RESPONSE_CLAIMS,
  ROUND_TRIP_CLAIMS,
  STATUS,
  TOWER_COST,
  towerCo2Tonnes,
  towersPerModule,
} from './comparator';
import { FRIDGE_KWH_YEAR, fridgeKwhPerDay, KETTLE_W } from './day';
import { DIY_FIRST, DIY_MOTOR_RPM, DIY_MOTOR_VOLTS, DIY_STAGE_RATIO, diyAscent, diyDescent, diyLightest } from './diy';
import { energyWh, heightForKwh, kwhPerM3, massFor, strokeTime, whPerKg } from './energy';
import { aresHeight, rung, rungEnergyWh } from './ladder';
import { LFP, LFP_VOLUME } from './lfp';
import {
  BLOCK,
  CARRIER_MASS,
  CATALOGUE_RATIO,
  FARM,
  FARM_BRAKE_W,
  FARM_MASS,
  FARM_MOTOR_W,
  FARM_STROKE,
  G,
  HALF_BLOCK,
  HOIST_MASS,
  MOTOR_AMPS,
  MOTOR_COS_PHI,
  MOTOR_RPM,
  ROPE_FACTOR_MIN,
  ROPE_FMIN,
  ROPE_MASS_PER_M,
  stackFor,
  STACK_BLOCKS,
  STACK_HALVES,
} from './machine';
import { STACK_VOLUME } from './night';
import { presetParams } from './presets';
import { ropeFactor, ropeLength, staticTension } from './reeving';

// One test per key figure of docs/research.md §2, with its K number in the name. These are the figures that are arithmetic or published
// data; what the model has to find by itself (K47 to K53) is in chain.test.ts and engine.test.ts. Where a source and the arithmetic differ,
// the test holds the arithmetic and its name says so.

describe('core physics', () => {
  it('K1: 1 kWh is one tonne raised 366.97 m', () => {
    expect(heightForKwh(1000)).toBeCloseTo(366.97, 2);
    expect(energyWh(1000, 366.97)).toBeCloseTo(1000, 1);
  });
  it('K2: 10 MWh needs 36,697 t at 100 m or 1,835 t at 2,000 m', () => {
    expect(massFor(10e6, 100) / 1000).toBeCloseTo(36697, 0);
    expect(massFor(10e6, 2000) / 1000).toBeCloseTo(1835, 0);
  });
  it('K3: 1,000 t at 2,000 m is 5.45 MWh (the source writes 5.4, cut short)', () => {
    expect(energyWh(1e6, 2000) / 1e6).toBeCloseTo(5.45, 2);
  });
  it('K4: 0.0545 Wh/kg at 20 m against 120 Wh/kg for an LFP module, a ratio of about 2,200', () => {
    expect(whPerKg(20)).toBeCloseTo(0.0545, 4);
    expect((LFP.kwh * 1000) / LFP.mass).toBeCloseTo(120, 6);
    expect(120 / whPerKg(20)).toBeCloseTo(2202, 0);
  });
  it('K5: per volume, the tower falls below the quoted shaft range; the module is inside the Li-ion range', () => {
    // what the model gives: concrete at 20 m. The published range (0.2 to 3.1 kWh/m³) is for shafts, not for 20 m
    const density = BLOCK.mass / (BLOCK.length * BLOCK.width * BLOCK.height);
    expect(kwhPerM3(density, 20)).toBeCloseTo(0.128, 3);
    expect(kwhPerM3(density, 20)).toBeLessThan(0.2);
    // iron at 100 m sits inside it
    expect(kwhPerM3(7800, 100)).toBeGreaterThan(0.2);
    expect(kwhPerM3(7800, 100)).toBeLessThan(3.1);
    // the pumped range starts at about 49 m of head; Nant de Drance, at 294 m, is above its 0.5 kWh/m³
    expect(kwhPerM3(1000, 48.8)).toBeCloseTo(0.133, 3);
    expect(kwhPerM3(1000, NANT.head)).toBeCloseTo(0.801, 3);
    const li = LFP.kwh / LFP_VOLUME;
    expect(li).toBeGreaterThan(94);
    expect(li).toBeLessThan(500);
  });
});

describe('the lab’s machine', () => {
  it('K6: the preset of the farm is 20,000 kg, a 20 m stroke, four falls', () => {
    const p = presetParams('farm');
    expect(p.mass).toBe(20000);
    expect(p.stroke).toBe(20);
    expect(p.falls).toBe(4);
  });
  it('K7: gross energy is 1.09 kWh, 3.92 MJ', () => {
    expect(energyWh(FARM_MASS, FARM_STROKE) / 1000).toBeCloseTo(1.09, 3);
    expect((FARM_MASS * G * FARM_STROKE) / 1e6).toBeCloseTo(3.92, 2);
  });
  it('K8: 0.08 to 4 m/min at 20 t, so 262 W to 13.08 kW at the hook', () => {
    expect(FARM.vRated * 60).toBeCloseTo(4, 9);
    expect(FARM.vMin * 60).toBeCloseTo(0.08, 9);
    expect(FARM_MASS * G * FARM.vMin).toBeCloseTo(261.6, 1);
    expect(FARM_MASS * G * FARM.vRated).toBeCloseTo(13080, 6);
  });
  it('K9: the full stroke takes 5 minutes at the top speed and 4.2 hours at the lowest', () => {
    expect(strokeTime(20, FARM.vRated)).toBeCloseTo(300, 6);
    expect(strokeTime(20, FARM.vMin) / 3600).toBeCloseTo(4.17, 2);
  });
  it('K10: the motor is 15 kW, 28 A, cos φ 0.82, and the model draws that current at its rated torque', () => {
    expect(FARM.motorW).toBe(15000);
    expect(FARM.motorAmps).toBe(28);
    expect(FARM.cosPhi).toBe(0.82);
    expect(MOTOR_RPM).toBeLessThan(3000); // 4 poles at 100 Hz: 3,000 rpm synchronous
    const torqueRated = FARM_MOTOR_W / ((MOTOR_RPM * 2 * Math.PI) / 60);
    // the catalogue's point loads the motor to just under its rating, and the current follows
    const p = chainAt(FARM, FARM_MASS, FARM_STROKE / 2, FARM.vRated);
    expect(p.motorTorque / torqueRated).toBeGreaterThan(0.95);
    expect(p.motorTorque / torqueRated).toBeLessThan(1);
    expect(p.current).toBeCloseTo(27.7, 1);
    expect(p.current).toBeLessThan(MOTOR_AMPS);
  });
  it('K11: the catalogue implies at least 0.872 from motor to hook, and the model stays above it, inside the rating', () => {
    expect(CATALOGUE_RATIO).toBeCloseTo(0.872, 3);
    const p = chainAt(FARM, FARM_MASS, FARM_STROKE / 2, FARM.vRated);
    expect(p.hook / p.shaft).toBeGreaterThan(0.872);
    expect(p.hook / p.shaft).toBeCloseTo(0.8875, 3);
    expect(p.shaft).toBeLessThan(FARM_MOTOR_W);
  });
  it('K12: the rating table reads as 0.94 at 400 V and 0.91 at 415 V; the model takes 0.921 from the IE3 table, between them', () => {
    const input = (v: number) => Math.sqrt(3) * v * MOTOR_AMPS * MOTOR_COS_PHI;
    expect(input(400)).toBeCloseTo(15907, 0);
    expect(FARM_MOTOR_W / input(400)).toBeCloseTo(0.943, 3);
    expect(FARM_MOTOR_W / input(415)).toBeCloseTo(0.909, 3);
    expect(FARM_MOTOR_W / input(380)).toBeCloseTo(0.993, 3); // too good: the table is rounded
    expect(FARM.motorEta).toBeCloseTo(0.921, 3);
    expect(FARM.motorEta).toBeGreaterThan(0.909);
    expect(FARM.motorEta).toBeLessThan(0.943);
  });
  it('K13: 49 kN per fall before friction, a factor of 6.4; with friction at the bottom of the stroke, still above the maker’s 5', () => {
    expect(staticTension(FARM_MASS, 4)).toBeCloseTo(49050, 0);
    expect(ropeFactor(ROPE_FMIN, staticTension(FARM_MASS, 4))).toBeCloseTo(6.42, 2);
    const p = chainAt(FARM, FARM_MASS, 0, FARM.vRated);
    expect(p.ropeFactor).toBeCloseTo(6.13, 2);
    expect(p.ropeFactor).toBeGreaterThan(ROPE_FACTOR_MIN);
  });
  it('K14: about 84 m of rope, about 138 kg', () => {
    expect(ropeLength(4, 20)).toBe(84);
    expect(ropeLength(4, 20) * ROPE_MASS_PER_M).toBeCloseTo(137.8, 1);
  });
  it('K15: the hoist weighs 1,321 kg and is not part of the store', () => {
    expect(HOIST_MASS).toBe(1321);
  });
  it('K16: the service brake counts the reference 69 W among the machine’s standing draws', () => {
    expect(FARM_BRAKE_W).toBe(69);
    expect(FARM.brakesW).toBeGreaterThan(69);
  });
  it('K17: a block is 1.024 m³ and about 2,400 kg, a half block 0.512 m³ and 1,200 kg', () => {
    expect(BLOCK.length * BLOCK.width * BLOCK.height).toBeCloseTo(1.024, 6);
    expect(BLOCK.mass).toBe(2400);
    expect(HALF_BLOCK.length * HALF_BLOCK.width * HALF_BLOCK.height).toBeCloseTo(0.512, 6);
    expect(HALF_BLOCK.mass).toBe(1200);
  });
  it('K18: six blocks and two half blocks are 16.8 t, 1.6 × 1.6 × 2.8 m, and the carrier takes the remaining 3.2 t', () => {
    expect(STACK_BLOCKS * BLOCK.mass + STACK_HALVES * HALF_BLOCK.mass).toBe(16800);
    expect(CARRIER_MASS).toBe(3200);
    expect((STACK_BLOCKS / 2) * BLOCK.height + (STACK_HALVES / 2) * HALF_BLOCK.height).toBeCloseTo(2.8, 6);
    expect(2 * BLOCK.width).toBeCloseTo(BLOCK.length, 9);
    expect(stackFor(FARM_MASS)).toEqual({ blocks: 6, halves: 2, rest: 0 });
    expect(stackFor(CARRIER_MASS).blocks).toBe(0);
    expect(STACK_VOLUME).toBeCloseTo(7.168, 3);
  });
});

describe('real machines', () => {
  it('K19: Edinburgh is 2 × 25 t, a 15 m tower, 250 kW, a £1 M project', () => {
    const r = rung('leith');
    expect(r.mass).toBe(50000);
    expect(r.height).toBe(15);
    expect(r.power).toBe(250000);
    expect(r.built).toBe(true);
    expect(LEITH_COST).toBe(1e6);
  });
  it('K20: at most 2.04 kWh, 29 s at 250 kW; 8.4 m and 1.14 kWh at the announced 0.6 m/s for 14 s; 294 kW, so η ≈ 0.85', () => {
    expect(energyWh(50000, 15) / 1000).toBeCloseTo(2.04, 2);
    expect((energyWh(50000, 15) * 3600) / 250000).toBeCloseTo(29.4, 1);
    expect(0.6 * 14).toBeCloseTo(8.4, 6);
    expect(energyWh(50000, 8.4) / 1000).toBeCloseTo(1.14, 2);
    expect(50000 * G * 0.6).toBeCloseTo(294300, 0);
    expect(250000 / (50000 * G * 0.6)).toBeCloseTo(0.85, 2);
  });
  it('K21: 3.906 kWh at 42 m means 34.1 t; 0.7 m/s for 60 s; 95 %, 79.5 % and 75 % follow from the three energies; 186 kW', () => {
    expect(massFor(3906, 42) / 1000).toBeCloseTo(34.1, 1);
    expect(42 / 0.7).toBeCloseTo(60, 6);
    expect(3.906 / 4.124).toBeCloseTo(0.947, 3);
    expect(3.106 / 3.906).toBeCloseTo(0.795, 3);
    expect(3.106 / 4.124).toBeCloseTo(0.753, 3);
    expect((3106 * 3600) / 60 / 1000).toBeCloseTo(186, 0);
    expect(rungEnergyWh(rung('swiss')) / 1000).toBeCloseTo(3.906, 1);
  });
  it('K22: the sources disagree on the block (35 t, or 34.1 t by the energy): the ladder takes the energy’s, and says it is derived', () => {
    expect(rung('swiss').mass).toBe(34100);
    expect(rung('swiss').tag).toBe('derived');
    expect(energyWh(35000, 42) / 1000).toBeCloseTo(4.0, 1);
  });
  it('K23: Rudong is 25 MW and 100 MWh, 148 m tall', () => {
    expect(rung('rudong').power).toBe(25e6);
    expect(rungEnergyWh(rung('rudong')) / 1e6).toBeCloseTo(100, 0);
  });
  it('K24: 100 MWh asks 36.7 million t·m: about 248,000 t at 148 m, about 367,000 t at a mean 100 m', () => {
    expect((massFor(100e6, 1) / 1000 / 1e6).toFixed(1)).toBe('36.7');
    expect(massFor(100e6, 148) / 1000).toBeCloseTo(247950, -3);
    expect(massFor(100e6, 100) / 1000).toBeCloseTo(366972, -3);
  });
  it('K25: 500 t in 500 m is 681 kWh; the 340 shafts of the Midlands, 0.804 GWh in all, are 4 % of Nant de Drance', () => {
    expect(rungEnergyWh(rung('shaft')) / 1000).toBeCloseTo(681, 0);
    expect(0.804e9 / NANT.energy).toBeCloseTo(0.04, 2);
  });
  it('K26: 9.3 km at 7.05 % is 656 m; 12.5 MWh on that height asks about 7,000 t (the 75,000 t of the other figure is another configuration)', () => {
    expect(aresHeight(9300, 7.05)).toBeCloseTo(655.65, 2);
    expect(rungEnergyWh(rung('ares')) / 1e6).toBeCloseTo(12.5, 1);
    expect(energyWh(75000e3, 655.65) / 1e6).toBeCloseTo(134, 0);
  });
  it('K27: the Australian shaft is 400 m and 150 kW, and its mass is flagged as ours', () => {
    const r = rung('green-gravity');
    expect(r.height).toBe(400);
    expect(r.power).toBe(150000);
    expect(r.built).toBe(false);
    expect(r.tag).toBe('estimate');
  });
  it('K28: the lamp takes in 221 J and gives 72 to 90 J back: 33 to 41 %', () => {
    const input = 12.5 * G * 1.8;
    expect(input).toBeCloseTo(220.7, 1);
    expect(0.1 * 12 * 60).toBeCloseTo(72, 6);
    expect(0.05 * 28 * 60).toBeCloseTo(84, 6);
    expect(0.075 * 20 * 60).toBeCloseTo(90, 6);
    expect(72 / input).toBeCloseTo(0.33, 2);
    expect(90 / input).toBeCloseTo(0.41, 2);
  });
  it('K29: the courtyard’s ratios add up, 12 kg stalls at 1:27 and 46 kg moves', () => {
    expect(Math.pow(DIY_STAGE_RATIO, 3)).toBe(27);
    expect(DIY_MOTOR_RPM).toBe(620);
    expect(DIY_MOTOR_VOLTS).toBe(12);
    expect(33 + 35).toBe(68);
    expect(diyDescent(12, DIY_FIRST).speed).toBe(0);
    expect(diyDescent(46, DIY_FIRST).speed).toBeGreaterThan(0);
  });
  it('K30: 46 kg over 4 to 8 m is 0.5 to 1 Wh; two 5 W bulbs would last 3 to 6 minutes with no loss; the model finds much less out', () => {
    expect(energyWh(46, 4)).toBeCloseTo(0.5, 1);
    expect(energyWh(46, 8)).toBeCloseTo(1, 1);
    expect((energyWh(46, 4) * 60) / 10).toBeCloseTo(3, 0);
    expect((energyWh(46, 8) * 60) / 10).toBeCloseTo(6, 0);
    // what the model gives with its estimates (not a retrieval: the video gives no power)
    const down = diyDescent(46, DIY_FIRST);
    const up = diyAscent(46, DIY_FIRST);
    expect(down.electric).toBeCloseTo(3.1, 1);
    expect(down.efficiency).toBeCloseTo(0.1, 2);
    expect(up.efficiency).toBeCloseTo(0.23, 2);
    expect(diyLightest(DIY_FIRST)).toBeCloseTo(36.5, 1);
  });
});

describe('comparators and context', () => {
  it('K31: the module is 4.8 kWh, 4.56 usable, 30 litres, 40 kg, €231/kWh', () => {
    expect(LFP.kwh * LFP.depth).toBeCloseTo(4.56, 6);
    expect(LFP.usableKwh).toBe(4.56);
    expect(LFP_VOLUME * 1000).toBeCloseTo(30.07, 2);
    expect(LFP.price / LFP.kwh).toBeCloseTo(231.4, 1);
    expect(LFP.cycles).toBeGreaterThanOrEqual(6000);
  });
  it('K32: one module holds 4.4 towers', () => {
    expect(towersPerModule()).toBeCloseTo(4.4, 2);
  });
  it('K33: Nant de Drance is 900 MW, 20 GWh, 25 million m³, about 22 h at full power', () => {
    expect(NANT.power).toBe(900e6);
    expect(NANT.energy).toBe(20e9);
    expect(NANT.volume).toBe(25e6);
    expect(NANT.energy / NANT.power).toBeCloseTo(22.2, 1);
  });
  it('K34: the head that fits is 294 m, and the capacity costs about CHF 100/kWh (a lower bound)', () => {
    expect(headFor(NANT.energy, NANT.volume)).toBeCloseTo(293.6, 1);
    expect(NANT.cost / (NANT.energy / 1000)).toBeCloseTo(100, 6);
  });
  it('K35: only one round trip in the sources is close to a measurement: the rest are claims or assumptions', () => {
    const near = ROUND_TRIP_CLAIMS.filter((c) => c.kind === 'near-measurement');
    expect(near.map((c) => c.id)).toEqual(['swiss-test']);
    expect(near[0].min).toBeCloseTo(0.75, 6);
    expect(ROUND_TRIP_CLAIMS.find((c) => c.id === 'pumped')).toMatchObject({ min: 0.65, max: 0.87 });
  });
  it('K36: the quoted responses go from under a second to 17 s', () => {
    expect(RESPONSE_CLAIMS.leith).toBe(1);
    expect(RESPONSE_CLAIMS.bricks).toBe(2.5);
    expect(RESPONSE_CLAIMS.railMax).toBe(17);
  });
  it('K37: the developers’ installed cost falls with duration, from $504 to $234/kWh', () => {
    expect(BRICKS_COST.h2).toBe(504);
    expect(BRICKS_COST.h4).toBe(360);
    expect(BRICKS_COST.h8).toBe(282);
    expect(BRICKS_COST.h24).toBe(234);
  });
  it('K38: iron at $80/t is $294/kWh at 100 m and $15/kWh at 2,000 m', () => {
    expect(massCostPerKwh(100)).toBeCloseTo(293.6, 1);
    expect(massCostPerKwh(2000)).toBeCloseTo(14.68, 2);
  });
  it('K39: battery packs at the end of 2025 are $108 to $115/kWh', () => {
    expect(PACK_COST).toEqual({ min: 108, max: 115 });
  });
  it('K40: the date of the liquidation is the Gazette’s', () => {
    expect(STATUS.gravitricityLiquidation).toBe('2025-10-01');
    expect(STATUS.gravitricityAssetsGbp).toBeCloseTo(7913.82, 2);
  });
  it('K41: the status of the sector is dated', () => {
    expect(STATUS.noCommercialPlant).toBe('2026-03');
    expect(STATUS.rudongAwaitingApprovals).toBe('2026-03');
  });
  it('K42: a fridge is 0.48 to 0.95 kWh a day', () => {
    expect(fridgeKwhPerDay(FRIDGE_KWH_YEAR[0])).toBeCloseTo(0.48, 2);
    expect(fridgeKwhPerDay(FRIDGE_KWH_YEAR[1])).toBeCloseTo(0.95, 2);
  });
  it('K43: gross and before losses, 7 kWh at 20 m is 128 t', () => {
    expect(massFor(7000, 20) / 1000).toBeCloseTo(128.4, 1);
  });
  it('K44: 1 kWh runs a 2 kW kettle for 30 minutes', () => {
    expect(KETTLE_W).toBe(2000);
    expect((1000 / KETTLE_W) * 60).toBeCloseTo(30, 6);
  });
  it('K45: the new blocks are 2.2 to 3.2 t of CO₂; a pack of 1.09 kWh, 55 to 165 kg', () => {
    const c = towerCo2Tonnes();
    expect(c.min).toBeCloseTo(2.15, 2);
    expect(c.max).toBeCloseTo(3.15, 2);
    const l = lfpCo2Kg(1.09);
    expect(l.min).toBeCloseTo(54.5, 1);
    expect(l.max).toBeCloseTo(163.5, 1);
  });
  it('K46: the tower’s rough €100,000 to €250,000 is about €92,000 to €230,000/kWh, some 400 to 1,000 times the module', () => {
    const kwh = energyWh(FARM_MASS, FARM_STROKE) / 1000;
    expect(TOWER_COST.min / kwh).toBeCloseTo(91743, 0);
    expect(TOWER_COST.max / kwh).toBeCloseTo(229358, 0);
    expect(TOWER_COST.min / kwh / (LFP.price / LFP.kwh)).toBeCloseTo(396, 0);
    expect(TOWER_COST.max / kwh / (LFP.price / LFP.kwh)).toBeCloseTo(991, 0);
  });
});

describe('the sources checked', () => {
  it('S2 is wrong: 35 t at 100 m is 34.3 MJ, not 9.6', () => {
    const joules = 35000 * G * 100;
    expect(joules / 1e6).toBeCloseTo(34.3, 1);
    expect(joules / 1e6).not.toBeCloseTo(9.6, 0);
    expect(joules / 3.6e6).toBeCloseTo(9.54, 2);
  });
  it('S1: 16,000 to 4 rpm is 4,000; 620 to 4 rpm asks 155, so five stages fit and four do not', () => {
    expect(16000 / 4).toBe(4000);
    expect(620 / 4).toBe(155);
    expect(Math.pow(3, 5)).toBeGreaterThan(155);
    expect(Math.pow(3, 4)).toBeLessThan(155);
  });
  it('S5: 20 t by 10 m/s² by 10 m is 2 MJ; 12,000 m³ of water at 50 m is 1.6 MWh', () => {
    expect((20000 * 10 * 10) / 1e6).toBe(2);
    expect(energyWh(12000e3, 50) / 1e6).toBeCloseTo(1.635, 3);
  });
  it('S6: 0.28 m/s at 0.5 m/s² is a response of 0.56 s', () => {
    expect(0.28 / 0.5).toBeCloseTo(0.56, 6);
  });
});
