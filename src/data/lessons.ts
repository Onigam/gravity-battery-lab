// The six lessons of the lab, in the order of research §4: 1 what a kilowatt-hour weighs, 2 where the energy goes, 3 power is not energy, 4 why the weight will not come down,
// 5 what holds 20 tonnes up, 6 who wins, and where. Each opens a world, a part and one of the simulation's ten scenarios, and names the others it needs by the name the
// panel gives them, so that all ten are reachable from a lesson (lessons.test.ts checks it).
//
// Shape: four paragraphs of at most 95 words, 15 questions in all, three choices of about the same length, a wrong choice for each misconception the text names. Every term is
// defined once, in bold, in the first lesson that needs it. Numbers: no mark, reported by a source; † arithmetic on reported figures; * the model or an estimate of ours, never a measurement.
// Real projects and companies are named in lesson 6 only, with their dates and no adjective: the sceptics' arithmetic is reported, not their words. The status of a company or a plant ages, so
// each one carries its date.
import type { Lesson, Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf, v } from './part-helpers';

const chip = (fr: string, en: string, value: L | string): Spec => ({ label: l(fr, en), value });

export const LESSONS: Lesson[] = [
  // ------------------------------------------------------------------------------------------------ 1
  {
    id: 'kilowatt-hour-weight',
    title: l('Ce que pèse un kilowattheure', 'What a kilowatt-hour weighs'),
    summary: lf(
      'Une tonne, {kwhHeight} : c’est toute la physique, et c’est aussi tout le problème. Voyez combien de tours il faudrait pour votre nuit.',
      'One tonne, {kwhHeight}: that is all the physics, and all the problem too. See how many towers your night would take.',
    ),
    body: [
      lf(
        'Lever une masse lui donne de l’**énergie**, et la redescendre la rend : E = m · g · h, la masse fois la pesanteur (9,81) fois la hauteur. Le **kilowattheure** est l’unité des factures : 3,6 millions de joules, une bouilloire de {kettleKw} pendant {kettleMin}. Faites le calcul à l’envers : une tonne doit monter de {kwhHeight} pour le garder. C’est plus haut que la tour Eiffel.',
        'Raising a mass gives it **energy**, and bringing it down gives that back: E = m · g · h, mass times gravity (9.81) times height. The **kilowatt-hour** is the unit on bills: 3.6 million joules, a {kettleKw} kettle for {kettleMin}. Do the sum backwards: one tonne must rise {kwhHeight} to keep it. That is higher than the Eiffel Tower.',
      ),
      lf(
        'La tour de ce lab lève 20 t sur 20 m : {grossKwh}, sans aucune perte. Par kilo, cela fait {whPerKg}, quelle que soit la matière : à la tonne et à la même hauteur, le béton, le fer et l’eau gardent exactement la même chose. Un module de batterie de 40 kg atteint {lfpWhPerKg} : {densityRatio} fois plus. Tout ce lab découle de ce rapport.',
        'This lab’s tower lifts 20 t through 20 m: {grossKwh}, with no loss at all. Per kilo that is {whPerKg}, whatever the material: per tonne and at the same height, concrete, iron and water keep exactly the same thing. A 40 kg battery module reaches {lfpWhPerKg}: {densityRatio} times more. This whole lab follows from that ratio.',
      ),
      lf(
        'Le graphique des machines réelles, dans la Simulation, place la masse contre la hauteur, avec des lignes d’égale énergie. On y lit un sac de 12,5 kg levé de 1,8 m, un démonstrateur de 2 × 25 t sur 15 m, soit {leithMaxKwh} au plus, puis 25 millions de m³ d’eau à {nantHead}, soit 20 GWh. Même formule, de la lampe au lac : ce qui change, c’est seulement l’échelle.',
        'The chart of real machines, in the Simulation, sets mass against height, with lines of equal energy. It shows a 12.5 kg bag raised 1.8 m, a 2 × 25 t demonstrator over 15 m, {leithMaxKwh} at most, then 25 million m³ of water at {nantHead}, that is 20 GWh. The same formula, from the lamp to the lake: all that changes is the scale.',
      ),
      lf(
        'Personne ne publie la nuit d’un foyer, alors ce scénario la fait varier de {nightMin} à {nightMax}, une hypothèse. Sans aucune perte, il faudrait de {gross1T} à {gross7T}. Avec les pertes du modèle, en passant par une batterie, il en faut de {night1T} à {night7T} : de {night1Towers} à {night7Towers}, et {night7M3} de béton. Regardez la pile fantôme grandir sur la cour.',
        'Nobody publishes a household’s night, so this scenario moves it from {nightMin} to {nightMax}, an assumption. With no loss at all, it would take {gross1T} to {gross7T}. With the model’s losses, going through a battery, it takes {night1T} to {night7T}: {night1Towers} to {night7Towers}, and {night7M3} of concrete. Watch the ghost stack grow on the yard.',
      ),
    ],
    formula: 'E = m · g · h',
    figures: [
      chip(
        'Une tonne, un kilowattheure',
        'One tonne, one kilowatt-hour',
        lf('{kwhHeight} de haut', '{kwhHeight} high'),
      ),
      chip('20 t sur 20 m', '20 t over 20 m', v('{grossKwh}')),
      chip('Tours dans un module de 40 kg', 'Towers in a 40 kg module', v('{towersCount}')),
    ],
    focus: { scene: 'site', part: 'machine-tower', scenario: 'night' },
    quiz: [
      {
        q: lf(
          'Une tonne doit monter de {kwhHeight} pour garder un kilowattheure. Avec dix tonnes, jusqu’où faut-il monter ?',
          'One tonne must rise {kwhHeight} to keep a kilowatt-hour. With ten tonnes, how high must it go?',
        ),
        choices: [
          l('Aussi haut : l’énergie ne dépend que de la hauteur', 'As high: the energy depends only on the height'),
          l(
            'Dix fois moins haut : masse et hauteur se remplacent',
            'Ten times lower: mass and height stand in for each other',
          ),
          l('Dix fois plus haut : une charge lourde demande plus', 'Ten times higher: a heavy load asks for more'),
        ],
        answer: 1,
        explain: l(
          '**Dix fois moins haut.** E = m · g · h : seul compte le produit de la masse et de la hauteur. Sur le graphique des machines réelles, c’est ce que disent les lignes d’égale énergie.',
          '**Ten times lower.** E = m · g · h: only the product of mass and height counts. On the chart of real machines, that is what the lines of equal energy say.',
        ),
      },
      {
        q: l(
          'Une tonne de béton et une tonne d’eau sont levées à la même hauteur. Laquelle garde le plus d’énergie ?',
          'A tonne of concrete and a tonne of water are raised to the same height. Which keeps the most energy?',
        ),
        choices: [
          l('Le béton : il est bien plus dense que l’eau', 'The concrete: it is far denser than water'),
          l('L’eau : elle se pompe, donc elle se récupère mieux', 'The water: it can be pumped, so it returns better'),
          l('Aucune : à la tonne, elles gardent la même énergie', 'Neither: per tonne, they keep the same energy'),
        ],
        answer: 2,
        explain: l(
          '**La même.** La formule ne contient aucune matière, et c’est l’argument le plus juste des vidéos sceptiques. La densité change seulement la place qu’elle prend : elle ne change pas l’énergie.',
          '**The same.** The formula holds no material, and that is the fairest point of the sceptical videos. Density only changes how much room it takes: it does not change the energy.',
        ),
      },
      {
        q: lf(
          'Par kilo, un module de batterie garde {lfpWhPerKg}, et la tour {whPerKg}. Que dit cet écart ?',
          'Per kilo, a battery module keeps {lfpWhPerKg}, and the tower {whPerKg}. What does that gap say?',
        ),
        choices: [
          l(
            'Que la gravité est une erreur de physique, à écarter',
            'That gravity is a mistake in physics, to be dismissed',
          ),
          l(
            'Qu’il faut des milliers de fois plus de masse pour autant d’énergie',
            'That it takes thousands of times the mass for the same energy',
          ),
          l('Que le rendement de la tour est très mauvais', 'That the tower’s efficiency is very poor'),
        ],
        answer: 1,
        explain: lf(
          '**{densityRatio} fois plus de masse.** La physique est parfaitement honnête, et ce chiffre ne parle pas de pertes : il compte seulement ce que la hauteur peut garder. Le rendement, c’est la leçon suivante.',
          '**{densityRatio} times the mass.** The physics is perfectly honest, and this figure says nothing about losses: it only counts what height can keep. The efficiency is the next lesson.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 2
  {
    id: 'where-energy-goes',
    title: l('Où passe l’énergie', 'Where the energy goes'),
    summary: lf(
      'Sur le papier, {grossKwh}. Au compteur, {strokeOutWh} d’une descente, et {dayDirect} sur une vraie journée. Suivez chaque watt perdu.',
      'On paper, {grossKwh}. At the meter, {strokeOutWh} from a descent, and {dayDirect} over a real day. Follow each lost watt.',
    ),
    body: [
      lf(
        'Le **rendement** est ce qui reste de ce qui entre. Pour lever {grossKwh}, le modèle prend {strokeInKwh} au compteur : {upEta} à la montée. La descente rend {strokeOutWh} : {downEta}. L’**aller-retour** à pleine vitesse fait donc {roundTrip}, entre {roundTripLow} et {roundTripHigh} selon les hypothèses. Ce n’est pas une mesure : personne n’a mesuré une machine de cette taille, et ces chiffres sont ceux d’une chaîne d’hypothèses, chacune raisonnable.',
        '**Efficiency** is what is left of what goes in. To lift {grossKwh}, the model takes {strokeInKwh} at the meter: {upEta} on the way up. The descent gives {strokeOutWh}: {downEta}. The **round trip** at full speed is therefore {roundTrip}, between {roundTripLow} and {roundTripHigh} depending on the assumptions. It is no measurement: nobody has measured a machine of this size, and these figures come from a chain of assumptions, each reasonable.',
      ),
      lf(
        'Où partent les {hookTopKw} en descente ? Les engrenages prennent {downMeshW}, plus {downDragW} de traînée. Le cuivre du moteur {downCopperW}, le variateur {downInverterW}, les poulies {downReevingW}, l’alimentation {downSupplyW}, le fer {downIronW}, et le câble {downCableW}. Le ventilateur, les freins et le contrôle ajoutent {cutAuxW}. Aucune perte ne domine : c’est une petite machine, et chaque étage demande sa part. Il reste {meterDownKw}.',
        'Where do the {hookTopKw} go when coming down? The gears take {downMeshW}, plus {downDragW} of drag. The motor’s copper {downCopperW}, the inverter {downInverterW}, the sheaves {downReevingW}, the supply {downSupplyW}, the iron {downIronW}, and the cable {downCableW}. The fan, brakes and controls add {cutAuxW}. No loss dominates: it is a small machine, and each stage takes its share. {meterDownKw} is left.',
      ),
      lf(
        'Les autres annoncent mieux : de 80 à 90 %, selon les fabricants et les études, à de bien plus grandes échelles. Ce sont des annonces, ou des hypothèses. Un seul essai se rapproche d’une mesure, en 2020, sur un seul bloc : environ 75 %, rapporté par une encyclopédie, sans rapport publié. La même structure de pertes donne ici {smallSizeTrip} à 1,5 kW, {roundTrip} à 15 kW et {largeSizeTrip} vers 300 kW : l’écart vient aussi de la taille.',
        'Others claim better: 80 to 90%, according to makers and studies, at much larger scales. These are claims, or assumptions. Only one test comes close to a measurement, in 2020, on a single block: about 75%, reported by an encyclopaedia, with no published report. The same loss structure here gives {smallSizeTrip} at 1.5 kW, {roundTrip} at 15 kW and {largeSizeTrip} near 300 kW: the gap also comes from the size.',
      ),
      lf(
        'Reste la **veille** : {controlsW} qui ne dorment jamais, soit {controlsKwhDay} par jour, à peu près ce que garde le poids. Variateur prêt à répondre, c’est {readyW} : {readyKwhDay} par jour. Sur le scénario « Un jour de soleil », le modèle prend {dayInKwh} et rend {dayOutKwh} à la maison, soit {dayDirect}. Avec un module, {dayBuffer}. Ces {roundTrip} et ces {dayDirect} décrivent la même machine.',
        'Then there is **standby**: {controlsW} that never sleep, that is {controlsKwhDay} a day, about what the weight keeps. With the drive ready to answer, it is {readyW}: {readyKwhDay} a day. In the “A sunny day” scenario, the model takes {dayInKwh} and gives {dayOutKwh} to the house, that is {dayDirect}. With a module, {dayBuffer}. That {roundTrip} and that {dayDirect} describe the same machine.',
      ),
    ],
    formula: 'η = E_out / E_in',
    figures: [
      chip('Aller-retour à pleine vitesse', 'Round trip at full speed', v('{roundTrip}')),
      chip('Sur un vrai jour', 'Over a real day', v('{dayDirect}')),
      chip('Veille, par jour', 'Standby, per day', v('{controlsKwhDay}')),
    ],
    focus: { scene: 'power-room', part: 'energy-meter', scenario: 'sunny-day' },
    quiz: [
      {
        q: lf(
          'Le modèle donne {roundTrip} d’aller-retour à pleine vitesse, et {dayDirect} sur un vrai jour. Comment est-ce possible ?',
          'The model gives {roundTrip} round trip at full speed, and {dayDirect} over a real day. How can that be?',
        ),
        choices: [
          l(
            'La machine s’use dans la journée, et elle perd de sa force',
            'The machine wears during the day, and loses its strength',
          ),
          l(
            'La veille tourne jour et nuit, et la maison demande lentement',
            'The standby runs day and night, and the house asks slowly',
          ),
          l('Le second chiffre n’est pas fiable, c’est une erreur', 'The second figure is unreliable, it is a mistake'),
        ],
        answer: 1,
        explain: lf(
          '**La veille et la lenteur.** {controlsKwhDay} de veille par jour pèsent autant que le stock, et la maison, qui demande peu, fait travailler la machine à sa pire allure. Une journée est un autre bilan qu’une course.',
          '**Standby and slowness.** {controlsKwhDay} of standby a day weighs as much as the store, and the house, asking for little, works the machine at its worst pace. A day is another balance from a stroke.',
        ),
      },
      {
        q: l(
          'Des fabricants annoncent de 80 à 90 % pour des tours à blocs. Comment lire ce chiffre ?',
          'Makers claim 80 to 90% for block towers. How should that figure be read?',
        ),
        choices: [
          l('Comme une mesure : on peut s’y fier pour toute taille', 'As a measurement: it can be trusted at any size'),
          l(
            'Comme une erreur : la physique interdit d’aller si haut',
            'As a mistake: the physics forbids going that high',
          ),
          l(
            'Comme une annonce, pour d’autres tailles, sans essai publié',
            'As a claim, for other sizes, with no published test',
          ),
        ],
        answer: 2,
        explain: lf(
          '**Une annonce.** Elle peut être juste à grande échelle : la même structure de pertes donne déjà {largeSizeTrip} vers 300 kW. Mais la seule valeur proche d’une mesure, environ 75 %, vient d’un essai sans rapport d’origine, et ces machines ne sont pas de cette taille.',
          '**A claim.** It may be right at large scale: the same loss structure already gives {largeSizeTrip} near 300 kW. But the only value close to a measurement, about 75%, comes from a test with no original report, and those machines are not of this size.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 3
  {
    id: 'power-not-energy',
    title: l('La puissance n’est pas l’énergie', 'Power is not energy'),
    summary: lf(
      'Assez de puissance pour {kettles} bouilloires, pendant cinq minutes. Et rien sous {cutInKw} au crochet : {fridgeW} y coûtent {fridgeHookKw}.',
      'Enough power for {kettles} kettles, for five minutes. And nothing below {cutInKw} at the hook: {fridgeW} there costs {fridgeHookKw}.',
    ),
    body: [
      lf(
        'La **puissance** est un débit d’énergie : P = m · g · v, le poids fois sa vitesse. Dans le scénario « La bouilloire », le poids descend à 4 m/min : {hookTopKw} au crochet, {meterDownKw} au compteur, de quoi faire tourner {kettles} bouilloires de {kettleKw}. Pendant {strokeMin} : ensuite, il n’y a plus rien. Ici, l’énergie dépend du poids et de la hauteur, la puissance du moteur : c’est ce que la gravité offre de vraiment différent.',
        '**Power** is a flow of energy: P = m · g · v, the weight times its speed. In the “The kettle” scenario the weight comes down at 4 m/min: {hookTopKw} at the hook, {meterDownKw} at the meter, enough to run {kettles} kettles of {kettleKw}. For {strokeMin}: then there is nothing left. Here, energy depends on the weight and the height, power on the motor: that is what is truly different about gravity.',
      ),
      lf(
        'Baissez la vitesse. À 0,08 m/min, le crochet donne {hookLowW}, mais le compteur paie {slowestKw} pendant que le poids descend ! Le moteur doit tenir 20 t à toute vitesse : son couple, donc son courant, ne baisse pas. Au seuil, le cuivre prend {cutCopperW}, le variateur {cutInverterW}, le ventilateur, les freins et le contrôle {cutAuxW}, les engrenages et le câble de levage {cutGearsW}, le câble moteur {cutCableW}, l’alimentation {cutSupplyW}.',
        'Bring the speed down. At 0.08 m/min, the hook gives {hookLowW}, but the meter pays {slowestKw} while the weight comes down! The motor must hold 20 t at any speed: its torque, and so its current, does not fall. At the limit, the copper takes {cutCopperW}, the inverter {cutInverterW}, the fan, brakes and controls {cutAuxW}, the gears and hoist rope {cutGearsW}, the motor cable {cutCableW}, the supply {cutSupplyW}.',
      ),
      lf(
        'D’où le chiffre le plus dur de ce lab : **sous {cutInKw} au crochet, la machine ne rend rien**, et ce seuil va de {cutInLow} à {cutInHigh} selon les hypothèses. Un frigo de {fridgeW} peut être servi, mais à quel prix : {fridgeHookKw} au crochet, {fridgeEta} de rendement, et la course est finie en {fridgeMin} pour {fridgeWh}. Essayez « Le frigo, sans rien », et cherchez où le compteur passe par zéro.',
        'Hence the hardest figure in this lab: **below {cutInKw} at the hook, the machine gives nothing**, and that limit runs from {cutInLow} to {cutInHigh} depending on the assumptions. A {fridgeW} fridge can be served, but at what a price: {fridgeHookKw} at the hook, {fridgeEta} efficiency, and the stroke is over in {fridgeMin} for {fridgeWh}. Try “The fridge, on its own”, and look for where the meter crosses zero.',
      ),
      lf(
        'La parade s’appelle un **tampon**. Avec « Le frigo, avec batterie », le module suit le frigo, et la tour se vide d’un coup dans le module à la vitesse où elle perd moins : {burstMin} à {burstKw}. Il arrive {burstWh} au frigo au lieu de {fridgeWh}, soit {burstTimes} plus. Ce module garde pourtant {towersPerModule} à lui seul : cette solution dit aussi où se trouve le vrai stockage.',
        'The remedy is called a **buffer**. With “The fridge, with a battery”, the module follows the fridge, and the tower empties in one go into the module at the speed where it loses least: {burstMin} at {burstKw}. {burstWh} reach the fridge instead of {fridgeWh}, {burstTimes} more. Yet that module holds {towersPerModule} on its own: this answer also says where the real storage lies.',
      ),
    ],
    formula: 'P = m · g · v',
    figures: [
      chip('Pleine vitesse, au compteur', 'Full speed, at the meter', v('{meterDownKw}')),
      chip('Rien sous', 'Nothing below', v('{cutInKw}')),
      chip('Un frigo coûte', 'A fridge costs', lf('{fridgeHookKw} au crochet', '{fridgeHookKw} at the hook')),
    ],
    focus: { scene: 'hoist', part: 'hoist-motor', scenario: 'fridge-direct' },
    quiz: [
      {
        q: lf(
          'Le poids descend très lentement, à {hookLowW} au crochet. Que fait le compteur ?',
          'The weight comes down very slowly, at {hookLowW} at the hook. What does the meter do?',
        ),
        choices: [
          l(
            'Il rend un peu moins, en proportion de la vitesse',
            'It gives back a little less, in proportion to the speed',
          ),
          l('Il paie : les pertes dépassent ce que donne le crochet', 'It pays: the losses exceed what the hook gives'),
          l('Il ne bouge plus : la machine est à l’arrêt', 'It no longer moves: the machine is stopped'),
        ],
        answer: 1,
        explain: lf(
          '**Il paie {slowestKw}.** Le couple dépend du poids, pas de la vitesse : cuivre, variateur et câble ne baissent pas, et ces pertes dépassent de loin ce que donne le crochet.',
          '**It pays {slowestKw}.** The torque depends on the weight, not on the speed: copper, inverter and cable do not fall, and those losses are far above what the hook gives.',
        ),
      },
      {
        q: lf(
          'Peut-on servir directement un frigo de {fridgeW} avec cette tour ?',
          'Can this tower directly serve a {fridgeW} fridge?',
        ),
        choices: [
          l(
            'Oui, et sans difficulté : il suffit de descendre doucement',
            'Yes, with no trouble: just come down gently',
          ),
          l('Non : la physique interdit toute petite puissance', 'No: the physics forbids any small power'),
          lf(
            'Oui, à {fridgeEta} de rendement : il en coûte {fridgeHookKw} au crochet',
            'Yes, at {fridgeEta} efficiency: it costs {fridgeHookKw} at the hook',
          ),
        ],
        answer: 2,
        explain: lf(
          '**Oui, mais pour {fridgeWh} seulement.** Le poids doit descendre assez vite pour payer ses propres pertes, et la course est finie en {fridgeMin}. Ce n’est pas impossible : c’est ruineux.',
          '**Yes, but for only {fridgeWh}.** The weight must come down fast enough to pay for its own losses, and the stroke is over in {fridgeMin}. It is not impossible: it is ruinous.',
        ),
      },
      {
        q: l(
          'Pourquoi un petit module de batterie aide-t-il autant la tour ?',
          'Why does a small battery module help the tower so much?',
        ),
        choices: [
          l(
            'La tour descend d’un coup, à une allure qui perd moins',
            'The tower comes down in one go, at a pace that loses less',
          ),
          l(
            'Le module ajoute du poids dans la tour, donc de l’énergie',
            'The module adds weight to the tower, and so energy',
          ),
          l(
            'Le module supprime la veille et les pertes du moteur',
            'The module removes the standby and the motor’s losses',
          ),
        ],
        answer: 0,
        explain: lf(
          '**Une rafale plutôt qu’un filet.** Le module suit la maison, et la tour travaille à {burstEta} vers lui plutôt qu’à {fridgeEta} vers le frigo. Mais les pertes restent, et ce module garde déjà {towersPerModule}.',
          '**A burst rather than a trickle.** The module follows the house, and the tower works at {burstEta} into it rather than {fridgeEta} into the fridge. But the losses remain, and that module already holds {towersPerModule}.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 4
  {
    id: 'will-not-come-down',
    title: l('Pourquoi le poids ne descend pas', 'Why the weight will not come down'),
    summary: lf(
      'Un sac de 12 kg reste en l’air. Une tour de 20 t descend seule dès {lightestKg}, mais cesse de rapporter bien avant. Tout tient au rapport et aux frottements.',
      'A 12 kg bag stays in the air. A 20 t tower comes down alone from {lightestKg}, but stops paying long before. It all comes down to the ratio and the friction.',
    ),
    body: [
      lf(
        'Un **réducteur** échange la vitesse contre le **couple**, la force de rotation : avec un rapport i, le couple au moteur est divisé par i, et les tours sont multipliés par i. C’est parfait pour lever. Mais à la descente, le poids doit faire tourner tout cela à l’envers : son couple arrive au moteur divisé par i, alors que les frottements du moteur et des engrenages, eux, restent. Pour un grand rapport, le poids ne suffit plus.',
        'A **gearbox** trades speed for **torque**, the turning force: with a ratio i, the torque at the motor is divided by i, and the turns are multiplied by i. That is perfect for lifting. But coming down, the weight has to turn all that backwards: its torque reaches the motor divided by i, while the friction of the motor and the gears stays. With a large ratio, the weight is no longer enough.',
      ),
      lf(
        'Dans une vidéo, un bricoleur lève 12 kg à travers un réducteur de 1:27 : ça monte, et ça ne redescend pas. Le modèle du lab retrouve ce blocage, avec un frottement estimé : sous {diyLightestKg} avec un rouleau de {diyRollerCm}. Ajouter des étages l’aggrave ; un plus gros rouleau l’améliore. À sa charge finale de 46 kg, le modèle donne {diyWatts} et {diyRoundTrip} d’aller-retour : une simple vraisemblance, car ni la hauteur ni le rouleau ne sont connus.',
        'In a video, a home builder lifts 12 kg through a 1:27 gearbox: it goes up, and it does not come down. The lab’s model finds that stall, with an estimated friction: below {diyLightestKg} with a {diyRollerCm} roller. Adding stages makes it worse; a bigger roller makes it better. At his final 46 kg load, the model gives {diyWatts} and {diyRoundTrip} round trip: a mere plausibility, since neither the height nor the roller is known.',
      ),
      lf(
        'Sur la tour, c’est loin d’être le problème : le poids descend seul dès {lightestKg}, entre {lightestLow} et {lightestHigh} selon les hypothèses, et le châssis vide pèse déjà {carrierT}. Le vrai seuil est ailleurs : à pleine vitesse, la machine cesse de rapporter sous {stopsPayingT}. Dans le scénario « Trop léger », on retire des blocs : elle cesse d’abord de rapporter, puis ne descend plus d’elle-même, et il faut alors que le moteur la pousse.',
        'On the tower that is far from the problem: the weight comes down alone from {lightestKg}, between {lightestLow} and {lightestHigh} depending on the assumptions, and the empty carrier already weighs {carrierT}. The real limit lies elsewhere: at full speed, the machine stops paying below {stopsPayingT}. In the “Too light” scenario, blocks come off: first it stops paying, then it no longer comes down by itself, and the motor has to push it.',
      ),
      lf(
        'Tout dépend aussi de la nature des dents. Une vis sans fin à fort rapport se bloque d’elle-même, et ne rendrait rien. Des engrenages hélicoïdaux se laissent entraîner à l’envers presque aussi bien qu’à l’endroit : {meshEta} par étage, ici. Et un plus petit moteur ? Avec 5 kW et un plus grand rapport, le seuil descend à {smallMotorKw}, mais le poids monte à {smallMotorMpm} au lieu de 4 m/min, et l’aller-retour tombe à {smallMotorTrip}.',
        'It also depends on the kind of teeth. A worm gear of high ratio locks itself, and would give nothing back. Helical gears can be driven backwards almost as well as forwards: {meshEta} a stage, here. And a smaller motor? With 5 kW and a larger ratio, the limit falls to {smallMotorKw}, but the weight climbs at {smallMotorMpm} instead of 4 m/min, and the round trip falls to {smallMotorTrip}.',
      ),
    ],
    formula: 'T_m = T_d / (i · η)',
    figures: [
      chip('Rapport du réducteur', 'Gearbox ratio', v('{ratio}')),
      chip('Descend seul dès', 'Comes down alone from', v('{lightestKg}')),
      chip(
        'Cesse de rapporter sous',
        'Stops paying below',
        lf('{stopsPayingT}, à pleine vitesse', '{stopsPayingT}, at full speed'),
      ),
    ],
    focus: { scene: 'hoist', part: 'hoist-gearbox', scenario: 'too-light' },
    video: '06:46',
    quiz: [
      {
        q: l(
          'On double le rapport du réducteur, tout le reste égal. Qu’arrive-t-il au poids le plus léger qui descend seul ?',
          'The gearbox ratio is doubled, all else equal. What happens to the lightest weight that comes down alone?',
        ),
        choices: [
          l('Il augmente : le couple arrive plus faible au moteur', 'It rises: the torque reaches the motor weaker'),
          l('Il diminue : plus de rapport veut dire plus de force', 'It falls: more ratio means more force'),
          l(
            'Il ne change pas : le rapport ne touche que la vitesse',
            'It does not change: the ratio affects only the speed',
          ),
        ],
        answer: 0,
        explain: l(
          '**Il augmente.** Le rapport aide à monter, parce qu’il multiplie le couple du moteur. Dans l’autre sens, il divise celui du poids, et les frottements du moteur restent les mêmes. Voilà ce qu’a vécu le sac de la vidéo.',
          '**It rises.** The ratio helps going up, since it multiplies the motor’s torque. The other way, it divides the weight’s, and the motor’s friction stays the same. That is what the bag in the video went through.',
        ),
      },
      {
        q: l(
          'Sur la tour, on retire des blocs pendant la descente. Quelle limite arrive en premier ?',
          'On the tower, blocks come off during the descent. Which limit comes first?',
        ),
        choices: [
          l('Le poids ne descend plus de lui-même', 'The weight no longer comes down by itself'),
          l('Le câble se détend et saute de sa gorge', 'The rope goes slack and jumps its groove'),
          l('La machine cesse de rapporter de l’énergie', 'The machine stops paying back energy'),
        ],
        answer: 2,
        explain: lf(
          '**Elle cesse de rapporter**, sous {stopsPayingT} à pleine vitesse, bien avant de se bloquer vers {lightestKg}. Le châssis vide pèse {carrierT} : la machine n’atteint donc jamais le blocage en service.',
          '**It stops paying**, below {stopsPayingT} at full speed, long before it stalls near {lightestKg}. The empty carrier weighs {carrierT}: so the machine never reaches the stall in service.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 5
  {
    id: 'what-holds-twenty-tonnes',
    title: l('Ce qui tient 20 tonnes en l’air', 'What holds 20 tonnes up'),
    summary: lf(
      'Un câble, deux freins, un limiteur et un parachute : {fallCm} pour arrêter une chute. Chaque défense est là pour le jour où la précédente a lâché.',
      'A rope, two brakes, a governor and safety gear: {fallCm} to stop a fall. Each defence is there for the day the one before lets go.',
    ),
    body: [
      lf(
        'Le premier rempart est le **câble**. Il casse à 315 kN au moins, et chaque brin porte {staticKn} : c’est un **coefficient** de {ropeFactorStatic}, {ropeFactor} avec les frottements, là où le fabricant demande au moins 5. Il ne casse presque jamais d’un coup : il meurt de ses flexions, fil après fil, sur les poulies. On le retire donc au critère de dépose, selon une norme publiée, et non quand il lâche.',
        'The first line of defence is the **rope**. It breaks at 315 kN at least, and each fall carries {staticKn}: a **factor** of {ropeFactorStatic}, {ropeFactor} with friction, where the maker asks for at least 5. It hardly ever breaks all at once: it dies of its bends, wire by wire, on the sheaves. So it comes off at the discard criterion, by a published standard, and not when it lets go.',
      ),
      lf(
        'Vient ensuite le **frein à ressorts** : l’électricité le desserre, et sans courant il se ferme. Il y en a deux, l’un sur le moteur, l’autre côté charge sur le tambour, pour qu’un arbre cassé ne lâche pas tout. Le scénario « Coupure de courant » le montre : le réseau tombe, le bus monte à {chopperV}, la résistance prend {dumpedWh} sur la rampe, et les freins se ferment. Le bus, lui, reste chargé bien après.',
        'Then comes the **spring brake**: electricity releases it, and with no current it closes. There are two, one on the motor, the other on the load side at the drum, so that a broken shaft does not let everything go. The “Power cut” scenario shows it: the grid goes, the link climbs to {chopperV}, the resistor takes {dumpedWh} over the ramp, and the brakes close. The link stays charged long afterwards.',
      ),
      lf(
        'Si un arbre casse, le **limiteur de vitesse**, entièrement mécanique, se bloque au-delà de {governorMs}, et {governorDelayMs} plus tard les coins du **parachute** mordent les rails. Selon le modèle, la charge atteint {fallPeak} et s’arrête en {fallCm}. Sans lui, elle arrive à {impactMs} à la butée avec {grossMj} d’énergie. Dans une vidéo, un couvercle mal vissé fait tomber un sac de pierres, qui fend le béton : rien ne l’arrêtait.',
        'If a shaft breaks, the **overspeed governor**, entirely mechanical, locks beyond {governorMs}, and {governorDelayMs} later the wedges of the **safety gear** bite the rails. By the model, the load reaches {fallPeak} and stops within {fallCm}. Without it, it reaches the buffer at {impactMs} with {grossMj} of energy. In a video, a badly screwed cover brings down a bag of rocks, which cracks the concrete: nothing was there to stop it.',
      ),
      lf(
        'Reste le **vent**. Une charge qui pend se balance, l’objection la plus connue contre les tours à grues. Ici, les rails la tiennent : juste sous le seuil de {windStop}, le vent n’ajoute que {windFriction} aux frottements des guides. Le scénario « Le vent se lève » montre que la machine s’arrête quand même, pour la tour et pour ceux qui y montent, et ne repart que {windBand} plus bas. La tour elle-même n’est pas calculée : le modèle s’arrête là.',
        'That leaves the **wind**. A hanging load swings, the best-known objection to crane towers. Here the rails hold it: just under the {windStop} limit, the wind adds only {windFriction} to the friction of the guides. The “The wind gets up” scenario shows the machine stopping all the same, for the tower and those who climb it, and restarting only {windBand} lower. The tower itself is not calculated: the model stops there.',
      ),
    ],
    formula: 'k = F_min / T',
    figures: [
      chip('Coefficient du câble', 'Rope factor', v('{ropeFactorStatic}')),
      chip('Le limiteur déclenche à', 'The governor trips at', v('{governorMs}')),
      chip('Hauteur perdue', 'Height lost', v('{fallCm}')),
    ],
    focus: { scene: 'tower', part: 'safety-gear', scenario: 'overspeed' },
    video: '18:58',
    quiz: [
      {
        q: l(
          'Pourquoi les freins de ce treuil sont-ils serrés par des ressorts, et desserrés par l’électricité ?',
          'Why are this hoist’s brakes applied by springs, and released by electricity?',
        ),
        choices: [
          l('Pour économiser l’électricité pendant la montée', 'To save electricity during the climb'),
          l('Pour qu’une coupure de courant les ferme d’elle-même', 'So that a power cut closes them by itself'),
          l('Pour que le moteur démarre plus doucement', 'So that the motor starts more gently'),
        ],
        answer: 1,
        explain: lf(
          '**Une coupure les ferme.** Ils coûtent même de l’énergie : {brakesW} tant que le poids bouge. C’est le prix d’un choix simple : ce qui doit se passer quand tout s’arrête doit arriver sans courant et sans logiciel.',
          '**A power cut closes them.** They even cost energy: {brakesW} for as long as the weight moves. That is the price of a simple choice: what must happen when everything stops must happen with no current and no software.',
        ),
      },
      {
        q: l(
          'Pourquoi le limiteur de vitesse a-t-il son propre petit câble, et n’utilise-t-il pas le codeur du moteur ?',
          'Why does the governor have its own thin rope, instead of using the motor’s encoder?',
        ),
        choices: [
          l('Parce qu’un codeur coûte trop cher pour ce service', 'Because an encoder costs too much for this duty'),
          l('Parce que le codeur est trop lent pour une chute', 'Because the encoder is too slow for a fall'),
          l(
            'Parce que le codeur ne voit pas ce qui casse après le réducteur',
            'Because the encoder cannot see what breaks after the gearbox',
          ),
        ],
        answer: 2,
        explain: l(
          '**Le codeur compte les tours du moteur.** Si un arbre casse plus loin, il indique une vitesse normale pendant que la charge tombe. Une sécurité ne doit pas partager ses pannes avec ce qu’elle surveille.',
          '**The encoder counts the motor’s turns.** If a shaft breaks further along, it shows a normal speed while the load falls. A safety device must not share its failures with what it is watching.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 6
  {
    id: 'who-wins-where',
    title: l('Qui gagne, et où', 'Who wins, and where'),
    summary: l(
      'La tour, le puits, la batterie et le lac, côte à côte. Ce que les sceptiques ont vu juste, ce que disent les projets réels à leur date, et l’intérêt honnête de la gravité.',
      'The tower, the shaft, the battery and the lake, side by side. What the sceptics got right, what real projects say as of their date, and the honest case for gravity.',
    ),
    body: [
      lf(
        'À 1 kW, dans le scénario « La course », la tour tient {raceTowerMin}, un module {raceModuleH}, et la même masse d’eau, en haut d’une chute alpine de {nantHead}, {raceWaterH}. Le module coûte {lfpEuroPerKwh} au prix public ; la tour, de {costKwhLow} à {costKwhHigh}, un ordre de grandeur que personne ne publie. À l’échelle d’une ferme, **la batterie gagne**, et de loin. Sur le carbone aussi, {co2LfpLow} à {co2LfpHigh} contre {co2TowerLow} à {co2TowerHigh}, sauf avec des blocs de rebut.',
        'At 1 kW, in the “The race” scenario, the tower lasts {raceTowerMin}, one module {raceModuleH}, and the same mass of water, up an Alpine head of {nantHead}, {raceWaterH}. The module costs {lfpEuroPerKwh} at retail; the tower, {costKwhLow} to {costKwhHigh}, an order of magnitude nobody publishes. At the scale of a farm, **the battery wins**, by a long way. On carbon too, {co2LfpLow} to {co2LfpHigh} against {co2TowerLow} to {co2TowerHigh}, unless the blocks are reject.',
      ),
      lf(
        'Des vidéos sceptiques, très vues en 2021 et 2022, visaient les tours à grues d’Energy Vault. Leur meilleur argument est juste : à la tonne, l’eau et le béton gardent la même énergie, et un lac en a bien plus. Le vent et le CO₂ du béton sont de vraies questions. Mais elles devinaient masses et hauteurs, l’une sous-estimait un bloc d’un facteur proche de sept, et toutes ont précédé Rudong. Rails et blocs de rebut changent aussi une partie de la réponse.',
        'Sceptical videos, much watched in 2021 and 2022, took aim at Energy Vault’s crane towers. Their best point is right: per tonne, water and concrete keep the same energy, and a lake has far more. The wind and the concrete’s CO₂ are real questions. But they guessed masses and heights, one underrated a block by a factor close to seven, and all came before Rudong. Rails or reject blocks also change part of the answer.',
      ),
      lf(
        'Les faits, à leur date. Gravitricity a levé 2 × 25 t sur 15 m à Édimbourg en 2021, 250 kW en moins d’une seconde, pour 1 M£. Le démonstrateur a été démonté en juillet 2021, et la société est en liquidation depuis le 1er octobre 2025. Le bloc d’essai d’Energy Vault, en décembre 2020, a donné environ 75 %. Sa tour de Rudong, 25 MW et 100 MWh, raccordée fin 2023, attendait ses autorisations en mars 2026, quand une source secondaire ne comptait aucune installation commerciale.',
        'The facts, as of their date. Gravitricity lifted 2 × 25 t over 15 m in Edinburgh in 2021, 250 kW in under a second, for £1 M; the demonstrator was taken down in July 2021, and the company has been in liquidation since 1 October 2025. Energy Vault’s test block, in December 2020, gave about 75%. Its Rudong tower, 25 MW and 100 MWh, connected in late 2023, was still awaiting its approvals in March 2026, when a secondary source counted no plant in commercial operation.',
      ),
      lf(
        'L’intérêt honnête de la gravité est ailleurs : une puissance indépendante de l’énergie, aucune usure chimique, une masse qui peut être n’importe quoi de lourd. Et la hauteur change tout : en fer à 80 $/t, la masse coûte {massCost100} à 100 m, {massCost2000} à 2 000 m. Un puits déjà creusé a donc du sens, mais ils sont rares : 340 utiles sur 3 234 dans les Midlands anglaises, 0,804 GWh en tout, {midlandsShare} de Nant de Drance. En Australie, Green Gravity vise 150 kW à 400 m, sans date confirmée.',
        'The honest case for gravity lies elsewhere: power that does not depend on the energy, no chemical wear, a mass that can be anything heavy. And height changes everything: in iron at $80/t, the mass costs {massCost100} at 100 m, and {massCost2000} at 2,000 m. So a shaft already dug makes sense, but there are few: 340 useful ones out of 3,234 in the English Midlands, 0.804 GWh in all, {midlandsShare} of Nant de Drance. In Australia, Green Gravity aims at 150 kW over 400 m, start unconfirmed.',
      ),
    ],
    formula: 'E = m · g · h',
    figures: [
      chip('Tours dans un seul module', 'Towers in one module', v('{towersCount}')),
      chip('Le module, au kilowattheure', 'The module, per kilowatt-hour', v('{lfpEuroPerKwh}')),
      chip('La masse à 2 000 m', 'The mass at 2,000 m', v('{massCost2000}')),
    ],
    focus: { scene: 'power-room', part: 'lfp-module', scenario: 'race' },
    quiz: [
      {
        q: l(
          'Sur une ferme plate, pour passer la nuit d’une maison, quel choix le lab défend-il ?',
          'On a flat farm, to get a house through the night, which choice does the lab defend?',
        ),
        choices: [
          l('Une tour de blocs, car elle ne s’use pas', 'A block tower, because it does not wear'),
          l(
            'Une batterie : à cette échelle, elle gagne, et de loin',
            'A battery: at this scale, it wins, by a long way',
          ),
          l('Un lac de montagne, partagé entre plusieurs fermes', 'A mountain lake, shared between several farms'),
        ],
        answer: 1,
        explain: lf(
          '**La batterie.** Un module de 40 kg garde {towersPerModule}, avec {lfpRoundTrip} d’aller-retour par son onduleur. La tour n’a pas de chimie à user, mais une seule nuit de {nightMax} demanderait {night7Towers}.',
          '**The battery.** A 40 kg module holds {towersPerModule}, with {lfpRoundTrip} round trip through its inverter. The tower has no chemistry to wear out, but one {nightMax} night would take {night7Towers}.',
        ),
      },
      {
        q: l('Qu’est-ce que les vidéos sceptiques ont vu juste ?', 'What did the sceptical videos get right?'),
        choices: [
          l(
            'Qu’aucune installation de ce type ne sera jamais raccordée',
            'That no plant of this kind will ever be connected',
          ),
          l('Que la gravité viole la conservation de l’énergie', 'That gravity breaks the conservation of energy'),
          l(
            'Qu’à la tonne, l’eau et le béton gardent la même énergie',
            'That per tonne, water and concrete keep the same energy',
          ),
        ],
        answer: 2,
        explain: l(
          '**La même énergie à la tonne**, et donc l’avantage d’un lac. Mais une tour a bien été raccordée à Rudong, fin 2023, et la physique reste parfaitement honnête : le débat porte sur les échelles et les coûts.',
          '**The same energy per tonne**, and so a lake’s advantage. But a tower was indeed connected at Rudong, in late 2023, and the physics stays perfectly honest: the debate is about scales and costs.',
        ),
      },
      {
        q: lf(
          'À 100 m, la masse coûte {massCost100} ; à 2 000 m, {massCost2000}. Qu’en conclure ?',
          'At 100 m, the mass costs {massCost100}; at 2,000 m, {massCost2000}. What follows?',
        ),
        choices: [
          l('Que la hauteur compte bien plus que la matière', 'That height counts far more than the material'),
          l('Que le fer coûte moins cher en profondeur', 'That iron costs less at depth'),
          l('Qu’un puits profond n’a besoin d’aucune machine', 'That a deep shaft needs no machine at all'),
        ],
        answer: 0,
        explain: l(
          '**La hauteur.** Vingt fois plus haut, c’est vingt fois moins de masse pour la même énergie. Ces coûts ne comptent que la masse, et ils supposent le puits gratuit : c’est bien pourquoi un puits déjà creusé est le meilleur cas de la gravité.',
          '**The height.** Twenty times higher means a twentieth of the mass for the same energy. These costs count only the mass, and assume the shaft is free: that is exactly why a shaft already dug is gravity’s best case.',
        ),
      },
    ],
  },
];
