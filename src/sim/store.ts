import {
  chainAt,
  comesDownAlone,
  newChainPoint,
  speedForInput,
  speedForOutput,
  strokeEnergy,
  tooHeavyFor,
  vMaxFor,
  type ChainPoint,
} from './chain';
import { loadAt, pvAt } from './day';
import { diyAscent, diyDescent } from './diy';
import { energyWh } from './energy';
import { lfpMaxPower, lfpStep, lfpVolts, SOC_HIGH, SOC_LOW } from './lfp';
import {
  CHOPPER_V,
  DC_BLEED_TAU,
  DC_LINK_V,
  G,
  GEAR_DECEL,
  GEAR_DELAY,
  GOVERNOR_TRIP,
  MOTOR_RISE_ALARM,
  MOTOR_RISE_CONTINUOUS,
  MOTOR_THERMAL_TAU,
  ROPE_FACTOR_MIN,
  SLEEP_AFTER,
  stackFor,
  STACK_CD,
  STACK_HEIGHT,
  STACK_WIDTH,
  standingAsleep,
  standingReady,
  WAKE_TIME,
  WIND_HYSTERESIS,
  type HoistSpec,
} from './machine';
import { nightNeed } from './night';
import { specFor, type MachineSpec, type Start } from './presets';
import { fallLength, hangingRope, ropeFactor, ropeSpeed, staticTension } from './reeving';
import type { AlarmKey, ChainState, GravityParams, GravityState } from './types';

// The energy integrator: the machine, the house, the sun and the battery, advanced by steps of the clock. Used by the engine (live) and
// by the day chart (24 hours at once). No DOM, no three.js, nothing drawn at random.

/** Air density, and the frontal area of the stack. Only for the wind's drag on the guides. */
const AIR = 1.2;
const FRONTAL_AREA = STACK_WIDTH * STACK_HEIGHT;

const emptyChain = (): ChainState => ({
  hook: 0,
  guide: 0,
  reeving: 0,
  drum: 0,
  gear: 0,
  motor: 0,
  cable: 0,
  inverter: 0,
  supply: 0,
  auxiliaries: 0,
  meter: 0,
  shaft: 0,
});

export function newState(p: GravityParams, start: Start): GravityState {
  const spec = specFor(p.machine, p.motorKw, p.falls, p.stroke);
  const z = start.zFraction * spec.stroke;
  const stack = stackFor(p.mass);
  return {
    simTime: 0,
    hour: start.hour,
    z,
    zFraction: start.zFraction,
    v: 0,
    speedMpm: 0,
    mode: 'hold',
    drive: 'ready',
    blocks: stack.blocks,
    halves: stack.halves,
    motorRpm: 0,
    drumRpm: 0,
    motorTorque: 0,
    drumTorque: 0,
    ropeTension: 0,
    ropeFactor: Infinity,
    ropeSpeed: 0,
    fallLength: fallLength(spec.stroke, z),
    motorAmps: 0,
    motorRise: 0,
    drumAngle: 0,
    sheaveAngle: 0,
    motorAngle: 0,
    motorBlur: false,
    brakeReleased: false,
    safetyGearSet: false,
    flowDirection: 0,
    chopperPower: 0,
    dcVolts: DC_LINK_V,
    chain: emptyChain(),
    etaNow: 0,
    storedWh: energyWh(p.mass, z),
    deliverableWh: 0,
    energyIn: 0,
    energyOut: 0,
    energyStanding: 0,
    energyDumped: 0,
    roundTripNow: 0,
    pv: 0,
    load: 0,
    lfpPower: 0,
    soc: start.soc,
    lfpVolts: lfpVolts(start.soc),
    gridPower: 0,
    served: 0,
    loadServedWh: 0,
    loadAskedWh: 0,
    bursting: false,
    ghostTonnes: 0,
    ghostTowers: 0,
    ghostBlocks: 0,
    ghostVolume: 0,
    fallPeak: 0,
    fallDrop: 0,
    fallTime: 0,
    impactSpeed: 0,
    alarms: [],
  };
}

export class Store {
  readonly state: GravityState;
  private readonly point: ChainPoint = newChainPoint();
  private idle = 0;
  private wakeLeft = 0;
  private windLatched = false;
  private fallPhase: 'free' | 'delay' | 'gear' = 'free';
  private fallDelay = 0;
  private fallStart = 0;
  private etaKey = '';
  private etaDown = 0;
  /** What the store could give when the clock started, Wh: it was not paid for at this meter. */
  private startDeliverable = 0;
  private ghostKey = '';
  /** The speed is steady: the alarms do not judge a machine on its ramp. */
  private steady = true;

