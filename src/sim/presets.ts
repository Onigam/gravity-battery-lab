import { DIY_FIRST, type DiySetup } from './diy';
import {
  CATALOGUE_RATIO,
  designHoist,
  FARM_DRUM_DIAMETER,
  FARM_FALLS,
  FARM_MASS,
  FARM_MOTOR_W,
  FARM_STROKE,
  G,
  type HoistSpec,
} from './machine';
import type { Control, GravityParams, PresetId, ScenarioId } from './types';

// The lab's starting points and its knobs. A preset is a machine and its first state; a scenario teaches one thing, in a few scripted
// moves. Every number comes from docs/research.md or is marked as an assumption in docs/physics.md.

export const RANGES = {
  mass: { min: 200, max: FARM_MASS, step: 100 },
  stroke: { min: 1, max: FARM_STROKE, step: 0.5 },
  motorKw: { min: 5, max: 22, step: 0.5 },
  raiseSpeed: { min: 0.08, max: 6, step: 0.02 },
  lowerPower: { min: 50, max: 13080, step: 10 },
  loadPower: { min: 50, max: 13000, step: 50 },
  modules: { min: 1, max: 4, step: 1 },
  nightKwh: { min: 1, max: 7, step: 0.5 },
  pvKw: { min: 0, max: 36, step: 1 },
  wind: { min: 0, max: 30, step: 0.5 },
  windStop: { min: 10, max: 25, step: 1 },
  /** On a log scale: 0.01 to 100 t and 1 to 2,000 m (research §5). */
  ladderTonnes: { min: 0.01, max: 100, step: 0.01 },
  ladderHeight: { min: 1, max: 2000, step: 1 },
} as const;

export type RangedKey = keyof typeof RANGES;

export const FALLS_OPTIONS = [1, 2, 4] as const;

/** A machine the engine can run: a drive, the courtyard's gear motor, or a mark on the ladder with the energy alone. */
export interface DiySpec {
  kind: 'diy';
  massRated: number;
  stroke: number;
  setup: DiySetup;
}
export interface EnergySpec {
  kind: 'energy';
  massRated: number;
  stroke: number;
}
export type MachineSpec = HoistSpec | DiySpec | EnergySpec;

interface Base {
  kind: MachineSpec['kind'];
  mass: number;
  stroke: number;
  falls: number;
  drum: number;
  motorW: number;
}

const hookMotor = (mass: number, v: number): number => (mass * G * v) / CATALOGUE_RATIO;

/**
 * The machines. Farm: the research's (K6 to K13). Garden: research §0. Leith and Swiss: K19–K21, with falls and drum of ours. Shaft:
 * K25 at 0.5 m/s, an assumption. The drive of everything but the farm is the farm's scaled, an ESTIMATE (machine.ts).
 */
const BASES: Record<PresetId, Base> = {
  farm: {
    kind: 'hoist',
    mass: FARM_MASS,
    stroke: FARM_STROKE,
    falls: FARM_FALLS,
    drum: FARM_DRUM_DIAMETER,
    motorW: FARM_MOTOR_W,
  },
  garden: { kind: 'hoist', mass: 1000, stroke: 6, falls: 2, drum: 0.16, motorW: 1500 },
  diy: { kind: 'diy', mass: 46, stroke: 6, falls: 1, drum: 0.06, motorW: 0 },
  gravitylight: { kind: 'energy', mass: 12.5, stroke: 1.8, falls: 1, drum: 0, motorW: 0 },
  leith: { kind: 'hoist', mass: 50000, stroke: 15, falls: 2, drum: 1, motorW: hookMotor(50000, 0.6) },
  swiss: { kind: 'hoist', mass: 34100, stroke: 42, falls: 2, drum: 1.2, motorW: hookMotor(34100, 0.7) },
  shaft: { kind: 'hoist', mass: 500000, stroke: 500, falls: 4, drum: 3, motorW: hookMotor(500000, 0.5) },
  rudong: { kind: 'energy', mass: 367e6, stroke: 100, falls: 1, drum: 0, motorW: 0 },
  nant: { kind: 'energy', mass: 25e9, stroke: 294, falls: 1, drum: 0, motorW: 0 },
};

