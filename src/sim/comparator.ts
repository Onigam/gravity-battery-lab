import { speedForOutput, strokeEnergy, vMaxFor } from './chain';
import { energyWh, whPerKg } from './energy';
import { INVERTER_IDLE_W, INVERTER_SHARE, LFP, LFP_VOLUME, lfpMaxPower, lfpRoundTrip, SOC_MIN } from './lfp';
import { FARM, FARM_MASS, FARM_STROKE, G, type HoistSpec } from './machine';
import { STACK_VOLUME } from './night';
import type { Tag } from './ladder';

// The three sides of one table: the tower, an LFP module, a pumped-storage plant. Every number carries its tag, and the ones nobody
// measured say so. Money and carbon are orders of magnitude, ranges only, never a false precision (research Q8).

export const NANT = {
  /** W, Wh, m³ (K33). */
  power: 900e6,
  energy: 20e9,
  volume: 25e6,
  /** m. The head reported is 295 m; the one that gives 20 GWh from 25 million m³ is 294 m (K34). */
  head: 294,
  /** CHF: "more than 2 bn" (K33), so a lower bound. */
  cost: 2e9,
} as const;

/** The head at which a volume of water holds an energy, m (K34). */
export const headFor = (wh: number, volume: number): number => (wh * 3600) / (1000 * volume * G);

/** Round-trip efficiency of pumped storage quoted by the sources, % (K35): 65 to 87. Claims, not a test of this plant. */
export const PUMPED_ROUND_TRIP = { min: 0.65, max: 0.87 } as const;

/** Everyone's round trip, as quoted (K35), for the lesson that says what is measured and what is claimed. */
export const ROUND_TRIP_CLAIMS: readonly {
  id: string;
  min: number;
  max: number;
  kind: 'near-measurement' | 'claim' | 'assumption';
}[] = [
  { id: 'swiss-test', min: 0.75, max: 0.75, kind: 'near-measurement' },
  { id: 'bricks', min: 0.82, max: 0.9, kind: 'claim' },
  { id: 'rudong', min: 0.8, max: 0.83, kind: 'claim' },
  { id: 'shaft', min: 0.8, max: 0.9, kind: 'claim' },
  { id: 'rail', min: 0.78, max: 0.9, kind: 'claim' },
  { id: 'pumped', min: 0.65, max: 0.87, kind: 'claim' },
  { id: 'studies', min: 0.8, max: 0.85, kind: 'assumption' },
];

/** Response quoted, s (K36): Leith under 1 s, bricks 2.5 s, rail 10 to 17 s. */
export const RESPONSE_CLAIMS = { leith: 1, bricks: 2.5, railMin: 10, railMax: 17 } as const;

/** Installed cost, $/kWh, 100 MW bricks, 2021, developer-supplied (K37). */
export const BRICKS_COST = { h2: 504, h4: 360, h8: 282, h24: 234 } as const;
/** Mass alone at $80/t (K38): $/kWh at a height. */
export const massCostPerKwh = (height: number, dollarsPerTonne = 80): number =>
  (3.6e6 / (G * height) / 1000) * dollarsPerTonne;
/** Battery packs at the end of 2025, $/kWh (K39). */
export const PACK_COST = { min: 108, max: 115 } as const;

/** The tower's own cost, a rough guess of ours, € (K46): steel, foundation, hoist, drive, erection. */
export const TOWER_COST = { min: 100000, max: 250000 } as const;
/** The Leith project, £ (K19). */
export const LEITH_COST = 1e6;

/** Concrete carbon, kg CO₂/m³, and an LFP pack's, kg CO₂/kWh (K45): digests of different boundaries, ranges only. */
export const CONCRETE_CO2 = { min: 300, max: 440 } as const;
export const LFP_CO2 = { min: 50, max: 150 } as const;
export const towerCo2Tonnes = (volume = STACK_VOLUME) =>
  ({ min: (volume * CONCRETE_CO2.min) / 1000, max: (volume * CONCRETE_CO2.max) / 1000 }) as const;
export const lfpCo2Kg = (kwh: number) => ({ min: kwh * LFP_CO2.min, max: kwh * LFP_CO2.max }) as const;

/** Dated facts about the field (K23, K40, K41). The lessons quote them with their date; they age. */
export const STATUS = {
  gravitricityLiquidation: '2025-10-01',
  gravitricityAssetsGbp: 7913.82,
  rudongAwaitingApprovals: '2026-03',
  noCommercialPlant: '2026-03',
} as const;

