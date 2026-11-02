// Assembly guide (20 steps): how such a machine goes up, in the order a qualified crew would follow, explained rather than ready to build (research
// §7, Q6). No torque is given, no dimension beyond the research's, and no structural figure is offered as a design: the tower is not calculated.
//
//   1      `site`   the survey and the fall zone (exclusion fence, block yard): the farm with no tower yet, since `machine-tower` comes only in step 20
//   2-3    `tower`  the soil, the pad and its anchors
//   4-9    `tower`  the legs, the bracing, the rails, the upper sections with the ladder and the scale, the buffers, the head frame
//   10-13  `hoist`  the hoist's base, the hoist itself, the return sheave and rope anchor, the overload cell and the governor
//   14-15  `tower`  the carrier in its rails, then the safety gear. The research joined safety gear and governor in one step; they stand in two worlds,
//                   so the governor comes with the overload cell (13) and step 15 ties the gear to it
//   16-18  `tower`  the reeving, the hook block on the carrier, the blocks and their ties
//   19     `hoist`  limit switches and encoder
//   20     `site`   the load test and the handover: the whole machine, now in its setting
//
// Every part of `tower` and `hoist` is installed in one step; a part named again (the pad in 3, the legs and bracing in 7, the hook block and carrier
// in 17) is framed again on purpose, since the gesture is on it. Warnings are said once each, where the gesture is risky: the crane, the height, the
// suspended load's crush zone, the first rope. The notice about the suspended load itself is in the tower world's overview and in the Sources.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

