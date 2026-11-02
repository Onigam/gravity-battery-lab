// Installation guide (10 steps): what connects the tower to the farm, in the order a qualified electrician would follow, explained rather than
// ready to build. It crosses `site` and `power-room`. Every part of `power-room` is installed once; `cable-trench`, `power-shed`, `interlocked-gate`, `wind-mast`
// and `grid-connection` on the site. The `energy-meter` comes back in step 10, since the commissioning is read on it.
//
//   1  trench      `site`        the shed, the trench, and the two sensors the trench reaches (gate, mast)
//   2  grid        `site`        the agreement with the operator, then the connection: the law's one mention in this guide
//   3  panel       `power-room`  main panel, meter, solar inverter
//   4  supply      `power-room`  regenerative supply and DC link: the DC link's warning, said once here
//   5  inverter    `power-room`  hoist inverter and motor cable
//   6  chopper     `power-room`  chopper and resistor
//   7  safety      `power-room`  safety controller, emergency stops, and the chain read as a whole
//   8  ups         `power-room`  control UPS
//   9  battery     `power-room`  battery inverter and module
//  10  commission  `power-room`  one stroke empty, one loaded, the meter read both ways
//
// Each country's rule is said once, in general terms, in step 2 and the Sources. No duration is given (no source has one), no torque, no cable size beyond the model's.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'trench',
    scene: 'site',
    title: l('Le local, la tranchée et les capteurs de la cour', 'The shed, the trench and the yard’s sensors'),
    text: lf(
      'Le **local électrique** se pose hors de la zone de chute, à plus de {fenceM} de la tour. La **tranchée de câbles** le relie au pied de la tour : un fourreau pour le moteur, un autre pour les signaux, et un de réserve. Elle dessert aussi le **portail asservi** et le **mât anémométrique**, chacun avec son câble à deux voies : il vaut mieux les poser en même temps que tout creuser deux fois. Le grillage avertisseur se déroule au-dessus, et le tracé se note sur le plan.',
      'The **power shed** goes outside the fall zone, more than {fenceM} from the tower. The **cable trench** ties it to the foot of the tower: one duct for the motor, another for signals, and a spare. It also serves the **interlocked gate** and the **wind mast**, each with its two-channel cable: better to lay them at the same time than dig everything twice. The warning mesh is rolled out on top, and the route noted on the plan.',
    ),
    parts: ['power-shed', 'cable-trench', 'interlocked-gate', 'wind-mast'],
    tools: [l('Mini-pelle', 'Mini digger'), l('Fourreaux, grillage avertisseur', 'Ducts, warning mesh')],
    tip: l(
      'Photographiez la tranchée ouverte avec un mètre posé dedans : dans dix ans, personne ne se rappellera où passent les câbles.',
      'Photograph the open trench with a tape laid in it: in ten years’ time, nobody will remember where the cables run.',
    ),
  },
  {
    id: 'grid',
    scene: 'site',
    title: l('L’accord du gestionnaire, puis le branchement', 'The operator’s agreement, then the connection'),
    text: lf(
      'Une machine qui renvoie jusqu’à {meterDownKw} sur le réseau ne se branche pas sans accord. Le gestionnaire de réseau étudie le **branchement au réseau**, fixe la protection de découplage, et demande parfois de renforcer la ligne. Un réseau de campagne faible peut refuser ces rafales, ou voir sa tension monter à chaque descente. Le raccordement lui-même se fait par un électricien qualifié, et sa mise en service par le gestionnaire. Cette démarche précède tout achat de matériel.',
      'A machine sending up to {meterDownKw} back to the grid is not connected without an agreement. The grid operator studies the **grid connection**, sets the disconnection protection, and sometimes asks for the line to be reinforced. A weak rural grid may refuse these bursts, or see its voltage rise at each descent. The connection itself is made by a qualified electrician, and commissioned by the operator. This step comes before buying any equipment.',
    ),
    parts: ['grid-connection'],
    tools: [l('Dossier de raccordement', 'Connection file'), l('Électricien qualifié', 'Qualified electrician')],
    warning: l(
      'Ce lab ne donne aucun avis juridique : en France, adressez-vous au gestionnaire de réseau, en Suisse à votre distributeur, et à un électricien qualifié pour les règles de câblage.',
      'This lab gives no legal advice: ask your grid operator about the connection, and a qualified electrician about the wiring rules of your country.',
    ),
  },
  {
    id: 'panel',
    scene: 'power-room',
    title: l(
      'Le tableau général, le compteur et l’onduleur solaire',
      'The main panel, the meter and the solar inverter',
    ),
    text: lf(
      'Le **tableau général** rassemble les quatre lignes : réseau, soleil, maison, machine. L’**onduleur solaire** y arrive déjà, avec les {pvKwp} du toit. Le **compteur d’énergie** se place sur la ligne de la machine, avant tout le reste, de façon à compter ce qui monte et ce qui descend. Vérifiez le sens des tores : c’est lui qui rend le rendement réel. On laisse tout hors tension et consigné : ce tableau sera alimenté en dernier.',
      'The **main AC panel** gathers the four lines: grid, sun, house, machine. The **solar inverter** already arrives there, with the roof’s {pvKwp}. The **energy meter** goes on the machine’s line, ahead of everything else, so as to count what goes up and what comes down. Check the direction of the current transformers: that is what makes the efficiency real. Everything stays off and locked out: this panel is powered last.',
    ),
    parts: ['ac-panel', 'energy-meter', 'pv-inverter'],
    tools: [
      l('Outillage d’électricien isolé', 'Insulated electrician’s tools'),
      l('Vérificateur d’absence de tension', 'Voltage tester'),
    ],
    warning: l(
      'Ce tableau reçoit plusieurs sources : le soleil reste présent le jour, même si le réseau est coupé. Consignez chacune, puis vérifiez.',
      'This panel has several sources: the sun is still there by day, even with the grid off. Lock out each one, then check.',
    ),
  },
  {
    id: 'supply',
    scene: 'power-room',
    title: l('L’alimentation réversible et le bus continu', 'The regenerative supply and the DC link'),
    text: lf(
      'L’**alimentation réversible** est la pièce que le lab ajoute au treuil publié : elle se raccorde entre le tableau et le **bus continu**. Ce bus, à environ {dcV}, relie ses condensateurs au variateur par des barres courtes et bien isolées. On vérifie la présence de ses résistances de décharge, car elles feront la différence le jour où quelqu’un ouvrira cette armoire. Rien n’est encore mis sous tension : la première charge sera lente, à travers la précharge.',
      'The **regenerative supply** is the part the lab adds to the published hoist: it connects between the panel and the **DC link**. This link, at about {dcV}, ties its capacitors to the inverter by short, well-insulated bars. You check that its discharge resistors are there, since they make the difference the day someone opens this cabinet. Nothing is powered yet: the first charge will be slow, through the pre-charge.',
    ),
    parts: ['regen-supply', 'dc-link'],
    tools: [l('Voltmètre adapté au continu', 'Voltmeter rated for DC'), l('Outillage isolé', 'Insulated tools')],
    warning: lf(
      'Le bus reste chargé après la coupure : le modèle y voit encore {dc20s} une vingtaine de secondes plus tard. Attendez le temps indiqué sur l’appareil, puis mesurez. Le voyant ne remplace pas le voltmètre.',
      'The link stays charged after power-off: the model still sees {dc20s} there some twenty seconds later. Wait for the time stated on the device, then measure. The lamp does not replace the voltmeter.',
    ),
  },
  {
    id: 'inverter',
    scene: 'power-room',
    title: l('Le variateur et le câble moteur', 'The hoist inverter and the motor cable'),
    text: lf(
      'Le **variateur de levage** se monte dans l’armoire, avec de la place pour son air. Le **câble moteur**, blindé, part de là, passe la tranchée, monte la tour le long d’un montant, et finit à la boîte à bornes : {cableM} en tout. Sa tresse se relie à la terre à chaque bout, sinon il perturbe tout le reste. Viennent les paramètres du moteur et du codeur, puis une sauvegarde de ces réglages, à garder dans le carnet de la machine.',
      'The **hoist inverter** goes in the cabinet, with room for its air. The shielded **motor cable** leaves from there, passes along the trench, climbs the tower along a leg, and ends at the terminal box: {cableM} in all. Its braid is bonded to earth at each end, or it disturbs everything else. Next come the motor and encoder settings, then a backup of them, to keep in the machine’s logbook.',
    ),
    parts: ['motor-inverter', 'motor-cable'],
    tools: [l('Contrôleur d’isolement', 'Insulation tester'), l('Console de paramétrage', 'Setup console')],
    tip: l(
      'Faites un contrôle d’isolement avant le raccordement et gardez la valeur : elle servira de référence pour les années suivantes.',
      'Do an insulation test before connecting up and keep the value: it will be the reference for the years to come.',
    ),
  },
  {
    id: 'chopper',
    scene: 'power-room',
    title: l('Le hacheur et la résistance', 'The chopper and the resistor'),
    text: lf(
      'Le **hacheur de freinage** est intégré au variateur, et il s’ouvre à {chopperV} sur le bus. La **résistance de freinage** se place à part, à l’air, loin de tout ce qui brûle. Elle est dimensionnée pour la rampe d’une coupure, et non pour une descente entière : le modèle y voit une pointe de {chopperKw}, mais seulement {dumpedWh}. Le tout donne à la machine un endroit où aller si le réseau disparaît : sans cela, elle ne saurait pas s’arrêter en sécurité.',
      'The **brake chopper** is built into the inverter, and opens at {chopperV} on the link. The **brake resistor** stands apart, in the air, away from anything that burns. It is sized for the ramp of a power cut, not for a whole descent: the model sees a peak of {chopperKw} there, but only {dumpedWh}. Together they give the machine somewhere to go if the grid disappears: without them, it could not stop safely.',
    ),
    parts: ['brake-chopper', 'brake-resistor'],
    tools: [l('Ohmmètre', 'Ohmmeter'), l('Outillage isolé', 'Insulated tools')],
    tip: l(
      'Relevez sa valeur en ohms et notez-la sur la plaque du coffre : ce sera le premier chiffre à comparer après un incident.',
      'Note its value in ohms on the box’s plate: it will be the first figure to compare after an incident.',
    ),
  },
  {
    id: 'safety',
    scene: 'power-room',
    title: l('La chaîne de sécurité', 'The safety chain'),
    text: lf(
      'L’**automate de sécurité** reçoit le portail, le vent, les fins de course, les limiteurs et les **arrêts d’urgence**, chacun en deux voies. Il tient seul le contacteur et l’alimentation des freins. On teste entrée par entrée, sans aucune charge, chacune devant couper et laisser sa trace dans le journal. Le seuil de vent de {windStop} est une hypothèse du lab. Sur une vraie tour, il viendrait du calcul de structure et du constructeur.',
      'The **safety controller** takes in the gate, the wind, the limit switches, the governors and the **emergency stops**, each on two channels. It alone holds the contactor and the brakes’ supply. Inputs are tested one by one, with no load, each having to cut and leave its trace in the log. The wind limit of {windStop} is an assumption of this lab. On a real tower it would come from the structural design and the maker.',
    ),
    parts: ['safety-controller', 'emergency-stop'],
    tools: [l('Liste d’essais écrite', 'Written test list'), l('Multimètre', 'Multimeter')],
    tip: l(
      'Écrivez la liste avant de commencer, et faites-la signer : c’est elle qui deviendra la routine des années suivantes.',
      'Write the list before starting, and have it signed: it will become the routine for the years ahead.',
    ),
  },
  {
    id: 'ups',
    scene: 'power-room',
    title: l('L’onduleur de contrôle', 'The control UPS'),
    text: lf(
      'L’**onduleur de contrôle** alimente l’automate, les capteurs et le journal, jamais la puissance. On le raccorde en dernier sur cette partie, et on l’essaie en coupant son entrée : l’automate doit rester éveillé et dire qu’il tourne sur réserve. Ce petit appareil compte dans la veille de {controlsW} de la machine. Une tour qui garde {grossKwh} ne peut pas se payer beaucoup plus : c’est {controlsKwhDay} par jour.',
      'The **control UPS** supplies the controller, the sensors and the log, never the power side. It is connected last in this part, and tried by cutting its input: the controller must stay awake and say it is running on reserve. This small device counts in the machine’s {controlsW} standby. A tower holding {grossKwh} cannot afford much more: that is {controlsKwhDay} a day.',
    ),
    parts: ['control-ups'],
    tools: [l('Multimètre', 'Multimeter')],
    tip: l(
      'Notez sa date de mise en service sur le boîtier : sa batterie sera à changer bien avant que tout le reste ne vieillisse.',
      'Write the date it went into service on its casing: its battery will need changing long before anything else ages.',
    ),
  },
  {
    id: 'battery',
    scene: 'power-room',
    title: l('L’onduleur batterie et le module', 'The battery inverter and the module'),
    text: lf(
      'Le **module LFP** se pose sur son étagère, 40 kg, avec son fusible, et l’**onduleur batterie** le relie au tableau. La communication entre eux donne les vraies limites de courant : 50 A conseillés. C’est lui qui rend la machine utile à la maison : la tour se vide en rafale dans le module quand il tombe à {socLow}, et le module suit la maison. Ce module garde à lui seul {towersPerModule} : à quoi sert alors la tour ? Le lab pose la question.',
      'The **LFP module** goes on its shelf, 40 kg, with its fuse, and the **battery inverter** ties it to the panel. The communication between them gives the true current limits: 50 A recommended. This is what makes the machine useful to the house: the tower empties in a burst into the module when it falls to {socLow}, and the module follows the house. This module alone holds {towersPerModule}: so what is the tower for? The lab asks that question.',
    ),
    parts: ['battery-inverter', 'lfp-module'],
    tools: [l('Outillage isolé', 'Insulated tools'), l('Deux personnes pour le porter', 'Two people to carry it')],
    warning: l(
      'Un court-circuit sur ce module délivre un courant énorme, sans que rien ne l’arrête avant le fusible : outils isolés, bagues et montres retirées.',
      'A short circuit on this module delivers enormous current, with nothing to stop it before the fuse: insulated tools, rings and watches off.',
    ),
  },
  {
    id: 'commission',
    scene: 'power-room',
    title: l('La mise en service : une course à vide, une en charge', 'Commissioning: one stroke empty, one loaded'),
    text: lf(
      'Tout se vérifie d’abord à vide, puis avec le poids, en lisant le **compteur d’énergie** dans les deux sens. Une course complète doit coûter environ {strokeInKwh} et rendre environ {strokeOutWh}, si le modèle dit vrai, soit {roundTrip} : personne n’a mesuré une machine de cette taille, ce relevé sera donc le premier. Essayez enfin le plus lent : sous {cutInKw} au crochet, la machine ne doit plus rien rendre. On note ces chiffres dans le carnet : ils serviront de référence.',
      'Everything is checked empty first, then with the weight, reading the **energy meter** both ways. A full stroke should cost about {strokeInKwh} and give back about {strokeOutWh}, if the model is right, that is {roundTrip}: nobody has measured a machine of this size, so this reading will be the first. Finally try the slowest: below {cutInKw} at the hook, the machine should give nothing back. These figures go in the logbook: they will be the reference.',
    ),
    parts: ['energy-meter'],
    tools: [l('Carnet de la machine', 'Machine logbook'), l('Radio', 'Radio')],
    tip: l(
      'Si votre mesure s’écarte du modèle, c’est elle qui a raison : le modèle est une chaîne d’hypothèses, le compteur ne l’est pas.',
      'If your measurement differs from the model, it is right: the model is a chain of assumptions, the meter is not.',
    ),
  },
];
