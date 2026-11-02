import { ocv } from '@onigam/lab-kit/sim/electric';

// The real LFP module of the comparator and the buffer (K31), and the inverter it needs to reach the 230 V of the house. The kit's
// `ocv` gives the voltage; the rest is arithmetic. Powers on the AC side, W: > 0 charging, < 0 discharging.

/** Pylontech US5000, as published (K31). */
export const LFP = {
  kwh: 4.8,
  usableKwh: 4.56,
  depth: 0.95,
  /** m */
  width: 0.442,
  depthMm: 0.42,
  height: 0.162,
  mass: 40,
  /** A */
  ampsRecommended: 50,
  ampsMax: 100,
  cycles: 6000,
  /** € at retail, April 2026 */
  price: 1110.8,
} as const;

/** Volume of a module, m³ (K31: 30 litres). */
export const LFP_VOLUME = LFP.width * LFP.depthMm * LFP.height;

/** Internal resistance of one module, Ω. **Estimate**: it gives 96 % round trip at the recommended current, the "≥ 95 %" of retail pages (K31, to check). */
export const LFP_OHMS = 0.02;
/** Battery inverter: what it costs to be on, W, and in proportion to the power. **Estimates** of a small hybrid inverter. */
export const INVERTER_IDLE_W = 20;
export const INVERTER_SHARE = 0.04;
/** The state of charge the buffer works between (K31's 95 % depth at its bottom end). */
export const SOC_MIN = 0.05;
export const SOC_LOW = 0.3;
export const SOC_HIGH = 0.9;

/** Volts of the bank at a state of charge (modules in parallel at 48 V). */
export const lfpVolts = (soc: number): number => ocv(soc);

/** Largest AC power at the recommended current, W. */
export const lfpMaxPower = (modules: number, soc: number): number => LFP.ampsRecommended * modules * lfpVolts(soc);

/**
 * One step of the battery: the AC power asked (limited to what the state of charge and the current allow), the new state of charge,
 * and the AC power really exchanged. `h` in seconds.
 */
export function lfpStep(
  powerAc: number,
  soc: number,
  modules: number,
  h: number,
): { soc: number; power: number; loss: number } {
  const volts = lfpVolts(soc);
  const capacity = LFP.kwh * 3600e3 * modules;
  const ohms = LFP_OHMS / modules;
  if (powerAc > 0) {
    if (soc >= 1) return { soc, power: 0, loss: 0 };
    const limit = lfpMaxPower(modules, soc);
    const p = Math.min(powerAc, limit);
    const dc = p * (1 - INVERTER_SHARE) - INVERTER_IDLE_W;
    if (dc <= 0) return { soc, power: 0, loss: 0 };
    const amps = dc / volts;
    const stored = dc - amps * amps * ohms;
    const next = Math.min(1, soc + (stored * h) / capacity);
    return { soc: next, power: p, loss: p - stored };
  }
  if (powerAc < 0) {
    if (soc <= SOC_MIN) return { soc, power: 0, loss: 0 };
    const limit = lfpMaxPower(modules, soc);
    const p = Math.min(-powerAc, limit);
    const dc = (p + INVERTER_IDLE_W) / (1 - INVERTER_SHARE);
    const amps = dc / volts;
    const drawn = dc + amps * amps * ohms;
    const next = Math.max(SOC_MIN, soc - (drawn * h) / capacity);
    return { soc: next, power: -p, loss: drawn - p };
  }
  return { soc, power: 0, loss: 0 };
}

/** What comes back at the plug for what went in at the plug, at a steady AC power, 0 to 1. Mid-charge. */
export function lfpRoundTrip(power: number, modules = 1): number {
  const volts = lfpVolts(0.5);
  const ohms = LFP_OHMS / modules;
  const dcIn = power * (1 - INVERTER_SHARE) - INVERTER_IDLE_W;
  const ampsIn = dcIn / volts;
  const stored = dcIn - ampsIn * ampsIn * ohms;
  const dcOut = (power + INVERTER_IDLE_W) / (1 - INVERTER_SHARE);
  const ampsOut = dcOut / volts;
  const drawn = dcOut + ampsOut * ampsOut * ohms;
  return (stored / power) * (power / drawn);
}

/** The module alone, DC: resistance only (K31's "≥ 95 %"). */
export function lfpDcRoundTrip(amps: number, modules = 1): number {
  const volts = lfpVolts(0.5);
  const ohms = LFP_OHMS / modules;
  const lossShare = (amps * ohms) / volts;
  return (1 - lossShare) / (1 + lossShare);
}

/** What the battery side keeps of a watt coming from the tower, once it has reached the load: AC in → stored → AC out. */
export function bufferPathEfficiency(loadW: number, chargeW: number, modules = 1): number {
  const volts = lfpVolts(0.5);
  const ohms = LFP_OHMS / modules;
  const dcIn = chargeW * (1 - INVERTER_SHARE) - INVERTER_IDLE_W;
  const ampsIn = dcIn / volts;
  const stored = (dcIn - ampsIn * ampsIn * ohms) / chargeW;
  const dcOut = (loadW + INVERTER_IDLE_W) / (1 - INVERTER_SHARE);
  const ampsOut = dcOut / volts;
  const drawn = (dcOut + ampsOut * ampsOut * ohms) / loadW;
  return stored / drawn;
}