export const ASSEMBLY: GuideStep[] = [
  {
    id: 'survey',
    scene: 'site',
    title: l('Regarder le site et tracer la zone de chute', 'Survey the site and mark the fall zone'),
    text: lf(
      'Tout commence par un cercle au sol : autour de l’emplacement de la tour, le lab prend un rayon égal à sa hauteur, {fenceM}, faute de règle trouvée. On y plante la **clôture de sécurité**, et l’on vérifie ce qu’il y a dedans : bâtiments, chemin, lignes électriques. Tout près, l’**aire à blocs** reçoit un sol assez dur pour les béquilles d’une grue. C’est ici qu’un projet réel s’arrête souvent : une ferme n’a pas toujours {fenceArea} de libres.',
      'It all starts with a circle on the ground: around the tower’s place, the lab takes a radius equal to its height, {fenceM}, for want of any rule found. The **exclusion fence** goes up there, and you check what lies inside: buildings, a track, power lines. Close by, the **block yard** gets ground hard enough for a crane’s outriggers. This is where a real project often stops: a farm does not always have {fenceArea} to spare.',
    ),
    parts: ['exclusion-fence', 'block-yard'],
    tools: [l('Plan du terrain, piquets', 'Site plan, stakes'), l('Décamètre ou GPS', 'Long tape or GPS')],
    tip: l(
      'Cherchez les lignes aériennes avant tout : une grue et un fil font les accidents les plus graves d’un chantier agricole.',
      'Look for overhead lines before anything else: a crane and a wire make the worst accidents on a farm site.',
    ),
  },
  {
    id: 'soil-pad',
    scene: 'tower',
    title: l('Faire étudier le sol, puis couler le massif', 'Have the soil studied, then pour the pad'),
    text: lf(
      'La vraie taille du **massif de fondation** ne se devine pas : elle sort d’une étude de sol et d’un calcul de structure, que ce lab ne fait pas. L’ordre de grandeur estimé, {padSide} × {padSide} × {padDepth}, annonce déjà un gros chantier : {padM3} de béton armé, {padTimes} le béton du poids. On creuse, on ferraille, on coule en une seule fois pour éviter une reprise, et l’on laisse durcir longuement avant d’y poser la moindre charge.',
      'The true size of the **foundation pad** cannot be guessed: it comes from a soil study and a structural design, which this lab does not do. The estimated order of magnitude, {padSide} × {padSide} × {padDepth}, already points to a big job: {padM3} of reinforced concrete, {padTimes} the concrete of the weight. You dig, set the rebar, pour in one go to avoid a joint, and let it harden for a long time before any load goes on it.',
    ),
    parts: ['foundation-pad'],
    tools: [l('Étude de sol', 'Soil study'), l('Toupies de béton, pompe', 'Concrete mixers, a pump')],
    warning: l(
      'Une fouille de cette profondeur peut s’effondrer : blindage ou talus, et personne au fond pendant que l’engin creuse.',
      'A pit this deep can collapse: shoring or a sloped side, and nobody at the bottom while the digger works.',
    ),
  },
  {
    id: 'anchors',
    scene: 'tower',
    title: l('Placer les ancrages dans le massif', 'Set the anchors in the pad'),
    text: lf(
      'Les tiges qui tiendront les quatre montants sont noyées dans le béton, ou scellées après coup. Elles se placent avec un gabarit d’acier, car une erreur ici se retrouve partout au-dessus : pour un carré de {towerPlan} de côté, il n’y a pas de jeu à gagner plus haut. Ce **massif de fondation** reçoit ensuite des platines calées de niveau, et une marque de peinture sur chaque écrou. C’est aussi le moment du premier relevé de niveau : il servira de référence pendant toute la vie de la tour.',
      'The bolts that will hold the four legs are cast into the concrete, or grouted in afterwards. They are placed with a steel template, because a mistake here shows up everywhere above: for a square {towerPlan} a side, there is no play to be gained higher up. This **foundation pad** then takes base plates shimmed level, and a paint mark on each nut. This is also the time for the first level survey: it will serve as the reference for the whole life of the tower.',
    ),
    parts: ['foundation-pad'],
    tools: [l('Gabarit d’acier', 'Steel template'), l('Niveau optique', 'Optical level')],
    tip: l(
      'Gardez le gabarit et notez les cotes relevées, pas celles du plan : ce sont les vraies qui comptent pour la suite.',
      'Keep the template and note the dimensions as measured, not those on the plan: the real ones are what count from here on.',
    ),
  },
  {
    id: 'first-section',
    scene: 'tower',
    title: l('Dresser le premier tronçon', 'Stand the first section'),
    text: lf(
      'Le premier **montant** de chaque angle se pose sur ses tiges, avec ses cales, à la grue. Cette première hauteur décide de l’aplomb de toute la tour : on la règle à la lunette ou au laser, sur deux faces, avant de serrer. Le puits central doit rester libre de {shaftClear} × {shaftClear}. Le serrage définitif attend que les quatre pieds soient bien posés : si l’on serre un pied trop tôt, on tord l’ensemble.',
      'The first **tower leg** at each corner goes onto its bolts, with its shims, by crane. This first height decides the plumb of the whole tower: it is set by theodolite or laser, on two faces, before tightening. The central shaft must stay clear at {shaftClear} × {shaftClear}. Final tightening waits until all four feet are properly down: tighten one foot too early and you twist the lot.',
    ),
    parts: ['tower-leg'],
    tools: [l('Grue mobile', 'Mobile crane'), l('Laser ou théodolite', 'Laser or theodolite')],
    warning: l(
      'Personne sous une charge levée, jamais : le levage est dirigé par un seul chef de manœuvre, formé et désigné.',
      'Nobody under a raised load, ever: the lift is directed by one trained, appointed slinger.',
    ),
  },
  {
    id: 'first-bracing',
    scene: 'tower',
    title: l('Poser le contreventement', 'Fit the bracing'),
    text: l(
      'Les montants tiennent à peine tout seuls : c’est le **contreventement** qui fait d’eux une structure. On pose les diagonales face par face, boulons juste accostés, puis on recontrôle l’aplomb et l’équerrage. Vient seulement alors le serrage définitif, au couple prévu par l’ingénieur de structure. Chaque écrou reçoit un trait de peinture à cheval : c’est le contrôle le moins cher de toute la tour, et on le lira pendant des décennies.',
      'The legs barely stand alone: the **bracing** is what makes them a structure. The diagonals go on face by face, bolts just snug, then the plumb and squareness are checked again. Only then comes final tightening, to the torque set by the structural engineer. Each nut gets a paint line across it: the cheapest check on the whole tower, to be read for decades.',
    ),
    parts: ['tower-bracing'],
    tools: [l('Clé dynamométrique', 'Torque wrench'), l('Marqueur de peinture', 'Paint marker')],
    tip: l(
      'Un boulon de treillis se serre en deux temps : accosté d’abord, puis au couple, une fois l’ensemble bien droit.',
      'A lattice bolt is tightened in two passes: snug first, then to torque once the whole thing stands straight.',
    ),
  },
  {
    id: 'rails',
    scene: 'tower',
    title: l('Monter les rails, à l’aplomb', 'Mount the rails, plumb'),
    text: lf(
      'Le **rail de guidage** se fixe aux montants par des pattes réglables, et cette précision n’a rien à voir avec celle de l’acier de charpente : c’est celle d’un ascenseur. Un fil à plomb ou un laser sert de référence sur toute la hauteur, et chaque joint se reprend à la lime. Les coins du parachute mordront là un jour, et le patin y glissera tous les jours : le lab suppose un frottement de {guideShare} du poids, mais seulement si le rail est droit.',
      'The **guide rail** fixes to the legs by adjustable brackets, and its precision has nothing to do with structural steel: it is a lift’s. A plumb wire or a laser is the reference over the whole height, and each joint is dressed with a file. The safety wedges will bite here one day, and the shoe will slide here every day: the lab assumes friction of {guideShare} of the weight, but only if the rail is straight.',
    ),
    parts: ['guide-rail'],
    tools: [l('Fil à plomb ou laser', 'Plumb wire or laser'), l('Lime fine, cales', 'Fine file, shims')],
    tip: l(
      'Montez les rails par le bas et réglez chaque longueur avant la suivante : rattraper une erreur en haut ne fait que la déplacer.',
      'Mount the rails from the bottom and set each length before the next: making up an error at the top only moves it.',
    ),
  },
  {
    id: 'upper-sections',
    scene: 'tower',
    title: l('Monter les tronçons du haut à la grue', 'Raise the upper sections by crane'),
    text: lf(
      'La tour grandit par tronçons préassemblés, **montants** et **contreventement** ensemble, jusqu’à {deckM}. Sur chaque nouveau tronçon, on boulonne d’abord, on vérifie ensuite l’aplomb, et l’on continue les rails. L’**échelle et sa ligne de vie** montent en même temps, pour que personne n’ait jamais à grimper sans protection. L’**échelle des kilowattheures**, un ajout pédagogique de ce lab, se pose sur un montant en suivant la course.',
      'The tower grows by pre-assembled sections, **legs** and **bracing** together, up to {deckM}. On each new section you bolt first, then check the plumb, then carry on with the rails. The **ladder and its fall arrest** go up at the same time, so nobody ever has to climb unprotected. The **kilowatt-hour scale**, a teaching addition of this lab, goes on a leg along the stroke.',
    ),
    parts: ['tower-leg', 'tower-bracing', 'service-ladder', 'height-scale'],
    tools: [l('Grue mobile', 'Mobile crane'), l('Harnais et double longe', 'Harness and double lanyard')],
    warning: l(
      'Le travail en hauteur et le levage ne se font ni par vent fort, ni par gel, et jamais sans plan de sauvetage répété au sol.',
      'Work at height and lifting are not done in a strong wind or in frost, and never without a rescue plan rehearsed on the ground.',
    ),
  },
  {
    id: 'buffers',
    scene: 'tower',
    title: l('Poser les butées', 'Fit the end buffers'),
    text: lf(
      'La **butée amortissante** se pose au fond, à l’aplomb du châssis qu’elle recevra, avant que le puits ne soit occupé. Elle n’est prévue que pour une arrivée à la vitesse de marche : 20 t à 4 m/min ne portent que {kineticJ}. Ce n’est pas elle qui arrêtera une chute : voilà pourquoi la machine a un parachute. On prévoit aussi de quoi évacuer l’eau et les feuilles au fond de la fosse, et une marque qui montre la hauteur libre.',
      'The **end buffer** goes at the bottom, right under the carrier it will receive, before the shaft is taken up. It is meant only for an arrival at working speed: 20 t at 4 m/min carries only {kineticJ}. It is not what will stop a fall: that is why the machine has safety gear. You also plan a way to clear water and leaves from the bottom of the pit, and a mark showing the free height.',
    ),
    parts: ['end-buffer'],
    tools: [l('Niveau', 'Level'), l('Clés', 'Spanners')],
  },
  {
    id: 'head-frame',
    scene: 'tower',
    title: l('Lever le portique de tête', 'Lift on the head frame'),
    text: l(
      'Le **portique de tête** est le dernier grand élément de charpente : il monte d’une seule levée et se boulonne au sommet des montants. Il doit être plan et de niveau, car le treuil y sera calé, et c’est lui qui gardera tambour et poulie alignés sous charge. On l’équipe tout de suite de son plancher, de ses garde-corps et de son abri. On en profite pour vérifier l’aplomb de toute la tour, avec un poids propre désormais complet.',
      'The **head frame** is the last big piece of structure: it goes up in one lift and bolts to the top of the legs. It must be flat and level, since the hoist will be shimmed on it, and it is what keeps the drum and sheave aligned under load. Its floor, its guard rails and its canopy go on straight away. This is also the time to check the plumb of the whole tower, with its own weight now complete.',
    ),
    parts: ['head-frame'],
    tools: [l('Grue mobile', 'Mobile crane'), l('Niveau de précision', 'Precision level')],
    tip: l(
      'Montez les garde-corps au sol et levez le tout ensemble : une heure de plus au sol évite une journée dangereuse en l’air.',
      'Fit the guard rails on the ground and lift the lot together: an extra hour on the ground saves a dangerous day in the air.',
    ),
  },
  {
    id: 'hoist-base',
    scene: 'hoist',
    title: l('Préparer le châssis du treuil', 'Prepare the hoist base'),
    text: l(
      'Le **châssis du treuil** se pose sur le portique à l’aide de quatre boulons M30-8.8, dans des trous de Ø34, aux cotes publiées : 1,94 m entre les pieds. Avant tout serrage, on vérifie qu’aucun pied ne reste en l’air : les cales corrigent, et l’on mesure de nouveau. Un pied qui ne porte pas tord le bâti dès qu’on serre, et c’est le réducteur qui paie plus tard. On recontrôle ces cales une fois le treuil posé, car sa masse aura tout rapproché.',
      'The **hoist base** goes onto the head frame with four M30-8.8 bolts, in Ø34 holes, at the published dimensions: 1.94 m between the feet. Before any tightening, you check that no foot is left in the air: shims correct it, then you measure again. A foot not bearing twists the frame the moment you tighten, and the gearbox pays later. These shims are checked again once the hoist is on, since its mass will have closed everything up.',
    ),
    parts: ['hoist-base'],
    tools: [l('Cales d’épaisseur', 'Shims and feeler gauges'), l('Clé dynamométrique', 'Torque wrench')],
  },
  {
    id: 'hoist-lift',
    scene: 'hoist',
    title: l('Lever le treuil sur son châssis', 'Lift the hoist onto its base'),
    text: l(
      'Le treuil arrive en un seul bloc de 1 321 kg, réglé en usine : **moteur**, **frein de service**, **réducteur**, **tambour**, **frein de tambour** et **guide-câble** ne se démontent pas sur la tour. La levée se prépare avec la fiche du constructeur : points d’élingage, centre de gravité. Une fois en place, on serre en croix. Tout ce qui se trouve dans cette unité doit rester accessible depuis le plancher : ce sera tout l’entretien des années suivantes.',
      'The hoist arrives as a single 1,321 kg unit, set at the factory: **motor**, **service brake**, **gearbox**, **drum**, **drum brake** and **rope guide** are not taken apart on the tower. The lift is prepared with the maker’s sheet: slinging points, centre of gravity. Once in place, you tighten in a cross pattern. All that is in this unit must stay reachable from the floor: that will be all the upkeep of the years to come.',
    ),
    parts: ['hoist-motor', 'service-brake', 'hoist-gearbox', 'rope-drum', 'drum-brake', 'rope-guide'],
    tools: [
      l('Grue mobile, élingues certifiées', 'Mobile crane, certified slings'),
      l('Clé dynamométrique', 'Torque wrench'),
    ],
    warning: l(
      'C’est la levée la plus haute du chantier, et le vent y compte le plus : le chef de manœuvre décide seul, et il peut toujours dire non.',
      'This is the highest lift on the site, where the wind counts most: the slinger alone decides, and can always say no.',
    ),
  },
  {
    id: 'sheave-anchor',
    scene: 'hoist',
    title: l('Poser la poulie de renvoi et le point fixe', 'Fit the return sheave and the rope anchor'),
    text: lf(
      'La **poulie de renvoi** et le **point fixe du câble** forment le haut du mouflage. Leurs axes doivent être alignés avec les gorges du tambour : sinon le câble entre de biais et s’use sur les flancs. La poulie doit faire au moins {sheaveM}, selon la règle publiée, soit 18 fois le câble. Le point fixe prend un manchon à coin, à monter avec sa longueur libre. Ces deux pièces portent trois brins sur quatre : leurs supports sont contrôlés comme ceux du treuil.',
      'The **return sheave** and the **rope anchor** make the top of the reeving. Their axes must line up with the drum’s grooves: otherwise the rope enters at an angle and wears on the flanks. The sheave must be at least {sheaveM}, by the published rule of 18 times the rope. The anchor takes a wedge socket, to be fitted with its free length. These two parts carry three falls out of four: their brackets are checked like the hoist’s.',
    ),
    parts: ['return-sheave', 'rope-anchor'],
    tools: [l('Règle et cordeau', 'Straight edge and string line'), l('Jauge de gorge', 'Groove gauge')],
    tip: l(
      'Faites tourner la poulie à la main avant de partir : elle doit filer sans bruit, avant d’être inaccessible sous un câble.',
      'Spin the sheave by hand before leaving: it should run silently, before it becomes hard to reach under a rope.',
    ),
  },
  {
    id: 'cell-governor',
    scene: 'hoist',
    title: l('Monter le limiteur de charge et le limiteur de vitesse', 'Fit the overload cell and the governor'),
    text: lf(
      'Deux instruments gardent le câble : le **limiteur de charge** en mesure la force, et le **limiteur de vitesse** en surveille la vitesse. Le premier se place au point fixe, où le câble ne bouge pas, et son réglage n’est pas fait avant le premier poids connu. Le second a son propre petit câble, tendu sur toute la course : il entraîne une poulie à masselottes qui déclenche à {governorMs}, sans aucun courant. Ces deux pièces ne doivent jamais dépendre du moteur.',
      'Two instruments watch the rope: the **overload cell** measures its force, and the **overspeed governor** watches its speed. The first goes at the anchor, where the rope does not move, and is not set until the first known weight. The second has its own thin rope, stretched over the whole stroke: it drives a flyweight sheave that trips at {governorMs}, with no current at all. Neither of these parts must ever depend on the motor.',
    ),
    parts: ['overload-cell', 'overspeed-governor'],
    tools: [l('Clés', 'Spanners'), l('Multimètre', 'Multimeter')],
  },
  {
    id: 'carrier',
    scene: 'tower',
    title: l('Engager le châssis dans ses rails', 'Slide the carrier into its rails'),
    text: lf(
      'Le **châssis de charge** entre dans le puits à la grue, par une face laissée ouverte, et ses **patins de guidage** s’engagent dans les rails. C’est le moment de régler le jeu : assez pour qu’il circule, pas assez pour qu’il batte. Le châssis, le palonnier et la moufle comptent pour {carrierT} en tout, une hypothèse à vérifier ici par une vraie pesée. On pose ensuite le châssis sur la butée, qui reçoit ainsi sa première charge.',
      'The **weight carrier** goes into the shaft by crane, through a face left open, and its **guide shoes** engage the rails. This is the time to set the play: enough to run, not so much that it knocks. Carrier, lifting beam and hook block count for {carrierT} in all, an assumption to be checked here by a real weighing. The carrier is then set on the buffer, which takes its first load.',
    ),
    parts: ['weight-carrier', 'guide-shoe'],
    tools: [l('Grue mobile', 'Mobile crane'), l('Jeu de cales', 'Feeler gauges'), l('Peson', 'Load scale')],
    warning: l(
      'Le puits devient ici une zone d’écrasement : on n’y entre plus sans que le châssis soit posé et sans consignation.',
      'From here on the shaft is a crush zone: nobody goes in unless the carrier is down and everything is locked out.',
    ),
  },
  {
    id: 'safety-gear',
    scene: 'tower',
    title: l('Monter le parachute et le relier à son limiteur', 'Fit the safety gear and tie it to its governor'),
    text: lf(
      'Le **parachute** se monte sur le châssis, ses coins à faible distance des rails, tenus par une tringlerie. Celle-ci s’accroche au petit câble du limiteur : si la poulie du haut se bloque au-dessus de {governorMs}, c’est elle qui tire les coins. On règle le jeu aux rails, on vérifie à la main que les deux côtés agissent ensemble, puis on laisse tout libre pour l’essai final. Aucune graisse sur les faces de morsure : ce sont les seules surfaces de la machine qui doivent adhérer.',
      'The **safety gear** goes on the carrier, its wedges close to the rails, held by a linkage. That linkage hooks onto the governor’s thin rope: if the sheave up top locks above {governorMs}, it pulls the wedges. You set the gap to the rails, check by hand that both sides act together, then leave it all free for the final test. No grease on the biting faces: these are the only surfaces on the machine that have to grip.',
    ),
    parts: ['safety-gear'],
    tools: [l('Jeu de cales', 'Feeler gauges'), l('Notice du fabricant', 'Maker’s manual')],
    tip: l(
      'Faites agir la tringlerie à la main plusieurs fois : c’est le seul moment où l’on verra ces coins bouger sans incident.',
      'Work the linkage by hand several times: it is the only time you will see these wedges move with no incident.',
    ),
  },
  {
    id: 'reeving',
    scene: 'tower',
    title: l('Passer le câble dans les quatre brins', 'Reeve the rope through its four falls'),
    text: lf(
      'Le **câble de levage**, 20 mm et {ropeM}, se déroule de son touret sans jamais faire de boucle : une seule torsion peut le condamner. Il part du tambour, descend à la **moufle**, remonte à la poulie de renvoi, redescend à la moufle et finit au point fixe. On laisse {ropeOnDrum} toujours enroulés sur le tambour. Les premiers tours se font doucement, sous une légère tension, pour que chaque spire se couche bien dans sa gorge.',
      'The **hoist rope**, 20 mm and {ropeM}, comes off its reel without ever forming a loop: one twist can condemn it. It leaves the drum, goes down to the **hook block**, up to the return sheave, down to the hook block again and ends at the anchor. {ropeOnDrum} stay always wound on the drum. The first turns go slowly, under light tension, so that each one lies well in its groove.',
    ),
    parts: ['hoist-rope', 'hook-block'],
    tools: [l('Touret dérouleur', 'Reel stand'), l('Graisse à câble', 'Rope grease')],
    warning: l(
      'Un câble qui se dévrille et qui part sous tension fauche ce qu’il trouve : gants, recul, et personne dans son axe.',
      'A rope untwisting and getting away under tension scythes whatever it meets: gloves, stand back, and nobody in its line.',
    ),
  },
  {
    id: 'hook-carrier',
    scene: 'tower',
    title: l('Accrocher la moufle au châssis', 'Hook the block to the carrier'),
    text: lf(
      'La **moufle** s’accroche au palonnier du **châssis de charge**, au centre, et le linguet se ferme. Ce n’est qu’à ce moment que le treuil reçoit une charge. On fait une petite levée à faible hauteur : le câble se met en place, les brins prennent leur longueur, et l’on regarde chaque poulie tourner. La charge est encore faible, de l’ordre de {carrierT}, et le lab sait que cette machine descend seule dès {lightestKg} : le châssis à vide descend donc sans aide.',
      'The **hook block** hooks to the lifting beam of the **weight carrier**, at the centre, and the latch closes. Only now does the hoist take a load. A small lift at low height follows: the rope settles, the falls find their length, and you watch each sheave turn. The load is still small, about {carrierT}, and the lab knows this machine comes down alone from {lightestKg}: so the empty carrier comes down unaided.',
    ),
    parts: ['hook-block', 'weight-carrier'],
    tools: [l('Radio entre le palier et le sol', 'Radio between landing and ground')],
    tip: l(
      'Le premier mètre dit presque tout : montez à très basse vitesse, écoutez, puis redescendez avant de monter plus haut.',
      'The first metre tells almost everything: climb at very low speed, listen, then come back down before going higher.',
    ),
  },
  {
    id: 'blocks',
    scene: 'tower',
    title: l('Empiler les blocs, puis les tirants', 'Stack the blocks, then the ties'),
    text: lf(
      'Châssis en bas, posé sur sa butée, chaque **bloc de béton** arrive à la grue et se pose bien centré : six entiers d’abord, puis deux demi-blocs au-dessus, soit {stackT}. Une pile mal centrée charge un patin de plus que l’autre, et cela se paye à chaque course. Les **tirants de pile** viennent après, serrés en croix. On note chaque bloc posé dans le carnet : la masse exacte est une donnée de sécurité, que le limiteur de charge devra ensuite retrouver.',
      'With the carrier down on its buffer, each **concrete block** comes in by crane and is set down well centred: six whole ones first, then two half blocks on top, making {stackT}. An off-centre stack loads one shoe more than the other, and that is paid for at each stroke. The **stack ties** come next, tightened in a cross pattern. Each block set down is noted in the logbook: the exact mass is a safety figure, which the overload cell must then find.',
    ),
    parts: ['concrete-block', 'stack-tie'],
    tools: [l('Grue mobile', 'Mobile crane'), l('Élingues, peson', 'Slings, load scale')],
    warning: l(
      'Chaque bloc pèse environ 2,4 t et arrive suspendu : les mains ne guident jamais une charge, une corde de guidage le fait.',
      'Each block weighs about 2.4 t and comes in hanging: hands never guide a load, a tag line does.',
    ),
  },
  {
    id: 'limits-encoder',
    scene: 'hoist',
    title: l('Régler les fins de course et le codeur', 'Set the limit switches and the encoder'),
    text: lf(
      'Le **codeur**, en bout d’arbre, se raccorde au variateur, et le **fin de course** se règle sur le tambour. On fait la course lentement, à vitesse réduite : d’abord le repère du haut, avec au moins 0,83 m entre crochet et treuil, puis celui du bas, juste avant la butée. Viennent la pré-coupure, puis la coupure, et enfin la coupure ultime, indépendante. Avec une rampe de {rampS}, le poids s’arrête en {stopDistanceCm} à pleine vitesse : ces marges sont faciles à tenir.',
      'The **encoder**, on the shaft’s end, connects to the inverter, and the **limit switch** is set on the drum. The stroke runs slowly, at reduced speed: first the top mark, with at least 0.83 m between hook and hoist, then the bottom one, just before the buffer. Next come the pre-limit, then the stop limit, and finally the separate final one. With a {rampS} ramp, the weight stops within {stopDistanceCm} at full speed: these margins are easy to keep.',
    ),
    parts: ['limit-switch', 'motor-encoder'],
    tools: [l('Console du variateur', 'Inverter console'), l('Radio', 'Radio')],
    tip: l(
      'Ces réglages sont à refaire après les premiers mois : un câble neuf s’allonge, et les repères du premier jour ne valent plus.',
      'These settings must be redone after the first months: a new rope stretches, and the first day’s marks no longer hold.',
    ),
  },
  {
    id: 'load-test',
    scene: 'site',
    title: l('L’épreuve en charge, puis la remise', 'The load test, then the handover'),
    text: lf(
      'Une **tour de stockage** ne se déclare pas prête : un organisme qualifié fait les essais. Il contrôle l’épreuve statique et dynamique en charge, les deux freins séparément, chaque fin de course, le limiteur de charge, et enfin le parachute, déclenché pour de vrai à faible vitesse. La remise inclut un carnet, avec le premier relevé de niveau, les masses et les premières lectures du compteur. Le propriétaire reçoit alors une machine de 20 t qui garde {grossKwh} : et sa première inspection périodique est déjà fixée.',
      'A **storage tower** is not declared ready: a qualified body does the tests. It checks the static and dynamic load test, the two brakes separately, each limit switch, the overload cell and finally the safety gear, tripped for real at low speed. The handover includes a logbook, with the first level survey, the masses and the first meter readings. The owner then receives a 20 t machine that keeps {grossKwh}: and its first periodic inspection is already set.',
    ),
    parts: ['machine-tower'],
    tools: [
      l('Organisme qualifié', 'Qualified body'),
      l('Masses d’essai', 'Test weights'),
      l('Carnet de la machine', 'Machine logbook'),
    ],
    warning: l(
      'Pendant l’épreuve, le cercle de la zone de chute est vide : c’est le seul moment où la machine porte plus que sa charge de service.',
      'During the test, the fall zone is empty: this is the one time the machine carries more than its working load.',
    ),
  },
];
