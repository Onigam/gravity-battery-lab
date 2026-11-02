// Parts of the `hoist` world (13 of them, ids of docs/research.md §4): the drive at the top of the tower, in force order. Conventions: see ./site.ts.
// The hoist's rating, motor, rope and fixings are a published table (named only in the Sources); its drum, gear ratio, stages and sheaves are
// not published: estimates of research §3, with their marks. The drum's size changes the speeds of the shafts, never the energy.
// The storage duty is ours: a hoist is not sold for this.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const HOIST_PARTS: PartInfo[] = [
  {
    id: 'hoist-motor',
    scene: 'hoist',
    category: 'electrical',
    name: l('Moteur-générateur', 'Motor-generator'),
    short: l(
      'Un moteur de 15 kW en montée, le même en générateur à la descente : c’est lui qui fait de ce treuil une batterie.',
      'A 15 kW motor going up, the same machine as a generator coming down: this is what turns the hoist into a battery.',
    ),
    description: lf(
      'Un moteur asynchrone tourne dans les deux sens et sait aussi freiner : entraîné par la charge au-delà de son synchronisme, il renvoie du courant. Celui-ci vient d’un tableau publié : 15 kW, quatre pôles, 100 Hz, 28 A, cos φ 0,82, ventilation forcée, pour 70 % de service. Il doit tenir le poids à n’importe quelle vitesse : {motorTorqueUp} en montée, {motorTorqueDown} en descente. D’où le cœur du problème : ses pertes de cuivre dépendent du couple, pas de la vitesse, et valent {cutCopperW} même au seuil où la machine ne rend plus rien. Son rendement de {motorEta} vient d’une table de classe de rendement, le chiffre exact n’étant pas publié pour ce moteur.',
      'An induction motor turns both ways and can also brake: driven by the load beyond its synchronous speed, it sends current back. This one comes from a published table: 15 kW, four poles, 100 Hz, 28 A, cos φ 0.82, forced ventilation, for 70% duty. It must hold the weight at any speed: {motorTorqueUp} going up, {motorTorqueDown} coming down. Hence the heart of the problem: its copper losses depend on the torque, not the speed, and are {cutCopperW} even at the limit where the machine gives nothing. Its {motorEta} efficiency comes from an efficiency class table, the exact figure not being published for this motor.',
    ),
    material: l(
      'Carcasse d’acier ou de fonte, bobinage de cuivre, rotor à cage, ventilateur séparé',
      'Steel or cast-iron frame, copper winding, cage rotor, separate fan',
    ),
    specs: [
      sp('Puissance, fréquence', 'Power, frequency', l('15 kW, 100 Hz', '15 kW, 100 Hz')),
      sp('Courant, facteur de puissance', 'Current, power factor', l('28 A, cos φ 0,82', '28 A, cos φ 0.82')),
      sp('Vitesse', 'Speed', v('{motorRpm}')),
      sp('Couple, montée puis descente', 'Torque, climbing then coming down', v('{motorTorqueUp}, {motorTorqueDown}')),
      sp('Pertes nominales', 'Rated losses', v('{motorLossKw}')),
      sp('Ventilateur', 'Fan', v('{fanW}')),
      sp('Service', 'Duty', l('70 %', '70%')),
    ],
    maintenance: maint(
      {
        failure:
          'Le bobinage vieillit à la chaleur, et plus encore sous la tension hachée du variateur. Un ventilateur qui tombe en panne ne se voit pas au début : à basse vitesse, c’est lui seul qui refroidit le moteur.',
        check:
          'Lisez l’échauffement sur le variateur : le modèle le voit monter de seulement {motorRiseK} sur une course, mais une journée à pleine charge n’a rien à voir. Contrôlez l’isolement, à l’arrêt, et écoutez le roulement.',
        care: 'Dépoussiérez la grille du ventilateur et les ailettes, regraissez selon la notice, et remettez bien le capot de pluie après chaque visite.',
      },
      {
        failure:
          'The winding ages with heat, and more so under the inverter’s chopped voltage. A failed fan does not show at first: at low speed, it alone cools the motor.',
        check:
          'Read the temperature rise on the inverter: the model sees it climb by only {motorRiseK} in a stroke, but a day at full load is another matter. Test the insulation, stopped, and listen to the bearing.',
        care: 'Dust the fan grille and the fins, regrease as the manual says, and put the rain cover back properly after each visit.',
      },
    ),
    tip: lf(
      'Un moteur de 5 kW et un plus grand rapport rendent dès {smallMotorKw} au crochet, au lieu de {cutInKw}. Le prix : il monte à {smallMotorMpm} au lieu de 4 m/min, et l’aller-retour tombe à {smallMotorTrip}.',
      'A 5 kW motor and a larger ratio give from {smallMotorKw} at the hook, instead of {cutInKw}. The price: it climbs at {smallMotorMpm} rather than 4 m/min, and the round trip falls to {smallMotorTrip}.',
    ),
    video: ['02:42', '03:14', '16:18'],
    design: lf(
      'Dans une vidéo, un bricoleur écarte un moteur de 16 000 tr/min, choisit un petit moteur de 620 tr/min, et le voit chauffer. À toute échelle, un moteur est conçu pour tourner vite, et un poids pour descendre lentement : tout ce qui se trouve entre les deux est là pour les réconcilier, et cela coûte.',
      'In a video, a home builder rejects a 16,000 rpm motor, picks a small 620 rpm one, and watches it get hot. At any scale, a motor is made to turn fast and a weight to come down slowly: everything between the two is there to reconcile them, and that has a cost.',
    ),
  },
  {
    id: 'motor-encoder',
    scene: 'hoist',
    category: 'electrical',
    name: l('Codeur', 'Encoder'),
    short: lf(
      'Il compte les tours du moteur : le variateur sait toujours où est le poids, à {hookPerTurnMm} près par tour.',
      'It counts the motor’s turns: the inverter always knows where the weight is, to {hookPerTurnMm} per turn.',
    ),
    description: lf(
      'Tenir 20 t à vitesse quasi nulle, puis la faire partir sans à-coup, demande au variateur de connaître la position exacte du rotor. Le codeur, monté au bout de l’arbre, le lui donne en temps réel. Il sert aussi d’altimètre : avec un rapport de {ratio} et quatre brins, un tour de moteur déplace le crochet de {hookPerTurnMm}. Comme il compte depuis le moteur, il ne voit pas ce qui se passe après le réducteur : si un arbre casse, il continuera d’indiquer une vitesse normale. C’est pour cela que le limiteur de vitesse et le fin de course restent indépendants de lui.',
      'Holding 20 t at near zero speed, then setting off without a jolt, needs the inverter to know the rotor’s exact position. The encoder, on the end of the shaft, gives it in real time. It also serves as an altimeter: with a ratio of {ratio} and four falls, one motor turn moves the hook {hookPerTurnMm}. Since it counts from the motor, it does not see what happens after the gearbox: if a shaft breaks, it will go on showing a normal speed. That is why the overspeed governor and the limit switch stay independent of it.',
    ),
    material: l(
      'Disque optique ou magnétique, boîtier étanche, câble blindé',
      'Optical or magnetic disc, sealed casing, shielded cable',
    ),
    specs: [
      sp('Monté', 'Mounted', l('au bout de l’arbre du moteur', 'on the end of the motor shaft')),
      sp('Un tour de moteur au crochet', 'One motor turn at the hook', v('{hookPerTurnMm}')),
      sp('Vitesse la plus lente publiée', 'Slowest published speed', l('0,08 m/min', '0.08 m/min')),
      sp(
        'Ce qu’il ne voit pas',
        'What it does not see',
        l('un arbre cassé après le réducteur', 'a broken shaft after the gearbox'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un accouplement qui prend du jeu, un connecteur qui s’oxyde, un câble voisin du câble moteur qui capte des parasites. Le variateur s’arrête alors sur un défaut, poids tenu par les freins.',
        check:
          'Le journal du variateur garde la cause. À chaque fin de course, comparez la hauteur calculée et la hauteur réelle : un écart qui grandit annonce un codeur, ou un câble qui s’allonge.',
        care: 'Gardez le câble blindé loin du câble moteur, et sa tresse reliée à la masse à un bout. Remplacez, mais ne réparez pas : un codeur se change, en reprenant le réglage de la notice.',
      },
      {
        failure:
          'A coupling developing play, a connector oxidising, a cable near the motor cable picking up noise. The inverter then stops on a fault, the weight held by the brakes.',
        check:
          'The inverter’s log keeps the cause. At each end of stroke, compare the calculated and real heights: a growing gap points to an encoder, or a rope that is stretching.',
        care: 'Keep the shielded cable away from the motor cable, its braid bonded to earth at one end. Replace rather than repair: an encoder is changed, then set again as the manual says.',
      },
    ),
    tip: l(
      'Le lien le plus simple de ce lab est invisible : un seul nombre, dans le variateur, relie les tours du moteur à la hauteur du poids. Quand ce nombre est faux, le fin de course reste là.',
      'The simplest link in this lab cannot be seen: a single number, in the inverter, ties the motor’s turns to the weight’s height. When that number is wrong, the limit switch is still there.',
    ),
    design: l(
      'Sans capteur, un variateur peut estimer la vitesse d’un moteur tant que celui-ci tourne vite. À quasi-zéro, avec 20 t à tenir, il ne sait plus : le codeur n’est donc pas un luxe, mais ce qui rend possible la basse vitesse.',
      'Without a sensor, an inverter can estimate a motor’s speed as long as it turns fast. Near zero, with 20 t to hold, it can no longer tell: so the encoder is no luxury, but what makes low speed possible.',
    ),
  },
  {
    id: 'service-brake',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Frein de service', 'Service brake'),
    short: l(
      'Serré par des ressorts, desserré par l’électricité : sans courant, le frein se ferme. C’est le geste de sécurité le plus simple.',
      'Applied by springs, released by electricity: with no current, the brake closes. It is the simplest safety measure there is.',
    ),
    description: lf(
      'Sur ce treuil, les ressorts serrent deux disques en permanence, et une bobine ne les libère que pendant que le poids bouge. Toute coupure, quelle qu’en soit la cause, ferme le frein. Il tient sur l’arbre du moteur, où le couple est petit : {motorTorqueUp} environ, multiplié ensuite par {ratio}. Le constructeur annonce un frein à double disque, IP 66, pour un à deux millions de manœuvres au moins. Sa bobine n’est pas publiée, alors le modèle prend celle d’un frein de référence de 100 N·m : environ 69 W pendant que le poids bouge. Faiblesse logique : il agit avant le réducteur. Si un arbre casse après lui, il ne retient plus rien, d’où le frein de tambour.',
      'On this hoist, springs clamp two discs all the time, and a coil frees them only while the weight is moving. Any power loss, whatever its cause, closes the brake. It works on the motor shaft, where the torque is small: about {motorTorqueUp}, then multiplied by {ratio}. The maker states a twin-disc brake, IP 66, good for one to two million operations at least. Its coil is not published, so the model takes that of a 100 N·m reference brake: about 69 W while the weight moves. A logical weakness: it acts before the gearbox. If a shaft breaks after it, it holds nothing, hence the drum brake.',
    ),
    material: l(
      'Disques à garniture, ressorts, bobine, carcasse étanche IP 66',
      'Lined discs, springs, a coil, an IP 66 sealed casing',
    ),
    specs: [
      sp('Type', 'Type', l('à ressorts, double disque', 'spring-applied, twin disc')),
      sp('Étanchéité', 'Sealing', l('IP 66', 'IP 66')),
      sp(
        'Durée de vie annoncée',
        'Stated life',
        l('1 à 2 millions de manœuvres au moins', '1 to 2 million operations at least'),
      ),
      sp('Bobine, frein de référence', 'Coil, reference brake', l('environ 69 W', 'about 69 W')),
      sp('Couple à l’arbre moteur', 'Torque at the motor shaft', v('{motorTorqueUp}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une garniture usée qui ouvre l’entrefer : la bobine n’arrive plus à décoller le disque, ou le frein frotte. De l’huile sur les disques si un joint du réducteur fuit, et une bobine brûlée.',
        check:
          'Mesurez l’entrefer à la cale, machine consignée. Un essai de maintien en charge, poids en bas et à faible hauteur, dit s’il tient vraiment, sans moteur.',
        care: 'Remplacez les disques au repère d’usure de la notice. Ne touchez jamais aux ressorts pour « gagner du couple », et gardez-le propre, sans huile ni graisse.',
      },
      {
        failure:
          'A worn lining opening up the air gap: the coil can no longer lift the disc, or the brake rubs. Oil on the discs if a gearbox seal leaks, and a burnt-out coil.',
        check:
          'Measure the air gap with a feeler gauge, the machine locked out. A holding test under load, the weight low and at a small height, shows whether it truly holds with no motor.',
        care: 'Replace the discs at the manual’s wear mark. Never touch the springs to “gain torque”, and keep it clean, free of oil and grease.',
      },
    ),
    tip: lf(
      'Ce frein coûte aussi de l’énergie : à eux deux, avec le frein de tambour, ils prennent {brakesW} tant que le poids bouge. Sur une course lente, ce n’est plus un détail.',
      'This brake costs energy too: together with the drum brake, they take {brakesW} for as long as the weight moves. On a slow stroke, that is no longer a detail.',
    ),
    video: ['19:21'],
    design: l(
      'Un frein à ressorts répond à une seule question : que veut-on qu’il se passe quand tout s’arrête ? Dans une vidéo, un bricoleur oublie de visser un couvercle, et sa charge tombe : un moteur et des engrenages ne sont pas un frein.',
      'A spring brake answers one question: what should happen when everything stops? In a video, a home builder forgets to screw on a cover, and his load falls: a motor and gears are not a brake.',
    ),
  },
  {
    id: 'hoist-gearbox',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Réducteur', 'Gearbox'),
    short: lf(
      'Environ {ratio} en {stages} : il change la vitesse du moteur en couple au tambour, et il sait le faire à l’envers.',
      'About {ratio} in {stages}: it turns the motor’s speed into torque at the drum, and it can do so backwards.',
    ),
    description: lf(
      'Le moteur tourne à {motorRpm} et le tambour à {drumRpm} : d’où un rapport d’environ {ratio}, non publié, en {stages} hélicoïdaux. Les arbres passent par {stage2Rpm} et {stage1Rpm}, tandis que le couple grimpe de {motorTorqueUp} à {stage2Torque}, puis {stage1Torque}, puis {drumTorqueUp} au tambour. Chaque engrènement rend {meshEta}, soit {gearTotal} pour les trois : c’est la plus grosse perte de la machine à pleine vitesse, avec {upMeshW} en montée. Essentiel ici : une vis sans fin à fort rapport se bloquerait d’elle-même et ne rendrait rien, alors que ces engrenages hélicoïdaux se laissent entraîner à l’envers presque aussi bien.',
      'The motor turns at {motorRpm} and the drum at {drumRpm}: hence a ratio of about {ratio}, not published, in {stages} of helical gears. The shafts go through {stage2Rpm} and {stage1Rpm}, while the torque climbs from {motorTorqueUp} to {stage2Torque}, then {stage1Torque}, then {drumTorqueUp} at the drum. Each mesh passes {meshEta}, {gearTotal} for all three: it is the machine’s largest loss at full speed, at {upMeshW} on the way up. Essential here: a worm gear of high ratio would lock itself and give nothing back, whereas these helical gears can be driven backwards almost as well.',
    ),
    material: l(
      'Pignons d’acier cémenté, carter de fonte, huile de boîte, joints d’arbre',
      'Case-hardened steel gears, cast-iron housing, gear oil, shaft seals',
    ),
    specs: [
      sp('Rapport', 'Ratio', v('{ratio}')),
      sp('Étages', 'Stages', v('{stages}')),
      sp('Rapport maximal par étage', 'Largest ratio per stage', v('{stageMax}')),
      sp('Rendement par engrènement', 'Efficiency per mesh', v('{meshEta}')),
      sp(
        'Perte à pleine vitesse, en descente',
        'Loss at full speed, coming down',
        lf('{downMeshW} en engrènement, {downDragW} à vide', '{downMeshW} in the mesh, {downDragW} of drag'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'De la piqûre sur les dents les plus chargées, un joint d’arbre qui fuit, parfois vers le frein, et une huile trop vieille qui ne protège plus. À 4 m/min, c’est l’étage le plus lent qui souffre le plus, avec {drumTorqueUp} sur le dernier arbre.',
        check:
          'Un échantillon d’huile analysé montre les particules bien avant le bruit. Regardez le niveau et cherchez une fuite sous les joints. Une mesure de vibration, comparée à celle d’origine, dit si quelque chose change.',
        care: 'Vidangez aux intervalles de la notice, avec l’huile prévue. Une machine qui tourne peu vieillit aussi : par grand froid, un démarrage à huile épaisse coûte de l’énergie, ce que le modèle ne compte pas.',
      },
      {
        failure:
          'Pitting on the most loaded teeth, a shaft seal leaking, sometimes towards the brake, and oil too old to protect. At 4 m/min, the slowest stage suffers most, with {drumTorqueUp} on the last shaft.',
        check:
          'An analysed oil sample shows the particles long before the noise. Look at the level and for a leak under the seals. A vibration reading, compared with the original, says if anything is changing.',
        care: 'Change the oil at the manual’s intervals, with the specified type. A machine that runs little still ages: in hard cold, a start on thick oil costs energy, which the model does not count.',
      },
    ),
    tip: lf(
      'Une vidéo montre la chose en petit : avec un réducteur imprimé de 1:27, 12 kg ne descendent pas du tout. Le modèle du lab retrouve le blocage pour un rouleau de {diyRollerCm}, sous {diyLightestKg}, et sur cette tour il ne voit l’effet que sous {lightestKg}.',
      'A video shows it small: with a 1:27 printed gearbox, 12 kg does not come down at all. The lab’s model finds the same stall with a {diyRollerCm} roller, below {diyLightestKg}, and on this tower it sees the effect only below {lightestKg}.',
    ),
    video: ['04:49', '06:46', '07:51'],
    design: lf(
      'Plus d’étages n’est pas mieux : chaque étage ajouté coûte son rendement et accroît la friction. Le rapport reste une estimation, car le fabricant ne le publie pas, mais le rendement de la machine n’en dépend presque pas : c’est le nombre d’étages qui compte, pas la taille du tambour.',
      'More stages is not better: each one added costs its efficiency and adds friction. The ratio stays an estimate, since the maker does not publish it, but the machine’s efficiency hardly depends on it: what counts is the number of stages, not the size of the drum.',
    ),
  },
  {
    id: 'rope-drum',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Tambour', 'Rope drum'),
    short: l(
      'Un cylindre très long, rainuré, où le câble s’enroule en une seule couche : ainsi il ne s’écrase jamais sur lui-même.',
      'A very long grooved cylinder where the rope winds in a single layer: so it never crushes itself.',
    ),
    description: lf(
      'Sur ce treuil publié, le tambour occupe l’essentiel des 1,94 m entre les pieds : {ropeM} de câble doivent y tenir en une couche, en environ {drumTurns} au pas de {grooveMm}. Son diamètre n’est pas publié ; le lab prend {drumM}, entre le calcul sur les tours et la règle des 18 fois le câble. Il tourne à {drumRpm} sous {drumTorqueUp} en montée. Et ce choix change bien moins qu’on ne croit : le couple du moteur ne dépend que de la vitesse du crochet et de sa propre vitesse, donc un autre tambour change les vitesses des arbres, mais aucune énergie. Quelques tours restent toujours sur le tambour, {ropeOnDrum} de câble, pour soulager le point d’ancrage.',
      'On this published hoist the drum takes up most of the 1.94 m between the feet: {ropeM} of rope must fit in one layer, in about {drumTurns} at a {grooveMm} pitch. Its diameter is not published; the lab takes {drumM}, between the count of turns and the rule of 18 times the rope. It turns at {drumRpm} under {drumTorqueUp} when climbing. And that choice changes far less than you might think: the motor’s torque depends only on the hook’s speed and its own, so another drum changes the speeds of the shafts, but no energy. A few turns always stay on the drum, {ropeOnDrum} of rope, to take the load off the anchor.',
    ),
    material: l(
      'Tube d’acier rainuré, soudé sur ses flasques, arbre sur roulements',
      'Grooved steel tube, welded to its end plates, shaft on bearings',
    ),
    specs: [
      sp('Diamètre', 'Diameter', v('{drumM}')),
      sp('Câble enroulé', 'Rope wound', lf('{ropeM} sur une couche', '{ropeM} in one layer')),
      sp('Vitesse', 'Speed', v('{drumRpm}')),
      sp('Couple, montée puis descente', 'Torque, up then down', v('{drumTorqueUp}, {drumTorqueDown}')),
      sp('Câble à laisser enroulé', 'Rope to leave wound', v('{ropeOnDrum}')),
      sp('Entre les pieds du treuil', 'Between the hoist’s feet', l('1,94 m', '1.94 m')),
    ],
    maintenance: maint(
      {
        failure:
          'Des gorges usées qui ne tiennent plus le câble, un câble qui saute d’une gorge par manque de tension et monte sur son voisin. Une fissure à la soudure d’un flasque, là où passe tout le couple.',
        check:
          'Machine consignée, regardez le fond des gorges à la lampe. Faites une course lente pour voir le câble se coucher sagement dans sa gorge d’un bout à l’autre. Vérifiez qu’il reste bien des tours au point bas.',
        care: 'Un film de lubrifiant du câble suffit. Ne laissez jamais ce câble se détendre sur le tambour : il suffit d’un poids posé sans précaution, puis d’une reprise, pour écraser des fils.',
      },
      {
        failure:
          'Worn grooves that no longer hold the rope, a rope jumping out of a groove for want of tension and riding up on its neighbour. A crack in an end-plate weld, where all the torque goes through.',
        check:
          'With the machine locked out, look at the groove bottoms by torch. Run a slow stroke to watch the rope lie neatly in its groove from end to end. Check that turns remain at the bottom of the stroke.',
        care: 'A film of rope lubricant is enough. Never let this rope go slack on the drum: all it takes is a weight set down carelessly, then a restart, to crush wires.',
      },
    ),
    tip: l(
      'Une couche unique, c’est tout l’art : aucun passage du câble sur un autre, donc aucun écrasement. Voilà pourquoi ce tambour est si long : c’est la longueur de câble qui l’impose, plus que la charge.',
      'A single layer is the whole art: no pass of the rope over another, so no crushing. That is why this drum is so long: it is the length of rope that demands it, more than the load.',
    ),
    video: ['07:51', '16:44'],
    design: lf(
      'Dans une vidéo, un plus gros rouleau aide la charge à descendre : c’est vrai aussi dans le modèle, où ajouter des étages empire le blocage. Ici, sur 20 t, on peut se permettre un petit tambour et beaucoup de rapport, et ce diamètre n’a plus d’effet sur le rendement.',
      'In a video, a bigger roller helps the load come down: true in the model too, where adding stages makes the stall worse. Here, on 20 t, a small drum and plenty of ratio can be afforded, and this diameter no longer affects the efficiency.',
    ),
  },
  {
    id: 'drum-brake',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Frein de tambour', 'Drum brake'),
    short: l(
      'Le deuxième frein, du côté de la charge : il tient même si le réducteur ou un arbre a cédé entre le moteur et le tambour.',
      'The second brake, on the load side: it holds even if the gearbox or a shaft has given way between motor and drum.',
    ),
    description: lf(
      'Le frein de service ne protège qu’à travers le réducteur. Celui-ci agit directement sur le tambour, là où le couple est de {drumTorqueUp} : environ {drumBrakeTimes} celui de l’autre frein. Le catalogue le propose en option ; pour une machine qui garde 20 t en l’air pendant des heures, le lab le compte comme indispensable. Il se ferme un instant après l’autre, ce qui ménage ses garnitures en service et ne le fait intervenir vraiment que dans une panne. Sa consommation n’est pas publiée : le modèle prend {drumBrakeW}, avec un courant de maintien réduit, et elle fait partie de ce qui pèse à basse vitesse.',
      'The service brake protects only through the gearbox. This one acts directly on the drum, where the torque is {drumTorqueUp}: about {drumBrakeTimes} that of the other brake. The catalogue offers it as an option; for a machine that keeps 20 t in the air for hours, the lab counts it as essential. It closes a moment after the other, which spares its linings in service and makes it really act only in a failure. Its draw is not published: the model takes {drumBrakeW}, with a reduced holding current, and that is part of what weighs at low speed.',
    ),
    material: l(
      'Étrier à ressorts, disque ou couronne sur le tambour, bobine',
      'Spring-applied caliper, disc or ring on the drum, a coil',
    ),
    specs: [
      sp('Où il agit', 'Where it acts', l('sur le tambour, côté charge', 'on the drum, load side')),
      sp('Couple à tenir', 'Torque to hold', v('{drumTorqueUp}')),
      sp('Puissance, desserré', 'Power, released', v('{drumBrakeW}')),
      sp('Dans le catalogue', 'In the catalogue', l('une option', 'an option')),
    ],
    maintenance: maint(
      {
        failure:
          'Une garniture jamais sollicitée qui se glace ou rouille sur sa surface, et un frein qu’on découvre impuissant le jour où il sert. Une temporisation mal réglée, qui le fait fermer avant l’autre et l’use à chaque arrêt.',
        check:
          'Testez-le seul, sous charge, à faible hauteur, l’autre frein ouvert, aux intervalles fixés par l’organisme qui inspecte. Mesurez son entrefer, et lisez sa course sur le capteur de position.',
        care: 'Nettoyez la surface de freinage et faites-le serrer de temps à autre en marche lente, pour la garder propre. Réglez sa temporisation à la mise en service, et ne la changez plus.',
      },
      {
        failure:
          'A lining never called upon, which glazes or rusts onto its surface, and a brake found to be useless the day it is needed. A badly set delay, closing it before the other and wearing it at each stop.',
        check:
          'Test it alone, under load, at a small height, the other brake open, at the intervals set by the inspecting body. Measure its air gap, and read its travel on the position sensor.',
        care: 'Clean the braking surface and apply it now and then at slow speed, to keep it clean. Set its delay at commissioning, and leave it alone.',
      },
    ),
    tip: l(
      'Sa logique est celle de la ceinture et des bretelles : deux chemins indépendants, sur deux arbres différents, alimentés séparément. Une panne unique ne doit jamais lâcher la charge.',
      'Its logic is belt and braces: two independent paths, on two different shafts, with separate supplies. One failure alone must never let go of the load.',
    ),
    design: lf(
      'Il coûte de l’énergie à la minute : {drumBrakeW} de courant de maintien pendant toute une course, y compris aux vitesses où la machine produit peu. C’est une petite partie du prix qu’une petite machine paye pour rester sûre.',
      'It costs energy by the minute: {drumBrakeW} of holding current for the whole stroke, including at speeds where the machine makes little. That is a small part of the price a small machine pays for staying safe.',
    ),
  },
  {
    id: 'rope-guide',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Guide-câble', 'Rope guide'),
    short: l(
      'Un anneau presseur qui suit le câble le long du tambour et le garde dans sa gorge, surtout quand il se détend.',
      'A pressing ring that follows the rope along the drum and keeps it in its groove, especially when it goes slack.',
    ),
    description: lf(
      'Quand le poids se pose sur sa butée, le câble se détend sur le tambour, et c’est là qu’une spire peut sauter de sa gorge. Le guide-câble, un anneau en deux demi-coquilles qui avance avec l’enroulement, plaque le câble dans sa gorge et interdit ce saut. Il travaille peu mais souvent, à {ropeSpeed} de câble au plus, et le pas des gorges est son seul entraînement. Il sert aussi d’appui à un contact de mou de câble, qui dit à l’automate que la charge ne tire plus. Cet élément, modeste, évite le pire au câble : une spire montée sur sa voisine.',
      'When the weight rests on its buffer, the rope goes slack on the drum, and that is when a turn can jump from its groove. The rope guide, a ring in two half-shells that moves along with the winding, presses the rope into its groove and prevents that jump. It works little but often, at {ropeSpeed} of rope at most, and the pitch of the grooves is its only drive. It also carries a slack-rope contact, telling the controller that the load is no longer pulling. This modest part saves the rope from the worst: a turn riding up on its neighbour.',
    ),
    material: l(
      'Demi-coquilles de fonte ou de polymère, ressort de pression',
      'Cast-iron or polymer half-shells, a pressure spring',
    ),
    specs: [
      sp('Rôle', 'Role', l('tenir chaque spire dans sa gorge', 'hold each turn in its groove')),
      sp('Vitesse du câble', 'Rope speed', v('{ropeSpeed}')),
      sp('Pas des gorges', 'Groove pitch', v('{grooveMm}')),
      sp('Autre fonction', 'Other function', l('un contact de mou de câble', 'a slack-rope contact')),
    ],
    maintenance: maint(
      {
        failure:
          'Des coquilles usées par le frottement du câble, un ressort fatigué qui ne presse plus. Un guide bloqué par la graisse sale, qui finit par pincer le câble.',
        check:
          'Regardez-le pendant une course lente : il doit avancer d’un seul mouvement, sans à-coup. Mesurez l’usure des coquilles selon la notice, et testez le contact de mou en posant le poids.',
        care: 'Un guide se nettoie à chaque graissage du câble, ce qui évite un mélange de graisse et de poussière. Changez les coquilles en même temps que le câble, sinon elles marqueront le neuf.',
      },
      {
        failure:
          'Shells worn by the rope’s friction, a tired spring that no longer presses. A guide jammed by dirty grease, which ends up pinching the rope.',
        check:
          'Watch it during a slow stroke: it should move in one smooth motion, without jerks. Measure the shells’ wear as the manual says, and test the slack contact by setting the weight down.',
        care: 'Clean the guide at each rope greasing, which avoids a mix of grease and dust. Change the shells together with the rope, or they will mark the new one.',
      },
    ),
    tip: l(
      'Quand vous entendez un treuil faire « clac » au démarrage, cherchez ici : un câble qui a sauté de sa gorge ne se remet pas tout seul à sa place.',
      'When you hear a hoist go “clack” on starting, look here: a rope that has jumped its groove does not go back into place by itself.',
    ),
    design: l(
      'Le guide-câble ne garde aucune énergie et n’en rend aucune : il tient chaque spire dans sa gorge, et le câble dure. Bon exemple d’un détail qu’aucun bilan énergétique ne montre, et sans lequel la machine ne dure pas.',
      'The rope guide keeps no energy and gives none back: it holds each turn in its groove, and the rope lasts. A good example of a detail no energy balance shows, and without which the machine does not last.',
    ),
  },
  {
    id: 'rope-anchor',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Point fixe du câble', 'Rope anchor'),
    short: l(
      'Là où finit le câble : un point d’attache sur le châssis, qui porte tout un brin et ne doit jamais glisser.',
      'Where the rope ends: an attachment point on the frame, which carries a whole fall and must never slip.',
    ),
    description: lf(
      'Le câble part du tambour, passe deux fois dans la moufle et sur la poulie de renvoi, puis se termine ici. Ce point fixe reçoit le brin le moins chargé en montée, et le plus chargé en descente : environ {staticKn} dans les deux cas. Un manchon à coin le serre d’autant plus que le câble tire, si bien qu’il n’a besoin d’aucun ressort, ni d’aucun serrage de plus. C’est souvent là que l’on place le capteur de charge : la force y varie peu et le câble n’y bouge pas. L’autre bout, sur le tambour, ne tient que grâce aux tours gardés, qui prennent presque tout l’effort par frottement.',
      'The rope leaves the drum, passes twice through the hook block and over the return sheave, then ends here. This anchor takes the least loaded fall when climbing and the most loaded when coming down: about {staticKn} in both cases. A wedge socket grips all the harder as the rope pulls, so it needs no spring and no further tightening. This is often where the load sensor goes: the force varies little and the rope does not move. The other end, on the drum, holds only thanks to the turns kept there, which take almost all the force by friction.',
    ),
    material: l(
      'Manchon à coin d’acier moulé, axe, serre-câble de sécurité',
      'Cast-steel wedge socket, pin, safety clamp',
    ),
    specs: [
      sp('Effort', 'Force', lf('environ {staticKn}', 'about {staticKn}')),
      sp('Type', 'Type', l('manchon à coin, qui serre sous la traction', 'wedge socket, tightening under load')),
      sp(
        'Côté tambour',
        'Drum side',
        lf('{ropeOnDrum} de câble toujours enroulés', '{ropeOnDrum} of rope always wound'),
      ),
      sp(
        'Câble ici',
        'The rope here',
        l('immobile, donc pas de flexion en service', 'still, so no bending in service'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un câble qui glisse lentement dans le coin, et de la corrosion à l’entrée du manchon, là où l’eau descend le long du câble et reste. Une reprise après une pose brutale, qui fatigue les fils à la sortie du coin.',
        check:
          'Un trait de peinture sur le câble à la sortie du manchon : s’il s’éloigne, il a glissé. Regardez les fils à l’entrée à la lampe, c’est l’endroit où l’inspection du câble se termine toujours.',
        care: 'Graissez l’entrée, refaites le trait de peinture à chaque visite, et refaites le manchon à chaque câble neuf, avec la longueur libre prévue par la notice.',
      },
      {
        failure:
          'A rope slipping slowly in the wedge, and corrosion at the socket’s entry, where water runs down the rope and stays. A restart after a hard set-down, tiring the wires where they leave the wedge.',
        check:
          'A paint line on the rope at the socket’s exit: if it moves away, the rope has slipped. Look at the wires at the entry by torch, the spot where every rope inspection ends.',
        care: 'Grease the entry, redo the paint line at each visit, and remake the socket with each new rope, with the free length the manual asks for.',
      },
    ),
    tip: l(
      'Le trait de peinture est la plus ancienne astuce du levage : un instrument qui ne tombe jamais en panne, et que tout le monde sait lire depuis le palier.',
      'The paint line is the oldest trick in lifting: an instrument that never fails, which anyone can read from the landing.',
    ),
    design: l(
      'Un coin plutôt que des serre-câbles : la traction elle-même assure le serrage. Le bon choix, dans cette machine, est toujours celui qui reste sûr quand personne ne regarde, et que le simple poids fait travailler.',
      'A wedge rather than clamps: the pull itself does the tightening. The right choice on this machine is always the one that stays safe when nobody is looking, and that the weight alone keeps working.',
    ),
  },
  {
    id: 'return-sheave',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Poulie de renvoi', 'Return sheave'),
    short: l(
      'Le demi-tour du câble en haut du montage : elle crée deux brins de plus, et une flexion de plus à payer.',
      'The rope’s U-turn at the top of the arrangement: it makes two more falls, and one more bend to pay for.',
    ),
    description: lf(
      'Pour faire quatre brins à partir d’un seul câble, il faut au moins une poulie fixe. Le câble y arrive, repart vers la moufle, puis finit au point fixe. Elle coûte peu en énergie, une part des {upReevingW} que perdent les poulies en montée, soit {sheaveEta} chacune selon l’hypothèse du lab, mais elle plie le câble une fois de plus sur toute la longueur qui la traverse. D’où son diamètre, qui doit tenir une règle publiée de 18 fois le câble au moins, soit {sheaveM}. Le diamètre réel du treuil de référence n’est pas publié. Une poulie trop petite ne se voit pas tout de suite, elle se voit à la durée de vie du câble.',
      'To make four falls out of one rope you need at least one fixed sheave. The rope arrives, leaves for the hook block, then ends at the anchor. It costs little energy, a share of the {upReevingW} the sheaves lose when climbing, {sheaveEta} each on the lab’s assumption, but it bends the rope one more time over all the length that passes through it. Hence its diameter, which must meet a published rule of at least 18 times the rope, that is {sheaveM}. The reference hoist’s real diameter is not published. A sheave too small does not show at once, it shows in the life of the rope.',
    ),
    material: l(
      'Poulie d’acier ou de fonte usinée, roulements étanches, axe',
      'Machined steel or cast-iron sheave, sealed bearings, a pin',
    ),
    specs: [
      sp(
        'Diamètre, règle publiée',
        'Diameter, published rule',
        lf('au moins {sheaveM}, 18 fois le câble', 'at least {sheaveM}, 18 times the rope'),
      ),
      sp('Rendement', 'Efficiency', v('{sheaveEta}')),
      sp('Pertes des poulies, montée', 'Sheave losses, climbing', v('{upReevingW}')),
      sp('Pertes des poulies, descente', 'Sheave losses, coming down', v('{downReevingW}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un roulement qui fatigue, une gorge que le câble creuse avec le temps. Et toujours le même morceau de câble posé dessus quand le poids attend en haut ou en bas : c’est là qu’il se fatigue et qu’il rouille le plus vite.',
        check:
          'Poids posé et consigné : faites-la tourner à la main, et passez une jauge dans la gorge. Le morceau de câble qui reste à cet endroit quand le poids est en bas ou en haut mérite la lampe à chaque inspection.',
        care: 'Graissez selon la notice. Quand vous remplacez le câble, regardez la gorge : un câble neuf dans une gorge usée vieillit bien plus vite.',
      },
      {
        failure:
          'A tiring bearing, a groove the rope digs deeper over time. And always the same stretch of rope resting on it while the weight waits at the top or the bottom: that is where it tires and rusts fastest.',
        check:
          'With the weight down and locked out: turn it by hand, and try a gauge in the groove. The stretch of rope that sits here when the weight is at the top or the bottom deserves the torch at each inspection.',
        care: 'Grease as the manual says. When you replace the rope, look at the groove: a new rope in a worn groove ages far faster.',
      },
    ),
    tip: lf(
      'Suivez le câble dans la 3D : le tambour tire à {ropeSpeed}, tandis que le crochet monte à 4 m/min seulement. Chaque brin va à sa propre vitesse, du maximum côté tambour jusqu’à zéro au point fixe.',
      'Follow the rope in the 3D view: the drum pulls at {ropeSpeed}, while the hook climbs at only 4 m/min. Each fall runs at its own speed, from the fastest on the drum side down to nothing at the anchor.',
    ),
    video: ['10:19', '12:05'],
    design: l(
      'Dans une vidéo, une poulie du haut imprimée en plastique ne tient pas, et le bricoleur la remplace par une poulie de métal annoncée pour 160 kg. Il faut retenir ce geste : on commence par chercher la pièce la plus faible, et non la plus visible.',
      'In a video, a printed top pulley does not hold, and the builder replaces it with a metal pulley rated at 160 kg. That is the gesture to keep: start by looking for the weakest part, not the most visible one.',
    ),
  },
  {
    id: 'overload-cell',
    scene: 'hoist',
    category: 'electrical',
    name: l('Limiteur de charge', 'Overload cell'),
    short: lf(
      'Il pèse la charge sans arrêt et refuse de monter au-dessus de {overloadLoad} la charge nominale.',
      'It weighs the load all the time and refuses to climb above {overloadLoad} the rated load.',
    ),
    description: lf(
      'Une jauge de contrainte au point fixe, ou un axe dynamométrique, mesure la force dans un brin. L’automate en déduit la charge, et interdit de monter au-dessus de {overloadLoad} la charge nominale : le chiffre vient du modèle, qui refuse aussi un couple supérieur à {overloadTorque} le couple nominal. Sur cette machine, une surcharge ne peut guère venir d’un client étourdi : la charge ne change presque jamais. Elle viendrait plutôt d’un bloc ajouté, d’un rail coincé ou d’un coin de parachute à moitié engagé, ce qui rend ce capteur plus utile encore. Il signale aussi le contraire, un brin soudain léger, signe de mou de câble.',
      'A strain gauge at the anchor, or a load pin, measures the force in one fall. The controller works out the load and forbids climbing above {overloadLoad} the rated load: the figure comes from the model, which also refuses a torque above {overloadTorque} the rated torque. On this machine an overload can hardly come from a careless customer: the load almost never changes. It would rather come from a block added, a jammed rail or a safety wedge half engaged, which makes this sensor all the more useful. It also signals the opposite, a suddenly light fall, a sign of a slack rope.',
    ),
    material: l(
      'Axe dynamométrique en acier, jauges de contrainte, boîtier étanche',
      'Steel load pin, strain gauges, sealed casing',
    ),
    specs: [
      sp(
        'Refuse au-dessus de',
        'Refuses above',
        lf('{overloadLoad} la charge nominale', '{overloadLoad} the rated load'),
      ),
      sp(
        'Couple refusé au-dessus de',
        'Torque refused above',
        lf('{overloadTorque} le nominal', '{overloadTorque} rated'),
      ),
      sp('Force mesurée', 'Force measured', lf('environ {staticKn}, dans un brin', 'about {staticKn}, in one fall')),
      sp(
        'Autre signal',
        'Other signal',
        l('un brin soudain léger : mou de câble', 'a suddenly light fall: slack rope'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une dérive lente, qui fait lire trop bas. Un câble de capteur arraché, de l’humidité dans le boîtier, et un seuil relevé « pour que ça passe », le plus sérieux des trois.',
        check:
          'Comparez la valeur lue, poids connu en l’air et à l’arrêt, avec celle du carnet. Vérifiez à vide que le zéro n’a pas bougé. Un essai avec une charge connue, par un organisme qualifié, valide le tout.',
        care: 'Notez chaque masse ajoutée ou retirée dans le carnet : la lecture doit la suivre exactement. Protégez la connectique, et verrouillez le réglage du seuil.',
      },
      {
        failure:
          'A slow drift, making it read too low. A torn sensor cable, damp in the casing, and a limit raised “to make it go”, the most serious of the three.',
        check:
          'Compare the reading, with a known weight in the air and stopped, with the logbook’s. Check with no load that the zero has not moved. A test with a known load, by a qualified body, validates it all.',
        care: 'Note each mass added or removed in the logbook: the reading must follow it exactly. Protect the connections, and lock the limit’s setting.',
      },
    ),
    tip: l(
      'Dans la Simulation, passez à deux brins à pleine charge : le limiteur refuse, le poids ne bouge pas. Le lab préfère cette scène à un calcul : c’est ainsi qu’on comprend ce qu’il garde.',
      'In the Simulation, go down to two falls at full load: the overload cell refuses, and the weight does not move. The lab prefers that scene to a calculation: that is how you understand what it guards.',
    ),
    design: l(
      'Cette pièce lit une seule valeur, simple et utile, et pourtant elle en dit long : on connaît la masse réelle du stock à tout moment. Un stockage par gravité est honnête par construction : sa charge se pèse.',
      'This part reads one simple, useful value, and yet it says a lot: the real mass of the store is known at all times. A gravity store is honest by construction: its charge can be weighed.',
    ),
  },
  {
    id: 'limit-switch',
    scene: 'hoist',
    category: 'electrical',
    name: l('Fin de course', 'Limit switch'),
    short: l(
      'Il arrête le poids en haut et en bas de la course : deux niveaux, un pour le service, un dernier qui coupe tout.',
      'It stops the weight at the top and bottom of the stroke: two levels, one for service, a last one that cuts everything.',
    ),
    description: lf(
      'Le crochet ne doit jamais toucher le treuil, et le poids ne doit jamais tirer sur un câble déjà mou. Un fin de course à cames, entraîné par l’arbre du tambour, compte les tours et fixe la zone de marche, avec une pré-coupure qui ralentit le moteur puis une coupure d’arrêt. Un second contact, indépendant et mécanique, coupe en dernier recours si le premier a échoué. À 4 m/min, la rampe de {rampS} demande seulement {stopDistanceCm} pour s’arrêter. Dans une vidéo, le bricoleur fait mieux avec moins : un capteur infrarouge lit une marque de peinture noire sur son câble.',
      'The hook must never touch the hoist, and the weight must never pull on a rope already slack. A cam limit switch, driven by the drum’s shaft, counts turns and sets the working zone, with a pre-limit that slows the motor then a stop limit. A second contact, independent and mechanical, cuts as a last resort if the first has failed. At 4 m/min, the {rampS} ramp takes only {stopDistanceCm} to stop. In a video, the home builder does more with less: an infrared sensor reads a black paint mark on his rope.',
    ),
    material: l(
      'Boîtier à cames entraîné par le tambour, contacts à ouverture forcée, levier à fil pour l’ultime',
      'Cam box driven by the drum, positive-opening contacts, a lever or wire for the final one',
    ),
    specs: [
      sp('Niveaux', 'Levels', l('pré-coupure, coupure, ultime', 'pre-limit, stop, final')),
      sp('Distance d’arrêt à 4 m/min', 'Stopping distance at 4 m/min', v('{stopDistanceCm}')),
      sp(
        'Rampe',
        'Ramp',
        lf('{rampS}, et 1,5 s au minimum selon le constructeur', '{rampS}, and 1.5 s at least according to the maker'),
      ),
      sp('Approche minimale du crochet', 'Minimum hook approach', l('0,83 m', '0.83 m')),
    ],
    maintenance: maint(
      {
        failure:
          'Une came desserrée qui se décale doucement : la coupure arrive plus tard à chaque fois. Un câble qui s’allonge et trompe un comptage de tours. Un contact bloqué par le givre.',
        check:
          'Montez à basse vitesse vers chaque limite, en surveillant : la machine doit s’arrêter au repère. Essayez ensuite la coupure ultime seule, à très basse vitesse, en shuntant la première sous la surveillance d’une personne qualifiée.',
        care: 'Refaites ce réglage à chaque câble neuf, car un câble neuf s’allonge. Laissez une marge au sommet : ne jamais régler une limite pour gagner quelques centimètres de stockage.',
      },
      {
        failure:
          'A loose cam shifting slowly: the cut-off comes a little later each time. A rope stretching and fooling a count of turns. A contact frozen by frost.',
        check:
          'Climb at low speed towards each limit, watching: the machine must stop at the mark. Then try the final cut-off alone, at very low speed, with the first bridged under the eye of a qualified person.',
        care: 'Redo this setting with each new rope, because a new rope stretches. Leave a margin at the top: never set a limit to win a few centimetres of storage.',
      },
    ),
    tip: lf(
      'Quelques centimètres de course en plus ne valent pas la peine : à {metreWh} par mètre, gagner un décimètre rapporte {tenCmWh} au mieux. Une limite trop serrée coûte bien plus.',
      'A few more centimetres of stroke are not worth the bother: at {metreWh} a metre, winning a tenth of a metre brings {tenCmWh} at best. A limit set too tight costs far more.',
    ),
    video: ['09:14'],
    design: l(
      'Cette limite existe à deux niveaux parce qu’une erreur de comptage ne doit pas casser une machine de cette hauteur. L’astuce du bricoleur, une marque sur le câble, a le mérite de regarder la réalité : ce que dit le tambour n’est pas toujours ce que fait la charge.',
      'This limit exists on two levels because a counting error must not break a machine of this height. The builder’s trick, a mark on the rope, has the merit of looking at reality: what the drum says is not always what the load does.',
    ),
  },
  {
    id: 'overspeed-governor',
    scene: 'hoist',
    category: 'mechanical',
    name: l('Limiteur de vitesse', 'Overspeed governor'),
    short: lf(
      'Des masselottes qui s’écartent avec la vitesse et, au-delà de {governorMs}, tirent sur le parachute : tout mécanique, sans courant.',
      'Flyweights that spread with speed and, beyond {governorMs}, pull on the safety gear: all mechanical, needing no power.',
    ),
    description: lf(
      'Le codeur et le variateur ne voient que le moteur. Si un arbre casse après le réducteur, ils ne savent rien. Le limiteur ne dépend d’aucun d’eux : un petit câble indépendant, tendu le long de la course, entraîne une poulie à masselottes, qui s’écartent avec la vitesse. Au-delà de {governorMs}, soit {governorTimes} la vitesse de marche, elles bloquent la poulie : le petit câble s’arrête, tire la tringlerie du châssis, et les coins mordent {governorDelayMs} plus tard. Cette idée vient des ascenseurs, et la valeur du seuil est une hypothèse de ce lab : au-dessus de toute vitesse de service, avec une marge qu’un mécanisme tient bien.',
      'The encoder and the inverter see only the motor. If a shaft breaks after the gearbox, they know nothing. The governor depends on neither: a small independent rope, stretched along the stroke, drives a sheave with flyweights, which spread with the speed. Beyond {governorMs}, which is {governorTimes} the working speed, they lock the sheave: the small rope stops, pulls the carrier’s linkage, and the wedges bite {governorDelayMs} later. The idea comes from lifts, and the value of the limit is this lab’s assumption: above any working speed, with a margin a mechanism can hold.',
    ),
    material: l(
      'Poulie à masselottes, ressorts, petit câble d’acier, poulie tendeuse en bas',
      'Flyweight sheave, springs, a thin steel rope, a tension sheave below',
    ),
    specs: [
      sp('Seuil', 'Limit', v('{governorMs}')),
      sp('Rapport à la vitesse de marche', 'Compared with working speed', v('{governorTimes}')),
      sp('Temps jusqu’à la morsure', 'Time to the bite', v('{governorDelayMs}')),
      sp('Alimentation', 'Supply', l('aucune : tout mécanique', 'none: all mechanical')),
    ],
    maintenance: maint(
      {
        failure:
          'Un petit câble détendu, qui ne fait plus tourner la poulie : le limiteur ne verrait rien. Des masselottes grippées par une graisse séchée, et une poulie tendeuse oubliée en bas de tour.',
        check:
          'Un déclenchement simulé à la main, sur la poulie, machine à faible vitesse, sous l’œil d’un organisme qualifié : les coins doivent bouger. Mesurez la vitesse de déclenchement selon la méthode du fabricant.',
        care: 'Gardez le petit câble tendu et sec, nettoyez la poulie, et plombez le réglage du seuil : personne ne doit y toucher entre deux visites.',
      },
      {
        failure:
          'A slack thin rope that no longer turns the sheave: the governor would see nothing. Flyweights seized by dried grease, and a tension sheave forgotten at the bottom of the tower.',
        check:
          'A trip simulated by hand on the sheave, the machine at low speed, under the eye of a qualified body: the wedges must move. Measure the tripping speed by the maker’s method.',
        care: 'Keep the thin rope taut and dry, clean the sheave, and seal the limit’s setting: nobody should touch it between visits.',
      },
    ),
    tip: lf(
      'Vous pouvez le voir à l’œuvre dans le scénario « Survitesse » : à vitesse réduite, le temps d’aller de {governorMs} à {fallPeak} se lit très bien.',
      'You can see it at work in the “Overspeed” scenario: slowed down, the time it takes to go from {governorMs} to {fallPeak} reads very well.',
    ),
    design: l(
      'Une sécurité ne doit pas partager ses pannes avec ce qu’elle surveille : pas de courant, pas de calculateur, pas de lien avec le câble principal. Ce principe est plus ancien que l’électricité, et il tient toujours.',
      'A safety device must not share its failures with what it watches: no current, no computer, no link with the main rope. This principle is older than electricity, and it still holds.',
    ),
  },
  {
    id: 'hoist-base',
    scene: 'hoist',
    category: 'structure',
    name: l('Châssis du treuil', 'Hoist base'),
    short: l(
      'Le bâti qui tient ensemble moteur, réducteur et tambour, posé sur le portique par quatre boulons M30.',
      'The frame that holds motor, gearbox and drum together, set on the head frame by four M30 bolts.',
    ),
    description: lf(
      'Tout le treuil tient sur ce bâti : 1 321 kg, un encombrement de 2,468 m le long du tambour, 1,94 m entre les pieds. Quatre boulons M30-8.8 dans des trous de Ø34 l’attachent au portique. Le bâti garde l’alignement des arbres, et sa rigidité décide de la durée de vie des dents et des roulements. Le catalogue range ce treuil dans le groupe M5, qui suppose un temps de marche limité, environ 2,33 h par jour dans un exemple publié. Deux courses par jour ne font que dix minutes : cette limite n’est pas celle qui compte, même si un treuil n’est pas vendu pour ce service, et sa durée de vie à ce rythme n’est pas modélisée.',
      'The whole hoist stands on this frame: 1,321 kg, 2.468 m long along the drum, 1.94 m between the feet. Four M30-8.8 bolts in Ø34 holes tie it to the head frame. The frame keeps the shafts aligned, and its stiffness decides the life of the teeth and the bearings. The catalogue puts this hoist in group M5, which assumes a limited running time, about 2.33 h a day in a published example. Two strokes a day come to only ten minutes: that limit is not the one that counts, even if a hoist is not sold for this duty, and its life at this rhythm is not modelled.',
    ),
    material: l(
      'Bâti en acier soudé, boulons M30-8.8, cales de réglage',
      'Welded steel frame, M30-8.8 bolts, adjusting shims',
    ),
    specs: [
      sp('Masse du treuil', 'Hoist mass', l('1 321 kg', '1,321 kg')),
      sp('Fixation', 'Fixing', l('4 × M30-8.8, trous de Ø34', '4 × M30-8.8, Ø34 holes')),
      sp('Longueur le long du tambour', 'Length along the drum', l('2,468 m', '2.468 m')),
      sp('Entre les pieds', 'Between the feet', l('1,94 m', '1.94 m')),
      sp('Longueur et largeur du châssis', 'Frame length and width', l('1,314 m, 0,924 m', '1.314 m, 0.924 m')),
      sp('Groupe', 'Group', l('M5', 'M5')),
    ],
    maintenance: maint(
      {
        failure:
          'Un boulon d’ancrage qui se desserre sous les à-coups, et un pied mal calé qui tord le bâti au serrage, ce que le réducteur paye aussitôt. Une corrosion sous le bâti, à l’endroit où l’eau reste prisonnière.',
        check:
          'Une marque de peinture sur chaque écrou. Une mesure de planéité au montage, et une mesure de jeu aux pieds : s’il y a un jeu au repos, le bâti est en train de se déformer.',
        care: 'Serrez au couple prévu par le fabricant, en croix, sur un portique contrôlé. Reprenez le serrage après la première saison, puis à chaque inspection.',
      },
      {
        failure:
          'A base bolt working loose under repeated jolts, and a poorly shimmed foot twisting the frame on tightening, which the gearbox pays for at once. Corrosion under the frame, where water stays trapped.',
        check:
          'A paint mark on each nut. A flatness check at mounting, and a check for play at the feet: any play at rest means the frame is being distorted.',
        care: 'Tighten to the maker’s torque, in a cross pattern, on a checked head frame. Retighten after the first season, then at each inspection.',
      },
    ),
    tip: l(
      'Le pied le plus important est celui qu’on ne regarde pas : un seul pied qui ne porte pas, et le bâti se tord dès qu’on serre les quatre boulons. On cale d’abord, on serre ensuite.',
      'The most important foot is the one no one looks at: one foot not bearing, and the frame twists as soon as all four bolts are tightened. Shim first, tighten afterwards.',
    ),
    design: l(
      'Ces cotes-là sont publiées, et le lab les reprend telles quelles. C’est là que passe la frontière entre un treuil vendu et une tour inventée : tout le reste, autour de ces quatre boulons, est à estimer.',
      'These dimensions are published, and the lab takes them as they are. This is where the border runs between a hoist on sale and an invented tower: everything else, around these four bolts, is to be estimated.',
    ),
  },
];
