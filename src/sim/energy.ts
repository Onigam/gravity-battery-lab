import { G } from './machine';

// The easy part: E = m·g·h, and everything that follows from it by arithmetic. Masses in kg, heights in m, energies in Wh.

/** Energy of a mass raised through a height, Wh. */
export const energyWh = (mass: number, height: number): number => (mass * G * height) / 3600;

/** The height that makes one kilowatt-hour of a mass, m. 1 t: 366.97 m (K1). */
export const heightForKwh = (mass: number): number => 3.6e6 / (mass * G);

/** The mass that holds an energy at a height, kg. */
export const massFor = (wh: number, height: number): number => (wh * 3600) / (G * height);

/** Energy per kilogram at a height, Wh/kg (K4): g·h/3600, whatever the mass. */
export const whPerKg = (height: number): number => (G * height) / 3600;

/** Energy per cubic metre of a material at a height, kWh/m³ (K5). */
export const kwhPerM3 = (density: number, height: number): number => (density * G * height) / 3.6e6;

/** Duration of a full stroke, s (K9). */
export const strokeTime = (stroke: number, speed: number): number => stroke / speed;
