import type { EfficiencyCurve } from '../sim/chain';
import type { DayResult } from '../sim/engine';
import { massFor } from '../sim/energy';
import { ISO_ENERGIES, isoLine, LADDER_BOX, RUNGS, type RungId, type Tag } from '../sim/ladder';
import type { MachineSpec } from '../sim/presets';
import type { GravityParams, GravityState, PresetId, ScenarioId, Scope } from '../sim/types';
import type { SimKey } from './strings';

// What the simulation panel plots and says, as plain functions of the simulation (no DOM), so that a test can check the numbers behind the
// charts and the wording of the status line without a browser.

export const PRESET_KEYS: Record<PresetId, SimKey> = {
  farm: 'presetFarm',
  garden: 'presetGarden',
  diy: 'presetDiy',
  gravitylight: 'presetGravitylight',
  leith: 'presetLeith',
  swiss: 'presetSwiss',
  shaft: 'presetShaft',
  rudong: 'presetRudong',
  nant: 'presetNant',
};

export const SCENARIO_KEYS: Record<ScenarioId, SimKey> = {
  'sunny-day': 'scenarioSunnyDay',
  kettle: 'scenarioKettle',
  'fridge-direct': 'scenarioFridgeDirect',
  'fridge-buffer': 'scenarioFridgeBuffer',
  night: 'scenarioNight',
  'too-light': 'scenarioTooLight',
  blackout: 'scenarioBlackout',
  overspeed: 'scenarioOverspeed',
  'wind-stop': 'scenarioWindStop',
  race: 'scenarioRace',
};

export const SCENARIO_NOTES: Record<ScenarioId, SimKey> = {
  'sunny-day': 'noteSunnyDay',
  kettle: 'noteKettle',
  'fridge-direct': 'noteFridgeDirect',
  'fridge-buffer': 'noteFridgeBuffer',
  night: 'noteNight',
  'too-light': 'noteTooLight',
  blackout: 'noteBlackout',
  overspeed: 'noteOverspeed',
  'wind-stop': 'noteWindStop',
  race: 'noteRace',
};

export const RUNG_KEYS: Record<RungId, SimKey> = {
  gravitylight: 'rungGravitylight',
  diy: 'rungDiy',
  garden: 'rungGarden',
  farm: 'rungFarm',
  leith: 'rungLeith',
  swiss: 'rungSwiss',
  'green-gravity': 'rungGreenGravity',
  shaft: 'rungShaft',
  ares: 'rungAres',
  rudong: 'rungRudong',
  nant: 'rungNant',
};

export interface Readout {
  key: SimKey;
  value: number;
  digits: number;
  unit: string;
  tag: Tag;
}

/** A power as a value and a unit that suit it. */
export function scaledPower(watts: number): { value: number; digits: number; unit: string } {
  const a = Math.abs(watts);
  if (a >= 1e6) return { value: watts / 1e6, digits: 2, unit: 'MW' };
  if (a >= 1000) return { value: watts / 1000, digits: a >= 1e5 ? 0 : 2, unit: 'kW' };
  return { value: watts, digits: 0, unit: 'W' };
}

/** An energy as a value and a unit that suit it. */
export function scaledEnergy(wh: number): { value: number; digits: number; unit: string } {
  const a = Math.abs(wh);
  if (a >= 1e6) return { value: wh / 1e6, digits: 1, unit: 'MWh' };
  if (a >= 1000) return { value: wh / 1000, digits: 2, unit: 'kWh' };
  return { value: wh, digits: a < 10 ? 2 : 0, unit: 'Wh' };
}

/** The figures that stay in sight. The meter is shown as what the machine gives: positive when it gives back. */
export function mainReadouts(s: GravityState): Readout[] {
  return [
    { key: 'liveHeight', value: s.z, digits: 1, unit: 'm', tag: 'derived' },
    { key: 'liveStored', ...scaledEnergy(s.storedWh), tag: 'derived' },
    { key: 'liveHook', ...scaledPower(s.chain.hook), tag: 'derived' },
    { key: 'liveMeter', ...scaledPower(-s.chain.meter), tag: 'estimate' },
    { key: 'liveEta', value: 100 * s.etaNow, digits: 0, unit: '%', tag: 'estimate' },
    { key: 'liveSpeed', value: s.speedMpm, digits: s.speedMpm < 1 ? 2 : 1, unit: 'm/min', tag: 'derived' },
  ];
}

