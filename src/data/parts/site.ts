// Parts of the `site` world (10 of them, ids of docs/research.md §4): the farm, flat on purpose, with its tower behind a fence.
//
// Conventions of the catalogue (checked by ../data.test.ts):
//   - `maintenance` is THREE paragraphs, each opened by a bold label: the typical failure, how to check it, the routine care (see `maint`).
//   - Who says what is visible in words: "a published hoist table", "a block maker", "a video", never a research code. A figure with no mark is
//     reported, † is arithmetic on reported figures, * rests on an estimate of this lab: the model's results and our choices.
//   - Nobody is named: no person, channel, company or brand. Credits live in the Sources panel; the real projects are named there and in lesson 6.
//   - The machine is GENERIC: built around published parts, sold by nobody. Costs are orders of magnitude only.
//   - The safety notice and the law are said once, in the tower world and the Sources, not on these sheets.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const SITE_PARTS: PartInfo[] = [
  {
    id: 'barn-solar-roof',
    scene: 'site',
    category: 'site',
    name: l('Toit solaire de la grange', 'Barn solar roof'),
    short: l(
      'Le surplus de midi : c’est lui qui lève le poids, à condition d’être assez fort pour monter vite.',
      'The midday surplus: this is what lifts the weight, provided it is strong enough to climb quickly.',
    ),
    description: lf(
      'Toute l’histoire commence ici : un toit de grange produit à midi ce que la ferme n’utilise pas, et le soir il ne produit plus rien. Le lab lui donne {pvKwp}, un choix qui fixe seulement la puissance disponible pour monter, pas l’énergie stockée. À pleine vitesse, le treuil prend {meterUpKw} au compteur pour lever {hookTopKw} au crochet. Le modèle attend donc d’avoir assez de soleil, puis monte d’un trait : en rampant à un dixième de sa puissance, la même montée rend à peine {upAtTenth}. Un jour clair d’équinoxe, le poids est en haut avant midi, après cinq minutes de travail.',
      'The whole story starts here: a barn roof makes at midday what the farm does not use, and in the evening it makes nothing. The lab gives it {pvKwp}, a choice that sets only the power available for climbing, not the energy stored. At full speed the hoist takes {meterUpKw} at the meter to lift {hookTopKw} at the hook. So the model waits until there is enough sun, then climbs in one go: crawling at a tenth of its power, the same climb keeps barely {upAtTenth}. On a clear equinox day the weight is up before noon, after five minutes of work.',
    ),
    material: l(
      'Modules photovoltaïques sur rails d’aluminium, câbles de chaîne en courant continu',
      'Photovoltaic modules on aluminium rails, string cables carrying direct current',
    ),
    specs: [
      sp('Puissance du toit', 'Roof power', lf('{pvKwp}, choix du lab', '{pvKwp}, the lab’s choice')),
      sp(
        'Ce qu’il faut pour monter à pleine vitesse',
        'What a full-speed climb needs',
        lf('{meterUpKw} au compteur', '{meterUpKw} at the meter'),
      ),
      sp(
        'Rendement de la montée, en rampant',
        'Efficiency of the climb, crawling',
        lf('{upAtTenth} à un dixième de la puissance', '{upAtTenth} at a tenth of the power'),
      ),
      sp('Rendement de la montée, à pleine vitesse', 'Efficiency of the climb, full speed', v('{upEta}')),
      sp('Soleil modélisé', 'Sun in the model', l('un seul jour clair, à l’équinoxe', 'one clear day, at the equinox')),
    ],
    maintenance: maint(
      {
        failure:
          'Connecteur de chaîne qui chauffe, salissures d’une grange (poussière de foin, fientes) qui font perdre une partie de la production, un module ombré qui entraîne toute sa chaîne, câble rongé sous le toit.',
        check:
          'Comparez les chaînes entre elles sur l’écran de l’onduleur solaire, par un jour clair : celle qui décroche a un défaut. Une caméra thermique montre un module ou un connecteur qui chauffe, depuis le sol.',
        care: 'Un rinçage à l’eau claire quand la poussière se voit, depuis une nacelle ou avec une perche, jamais en marchant sur les modules. Refaites le tour des rails et des passages de câbles après une tempête.',
      },
      {
        failure:
          'A string connector running hot, barn dirt (hay dust, droppings) that takes away part of the output, one shaded module dragging down its whole string, a cable gnawed under the roof.',
        check:
          'Compare the strings with one another on the solar inverter’s screen on a clear day: the one that falls behind has a fault. A thermal camera shows a hot module or connector, from the ground.',
        care: 'Rinse with clean water when the dust shows, from a platform or with a pole, never walking on the modules. Go round the rails and the cable entries after a storm.',
      },
    ),
    tip: lf(
      'Ce toit charge aussi une batterie de {lfpChargeKw} sans effort, à toute heure du jour. C’est tout le problème de la tour : son plus gros client est aussi celui qui en a le moins besoin.',
      'This roof also charges a {lfpChargeKw} battery without effort, at any hour of the day. That is the tower’s whole problem: its biggest customer is also the one that needs it least.',
    ),
    design: lf(
      'Une grange plate sur une plaine plate : pas de colline, pas de lac, donc pas de pompage possible. C’est le seul cas où l’on se pose la question d’une tour, et le toit n’a pas besoin d’être grand pour lever {hookTopKw}.',
      'A flat barn on a flat plain: no hill, no lake, so no pumped storage. It is the only case where the question of a tower arises at all, and the roof need not be large to lift {hookTopKw}.',
    ),
  },
  {
    id: 'farmhouse',
    scene: 'site',
    category: 'site',
    name: l('Maison', 'Farmhouse'),
    short: l(
      'Le client du soir : un frigo, des lampes, une bouilloire. Elle demande peu, longtemps : le contraire de ce qu’aime la tour.',
      'The evening’s customer: a fridge, some lights, a kettle. It asks for little, for a long time: the opposite of what the tower likes.',
    ),
    description: lf(
      'Une maison consomme surtout de petites puissances pendant des heures. Un frigo pèse de 174 à 346 kWh par an selon les chiffres publiés, soit de {fridgeDayLow} à {fridgeDayHigh} par jour, ou de {fridgeMeanLow} à {fridgeMeanHigh} en moyenne. Personne ne publie la nuit d’un foyer : le curseur va de {nightMin} à {nightMax}, c’est une hypothèse, et le lab part de {nightDefault}. Et c’est là que le modèle coince : la tour ne rend rien sous {cutInKw} au crochet, et {fridgeW} au frigo coûtent {fridgeHookKw} au crochet, soit {fridgeEta} de rendement. La maison n’est pas un mauvais client par sa consommation, mais par son rythme.',
      'A house mostly uses small powers for hours on end. A fridge takes 174 to 346 kWh a year by the published figures, that is {fridgeDayLow} to {fridgeDayHigh} a day, or {fridgeMeanLow} to {fridgeMeanHigh} on average. Nobody publishes a household’s night: the slider runs from {nightMin} to {nightMax}, an assumption, and the lab starts at {nightDefault}. And that is where the model sticks: the tower gives nothing below {cutInKw} at the hook, and {fridgeW} at the fridge costs {fridgeHookKw} at the hook, which is {fridgeEta} efficiency. The house is a poor customer not for how much it uses but for its rhythm.',
    ),
    material: l('Maison de ferme ordinaire, tableau et prises', 'An ordinary farmhouse, a board and sockets'),
    specs: [
      sp('Un frigo, par an', 'One fridge, per year', l('174 à 346 kWh', '174 to 346 kWh')),
      sp(
        'Un frigo, par jour',
        'One fridge, per day',
        lf('{fridgeDayLow} à {fridgeDayHigh}', '{fridgeDayLow} to {fridgeDayHigh}'),
      ),
      sp('Une bouilloire', 'A kettle', lf('{kettleKw}, valeur choisie', '{kettleKw}, a value we chose')),
      sp(
        'La nuit du foyer',
        'The household’s night',
        lf('{nightMin} à {nightMax}, hypothèse', '{nightMin} to {nightMax}, an assumption'),
      ),
      sp(
        'Rendu par la tour, tout droit vers la maison',
        'Given by the tower, straight to the house',
        lf(
          '{dayOutKwh} sur {dayInKwh} pris, soit {dayDirect}',
          '{dayOutKwh} for {dayInKwh} taken, that is {dayDirect}',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Pas une panne, une surprise : ce que l’on croit consommer la nuit et ce que l’on consomme vraiment. Une veille oubliée, une pompe, un congélateur font souvent la différence.',
        check:
          'Relevez votre compteur le soir et le matin pendant une semaine : c’est le seul chiffre de ce curseur qui soit vraiment le vôtre. Une pince ampèremétrique sur un frigo montre aussi sa marche par à-coups.',
        care: 'Avant de stocker quoi que ce soit, cherchez ce qui tourne la nuit sans raison. Chaque kilowattheure évité épargne, ici, plusieurs dizaines de tonnes de béton.',
      },
      {
        failure:
          'Not a breakdown, a surprise: what you think you use at night and what you really use. A forgotten standby, a pump or a freezer often make the difference.',
        check:
          'Read your meter in the evening and in the morning for a week: it is the only figure on this slider that is truly yours. A clamp meter on a fridge also shows how it runs in bursts.',
        care: 'Before storing anything, look for what runs all night for no reason. Each kilowatt-hour saved spares, here, several tens of tonnes of concrete.',
      },
    ),
    tip: lf(
      'Essayez le scénario « Passer la nuit » : {nightMin} demande {night1T}, soit {night1Towers}, et {nightMax} demande {night7T}, soit {night7Towers}, en comptant les pertes.',
      'Try the “Getting through the night” scenario: {nightMin} takes {night1T}, that is {night1Towers}, and {nightMax} takes {night7T}, that is {night7Towers}, losses counted.',
    ),
    design: lf(
      'Le frigo mérite d’être compris : ses {fridgeW}, c’est quand le moteur tourne, et il tourne par intervalles. Sur un jour, il ne demande que {fridgeMeanLow} à {fridgeMeanHigh} en moyenne : au plus ce que la machine brûle en veille.',
      'The fridge is worth understanding: its {fridgeW} is while the compressor runs, and it runs in bursts. Over a day it asks for only {fridgeMeanLow} to {fridgeMeanHigh} on average: at most what the machine burns on standby.',
    ),
  },
  {
    id: 'machine-tower',
    scene: 'site',
    category: 'structure',
    name: l('Tour de stockage', 'Storage tower'),
    short: lf(
      'La machine entière, vue de la ferme : {towerM} de treillis pour lever 20 t de 20 m et garder {grossKwh}.',
      'The whole machine, seen from the farm: {towerM} of lattice to lift 20 t through 20 m and keep {grossKwh}.',
    ),
    description: lf(
      'Vingt tonnes, vingt mètres : {grossKwh} bruts, soit une bouilloire de {kettleKw} pendant une demi-heure. La hauteur de {towerM} additionne la butée et le châssis, la pile de blocs, le palonnier et la moufle, la course, l’approche du crochet, puis le treuil et son abri. Le treuil et les blocs sont publiés ; la tour, sa fondation et le châssis sont des estimations du lab, car aucun constructeur ne vend cette machine. Le modèle rend {strokeOutWh} d’une descente à pleine vitesse, et {roundTrip} de ce que la montée a pris. Et un module de batterie de 40 kg garde {towersPerModule} : à cette échelle, la batterie gagne, et de loin.',
      'Twenty tonnes, twenty metres: {grossKwh} gross, a {kettleKw} kettle for half an hour. The height of {towerM} adds up the buffer and the carrier, the stack of blocks, the lifting beam and the hook block, the stroke, the hook’s approach, then the hoist and its canopy. The hoist and the blocks are published; the tower, its foundation and the carrier are the lab’s estimates, because no maker sells this machine. The model gets {strokeOutWh} from a descent at full speed, and {roundTrip} of what the climb took. And one 40 kg battery module holds {towersPerModule}: at this scale the battery wins, by a long way.',
    ),
    material: l(
      'Treillis d’acier galvanisé, blocs de béton, câble d’acier, treuil électrique',
      'Galvanised steel lattice, concrete blocks, steel rope, electric hoist',
    ),
    specs: [
      sp('Charge au crochet et course', 'Load at the hook and stroke', l('20 t, 20 m', '20 t, 20 m')),
      sp('Hauteur de la tour', 'Height of the tower', v('{towerM}')),
      sp('Énergie brute', 'Gross energy', lf('{grossKwh}, soit {grossMj}', '{grossKwh}, that is {grossMj}')),
      sp('Une descente rend', 'One descent gives', v('{strokeOutWh}')),
      sp(
        'Aller-retour à pleine vitesse',
        'Round trip at full speed',
        lf(
          '{roundTrip}, de {roundTripLow} à {roundTripHigh} selon les hypothèses',
          '{roundTrip}, {roundTripLow} to {roundTripHigh} depending on the assumptions',
        ),
      ),
      sp(
        'Prix, ordre de grandeur seulement',
        'Price, an order of magnitude only',
        lf('{costLow} à {costHigh}', '{costLow} to {costHigh}'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un appareil de levage vieillit partout à la fois : câble, freins, boulons de la tour, fondation, capteurs. La panne qui compte n’est pas celle qui arrête la machine, c’est celle qui ne se voit pas tant qu’on n’a pas regardé.',
        check:
          'Une inspection périodique par un organisme qualifié, avec un carnet qui suit la machine. Entre deux, une ronde à pied : aplomb de la tour, poids posé en bas, rien de neuf au sol sous la tour.',
        care: 'Posez le poids sur sa butée dès qu’il n’est pas utile en haut, pour les arrêts longs et les tempêtes annoncées. Ne laissez jamais un chantier d’entretien commencer poids en l’air.',
      },
      {
        failure:
          'A lifting machine ages everywhere at once: rope, brakes, tower bolts, foundation, sensors. The failure that matters is not the one that stops the machine, it is the one that does not show until someone looks.',
        check:
          'A periodic inspection by a qualified body, with a logbook that follows the machine. In between, a walk round: the tower plumb, the weight resting at the bottom, nothing new on the ground under the tower.',
        care: 'Rest the weight on its buffer whenever it is not useful at the top, for long stops and forecast storms. Never let a maintenance job start with the weight up.',
      },
    ),
    tip: lf(
      'Cliquez la tour pour entrer dedans. Son vrai prix n’est pas connu : l’estimation donne de {costKwhLow} à {costKwhHigh} de capacité, contre {lfpEuroPerKwh} pour le module. Le seul ordre de grandeur à retenir est cet écart.',
      'Click the tower to go inside. Its real price is not known: the estimate gives {costKwhLow} to {costKwhHigh} of capacity, against {lfpEuroPerKwh} for the module. The only order of magnitude to keep is that gap.',
    ),
    design: lf(
      'Elle a la taille en énergie de la seule machine de ce type construite en Europe, un démonstrateur de 2 × 25 t dans une tour de 15 m à Édimbourg, en 2021, qui plafonnait à {leithMaxKwh}. Le treillis laisse voir la machine et passer le vent : rien à cacher, et moins d’effort sur l’acier.',
      'In energy it is the size of the only machine of this type built in Europe, a 2 × 25 t demonstrator in a 15 m tower in Edinburgh in 2021, which topped out at {leithMaxKwh}. The lattice lets you see the machine and lets the wind through: nothing to hide, and less force on the steel.',
    ),
  },
  {
    id: 'power-shed',
    scene: 'site',
    category: 'electrical',
    name: l('Local électrique', 'Power shed'),
    short: l(
      'Le petit bâtiment où le courant change de sens : tout ce qui commande la tour tient ici, loin de la zone de chute.',
      'The small building where the current changes direction: everything that controls the tower stands here, away from the fall zone.',
    ),
    description: lf(
      'Tout ce qui parle au treuil vit dans ce local, à l’abri et hors de la zone de chute : le variateur, l’alimentation réversible, le hacheur, l’automate de sécurité, le compteur et le module de batterie. Le placer loin coûte un peu : les {cableM} de câble jusqu’au moteur perdent {downCableW} à pleine vitesse en descente. Il dégage aussi de la chaleur, car variateur et alimentation perdent près d’un kilowatt à eux deux quand le poids monte à pleine vitesse ({upInverterW} et {upSupplyW}). Cliquez-le pour y entrer : les appareils sont rangés dans l’ordre où passe le courant.',
      'Everything that talks to the hoist lives in this shed, under cover and outside the fall zone: the inverter, the regenerative supply, the chopper, the safety controller, the meter and the battery module. Putting it far away costs a little: the {cableM} of cable to the motor lose {downCableW} going down at full speed. It also gives off heat, as the inverter and the supply lose nearly a kilowatt between them when the weight climbs at full speed ({upInverterW} and {upSupplyW}). Click it to go inside: the equipment is laid out in the order the current flows.',
    ),
    material: l(
      'Petite construction maçonnée ou conteneur d’acier, ventilé, sol isolant',
      'A small masonry building or steel container, ventilated, with an insulating floor',
    ),
    specs: [
      sp('Où', 'Where', l('hors de la zone de chute', 'outside the fall zone')),
      sp('Longueur de câble jusqu’au moteur', 'Length of cable to the motor', v('{cableM}')),
      sp(
        'Chaleur, en montée à pleine vitesse',
        'Heat, climbing at full speed',
        lf(
          '{upInverterW} + {upSupplyW}, variateur et alimentation',
          '{upInverterW} + {upSupplyW}, inverter and supply',
        ),
      ),
      sp('Veille, variateur endormi', 'Standby, drive asleep', v('{controlsW}')),
      sp('Veille, variateur prêt', 'Standby, drive ready', v('{readyW}')),
    ],
    maintenance: maint(
      {
        failure:
          'La chaleur et la poussière : filtres bouchés, ventilateur grippé, condensateurs qui vieillissent plus vite. L’eau aussi, qui entre par un passage de câble mal rebouché, et les rongeurs, qui aiment les locaux tièdes.',
        check:
          'Une main devant la grille d’entrée : l’air passe-t-il ? La porte ferme-t-elle à clé ? Une inspection des passages de câbles après chaque hiver. Le relevé de la température du variateur dans son journal dit le reste.',
        care: 'Changez les filtres avant qu’ils se voient, gardez le sol libre devant les armoires, et bouchez les passages de câbles avec un produit coupe-feu.',
      },
      {
        failure:
          'Heat and dust: blocked filters, a seized fan, capacitors that age faster. Water too, coming in through a badly sealed cable entry, and rodents, which like warm rooms.',
        check:
          'A hand in front of the inlet grille: is the air moving? Does the door lock? A look at the cable entries after each winter. The inverter’s temperature log tells the rest.',
        care: 'Change the filters before they look dirty, keep the floor clear in front of the cabinets, and seal the cable entries with a fire-stopping product.',
      },
    ),
    tip: l(
      'Rangez une clé de consignation par personne dans ce local : celui qui monte à la tour garde la sienne dans sa poche, et rien ne repart sans lui.',
      'Keep one lock-out key per person in this shed: whoever climbs the tower keeps theirs in a pocket, and nothing restarts without them.',
    ),
    design: lf(
      'Le module de batterie est sur la même étagère que le reste, à portée de main. C’est voulu : voir {towersPerModule} tenir dans un coffret de 40 kg, à quelques pas d’une tour de {towerM}, vaut toutes les explications.',
      'The battery module sits on the same shelf as the rest, within arm’s reach. That is deliberate: seeing {towersPerModule} fit in a 40 kg box, a few steps from a {towerM} tower, is worth any explanation.',
    ),
  },
  {
    id: 'cable-trench',
    scene: 'site',
    category: 'electrical',
    name: l('Tranchée de câbles', 'Cable trench'),
    short: l(
      'Le chemin enterré du courant entre le local et la tour : puissance d’un côté, signaux de sécurité de l’autre.',
      'The buried path of the current between the shed and the tower: power on one side, safety signals on the other.',
    ),
    description: lf(
      'Du local au pied de la tour, le câble moteur et les fils de sécurité passent sous la cour, là où les engins ne les écrasent pas. La tranchée prend sa part des {cableM} de câble moteur, et elle est longue parce que le local doit rester hors de la zone de chute, à plus de {fenceM} de la tour. Puissance et signaux voyagent dans des fourreaux séparés : un variateur hache la tension, et son câble rayonne dans les fils voisins. Un fourreau vide de réserve ne coûte rien à la pose et évite de rouvrir la cour le jour où il faudra tirer un câble de plus.',
      'From the shed to the foot of the tower, the motor cable and the safety wires pass under the yard, where vehicles cannot crush them. The trench takes its share of the {cableM} of motor cable, and it is long because the shed must stay outside the fall zone, more than {fenceM} from the tower. Power and signals travel in separate ducts: an inverter chops its voltage, and its cable radiates into wires nearby. A spare empty duct costs nothing when laying and saves reopening the yard the day another cable is needed.',
    ),
    material: l(
      'Fourreaux annelés sur lit de sable, grillage avertisseur, remblai compacté',
      'Corrugated ducts on a sand bed, warning mesh, compacted backfill',
    ),
    specs: [
      sp('Câble moteur en tout', 'Motor cable in all', lf('{cableM} de {cableMm2}', '{cableM} of {cableMm2}')),
      sp('Puissance et signaux', 'Power and signals', l('fourreaux séparés', 'separate ducts')),
      sp(
        'Ce qui passe',
        'What passes',
        l('moteur, terre, portail, vent, fins de course', 'motor, earth, gate, wind, limit switches'),
      ),
      sp('Perte du câble, descente à pleine vitesse', 'Cable loss, full-speed descent', v('{downCableW}')),
    ],
    maintenance: maint(
      {
        failure:
          'Le coup de pioche ou de godet, le plus fréquent. Puis l’eau dans un fourreau mal bouché, et un isolant qui vieillit sous l’effet de la tension hachée du variateur.',
        check:
          'Un contrôle d’isolement du câble moteur, à l’arrêt et consigné, une fois par an : une valeur qui baisse se voit bien avant le défaut. Un repérage sur le plan avant de creuser quoi que ce soit dans la cour.',
        care: 'Tenez à jour le plan de récolement avec son tracé, gardez lisibles les bornes en surface, et rebouchez les fourreaux aux deux bouts.',
      },
      {
        failure:
          'A pick or a digger bucket, the most common. Then water in a badly sealed duct, and insulation ageing under the inverter’s chopped voltage.',
        check:
          'An insulation test of the motor cable, stopped and locked out, once a year: a falling value shows long before the fault. A look at the plan before digging anything in the yard.',
        care: 'Keep the as-built plan up to date with the route, keep the surface markers readable, and seal the ducts at both ends.',
      },
    ),
    tip: l(
      'Le grillage avertisseur, posé au-dessus des câbles, est là pour le prochain qui creuse : c’est lui qui remonte dans le godet avant le câble.',
      'The warning mesh, laid above the cables, is there for the next person who digs: it comes up in the bucket before the cable does.',
    ),
    design: lf(
      'Ce câble est une vraie perte, pas un détail : {downCableW} sur une descente, et {cutCableW} même à la vitesse où la machine ne rend plus rien, parce que le courant du moteur ne baisse pas avec la vitesse.',
      'This cable is a real loss, not a detail: {downCableW} on a descent, and {cutCableW} even at the speed where the machine gives nothing back, because the motor’s current does not fall with the speed.',
    ),
  },
  {
    id: 'grid-connection',
    scene: 'site',
    category: 'electrical',
    name: l('Branchement au réseau', 'Grid connection'),
    short: l(
      'Le 400 V de la ferme : c’est lui qui donne un endroit où renvoyer l’énergie quand le poids descend.',
      'The farm’s 400 V: this is what gives the energy somewhere to go when the weight comes down.',
    ),
    description: lf(
      'Un moteur qui freine une charge fabrique du courant, et ce courant doit aller quelque part. Le réseau triphasé de la ferme joue ce rôle : l’alimentation réversible y renvoie jusqu’à {meterDownKw} en descente, que la maison consomme ou non. Sans lui, ou sans une batterie bien dimensionnée, la machine n’a plus qu’une résistance pour brûler sa puissance, et elle s’arrête. Le raccordement d’une machine qui injecte demande l’accord du gestionnaire de réseau : il impose une protection qui la déconnecte si le réseau disparaît, pour que personne ne travaille sur une ligne encore alimentée.',
      'A motor braking a load makes current, and that current must go somewhere. The farm’s three-phase grid plays that part: the regenerative supply sends back up to {meterDownKw} on the way down, whether the house is using it or not. Without it, or without a properly sized battery, the machine has only a resistor to burn its power, and it stops. Connecting a machine that feeds power back needs the grid operator’s agreement: it requires a protection that disconnects if the grid goes, so that nobody is working on a line that is still live.',
    ),
    material: l(
      'Coffret de branchement, câble triphasé, protection de découplage',
      'Service cabinet, three-phase cable, grid-disconnection protection',
    ),
    specs: [
      sp('Tension', 'Voltage', l('400 V triphasé', '400 V three-phase')),
      sp('Pris, pleine montée', 'Taken, full climb', v('{meterUpKw}')),
      sp('Rendu, pleine descente', 'Given, full descent', v('{meterDownKw}')),
      sp(
        'Si le réseau tombe',
        'If the grid goes',
        l('hacheur et résistance sur la rampe, puis les freins', 'chopper and resistor over the ramp, then the brakes'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un réseau de campagne faible : une tension qui monte quand la machine injecte, et une protection qui coupe. Aussi le serrage qui prend du jeu dans un coffret exposé aux variations de température.',
        check:
          'Relevez la tension au coffret pendant une descente à pleine vitesse : si elle sort des limites, la protection a raison et le gestionnaire doit le savoir. Le journal de l’alimentation réversible garde les coupures.',
        care: 'Laissez ce coffret au gestionnaire et à un électricien qualifié. Une protection de découplage se teste à chaque visite, et son rapport se garde.',
      },
      {
        failure:
          'A weak rural grid: a voltage that rises when the machine feeds in, and a protection that cuts out. Also terminals working loose in a cabinet exposed to swings of temperature.',
        check:
          'Read the voltage at the cabinet during a full-speed descent: if it goes outside the limits, the protection is right and the operator should know. The regenerative supply’s log keeps the cut-outs.',
        care: 'Leave this cabinet to the operator and a qualified electrician. A disconnection protection is tested at each visit, and its report is kept.',
      },
    ),
    tip: l(
      'Lancez le scénario « Coupure de courant » : c’est ce branchement qui manque. Le poids ne tombe pas, il s’arrête sur ses freins, et il ne repart pas tout seul au retour du réseau.',
      'Run the “Power cut” scenario: this connection is what goes missing. The weight does not fall, it stops on its brakes, and it does not start again by itself when the grid returns.',
    ),
    design: lf(
      'Au réseau, la tour n’a pas besoin de trouver un client à chaque seconde : les {meterDownKw} partent, et la ferme les rachète plus tard. C’est le contrat d’énergie qui décide alors si tout cela vaut la peine, pas la physique.',
      'On the grid, the tower need not find a customer every second: the {meterDownKw} go out, and the farm buys them back later. It is then the energy contract that decides whether all this is worth it, not the physics.',
    ),
  },
  {
    id: 'exclusion-fence',
    scene: 'site',
    category: 'site',
    name: l('Clôture de sécurité', 'Exclusion fence'),
    short: lf(
      'La zone de chute rendue visible : un cercle de {fenceM} de rayon où personne n’a à passer quand le poids est en l’air.',
      'The fall zone made visible: a circle of {fenceM} radius where nobody has any business when the weight is up.',
    ),
    description: lf(
      'Aucune règle trouvée ne dit quel rayon il faut : le lab en prend un égal à la hauteur de la tour, {fenceM}, parce que c’est là qu’elle arriverait si elle tombait. Le chiffre est une hypothèse, sa conséquence est très concrète : {fenceArea} de cour réservés à une machine qui garde {grossKwh}. La clôture ne protège personne d’un poids qui tomberait, elle tient simplement les gens hors de portée. Elle dit aussi une chose qu’on oublie : le coût d’une telle tour se compte aussi en terrain, et en voisins à prévenir.',
      'No rule that could be found says what radius is needed: the lab takes one equal to the tower’s height, {fenceM}, because that is where it would land if it fell. The figure is an assumption, and its consequence is very concrete: {fenceArea} of yard set aside for a machine that keeps {grossKwh}. The fence protects nobody from a falling weight, it simply keeps people out of reach. It also says something easily forgotten: the cost of such a tower is counted in land too, and in neighbours to warn.',
    ),
    material: l(
      'Panneaux de grillage rigide sur poteaux d’acier galvanisé, panneaux d’interdiction',
      'Rigid mesh panels on galvanised steel posts, prohibition signs',
    ),
    specs: [
      sp('Rayon', 'Radius', lf('{fenceM}, la hauteur de la tour', '{fenceM}, the height of the tower')),
      sp('Surface réservée', 'Area set aside', v('{fenceArea}')),
      sp('Règle', 'Rule', l('aucune trouvée : c’est un choix du lab', 'none found: this is the lab’s choice')),
      sp(
        'Ce qu’elle garde',
        'What it keeps',
        l('les gens hors de portée, pas le poids', 'people out of reach, not the weight'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une clôture à la ferme finit toujours ouverte quelque part : un panneau enfoncé par un engin, une brèche pratique pour passer, un portail attaché avec une ficelle.',
        check:
          'Faites-en le tour à pied chaque mois. Cherchez aussi ce qui s’est installé dedans : un tas de bois, un engin garé, des outils. Une zone de chute se remplit toute seule.',
        care: 'Réparez la moindre brèche le jour même, gardez dégagé le passage pour les secours, et laissez les panneaux lisibles côté champ comme côté cour.',
      },
      {
        failure:
          'A fence on a farm always ends up open somewhere: a panel flattened by a vehicle, a handy gap to walk through, a gate tied up with string.',
        check:
          'Walk round it each month. Look also for what has settled inside: a woodpile, a parked vehicle, tools. A fall zone fills up by itself.',
        care: 'Mend any gap the same day, keep the way clear for the emergency services, and keep the signs readable from the field as well as the yard.',
      },
    ),
    tip: l(
      'Quand vous placez un tas de bois ou une remorque, demandez-vous si vous les poseriez sous une grue. Dans ce cercle, c’est la même question.',
      'When you put down a woodpile or a trailer, ask whether you would leave it under a crane. Inside this circle, it is the same question.',
    ),
    design: lf(
      'Un vieux puits de mine a déjà résolu ce problème : son poids descend sous terre, et rien ne peut en tomber sur une cour. Ici, sur une plaine, la clôture de {fenceM} est le prix à payer pour une hauteur construite plutôt que creusée.',
      'An old mine shaft has already solved this: its weight goes down under ground, and nothing from it can land on a yard. Here on a plain, the {fenceM} fence is the price of height that is built rather than dug.',
    ),
  },
  {
    id: 'interlocked-gate',
    scene: 'site',
    category: 'site',
    name: l('Portail asservi', 'Interlocked gate'),
    short: l(
      'L’entrée de la zone de chute : l’ouvrir arrête la machine, freins fermés, avant que quiconque soit dessous.',
      'The way into the fall zone: opening it stops the machine, brakes closed, before anyone is underneath.',
    ),
    description: l(
      'Un portail n’empêche pas d’entrer, mais il peut faire en sorte que la machine le sache. Ce contact est relié à l’automate de sécurité par deux voies indépendantes : si l’une casse, l’autre coupe encore, et si elles ne disent plus la même chose la machine s’arrête. La meilleure version utilise une clé prisonnière : la clé qui ouvre le portail doit d’abord être retirée au local, ce qui arrête tout, et elle reste dans la poche de celui qui entre. La machine ne repart pas seule à la fermeture : il faut un geste volontaire, depuis l’extérieur.',
      'A gate does not prevent anyone from entering, but it can make sure the machine knows. This contact is tied to the safety controller by two separate channels: if one breaks the other still cuts, and if they disagree the machine stops. The best version uses a trapped key: the key that opens the gate must first be taken from the shed, which stops everything, and it stays in the pocket of whoever goes in. The machine does not restart by itself on closing: it takes a deliberate action, from outside.',
    ),
    material: l(
      'Vantail d’acier galvanisé, interrupteur de sécurité à deux voies, serrure à clé prisonnière',
      'Galvanised steel gate, two-channel safety switch, trapped-key lock',
    ),
    specs: [
      sp('Effet', 'Effect', l('arrêt de la machine, freins fermés', 'machine stopped, brakes closed')),
      sp('Câblage', 'Wiring', l('deux voies vers l’automate de sécurité', 'two channels to the safety controller')),
      sp(
        'Redémarrage',
        'Restart',
        l('jamais seul : un geste depuis l’extérieur', 'never by itself: an action from outside'),
      ),
      sp('Dans la simulation', 'In the simulation', l('un interrupteur à essayer', 'a switch to try')),
    ],
    maintenance: maint(
      {
        failure:
          'Le contact shunté « juste pour aujourd’hui », le plus grave et le plus banal. Puis la languette tordue par un vantail qui claque, le gel, et l’humidité dans le contact.',
        check:
          'Machine en mouvement lent, ouvrez le portail : elle doit s’arrêter tout de suite, et ne pas repartir à la fermeture. Tenez ce geste dans le carnet, à date fixe, avec un nom en face.',
        care: 'Réglez le vantail pour qu’il ne heurte pas le contact, graissez les gonds, et tenez une clé de rechange sous clé, chez un responsable seulement.',
      },
      {
        failure:
          'The contact bridged “just for today”, the most serious fault and the most ordinary. Then the tongue bent by a slamming gate, frost, and damp in the contact.',
        check:
          'With the machine moving slowly, open the gate: it must stop at once, and not start again on closing. Keep that test in the logbook, on a fixed date, with a name against it.',
        care: 'Adjust the gate so that it does not strike the contact, grease the hinges, and keep a spare key under lock, with one responsible person only.',
      },
    ),
    tip: l(
      'Essayez dans la Simulation : ouvrez le portail en pleine descente et regardez la rampe, puis les freins. Le poids ne s’arrête pas net : il finit sa rampe, et c’est voulu.',
      'Try it in the Simulation: open the gate in mid-descent and watch the ramp, then the brakes. The weight does not stop dead: it finishes its ramp, on purpose.',
    ),
    design: l(
      'L’arrêt passe par l’automate de sécurité et non par le variateur : même si le variateur se trompe, le contacteur s’ouvre et les ressorts ferment les freins. Une sécurité ne doit jamais dépendre de ce qu’elle surveille.',
      'The stop goes through the safety controller, not through the inverter: even if the inverter gets it wrong, the contactor opens and the springs close the brakes. A safety function must never depend on what it is watching.',
    ),
  },
  {
    id: 'wind-mast',
    scene: 'site',
    category: 'electrical',
    name: l('Mât anémométrique', 'Wind mast'),
    short: lf(
      'Il arrête la machine au-dessus de {windStop}. Ce n’est pas le poids qui gêne : ce sont la tour, et ceux qui y travaillent.',
      'It stops the machine above {windStop}. The weight is not the trouble: the tower is, and those who work on it.',
    ),
    description: lf(
      'L’objection la plus connue contre les tours à blocs, c’est le vent qui balance la charge. Ici le poids court entre des rails, et le modèle trouve que juste sous le seuil le vent n’ajoute que {windFriction} aux frottements des guides, eux-mêmes {guideShare} de la puissance. Le mât ne protège donc pas le rendement : il protège la tour et les gens, en reposant la machine quand le vent dépasse {windStop}. Elle ne repart que {windBand} sous ce seuil, pour ne pas battre sans arrêt autour de lui. Le seuil est une hypothèse de ce lab, et le modèle ne calcule pas la tour elle-même dans le vent.',
      'The best-known objection to block towers is the wind swinging the load. Here the weight runs between rails, and the model finds that just under the limit the wind adds only {windFriction} to the friction of the guides, themselves {guideShare} of the power. So the mast does not protect the efficiency: it protects the tower and the people, by stopping the machine when the wind passes {windStop}. It restarts only {windBand} below that limit, so as not to keep flapping around it. The limit is this lab’s assumption, and the model does not calculate the tower itself in the wind.',
    ),
    material: l(
      'Mât d’acier galvanisé, anémomètre à ultrasons ou à coupelles, parafoudre',
      'Galvanised steel mast, ultrasonic or cup anemometer, surge arrester',
    ),
    specs: [
      sp('Arrêt au-dessus de', 'Stops above', v('{windStop}')),
      sp('Reprise', 'Restarts', lf('{windBand} sous le seuil', '{windBand} under the limit')),
      sp(
        'Effet du vent sur le poids, sous le seuil',
        'Wind’s effect on the weight, under the limit',
        lf('{windFriction} de frottement de plus', '{windFriction} more friction'),
      ),
      sp('Si le signal se perd', 'If the signal is lost', l('la machine s’arrête', 'the machine stops')),
    ],
    maintenance: maint(
      {
        failure:
          'Des coupelles qui se grippent et lisent trop bas, le côté dangereux. Le givre sur le capteur, et la foudre sur un mât isolé dans la plaine, qui remonte par le câble jusqu’à l’automate.',
        check:
          'Comparez sa lecture avec une station voisine les jours de vent. Débranchez le signal lors d’un essai : la machine doit se mettre à l’arrêt, pas continuer sur la dernière valeur.',
        care: 'Un capteur à ultrasons n’a pas de pièce mobile et supporte mieux le givre s’il est chauffé. Vérifiez le parafoudre après chaque orage proche, et la mise à la terre du mât.',
      },
      {
        failure:
          'Cups that seize and read too low, the dangerous side. Rime on the sensor, and lightning on a lone mast on the plain, travelling down the cable to the controller.',
        check:
          'Compare its reading with a nearby station on windy days. Unplug the signal during a test: the machine must stop, not carry on with the last value.',
        care: 'An ultrasonic sensor has no moving part and copes better with rime if heated. Check the surge arrester after each nearby storm, and the mast’s earthing.',
      },
    ),
    tip: l(
      'Le scénario « Le vent se lève » fait monter le vent puis redescendre : regardez à quel moment elle repart, et pourquoi ce n’est pas au même chiffre que l’arrêt.',
      'The “The wind gets up” scenario raises the wind and lets it fall: watch when it starts again, and why that is not at the same figure as the stop.',
    ),
    design: l(
      'Le capteur est en hauteur et loin de la tour, car une tour en treillis trouble le vent juste à côté d’elle. Il vaut mieux qu’il lise un peu trop haut qu’un peu trop bas : dans le doute, la machine reste à l’arrêt, et l’on perd seulement du temps.',
      'The sensor is up high and away from the tower, because a lattice tower disturbs the wind right beside it. Better that it reads a little high than a little low: in doubt the machine stays stopped, and only time is lost.',
    ),
  },
  {
    id: 'block-yard',
    scene: 'site',
    category: 'site',
    name: l('Aire à blocs', 'Block yard'),
    short: lf(
      'Blocs de rechange et sol dur pour la grue : ici se voit par quel chemin {stackT} de béton sont arrivées à la tour.',
      'Spare blocks and hard ground for the crane: this is where you see how {stackT} of concrete reached the tower.',
    ),
    description: lf(
      'Une machine qui lève 20 t a besoin d’un sol qui porte une grue et d’une aire où poser le béton. Ces blocs sont du béton ordinaire, et ils pèsent environ 2,4 t pièce : à la ferme on les pose à la grue mobile ou au gros chariot télescopique, par beau temps. La pile de la tour fait {stackM3} de béton, soit de {co2TowerLow} à {co2TowerHigh} de CO₂ s’ils sont neufs, contre {co2LfpLow} à {co2LfpHigh} pour un pack de batterie de même énergie, ordres de grandeur seulement. Des blocs de rebut, invendus ou déjà utilisés, changent ce calcul du tout au tout : c’est l’argument le plus honnête de la gravité.',
      'A machine that lifts 20 t needs ground that can carry a crane and a yard to put the concrete on. These blocks are ordinary concrete, about 2.4 t each: on a farm they are set down by a mobile crane or a large telehandler, in fair weather. The tower’s stack is {stackM3} of concrete, that is {co2TowerLow} to {co2TowerHigh} of CO₂ if the blocks are new, against {co2LfpLow} to {co2LfpHigh} for a battery pack of the same energy, orders of magnitude only. Reject blocks, unsold or already used, change that sum completely: it is gravity’s most honest argument.',
    ),
    material: l(
      'Empierrement compacté, blocs de béton de rebut ou neufs',
      'Compacted hardcore, reject or new concrete blocks',
    ),
    specs: [
      sp('Un bloc', 'One block', l('1,6 × 0,8 × 0,8 m, environ 2,4 t', '1.6 × 0.8 × 0.8 m, about 2.4 t')),
      sp('Béton de la pile', 'Concrete in the stack', v('{stackM3}')),
      sp(
        'CO₂ de la pile, blocs neufs',
        'CO₂ of the stack, new blocks',
        lf('{co2TowerLow} à {co2TowerHigh}', '{co2TowerLow} to {co2TowerHigh}'),
      ),
      sp(
        'CO₂ d’un pack de même énergie',
        'CO₂ of a pack of the same energy',
        lf('{co2LfpLow} à {co2LfpHigh}', '{co2LfpLow} to {co2LfpHigh}'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un sol qui se tasse sous les béquilles d’une grue, le risque réel de cette aire. Ensuite des blocs posés en porte-à-faux qui s’épaufrent, et des anneaux de levage rouillés dans le béton.',
        check:
          'Avant toute levée, regardez le terrain après la pluie et faites contrôler la portance par l’équipe de levage. Sur chaque bloc, regardez l’état de l’anneau et cherchez une fissure qui le traverse.',
        care: 'Empilez à plat, sur des chevrons, en gardant une allée pour l’engin. Refusez un bloc fissuré : dans la pile, il ne pèsera pas moins, mais il risque de lâcher ses morceaux.',
      },
      {
        failure:
          'Ground sinking under a crane’s outriggers, the real risk of this yard. After that, blocks set down overhanging that chip, and lifting eyes rusted into the concrete.',
        check:
          'Before any lift, look at the ground after rain and have the lifting crew check what it will bear. On each block, look at the eye and look for a crack running through it.',
        care: 'Stack flat, on timbers, leaving a lane for the machine. Refuse a cracked block: in the stack it will weigh no less, but it may shed its pieces.',
      },
    ),
    tip: lf(
      'Le poids d’une tour à blocs peut être n’importe quoi de lourd. Un bloc de {blockM3}, levé de 20 m, garde {blockWh}, soit {blockKettleMin} de bouilloire. Ça ne change jamais, quelle que soit la matière.',
      'A block tower’s weight can be anything heavy. A {blockM3} block, raised 20 m, keeps {blockWh}, that is {blockKettleMin} of kettle. That never changes, whatever the material.',
    ),
    design: l(
      'La masse n’a rien de sophistiqué, c’est ce qui fait son charme : pas de chimie, pas d’usure, pas de terres rares. L’aire reste en place après le montage, parce qu’on doit pouvoir retirer des blocs, les remplacer, ou démonter la machine un jour.',
      'The mass is nothing clever, and that is its charm: no chemistry, no wear, no rare earths. The yard stays after assembly, because blocks must be removable and replaceable, and the machine must come down one day.',
    ),
  },
];