  constructor(
    private readonly params: GravityParams,
    start: Start,
  ) {
    this.state = newState(params, start);
  }

  get spec(): MachineSpec {
    const p = this.params;
    return specFor(p.machine, p.motorKw, p.falls, p.stroke);
  }

  /** The state again, for a new preset or scenario. */
  restart(start: Start): void {
    Object.assign(this.state, newState(this.params, start));
    this.idle = 0;
    this.wakeLeft = 0;
    this.windLatched = false;
    this.fallPhase = 'free';
    this.etaKey = '';
    this.ghostKey = '';
    this.refreshDerived();
    this.startDeliverable = this.state.deliverableWh;
  }

  // ------------------------------------------------------------------ one step of the clock

  advance(h: number): void {
    const s = this.state;
    const p = this.params;
    const spec = this.spec;
    s.simTime += h;
    s.hour = (s.hour + h / 3600) % 24;
    this.farm();
    if (spec.kind === 'energy') {
      s.z = spec.stroke;
      this.settleHold(0);
    } else if (s.mode === 'falling' || s.mode === 'tripped' || s.mode === 'crashed') {
      this.holdPowers(h, spec);
    } else if (spec.kind === 'diy') {
      this.advanceDiy(h, spec);
    } else if (p.fault) {
      this.startFall();
    } else {
      this.advanceHoist(h, spec);
    }
    this.refreshDerived();
  }

  /** The two sides of the farm: what the sun gives and what the house asks. */
  private farm(): void {
    const s = this.state;
    const p = this.params;
    if (p.control === 'day') {
      s.pv = p.grid ? pvAt(s.hour, p.pvKw) : 0;
      s.load = loadAt(s.hour, p.nightKwh);
    } else {
      s.pv = 0;
      s.load = p.control === 'hold' || p.control === 'raise' ? 0 : p.loadPower;
    }
  }

  private advanceHoist(h: number, spec: HoistSpec): void {
    const s = this.state;
    const p = this.params;
    const stoppedBy = this.interlock(spec);
    const command = stoppedBy ? 0 : this.command(spec);
    const aMax = spec.vRated / spec.rampTime;

    // from the drive's sleep, the first move has to wait
    if (s.drive === 'sleep' && command !== 0 && s.v === 0) {
      s.drive = 'ready';
      this.wakeLeft = WAKE_TIME;
    }
    if (this.wakeLeft > 0) {
      this.wakeLeft = command !== 0 ? Math.max(0, this.wakeLeft - h) : 0;
      if (this.wakeLeft > 0) {
        s.mode = 'waking';
        this.holdPowers(h, spec);
        return;
      }
    }

    // the distance left to the end of the stroke limits the speed so that the ramp stops it there
    const dir = Math.sign(command);
    let target = command;
    if (dir !== 0) {
      const room = dir > 0 ? spec.stroke - s.z : s.z;
      if (room <= 1e-6) target = 0;
      else target = dir * Math.min(Math.abs(target), Math.sqrt(2 * aMax * room));
    }
    const dv = Math.max(-aMax * h, Math.min(aMax * h, target - s.v));
    const v1 = Math.abs(target - s.v) <= aMax * h ? target : s.v + dv;
    const a = (v1 - s.v) / h;
    this.steady = Math.abs(a) < 0.05 * aMax;
    const vMean = 0.5 * (s.v + v1);
    if (Math.abs(vMean) < 1e-7) {
      s.v = 0;
      if (command === 0 && stoppedBy) s.mode = 'hold';
      this.settleHold(h);
      return;
    }

    // a step may finish the stroke before it ends: the rest of the step is spent holding
    const room = vMean > 0 ? spec.stroke - s.z : s.z;
    const travel = Math.abs(vMean) * h;
    const moved = Math.min(travel, room);
    const moving = h * (travel > 0 ? moved / travel : 0);
    const windF = this.windForce();
    const point = chainAt(spec, p.mass, s.z, vMean, a, windF, this.point);
    s.z += vMean > 0 ? moved : -moved;
    s.v = moved < travel ? 0 : v1;
    s.mode = stoppedBy || target === 0 ? 'stopping' : vMean > 0 ? 'raising' : 'lowering';
    s.drive = 'run';
    this.idle = 0;
    this.fillChain(point, moving, h, spec);
    this.heat(point.motorCopper + point.motorIron + point.motorWindage, spec, h);
  }

