// The dimension rows of the part sheets, ALL read from src/three/dims.ts (the single source of lengths, BRIEF §5): no number is typed in this file. They are appended to each sheet's
// specs by ../parts.ts. A row with no mark is a maker's figure; `*` is an estimate of the 3D model (dims.ts says which). The tower, its pad and the carrier are not designed.
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import {
  BUFFER,
  CARRIER,
  DECK_TOP,
  DEVICE,
  ESTOP,
  GEARS,
  GOVERNOR,
  HOIST,
  HOOK_BLOCK,
  LADDER,
  PANEL_H,
  RAIL,
  SAFETY,
  SHED,
  SHELF,
  SHOE,
  SITE,
  TOWER,
  WH100_M,
} from '../../three/dims';
import { sp } from '../part-helpers';
import { nEn, nFr } from '../units';

const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;

/** A length shown in the unit that reads best, in both languages: metres to three decimals at most, no trailing zero. */
function metres(...m: number[]): { fr: string; en: string } {
  return {
    fr: m.map((x) => trim(nFr(x, 3), ',')).join(' × '),
    en: m.map((x) => trim(nEn(x, 3), '.')).join(' × '),
  };
}

function millimetres(...m: number[]): { fr: string; en: string } {
  return {
    fr: m.map((x) => nFr(x * 1000, 0)).join(' × '),
    en: m.map((x) => nEn(x * 1000, 0)).join(' × '),
  };
}

/** Metres: `*` when estimated, nothing when it is a maker's figure. */
const lenM = (mark: '*' | '', ...m: number[]): L => {
  const t = metres(...m);
  return l(`${t.fr} m${mark}`, `${t.en} m${mark}`);
};
const lenMm = (mark: '*' | '', ...m: number[]): L => {
  const t = millimetres(...m);
  return l(`${t.fr} mm${mark}`, `${t.en} mm${mark}`);
};
/** A device of the power room: width × height × depth, in millimetres, estimated. */
const box = (d: { w: number; h: number; d: number }): Spec =>
  sp(
    'Boîtier dessiné, largeur × hauteur × profondeur',
    'Case as drawn, width × height × depth',
    lenMm('*', d.w, d.h, d.d),
  );

const GEARBOX_TEETH = GEARS.stages.map((s) => `${s.teethP}/${s.teethW}`).join(', ');