/** The rest, folded. */
export function moreReadouts(s: GravityState, unitRpm: string): Readout[] {
  return [
    { key: 'moreMotorTorque', value: s.motorTorque, digits: 1, unit: 'N·m', tag: 'estimate' },
    { key: 'moreMotorRpm', value: s.motorRpm, digits: 0, unit: unitRpm, tag: 'estimate' },
    { key: 'moreDrumRpm', value: s.drumRpm, digits: 1, unit: unitRpm, tag: 'estimate' },
    { key: 'moreDrumTorque', value: s.drumTorque / 1000, digits: 1, unit: 'kN·m', tag: 'estimate' },
    { key: 'moreRopeTension', value: s.ropeTension / 1000, digits: 1, unit: 'kN', tag: 'estimate' },
    { key: 'moreCurrent', value: s.motorAmps, digits: 1, unit: 'A', tag: 'estimate' },
    { key: 'moreRise', value: s.motorRise, digits: 0, unit: 'K', tag: 'estimate' },
    { key: 'moreDc', value: s.dcVolts, digits: 0, unit: 'V', tag: 'estimate' },
    { key: 'moreEnergyIn', ...scaledEnergy(s.energyIn), tag: 'estimate' },
    { key: 'moreEnergyOut', ...scaledEnergy(s.energyOut), tag: 'estimate' },
    { key: 'moreStanding', ...scaledEnergy(s.energyStanding), tag: 'estimate' },
    { key: 'moreDumped', ...scaledEnergy(s.energyDumped), tag: 'estimate' },
    { key: 'moreDeliverable', ...scaledEnergy(s.deliverableWh), tag: 'estimate' },
    { key: 'moreRoundTripNow', value: 100 * s.roundTripNow, digits: 0, unit: '%', tag: 'estimate' },
    { key: 'morePv', ...scaledPower(s.pv), tag: 'assumption' },
    { key: 'moreLoad', ...scaledPower(s.load), tag: 'assumption' },
    { key: 'moreGrid', ...scaledPower(s.gridPower), tag: 'estimate' },
    { key: 'moreLfp', ...scaledPower(s.lfpPower), tag: 'estimate' },
    { key: 'moreSoc', value: 100 * s.soc, digits: 0, unit: '%', tag: 'estimate' },
    {
      key: 'moreServed',
      value: s.loadAskedWh > 0 ? (100 * s.loadServedWh) / s.loadAskedWh : 0,
      digits: 0,
      unit: '%',
      tag: 'estimate',
    },
  ];
}

export interface Segment {
  key: SimKey;
  watts: number;
  colour: string;
}

const COLOUR = {
  useful: '#2f8f5b',
  guide: '#8a7a5c',
  reeving: '#b08a4a',
  gear: '#c4692c',
  motor: '#c99700',
  cable: '#2a7fb8',
  inverter: '#6b4fd8',
  supply: '#8e7cdb',
  aux: '#b23a48',
} as const;

/**
 * The power crossing the machine, stage by stage: going up from the meter to the weight, going down from the weight to the meter. The
 * segments add up to what enters the chain. Empty when nothing moves: holding, only the standby is left (`statusOf` says so).
 */
export function lossSegments(s: GravityState): Segment[] {
  const c = s.chain;
  if (s.mode !== 'raising' && s.mode !== 'lowering' && s.mode !== 'stopping') return [];
  const useful = s.mode === 'raising' ? c.hook : Math.max(0, -c.meter);
  return [
    { key: s.mode === 'raising' ? 'chainIntoWeight' : 'chainOut', watts: useful, colour: COLOUR.useful },
    { key: 'chainGuide', watts: c.guide, colour: COLOUR.guide },
    { key: 'chainReeving', watts: c.reeving + c.drum, colour: COLOUR.reeving },
    { key: 'chainGear', watts: c.gear, colour: COLOUR.gear },
    { key: 'chainMotor', watts: c.motor, colour: COLOUR.motor },
    { key: 'chainCable', watts: c.cable, colour: COLOUR.cable },
    { key: 'chainInverter', watts: c.inverter, colour: COLOUR.inverter },
    { key: 'chainSupply', watts: c.supply, colour: COLOUR.supply },
    { key: 'chainAux', watts: c.auxiliaries, colour: COLOUR.aux },
  ];
}

export type Tone = 'note' | 'warn';

/** What the status line says now: one message, the most important first. */
export function statusOf(s: GravityState, p: GravityParams, kind: MachineSpec['kind']): { key: SimKey; tone: Tone } {
  if (kind === 'energy') return { key: 'statusEnergy', tone: 'note' };
  if (s.mode === 'crashed') return { key: 'statusCrashed', tone: 'warn' };
  if (s.mode === 'falling') return { key: 'statusFalling', tone: 'warn' };
  if (s.mode === 'tripped') return { key: 'statusTripped', tone: 'warn' };
  const a = s.alarms;
  if (a.includes('stalled')) return { key: 'statusStalled', tone: 'warn' };
  if (a.includes('gridLost')) return { key: 'statusGrid', tone: 'warn' };
  if (a.includes('gateOpen')) return { key: 'statusGate', tone: 'warn' };
  if (a.includes('windStop')) return { key: 'statusWind', tone: 'warn' };
  if (a.includes('overload')) return { key: 'statusOverload', tone: 'warn' };
  if (a.includes('ropeFactor')) return { key: 'statusRope', tone: 'warn' };
  if (a.includes('motorHot')) return { key: 'statusHot', tone: 'warn' };
  if (a.includes('tooLight')) return { key: 'statusTooLight', tone: 'warn' };
  if (a.includes('belowCutIn')) return { key: 'statusBelowCutIn', tone: 'warn' };
  if (kind === 'diy' && s.mode === 'lowering') return { key: 'statusDiy', tone: 'note' };
  if (s.mode === 'waking') return { key: 'statusWaking', tone: 'note' };
  if (s.mode === 'raising') return { key: 'statusRaising', tone: 'note' };
  if (s.mode === 'lowering') return { key: 'statusLowering', tone: 'note' };
  if (s.mode === 'stopping') return { key: 'statusStopping', tone: 'note' };
  if (a.includes('storeFull')) return { key: 'statusFull', tone: 'note' };
  if (a.includes('storeEmpty')) return { key: 'statusEmpty', tone: 'note' };
  return { key: p.sleepWhenIdle && s.drive === 'sleep' ? 'statusSleep' : 'statusHold', tone: 'note' };
}

