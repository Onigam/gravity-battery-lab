import { describe, expect, it } from 'vitest';
import {
  chainAt,
  cutInSpeed,
  efficiencyCurve,
  lightestLoad,
  rampFigures,
  shaftsAt,
  speedForOutput,
  strokeEnergy,
} from '../sim/chain';
import {
  comparatorRows,
  raceLanes,
  towerCo2Tonnes,
  towersPerModule,
  lfpCo2Kg,
  NANT,
  massCostPerKwh,
} from '../sim/comparator';
import { DIY_FIRST, diyDescent, diyLightest } from '../sim/diy';
import { GravitySim, simulateDay } from '../sim/engine';
import { energyWh, heightForKwh, strokeTime, whPerKg } from '../sim/energy';
import { lfpMaxPower, lfpRoundTrip, LFP, LFP_VOLUME } from '../sim/lfp';
import {
  BLOCK,
  CARRIER_MASS,
  CHOPPER_V,
  CONTROLS_W,
  DC_BLEED_TAU,
  DC_LINK_V,
  designHoist,
  FARM,
  FARM_BRAKE_W,
  FARM_CABLE_OHMS,
  FARM_CABLE_SECTION,
  FARM_DESIGN,
  FARM_DRUM_BRAKE_W,
  FARM_FAN_W,
  FARM_MASS,
  G,
  GEAR_DECEL,
  GEAR_DELAY,
  GEAR_STAGE_ETA,
  GOVERNOR_TRIP,
  GUIDE_FRICTION,
  RAMP_TIME,
  SHEAVE_EFFICIENCY,
  standingAsleep,
  standingReady,
  STAGE_RATIO_MAX,
  WAKE_TIME,
  WIND_HYSTERESIS,
} from '../sim/machine';
import { radToRpm } from '../sim/mech';
import { nightNeed, STACK_VOLUME } from '../sim/night';
import { presetParams, specFor } from '../sim/presets';
import { hangingRope, ropeLength, staticTension } from '../sim/reeving';
import { answers, KIND, UNKIND } from '../sim/sensitivity';
import { FIG, type FigName } from './figures';

// Every figure the texts quote by placeholder, recomputed from the simulation and the sources' arithmetic: a change of src/sim cannot go unnoticed. The value of a figure is what the
// text prints, so each one is compared at the precision it is printed: `{name}` here is the number that a rounding of the simulation has to give.

const V = FARM.vRated;
const MID = FARM.stroke / 2;
const up = chainAt(FARM, FARM_MASS, MID, V);
const down = chainAt(FARM, FARM_MASS, MID, -V);
const stroke = strokeEnergy(FARM, FARM_MASS, V, V);
const cutV = cutInSpeed(FARM, FARM_MASS) ?? 0;
const cut = chainAt(FARM, FARM_MASS, MID, -cutV);
const fridgeV = speedForOutput(FARM, FARM_MASS, MID, 100) ?? 0;
const shafts = shaftsAt(FARM, FARM_MASS);
const curve = efficiencyCurve(FARM, FARM_MASS, 10);
const kind = answers(KIND);
const unkind = answers(UNKIND);
const small = designHoist({ ...FARM_DESIGN, motorW: 5000 });
const smallCut = cutInSpeed(small, FARM_MASS) ?? 0;
const smallTrip = strokeEnergy(small, FARM_MASS, small.vRated, small.vRated).roundTrip;
const daySpec = presetParams('farm');
const dayDirect = simulateDay({ ...daySpec });
const dayBuffer = simulateDay({ ...daySpec, buffer: true });
const dayReady = simulateDay({ ...daySpec, sleepWhenIdle: false });
const n1 = nightNeed(1, FARM, FARM_MASS, 1);
const n7 = nightNeed(7, FARM, FARM_MASS, 1);
const race = raceLanes(FARM, FARM_MASS, 1000);
const lanes = Object.fromEntries(race.map((l) => [l.id, l]));
const lfpPower = lfpMaxPower(1, 0.5);
const scale = (id: 'garden' | 'leith') => {
  const p = presetParams(id);
  const s = specFor(id, p.motorKw, p.falls, p.stroke);
  if (s.kind !== 'hoist') throw new Error('not a hoist');
  return strokeEnergy(s, p.mass, s.vRated, s.vRated).roundTrip;
};
const stops = (() => {
  let a = 200;
  let b = FARM_MASS;
  for (let i = 0; i < 40; i++) {
    const c = (a + b) / 2;
    if (chainAt(FARM, c, MID, -V).meter < 0) b = c;
    else a = c;
  }
  return b;
})();