export interface ComparatorRow {
  id: 'tower' | 'module' | 'reservoir';
  /** Wh, W, kg, m³. */
  energy: number;
  power: number;
  mass: number;
  volume: number;
  whPerKg: number;
  /** Round trip, 0 to 1: a range where the sources give one. */
  roundTripMin: number;
  roundTripMax: number;
  /** €/kWh of capacity, or CHF for the reservoir; a range. */
  costMin: number;
  costMax: number;
  tags: { energy: Tag; roundTrip: Tag; cost: Tag };
}

/** The table, the tower's line from the model at this machine. */
export function comparatorRows(spec: HoistSpec = FARM, mass = FARM_MASS): ComparatorRow[] {
  const top = vMaxFor(spec, mass);
  const stroke = strokeEnergy(spec, mass, top, top);
  const modulePower = lfpMaxPower(1, 0.5);
  const moduleTrip = lfpRoundTrip(modulePower);
  return [
    {
      id: 'tower',
      energy: stroke.gross,
      power: mass * G * top,
      mass,
      volume: STACK_VOLUME,
      whPerKg: whPerKg(spec.stroke),
      roundTripMin: stroke.roundTrip,
      roundTripMax: stroke.roundTrip,
      costMin: TOWER_COST.min / (stroke.gross / 1000),
      costMax: TOWER_COST.max / (stroke.gross / 1000),
      tags: { energy: 'derived', roundTrip: 'model', cost: 'estimate' },
    },
    {
      id: 'module',
      energy: LFP.kwh * 1000,
      power: modulePower,
      mass: LFP.mass,
      volume: LFP_VOLUME,
      whPerKg: (LFP.kwh * 1000) / LFP.mass,
      roundTripMin: moduleTrip,
      roundTripMax: 0.95,
      costMin: LFP.price / LFP.kwh,
      costMax: LFP.price / LFP.kwh,
      tags: { energy: 'reported', roundTrip: 'model', cost: 'derived' },
    },
    {
      id: 'reservoir',
      energy: NANT.energy,
      power: NANT.power,
      mass: NANT.volume * 1000,
      volume: NANT.volume,
      whPerKg: whPerKg(NANT.head),
      roundTripMin: PUMPED_ROUND_TRIP.min,
      roundTripMax: PUMPED_ROUND_TRIP.max,
      costMin: NANT.cost / (NANT.energy / 1000),
      costMax: NANT.cost / (NANT.energy / 1000),
      tags: { energy: 'reported', roundTrip: 'reported', cost: 'derived' },
    },
  ];
}

export interface RaceLane {
  id: 'tower' | 'module' | 'water';
  /** How long it carries the load, s. */
  lasts: number;
  /** Energy delivered to the load if it runs to the end, Wh. */
  delivered: number;
  /** Stored at the start, Wh. */
  stored: number;
}

/**
 * The race of scenario 10: the same steady load from the tower, from one module, and from the tower's mass of water up the Alpine head.
 * The water has no drive of its own to pay for (it shares a 900 MW plant): the one-way figure is the square root of the sources' middle
 * round trip, an estimate.
 */
export function raceLanes(spec: HoistSpec, mass: number, loadW: number): RaceLane[] {
  const v = speedForOutput(spec, mass, spec.stroke / 2, loadW);
  const towerSeconds = v ? spec.stroke / v : 0;
  const stored = energyWh(mass, spec.stroke);
  const moduleStored = LFP.kwh * 1000;
  const moduleUsable = (1 - SOC_MIN) * moduleStored;
  const moduleEta = (1 - INVERTER_SHARE) * (loadW / (loadW + INVERTER_IDLE_W));
  const waterStored = energyWh(mass, NANT.head);
  const waterEta = Math.sqrt((PUMPED_ROUND_TRIP.min + PUMPED_ROUND_TRIP.max) / 2);
  return [
    { id: 'tower', lasts: towerSeconds, delivered: (loadW * towerSeconds) / 3600, stored },
    {
      id: 'module',
      lasts: (moduleUsable * moduleEta * 3600) / loadW,
      delivered: moduleUsable * moduleEta,
      stored: moduleStored,
    },
    {
      id: 'water',
      lasts: (waterStored * waterEta * 3600) / loadW,
      delivered: waterStored * waterEta,
      stored: waterStored,
    },
  ];
}

/** The picture of the lab: how many towers one module holds (K32). */
export const towersPerModule = (stroke = FARM_STROKE, mass = FARM_MASS): number =>
  (LFP.kwh * 1000) / energyWh(mass, stroke);
