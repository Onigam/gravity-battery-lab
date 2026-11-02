import type { LabSim } from '@onigam/lab-kit/ui';
import {
  cutInSpeed,
  efficiencyCurve,
  lightestLoad,
  strokeEnergy,
  vMaxFor,
  type EfficiencyCurve,
  type StrokeEnergy,
} from './chain';
import { raceLanes, type RaceLane } from './comparator';
import { G, type HoistSpec } from './machine';
import { nightNeed, type NightNeed } from './night';
import {
  FALLS_OPTIONS,
  presetParams,
  presetStart,
  rangeFor,
  RANGES,
  scenarioSetup,
  type MachineSpec,
  type Ramp,
  type RangedKey,
  type ScheduledEvent,
  type Start,
} from './presets';
import { Store } from './store';
import type { GravityParams, GravityState, PresetId, ScenarioId, Scope } from './types';

// GravitySim: the store as the kit's `LabSim`. The chain is steady at every instant (chain.ts) and the weight moves on a speed ramp; the
// slow things (the height, the battery, the energy counters) run at the clock of `timeScale`; the scripted scenarios in real seconds.
// Deterministic: nothing drawn at random.

/** The template's wheel (src/three/device.ts) reads `angle` until the 3D role replaces it. */
export type DemoState = GravityState;

/** Longest real step at once, s (a tab that was in the background does not make one giant step). */
const DT_MAX = 0.25;
/** Longest step of the clock, s. */
const CLOCK_STEP = 20;
const SCOPE_EVERY = 0.25;
const SCOPE_LENGTH = 240;
/** Fastest the eye reads a shaft, rad/s (lab-quality §1: above that the 3D shows a blur disc). */
const DRUM_VISUAL_MAX = 3;
const MOTOR_VISUAL_MAX = 12;

const TIME_KEYS: (keyof GravityParams)[] = ['slowMo', 'timeScale', 'running'];
const CALCULATOR_KEYS: (keyof GravityParams)[] = ['ladderTonnes', 'ladderHeight', 'nightKwh'];

export interface DayResult {
  hours: number[];
  /** kW. */
  pv: number[];
  load: number[];
  /** Power of the machine at the meter, kW, > 0 drawing. */
  meter: number[];
  /** Height, m. */
  z: number[];
  /** State of charge, %. */
  soc: number[];
  /** Over the 24 hours, Wh. */
  energyIn: number;
  energyOut: number;
  standing: number;
  /** Out over in, standing losses included; 0 if nothing went in. */
  roundTrip: number;
  served: number;
  asked: number;
}

export class GravitySim implements LabSim {
  readonly params: GravityParams;
  readonly state: GravityState;
  readonly scope: Scope = { t: [], hook: [], meter: [], z: [] };
  private readonly store: Store;
  private listeners = new Set<() => void>();
  private events: ScheduledEvent[] = [];
  private ramps: Ramp[] = [];
  private scriptTime = 0;
  private fired = new Set<number>();
  private sinceScope = 0;
  private scopeClock = 0;
  private lastPreset: PresetId | ScenarioId = 'farm';
  private lastKind: 'preset' | 'scenario' = 'preset';
  private curve: { key: string; value: EfficiencyCurve } | null = null;
  private dayCache: { key: string; value: DayResult } | null = null;
  private lastScenario: ScenarioId | null = null;

  constructor() {
    this.params = presetParams('farm');
    const start = presetStart('farm');
    this.store = new Store(this.params, start);
    this.state = this.store.state;
    this.store.restart(start);
  }

