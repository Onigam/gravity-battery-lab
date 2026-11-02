import { energyWh, massFor } from './energy';

// The ladder of real machines: mass against height, with lines of equal energy. Every figure is tagged as in docs/research.md. Only
// what follows m·g·h is computed here; the rest is quoted with its date, since a status of a company or a plant changes.

export type Tag = 'reported' | 'derived' | 'estimate' | 'assumption' | 'model';

/** The visitor's mark for a tag, the same in the panel, the sheets and the texts: † computed from published figures; * an estimate, an assumption or a result of the model; nothing for a reported figure. */
export const tagMark = (tag: Tag): string => (tag === 'derived' ? '†' : tag === 'reported' ? '' : '*');

export type RungId =
  | 'gravitylight'
  | 'diy'
  | 'garden'
  | 'farm'
  | 'leith'
  | 'swiss'
  | 'green-gravity'
  | 'shaft'
  | 'ares'
  | 'rudong'
  | 'nant';

export interface Rung {
  id: RungId;
  /** kg, m, W; `null` where no source says. */
  mass: number;
  height: number;
  power: number | null;
  /** Tag of the mass and height pair. */
  tag: Tag;
  /** Tag of the energy where it differs from the pair's: a reported pair can give a computed energy, a computed pair can stand for a reported energy. */
  energyTag?: Tag;
  /** Built, or a study: for the chart's colour. */
  built: boolean;
  note: { fr: string; en: string };
}

export const RUNGS: readonly Rung[] = [
  {
    id: 'gravitylight',
    mass: 12.5,
    height: 1.8,
    power: 0.1,
    tag: 'reported',
    energyTag: 'derived',
    built: true,
    note: {
      fr: 'Sac de 8 à 12,5 kg, 1,8 m : une petite lumière pendant 12 à 28 minutes.',
      en: 'An 8 to 12.5 kg bag, 1.8 m: a small light for 12 to 28 minutes.',
    },
  },
  {
    id: 'diy',
    mass: 46,
    height: 6,
    power: null,
    tag: 'estimate',
    built: true,
    note: {
      fr: 'Une cour, des pierres : la charge est donnée, pas la hauteur, estimée à l’œil.',
      en: 'A courtyard, some rocks: the load is given, the height is not, judged by eye.',
    },
  },
  {
    id: 'garden',
    mass: 1000,
    height: 6,
    power: 1310,
    tag: 'assumption',
    built: false,
    note: {
      fr: 'Un jardin : le lab l’essaie, personne ne le construit.',
      en: 'A garden: the lab tries it, nobody builds it.',
    },
  },
  {
    id: 'farm',
    mass: 20000,
    height: 20,
    power: 13080,
    tag: 'assumption',
    energyTag: 'derived',
    built: false,
    note: {
      fr: 'La tour de ce lab : des pièces publiées, une machine que personne ne vend.',
      en: 'The tower of this lab: published parts, a machine nobody sells.',
    },
  },
  {
    id: 'leith',
    mass: 50000,
    height: 15,
    power: 250000,
    tag: 'reported',
    energyTag: 'derived',
    built: true,
    note: {
      fr: 'Édimbourg, 2021 : 2 × 25 t, tour de 15 m, 250 kW en moins d’une seconde. Démontée en juillet 2021.',
      en: 'Edinburgh, 2021: 2 × 25 t, a 15 m tower, 250 kW in under a second. Taken down in July 2021.',
    },
  },
  {
    id: 'swiss',
    mass: 34100,
    height: 42,
    power: 186000,
    tag: 'derived',
    built: true,
    note: {
      fr: 'Tessin, décembre 2020 : un bloc, 42 m. Le seul essai proche d’une mesure, rapporté par une encyclopédie, sans rapport publié.',
      en: 'Ticino, December 2020: one block, 42 m. The only test close to a measurement, reported by an encyclopaedia, with no published report.',
    },
  },
  {
    id: 'green-gravity',
    mass: 138000,
    height: 400,
    power: 150000,
    tag: 'estimate',
    built: false,
    note: {
      fr: 'Australie : puits de 400 m, 150 kW, essais visés pour 2026, début non confirmé. Masse non publiée : tracée pour une heure à pleine puissance.',
      en: 'Australia: a 400 m shaft, 150 kW, trials aimed at 2026, start unconfirmed. Mass not published: drawn for one hour at full power.',
    },
  },
  {
    id: 'shaft',
    mass: 500000,
    height: 500,
    power: 2450000,
    tag: 'assumption',
    built: false,
    note: {
      fr: 'Idée de puits de mine : 500 t dans 500 m. Le relevé des Midlands anglaises : 340 puits utiles, 0,8 GWh en tout.',
      en: 'The mine-shaft idea: 500 t in 500 m. The English Midlands survey: 340 useful shafts, 0.8 GWh in all.',
    },
  },
  {
    id: 'ares',
    mass: 6993000,
    height: 656,
    power: 50000000,
    tag: 'derived',
    energyTag: 'reported',
    built: false,
    note: {
      fr: 'Train sur une pente de 9,3 km à 7 % : 50 MW, 12,5 MWh. Pas construit à cette taille, à notre connaissance.',
      en: 'A train on a 9.3 km slope at 7 %: 50 MW, 12.5 MWh. Not built at that size, as far as we could find.',
    },
  },
  {
    id: 'rudong',
    mass: 367000000,
    height: 100,
    power: 25000000,
    tag: 'derived',
    energyTag: 'reported',
    built: true,
    note: {
      fr: 'Chine : 25 MW, 100 MWh, 148 m. Raccordée fin 2023, en attente d’autorisations en mars 2026. Le nombre de blocs n’est pas publié : tracée pour une chute moyenne de 100 m.',
      en: 'China: 25 MW, 100 MWh, 148 m. Connected late 2023, awaiting approvals in March 2026. The number of blocks is not published: drawn for a mean drop of 100 m.',
    },
  },
  {
    id: 'nant',
    mass: 25e9,
    height: 294,
    power: 900e6,
    tag: 'reported',
    built: true,
    note: {
      fr: 'Valais : 900 MW, 20 GWh, 25 millions de m³ d’eau. Le même m·g·h, avec un lac.',
      en: 'Valais: 900 MW, 20 GWh, 25 million m³ of water. The same m·g·h, with a lake.',
    },
  },
];

