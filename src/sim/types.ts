// Shared types of the gravity store. The engine (engine.ts) writes `GravityState`; the 3D scenes, the strip and the panel only read
// it. SI everywhere (kg, m, m/s, W, Wh for energies a person reads) except what the visitor sets in tonnes or m/min, which the
// panel converts.

export type PresetId = 'farm' | 'garden' | 'diy' | 'gravitylight' | 'leith' | 'swiss' | 'shaft' | 'rudong' | 'nant';

export type ScenarioId =
  | 'sunny-day'
  | 'kettle'
  | 'fridge-direct'
  | 'fridge-buffer'
  | 'night'
  | 'too-light'
  | 'blackout'
  | 'overspeed'
  | 'wind-stop'
  | 'race';

/** What the machine is told to do. `load`: follow a steady load; `day`: follow the sun and the house. */
export type Control = 'hold' | 'raise' | 'lower' | 'load' | 'day';

/** What it is doing. */
export type Mode = 'hold' | 'waking' | 'raising' | 'lowering' | 'stopping' | 'falling' | 'tripped' | 'crashed';

/** The state of the drive when the machine holds: `sleep` is cheap and slow to answer, `ready` is costly and answers in a second. */
export type DriveState = 'sleep' | 'ready' | 'run';

export type AlarmKey =
  | 'belowCutIn'
  | 'tooLight'
  | 'stalled'
  | 'overload'
  | 'ropeFactor'
  | 'storeFull'
  | 'storeEmpty'
  | 'gateOpen'
  | 'windStop'
  | 'gridLost'
  | 'chopper'
  | 'motorHot'
  | 'overspeed'
  | 'safetyGear'
  | 'crash';

/** Everything the visitor can edit live (through `GravitySim.set`). Ranges are in presets.ts (`RANGES`). */
export interface GravityParams {
  // ---- kit time controls
  /** Visual slow motion, and the clock of a fall (1, 0.2, 0.05, 0.02). */
  slowMo: number;
  /** Simulated seconds per real second (1, 60, 600, 3600). */
  timeScale: number;
  running: boolean;
  preset: PresetId | 'custom';
  /** The machine in use: the preset it came from, kept when the visitor edits it. */
  machine: PresetId;

  // ---- the store
  /** Load at the hook, kg. */
  mass: number;
  /** Stroke, m. */
  stroke: number;
  /** Falls of rope: 1, 2 or 4. */
  falls: number;
  /** Size of the motor, kW. The gear ratio follows (the motor must still hold the rated load), and the top speed with it. */
  motorKw: number;

  // ---- what it is told to do
  control: Control;
  /** Raising speed asked, m/min. */
  raiseSpeed: number;
  /** Power asked at the hook on the way down, W. */
  lowerPower: number;
  /** The house, W, whenever the control is not `day` (which follows its own day): `load` follows it, `lower` only shares its power with it. */
  loadPower: number;
  /** The drive sleeps when idle, instead of staying ready. */
  sleepWhenIdle: boolean;
  /** In `day`: wait for enough sun to raise at full speed, instead of crawling up on whatever is there. */
  waitForSun: boolean;

  // ---- the buffer and the house
  /** A battery between the tower and the load: the tower runs in bursts, the battery follows the load. */
  buffer: boolean;
  /** LFP modules in the buffer. */
  modules: number;
  /** Energy the house asks between 18:00 and 07:00, kWh. */
  nightKwh: number;
  /** Peak power of the barn roof, kW. */
  pvKw: number;

  // ---- the site
  /** Wind, m/s. */
  wind: number;
  /** Wind above which the machine stops, m/s. */
  windStop: number;
  /** The gate of the fence is open: the machine stops. */
  gateOpen: boolean;
  /** The farm's 400 V supply is there. */
  grid: boolean;
  /** The governor and the safety gear are fitted. */
  safetyGear: boolean;
  /** A shaft of the hoist has just broken: the load is on its own. */
  fault: boolean;

  // ---- the ladder: a calculator, nothing to do with the machine above
  /** Mass on the mass-height chart, tonnes. */
  ladderTonnes: number;
  /** Height on the mass-height chart, m. */
  ladderHeight: number;
}

/** The power crossing each station of the chain at this instant, W. A loss is ≥ 0. */
export interface ChainState {
  hook: number;
  guide: number;
  reeving: number;
  drum: number;
  gear: number;
  motor: number;
  cable: number;
  inverter: number;
  supply: number;
  auxiliaries: number;
  /** Signed: > 0 the machine takes power from the farm, < 0 it gives it back. Includes the standing power when holding. */
  meter: number;
  /** Mechanical power at the motor shaft, W, signed as the meter. */
  shaft: number;
}