  /** Why the machine must not move at all now, if it must not. */
  private interlock(spec: HoistSpec): AlarmKey | null {
    const p = this.params;
    if (p.wind >= p.windStop) this.windLatched = true;
    else if (p.wind <= p.windStop - WIND_HYSTERESIS) this.windLatched = false;
    if (p.gateOpen) return 'gateOpen';
    if (this.windLatched) return 'windStop';
    if (!p.grid) return 'gridLost';
    if (p.mass > spec.massRated * 1.1 || tooHeavyFor(spec, p.mass, this.state.z)) return 'overload';
    return null;
  }

  /** The speed the control asks, m/s, signed. */
  private command(spec: HoistSpec): number {
    const p = this.params;
    const s = this.state;
    const top = vMaxFor(spec, p.mass);
    switch (p.control) {
      case 'hold':
        s.bursting = false;
        return 0;
      case 'raise':
        s.bursting = false;
        return s.z < spec.stroke ? Math.max(spec.vMin, Math.min(top, p.raiseSpeed / 60)) : 0;
      case 'lower':
        s.bursting = false;
        return s.z > 0 ? -Math.max(spec.vMin, Math.min(top, p.lowerPower / (p.mass * G))) : 0;
      case 'load':
        return this.followDeficit(spec, s.load);
      case 'day': {
        const deficit = s.load - s.pv;
        if (deficit > 0) return this.followDeficit(spec, deficit);
        s.bursting = false;
        return this.followSurplus(spec, -deficit);
      }
    }
  }

  /** The house needs `deficit` W. With a buffer the tower runs only in bursts; without one it follows the load, however badly. */
  private followDeficit(spec: HoistSpec, deficit: number): number {
    const p = this.params;
    const s = this.state;
    const top = vMaxFor(spec, p.mass);
    if (s.z <= 0) {
      s.bursting = false;
      return 0;
    }
    if (!p.buffer) {
      const v = speedForOutput(spec, p.mass, s.z, deficit);
      return -(v ?? top);
    }
    if (s.soc <= SOC_LOW) s.bursting = true;
    else if (s.soc >= SOC_HIGH) s.bursting = false;
    if (!s.bursting) return 0;
    const v = speedForOutput(spec, p.mass, s.z, deficit + lfpMaxPower(p.modules, s.soc));
    return -(v ?? top);
  }

  /** The sun has `surplus` W to spare. The battery takes it first: it is the better store. */
  private followSurplus(spec: HoistSpec, surplus: number): number {
    const p = this.params;
    const s = this.state;
    if (s.z >= spec.stroke) return 0;
    let spare = surplus;
    if (p.buffer && s.soc < SOC_HIGH) spare -= lfpMaxPower(p.modules, s.soc);
    if (spare <= 0) return 0;
    if (p.waitForSun) {
      const full = chainAt(spec, p.mass, s.z, spec.vRated, 0, 0, this.point).meter;
      return spare >= full ? spec.vRated : 0;
    }
    return speedForInput(spec, p.mass, s.z, spare) ?? 0;
  }

  private windForce(): number {
    const p = this.params;
    return 0.5 * AIR * STACK_CD * FRONTAL_AREA * p.wind * p.wind;
  }

  /** The machine stands still with its brakes set: only the standing power remains. */
  private settleHold(h: number): void {
    const s = this.state;
    const spec = this.spec;
    s.v = 0;
    if (s.mode !== 'waking') s.mode = 'hold';
    if (spec.kind !== 'hoist') {
      this.clearChain(h);
      return;
    }
    this.idle += h;
    if (this.params.sleepWhenIdle && this.idle >= SLEEP_AFTER && s.mode === 'hold') s.drive = 'sleep';
    else if (s.drive === 'run') s.drive = 'ready';
    this.holdPowers(h, spec);
  }

  private clearChain(h: number): void {
    const s = this.state;
    Object.assign(s.chain, emptyChain());
    s.motorRpm = s.drumRpm = s.motorTorque = s.drumTorque = s.motorAmps = 0;
    s.ropeSpeed = 0;
    s.brakeReleased = false;
    s.etaNow = 0;
    s.flowDirection = 0;
    s.chopperPower = 0;
    this.settleFarm(0, h);
  }

