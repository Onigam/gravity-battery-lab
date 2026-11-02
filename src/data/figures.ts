// The figures the texts of src/data write by {placeholder}: the French and English spellings of a number can never drift apart, and each one
// carries its mark by construction, so that a modelled number cannot be written without it.
//
// What the marks mean to the visitor (the same as the simulation panel, `marksLegend` in src/panels/strings.ts):
//   no mark    REPORTED: stated by a source of docs/research.md. Written in the text itself, and checked against the list of figures.test.ts.
//   †          DERIVED: arithmetic on reported figures.
//   *          rests on an estimate of this lab: a MODEL result (src/sim), an ASSUMPTION or an ESTIMATE of ours.
// Nothing here is tuned to anything. `figures.test.ts` recomputes each model and derived figure from src/sim, so a change of the model cannot go unnoticed.
//
// Lengths come from src/three/dims.ts (metres), never retyped: only the unit of what the text shows is chosen here.
import {
  DECK_TOP,
  DRUM_R,
  HOIST,
  HOOK_BLOCK,
  MOTOR_CABLE_M,
  PAD,
  PV_WATTS,
  RAIL,
  SHOE,
  SITE,
  TOWER,
} from '../three/dims';

export type FigStatus = 'derived' | 'model' | 'assumption' | 'estimate';

export interface Fig {
  /** The value, in the unit shown. */
  v: number;
  /** Decimals shown. */
  d: number;
  s: FigStatus;
  /** Unit with its leading space when it takes one: a string, or [fr, en] when the languages differ. */
  u?: string | readonly [string, string];
  /** A currency written before the number in English (€231/kWh), after it in French (231 €/kWh): the English prefix. */
  pre?: string;
}

const pct: readonly [string, string] = [' %', '%'];
const rpm: readonly [string, string] = [' tr/min', ' rpm'];

const d = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'derived', u });
const m = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'model', u });
const a = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'assumption', u });
const e = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'estimate', u });
/** A price: 231 €/kWh in French, €231/kWh in English. */
const money = (fig: Fig, symbol: string, per = ''): Fig => ({
  ...fig,
  pre: symbol,
  u: [` ${symbol}${per}`, per],
});

