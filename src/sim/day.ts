// A day on the farm: the sun on the barn and what the house asks. Both are ASSUMPTIONS: the roof sets only the charging power (research
// §3: 36 kWp, change freely) and no source gives a household's night (K43: a slider from 1 to 7 kWh).

/** Share of the roof's peak power that reaches the panel at noon on a clear day (temperature, inverter, dirt). **Assumption**. */
export const PV_PERFORMANCE = 0.75;
/** Sunrise and sunset, h: a day at the equinox. **Assumption**. */
export const SUNRISE = 7;
export const SUNSET = 19;
/** The night the visitor sets runs from this hour to that one. */
export const NIGHT_START = 18;
export const NIGHT_END = 7;
/** Share of the night's energy spent in its first hours (cooking, lights), the rest over the small hours. **Assumption**. */
export const EVENING_SHARE = 0.6;
export const EVENING_END = 22;
/** What the house asks during the day, W (fridge, a few things). **Assumption**. */
export const DAY_LOAD_W = 250;

/** Power from the roof at an hour of the day, W. */
export function pvAt(hour: number, peakKw: number): number {
  if (hour <= SUNRISE || hour >= SUNSET) return 0;
  const x = (hour - SUNRISE) / (SUNSET - SUNRISE);
  return peakKw * 1000 * PV_PERFORMANCE * Math.pow(Math.sin(Math.PI * x), 1.5);
}

/** What the house asks at an hour, W, for a night of `nightKwh`. */
export function loadAt(hour: number, nightKwh: number): number {
  const evening = (EVENING_SHARE * nightKwh * 1000) / (EVENING_END - NIGHT_START);
  const small = ((1 - EVENING_SHARE) * nightKwh * 1000) / (24 - EVENING_END + NIGHT_END);
  if (hour >= NIGHT_START && hour < EVENING_END) return evening;
  if (hour >= EVENING_END || hour < NIGHT_END) return small;
  return DAY_LOAD_W;
}

export const FRIDGE_W = 100;
/** The fridge's year, kWh (K42: one door, combined), and what that is per day. */
export const FRIDGE_KWH_YEAR = [174, 346] as const;
export const fridgeKwhPerDay = (year: number): number => year / 365;
/** The kettle of the lessons, W (K44, an assumption on the 2 kW). */
export const KETTLE_W = 2000;