  private holdPowers(h: number, spec: MachineSpec): void {
    const s = this.state;
    this.clearChain(0);
    if (spec.kind === 'hoist') {
      // the brakes hold it: the rope carries the load, the sheaves not turning
      const hanging = hangingRope(spec.falls, spec.ropeMassPerM, spec.stroke, s.z);
      s.ropeTension = staticTension(this.params.mass + hanging, spec.falls);
      s.ropeFactor = ropeFactor(spec.ropeFmin, s.ropeTension);
    }
    const standing = spec.kind !== 'hoist' ? 0 : s.drive === 'sleep' ? standingAsleep(spec) : standingReady(spec);
    // on the control UPS when the supply is gone: nothing at the meter
    const metered = this.params.grid ? standing : 0;
    s.chain.meter = metered;
    s.chain.auxiliaries = metered;
    s.energyIn += (metered * h) / 3600;
    s.energyStanding += (metered * h) / 3600;
    this.settleFarm(metered, h);
    if (spec.kind === 'hoist') this.heat(0, spec, h);
    this.dcLink(0, h);
  }

  /** The chain's powers to the state, spending `moving` s of the step `h` on the move and the rest holding. */
  private fillChain(c: ChainPoint, moving: number, h: number, spec: HoistSpec): void {
    const s = this.state;
    const p = this.params;
    const share = h > 0 ? moving / h : 1;
    const ch = s.chain;
    ch.hook = c.hook;
    ch.guide = c.guide;
    ch.reeving = c.reeving;
    ch.drum = c.drum;
    ch.gear = c.gearMesh + c.gearDrag;
    ch.motor = c.motorCopper + c.motorIron + c.motorWindage;
    ch.cable = c.cable;
    ch.inverter = c.inverter;
    ch.supply = c.supply;
    ch.auxiliaries = c.fan + c.brakes + c.controls;
    ch.shaft = c.shaft;
    s.motorRpm = c.motorRpm;
    s.drumRpm = c.drumRpm;
    s.motorTorque = c.motorTorque;
    s.drumTorque = c.drumTorque;
    s.ropeTension = c.ropeTension;
    s.ropeFactor = c.ropeFactor;
    s.ropeSpeed = ropeSpeed(spec.falls, c.v);
    s.motorAmps = c.current;
    s.brakeReleased = true;

    let meter = c.meter;
    let chopper = 0;
    if (!p.grid) {
      // nowhere to send it: the chopper takes the link's power, the control UPS keeps the brains alive
      chopper = Math.max(0, -c.dcLink);
      meter = 0;
    }
    ch.meter = meter * share;
    s.chopperPower = chopper;
    const standing =
      (1 - share) * (s.drive === 'sleep' ? standingAsleep(spec) : standingReady(spec)) * (p.grid ? 1 : 0);
    ch.meter += standing;
    if (ch.meter > 0) s.energyIn += (ch.meter * h) / 3600;
    else s.energyOut += (-ch.meter * h) / 3600;
    s.energyDumped += (chopper * moving) / 3600;
    s.energyStanding += (standing * h) / 3600;
    s.etaNow = c.v > 0 ? (c.meter > 0 ? c.hook / c.meter : 0) : Math.max(0, -c.meter / Math.max(c.hook, 1e-9));
    s.flowDirection = !p.grid ? 0 : ch.meter > 0 ? 1 : -1;
    this.dcLink(chopper, h);
    this.settleFarm(ch.meter, h);
  }

  /** What goes where on the farm's bus, and the battery. `meter` > 0 the machine draws. */
  private settleFarm(meter: number, h: number): void {
    const s = this.state;
    const p = this.params;
    let ask = 0;
    let served = 0;
    if (p.buffer) {
      const deficit = s.load - s.pv;
      if (!p.grid) ask = -s.load;
      else if (s.bursting && meter < 0) ask = -meter - Math.max(0, deficit);
      else if (deficit > 0) ask = meter < 0 ? -meter - deficit : -deficit;
      else if (s.soc < SOC_HIGH) ask = -deficit - Math.max(0, meter);
    }
    if (h > 0) {
      const r = lfpStep(ask, s.soc, p.modules, h);
      s.soc = r.soc;
      s.lfpPower = r.power;
    } else {
      s.lfpPower = ask;
    }
    s.lfpVolts = lfpVolts(s.soc);
    s.gridPower = p.grid ? s.load + meter + s.lfpPower - s.pv : 0;
    if (s.load > 0) {
      const fromStore = Math.max(0, -meter) + Math.max(0, -s.lfpPower);
      const chargeBack = Math.max(0, s.lfpPower);
      const wanted = Math.max(0, s.load - s.pv);
      served = Math.min(wanted, Math.max(0, fromStore - chargeBack));
    }
    s.served = served;
    if (h > 0) {
      s.loadServedWh += (served * h) / 3600;
      s.loadAskedWh += (Math.max(0, s.load - s.pv) * h) / 3600;
    }
  }