export const DIM_SPECS: Record<string, Spec[]> = {
  // ---- site
  'barn-solar-roof': [
    sp('Grange dessinée, longueur × portée', 'Barn as drawn, length × span', lenM('*', SITE.barn.len, SITE.barn.span)),
    sp(
      'Modules dessinés',
      'Modules as drawn',
      l(
        `${SITE.pv.rows} × ${SITE.pv.cols}*, de ${SITE.pv.watts} W*`,
        `${SITE.pv.rows} × ${SITE.pv.cols}*, of ${SITE.pv.watts} W*`,
      ),
    ),
    sp('Taille d’un module dessiné', 'Size of one module as drawn', lenM('*', SITE.pv.w, SITE.pv.h)),
  ],
  farmhouse: [sp('Maison dessinée', 'House as drawn', lenM('*', SITE.house.w, SITE.house.d))],
  'machine-tower': [
    sp('Plan aux montants', 'Plan at the legs', lenM('*', 2 * TOWER.legX, 2 * TOWER.legX)),
    sp('Niveau du plancher de tête', 'Level of the head floor', lenM('*', DECK_TOP)),
  ],
  'power-shed': [
    sp('Pièce dessinée', 'Room as drawn', lenM('*', SHED.w, SHED.d)),
    sp('Hauteur sous plafond', 'Ceiling height', lenM('*', SHED.h)),
    sp('Distance à la tour', 'Distance from the tower', lenM('*', -SHED.x)),
  ],
  'cable-trench': [sp('Largeur dessinée', 'Width as drawn', lenM('*', SITE.trench.w))],
  'grid-connection': [sp('Poteau dessiné', 'Pole as drawn', lenM('*', SITE.pole.h))],
  'exclusion-fence': [sp('Hauteur de la clôture', 'Height of the fence', lenM('*', SITE.fenceH))],
  'interlocked-gate': [sp('Largeur du portail', 'Width of the gate', lenM('*', SITE.gate.w))],
  'wind-mast': [sp('Hauteur du mât dessiné', 'Height of the mast as drawn', lenM('*', SITE.mast.h))],
  'block-yard': [sp('Aire dessinée', 'Yard as drawn', lenM('*', SITE.yard.w, SITE.yard.d))],
  // ---- tower
  'tower-leg': [
    sp('Profil en H', 'H section', lenMm('*', TOWER.legSide, TOWER.legSide)),
    sp('Platine', 'Base plate', lenMm('*', TOWER.basePlate, TOWER.basePlate, TOWER.basePlateT)),
    sp(
      'Panneaux',
      'Panels',
      l(`${TOWER.panels}*, de ${nFr(PANEL_H, 2)} m*`, `${TOWER.panels}*, of ${nEn(PANEL_H, 2)} m*`),
    ),
  ],
  'tower-bracing': [
    sp('Diagonale, cornière', 'Diagonal, an angle', lenMm('*', TOWER.angleSide, TOWER.angleT)),
    sp('Hauteur des traverses', 'Depth of the struts', lenMm('*', TOWER.strutD)),
  ],
  'head-frame': [
    sp('Poutre de ceinture', 'Ring beam', lenMm('*', TOWER.ringD, TOWER.ringW)),
    sp(
      'Profils sous les pieds du treuil',
      'Channels under the hoist’s feet',
      lenMm('*', TOWER.channelD, TOWER.channelW),
    ),
    sp('Garde-corps', 'Guard rail', lenM('*', TOWER.rail)),
  ],
  'guide-rail': [
    sp('Lame du rail en T', 'Blade of the T rail', lenMm('*', RAIL.blade, RAIL.bladeT)),
    sp('Pied du rail', 'Foot of the rail', lenMm('*', RAIL.footW, RAIL.footT)),
    sp('Écart entre les deux rails', 'Gap between the two rails', lenM('*', 2 * RAIL.x)),
  ],
  'end-buffer': [
    sp('Hauteur', 'Height', lenMm('*', BUFFER.h)),
    sp('Diamètre du corps', 'Body diameter', lenMm('*', 2 * BUFFER.r)),
  ],
  'weight-carrier': [
    sp('Plateau', 'Deck', lenM('*', CARRIER.deckSide, CARRIER.deckSide)),
    sp('Montants du cadre', 'Uprights of the frame', lenMm('*', CARRIER.uprightW)),
    sp('Traverse haute', 'Crosshead', lenMm('*', CARRIER.crossheadW, CARRIER.crossheadD)),
  ],
  'guide-shoe': [
    sp('Patin', 'Shoe', lenMm('*', SHOE.h, SHOE.w)),
    sp('Fente sur la lame du rail', 'Slot on the rail’s blade', lenMm('*', SHOE.slot)),
    sp('Jeu total sur le rail', 'Total play on the rail', lenMm('*', SHOE.slot - RAIL.bladeT)),
    sp('Garniture', 'Liner', lenMm('*', SHOE.liner)),
  ],
  'safety-gear': [
    sp('Bloc de coins', 'Wedge block', lenMm('*', SAFETY.h, SAFETY.w)),
    sp('Course des coins', 'Travel of the wedges', lenMm('*', SAFETY.wedgeTravel)),
  ],
  'hook-block': [
    sp('De la selle au sommet de la moufle', 'From the saddle to the top of the block', lenM('', HOOK_BLOCK.e10)),
    sp('Diamètre des poulies', 'Sheave diameter', lenM('*', 2 * HOOK_BLOCK.sheaveR)),
  ],
  'service-ladder': [
    sp('Largeur', 'Width', lenMm('*', LADDER.w)),
    sp('Pas des barreaux', 'Rung spacing', lenMm('*', LADDER.rung)),
  ],
  'height-scale': [
    sp('Pour 100 Wh, à 20 t', 'For 100 Wh, at 20 t', l(`${nFr(WH100_M, 2)} m†`, `${nEn(WH100_M, 2)} m†`)),
  ],
  // ---- hoist
  'hoist-motor': [
    sp('Du réducteur au bout du codeur', 'From the gearbox to the end of the encoder', lenM('', HOIST.e2)),
    sp('Diamètre de la carcasse', 'Frame diameter', lenMm('*', 2 * HOIST.motorR)),
  ],
  'motor-encoder': [sp('Longueur du boîtier', 'Length of the housing', lenMm('*', HOIST.encoderEnd - HOIST.hoodEnd))],
  'service-brake': [sp('Diamètre', 'Diameter', lenMm('*', 2 * HOIST.brakeR))],
  'hoist-gearbox': [
    sp('Du tambour à l’axe du moteur', 'From the drum to the motor’s axis', lenM('', HOIST.drumToMotor)),
    sp('Dents dessinées, par étage', 'Teeth as drawn, per stage', l(`${GEARBOX_TEETH}*`, `${GEARBOX_TEETH}*`)),
    sp('Largeur des dents', 'Face width', lenMm('*', GEARS.width)),
  ],
  'rope-drum': [
    sp('Pas des gorges', 'Groove pitch', lenMm('*', HOIST.ropePitch)),
    sp('Diamètre des flasques', 'End-plate diameter', lenMm('*', 2 * HOIST.flangeR)),
    sp('Épaisseur de la virole', 'Barrel wall', lenMm('*', HOIST.barrelWall)),
  ],
  'drum-brake': [sp('Disque', 'Disc', lenMm('*', 2 * HOIST.discR, HOIST.discT))],
  'return-sheave': [sp('Diamètre dessiné', 'Diameter as drawn', lenM('*', 2 * HOOK_BLOCK.sheaveR))],
  'overspeed-governor': [
    sp('Diamètre de la poulie', 'Sheave diameter', lenMm('*', 2 * GOVERNOR.r)),
    sp('Diamètre du petit câble', 'Diameter of the thin rope', lenMm('*', 2 * GOVERNOR.ropeR)),
  ],
  'hoist-base': [
    sp('Entre les trous d’un pied', 'Between the holes of a foot', lenMm('', HOIST.holes)),
    sp('Hauteur de l’axe au-dessus des pieds', 'Height of the axis over the feet', lenMm('', HOIST.axisY)),
    sp('Hauteur hors tout', 'Overall height', lenMm('', HOIST.height)),
  ],
  // ---- power room
  'pv-inverter': [box(DEVICE.pvInverter)],
  'energy-meter': [box(DEVICE.energyMeter)],
  'ac-panel': [box(DEVICE.acPanel)],
  'regen-supply': [box(DEVICE.regenSupply)],
  'dc-link': [box(DEVICE.dcLink)],
  'motor-inverter': [box(DEVICE.motorInverter)],
  'brake-chopper': [box(DEVICE.brakeChopper)],
  'brake-resistor': [box(DEVICE.brakeResistor)],
  'safety-controller': [box(DEVICE.safetyController)],
  'emergency-stop': [sp('Hauteur au mur', 'Height on the wall', lenM('*', ESTOP.y))],
  'control-ups': [box(DEVICE.controlUps)],
  'battery-inverter': [box(DEVICE.batteryInverter)],
  'lfp-module': [sp('Étagère, largeur × profondeur', 'Shelf, width × depth', lenM('*', SHELF.w, SHELF.d))],
};
