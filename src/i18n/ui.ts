import { registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels, guides) live in the kit, the simulation's in src/panels/strings.ts;
// add here only what is specific to this lab.

export const LAB_STRINGS = {
  labTitle: ['LABO DU STOCKAGE PAR GRAVITÉ', 'GRAVITY STORAGE LAB'],
  tagline: ['Garder l’énergie en soulevant des poids', 'Keeping energy by lifting weights'],
  sceneSite: ['La ferme', 'The farm'],
  sceneTower: ['La tour', 'The tower'],
  sceneHoist: ['Le treuil', 'The hoist'],
  scenePowerRoom: ['Le local électrique', 'Power room'],
  goSite: ['Revenir à la ferme', 'Back to the farm'],
  goTower: ['Entrer dans la tour', 'Go into the tower'],
  goHoist: ['Monter voir le treuil', 'Go up to the hoist'],
  goPowerRoom: ['Entrer dans le local électrique', 'Go into the power room'],
  groupSite: ['La ferme', 'The farm'],
  groupTower: ['La tour et son poids', 'The tower and its weight'],
  groupHoist: ['Le treuil', 'The hoist'],
  groupPowerRoom: ['Le local électrique', 'The power room'],
  groupChart: ['Le bilan', 'The balance'],
  plansIntro: [
    'Huit planches A3 générées à partir des cotes du modèle 3D et de la simulation : le plan de la ferme et sa zone de chute, la tour, le treuil, le mouflage et ses tensions, le poids et son parachute, les arbres et leurs couples, le schéma électrique dans les deux sens, et le bilan d’énergie face aux machines réelles. Elles ne sont pas un plan de construction : la tour n’est pas calculée.',
    'Eight A3 sheets generated from the dimensions of the 3D model and from the simulation: the farm’s plan and its fall zone, the tower, the hoist, the reeving and its tensions, the weight and its safety gear, the shafts and their torques, the electrical diagram both ways, and the energy balance against the real machines. They are not for construction: the tower is not calculated.',
  ],
  lessonsIntro: [
    'Six leçons, de ce que pèse un kilowattheure à ce qui gagne, et où. Chacune ouvre un scénario de la Simulation et finit par quelques questions. Un chiffre marqué † est calculé à partir de chiffres publiés ; marqué *, il dépend d’une estimation de ce lab, ou sort de son modèle.',
    'Six lessons, from what a kilowatt-hour weighs to who wins, and where. Each one opens a scenario of the Simulation and ends with a few questions. A figure marked † is computed from published figures; marked *, it rests on an estimate of this lab, or comes from its model.',
  ],
  disclaimer: [
    'Reconstitution pédagogique indépendante. Une machine générique, assemblée à partir de pièces publiées : ce n’est le produit de personne, et personne ne la vend.',
    'An independent educational reconstruction. A generic machine, put together from published parts: it is nobody’s product, and nobody sells it.',
  ],
  noticeGeneric: [
    'À cette échelle, une batterie gagne, et de loin : le lab le dit franchement. Il montre aussi ce que la gravité offre en échange, et où elle pourrait avoir un sens. Les fabricants cités le sont comme données publiées, sans aucun lien ni recommandation, et les prix et le carbone sont donnés en ordres de grandeur.',
    'At this scale a battery wins, by a long way: the lab says so plainly. It also shows what gravity offers in exchange, and where it might make sense. The makers cited appear as published data, with no link or endorsement, and prices and carbon are given as orders of magnitude.',
  ],
  noticeMarks: [
    'Les chiffres : sans marque, ils viennent d’une source ; † ils sont calculés à partir de chiffres publiés ; * ils dépendent d’une estimation de ce lab ou sortent de son modèle. Personne n’a mesuré une machine de cette taille : aucun chiffre marqué * n’est une mesure.',
    'The figures: with no mark, they come from a source; † they are computed from published figures; * they rest on an estimate of this lab or come from its model. Nobody has measured a machine of this size: no figure marked * is a measurement.',
  ],
  safety: [
    'Cette machine est une reconstitution pédagogique : ne restez jamais sous une charge suspendue, et n’en construisez jamais une sans ingénieur de structure ni contrôleur de levage. Même une version de jardin peut tuer.',
    'This machine is a teaching reconstruction: never stand under a suspended load, and never build one without a structural engineer and a lifting inspector. Even a home-sized version can kill.',
  ],
  legal: [
    'Droit et règles : ce lab ne donne aucun avis juridique, et ceci vient de résumés, pas des textes en vigueur. En Europe, les machines relèvent de la directive 2006/42/CE, que le règlement (UE) 2023/1230 remplace à partir du 20 janvier 2027. En France, les appareils de levage d’un employeur sont vérifiés périodiquement, en général tous les 12 mois (Code du travail R4323-23 et arrêté du 1er mars 2004) ; la situation d’un particulier n’a pas été établie, et une tour de cette hauteur, au-dessus du seuil de 12 m, demanderait sans doute un permis de construire, ce qui reste à confirmer. En Suisse, l’ordonnance sur les machines (RS 819.14) reprend la directive, et les permis sont cantonaux.',
    'Law and rules: this lab gives no legal advice, and this comes from summaries, not the texts in force. In the EU, machinery falls under Directive 2006/42/EC, which Regulation (EU) 2023/1230 replaces from 20 January 2027. Employers’ lifting appliances usually need a periodic inspection, and a tower of this height is likely to need a building permit; both depend on your country, and are for you to check with its authorities.',
  ],
  sourceMain: ['La vidéo qui accompagne ce lab', 'The video that goes with this lab'],
  chapters: ['Son déroulé', 'Its outline'],
  sourcesNoCopy: [
    'Aucune image, séquence ni transcription de ces vidéos n’est reprise ici : le lab n’en retient que des faits, rédigés avec ses propres mots.',
    'No image, footage or transcript from these videos is reused here: the lab keeps only facts from them, in its own words.',
  ],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB_STRINGS);

export type UiKey = keyof typeof LAB_STRINGS | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}
