import { getLang, registerStrings, tx } from '@onigam/lab-kit/i18n';

// The texts of the simulation: panel, status lines, alarms. Kept apart from src/i18n/ui.ts, which belongs to the data role; both go to the
// kit's one registry. `key: [fr, en]`, both written together. A number in a text comes from docs/research.md (strings.test.ts lists them).

export const SIM_STRINGS = {
  simIntro: [
    'Lever une masse garde son énergie, et la physique est honnête. Choisissez une machine et regardez ce qui reste à chaque étage. Tout ce qui n’est pas publié est une estimation de ce lab, marquée d’une étoile.',
    'Raising a mass keeps its energy, and the physics is honest. Choose a machine and watch what is left at each stage. Whatever is not published is an estimate of this lab, marked with a star.',
  ],
  marksLegend: [
    '† calculé à partir de chiffres publiés. * dépend d’une estimation de ce lab : personne n’a mesuré une machine de cette taille.',
    '† computed from published figures. * rests on an estimate of this lab: nobody has measured a machine of this size.',
  ],
  preset: ['Point de départ', 'Starting point'],
  custom: ['Personnalisé', 'Custom'],
  resetSim: ['Recommencer', 'Start again'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioHint: [
    'Chaque scénario montre une seule chose. Il règle lui-même l’horloge, que vous pouvez changer en bas.',
    'Each scenario shows one thing. It sets the clock itself, and you can change it at the bottom.',
  ],

  presetFarm: ['La tour de ferme', 'The farm tower'],
  presetGarden: ['Un jardin', 'A garden'],
  presetDiy: ['La cour et ses pierres', 'The courtyard and its rocks'],
  presetGravitylight: ['La lampe à poids', 'The weight-driven lamp'],
  presetLeith: ['Édimbourg, 2021', 'Edinburgh, 2021'],
  presetSwiss: ['Tessin, 2020, un bloc', 'Ticino, 2020, one block'],
  presetShaft: ['Un puits de mine', 'A mine shaft'],
  presetRudong: ['Rudong, Chine', 'Rudong, China'],
  presetNant: ['Nant de Drance', 'Nant de Drance'],

  scenarioSunnyDay: ['Un jour de soleil', 'A sunny day'],
  scenarioKettle: ['La bouilloire', 'The kettle'],
  scenarioFridgeDirect: ['Le frigo, sans rien', 'The fridge, on its own'],
  scenarioFridgeBuffer: ['Le frigo, avec batterie', 'The fridge, with a battery'],
  scenarioNight: ['Passer la nuit', 'Getting through the night'],
  scenarioTooLight: ['Trop léger', 'Too light'],
  scenarioBlackout: ['Coupure de courant', 'Power cut'],
  scenarioOverspeed: ['Survitesse', 'Overspeed'],
  scenarioWindStop: ['Le vent se lève', 'The wind gets up'],
  scenarioRace: ['La course', 'The race'],

  noteSunnyDay: [
    'Une journée en deux minutes et demie. Le toit lève le poids en cinq minutes, puis la maison le dépense le soir, doucement, donc mal : regardez ce que le compteur a rendu pour ce qu’il a pris.',
    'A day in two and a half minutes. The roof lifts the weight in five minutes, then the house spends it in the evening, slowly, so badly: see what the meter gave back for what it took.',
  ],
  noteKettle: [
    'La pleine vitesse, à l’heure réelle : de quoi faire tourner plusieurs bouilloires, pendant cinq minutes. La puissance est là ; l’énergie, elle, est très vite partie.',
    'Full speed, in real time: enough for several kettles, for five minutes. The power is there; the energy is soon gone.',
  ],
  noteFridgeDirect: [
    'On demande au crochet de plus en plus de puissance, en partant de la vitesse la plus lente du treuil. Regardez le compteur : il prend d’abord, et ne rend qu’après une certaine vitesse.',
    'The hook is asked for more and more power, from the hoist’s slowest speed. Watch the meter: first it takes, and it only gives back above a certain speed.',
  ],
  noteFridgeBuffer: [
    'La batterie suit le frigo, et la tour se vide d’un coup dans la batterie, à la vitesse où elle travaille moins mal. Le même poids tient bien plus longtemps.',
    'The battery follows the fridge, and the tower empties into the battery in one go, at the speed where it works less badly. The same weight lasts far longer.',
  ],
  noteNight: [
    'La nuit grandit de 1 à 7 kWh, et la pile fantôme de la ferme grandit avec elle : voici les tonnes et les tours qu’il faudrait.',
    'The night grows from 1 to 7 kWh, and the ghost stack on the farmyard grows with it: here are the tonnes and the towers it would take.',
  ],
  noteTooLight: [
    'On retire des blocs pendant la descente. Le poids cesse d’abord de rapporter, puis il ne descend plus de lui-même : le moteur doit le pousser.',
    'Blocks come off on the way down. First the weight stops paying, then it no longer comes down by itself: the motor has to push it.',
  ],
  noteBlackout: [
    'Le réseau tombe en pleine descente. La puissance n’a plus où aller : la résistance de freinage la brûle pendant la rampe, puis les freins se ferment. Le bus continu reste chargé après.',
    'The grid goes in full descent. The power has nowhere to go: the brake resistor burns it during the ramp, then the brakes close. The DC link stays charged afterwards.',
  ],
  noteOverspeed: [
    'Un arbre casse à pleine vitesse. Le limiteur déclenche, les coins mordent sur les rails. Vu au vingtième : tout se joue en moins d’une demi-seconde.',
    'A shaft breaks at full speed. The governor trips, the wedges bite on the rails. Seen at one twentieth: it is all over in under half a second.',
  ],
  noteWindStop: [
    'Au-dessus du seuil, la machine s’arrête. Ce n’est pas le poids qui gêne : les rails le tiennent, et le vent ne lui coûte presque rien. C’est la tour, et ceux qui y travaillent.',
    'Above the limit the machine stops. The weight is not the trouble: the rails hold it, and the wind costs it almost nothing. It is the tower, and those who work on it.',
  ],
  noteRace: [
    'La même soirée de 1 kW, servie par la tour, par un module de batterie, et par la même masse d’eau tout en haut d’une chute alpine.',
    'The same 1 kW evening, served by the tower, by one battery module, and by the same mass of water at the top of an Alpine head.',
  ],

  statusHold: ['À l’arrêt, freins fermés.', 'Stopped, brakes closed.'],
  statusSleep: [
    'À l’arrêt, variateur endormi : il ne reste que la veille.',
    'Stopped, drive asleep: only the standby remains.',
  ],
  statusWaking: [
    'Le variateur se réveille : charge du bus, contrôle des freins.',
    'The drive is waking: charging the link, checking the brakes.',
  ],
  statusRaising: [
    'Le poids monte : le compteur paie, le poids garde.',
    'The weight rises: the meter pays, the weight keeps.',
  ],
  statusLowering: ['Le poids descend et le compteur reçoit.', 'The weight comes down and the meter receives.'],
  statusStopping: [
    'La rampe s’achève, les freins vont se fermer.',
    'The ramp is ending, the brakes are about to close.',
  ],
  statusBelowCutIn: [
    'Le poids descend, et pourtant le compteur paie : les pertes prennent plus que le crochet ne donne. C’est la limite de cette machine.',
    'The weight comes down, and yet the meter pays: the losses take more than the hook gives. This is the limit of this machine.',
  ],
  statusTooLight: [
    'Trop léger pour descendre seul : les frottements gagnent, et le moteur doit le pousser.',
    'Too light to come down alone: friction wins, and the motor has to push it.',
  ],
  statusStalled: [
    'Il ne descend pas : le poids ne suffit pas à faire tourner le réducteur et le moteur à l’envers.',
    'It does not come down: the weight is not enough to turn the gears and the motor backwards.',
  ],
  statusFull: ['En haut : le stock est plein.', 'At the top: the store is full.'],
  statusEmpty: ['En bas : le stock est vide.', 'At the bottom: the store is empty.'],
  statusOverload: [
    'Le limiteur de charge refuse : cette charge est trop lourde pour ce moteur et ces brins.',
    'The overload cell refuses: this load is too heavy for this motor and these falls.',
  ],
  statusRope: [
    'Le câble travaille sous le coefficient de sécurité du constructeur : il faut plus de brins ou moins de charge.',
    'The rope is working below the maker’s safety factor: it needs more falls or less load.',
  ],
  statusGate: ['Le portail est ouvert : la machine s’arrête.', 'The gate is open: the machine stops.'],
  statusWind: ['Trop de vent : la machine reste à l’arrêt.', 'Too much wind: the machine stays stopped.'],
  statusGrid: [
    'Plus de réseau : la puissance va à la résistance, puis les freins se ferment.',
    'No grid: the power goes to the resistor, then the brakes close.',
  ],
  statusHot: [
    'Le moteur chauffe : le constructeur ne lui promet que 70 % de service.',
    'The motor is hot: the maker promises it only 70 % duty.',
  ],
  statusFalling: ['La charge tombe.', 'The load is falling.'],
  statusTripped: [
    'Les coins tiennent la charge. Rien ne repartira avant une inspection.',
    'The wedges hold the load. Nothing moves again before an inspection.',
  ],
  statusCrashed: [
    'Sans parachute, toute l’énergie du stock s’en va d’un coup, dans la butée.',
    'Without safety gear, all the energy in the store goes at once, into the buffer.',
  ],
  statusEnergy: [
    'Un repère sur l’échelle : l’énergie seule, sans modèle de sa machine.',
    'A mark on the ladder: its energy alone, with no model of its machine.',
  ],
  statusDiy: [
    'Une machine de cour : ni la hauteur, ni le rouleau, ni le rapport final ne sont connus. Ces chiffres sont une estimation.',
    'A courtyard machine: its height, its roller and its final ratio are unknown. These figures are an estimate.',
  ],

  alarmBelowCutIn: ['Sous le seuil', 'Below cut-in'],
  alarmTooLight: ['Trop léger', 'Too light'],
  alarmStalled: ['Bloqué', 'Stalled'],
  alarmOverload: ['Surcharge', 'Overload'],
  alarmRope: ['Câble trop chargé', 'Rope overloaded'],
  alarmFull: ['Stock plein', 'Store full'],
  alarmEmpty: ['Stock vide', 'Store empty'],
  alarmGate: ['Portail ouvert', 'Gate open'],
  alarmWind: ['Arrêt vent', 'Wind stop'],
  alarmGrid: ['Réseau coupé', 'Grid lost'],
  alarmChopper: ['Sur résistance', 'On the resistor'],
  alarmHot: ['Moteur chaud', 'Motor hot'],
  alarmOverspeed: ['Survitesse', 'Overspeed'],
  alarmGear: ['Parachute en prise', 'Safety gear set'],
  alarmCrash: ['Chute', 'Fall'],

  stripHook: ['Crochet', 'Hook'],
  stripMeter: ['Compteur', 'Meter'],
  stripHeight: ['Hauteur', 'Height'],
  stripStored: ['Stocké', 'Stored'],

  liveHeight: ['Hauteur', 'Height'],
  liveStored: ['Stocké', 'Stored'],
  liveHook: ['Au crochet', 'At the hook'],
  liveMeter: ['Au compteur', 'At the meter'],
  liveEta: ['Rendement', 'Efficiency'],
  liveSpeed: ['Vitesse', 'Speed'],
  meterHint: [
    'Au compteur : positif quand la machine rend, négatif quand elle prend.',
    'At the meter: positive when the machine gives back, negative when it takes.',
  ],

  chainTitle: ['Où passe la puissance', 'Where the power goes'],
  chainIntoWeight: ['Dans le poids', 'Into the weight'],
  chainOut: ['Rendu au compteur', 'Back at the meter'],
  chainGuide: ['Rails', 'Guides'],
  chainReeving: ['Poulies et tambour', 'Sheaves and drum'],
  chainGear: ['Réducteur', 'Gearbox'],
  chainMotor: ['Moteur', 'Motor'],
  chainCable: ['Câble', 'Cable'],
  chainInverter: ['Variateur', 'Inverter'],
  chainSupply: ['Alimentation', 'Supply'],
  chainAux: ['Ventilateur, freins, contrôle', 'Fan, brakes, controls'],
  chainStanding: ['Veille', 'Standby'],
  chainHint: [
    'Le moteur doit tenir le poids à n’importe quelle vitesse : ses pertes et celles du variateur restent quand la vitesse baisse. C’est pour cela que la machine ne rend rien en dessous d’une certaine puissance.',
    'The motor must hold the weight at any speed: its losses and the inverter’s stay when the speed falls. That is why the machine gives nothing below a certain power.',
  ],

  secControl: ['La commande', 'The control'],
  control: ['Ordre', 'Order'],
  controlHold: ['Tenir', 'Hold'],
  controlRaise: ['Monter', 'Raise'],
  controlLower: ['Descendre', 'Lower'],
  controlLoad: ['Suivre une charge', 'Follow a load'],
  controlDay: ['Suivre le soleil et la maison', 'Follow the sun and the house'],
  raiseSpeed: ['Vitesse de montée', 'Raising speed'],
  lowerPower: ['Puissance au crochet, en descente', 'Power at the hook, going down'],
  loadPower: ['La charge', 'The load'],
  controlHint: [
    'Faites descendre la puissance au crochet jusqu’à ce que le compteur ne rende plus rien. Le treuil ne descend pas sous sa vitesse la plus lente.',
    'Bring the power at the hook down until the meter gives nothing. The hoist does not go below its slowest speed.',
  ],

  secMachine: ['La machine', 'The machine'],
  massSlider: ['Charge au crochet', 'Load at the hook'],
  strokeSlider: ['Course', 'Stroke'],
  fallsSelect: ['Brins de câble', 'Falls of rope'],
  motorSlider: ['Moteur', 'Motor'],
  motorHint: [
    'Un petit moteur avec un grand rapport tient le même poids et rend à plus basse puissance, mais il monte moins vite, et il perd plus en proportion.',
    'A small motor with a large ratio holds the same weight and gives at a lower power, but it climbs more slowly, and it loses more in proportion.',
  ],
  factRatio: ['Rapport', 'Ratio'],
  factTop: ['Vitesse maxi', 'Top speed'],
  factLowest: ['Vitesse mini', 'Lowest speed'],
  factCutIn: ['Rien en dessous de', 'Nothing below'],
  factLightest: ['Descend seul dès', 'Comes down alone from'],
  factRope: ['Coefficient du câble', 'Rope factor'],
  factStrokeIn: ['Une montée coûte', 'One climb costs'],
  factStrokeOut: ['Une descente rend', 'One descent gives'],
  factRoundTrip: ['Aller-retour', 'Round trip'],

  secNight: ['La nuit et la batterie', 'The night and the battery'],
  nightSlider: ['La nuit de la maison', 'The house’s night'],
  nightHint: [
    'Personne ne publie la nuit d’un foyer : ce curseur est une hypothèse, du soir au matin.',
    'Nobody publishes a household’s night: this slider is an assumption, from evening to morning.',
  ],
  buffer: ['Une batterie entre la tour et la maison', 'A battery between the tower and the house'],
  modules: ['Modules de batterie', 'Battery modules'],
  pvSlider: ['Toit solaire', 'Solar roof'],
  waitForSun: ['Attendre assez de soleil pour monter à pleine vitesse', 'Wait for enough sun to climb at full speed'],
  sleepWhenIdle: ['Endormir le variateur à l’arrêt', 'Put the drive to sleep when stopped'],
  sleepHint: [
    'Endormi, il met quelques secondes à repartir ; prêt, il répond tout de suite mais brûle en un jour plusieurs fois ce que le poids garde.',
    'Asleep, it takes a few seconds to answer; ready, it answers at once but burns in a day several times what the weight keeps.',
  ],
  nightGross: ['Sans aucune perte', 'With no loss at all'],
  nightTonnes: ['Avec les pertes', 'With the losses'],
  nightTowers: ['Soit, en tours', 'That is, in towers'],
  nightBlocks: ['Blocs de béton', 'Concrete blocks'],
  nightConcrete: ['Béton', 'Concrete'],
  nightModule: ['Un module, lui, tient', 'One module holds'],
  nightModuleUnit: ['de cette nuit', 'of this night'],
  nightPathHint: [
    'Avec les pertes : la tour se vide en une fois dans la batterie, qui suit la maison. C’est le seul chemin raisonnable pour une si petite charge.',
    'With the losses: the tower empties in one go into the battery, which follows the house. It is the only reasonable way to serve so small a load.',
  ],

  secSite: ['La sécurité et le site', 'Safety and the site'],
  windSlider: ['Vent', 'Wind'],
  windStop: ['Arrêt au-dessus de', 'Stop above'],
  gateOpen: ['Portail de la clôture ouvert', 'Fence gate open'],
  grid: ['Réseau présent', 'Grid present'],
  safetyGear: ['Limiteur et parachute montés', 'Governor and safety gear fitted'],
  siteHint: [
    'Trois arrêts indépendants retiennent la machine : le portail, le vent, le réseau. Le parachute, lui, n’agit que quand tout le reste a lâché.',
    'Three separate stops hold the machine back: the gate, the wind, the grid. The safety gear acts only when everything else has let go.',
  ],
  fallPeak: ['Vitesse atteinte', 'Speed reached'],
  fallDrop: ['Hauteur perdue', 'Height lost'],
  fallTime: ['Durée', 'Duration'],
  fallImpact: ['Vitesse à la butée', 'Speed at the buffer'],

  secMore: ['Tous les chiffres', 'All the figures'],
  moreMotorTorque: ['Couple moteur', 'Motor torque'],
  moreMotorRpm: ['Vitesse moteur', 'Motor speed'],
  moreDrumRpm: ['Vitesse du tambour', 'Drum speed'],
  moreDrumTorque: ['Couple au tambour', 'Drum torque'],
  moreRopeTension: ['Tension du câble', 'Rope tension'],
  moreCurrent: ['Courant moteur', 'Motor current'],
  moreRise: ['Échauffement', 'Temperature rise'],
  moreDc: ['Bus continu', 'DC link'],
  moreEnergyIn: ['Pris au compteur', 'Taken at the meter'],
  moreEnergyOut: ['Rendu au compteur', 'Given at the meter'],
  moreStanding: ['Dont veille', 'Of which standby'],
  moreDumped: ['Brûlé en résistance', 'Burnt in the resistor'],
  moreDeliverable: ['Encore à rendre', 'Still to give'],
  moreRoundTripNow: ['Bilan depuis le début', 'Balance so far'],
  morePv: ['Soleil', 'Sun'],
  moreLoad: ['Maison', 'House'],
  moreGrid: ['Réseau', 'Grid'],
  moreLfp: ['Batterie', 'Battery'],
  moreSoc: ['Charge de la batterie', 'Battery charge'],
  moreServed: ['Maison servie par le stock', 'House served by the store'],

  chartOut: ['Ce qui ressort, selon la puissance au crochet', 'What comes out, by power at the hook'],
  seriesOut: ['Au compteur', 'At the meter'],
  seriesIdeal: ['Sans aucune perte', 'With no loss'],
  chartEta: ['Rendement, selon la puissance au crochet', 'Efficiency, by power at the hook'],
  seriesDown: ['Descente', 'Down'],
  seriesUp: ['Montée', 'Up'],
  seriesRoundTrip: ['Aller-retour', 'Round trip'],
  markNow: ['maintenant', 'now'],
  markYou: ['vous', 'you'],
  markCutIn: ['seuil', 'cut-in'],
  chartEtaHint: [
    'Le rendement monte avec la vitesse et n’a pas encore fini de monter à pleine charge. Aucun constructeur ne publie cette courbe pour une machine de cette taille : c’est celle du modèle.',
    'The efficiency rises with the speed and has not finished rising at full load. No maker publishes this curve for a machine of this size: it is the model’s.',
  ],

  chartDay: ['Un jour de cette machine', 'One day of this machine'],
  seriesPv: ['Soleil', 'Sun'],
  seriesLoad: ['Maison', 'House'],
  seriesMeter: ['Machine', 'Machine'],
  chartHeight: ['La hauteur du poids', 'The height of the weight'],
  seriesHeight: ['Hauteur', 'Height'],
  dayIn: ['Pris dans la journée', 'Taken in the day'],
  dayOut: ['Rendu dans la journée', 'Given in the day'],
  dayStanding: ['Dont veille', 'Of which standby'],
  dayRoundTrip: ['Rendu pour pris', 'Given for taken'],
  dayServed: ['Part de la nuit servie', 'Share of the night served'],
  dayHint: [
    'Ce bilan compte aussi la veille : ces quelques dizaines de watts, jour et nuit, pèsent autant que ce que le poids garde. Une petite batterie a la sienne aussi, mais elle la partage sur bien plus d’énergie.',
    'This balance also counts the standby: those few tens of watts, day and night, weigh as much as what the weight keeps. A small battery has its own too, but shares it over far more energy.',
  ],

  chartLadder: ['Masse et hauteur : les machines réelles', 'Mass and height: the real machines'],
  ladderMass: ['Masse', 'Mass'],
  ladderHeight: ['Hauteur', 'Height'],
  ladderEnergy: ['Cela fait', 'That makes'],
  ladderKwhHeight: ['Un kilowattheure, à cette masse', 'One kilowatt-hour, at this mass'],
  ladderAha: [
    'Une tonne, 367 mètres : un kilowattheure. Chaque droite relie ce qui garde la même énergie.',
    'One tonne, 367 metres: one kilowatt-hour. Each line joins what keeps the same energy.',
  ],
  rungGravitylight: ['Lampe à poids', 'Weight-driven lamp'],
  rungDiy: ['La cour', 'The courtyard'],
  rungGarden: ['Un jardin', 'A garden'],
  rungFarm: ['La tour de ce lab', 'The tower of this lab'],
  rungLeith: ['Édimbourg', 'Edinburgh'],
  rungSwiss: ['Tessin', 'Ticino'],
  rungGreenGravity: ['Puits en Australie', 'Shaft in Australia'],
  rungShaft: ['Puits de mine', 'Mine shaft'],
  rungAres: ['Train en pente', 'Train on a slope'],
  rungRudong: ['Rudong', 'Rudong'],
  rungNant: ['Nant de Drance', 'Nant de Drance'],

  secRungs: ['Ce qu’on sait de chacune', 'What is known of each'],

  chartCompare: ['Tour, module, lac', 'Tower, module, lake'],
  rowTower: ['La tour', 'The tower'],
  rowModule: ['Un module LFP', 'One LFP module'],
  rowReservoir: ['Nant de Drance', 'Nant de Drance'],
  rowEnergy: ['Énergie', 'Energy'],
  rowPower: ['Puissance', 'Power'],
  rowMass: ['Masse', 'Mass'],
  rowDensity: ['Par kilo', 'Per kilo'],
  rowRoundTrip: ['Aller-retour', 'Round trip'],
  rowCost: ['Prix par kWh', 'Price per kWh'],
  rowCarbon: ['Carbone pour cette énergie', 'Carbon for this energy'],
  compareHint: [
    'À cette échelle, la batterie gagne, et de loin : un module de 40 kg garde plus de quatre tours. La gravité offre autre chose : une puissance qui ne dépend pas de l’énergie, pas d’usure chimique, une masse qui peut être n’importe quoi de lourd. Là où elle a un sens, c’est un puits déjà creusé, ou un lac. Prix et carbone : des ordres de grandeur seulement.',
    'At this scale the battery wins, by far: a 40 kg module holds more than four towers. Gravity offers something else: power that does not depend on the energy, no chemical wear, a mass that can be anything heavy. Where it makes sense is a shaft already dug, or a lake. Prices and carbon: orders of magnitude only.',
  ],
  chartRace: ['La course, à cette charge', 'The race, at this load'],
  laneTower: ['La tour', 'The tower'],
  laneModule: ['Un module', 'One module'],
  laneWater: ['La même masse d’eau, en haut d’une chute alpine', 'The same mass of water, up an Alpine head'],
  raceNoTower: ['ne peut pas la servir', 'cannot serve it'],
  raceHint: [
    'Même masse, autre hauteur : voilà tout l’écart entre la tour et le lac. Chaque barre se vide au rythme de l’horloge, depuis le début du scénario.',
    'The same mass at another height: that is the whole gap between the tower and the lake. Each bar empties at the pace of the clock, from the start of the scenario.',
  ],

  chartLive: ['La dernière minute', 'The last minute'],
  seriesHook: ['Crochet', 'Hook'],
  seriesMeterOut: ['Compteur', 'Meter'],

  unitTowers: ['tours', 'towers'],
  unitBlocks: ['blocs', 'blocks'],
  unitHours: ['h', 'h'],
  unitMinutes: ['min', 'min'],
  unitDays: ['jours', 'days'],
  unitPerRev: ['tr/min', 'rpm'],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(SIM_STRINGS);

export type SimKey = keyof typeof SIM_STRINGS;

export const st = (key: SimKey): string => tx(key);

/** A number in the language's way (decimal comma in French, no "-0,0" for tiny negatives). */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  if (Math.round(Math.abs(value) * 10 ** digits) === 0) value = 0;
  return value.toLocaleString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Three significant digits for what spans orders of magnitude. */
const sig = (v: number): string => {
  const a = Math.abs(v);
  return num(v, a === 0 ? 0 : a < 10 ? 2 : a < 100 ? 1 : 0);
};

/** W, kW, MW. */
export function powerText(watts: number): string {
  const a = Math.abs(watts);
  if (a >= 1e9) return `${sig(watts / 1e9)} GW`;
  if (a >= 1e6) return `${sig(watts / 1e6)} MW`;
  if (a >= 1000) return `${sig(watts / 1000)} kW`;
  return `${num(watts, a < 10 ? 1 : 0)} W`;
}

/** Wh, kWh, MWh, GWh. */
export function energyText(wh: number): string {
  const a = Math.abs(wh);
  if (a >= 1e9) return `${sig(wh / 1e9)} GWh`;
  if (a >= 1e6) return `${sig(wh / 1e6)} MWh`;
  if (a >= 1000) return `${sig(wh / 1000)} kWh`;
  return `${num(wh, a < 10 ? 1 : 0)} Wh`;
}

/** kg, t, thousands of tonnes in words for a person. */
export function massText(kg: number): string {
  if (kg < 1000) return `${num(kg, kg < 100 ? 1 : 0)} kg`;
  return `${num(kg / 1000, kg < 10000 ? 1 : 0)} t`;
}

/** A mass on a logarithmic axis, in a few characters: 1 kg, 10 t, 100 kt, 1 Gt. */
export function shortMass(tonnes: number): string {
  if (tonnes >= 1e9) return `${num(tonnes / 1e9)} Gt`;
  if (tonnes >= 1e6) return `${num(tonnes / 1e6)} Mt`;
  if (tonnes >= 1000) return `${num(tonnes / 1000)} kt`;
  if (tonnes >= 1) return `${num(tonnes)} t`;
  return `${num(tonnes * 1000)} kg`;
}

/** A duration in s, min, h or days. */
export function durationText(s: number): string {
  if (!Number.isFinite(s)) return '—';
  if (s < 90) return `${num(s)} s`;
  if (s < 5400) return `${num(s / 60)} ${st('unitMinutes')}`;
  if (s < 172800) return `${num(s / 3600, 1)} ${st('unitHours')}`;
  return `${num(s / 86400)} ${st('unitDays')}`;
}