/** Runs a scenario to a given real time, keeping what a callback wants to see. */
const FRAME = 1 / 30;
function scenario(
  id: Parameters<GravitySim['applyScenario']>[0],
  seconds: number,
  each?: (s: GravitySim['state']) => void,
): GravitySim {
  const sim = new GravitySim();
  sim.applyScenario(id);
  const n = Math.round(seconds / FRAME);
  for (let i = 0; i < n; i++) {
    sim.step(FRAME);
    each?.(sim.state);
  }
  return sim;
}

const over = scenario('overspeed', 20);
const crash = (() => {
  const sim = new GravitySim();
  sim.applyScenario('overspeed');
  sim.set({ safetyGear: false });
  for (let i = 0; i < 6 / FRAME; i++) sim.step(FRAME);
  sim.set({ slowMo: 1 });
  for (let i = 0; i < 4 / FRAME; i++) sim.step(FRAME);
  return sim.state;
})();
let chopper = 0;
const cutOff = scenario('blackout', 16, (s) => {
  chopper = Math.max(chopper, s.chopperPower);
});
const cutOffDumped = cutOff.state.energyDumped;
for (let i = 0; i < 20 / FRAME; i++) cutOff.step(FRAME);
const cutOffVolts = cutOff.state.dcVolts;
let burstClock = 0;
let burstPeak = 0;
const buffer = (() => {
  const sim = new GravitySim();
  sim.applyScenario('fridge-buffer');
  for (let i = 0; i < 200 / FRAME; i++) {
    sim.step(FRAME);
    if (sim.state.bursting) burstClock += sim.params.timeScale * FRAME;
    burstPeak = Math.max(burstPeak, -sim.state.chain.meter);
  }
  return sim.state.loadServedWh;
})();
const noTower = (() => {
  const sim = new GravitySim();
  sim.applyScenario('fridge-buffer');
  sim.state.z = 0;
  for (let i = 0; i < 200 / FRAME; i++) sim.step(FRAME);
  return sim.state.loadServedWh;
})();
const hot = (() => {
  const sim = new GravitySim();
  sim.set({ control: 'raise', raiseSpeed: 4 });
  for (let i = 0; i < 310 / FRAME; i++) sim.step(FRAME);
  return sim.state.motorRise;
})();