  // ------------------------------------------------------------------ the LabSim contract

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters (clamped). Anything but the time controls and the calculators turns the preset into 'custom'. */
  set(patch: Partial<GravityParams>): void {
    const p = this.params as unknown as Record<string, unknown>;
    let physical = false;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key in RANGES) {
        const range = rangeFor(key as RangedKey, this.params.machine);
        p[key] = Math.min(range.max, Math.max(range.min, Number(value)));
      } else if (key === 'slowMo' || key === 'timeScale') {
        p[key] = Math.max(0, Number(value));
      } else if (key === 'falls') {
        p[key] = (FALLS_OPTIONS as readonly number[]).includes(Number(value)) ? Number(value) : this.params.falls;
      } else {
        p[key] = value;
      }
      const k = key as keyof GravityParams;
      if (!TIME_KEYS.includes(k) && !CALCULATOR_KEYS.includes(k) && k !== 'preset') physical = true;
      // the visitor takes over a quantity a scenario was moving
      this.ramps = this.ramps.filter((r) => r.key !== key);
    }
    if (physical && patch.preset === undefined) this.params.preset = 'custom';
    // a shortened stroke brings the height with it
    const spec = this.store.spec;
    if (this.state.z > spec.stroke) this.state.z = spec.stroke;
    this.emit();
  }

  applyPreset(id: string): void {
    const preset = id as PresetId;
    this.lastPreset = preset;
    this.lastKind = 'preset';
    this.lastScenario = null;
    this.load(presetParams(preset), presetStart(preset), [], [], false);
  }

  applyScenario(id: string): void {
    const scenario = id as ScenarioId;
    this.lastPreset = scenario;
    this.lastKind = 'scenario';
    this.lastScenario = scenario;
    const s = scenarioSetup(scenario);
    this.load(s.params, s.start, s.events, s.ramps, true);
  }

  /** Start again from the last preset or scenario. */
  reset(): void {
    if (this.lastKind === 'preset') this.applyPreset(this.lastPreset);
    else this.applyScenario(this.lastPreset);
  }

  private load(next: GravityParams, start: Start, events: ScheduledEvent[], ramps: Ramp[], script: boolean): void {
    // a scenario brings its own clock and speed; a preset keeps what the visitor chose. Both leave play and pause alone.
    const keep = script
      ? { running: this.params.running }
      : { running: this.params.running, slowMo: this.params.slowMo, timeScale: this.params.timeScale };
    Object.assign(this.params, next, keep);
    this.events = events;
    this.ramps = ramps;
    this.scriptTime = 0;
    this.fired.clear();
    this.scope.t.length = this.scope.hook.length = this.scope.meter.length = this.scope.z.length = 0;
    this.scopeClock = 0;
    this.sinceScope = 0;
    this.applyRamps();
    this.store.restart(start);
    this.emit();
  }

  // ------------------------------------------------------------------ time

  step(dtReal: number): void {
    if (!this.params.running) return;
    const dt = Math.min(Math.max(dtReal, 0), DT_MAX);
    if (dt === 0) return;
    const p = this.params;
    const s = this.state;
    this.advanceScript(dt);
    if (s.mode === 'falling') {
      // a fall is seen in real time at most, slowed by the slow motion, whatever the clock's speed
      const physical = dt * Math.min(1, p.slowMo);
      this.store.fall(physical);
      s.simTime += physical;
    } else {
      const clock = dt * p.timeScale;
      const n = Math.max(1, Math.ceil(clock / CLOCK_STEP));
      for (let i = 0; i < n; i++) this.store.advance(clock / n);
    }
    this.spin(dt);
    this.sample(dt);
  }

  /** The shafts for the eye: real speed times the clock, capped; the motor's blur tells what the cap hides. */
  private spin(dt: number): void {
    const s = this.state;
    const p = this.params;
    const sign = Math.sign(s.v);
    const clock = Math.min(p.timeScale, 60) * p.slowMo;
    const drum = Math.min(DRUM_VISUAL_MAX, ((s.drumRpm * 2 * Math.PI) / 60) * clock);
    const motor = ((s.motorRpm * 2 * Math.PI) / 60) * clock;
    s.drumAngle = (s.drumAngle + sign * drum * dt) % (2 * Math.PI);
    s.sheaveAngle = s.drumAngle;
    s.angle = s.drumAngle;
    s.motorAngle = (s.motorAngle + sign * Math.min(MOTOR_VISUAL_MAX, motor) * dt) % (2 * Math.PI);
    s.motorBlur = motor > MOTOR_VISUAL_MAX;
  }

  private advanceScript(dt: number): void {
    this.scriptTime += dt;
    this.events.forEach((e, i) => {
      if (this.fired.has(i) || this.scriptTime < e.at) return;
      this.fired.add(i);
      const keep = this.ramps;
      this.set(e.patch);
      this.ramps = keep;
      this.params.preset = 'custom';
    });
    this.applyRamps();
  }

  private applyRamps(): void {
    const target = this.params as unknown as Record<string, number>;
    // a later ramp of a key takes over once it has started
    for (const r of this.ramps) {
      if (this.scriptTime < r.at) {
        if (!this.ramps.some((o) => o !== r && o.key === r.key && o.at < r.at)) target[r.key] = r.from;
        continue;
      }
      const u = Math.min(1, (this.scriptTime - r.at) / r.duration);
      target[r.key] = r.from + (r.to - r.from) * u;
    }
  }

  private sample(dt: number): void {
    this.sinceScope += dt;
    this.scopeClock += dt;
    if (this.sinceScope < SCOPE_EVERY) return;
    this.sinceScope = 0;
    const sc = this.scope;
    const s = this.state;
    sc.t.push(this.scopeClock);
    sc.hook.push(s.chain.hook);
    sc.meter.push(s.chain.meter);
    sc.z.push(s.z);
    if (sc.t.length > SCOPE_LENGTH) {
      sc.t.shift();
      sc.hook.shift();
      sc.meter.shift();
      sc.z.shift();
    }
  }

  // ------------------------------------------------------------------ what the panel plots (computed on demand, cached)

  get spec(): MachineSpec {
    return this.store.spec;
  }

  get scenario(): ScenarioId | null {
    return this.lastScenario;
  }

  /** The machine if it is a drive, else null. */
  get hoist(): HoistSpec | null {
    const spec = this.store.spec;
    return spec.kind === 'hoist' ? spec : null;
  }

  private curveKey(): string {
    const p = this.params;
    return `${p.machine}|${p.motorKw}|${p.falls}|${p.stroke}|${Math.round(p.mass)}`;
  }

  /** Efficiency against power at this load. */
  getCurve(points = 48): EfficiencyCurve | null {
    const m = this.hoist;
    if (!m) return null;
    const key = this.curveKey();
    if (!this.curve || this.curve.key !== key) {
      this.curve = { key, value: efficiencyCurve(m, this.params.mass, points) };
    }
    return this.curve.value;
  }

  /** Below this power at the hook the machine gives nothing, W, or null if it never does. */
  getCutIn(): { hook: number; speedMpm: number } | null {
    const m = this.hoist;
    if (!m) return null;
    const v = cutInSpeed(m, this.params.mass);
    return v === null ? null : { hook: this.params.mass * G * v, speedMpm: v * 60 };
  }

  /** A full stroke up and down at the top speed. */
  getStroke(): StrokeEnergy | null {
    const m = this.hoist;
    if (!m) return null;
    const top = vMaxFor(m, this.params.mass);
    return strokeEnergy(m, this.params.mass, top, top);
  }

  /** The lightest load that comes down on its own, kg. */
  getLightest(): number | null {
    const m = this.hoist;
    return m ? lightestLoad(m) : null;
  }

  getNight(): NightNeed {
    const p = this.params;
    return nightNeed(p.nightKwh, this.store.spec, p.mass, p.modules);
  }

  getRace(): RaceLane[] | null {
    const m = this.hoist;
    return m ? raceLanes(m, this.params.mass, this.params.loadPower) : null;
  }

  /** Twenty-four hours of this machine on this farm, after a first day to settle. Cached. */
  getDay(): DayResult {
    const p = this.params;
    const key = JSON.stringify([
      p.machine,
      p.motorKw,
      p.falls,
      p.stroke,
      Math.round(p.mass),
      p.buffer,
      p.modules,
      p.nightKwh,
      p.pvKw,
      p.sleepWhenIdle,
      p.waitForSun,
    ]);
    if (!this.dayCache || this.dayCache.key !== key) this.dayCache = { key, value: simulateDay(p) };
    return this.dayCache.value;
  }
}

