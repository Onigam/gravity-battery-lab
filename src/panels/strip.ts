import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import type { GravitySim } from '../sim/engine';
import type { AlarmKey } from '../sim/types';
import { scaledEnergy, scaledPower } from './model';
import { num, st, type SimKey } from './strings';

// What the bottom strip of the frame shows: four live values, the time of day, the alarms.

const ALARM_KEYS: Record<AlarmKey, { key: SimKey; severe: boolean }> = {
  belowCutIn: { key: 'alarmBelowCutIn', severe: false },
  tooLight: { key: 'alarmTooLight', severe: false },
  stalled: { key: 'alarmStalled', severe: false },
  overload: { key: 'alarmOverload', severe: true },
  ropeFactor: { key: 'alarmRope', severe: true },
  storeFull: { key: 'alarmFull', severe: false },
  storeEmpty: { key: 'alarmEmpty', severe: false },
  gateOpen: { key: 'alarmGate', severe: false },
  windStop: { key: 'alarmWind', severe: false },
  gridLost: { key: 'alarmGrid', severe: true },
  chopper: { key: 'alarmChopper', severe: false },
  motorHot: { key: 'alarmHot', severe: true },
  overspeed: { key: 'alarmOverspeed', severe: true },
  safetyGear: { key: 'alarmGear', severe: true },
  crash: { key: 'alarmCrash', severe: true },
};

export const alarmText = (a: AlarmKey): string => st(ALARM_KEYS[a].key);

export function stripValues(sim: GravitySim): StripValue[] {
  const s = sim.state;
  const hook = scaledPower(s.chain.hook);
  // the strip is on every screen, and the panel's legend is not: it says in words who pays, and needs no sign
  const meter = scaledPower(Math.abs(s.chain.meter));
  const meterLabel: SimKey =
    Math.round(Math.abs(s.chain.meter)) === 0 ? 'stripMeter' : s.chain.meter > 0 ? 'stripMeterPays' : 'stripMeterGets';
  const stored = scaledEnergy(s.storedWh);
  return [
    { label: st('stripHook'), value: num(hook.value, hook.digits), unit: hook.unit },
    { label: st(meterLabel), value: num(meter.value, meter.digits), unit: meter.unit, cls: 'live--water' },
    { label: st('stripHeight'), value: num(s.z, 1), unit: 'm' },
    { label: st('stripStored'), value: num(stored.value, stored.digits), unit: stored.unit },
  ];
}

/** The time of the day on the farm. */
export function stripClock(sim: GravitySim): { time: string; sub: string } {
  const h = sim.state.hour;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return { time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, sub: '' };
}

export function stripAlarms(sim: GravitySim): StripAlarm[] {
  return sim.state.alarms.map((a) => ({ key: a, label: alarmText(a), severe: ALARM_KEYS[a].severe }));
}

export const STRIP_SPEEDS = [1, 60, 600, 3600];