/** What the simulation or the sources' arithmetic gives for each model and derived figure; the assumptions and estimates are checked against their constants below. */
const COMPUTED: Partial<Record<FigName, number>> = {
  kwhHeight: heightForKwh(1000),
  grossKwh: energyWh(FARM_MASS, 20) / 1000,
  grossMj: (FARM_MASS * G * 20) / 1e6,
  metreWh: energyWh(FARM_MASS, 1),
  tenCmWh: energyWh(FARM_MASS, 0.1),
  blockWh: energyWh(BLOCK.mass, 20),
  blockKettleMin: (energyWh(BLOCK.mass, 20) / 2000) * 60,
  whPerKg: whPerKg(20),
  lfpWhPerKg: (LFP.kwh * 1000) / LFP.mass,
  densityRatio: (LFP.kwh * 1000) / LFP.mass / whPerKg(20),
  towersPerModule: towersPerModule(),
  towersCount: towersPerModule(),
  hookTopKw: (FARM_MASS * G * V) / 1000,
  hookLowW: FARM_MASS * G * FARM.vMin,
  strokeMin: strokeTime(20, V) / 60,
  ropeSpeed: FARM.falls * V * 60,
  kineticJ: 0.5 * FARM_MASS * V * V,
  stackT: (FARM_MASS - CARRIER_MASS) / 1000,
  blockM3: BLOCK.length * BLOCK.width * BLOCK.height,
  stackM3: STACK_VOLUME,
  stackSize: 2.8,
  staticKn: staticTension(FARM_MASS, 4) / 1000,
  ropeFactorStatic: FARM.ropeFmin / staticTension(FARM_MASS, 4),
  kettleMin: (1000 / 2000) * 60,
  fridgeDayLow: 174 / 365,
  fridgeDayHigh: 346 / 365,
  fridgeMeanLow: (174 * 1000) / (365 * 24),
  fridgeMeanHigh: (346 * 1000) / (365 * 24),
  lfpEuroPerKwh: LFP.price / LFP.kwh,
  lfpVolumeL: LFP_VOLUME * 1000,
  lfpChargeKw: lfpPower / 1000,
  nantHead: NANT.head,
  leithMaxKwh: energyWh(50000, 15) / 1000,
  midlandsShare: (0.804 / 20) * 100,
  massCost100: massCostPerKwh(100),
  massCost2000: massCostPerKwh(2000),

  roundTrip: 100 * stroke.roundTrip,
  roundTripLow: 100 * unkind.roundTrip,
  roundTripHigh: 100 * kind.roundTrip,
  upEta: 100 * stroke.up,
  upAtTenth: curve.up[0],
  downEta: 100 * stroke.down,
  strokeInKwh: stroke.input / 1000,
  strokeOutWh: stroke.output,
  meterUpKw: up.meter / 1000,
  meterDownKw: -down.meter / 1000,
  kettles: -down.meter / 2000,
  cutInKw: (FARM_MASS * G * cutV) / 1000,
  cutInLow: kind.cutInHook / 1000,
  cutInHigh: unkind.cutInHook / 1000,
  cutCopperW: cut.motorCopper,
  cutInverterW: cut.inverter,
  cutAuxW: cut.fan + cut.brakes + cut.controls,
  cutGearsW: cut.guide + cut.reeving + cut.drum + cut.gearMesh + cut.gearDrag,
  cutCableW: cut.cable,
  cutSupplyW: cut.supply,
  fridgeHookKw: (FARM_MASS * G * fridgeV) / 1000,
  fridgeEta: (100 * 100) / (FARM_MASS * G * fridgeV),
  fridgeMin: 20 / fridgeV / 60,
  fridgeWh: (100 * 20) / fridgeV / 3600,
  slowestKw: chainAt(FARM, FARM_MASS, MID, -FARM.vMin).meter / 1000,
  burstMin: 13,
  burstKw: burstPeak / 1000,
  burstWh: buffer - noTower,
  burstTimes: (buffer - noTower) / ((100 * 20) / fridgeV / 3600),
  burstEta: 100 * n7.towerEta,
  lightestKg: lightestLoad(FARM),
  lightestLow: kind.lightest,
  lightestHigh: unkind.lightest,
  stopsPayingT: stops / 1000,
  diyLightestKg: diyLightest(DIY_FIRST),
  diyWatts: diyDescent(46).electric,
  diyRoundTrip: 100 * diyDescent(46).efficiency * 0.2268,
  dayInKwh: dayDirect.energyIn / 1000,
  dayOutKwh: dayDirect.energyOut / 1000,
  dayDirect: 100 * dayDirect.roundTrip,
  dayBuffer: 100 * dayBuffer.roundTrip,
  dayReady: 100 * dayReady.roundTrip,
  raceTowerMin: (lanes.tower?.lasts ?? 0) / 60,
  raceModuleH: (lanes.module?.lasts ?? 0) / 3600,
  raceWaterH: (lanes.water?.lasts ?? 0) / 3600,
  upGuideW: up.guide,
  upReevingW: up.reeving,
  upMeshW: up.gearMesh,
  upCableW: up.cable,
  upInverterW: up.inverter,
  upSupplyW: up.supply,
  downReevingW: down.reeving,
  downMeshW: down.gearMesh,
  downDragW: down.gearDrag,
  downCopperW: down.motorCopper,
  downIronW: down.motorIron,
  downCableW: down.cable,
  downInverterW: down.inverter,
  downSupplyW: down.supply,
  drumRpm: shafts.drum.rpm,
  drumTorqueUp: shafts.drum.torque,
  drumTorqueDown: down.drumTorque,
  stage1Rpm: radToRpm(shafts.stages[0]?.omegaOut ?? 0),
  stage1Torque: shafts.stages[0]?.torqueOut ?? 0,
  stage2Rpm: radToRpm(shafts.stages[1]?.omegaOut ?? 0),
  stage2Torque: shafts.stages[1]?.torqueOut ?? 0,
  motorTorqueUp: up.motorTorque,
  motorTorqueDown: down.motorTorque,
  motorAmpsUp: up.current,
  motorAmpsDown: down.current,
  motorRiseK: hot,
  ratio: FARM.ratio,
  hookPerTurnMm: ((Math.PI * FARM.drumDiameter) / FARM.falls / FARM.ratio) * 1000,
  tensionKn: up.ropeTension / 1000,
  ropeFactor: up.ropeFactor,
  ropeHangBottom: hangingRope(4, FARM.ropeMassPerM, 20, 0),
  ropeHangTop: hangingRope(4, FARM.ropeMassPerM, 20, 20),
  rotorTonnes: rampFigures(FARM, FARM_MASS, 1).rotorEquivalentMass / 1000,
  rampOneSecond: rampFigures(FARM, FARM_MASS, 1).withRotor,
  stopDistanceCm: 0.5 * V * RAMP_TIME * 100,
  night1T: n1.tonnes,
  night1Towers: n1.towers,
  night7T: n7.tonnes,
  night7Towers: n7.towers,
  night7M3: n7.volume,
  night7Blocks: n7.blocks,
  gross1T: n1.tonnesGross,
  gross7T: n7.tonnesGross,
  fallPeak: over.state.fallPeak,
  fallCm: over.state.fallDrop * 100,
  impactMs: crash.impactSpeed,
  impactS: crash.fallTime,
  dumpedWh: cutOffDumped,
  chopperKw: chopper / 1000,
  dc20s: cutOffVolts,
  lfpRoundTrip: 100 * lfpRoundTrip(lfpPower),
  lfpFridgeTrip: 100 * lfpRoundTrip(100),
  smallMotorKw: (FARM_MASS * G * smallCut) / 1000,
  smallMotorMpm: small.vRated * 60,
  smallMotorTrip: 100 * smallTrip,
  smallSizeTrip: 100 * scale('garden'),
  largeSizeTrip: 100 * scale('leith'),

  // assumptions and estimates: the constant they come from
  stageMax: STAGE_RATIO_MAX,
  stages: FARM.stages,
  meshEta: 100 * GEAR_STAGE_ETA,
  gearTotal: 100 * FARM.gearEtaForward,
  motorEta: 100 * FARM.motorEta,
  motorRpm: FARM.motorRpm,
  motorLossKw: (FARM.motorW * (1 / FARM.motorEta - 1)) / 1000,
  fanW: FARM_FAN_W,
  drumBrakeW: FARM_DRUM_BRAKE_W,
  brakesW: FARM_BRAKE_W + FARM_DRUM_BRAKE_W,
  controlsW: CONTROLS_W,
  controlsKwhDay: (standingAsleep(FARM) * 24) / 1000,
  readyW: standingReady(FARM),
  readyKwhDay: (standingReady(FARM) * 24) / 1000,
  wakeS: WAKE_TIME,
  dcV: DC_LINK_V,
  chopperV: CHOPPER_V,
  dcBleedS: DC_BLEED_TAU,
  cableMm2: FARM_CABLE_SECTION,
  cableOhm: FARM_CABLE_OHMS,
  inverterRatedW: FARM.inverterLossRated,
  guideShare: 100 * GUIDE_FRICTION,
  sheaveEta: 100 * SHEAVE_EFFICIENCY,
  rampS: RAMP_TIME,
  governorMs: GOVERNOR_TRIP,
  governorTimes: GOVERNOR_TRIP / V,
  governorDelayMs: GEAR_DELAY * 1000,
  wedgeG: GEAR_DECEL / G,
  windBand: WIND_HYSTERESIS,
  ropeM: ropeLength(4, 20),
  ropeKg: ropeLength(4, 20) * FARM.ropeMassPerM,
  carrierT: CARRIER_MASS / 1000,
  co2TowerLow: towerCo2Tonnes().min,
  co2TowerHigh: towerCo2Tonnes().max,
  co2LfpLow: lfpCo2Kg(1.09).min,
  co2LfpHigh: lfpCo2Kg(1.09).max,
};