  private heat(lossW: number, spec: HoistSpec, h: number): void {
    const s = this.state;
    const ratedLoss = spec.motorW * (1 / spec.motorEta - 1);
    const target = (MOTOR_RISE_CONTINUOUS * lossW) / ratedLoss;
    s.motorRise += (target - s.motorRise) * (1 - Math.exp(-h / MOTOR_THERMAL_TAU));
  }

  private dcLink(chopper: number, h: number): void {
    const s = this.state;
    const p = this.params;
    if (chopper > 0) s.dcVolts = CHOPPER_V;
    else if (p.grid && s.drive !== 'sleep') s.dcVolts = DC_LINK_V;
    else s.dcVolts *= Math.exp(-h / DC_BLEED_TAU);
  }

  // ------------------------------------------------------------------ the courtyard's machine

  private advanceDiy(h: number, spec: Extract<MachineSpec, { kind: 'diy' }>): void {
    const s = this.state;
    const p = this.params;
    const up = p.control === 'raise' || (p.control === 'day' && s.pv - s.load > 0);
    const down = p.control === 'lower' || p.control === 'load' || (p.control === 'day' && s.pv - s.load <= 0);
    const point =
      up && s.z < spec.stroke ? diyAscent(p.mass, spec.setup) : down && s.z > 0 ? diyDescent(p.mass, spec.setup) : null;
    if (!point || point.speed === 0) {
      s.v = 0;
      s.mode = 'hold';
      this.clearChain(h);
      return;
    }
    const v = up ? point.speed : -point.speed;
    const travel = point.speed * h;
    const room = up ? spec.stroke - s.z : s.z;
    const moved = Math.min(travel, room);
    s.z += up ? moved : -moved;
    s.v = moved < travel ? 0 : v;
    s.mode = up ? 'raising' : 'lowering';
    const share = travel > 0 ? moved / travel : 0;
    const ch = s.chain;
    Object.assign(ch, emptyChain());
    ch.hook = point.hook;
    // the courtyard's chain is one lump: gears, pulley, the gear motor and its wires
    ch.gear = Math.abs(point.electric - point.hook);
    ch.meter = (up ? point.electric : -point.electric) * share;
    if (ch.meter > 0) s.energyIn += (ch.meter * h) / 3600;
    else s.energyOut += (-ch.meter * h) / 3600;
    s.motorRpm = point.motorRpm;
    s.motorAmps = point.current;
    s.etaNow = point.efficiency;
    s.brakeReleased = true;
    s.flowDirection = up ? 1 : -1;
    this.settleFarm(0, h);
  }

  // ------------------------------------------------------------------ a fall

  private startFall(): void {
    const s = this.state;
    s.mode = 'falling';
    s.drive = 'ready';
    this.fallPhase = 'free';
    this.fallDelay = 0;
    this.fallStart = s.z;
    s.fallTime = 0;
    s.fallPeak = Math.abs(s.v);
    s.fallDrop = 0;
    s.brakeReleased = false;
  }

  /**
   * The load on its own, in real time (the clock of the kit does not speed a fall up): free in the guides until the governor trips, then
   * a short delay, then the wedges. Without the safety gear it goes to the buffer. `dt` in seconds of physics.
   */
  fall(dt: number): void {
    const s = this.state;
    const p = this.params;
    const stepCount = Math.max(1, Math.ceil(dt / 0.001));
    const h = dt / stepCount;
    const spec = this.spec;
    const free = G * (1 - (spec.kind === 'hoist' ? spec.guideFriction : 0));
    for (let i = 0; i < stepCount && s.mode === 'falling'; i++) {
      const speed = -s.v;
      if (this.fallPhase === 'free' && speed >= GOVERNOR_TRIP && p.safetyGear) this.fallPhase = 'delay';
      if (this.fallPhase === 'delay') {
        this.fallDelay += h;
        if (this.fallDelay >= GEAR_DELAY) {
          this.fallPhase = 'gear';
          s.safetyGearSet = true;
        }
      }
      const a = this.fallPhase === 'gear' ? GEAR_DECEL : -free;
      s.v += a * h;
      if (s.v >= 0 && this.fallPhase === 'gear') {
        s.v = 0;
        s.mode = 'tripped';
      }
      s.z = Math.max(0, s.z + s.v * h);
      s.fallTime += h;
      s.fallPeak = Math.max(s.fallPeak, -s.v);
      s.fallDrop = this.fallStart - s.z;
      if (s.z <= 0 && s.mode === 'falling') {
        s.impactSpeed = -s.v;
        s.v = 0;
        s.mode = 'crashed';
      }
    }
    s.chain.hook = p.mass * G * Math.abs(s.v);
    s.chain.meter = 0;
    this.refreshDerived();
  }

