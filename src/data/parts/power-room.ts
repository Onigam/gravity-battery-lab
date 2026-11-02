// Parts of the `power-room` world (14 of them, ids of docs/research.md §4): where the current goes, in the order it flows. Conventions: see ./site.ts.
// The reference hoist's published control has a brake chopper and an external resistor, NOT a regenerative supply: `regen-supply` is the lab's addition,
// and its sheet says so. Every efficiency and standby here is the model's (src/sim/machine.ts): nobody has measured a machine of this size.
// The module is a real published one (named in the Sources only), and the lab says plainly that it wins at this scale.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const POWER_ROOM_PARTS: PartInfo[] = [
  {
    id: 'pv-inverter',
    scene: 'power-room',
    category: 'electrical',
    name: l('Onduleur solaire', 'Solar inverter'),
    short: l(
      'Il change le continu du toit en alternatif pour la ferme : c’est par lui qu’entre toute l’énergie, avant de monter dans le poids.',
      'It turns the roof’s direct current into alternating current for the farm: all the energy comes in through it, before going up into the weight.',
    ),
    description: lf(
      'Un toit donne du continu, une ferme vit en alternatif. L’onduleur solaire fait la conversion, en suivant le point où les modules donnent le plus, sur les {pvKwp} supposés ici. Il ne connaît pas la tour : il pousse sa puissance sur le tableau, et c’est la commande de la machine qui décide de s’en servir si le soleil dépasse ce que demande la maison. Comme tout onduleur raccordé au réseau, il s’arrête si le réseau disparaît : la tour ne peut donc pas monter pendant une coupure, même en plein soleil. C’est la première pièce dans l’ordre du courant, et la seule qui travaille tous les jours sans la tour.',
      'A roof gives direct current, a farm lives on alternating current. The solar inverter does the conversion, tracking the point where the modules give most, on the {pvKwp} assumed here. It does not know the tower: it pushes its power onto the panel, and the machine’s control decides to use it if the sun exceeds what the house asks for. Like any grid-tied inverter, it stops if the grid goes: so the tower cannot climb during a power cut, even in full sun. It is the first part in the order of the current, and the only one that works every day without the tower.',
    ),
    material: l(
      'Électronique de puissance, boîtier ventilé, sectionneur continu',
      'Power electronics, ventilated case, DC isolator',
    ),
    specs: [
      sp('Toit raccordé', 'Roof connected', v('{pvKwp}')),
      sp('Sortie', 'Output', l('400 V triphasé', '400 V three-phase')),
      sp('Sans réseau', 'With no grid', l('il s’arrête', 'it stops')),
      sp('Où va son surplus', 'Where its surplus goes', l('la batterie, puis la tour', 'the battery, then the tower')),
    ],
    maintenance: maint(
      {
        failure:
          'Un ventilateur en fin de vie, un défaut d’isolement sur une chaîne de modules, et un sectionneur continu qui chauffe parce qu’il a pris du jeu. Un parafoudre usé après un orage, sans autre signe.',
        check:
          'Lisez son journal : les coupures et les défauts y sont. Comparez sa production d’un jour clair à celle du même mois de l’année passée. Sa surface doit rester tiède, jamais brûlante.',
        care: 'Dépoussiérez les entrées d’air, gardez la place libre devant et au-dessus, et faites vérifier les parafoudres après chaque orage proche.',
      },
      {
        failure:
          'A fan near the end of its life, an insulation fault on a module string, and a DC isolator running hot from a loose contact. A surge arrester used up after a storm, with no other sign.',
        check:
          'Read its log: cut-outs and faults are there. Compare a clear day’s output with the same month last year. Its surface should stay warm, never scalding.',
        care: 'Dust the air inlets, keep the space in front of it and above it clear, and have the surge arresters checked after each nearby storm.',
      },
    ),
    tip: lf(
      'Le modèle fait passer le surplus d’abord par la batterie, puis par la tour. Pourquoi cet ordre ? Parce que {lfpRoundTrip} valent mieux que {roundTrip}.',
      'The model sends the surplus first to the battery, then to the tower. Why that order? Because {lfpRoundTrip} is better than {roundTrip}.',
    ),
    design: l(
      'Le soleil, le réseau, la maison et la machine s’additionnent sur un même tableau. Cet appareil n’a rien de propre à la gravité : on le trouverait à l’identique avec une batterie seule, et c’est bien pour cela qu’il est là en premier.',
      'The sun, the grid, the house and the machine all add up on a single panel. This device has nothing specific to gravity: you would find the same one with a battery alone, and that is why it comes first.',
    ),
  },
  {
    id: 'energy-meter',
    scene: 'power-room',
    category: 'electrical',
    name: l('Compteur d’énergie', 'Energy meter'),
    short: l(
      'Il mesure ce qui entre et ce qui sort de la machine : sans lui, aucun rendement n’est plus qu’une promesse.',
      'It measures what goes into the machine and what comes out: without it, any efficiency is only a promise.',
    ),
    description: lf(
      'Il compte séparément les kilowattheures qui montent et ceux qui descendent. Une course complète à pleine vitesse prend {strokeInKwh} au compteur et en rend {strokeOutWh}, soit {roundTrip}, selon le modèle. Ce chiffre vient avec une plage, de {roundTripLow} à {roundTripHigh} selon les hypothèses. Sur une vraie journée, avec la veille et la maison qui demande peu, c’est bien pire : {dayInKwh} pris, {dayOutKwh} rendus, soit {dayDirect}. Des machines de ce genre annoncent souvent bien plus, de 80 à 90 %, à une tout autre échelle ; en réalité, un seul essai se rapproche d’une mesure, environ 75 %, et ce n’est pas un rapport publié. Aucun de ces chiffres n’a été relevé sur une machine comme celle-ci : ce compteur serait le premier.',
      'It counts the kilowatt-hours going up and those coming down separately. A full stroke at full speed takes {strokeInKwh} at the meter and gives back {strokeOutWh}, that is {roundTrip}, according to the model. That figure comes with a range, from {roundTripLow} to {roundTripHigh} depending on the assumptions. Over a real day, with the standby and a house asking for little, it is far worse: {dayInKwh} taken, {dayOutKwh} given back, that is {dayDirect}. Such machines often claim far more, 80 to 90%, at quite another scale; in reality only one test comes close to a measurement, about 75%, and it is not a published report. None of these figures has been read on a machine like this one: this meter would be the first.',
    ),
    material: l(
      'Compteur bidirectionnel triphasé, tores de courant',
      'Three-phase bidirectional meter, current transformers',
    ),
    specs: [
      sp('Une course, pris', 'One stroke, taken', v('{strokeInKwh}')),
      sp('Une course, rendu', 'One stroke, given back', v('{strokeOutWh}')),
      sp('Aller-retour à pleine vitesse', 'Round trip at full speed', v('{roundTrip}')),
      sp('Sur un jour, directement', 'Over a day, directly', v('{dayDirect}')),
      sp('Sur un jour, avec un module', 'Over a day, with a module', v('{dayBuffer}')),
      sp('Sur un jour, variateur prêt', 'Over a day, drive ready', v('{dayReady}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un tore monté à l’envers : le compteur compte, mais à l’envers sur une phase, sans rien signaler. Une horloge qui dérive, ce qui fausse les relevés par période. Un afficheur illisible en plein soleil.',
        check:
          'Branchez une charge connue et comparez. Vérifiez, en montée puis en descente, que les chiffres vont dans le bon sens sur les trois phases. Notez à la mise en service les lectures d’une course à vide, puis d’une course chargée.',
        care: 'Relevez-le le même jour chaque mois, et gardez les relevés avec le carnet. Un simple tableau en dit plus sur cette machine que n’importe quelle brochure.',
      },
      {
        failure:
          'A current transformer fitted backwards: the meter counts, but backwards on one phase, with no warning. A clock drifting, which skews period readings. A display unreadable in full sun.',
        check:
          'Connect a known load and compare. Check, going up then coming down, that the figures run the right way on all three phases. At commissioning, note the readings for an empty stroke, then a loaded stroke.',
        care: 'Read it the same day each month, and keep the readings with the logbook. A plain table says more about this machine than any brochure.',
      },
    ),
    tip: lf(
      'Regardez la Simulation : le compteur paie {slowestKw} tandis que le poids descend au plus lent, et il ne commence à rendre qu’au-dessus de {cutInKw} au crochet.',
      'Watch the Simulation: the meter pays {slowestKw} while the weight comes down at its slowest, and it starts to give back only above {cutInKw} at the hook.',
    ),
    design: lf(
      'Il rend une seule chose honnête : le rendement. Les {roundTrip} et les {dayDirect} décrivent la même machine, l’un à pleine vitesse, l’autre sur une vraie journée. Pour juger une machine, il faut savoir lequel des deux on vous donne.',
      'It makes one thing honest: the efficiency. The {roundTrip} and the {dayDirect} describe the same machine, one at full speed, the other over a real day. To judge a machine, you have to know which of the two you are being given.',
    ),
  },
  {
    id: 'ac-panel',
    scene: 'power-room',
    category: 'electrical',
    name: l('Tableau général', 'Main AC panel'),
    short: l(
      'L’endroit où se rencontrent le soleil, le réseau, la maison et la machine, chacun derrière sa protection.',
      'The place where the sun, the grid, the house and the machine meet, each behind its protection.',
    ),
    description: lf(
      'Ce tableau répartit tout : la ligne du réseau, celle de l’onduleur solaire, celle de la maison et celle du treuil, chacune avec son disjoncteur. Le courant y change de sens selon les heures, et c’est le seul endroit où cela ne pose aucun problème : un jeu de barres ne sait pas qui pousse. La ligne de la machine doit passer {meterUpKw} en montée, et elle a besoin d’une protection compatible avec un retour de puissance. Une seule règle de sécurité reste entière : quand on ouvre ce tableau, tout n’y est pas forcément coupé, car plusieurs sources l’alimentent.',
      'This panel shares out everything: the grid’s line, the solar inverter’s, the house’s and the hoist’s, each with its breaker. Here the current changes direction according to the hour, and it is the only place where that poses no problem: a busbar does not know who is pushing. The machine’s line must carry {meterUpKw} climbing, and it needs a protection suited to power flowing back. One safety rule stays whole: when you open this panel, not everything in it is necessarily off, since several sources feed it.',
    ),
    material: l(
      'Armoire d’acier, jeux de barres, disjoncteurs et différentiels',
      'Steel cabinet, busbars, breakers and residual-current devices',
    ),
    specs: [
      sp('Tension', 'Voltage', l('400 V triphasé', '400 V three-phase')),
      sp('Départs', 'Lines', l('réseau, soleil, maison, machine', 'grid, sun, house, machine')),
      sp('Ligne machine, en montée', 'Machine line, climbing', v('{meterUpKw}')),
      sp('Ligne machine, en descente', 'Machine line, coming down', v('{meterDownKw}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une borne desserrée qui chauffe, le plus fréquent des défauts. Un différentiel inadapté qui saute sous les courants hachés du variateur, et de la poussière ou un nid dans l’armoire.',
        check:
          'Sous charge, une caméra thermique montre une borne chaude sans rien ouvrir. Testez le bouton des différentiels selon leur notice. Vérifiez que chaque départ porte une étiquette qui dit vrai.',
        care: 'Serrage et dépoussiérage par un électricien qualifié, à intervalle régulier et hors tension. Toutes les sources se consignent avant : réseau, soleil et batterie.',
      },
      {
        failure:
          'A loose terminal running hot, the commonest fault. An unsuitable residual-current device tripping under the inverter’s chopped currents, and dust or a nest in the cabinet.',
        check:
          'Under load, a thermal camera shows a hot terminal without opening anything. Test the residual-current devices’ button as their manual says. Check that each line carries a label that tells the truth.',
        care: 'Tightening and dusting by a qualified electrician, at regular intervals and with the power off. All the sources are locked out first: grid, sun and battery.',
      },
    ),
    tip: l(
      'Essayez la Simulation en vue Flux : les couleurs changent de sens entre la montée et la descente. Tout se joue autour de ces barres.',
      'Try the Simulation with Flows on: the colours change direction between climbing and coming down. It all plays out around these busbars.',
    ),
    design: l(
      'Mettre tout sur une seule barre évite de se poser mille questions : qui consomme, qui produit, qui charge. Chacun pousse ou tire, et le réseau compense. Tant que le réseau est là, tout est simple ; la coupure de courant est le vrai test de cette architecture.',
      'Putting everything on one busbar saves a thousand questions: who is using, who is producing, who is charging. Each one pushes or pulls, and the grid makes up the rest. As long as the grid is there it is all simple; a power cut is the real test of this design.',
    ),
  },
  {
    id: 'regen-supply',
    scene: 'power-room',
    category: 'electrical',
    name: l('Alimentation réversible', 'Regenerative supply'),
    short: l(
      'La seule pièce capable de renvoyer du courant vers le réseau. Elle n’existe pas sur le treuil de référence : le lab l’a ajoutée.',
      'The only part able to send current back to the grid. It is not on the reference hoist: the lab added it.',
    ),
    description: lf(
      'Un treuil ordinaire brûle dans une résistance l’énergie de sa descente : c’est d’ailleurs ce que publie le constructeur du treuil de référence, avec un hacheur intégré et une résistance externe. Pour faire une batterie de ce treuil, le lab ajoute cette alimentation, un pont à transistors qui fabrique un courant au rythme du réseau et y renvoie la puissance du bus continu. Ce n’est donc pas une pièce du catalogue, c’est notre ajout, et sans lui la machine n’aurait aucun sens. Elle perd {downSupplyW} à pleine vitesse en descente, et {upSupplyW} en montée, selon une hypothèse de {driveEta} de rendement, et elle se fait sentir à bas régime : {cutSupplyW} au seuil de rendu.',
      'An ordinary hoist burns the energy of its descent in a resistor: that is what the maker of the reference hoist publishes, with an integrated chopper and an external resistor. To make a battery of this hoist, the lab adds this supply, a bridge of transistors that makes a current in step with the grid and sends the DC link’s power back into it. So it is not a catalogue part, it is our addition, and without it the machine would make no sense. It loses {downSupplyW} at full speed coming down and {upSupplyW} climbing, on an assumed {driveEta} efficiency, and it is felt at low speed: {cutSupplyW} at the limit of giving back.',
    ),
    material: l(
      'Pont à transistors IGBT, filtre réseau, inductances, armoire ventilée',
      'IGBT transistor bridge, grid filter, inductors, ventilated cabinet',
    ),
    specs: [
      sp('Origine', 'Origin', l('ajout du lab, pas du catalogue', 'the lab’s addition, not in the catalogue')),
      sp('Rendement à la puissance nominale', 'Efficiency at rated power', v('{driveEta}')),
      sp('Perte, montée puis descente', 'Loss, up then down', v('{upSupplyW}, {downSupplyW}')),
      sp('Perte au seuil de rendu', 'Loss at the limit of giving back', v('{cutSupplyW}')),
      sp('Ce qu’elle fait sans réseau', 'What it does with no grid', l('elle s’arrête', 'it stops')),
    ],
    maintenance: maint(
      {
        failure:
          'Des condensateurs qui vieillissent à la chaleur, un ventilateur grippé, et un filtre qui chauffe à cause d’harmoniques venues du réseau voisin. Une coupure qui revient à chaque baisse de tension d’un réseau de campagne.',
        check:
          'Son journal compte les coupures et leur cause. Mesurez la tension du bus continu et la température du radiateur : une dérive dit où regarder. Un électricien contrôle la qualité du courant renvoyé.',
        care: 'Changez les ventilateurs avant leur panne, et les filtres d’air tous les ans. Un appareil de ce genre vieillit surtout par ses condensateurs : gardez-le au frais et au sec.',
      },
      {
        failure:
          'Capacitors ageing in the heat, a seized fan, and a filter running hot from harmonics coming off the neighbouring grid. A cut-out repeating at each voltage dip of a rural grid.',
        check:
          'Its log counts the cut-outs and their cause. Measure the DC link voltage and the heatsink’s temperature: a drift says where to look. An electrician checks the quality of the current sent back.',
        care: 'Change the fans before they fail, and the air filters each year. A device like this ages mostly through its capacitors: keep it cool and dry.',
      },
    ),
    tip: lf(
      'Un réglage décide de sa consommation : endormi, tout le système ne prend que {controlsW}, mais prêt à répondre il prend {readyW}, soit {readyKwhDay} par jour, plus de six fois le stock.',
      'One setting decides its consumption: asleep, the whole system takes only {controlsW}, but ready to answer it takes {readyW}, that is {readyKwhDay} a day, over six times the store.',
    ),
    design: lf(
      'Une fois ajoutée, cette alimentation devient la pièce clé, et elle change une évidence : la machine est tenue par l’électronique autant que par la mécanique. Elle ne modifie aucun chiffre du treuil publié, mais tout rendement de ce lab en dépend.',
      'Once added, this supply becomes the key part, and it changes something taken for granted: the machine depends on its electronics as much as on its mechanics. It alters no figure of the published hoist, but every efficiency in this lab depends on it.',
    ),
  },
  {
    id: 'dc-link',
    scene: 'power-room',
    category: 'electrical',
    name: l('Bus continu', 'DC link'),
    short: lf(
      'Des condensateurs à environ {dcV}, entre l’alimentation et le variateur. Ils restent chargés après l’arrêt : le vrai danger de cette armoire.',
      'Capacitors at about {dcV}, between the supply and the inverter. They stay charged after power-off: the real danger in this cabinet.',
    ),
    description: lf(
      'Entre le réseau et le moteur, l’énergie passe par un bus continu d’environ {dcV} : l’alimentation le remplit dans un sens, le variateur le vide, puis c’est l’inverse à la descente. Les condensateurs lissent ces échanges et fournissent les pointes. En cas de coupure, leur tension monte à {chopperV}, le point où le hacheur s’ouvre, puis se vide lentement à travers des résistances. Le modèle prend une constante de temps de {dcBleedS} : une vingtaine de secondes après une coupure, il reste encore {dc20s} sur le bus. Ouvrir le disjoncteur ne suffit donc pas : il faut attendre, puis mesurer.',
      'Between the grid and the motor, the energy passes through a DC link of about {dcV}: the supply fills it one way, the inverter empties it, then the other way round coming down. Capacitors smooth these exchanges and supply the peaks. In a power cut, their voltage rises to {chopperV}, where the chopper opens, then drains slowly through resistors. The model takes a time constant of {dcBleedS}: some twenty seconds after a cut, {dc20s} is still on the link. So opening the breaker is not enough: you must wait, then measure.',
    ),
    material: l(
      'Condensateurs de puissance, barres de cuivre isolées, résistances de décharge',
      'Power capacitors, insulated copper bars, discharge resistors',
    ),
    specs: [
      sp('Tension de service', 'Working voltage', v('{dcV}')),
      sp('Le hacheur s’ouvre à', 'The chopper opens at', v('{chopperV}')),
      sp('Temps de décharge', 'Discharge time constant', v('{dcBleedS}')),
      sp('Une vingtaine de secondes après une coupure', 'Some twenty seconds after a cut', v('{dc20s}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des condensateurs qui perdent leur capacité avec la chaleur et l’âge, gonflés sur le dessus. Une résistance de décharge coupée : le bus reste alors chargé bien plus longtemps qu’annoncé, sans aucun signe.',
        check:
          'Aucun contrôle sans vérification d’absence de tension, au voltmètre, sur les bornes du bus, après l’attente indiquée. Le voyant ne suffit pas : c’est le voltmètre qui fait foi.',
        care: 'Laissez le remplacement à un technicien du variateur. Après un long arrêt, un bus doit être reformé selon la notice avant d’être remis sous tension.',
      },
      {
        failure:
          'Capacitors losing capacity with heat and age, swollen on top. A broken discharge resistor: the link then stays charged far longer than stated, with no sign at all.',
        check:
          'No check without first proving dead, with a voltmeter, at the link’s terminals, after the stated wait. The indicator lamp is not enough: the voltmeter is what counts.',
        care: 'Leave replacement to an inverter technician. After a long stop, a link must be re-formed as the manual says before being powered again.',
      },
    ),
    tip: lf(
      'Le scénario « Coupure de courant » garde ce chiffre à l’écran : le bus monte à {chopperV}, puis descend très lentement. Personne n’ouvre l’armoire pendant ce temps.',
      'The “Power cut” scenario keeps this figure on the screen: the link rises to {chopperV}, then falls very slowly. Nobody opens the cabinet meanwhile.',
    ),
    design: l(
      'Ce bus permet aux deux convertisseurs de ne pas se connaître : l’un ne voit qu’une tension continue, l’autre aussi. Cette séparation rend l’ensemble simple à commander, au prix d’une énergie qui reste là, même lorsque tout est éteint.',
      'This link lets the two converters not know one another: each sees only a DC voltage. That separation makes the whole simple to control, at the price of energy that stays there, even when all is off.',
    ),
  },
  {
    id: 'motor-inverter',
    scene: 'power-room',
    category: 'electrical',
    name: l('Variateur de levage', 'Hoist inverter'),
    short: lf(
      'Il fixe la vitesse et le couple du moteur, dans les deux sens : de 0,08 à 4 m/min, sous 20 t, avec une rampe de {rampS}.',
      'It sets the motor’s speed and torque, both ways: from 0.08 to 4 m/min, under 20 t, with a {rampS} ramp.',
    ),
    description: lf(
      'Il fabrique pour le moteur une tension et une fréquence qui tiennent le poids, à toute vitesse et dans les deux sens : le catalogue publie 0,08 à 4 m/min à 20 t, soit {hookLowW} à {hookTopKw} au crochet. Il porte le courant du moteur à n’importe quelle vitesse : sa perte reste donc là quand la vitesse baisse, {cutInverterW} au seuil de rendu, sur des pertes nominales de {inverterRatedW}. C’est la deuxième raison, après le cuivre, pour laquelle cette machine ne rend rien sous {cutInKw}. Le rotor, lui, compte pour {rotorTonnes} au crochet à travers les rapports : une rampe de 1 s demanderait {rampOneSecond} le couple, trop pour le variateur, ce qui justifie les {rampS} retenues.',
      'It makes for the motor a voltage and a frequency that hold the weight, at any speed and both ways: the catalogue publishes 0.08 to 4 m/min at 20 t, that is {hookLowW} to {hookTopKw} at the hook. It carries the motor’s current at any speed: so its loss stays when the speed falls, {cutInverterW} at the limit of giving back, out of rated losses of {inverterRatedW}. That is the second reason, after the copper, why this machine gives nothing below {cutInKw}. The rotor, for its part, counts as {rotorTonnes} at the hook through the ratios: a 1 s ramp would ask for {rampOneSecond} the torque, too much for the inverter, which justifies the {rampS} chosen.',
    ),
    material: l(
      'Pont à transistors IGBT, radiateur, ventilateurs, carte de commande',
      'IGBT transistor bridge, heatsink, fans, control board',
    ),
    specs: [
      sp('Plage de vitesse', 'Speed range', l('0,08 à 4 m/min à 20 t', '0.08 to 4 m/min at 20 t')),
      sp('Au crochet', 'At the hook', lf('{hookLowW} à {hookTopKw}', '{hookLowW} to {hookTopKw}')),
      sp(
        'Rampe',
        'Ramp',
        lf('{rampS}, et 1,5 s au minimum selon le constructeur', '{rampS}, and 1.5 s at least according to the maker'),
      ),
      sp('Perte au seuil de rendu', 'Loss at the limit of giving back', v('{cutInverterW}')),
      sp('Rendement à la puissance nominale', 'Efficiency at rated power', v('{driveEta}')),
      sp('Réveil', 'Waking up', v('{wakeS}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un ventilateur grippé, qui fait monter le radiateur en température. Des condensateurs fatigués. Un défaut de terre sur le câble moteur, qu’il détecte et qui l’arrête, freins fermés.',
        check:
          'Son journal reste la meilleure source : température, défauts, et courant par course. Comparez le courant à vitesse constante, poids connu, aux chiffres de la mise en service.',
        care: 'Dépoussiérez le radiateur et gardez une sauvegarde de ses paramètres dans le carnet, car une carte remplacée ne connaît rien de votre machine. Testez les fonctions de sécurité à chaque inspection.',
      },
      {
        failure:
          'A seized fan, sending the heatsink’s temperature up. Tired capacitors. An earth fault on the motor cable, which it detects and which stops it, brakes closed.',
        check:
          'Its log remains the best source: temperature, faults and current per stroke. Compare the current at constant speed, with a known weight, with the commissioning figures.',
        care: 'Dust the heatsink and keep a backup of its settings in the logbook, since a replaced board knows nothing of your machine. Test the safety functions at each inspection.',
      },
    ),
    tip: lf(
      'Tirez le curseur de puissance vers le bas en Simulation : le variateur suit, jusqu’au moment où le compteur cesse de rendre. Vous avez trouvé les {cutInKw}.',
      'Pull the power slider down in the Simulation: the inverter follows, until the moment when the meter stops giving back. You have found the {cutInKw}.',
    ),
    design: lf(
      'Le catalogue annonce un variateur capable de {hookLowW}, et l’on pourrait croire que cela sert un frigo. Pourtant, à cette vitesse, 20 t pèsent toujours autant sur le moteur : le variateur fait le mouvement, mais il ne fait pas de miracle sur le bilan.',
      'The catalogue states an inverter capable of {hookLowW}, and you might think that would serve a fridge. Yet at that speed, 20 t weighs as much as ever on the motor: the inverter makes the movement, but it works no miracle on the balance.',
    ),
  },
  {
    id: 'brake-chopper',
    scene: 'power-room',
    category: 'electrical',
    name: l('Hacheur de freinage', 'Brake chopper'),
    short: lf(
      'Quand le réseau disparaît, plus rien ne prend l’énergie : à {chopperV} sur le bus, ce transistor l’envoie vers la résistance.',
      'When the grid goes, nothing takes the energy: at {chopperV} on the link, this transistor sends it to the resistor.',
    ),
    description: lf(
      'Si le réseau tombe en pleine descente, l’alimentation n’a plus où renvoyer la puissance, et le bus continu grimpe. À {chopperV}, le hacheur met la résistance sur le bus, par à-coups rapides, et la tension reste stable le temps de la rampe : le modèle y voit passer une pointe de {chopperKw}, mais seulement {dumpedWh} d’énergie brûlée. Puis les freins se ferment, le poids reste là où il est, et le reste du stock attend le retour du réseau. Cette pièce appartient au treuil publié, seule : c’est elle qui permet de s’arrêter sans danger, pas de produire.',
      'If the grid goes in mid-descent, the supply has nowhere to send the power, and the DC link climbs. At {chopperV}, the chopper switches the resistor onto the link, in fast bursts, and the voltage stays stable for the ramp: the model sees a peak of {chopperKw} go through, but only {dumpedWh} of energy burnt. Then the brakes close, the weight stays where it is, and the rest of the store waits for the grid’s return. This part belongs to the published hoist, on its own: it is what allows a safe stop, not production.',
    ),
    material: l(
      'Transistor IGBT de puissance, diode, commande intégrée au variateur',
      'Power IGBT transistor, a diode, control built into the inverter',
    ),
    specs: [
      sp('S’ouvre à', 'Opens at', v('{chopperV}')),
      sp('Pointe sur la rampe', 'Peak over the ramp', v('{chopperKw}')),
      sp('Énergie brûlée', 'Energy burnt', v('{dumpedWh}')),
      sp('Dans le catalogue', 'In the catalogue', l('oui : intégré au variateur', 'yes: built into the inverter')),
    ],
    maintenance: maint(
      {
        failure:
          'Un transistor en court-circuit, le pire cas : la résistance reste sur le bus et chauffe. Le variateur doit le voir et couper. À l’inverse, un transistor ouvert ne se découvre que lors d’une coupure.',
        check:
          'Un essai réel : coupez le réseau en descente à faible hauteur, à la mise en service, puis aux intervalles prévus. Le poids doit s’arrêter, sans défaut de surtension. Le journal garde la pointe.',
        care: 'Pas d’entretien propre : gardez le radiateur propre. Un défaut de surtension sur le bus, même rare, mérite une enquête, et on ne l’efface pas sans comprendre.',
      },
      {
        failure:
          'A transistor shorted, the worst case: the resistor stays on the link and heats up. The inverter must see it and cut out. Conversely, an open transistor is discovered only during a power cut.',
        check:
          'A real test: cut the grid during a descent at a small height, at commissioning, then at the set intervals. The weight must stop with no overvoltage fault. The log keeps the peak.',
        care: 'Nothing of its own to service: keep the heatsink clean. An overvoltage fault on the link, even a rare one, deserves an investigation, and is not to be cleared without understanding.',
      },
    ),
    tip: lf(
      'Lancez le scénario « Coupure de courant » : à peine {dumpedWh} brûlés, et pourtant la résistance voit passer {chopperKw}. C’est une affaire de puissance, pas d’énergie.',
      'Run the “Power cut” scenario: only {dumpedWh} burnt, and yet the resistor sees {chopperKw} go through. It is a matter of power, not energy.',
    ),
    design: l(
      'Un treuil ordinaire brûle toute sa descente de cette façon. Ici il ne s’en sert que quelques secondes, en cas de coupure : on voit bien ce qui sépare une machine de levage d’une machine de stockage, et c’est une seule pièce, l’alimentation réversible.',
      'An ordinary hoist burns its whole descent this way. Here it is used only for a few seconds, in a power cut: this clearly shows what separates a lifting machine from a storage machine, and it is a single part, the regenerative supply.',
    ),
  },
  {
    id: 'brake-resistor',
    scene: 'power-room',
    category: 'electrical',
    name: l('Résistance de freinage', 'Brake resistor'),
    short: l(
      'Elle transforme l’énergie du poids en chaleur, en toute sécurité : un gros radiateur, à l’abri mais à l’air libre.',
      'It turns the weight’s energy into heat, safely: a large heater, under cover but in the open air.',
    ),
    description: lf(
      'Une résistance fait exactement ce qu’elle sait faire : elle chauffe. Elle reçoit quelques secondes de puissance à chaque coupure, en pointe {chopperKw} pour {dumpedWh} au total, et elle se refroidit à l’air. On la met à part, hors de l’armoire, car elle peut brûler, et elle doit tenir pour la rampe, pas pour toute la course : si elle devait avaler les {strokeOutWh} d’une descente, il lui faudrait une tout autre taille. Le lab la garde parce qu’elle appartient au treuil publié et qu’elle rend l’arrêt sûr quand il n’y a plus de réseau.',
      'A resistor does exactly what it can: it heats up. It takes a few seconds of power at each cut, {chopperKw} at peak for {dumpedWh} in all, and cools in the air. It stands apart, out of the cabinet, since it can burn, and it must last for the ramp, not for the whole stroke: if it had to swallow the {strokeOutWh} of a descent, it would need to be quite another size. The lab keeps it because it belongs to the published hoist and because it makes the stop safe when there is no grid.',
    ),
    material: l(
      'Fil ou bande résistive sur isolateurs, coffre d’acier ajouré',
      'Resistance wire or strip on insulators, a perforated steel box',
    ),
    specs: [
      sp('Pointe', 'Peak', v('{chopperKw}')),
      sp('Énergie d’une coupure', 'Energy of one cut', v('{dumpedWh}')),
      sp('Où', 'Where', l('hors de l’armoire, à l’air', 'out of the cabinet, in the air')),
      sp('Pour quelle durée', 'For how long', l('la rampe, pas toute la course', 'the ramp, not the whole stroke')),
    ],
    maintenance: maint(
      {
        failure:
          'Un fil coupé, qui ne se révèle qu’à la coupure suivante. Un coffre encombré, avec un objet oublié dessus, ou un nid à l’intérieur, ce qui peut suffire à provoquer un départ de feu. De la corrosion sur les bornes.',
        check:
          'Mesurez sa valeur en ohms, à froid et consigné, et comparez-la à la plaque. Faites le tour du coffre : aucune matière combustible autour, ni dedans.',
        care: 'Gardez la zone dégagée, car c’est un appareil qui brûle par nature. Un coffre ajouré ne se bâche jamais, et ne se pose jamais contre une paroi en bois.',
      },
      {
        failure:
          'A broken wire, which shows only at the next cut. A cluttered box, with something left on it, or a nest inside, which may be enough to start a fire. Corrosion on the terminals.',
        check:
          'Measure its value in ohms, cold and locked out, and compare with the plate. Walk round the box: no combustible material around it or inside.',
        care: 'Keep the area clear, as this is a device that burns by nature. A perforated box is never covered, and never set against a wooden wall.',
      },
    ),
    tip: lf(
      'Sur un treuil de chantier, toute l’énergie part par ici à chaque descente. Sur cette machine, rien : {dumpedWh} par coupure. C’est là toute la différence avec une batterie de gravité.',
      'On a site hoist, all the energy goes out here at each descent. On this machine, nothing: {dumpedWh} per cut. That is all the difference from a gravity battery.',
    ),
    design: l(
      'Rien n’est plus simple, et rien n’est plus sûr : elle marche sans logiciel, n’a aucune pièce mobile, et elle est dimensionnée pour un cas rare. Elle montre aussi une vérité peu dite : chaque machine de stockage doit prévoir l’instant où plus rien n’accepte son énergie.',
      'Nothing is simpler, and nothing is safer: it works with no software, has no moving part, and is sized for a rare case. It also shows a truth seldom told: every storage machine must plan for the moment when nothing will accept its energy.',
    ),
  },
  {
    id: 'motor-cable',
    scene: 'power-room',
    category: 'electrical',
    name: l('Câble moteur', 'Motor cable'),
    short: lf(
      'Du local au treuil, {cableM} de câble : une vraie perte, qui ne baisse pas avec la vitesse, car le courant ne baisse pas non plus.',
      'From the shed to the hoist, {cableM} of cable: a real loss that does not fall with the speed, because the current does not either.',
    ),
    description: lf(
      'Il part du variateur, passe la tranchée, puis monte la tour jusqu’au moteur : {cableM} de {cableMm2}, des estimations du lab, soit {cableOhm} par phase. Ce sont les pertes du câble, de la forme 3 × R × I², et non celles du réseau, et elles dépendent du courant : {upCableW} en montée, avec {motorAmpsUp}, et {downCableW} en descente, avec {motorAmpsDown}. Le plus étonnant : au seuil où la machine ne rend rien, le poids et donc le courant sont les mêmes, et le câble perd toujours {cutCableW}. Il est blindé, car la tension hachée du variateur rayonne, et sa tresse se relie à la terre aux deux bouts.',
      'It leaves the inverter, goes through the trench, then climbs the tower to the motor: {cableM} of {cableMm2}, estimates of the lab, that is {cableOhm} a phase. These are the cable’s losses, of the form 3 × R × I², not the grid’s, and they depend on the current: {upCableW} climbing, with {motorAmpsUp}, and {downCableW} coming down, with {motorAmpsDown}. The most surprising thing: at the limit where the machine gives nothing, the weight and so the current are the same, and the cable still loses {cutCableW}. It is shielded, as the inverter’s chopped voltage radiates, and its braid is bonded to earth at both ends.',
    ),
    material: l(
      'Câble cuivre blindé pour variateur, gaine résistant aux UV, colliers d’acier',
      'Shielded copper inverter cable, UV-resistant sheath, steel clamps',
    ),
    specs: [
      sp('Longueur, section', 'Length, section', v('{cableM}, {cableMm2}')),
      sp('Résistance par phase', 'Resistance per phase', v('{cableOhm}')),
      sp('Perte, montée puis descente', 'Loss, up then down', v('{upCableW}, {downCableW}')),
      sp('Perte au seuil de rendu', 'Loss at the limit of giving back', v('{cutCableW}')),
      sp('Courant, montée puis descente', 'Current, up then down', v('{motorAmpsUp}, {motorAmpsDown}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un câble qui bat au vent sur la tour et s’use à un collier. Une gaine fendue par le soleil, de l’eau qui entre, et un défaut de terre. Un connecteur desserré au moteur.',
        check:
          'Un contrôle d’isolement à l’arrêt, moteur déconnecté, chaque année. Un tour des colliers depuis l’échelle. Une caméra thermique sur le raccordement, en charge, si vous pouvez y aller sans vous exposer.',
        care: 'Refaites un collier qui lâche le jour même : un câble libre devient vite un câble blessé. Sur la tour, passez-le loin du rail antichute pour ne jamais gêner une montée.',
      },
      {
        failure:
          'A cable flapping in the wind on the tower and wearing at a clamp. A sheath split by the sun, water getting in, and an earth fault. A loose connector at the motor.',
        check:
          'An insulation test when stopped, motor disconnected, every year. A look at the clamps from the ladder. A thermal camera on the connection, under load, if you can get there without exposing yourself.',
        care: 'Refit a clamp that gives way the same day: a loose cable soon becomes an injured one. On the tower, run it clear of the fall-arrest rail so that it never gets in the way of a climb.',
      },
    ),
    tip: lf(
      'Doubler la section aide peu : moins de {cutCableW} sur {cutInKw}, et le seuil baisse à peine. Le câble compte, mais il n’est ni le premier ni le plus gros poste de pertes.',
      'Doubling the section helps little: less than {cutCableW} out of {cutInKw}, and the limit barely falls. The cable counts, but it is neither the first nor the largest item among the losses.',
    ),
    design: lf(
      'Pourquoi ne pas poser le variateur en haut ? Parce qu’une tour ne convient ni à l’électronique, ni à celui qui doit la dépanner, et que le local reste hors de la zone de chute. Les {cableM} de câble sont le prix de cette tranquillité.',
      'Why not put the inverter at the top? Because a tower suits neither electronics nor the person who must service them, and the shed stays outside the fall zone. The {cableM} of cable are the price of that peace of mind.',
    ),
  },
  {
    id: 'safety-controller',
    scene: 'power-room',
    category: 'electrical',
    name: l('Automate de sécurité', 'Safety controller'),
    short: l(
      'Le portail, le limiteur, les fins de course, le vent : une seule chaîne de contacts, et le premier qui s’ouvre ferme les freins.',
      'The gate, the governor, the limits, the wind: one chain of contacts, and the first to open closes the brakes.',
    ),
    description: lf(
      'Cet automate est le seul à pouvoir faire bouger la machine, et aussi le seul qu’aucun logiciel de confort ne contourne. Il lit le portail, la coupure d’urgence, les fins de course, le limiteur de vitesse, le limiteur de charge et le vent, chacun souvent en deux voies indépendantes, et il compare. Une seule voie ouverte ou un désaccord, et il coupe le contacteur du variateur, puis l’alimentation des freins. Il ne s’endort jamais : sa part de la veille de {controlsW}, avec le codeur, le mât et le compteur, reste présente nuit et jour. C’est autant qu’un gros frigo, et sur une tour qui garde {grossKwh}, ces {controlsKwhDay} par jour font à peu près tout le stock.',
      'This controller is the only thing that can set the machine moving, and the only one no convenience software can bypass. It reads the gate, the emergency stop, the limit switches, the overspeed governor, the overload cell and the wind, each often on two separate channels, and compares them. One open channel or a disagreement, and it cuts the inverter’s contactor, then the brakes’ supply. It never sleeps: its share of the {controlsW} standby, with the encoder, the mast and the meter, stays on day and night. That is as much as a large fridge, and on a tower holding {grossKwh}, those {controlsKwhDay} a day come to about the whole store.',
    ),
    material: l(
      'Automate de sécurité certifié, relais à contacts guidés, borniers repérés',
      'Certified safety controller, guided-contact relays, marked terminals',
    ),
    specs: [
      sp(
        'Entrées',
        'Inputs',
        l('portail, arrêt d’urgence, limites, limiteurs, vent', 'gate, emergency stop, limits, governors, wind'),
      ),
      sp('Câblage', 'Wiring', l('deux voies indépendantes', 'two separate channels')),
      sp(
        'Veille',
        'Standby',
        lf(
          '{controlsW}, de {controlsLow} à {controlsHigh} selon la machine',
          '{controlsW}, {controlsLow} to {controlsHigh} depending on the machine',
        ),
      ),
      sp('Par jour', 'Per day', v('{controlsKwhDay}')),
    ],
    maintenance: maint(
      {
        failure:
          'Le contact shunté et oublié après un dépannage, le plus grave. Un relais qui colle : c’est justement ce que le contrôle à deux voies détecte. Une pile de sauvegarde morte, et des réglages perdus après une coupure.',
        check:
          'Un essai de chaque entrée, une par une, selon une liste écrite, à date fixe : portail, urgence, limites, limiteurs, vent. Chacune doit arrêter la machine et laisser une trace dans le journal.',
        care: 'Toute modification se note, avec son nom et sa date, et les réglages sont verrouillés. Gardez une copie, avec le carnet, hors du local.',
      },
      {
        failure:
          'A contact bridged and forgotten after a repair, the most serious. A relay sticking: exactly what two-channel checking detects. A dead backup cell, and settings lost after a power cut.',
        check:
          'A test of each input, one by one, from a written list, on a fixed date: gate, emergency stop, limits, governors, wind. Each must stop the machine and leave a trace in the log.',
        care: 'Any change is noted, with its name and date, and the settings are locked. Keep a copy, with the logbook, outside the shed.',
      },
    ),
    tip: lf(
      'Faites ce calcul : {controlsW} sur une journée font {controlsKwhDay}, et le poids garde {grossKwh}. À cette taille, la sécurité seule coûte le stock, et elle ne se discute pas.',
      'Do the sum: {controlsW} over a day is {controlsKwhDay}, and the weight holds {grossKwh}. At this size, safety alone costs the store, and it is not up for discussion.',
    ),
    design: l(
      'L’automate est séparé du variateur par principe : une sécurité ne doit jamais demander l’avis de ce qu’elle arrête. Une machine bien faite peut tout perdre, sauf cette chaîne.',
      'The controller is kept apart from the inverter on principle: safety must never ask the opinion of what it stops. A well-made machine can lose anything but this chain.',
    ),
  },
  {
    id: 'emergency-stop',
    scene: 'power-room',
    category: 'electrical',
    name: l('Arrêt d’urgence', 'Emergency stop'),
    short: l(
      'Un coup de poing : les deux freins se ferment. Il ne remet rien hors tension, et il ne se réarme pas tout seul.',
      'One press: both brakes close. It takes nothing off the supply, and it does not reset by itself.',
    ),
    description: l(
      'Rouge sur fond jaune, à portée de main et à l’abri d’un geste accidentel : ce bouton se trouve au local, et sur une vraie machine aussi au pied de la tour et sur le palier de tête. Un seul appui ouvre la chaîne de sécurité, le variateur coupe et les ressorts ferment les deux freins, sans attendre la fin de la rampe. La charge s’arrête alors plus sèchement qu’en marche normale, et c’est voulu. Il faut retenir une chose : ce bouton n’isole rien. Le bus continu reste chargé, le réseau reste au tableau, et la charge reste en l’air. Il arrête le mouvement, pas le danger électrique.',
      'Red on yellow, within reach and safe from an accidental knock: this button is found in the shed, and on a real machine also at the foot of the tower and on the head landing. One press opens the safety chain, the inverter cuts out and the springs close both brakes, without waiting for the end of the ramp. The load then stops more sharply than in normal running, on purpose. One thing to keep in mind: this button isolates nothing. The DC link stays charged, the grid stays on the panel, and the load stays in the air. It stops the movement, not the electrical danger.',
    ),
    material: l(
      'Bouton coup de poing à accrochage, contacts à ouverture forcée, boîtier étanche',
      'Latching mushroom button, positive-opening contacts, sealed box',
    ),
    specs: [
      sp('Effet', 'Effect', l('chaîne ouverte, les deux freins fermés', 'chain open, both brakes closed')),
      sp(
        'Où',
        'Where',
        l(
          'au local ; sur une vraie machine, aussi en pied de tour et au palier',
          'in the shed; on a real machine, also at the tower foot and the landing',
        ),
      ),
      sp('Réarmement', 'Reset', l('volontaire, puis un redémarrage séparé', 'deliberate, then a separate restart')),
      sp(
        'Ce qu’il ne fait pas',
        'What it does not do',
        l('couper le courant ni décharger le bus', 'cut the power or discharge the link'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un bouton jamais touché, grippé par la poussière, ou un bloc de contact qui s’est détaché derrière sa tête : le bouton s’enfonce, mais rien ne s’ouvre. C’est le plus trompeur, et le plus classique.',
        check:
          'Un appui réel sur chacun, à date fixe, machine en marche lente : elle doit s’arrêter. Le test doit aussi confirmer qu’elle ne repart pas seule après le réarmement.',
        care: 'Gardez-les visibles, sans rien devant : ce sont des boutons que l’on doit trouver sans réfléchir. Remplacez ceux qui prennent le soleil avant que le rouge n’ait viré au rose.',
      },
      {
        failure:
          'A button never touched, seized by dust, or a contact block detached behind its head: the button goes in, but nothing opens. That is the most deceptive and the most classic of all.',
        check:
          'A real press on each one, on a fixed date, the machine moving slowly: it must stop. The test must also confirm that it does not restart by itself after the reset.',
        care: 'Keep them visible, with nothing in front: these are buttons to find without thinking. Replace those in the sun before the red has faded to pink.',
      },
    ),
    tip: l(
      'Un arrêt d’urgence par jour de test vaut mieux qu’un bouton qui ne sert jamais. Beaucoup de pannes de cette pièce se découvrent seulement le jour où il faut s’en servir.',
      'One emergency stop per test day is better than a button that is never used. Many failures of this part come to light only on the day it is needed.',
    ),
    design: l(
      'Un seul geste, une seule couleur, partout le même : la conception vient de l’idée qu’une personne qui panique ne lit pas de notice. Sa simplicité, ici, est son vrai cahier des charges.',
      'One gesture, one colour, the same everywhere: the design comes from the idea that a person in a panic does not read a manual. Simplicity is its real specification here.',
    ),
  },
  {
    id: 'control-ups',
    scene: 'power-room',
    category: 'electrical',
    name: l('Onduleur de contrôle', 'Control UPS'),
    short: l(
      'Une petite réserve qui garde les cerveaux allumés pendant une coupure : la machine doit pouvoir dire ce qu’elle a fait.',
      'A small reserve that keeps the brains alive through a power cut: the machine must be able to say what it did.',
    ),
    description: lf(
      'Quand le réseau tombe, le poids reste sûr grâce aux ressorts, mais il faut encore que l’automate voie les choses : portail, fins de course, journal, et un message à quelqu’un. Ce petit onduleur tient donc les contrôles, sans rien de la puissance. Le modèle ne le compte pas au compteur pendant la coupure, et il entre dans les {controlsW} de veille le reste du temps. Il sert aussi au réveil : la machine reprend en {wakeS} environ, et doit savoir où elle en est. Un petit parc de batteries, juste pour cela : ce n’est pas sur lui que la tour stocke, c’est par lui qu’elle reste lisible.',
      'When the grid goes, the weight stays safe thanks to the springs, but the controller must still see things: gate, limit switches, log and a message to someone. So this small UPS keeps the controls going, with none of the power. The model does not count it at the meter during the cut, and it is part of the {controlsW} of standby the rest of the time. It also helps the wake-up: the machine picks up again in about {wakeS}, and must know where it stands. A small bank of batteries, just for that: the tower does not store its energy there, this is what keeps it readable.',
    ),
    material: l(
      'Petit onduleur, batterie à décharge lente, alimentation de commande',
      'Small UPS, slow-discharge battery, control supply',
    ),
    specs: [
      sp(
        'Ce qu’il alimente',
        'What it supplies',
        l('l’automate, les capteurs, le journal', 'the controller, the sensors, the log'),
      ),
      sp(
        'Ce qu’il n’alimente pas',
        'What it does not supply',
        l('le moteur, le variateur, les freins', 'the motor, the inverter, the brakes'),
      ),
      sp('Temps de réveil de la machine', 'Machine’s wake-up time', v('{wakeS}')),
      sp('Fait partie de', 'Part of', lf('la veille de {controlsW}', 'the {controlsW} standby')),
    ],
    maintenance: maint(
      {
        failure:
          'Une batterie vieille, qui affiche pleine et ne tient plus : la panne la plus courante, et elle n’apparaît que lors d’une vraie coupure. Un contact de signal mort, si bien que l’automate ne sait plus qu’il tourne sur réserve.',
        check:
          'Coupez son alimentation une fois par trimestre, machine arrêtée : il doit tenir, et l’automate doit le dire. Notez le temps tenu, et comparez-le au précédent.',
        care: 'Changez sa batterie selon la durée de vie de la notice, sans attendre le défaut. Gardez-le au frais, dans le bas de l’armoire, car c’est la chaleur qui les tue.',
      },
      {
        failure:
          'An old battery that shows full yet no longer holds: the commonest failure, and it appears only in a real cut. A dead signal contact, so that the controller no longer knows it is running on reserve.',
        check:
          'Cut its supply once a quarter, the machine stopped: it must hold, and the controller must say so. Note the time it lasted, and compare it with the last.',
        care: 'Change its battery at the life stated in the manual, without waiting for the fault. Keep it cool, low down in the cabinet, because heat is what kills them.',
      },
    ),
    tip: l(
      'Une batterie, pour la sécurité d’un stockage sans batterie : ce n’est pas une ironie, c’est une leçon d’ingénierie. Plus aucune machine ne tient sans un peu de chimie.',
      'A battery, for the safety of a store without batteries: that is no irony, it is a lesson in engineering. No machine can do without a little chemistry any more.',
    ),
    design: l(
      'Dans le scénario de coupure, tout se joue en quelques secondes, et il faut un témoin qui reste éveillé. Le journal écrit à ce moment-là est celui qui permettra de savoir, ensuite, ce qui s’est passé.',
      'In the power-cut scenario it all plays out in a few seconds, and a witness has to stay awake. The log written at that moment is what will later show what happened.',
    ),
  },
  {
    id: 'battery-inverter',
    scene: 'power-room',
    category: 'electrical',
    name: l('Onduleur batterie', 'Battery inverter'),
    short: lf(
      'Il encaisse les rafales de la tour et sert le frigo doucement : avec lui, le même poids donne {burstTimes} plus d’énergie au frigo.',
      'It takes the tower’s bursts and feeds the fridge gently: with it, the same weight gives the fridge {burstTimes} more energy.',
    ),
    description: lf(
      'Sous {cutInKw} au crochet, la tour ne rend rien ; à {fridgeW} au frigo, elle travaille à {fridgeEta}. Or un petit tampon résout ce problème : la batterie suit la maison, et la tour se vide d’un coup dans la batterie à sa meilleure allure, quand l’état de charge tombe à {socLow}, jusqu’à {socHigh}. La charge est limitée à {lfpChargeKw}, le courant conseillé du module. Le modèle voit alors une rafale d’environ {burstMin} à {burstKw} : {burstWh} atteignent le frigo au lieu de {fridgeWh}, {burstTimes} plus. Cet onduleur a sa part : {lfpIdleW} d’allumage et {lfpShare} de la puissance, des estimations.',
      'Below {cutInKw} at the hook the tower gives nothing; at {fridgeW} to the fridge, it works at {fridgeEta}. But a small buffer solves this: the battery follows the house, and the tower empties in one go into the battery at its best pace, when the state of charge falls to {socLow}, up to {socHigh}. The charge is limited to {lfpChargeKw}, the module’s recommended current. The model then sees a burst of about {burstMin} at {burstKw}: {burstWh} reach the fridge instead of {fridgeWh}, {burstTimes} more. This inverter takes its share: {lfpIdleW} to stay on and {lfpShare} of the power, estimates.',
    ),
    material: l(
      'Onduleur hybride à transistors, transformateur, liaison de communication avec le module',
      'Hybrid transistor inverter, transformer, communication link with the module',
    ),
    specs: [
      sp('Puissance de charge', 'Charging power', v('{lfpChargeKw}')),
      sp(
        'Consommation',
        'Consumption',
        lf('{lfpIdleW} d’allumage, {lfpShare} de la puissance', '{lfpIdleW} to stay on, {lfpShare} of the power'),
      ),
      sp('Rafale de la tour', 'Burst from the tower', lf('{burstMin} à {burstKw}', '{burstMin} at {burstKw}')),
      sp(
        'Frigo servi',
        'Fridge served',
        lf('{burstWh}, contre {fridgeWh} tout seul', '{burstWh}, against {fridgeWh} on its own'),
      ),
      sp(
        'Commande',
        'Control',
        lf('rafale de {socLow} à {socHigh} d’état de charge', 'burst from {socLow} to {socHigh} state of charge'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un ventilateur bruyant, une liaison de communication perdue avec le module : l’onduleur se met alors en sécurité. Un logiciel qui, à la mise à jour, change le comportement à bas régime.',
        check:
          'Lisez la tension et l’état de charge sur son écran et sur celui du module : ils doivent être d’accord. Mesurez sa consommation à vide : un chiffre plus élevé qu’annoncé pèse lourd sur une petite charge.',
        care: 'Dépoussiérez, laissez de la place autour. Conservez les réglages de limite de courant, car une valeur fausse peut abîmer le module sans rien dire.',
      },
      {
        failure:
          'A noisy fan, a lost communication link with the module: the inverter then goes into safety mode. Software that, on updating, changes how it behaves at low power.',
        check:
          'Read the voltage and state of charge on its screen and on the module’s: they should agree. Measure its no-load draw: a figure higher than stated weighs heavily on a small load.',
        care: 'Dust it and leave room around it. Keep the current-limit settings, since a wrong value can damage the module without a word.',
      },
    ),
    tip: lf(
      'Avec un module, une vraie journée passe de {dayDirect} à {dayBuffer} : c’est mieux, mais la nuit est alors servie surtout par le module. Regardez le scénario « Le frigo, avec batterie ».',
      'With a module, a real day goes from {dayDirect} to {dayBuffer}: better, but the night is then served mostly by the module. Watch the “The fridge, with a battery” scenario.',
    ),
    design: lf(
      'C’est le vrai enseignement de ce lab : pour tirer parti d’une tour, il faut lui adjoindre une batterie, qui garde à elle seule {towersPerModule}. La physique n’interdit pas à la tour de servir un frigo : elle dit que {fridgeW} lui coûtent {fridgeHookKw}.',
      'That is the lab’s true lesson: to make use of a tower you have to add a battery, which alone holds {towersPerModule}. The physics does not forbid the tower from serving a fridge: it says {fridgeW} costs it {fridgeHookKw}.',
    ),
  },
  {
    id: 'lfp-module',
    scene: 'power-room',
    category: 'electrical',
    name: l('Module LFP', 'LFP module'),
    short: lf(
      'Quarante kilos, 4,8 kWh : {towersPerModule} dans un coffret qu’on porte à deux. À cette échelle, c’est lui qui gagne.',
      'Forty kilos, 4.8 kWh: {towersPerModule} in a box two people can carry. At this scale, it wins.',
    ),
    description: lf(
      'Ce module réel fait 442 × 420 × 162 mm, {lfpVolumeL} et 40 kg, pour 4,8 kWh en 48 V, dont 4,56 kWh utilisables. Sa fiche conseille 50 A, son revendeur 80 A ; ce dernier annonce 100 A en continu, 200 A en pointe, et plus de 6 000 cycles à 25 °C. Il atteint {lfpWhPerKg} là où la tour ne dépasse pas {whPerKg} : {densityRatio} fois plus par kilo. Son prix public d’avril 2026, 1 110,80 €, fait {lfpEuroPerKwh}. Par son onduleur, le modèle lui donne {lfpRoundTrip} d’aller-retour à sa pleine puissance, et {lfpFridgeTrip} seulement pour un frigo de {fridgeW}, car lui aussi perd à basse puissance. Il vieillit, sa chimie s’use, et il faudra le remplacer un jour : c’est sa seule vraie faiblesse face à la tour, et elle pèse peu ici.',
      'This real module is 442 × 420 × 162 mm, {lfpVolumeL} and 40 kg, for 4.8 kWh at 48 V, of which 4.56 kWh is usable. Its data sheet recommends 50 A, its retailer 80 A; the retailer also states 100 A continuous, 200 A at peak, and more than 6,000 cycles at 25 °C. It reaches {lfpWhPerKg} where the tower cannot get past {whPerKg}: {densityRatio} times more per kilo. Its April 2026 retail price, €1,110.80, comes to {lfpEuroPerKwh}. Through its inverter, the model gives it {lfpRoundTrip} round trip at full power, and only {lfpFridgeTrip} for a {fridgeW} fridge, since it too loses at low power. It ages, its chemistry wears out, and one day it must be replaced: that is its only real weakness against the tower, and it weighs little here.',
    ),
    material: l(
      'Cellules lithium-fer-phosphate, système de gestion, boîtier d’acier',
      'Lithium iron phosphate cells, a management system, a steel case',
    ),
    specs: [
      sp('Énergie', 'Energy', l('4,8 kWh, 4,56 kWh utilisables', '4.8 kWh, 4.56 kWh usable')),
      sp('Taille, masse', 'Size, mass', l('442 × 420 × 162 mm, 40 kg', '442 × 420 × 162 mm, 40 kg')),
      sp(
        'Courant',
        'Current',
        l(
          '50 à 80 A conseillés selon la source, 100 A en continu, 200 A en pointe',
          '50 to 80 A recommended, depending on the source, 100 A continuous, 200 A peak',
        ),
      ),
      sp('Durée de vie annoncée', 'Stated life', l('plus de 6 000 cycles à 25 °C', 'more than 6,000 cycles at 25 °C')),
      sp(
        'Prix public, avril 2026',
        'Retail price, April 2026',
        lf('1 110,80 €, soit {lfpEuroPerKwh}', '€1,110.80, that is {lfpEuroPerKwh}'),
      ),
      sp('Face à la tour', 'Against the tower', v('{towersPerModule}')),
      sp('Aller-retour par son onduleur', 'Round trip through its inverter', v('{lfpRoundTrip}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une charge par grand froid, que son système de gestion doit refuser. Une cellule qui se déséquilibre avec les années. Une capacité qui baisse lentement, la seule usure que la tour ne connaît pas.',
        check:
          'Lisez la tension de ses cellules et ses cycles sur l’écran ou le logiciel : l’écart entre cellules dit sa santé. Regardez sa capacité une fois par an, par une décharge complète surveillée.',
        care: 'Gardez-le au sec, tempéré, sans le laisser longtemps vide. Le court-circuit d’un module de ce type délivre un courant énorme : outils isolés et électricien qualifié.',
      },
      {
        failure:
          'Charging in hard cold, which its management system must refuse. A cell drifting out of balance over the years. A capacity falling slowly, the one wear the tower does not know.',
        check:
          'Read its cell voltages and cycle count on the screen or the software: the gap between cells tells its health. Check its capacity once a year, by a supervised full discharge.',
        care: 'Keep it dry, temperate, and do not leave it empty for long. A short circuit on such a module delivers enormous current: insulated tools and a qualified electrician.',
      },
    ),
    tip: lf(
      'Regardez-le et levez la tête : {towersPerModule}, et 40 kg. Puis lancez le scénario « La course » : à 1 kW, la tour tient {raceTowerMin}, le module {raceModuleH}, et la même masse d’eau en haut d’une chute alpine {raceWaterH}.',
      'Look at it and then look up: {towersPerModule}, and 40 kg. Then run the “The race” scenario: at 1 kW the tower lasts {raceTowerMin}, the module {raceModuleH}, and the same mass of water up an Alpine head {raceWaterH}.',
    ),
    design: lf(
      'Ce qu’offre la gravité en échange tient en trois points : une puissance indépendante de l’énergie, aucune usure chimique, et une masse qui peut être n’importe quoi de lourd. Ils comptent dans un puits déjà creusé, à très grande échelle. Sur une ferme, les {costKwhLow} de la tour face aux {lfpEuroPerKwh} du module, même à un ordre de grandeur près, closent la discussion.',
      'What gravity offers in exchange comes down to three points: power that does not depend on the energy, no chemical wear, and a mass that can be anything heavy. They count in a shaft already dug, at very large scale. On a farm, the tower’s {costKwhLow} against the module’s {lfpEuroPerKwh}, even to within an order of magnitude, closes the discussion.',
    ),
  },
];