/** A figure printed "about": the rounding is coarser than its digits. name: the tolerance as a share of the value, with why. */
const ROUGH: Partial<Record<FigName, number>> = {
  burstMin: 0.06, // "about 13 minutes", the clock of a scenario at ×600: 13.7 min measured at 30 frames a second
  drumTorqueUp: 0.001, // 8,496 written 8,500
  stage1Torque: 0.003, // 1,514 written 1,510
  ratio: 0.001, // 187.9
  dumpedWh: 0.03, // the time step of the integrator
  dc20s: 0.02, // the same
  chopperKw: 0.01,
  impactMs: 0.01,
  rampOneSecond: 0.002,
  co2TowerLow: 0.03, // the research rounds 7.2 m³
  co2TowerHigh: 0.02,
  co2LfpHigh: 0.01,
  downEta: 0.006, // 71.6 printed as 72, as physics.md does
  burstKw: 0.02,
  meterDownKw: 0.005,
  kettles: 0.005,
  rotorTonnes: 0.001,
  motorRiseK: 0.03,
  stageMax: 0,
  massCost2000: 0.03,
  diyRoundTrip: 0.2, // a plausibility, said as "2 %"
  densityRatio: 0.001, // 2,202, written 2,200 as the research does
  fridgeMeanHigh: 0.02, // 39.5, said as 40
  burstWh: 0.002, // 429, written 430
};