/** The range of a parameter for the machine in use (the farm's table scaled to the others). */
export function rangeFor(key: RangedKey, machine: PresetId): { min: number; max: number; step: number } {
  const r = RANGES[key];
  const b = BASES[machine];
  if (key === 'mass') {
    const max = b.mass;
    const min = b.kind === 'diy' ? 5 : max / 100;
    return { min, max: b.kind === 'diy' ? 70 : max, step: nice(max / 200) };
  }
  if (key === 'stroke') return { min: Math.min(1, b.stroke), max: b.stroke, step: nice(b.stroke / 40) };
  if (key === 'motorKw') {
    if (machine === 'farm') return r;
    const kw = b.motorW / 1000;
    return { min: kw / 3, max: kw * 1.5, step: nice(kw / 30) };
  }
  if (key === 'lowerPower' || key === 'loadPower') {
    const top = machine === 'farm' || b.motorW === 0 ? r.max : b.motorW * CATALOGUE_RATIO;
    return { min: Math.min(r.min, top / 100), max: top, step: nice(top / 1300) };
  }
  return r;
}

function nice(v: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 5]) if (v <= m * p) return m * p;
  return 10 * p;
}

/** Whether the parameters describe a machine that moves (a drive or the courtyard's gear motor). */
export const machineKind = (machine: PresetId): MachineSpec['kind'] => BASES[machine].kind;

let memoKey = '';
let memoSpec: MachineSpec | null = null;

/** The machine for these parameters. Cached: called every step. */
export function specFor(machine: PresetId, motorKw: number, falls: number, stroke: number): MachineSpec {
  const key = `${machine}|${motorKw}|${falls}|${stroke}`;
  if (key === memoKey && memoSpec) return memoSpec;
  memoKey = key;
  memoSpec = buildSpec(machine, motorKw, falls, stroke);
  return memoSpec;
}

function buildSpec(machine: PresetId, motorKw: number, falls: number, stroke: number): MachineSpec {
  const b = BASES[machine];
  if (b.kind === 'energy') return { kind: 'energy', massRated: b.mass, stroke: b.stroke };
  if (b.kind === 'diy') return { kind: 'diy', massRated: 70, stroke, setup: DIY_FIRST };
  // the gears are designed for the machine's own falls and motor; the falls in use then change the load it can hold and its speed
  const d = designHoist({ massRated: b.mass, stroke, falls: b.falls, drumDiameter: b.drum, motorW: motorKw * 1000 });
  const k = falls / b.falls;
  const ropeSame = { ropeMassPerM: d.ropeMassPerM, ropeFmin: d.ropeFmin };
  return { ...d, ...ropeSame, falls, massRated: b.mass * k, vRated: d.vRated / k, vMin: d.vMin / k };
}

/** Where a preset starts: share of the stroke, hour of the day, state of charge. */
export interface Start {
  zFraction: number;
  hour: number;
  soc: number;
}

const DEFAULTS: Omit<GravityParams, 'mass' | 'stroke' | 'falls' | 'motorKw' | 'preset' | 'machine'> = {
  slowMo: 1,
  timeScale: 1,
  running: true,
  control: 'day',
  raiseSpeed: 4,
  lowerPower: 13080,
  loadPower: 1000,
  sleepWhenIdle: true,
  waitForSun: true,
  buffer: false,
  modules: 1,
  nightKwh: 3,
  pvKw: 36,
  wind: 4,
  windStop: 18,
  gateOpen: false,
  grid: true,
  safetyGear: true,
  fault: false,
  ladderTonnes: 1,
  ladderHeight: 367,
};

export function presetParams(id: PresetId): GravityParams {
  const b = BASES[id];
  return {
    ...DEFAULTS,
    preset: id,
    machine: id,
    mass: b.mass,
    stroke: b.stroke,
    falls: b.falls,
    motorKw: b.motorW / 1000,
    control: id === 'farm' ? 'day' : b.kind === 'energy' ? 'hold' : 'lower',
    lowerPower: id === 'farm' || b.motorW === 0 ? DEFAULTS.lowerPower : b.motorW * CATALOGUE_RATIO,
  };
}

export function presetStart(id: PresetId): Start {
  // the farm opens at noon, the weight at the bottom and the sun high: it starts to climb
  return { zFraction: id === 'farm' ? 0 : 1, hour: 12, soc: 0.5 };
}