// ------------------------------------------------------------------------------------------------ charts

/** Top of an axis whose ticks fall on round figures for the kit's three intervals: three times 1, 2, 2.5 or 5 times a power of ten. */
export function niceCeil3(v: number): number {
  if (!(v > 0)) return 3;
  const p = Math.pow(10, Math.floor(Math.log10(v / 3)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= 3 * m * p) return 3 * m * p;
  return 30 * p;
}

/**
 * An axis with zero on one of its ticks and room below it: −a, 0, a, 2a (the kit's charts have three intervals), `a` being `top / 2` taken up
 * to two figures.
 */
export function axisThroughZero(top: number): { yMin: number; yMax: number } {
  const half = Math.max(top, 1e-6) / 2;
  const p = Math.pow(10, Math.floor(Math.log10(half)) - 1);
  const a = Math.ceil(half / p) * p;
  return { yMin: -a, yMax: 2 * a };
}

/** What comes out against the power at the hook, in kW (or W for a small machine; the unit is returned). */
export function outChartData(c: EfficiencyCurve) {
  const top = Math.max(...c.hook);
  const scale = top >= 1000 ? 1000 : 1;
  const unit = scale === 1000 ? 'kW' : 'W';
  return {
    xs: c.hook.map((v) => v / scale),
    ys: { out: c.out.map((v) => v / scale), ideal: c.hook.map((v) => v / scale) },
    unit,
    scale,
    ...axisThroughZero(top / scale),
  };
}

export function etaChartData(c: EfficiencyCurve) {
  const top = Math.max(...c.hook);
  const scale = top >= 1000 ? 1000 : 1;
  return {
    xs: c.hook.map((v) => v / scale),
    ys: { down: c.down, up: c.up, roundTrip: c.roundTrip },
    unit: scale === 1000 ? 'kW' : 'W',
    scale,
  };
}

/** The ladder chart: lines of equal energy in log10 units, each with its own stretch of a shared list of abscissas. */
export function ladderChartData(): { xs: number[]; ys: Record<string, number[]> } {
  const box = LADDER_BOX;
  const xs: number[] = [box.xMin];
  const spans: { key: string; from: number; pts: [number, number][] }[] = [];
  ISO_ENERGIES.forEach((wh, i) => {
    const pts = isoLine(wh);
    spans.push({ key: `iso-${i}`, from: xs.length, pts });
    for (const pt of pts) xs.push(pt[0]);
  });
  xs.push(box.xMax);
  const ys: Record<string, number[]> = {};
  for (const sp of spans) {
    const col = new Array<number>(xs.length).fill(Number.NaN);
    sp.pts.forEach((pt, i) => (col[sp.from + i] = pt[1]));
    ys[sp.key] = col;
  }
  return { xs, ys };
}

/** A mark per machine: x log10 of the height in m, y log10 of the mass in tonnes, numbered as in the list under the chart. */
export const rungMarks = (): { x: number; y: number; label: string; id: RungId }[] =>
  RUNGS.map((r, i) => ({ x: Math.log10(r.height), y: Math.log10(r.mass / 1000), label: String(i + 1), id: r.id }));

/** A mark on each line of equal energy, near the left of the chart, to name it. */
export function isoMarks(): { x: number; y: number; wh: number; label: string }[] {
  const x = 0.15;
  const units = ['1 Wh', '1 kWh', '1 MWh', '1 GWh'];
  return ISO_ENERGIES.map((wh, i) => ({ x, y: Math.log10(massFor(wh, Math.pow(10, x)) / 1000), wh, label: units[i] }));
}

/** The calculator's own point. */
export const ladderMark = (tonnes: number, height: number): { x: number; y: number } => ({
  x: Math.log10(height),
  y: Math.log10(tonnes),
});

export function dayChartData(d: DayResult) {
  return { xs: d.hours, power: { pv: d.pv, load: d.load, meter: d.meter }, height: { z: d.z } };
}

/** The last minute, with time counted back from now (0 at the right edge), in kW. */
export function liveChartData(scope: Scope) {
  const n = scope.t.length;
  const last = n ? scope.t[n - 1] : 0;
  return {
    xs: scope.t.map((x) => x - last),
    hook: scope.hook.map((v) => v / 1000),
    meter: scope.meter.map((v) => -v / 1000),
  };
}

/** How far a lane of the race has gone, 0 to 1, after `elapsed` seconds of the clock. */
export const raceLeft = (lasts: number, elapsed: number): number => (lasts > 0 ? Math.max(0, 1 - elapsed / lasts) : 0);