/** One day of `params` at a minute per step: the first day settles the height and the battery, the second is recorded from midnight. */
export function simulateDay(params: GravityParams): DayResult {
  const p: GravityParams = {
    ...params,
    control: 'day',
    grid: true,
    gateOpen: false,
    fault: false,
    wind: 0,
    timeScale: 1,
  };
  const start = { zFraction: 0, hour: 0, soc: 0.5 };
  const store = new Store(p, start);
  store.restart(start);
  const h = 60;
  for (let i = 0; i < 1440; i++) store.advance(h);
  const s = store.state;
  const inStart = s.energyIn;
  const outStart = s.energyOut;
  const standingStart = s.energyStanding;
  const servedStart = s.loadServedWh;
  const askedStart = s.loadAskedWh;
  const d: DayResult = {
    hours: [],
    pv: [],
    load: [],
    meter: [],
    z: [],
    soc: [],
    energyIn: 0,
    energyOut: 0,
    standing: 0,
    roundTrip: 0,
    served: 0,
    asked: 0,
  };
  for (let i = 0; i < 1440; i++) {
    store.advance(h);
    if (i % 5 === 0) {
      d.hours.push((i + 1) / 60);
      d.pv.push(s.pv / 1000);
      d.load.push(s.load / 1000);
      d.meter.push(s.chain.meter / 1000);
      d.z.push(s.z);
      d.soc.push(100 * s.soc);
    }
  }
  d.energyIn = s.energyIn - inStart;
  d.energyOut = s.energyOut - outStart;
  d.standing = s.energyStanding - standingStart;
  d.roundTrip = d.energyIn > 0 ? d.energyOut / d.energyIn : 0;
  d.served = s.loadServedWh - servedStart;
  d.asked = s.loadAskedWh - askedStart;
  return d;
}