describe('the figures the texts quote', () => {
  const names = Object.keys(COMPUTED) as FigName[];
  it('covers nearly the whole table', () => {
    expect(names.length).toBeGreaterThan(150);
  });
  for (const name of names) {
    it(`${name} is what the simulation or the arithmetic gives`, () => {
      const fig = FIG[name];
      const value = COMPUTED[name] ?? Number.NaN;
      const rough = ROUGH[name];
      if (rough)
        expect(Math.abs(value - fig.v) / Math.abs(fig.v), `${name}: ${value} written ${fig.v}`).toBeLessThanOrEqual(
          rough,
        );
      else
        expect(Math.abs(value - fig.v), `${name}: ${value} written ${fig.v}`).toBeLessThanOrEqual(
          0.5000001 * 10 ** -fig.d,
        );
    });
  }
});

describe('the table', () => {
  it('holds only figures that a text or a sheet prints', () => {
    const sources = import.meta.glob(
      ['./**/*.ts', '../drawings/*.ts', '../i18n/ui.ts', '!./**/*.test.ts', '!./figures.ts', '!../drawings/*.test.ts'],
      {
        query: '?raw',
        import: 'default',
        eager: true,
      },
    ) as Record<string, string>;
    const all = Object.values(sources).join('');
    const unused = (Object.keys(FIG) as FigName[]).filter(
      (n) => !all.includes(`{${n}}`) && !all.includes(`fig('${n}')`),
    );
    expect(unused).toEqual([]);
  });
});

describe('the empty carrier', () => {
  it('comes down by itself, and at full speed still pays, barely: the limit is just below its weight', () => {
    expect(CARRIER_MASS).toBeGreaterThan(stops);
    expect(chainAt(FARM, CARRIER_MASS, MID, -V).meter).toBeLessThan(0);
    expect(-chainAt(FARM, CARRIER_MASS, MID, -V).meter).toBeLessThan(0.15 * chainAt(FARM, CARRIER_MASS, MID, -V).hook);
  });
});

describe('the comparison the lab says plainly', () => {
  it('a module holds 4.4 towers, and costs a thousandth of its price per kilowatt-hour', () => {
    const [tower, module] = comparatorRows();
    expect((module?.energy ?? 0) / (tower?.energy ?? 1)).toBeCloseTo(4.4, 1);
    expect(tower?.costMin ?? 0).toBeGreaterThan(100 * (module?.costMax ?? 0));
  });
});