export const FIG = {
  // ---- E = m·g·h: arithmetic on reported figures
  kwhHeight: d(367, 0, ' m'), // 3.6e6 / (1000 × 9.81): one tonne, one kilowatt-hour
  grossKwh: d(1.09, 2, ' kWh'), // 20,000 × 9.81 × 20
  grossMj: d(3.92, 2, ' MJ'),
  metreWh: d(54.5, 1, ' Wh'), // 20,000 × 9.81 / 3600: one metre of the stroke
  tenCmWh: d(5.5, 1, ' Wh'), // a tenth of that
  blockWh: d(131, 0, ' Wh'), // 2,400 × 9.81 × 20 / 3600
  blockKettleMin: d(3.9, 1, ' min'), // 131 Wh in a 2 kW kettle
  whPerKg: d(0.0545, 4, ' Wh/kg'), // g·h / 3600 at 20 m
  lfpWhPerKg: d(120, 0, ' Wh/kg'), // 4,800 / 40
  densityRatio: d(2200, 0), // 120 / 0.0545
  towersPerModule: d(4.4, 1, [' tours', ' towers']), // 4.8 / 1.09
  /** The same with no unit, for a lesson's chip: with its unit, it does not fit the chip at 390 px. */
  towersCount: d(4.4, 1),
  hookTopKw: d(13.08, 2, ' kW'), // 20,000 × 9.81 × 4/60
  hookLowW: d(262, 0, ' W'), // the same at 0.08 m/min
  strokeMin: d(5, 0, ' min'), // 20 m at 4 m/min
  ropeSpeed: d(16, 0, ' m/min'), // four falls × 4 m/min
  kineticJ: d(44, 0, ' J'), // ½ × 20,000 × (4/60)²
  stackT: d(16.8, 1, ' t'), // 6 × 2.4 + 2 × 1.2
  blockM3: d(1.024, 3, ' m³'), // 1.6 × 0.8 × 0.8
  stackM3: d(7.17, 2, ' m³'), // 6 × 1.024 + 2 × 0.512
  stackSize: d(2.8, 1, ' m'), // 3 × 0.8 + 0.4: the height of the stack
  staticKn: d(49, 0, ' kN'), // 20,000 × 9.81 / 4
  ropeFactorStatic: d(6.4, 1), // 315 / 49
  kettleMin: d(30, 0, ' min'), // one kilowatt-hour in a 2 kW kettle
  fridgeDayLow: d(0.48, 2, ' kWh'), // 174 / 365
  fridgeDayHigh: d(0.95, 2, ' kWh'), // 346 / 365
  fridgeMeanLow: d(20, 0, ' W'), // 174 kWh over a year
  fridgeMeanHigh: d(40, 0, ' W'), // 346 kWh over a year
  lfpEuroPerKwh: money(d(231, 0), '€', '/kWh'), // 1,110.80 / 4.8
  lfpVolumeL: d(30, 0, ' L'), // 0.442 × 0.420 × 0.162
  lfpChargeKw: d(2.5, 1, ' kW'), // 50 A at about 50 V
  nantHead: d(294, 0, ' m'), // the head that gives 20 GWh from 25 million m³
  leithMaxKwh: d(2.04, 2, ' kWh'), // 50 t × 15 m
  midlandsShare: d(4, 0, pct), // 0.804 GWh over 20 GWh
  massCost100: money(d(294, 0), '$', '/kWh'), // 36,697 t × $80 / 10,000 kWh
  massCost2000: money(d(15, 0), '$', '/kWh'),

  // ---- the model's results for the farm machine (src/sim), at full speed unless said
  roundTrip: m(53, 0, pct),
  roundTripLow: m(40, 0, pct),
  roundTripHigh: m(66, 0, pct),
  upEta: m(74, 0, pct),
  upAtTenth: m(37, 0, pct),
  downEta: m(72, 0, pct),
  strokeInKwh: m(1.46, 2, ' kWh'),
  strokeOutWh: m(780, 0, ' Wh'),
  meterUpKw: m(17.6, 1, ' kW'),
  meterDownKw: m(9.4, 1, ' kW'),
  kettles: m(4.7, 1),
  cutInKw: m(1.9, 2, ' kW'),
  cutInLow: m(1.26, 2, ' kW'),
  cutInHigh: m(2.69, 2, ' kW'),
  cutCopperW: m(569, 0, ' W'),
  cutInverterW: m(416, 0, ' W'),
  cutAuxW: m(359, 0, ' W'),
  cutGearsW: m(205, 0, ' W'),
  cutCableW: m(167, 0, ' W'),
  cutSupplyW: m(153, 0, ' W'),
  fridgeHookKw: m(2.02, 2, ' kW'),
  fridgeEta: m(5, 0, pct),
  fridgeMin: m(32, 0, ' min'),
  fridgeWh: m(54, 0, ' Wh'),
  slowestKw: m(1.44, 2, ' kW'),
  burstMin: m(13, 0, ' min'),
  burstKw: m(2.6, 1, ' kW'),
  burstWh: m(430, 0, ' Wh'),
  burstTimes: m(8, 0, [' fois', ' times']),
  burstEta: m(52, 0, pct),
  lightestKg: m(374, 0, ' kg'),
  lightestLow: m(219, 0, ' kg'),
  lightestHigh: m(645, 0, ' kg'),
  stopsPayingT: m(2.7, 1, ' t'),
  diyLightestKg: m(36.5, 1, ' kg'),
  diyWatts: m(3.1, 1, ' W'),
  diyRoundTrip: m(2, 0, pct),
  dayInKwh: m(2.43, 2, ' kWh'),
  dayOutKwh: m(0.17, 2, ' kWh'),
  dayDirect: m(7, 0, pct),
  dayBuffer: m(23, 0, pct),
  dayReady: m(2, 0, pct),
  raceTowerMin: m(21, 0, ' min'),
  raceModuleH: m(4.3, 1, ' h'),
  raceWaterH: m(14, 0, ' h'),
  // where the power goes (W), raising and lowering at full speed
  upGuideW: m(131, 0, ' W'),
  upReevingW: m(404, 0, ' W'),
  upMeshW: m(858, 0, ' W'),
  upCableW: m(221, 0, ' W'),
  upInverterW: m(482, 0, ' W'),
  upSupplyW: m(501, 0, ' W'),
  downReevingW: m(391, 0, ' W'),
  downMeshW: m(752, 0, ' W'),
  downDragW: m(150, 0, ' W'),
  downCopperW: m(564, 0, ' W'),
  downIronW: m(322, 0, ' W'),
  downCableW: m(166, 0, ' W'),
  downInverterW: m(414, 0, ' W'),
  downSupplyW: m(323, 0, ' W'),
  // the shafts
  drumRpm: m(15.4, 1, rpm),
  drumTorqueUp: m(8500, 0, ' N·m'),
  drumTorqueDown: m(7760, 0, ' N·m'),
  stage1Rpm: m(88, 0, rpm),
  stage1Torque: m(1510, 0, ' N·m'),
  stage2Rpm: m(506, 0, rpm),
  stage2Torque: m(270, 0, ' N·m'),
  motorTorqueUp: m(48.5, 1, ' N·m'),
  motorTorqueDown: m(38.3, 1, ' N·m'),
  drumBrakeTimes: m(175, 0, [' fois', ' times']), // 8,500 / 48.5: what the drum brake holds against the motor's brake
  motorAmpsUp: m(27.7, 1, ' A'),
  motorAmpsDown: m(24, 0, ' A'),
  motorRiseK: m(23, 0, ' K'),
  ratio: m(188, 0, ':1'),
  hookPerTurnMm: m(1.38, 2, ' mm'),
  tensionKn: m(51, 0, ' kN'),
  ropeFactor: m(6.1, 1),
  ropeHangBottom: m(137, 0, ' kg'),
  ropeHangTop: m(5, 0, ' kg'),
  ropeEnergyPct: m(0.36, 2, pct),
  rotorTonnes: m(2075, 0, ' t'),
  rampOneSecond: m(1.63, 2, [' fois', ' times']),
  stopDistanceCm: m(6.7, 1, ' cm'),
  // the night
  night1T: m(50, 0, ' t'),
  night1Towers: m(2.5, 1, [' tours', ' towers']),
  night7T: m(287, 0, ' t'),
  night7Towers: m(14.3, 1, [' tours', ' towers']),
  night7M3: m(103, 0, ' m³'),
  night7Blocks: m(100, 0, [' blocs', ' blocks']),
  gross1T: d(18, 0, ' t'),
  gross7T: d(128, 0, ' t'),
  // a fall
  fallPeak: m(0.79, 2, ' m/s'),
  fallCm: m(9.5, 1, ' cm'),
  impactMs: m(19.6, 1, ' m/s'),
  impactS: m(2, 0, ' s'),
  // a power cut
  dumpedWh: m(3.5, 1, ' Wh'),
  chopperKw: m(14, 0, ' kW'),
  // the module and its inverter
  lfpRoundTrip: m(87, 0, pct),
  lfpFridgeTrip: m(61, 0, pct),
  // other sizes of the same structure
  smallMotorKw: m(0.88, 2, ' kW'),
  smallMotorMpm: m(1.33, 2, ' m/min'),
  smallMotorTrip: m(44, 0, pct),
  smallSizeTrip: m(39, 0, pct),
  largeSizeTrip: m(66, 0, pct),

  // ---- assumptions and estimates of ours (src/sim/machine.ts, research §3)
  towerM: e(TOWER.height, 0, ' m'),
  /** The head frame's deck: the height a person climbs, and what a dropped tool falls. */
  deckM: e(DECK_TOP, 0, ' m'),
  shaftClear: e(TOWER.shaft, 1, ' m'),
  towerPlan: e(2 * TOWER.legX, 1, ' m'),
  padSide: e(PAD.side, 0, ' m'),
  padDepth: e(PAD.thick, 1, ' m'),
  padM3: e(PAD.side * PAD.side * PAD.thick, 1, ' m³'),
  padTimes: e(10, 0, [' fois', ' times']), // 73.5 m³ over the 7.17 m³ of the stack
  steelLow: e(15, 0, ' t'),
  steelHigh: e(25, 0, ' t'),
  fenceM: a(SITE.fenceR, 0, ' m'),
  fenceArea: a(Math.round((Math.PI * SITE.fenceR * SITE.fenceR) / 10) * 10, 0, ' m²'),
  pvKwp: a(PV_WATTS / 1000, 0, ' kWp'),
  carrierT: a(3.2, 1, ' t'),
  ropeOnDrum: e(4, 0, ' m'),
  ropeM: e(84, 0, ' m'),
  ropeKg: e(138, 0, ' kg'),
  drumM: e(2 * DRUM_R, 2, ' m'),
  drumTurns: e(Math.round(84 / (Math.PI * 2 * DRUM_R)), 0, [' tours', ' turns']), // the rope's 84 m over one circumference
  grooveMm: e(HOIST.ropePitch * 1000, 0, ' mm'),
  shoePlay: e((SHOE.slot - RAIL.bladeT) * 1000, 0, ' mm'),
  sheaveM: e(2 * HOOK_BLOCK.sheaveR, 2, ' m'),
  stages: e(3, 0, [' étages', ' stages']),
  stageMax: e(6.3, 1, ':1'),
  meshEta: e(98, 0, pct),
  gearTotal: e(94, 0, pct),
  motorRpm: e(2900, 0, rpm),
  motorEta: e(92.1, 1, pct),
  motorLossKw: e(1.29, 2, ' kW'),
  fanW: e(100, 0, ' W'),
  drumBrakeW: e(150, 0, ' W'),
  brakesW: e(219, 0, ' W'), // 69 W (a reference brake) + 150 W
  controlsW: e(40, 0, ' W'),
  controlsLow: e(15, 0, ' W'),
  controlsHigh: e(80, 0, ' W'),
  controlsKwhDay: e(0.96, 2, ' kWh'),
  readyW: e(284, 0, ' W'),
  readyKwhDay: e(6.8, 1, ' kWh'),
  wakeS: e(15, 0, ' s'),
  dcV: e(600, 0, ' V'),
  chopperV: e(750, 0, ' V'),
  dcBleedS: e(90, 0, ' s'),
  dc20s: m(586, 0, ' V'),
  cableM: e(MOTOR_CABLE_M, 0, ' m'),
  cableMm2: e(10, 0, ' mm²'),
  cableOhm: e(0.096, 3, ' Ω'),
  driveEta: a(97, 0, pct),
  inverterRatedW: e(489, 0, ' W'),
  guideShare: a(1, 0, pct),
  sheaveEta: a(98, 0, pct),
  rampS: a(2, 0, ' s'),
  overloadTorque: e(1.6, 1, [' fois', ' times']),
  overloadLoad: a(1.1, 1, [' fois', ' times']),
  governorMs: a(0.3, 1, ' m/s'),
  governorTimes: a(4.5, 1, [' fois', ' times']),
  governorDelayMs: e(50, 0, ' ms'),
  wedgeG: a(0.5, 1, ' g'),
  windStop: a(18, 0, ' m/s'),
  windBand: a(2, 0, ' m/s'),
  windFriction: m(0.5, 1, pct),
  socLow: a(30, 0, pct),
  socHigh: a(90, 0, pct),
  lfpIdleW: e(20, 0, ' W'),
  lfpShare: e(4, 0, pct),
  nightDefault: a(3, 0, ' kWh'),
  nightMin: a(1, 0, ' kWh'),
  nightMax: a(7, 0, ' kWh'),
  kettleKw: a(2, 0, ' kW'),
  fridgeW: a(100, 0, ' W'),
  costLow: money(e(100000, 0), '€'),
  costHigh: money(e(250000, 0), '€'),
  costKwhLow: money(e(100000, 0), '€', '/kWh'),
  costKwhHigh: money(e(230000, 0), '€', '/kWh'),
  co2TowerLow: e(2.2, 1, ' t'),
  co2TowerHigh: e(3.2, 1, ' t'),
  co2LfpLow: e(55, 0, ' kg'),
  co2LfpHigh: e(165, 0, ' kg'),
  diyRollerCm: e(3, 0, ' cm'),
} as const satisfies Record<string, Fig>;

export type FigName = keyof typeof FIG;

/** The mark a figure carries, by its status. */
export const markOf = (s: FigStatus): string => (s === 'derived' ? '†' : '*');
