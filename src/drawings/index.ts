import { configureDrawings, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { sitePlan } from './pl01-site';
import { towerSheet } from './pl02-tower';
import { hoistSheet } from './pl03-hoist';
import { reevingSheet } from './pl04-reeving';
import { weightSheet } from './pl05-weight';
import { driveSheet } from './pl06-drive';
import { wiringSheet } from './pl07-wiring';
import { energySheet } from './pl08-energy';

// The cartouche of every sheet says it first: this is not for construction (research §7, Q6). The tower, its pad and the carrier are not designed.
configureDrawings({
  project: { fr: 'STOCKAGE PAR GRAVITÉ — une tour de ferme', en: 'GRAVITY STORAGE — a farm tower' },
  disclaimer: {
    fr: 'NE PAS CONSTRUIRE : reconstitution pédagogique, machine générique, tour non calculée',
    en: 'NOT FOR CONSTRUCTION: a teaching reconstruction, a generic machine, the tower is not calculated',
  },
  date: '2026-11-02',
});

/** Every drawing of the "Plans" mode, in reading order (the numbers of the title blocks). */
export const SHEETS: DrawingSheet[] = [
  sitePlan,
  towerSheet,
  hoistSheet,
  reevingSheet,
  weightSheet,
  driveSheet,
  wiringSheet,
  energySheet,
];