/** What the 3D, the strip and the panel read every frame. */
export interface GravityState {
  // ---- clock
  /** Simulated seconds since the start. */
  simTime: number;
  /** Time of day, h, 0 to 24. */
  hour: number;

  // ---- the load
  /** Height of the load above the bottom of the stroke, m. */
  z: number;
  /** z over the stroke, 0 to 1: **the 3D uses this one** (a preset may have another stroke than the tower it draws). */
  zFraction: number;
  /** Speed of the load, m/s, positive upwards. */
  v: number;
  /** Speed as a person reads it, m/min, always ≥ 0. */
  speedMpm: number;
  /** The mode of the machine. */
  mode: Mode;
  drive: DriveState;
  /** Whole blocks and half blocks of the stack (farm machine: 6 and 2 at 20 t). */
  blocks: number;
  halves: number;

  // ---- the shafts (real values)
  motorRpm: number;
  drumRpm: number;
  motorTorque: number;
  drumTorque: number;
  ropeTension: number;
  ropeFactor: number;
  /** Rope speed, m/s; length of one fall, m. */
  ropeSpeed: number;
  fallLength: number;
  motorAmps: number;
  /** Temperature rise of the motor over the air, K. */
  motorRise: number;

  // ---- for the 3D: angles capped for the eye (lab-quality §1), already scaled by slowMo and the clock
  /** Drum and sheaves share the rope; angles in rad, signed as raising. */
  drumAngle: number;
  sheaveAngle: number;
  /** The drum's angle again, for the template's wheel, until the 3D role replaces src/three/device.ts. */
  angle: number;
  /** Motor angle at a capped speed; `motorBlur` tells when the real speed is past what the eye can read. */
  motorAngle: number;
  motorBlur: boolean;
  /** The service brake and the drum brake are released (they are released together in this model). */
  brakeReleased: boolean;
  safetyGearSet: boolean;
  /** Which way the current flows in the power room: 1 from the farm to the machine, −1 back, 0 none. */
  flowDirection: number;
  /** Is the brake resistor taking the power, and how much, W. */
  chopperPower: number;
  /** DC link voltage, V: it stays up after the power goes (the warning of the power room). */
  dcVolts: number;

  // ---- the chain
  chain: ChainState;
  /** Efficiency of the crossing now, 0 to 1: out/hook lowering, hook/in raising; 0 when holding or below the cut-in. */
  etaNow: number;

  // ---- energy
  /** m·g·z, Wh. */
  storedWh: number;
  /** What the machine would give at the meter if it came down from here at full speed, Wh. */
  deliverableWh: number;
  /** Counted at the meter since the start, Wh. */
  energyIn: number;
  energyOut: number;
  /** Of `energyIn`, what the machine drew holding still, Wh. */
  energyStanding: number;
  /** Sent to the brake resistor, Wh. */
  energyDumped: number;
  /** What came back, with what is stored now counted at what it will give and what was stored at the start taken off, over what was paid; 0 at first. */
  roundTripNow: number;

  // ---- the farm
  /** Sun on the barn roof, W. */
  pv: number;
  /** The house, W. */
  load: number;
  /** Battery on the AC side, W, > 0 charging. */
  lfpPower: number;
  /** State of charge, 0 to 1. */
  soc: number;
  /** Battery voltage of one module, V. */
  lfpVolts: number;
  /** The farm's connection, W, > 0 importing. */
  gridPower: number;
  /** Part of the load the machine and the battery are covering, W. */
  served: number;
  /** Wh of load served from the store since the start, and asked in all. */
  loadServedWh: number;
  loadAskedWh: number;
  /** The tower is in a burst into the buffer. */
  bursting: boolean;

  // ---- the night, for the ghost stack in `site`
  /** How much it takes to get through `nightKwh`: tonnes at this stroke, towers of this load, blocks, m³ of concrete. */
  ghostTonnes: number;
  ghostTowers: number;
  ghostBlocks: number;
  ghostVolume: number;

  // ---- a fall
  /** Largest speed reached, m/s; height lost, m; duration, s. */
  fallPeak: number;
  fallDrop: number;
  fallTime: number;
  /** Speed at the buffer if it reached it, m/s; energy released, kWh. */
  impactSpeed: number;

  alarms: AlarmKey[];
}

/** The last minute, for the live chart: at most 240 points. */
export interface Scope {
  t: number[];
  hook: number[];
  meter: number[];
  z: number[];
}