  // ------------------------------------------------------------------ what follows from the state

  private refreshDerived(): void {
    const s = this.state;
    const p = this.params;
    const spec = this.spec;
    s.zFraction = spec.stroke > 0 ? s.z / spec.stroke : 0;
    s.storedWh = energyWh(p.mass, s.z);
    s.fallLength = fallLength(spec.stroke, s.z);
    s.speedMpm = Math.abs(s.v) * 60;
    const stack = stackFor(p.mass);
    s.blocks = stack.blocks;
    s.halves = stack.halves;
    if (s.mode === 'hold') {
      s.brakeReleased = false;
      s.etaNow = 0;
    }

    const key = `${p.machine}|${p.motorKw}|${p.falls}|${p.stroke}|${p.mass}`;
    if (key !== this.etaKey) {
      this.etaKey = key;
      this.etaDown =
        spec.kind === 'hoist'
          ? Math.max(0, strokeEnergy(spec, p.mass, vMaxFor(spec, p.mass), vMaxFor(spec, p.mass)).down)
          : 0;
    }
    s.deliverableWh = s.storedWh * this.etaDown;
    // the balance since the start: only once something has been paid for, and never counting what was already up there
    s.roundTripNow =
      s.energyIn > 10 ? Math.max(0, (s.energyOut + s.deliverableWh - this.startDeliverable) / s.energyIn) : 0;

    const ghost = `${key}|${p.nightKwh}|${p.modules}`;
    if (ghost !== this.ghostKey) {
      this.ghostKey = ghost;
      const n = nightNeed(p.nightKwh, spec, p.mass, p.modules);
      // a load too light ever to pay back has no night at all: the 3D shows no ghost
      const possible = Number.isFinite(n.tonnes);
      s.ghostTonnes = possible ? n.tonnes : 0;
      s.ghostTowers = possible ? n.towers : 0;
      s.ghostBlocks = possible ? n.blocks : 0;
      s.ghostVolume = possible ? n.volume : 0;
    }
    s.alarms = this.alarms(spec);
  }

  private alarms(spec: MachineSpec): AlarmKey[] {
    const s = this.state;
    const p = this.params;
    const a: AlarmKey[] = [];
    if (s.mode === 'crashed') a.push('crash');
    if (s.mode === 'falling' || s.mode === 'tripped') a.push('overspeed');
    if (s.safetyGearSet) a.push('safetyGear');
    if (spec.kind === 'energy') return a;
    if (!p.grid) a.push('gridLost');
    if (s.chopperPower > 0) a.push('chopper');
    if (spec.kind === 'diy') {
      const asked = p.control === 'lower' || p.control === 'load' || p.control === 'day';
      if (asked && s.z > 0 && s.mode === 'hold' && diyDescent(p.mass, spec.setup).speed === 0) a.push('stalled');
      return a;
    }
    if (p.gateOpen) a.push('gateOpen');
    if (this.windLatched) a.push('windStop');
    if (p.mass > spec.massRated * 1.1 || tooHeavyFor(spec, p.mass, s.z)) a.push('overload');
    if (s.ropeFactor < ROPE_FACTOR_MIN || (p.mass * G) / spec.falls > spec.ropeFmin / ROPE_FACTOR_MIN)
      a.push('ropeFactor');
    if (s.motorRise >= MOTOR_RISE_ALARM) a.push('motorHot');
    if (s.mode === 'lowering' && this.steady && s.chain.meter >= 0) a.push('belowCutIn');
    if (s.mode === 'lowering' && !comesDownAlone(spec, p.mass, s.z)) a.push('tooLight');
    if (s.mode === 'hold' || s.mode === 'waking') {
      if (s.z >= spec.stroke - 1e-3 && (p.control === 'raise' || p.control === 'day')) a.push('storeFull');
      if (s.z <= 1e-3 && (p.control === 'lower' || p.control === 'load' || p.control === 'day')) a.push('storeEmpty');
    }
    return a;
  }
}