/** A change of parameters scheduled at a time of the scenario (real seconds since it began). */
export interface ScheduledEvent {
  at: number;
  patch: Partial<GravityParams>;
}

/** A parameter that moves linearly from `from` to `to` between `at` and `at + duration` (real seconds). */
export interface Ramp {
  key: 'lowerPower' | 'mass' | 'nightKwh' | 'wind';
  at: number;
  duration: number;
  from: number;
  to: number;
}

export interface ScenarioSetup {
  params: GravityParams;
  start: Start;
  events: ScheduledEvent[];
  ramps: Ramp[];
}

const running = (control: Control, patch: Partial<GravityParams> = {}): GravityParams => ({
  ...presetParams('farm'),
  preset: 'custom',
  control,
  ...patch,
});

/** The scenarios. Each teaches one thing; the numbers it shows are the model's. */
export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const none = { events: [] as ScheduledEvent[], ramps: [] as Ramp[] };
  const full = { zFraction: 1, hour: 20, soc: 0.5 };
  switch (id) {
    case 'sunny-day':
      // one day in two and a half minutes: the roof lifts it before noon, the evening spends it
      return { params: running('day', { timeScale: 600 }), start: { zFraction: 0, hour: 7, soc: 0.5 }, ...none };
    case 'kettle':
      // full speed for five minutes at the real clock: the power is there, the energy is gone in five minutes
      return {
        params: running('lower', { lowerPower: 13080, loadPower: 2000, timeScale: 1 }),
        start: full,
        ...none,
      };
    case 'fridge-direct':
      // the hook is asked for 262 W (the slowest the hoist goes), then more and more: the meter crosses zero, at last
      return {
        params: running('lower', { lowerPower: 262, loadPower: 100 }),
        start: full,
        events: [],
        ramps: [{ key: 'lowerPower', at: 4, duration: 50, from: 262, to: 2600 }],
      };
    case 'fridge-buffer':
      // the same fridge on the battery: the tower bursts into it when it runs low
      return {
        params: running('load', { loadPower: 100, buffer: true, timeScale: 600 }),
        start: { zFraction: 1, hour: 20, soc: 0.32 },
        ...none,
      };
    case 'night':
      // the night grows from 1 to 7 kWh: the ghost stack grows on the farmyard
      return {
        params: running('hold', { nightKwh: 1 }),
        start: full,
        events: [],
        ramps: [{ key: 'nightKwh', at: 3, duration: 40, from: 1, to: 7 }],
      };
    case 'too-light':
      // blocks come off while it comes down at a constant speed: first it stops paying, then it stops moving on its own
      return {
        params: running('lower', { lowerPower: 6540, mass: 20000 }),
        start: full,
        events: [],
        ramps: [{ key: 'mass', at: 4, duration: 60, from: 20000, to: 200 }],
      };
    case 'blackout':
      // the supply goes at full speed down: the power has nowhere to go but the resistor, then the brakes set
      return {
        params: running('lower', { lowerPower: 13080 }),
        start: full,
        events: [
          { at: 12, patch: { grid: false } },
          { at: 42, patch: { grid: true, control: 'hold' } },
        ],
        ramps: [],
      };
    case 'overspeed':
      // a shaft breaks at full speed down: the governor trips and the wedges bite, seen at 1/20 of the speed
      return {
        params: running('lower', { lowerPower: 13080 }),
        start: full,
        events: [{ at: 5, patch: { fault: true, slowMo: 0.05 } }],
        ramps: [],
      };
    case 'wind-stop':
      // the wind rises past the stop and falls again
      return {
        params: running('lower', { lowerPower: 6540, windStop: 18 }),
        start: full,
        events: [],
        ramps: [
          { key: 'wind', at: 2, duration: 25, from: 6, to: 24 },
          { key: 'wind', at: 32, duration: 25, from: 24, to: 8 },
        ],
      };
    case 'race':
      // the same 1 kW evening from a tower, a module and the same mass of water up an Alpine head
      return { params: running('load', { loadPower: 1000, timeScale: 60 }), start: { ...full, hour: 18 }, ...none };
  }
}

export const PRESET_IDS: PresetId[] = [
  'farm',
  'garden',
  'diy',
  'gravitylight',
  'leith',
  'swiss',
  'shaft',
  'rudong',
  'nant',
];
export const SCENARIO_IDS: ScenarioId[] = [
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
];