export const rung = (id: RungId): Rung => {
  const r = RUNGS.find((x) => x.id === id);
  if (!r) throw new Error(`no rung ${id}`);
  return r;
};

export const rungEnergyWh = (r: Rung): number => energyWh(r.mass, r.height);

/** The status of a rung's energy: K7, K20 and K28 are computed, K23 and K26 are reported as they stand. */
export const rungEnergyTag = (r: Rung): Tag => r.energyTag ?? r.tag;

/** The lines of equal energy on the chart, Wh. */
export const ISO_ENERGIES: readonly number[] = [1, 1e3, 1e6, 1e9];

/** The box of the chart, in log10 of the height (1 to 3,000 m) and of the mass (t): −3, 1, 5, 9, so that the kit's four ticks are whole powers. */
export const LADDER_BOX = { xMin: 0, xMax: Math.log10(3000), yMin: -3, yMax: 9 } as const;

/** A line of equal energy as a segment across the box, in log10 units: log m = log(E·3600/g) − log h − 3. */
export function isoLine(wh: number, box = LADDER_BOX): [number, number][] {
  const at = (x: number) => Math.log10(massFor(wh, Math.pow(10, x)) / 1000);
  // a straight line of slope −1 in log-log: cut it at the box
  let a = box.xMin;
  let b = box.xMax;
  if (at(a) > box.yMax) a = a + (at(a) - box.yMax);
  if (at(b) < box.yMin) b = b - (box.yMin - at(b));
  if (a >= b) return [];
  return [
    [a, at(a)],
    [b, at(b)],
  ];
}

/** Rope on a mountain: the slope, for K26's height. */
export const aresHeight = (length: number, gradePercent: number): number => (length * gradePercent) / 100;
