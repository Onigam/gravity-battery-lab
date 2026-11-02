// Parts of the `tower` world (15 of them, ids of docs/research.md §4): the machine and its weight. Conventions: see ./site.ts.
// The tower is NOT designed: its leg, bracing and foundation sizes are research §3's estimates and the model has no structure, which the
// sheets say once, on the foundation and the bracing. The hoist's rating and the blocks are published; the carrier's 3.2 t is what is left of
// the 20 t once the stack is counted (an assumption). The warning about the suspended load is in the world's overview only.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const TOWER_PARTS: PartInfo[] = [
  {
    id: 'foundation-pad',
    scene: 'tower',
    category: 'structure',
    name: l('Massif de fondation', 'Foundation pad'),
    short: l(
      'Il porte le poids, l’acier et le treuil, et surtout il empêche le vent de renverser une tour très haute et très étroite.',
      'It carries the weight, the steel and the hoist, and above all it stops the wind tipping over a very tall, very narrow tower.',
    ),
    description: lf(
      'Le poids n’est pas ce qui dimensionne ce massif : 20 t, l’acier estimé à {steelLow} ou {steelHigh} et le treuil de 1 321 kg s’étalent sans peine sur un bon sol. C’est le renversement qui compte, car une tour de {towerM} posée sur {towerPlan} de côté fait levier sur ses pieds dès que le vent souffle. D’où un massif estimé à {padSide} × {padSide} × {padDepth}, soit {padM3} de béton armé : environ {padTimes} le béton de la pile qu’il sert à lever. Cette taille n’est pas calculée, faute d’étude de sol et de calcul de structure : elle dit l’ordre de grandeur, pas une conception.',
      'The weight is not what sizes this pad: 20 t, the steel estimated at {steelLow} to {steelHigh} and the 1,321 kg hoist spread easily over good ground. Overturning is what counts, because a {towerM} tower standing on {towerPlan} a side levers against its feet as soon as the wind blows. Hence a pad estimated at {padSide} × {padSide} × {padDepth}, that is {padM3} of reinforced concrete: about {padTimes} the concrete of the stack it serves to lift. That size is not calculated, for want of a soil study and a structural design: it gives the order of magnitude, not a design.',
    ),
    material: l(
      'Béton armé coulé en place, gros ferraillage, tiges d’ancrage',
      'Cast-in-place reinforced concrete, heavy rebar, anchor bolts',
    ),
    specs: [
      sp('Taille', 'Size', v('{padSide} × {padSide} × {padDepth}')),
      sp('Béton', 'Concrete', lf('{padM3}, {padTimes} celui de la pile', '{padM3}, {padTimes} that of the stack')),
      sp('Ce qui le dimensionne', 'What sizes it', l('le renversement par le vent', 'overturning by the wind')),
      sp(
        'Étude',
        'Study',
        l(
          'non calculé : aucune étude de sol, aucun calcul de structure',
          'not calculated: no soil study, no structural design',
        ),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un tassement inégal d’un côté, qui penche la tour et fait frotter les patins. De l’eau qui stagne au pied et attaque tiges et platines. Un béton qui se fissure autour des ancrages.',
        check:
          'Un relevé de niveau sur les platines des quatre montants, comparé à celui de la mise en service. Une marque de peinture sur chaque écrou d’ancrage : si elle se décale, l’écrou a bougé.',
        care: 'Gardez l’eau loin du massif, avec une pente et un drain. Reprenez la peinture et la protection des tiges dès qu’elles rouillent, et ne laissez rien pousser contre le béton.',
      },
      {
        failure:
          'Uneven settlement on one side, which leans the tower and makes the shoes rub. Water standing at the foot and attacking bolts and base plates. Concrete cracking around the anchors.',
        check:
          'A level survey on the base plates of the four legs, compared with the one from commissioning. A paint mark on each anchor nut: if it shifts, the nut has moved.',
        care: 'Keep water away from the pad, with a slope and a drain. Touch up the paint and the protection of the bolts as soon as they rust, and let nothing grow against the concrete.',
      },
    ),
    tip: lf(
      'Quand on compare le carbone de la tour à celui d’une batterie, on ne compte souvent que les blocs. Ce massif pèse pourtant {padTimes} plus de béton, et il ne garde aucune énergie.',
      'When the tower’s carbon is compared with a battery’s, often only the blocks are counted. Yet this pad is {padTimes} as much concrete, and it stores no energy.',
    ),
    video: ['18:06'],
    design: l(
      'Dans une vidéo, un bricoleur voit la base de sa machine se soulever : il ajoute un bloc de plus. Ici le même effet s’écrit à une autre échelle : c’est au sol que finit toute force, et le sol ne se règle pas après coup.',
      'In a video, a home builder sees the base of his machine start to lift: he adds one more block. Here the same effect is written at another scale: every force ends up in the ground, and the ground cannot be adjusted afterwards.',
    ),
  },
  {
    id: 'tower-leg',
    scene: 'tower',
    category: 'structure',
    name: l('Montant', 'Tower leg'),
    short: lf(
      'L’une des quatre colonnes d’angle : un profilé d’acier en H boulonné par tronçons, sur {deckM} de haut.',
      'One of the four corner columns: a steel H-beam bolted together in sections, {deckM} high.',
    ),
    description: lf(
      'Les quatre montants sont aux angles d’un carré de {towerPlan} de côté, qui laisse au centre un puits libre de {shaftClear} × {shaftClear} pour une pile de 1,6 × 1,6 m. Ils portent en compression tout ce qui pend de la tête : 20 t, le treuil et leur propre poids. Une particularité de cette machine : la charge sur les montants ne change pas quand le poids monte, puisqu’il pend toujours de la même tête. Elle change d’un coup quand il se pose sur la butée, ce qui fait de la tour une structure soumise à de la fatigue. Les tronçons arrivent par camion et se boulonnent en l’air, à la grue. Le seul treillis de ce type construit en Europe, à Édimbourg, faisait 15 m.',
      'The four legs stand at the corners of a square {towerPlan} a side, leaving a clear shaft of {shaftClear} × {shaftClear} in the middle for a 1.6 × 1.6 m stack. They carry in compression everything that hangs from the head: 20 t, the hoist and their own weight. One feature of this machine: the load on the legs does not change as the weight rises, since it always hangs from the same head. It changes all at once when the weight comes to rest on the buffer, which makes the tower a structure subject to fatigue. Sections arrive by lorry and are bolted in the air, by crane. The only lattice of this type built in Europe, in Edinburgh, was 15 m.',
    ),
    material: l(
      'Profilé d’acier de construction en H, galvanisé à chaud, brides boulonnées',
      'Structural steel H-beam, hot-dip galvanised, bolted flanges',
    ),
    qty: 4,
    specs: [
      sp('Hauteur', 'Height', v('{deckM}')),
      sp('Écartement', 'Spacing', v('{towerPlan} × {towerPlan}')),
      sp('Puits libre', 'Clear shaft', v('{shaftClear} × {shaftClear}')),
      sp(
        'Acier de la tour en tout',
        'Steel of the whole tower',
        lf('{steelLow} à {steelHigh}', '{steelLow} to {steelHigh}'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'La corrosion au pied, là où l’eau stagne et où l’outil racle la galvanisation. Un boulon de bride qui se desserre. Un choc d’engin sur un montant, qui ne se voit plus une fois repeint.',
        check:
          'Un fil à plomb ou un laser depuis le sol pour l’aplomb. Une marque de peinture à cheval sur chaque écrou de bride : un trait décalé se lit depuis l’échelle sans outil.',
        care: 'Retouchez la galvanisation dès la première rouille. Protégez les pieds par une barrière contre les engins, et resserrez les boulons au couple prévu après la première saison.',
      },
      {
        failure:
          'Corrosion at the foot, where water stands and tools scrape the galvanising. A flange bolt working loose. A knock from a vehicle on a leg, which no longer shows once repainted.',
        check:
          'A plumb line or a laser from the ground for the vertical. A paint mark across each flange nut: a broken line can be read from the ladder without a tool.',
        care: 'Touch up the galvanising at the first rust. Guard the feet with a barrier against vehicles, and retighten the bolts to the specified torque after the first season.',
      },
    ),
    tip: l(
      'Le treillis coûte moins d’acier qu’une tour pleine à rigidité égale, et il laisse le vent passer. Mais il a beaucoup de boulons : tout l’entretien de cette tour est là.',
      'A lattice takes less steel than a solid tower of equal stiffness, and it lets the wind through. But it has many bolts: all the upkeep of this tower lies there.',
    ),
    design: lf(
      'Les {towerM} se décomposent : butée et châssis, pile de {stackSize}, palonnier et moufle, 20 m de course, 0,83 m d’approche du crochet, puis le treuil et son abri. Sur cette hauteur, seuls les 20 m gardent de l’énergie.',
      'The {towerM} break down as: buffer and carrier, a {stackSize} stack, lifting beam and hook block, 20 m of stroke, 0.83 m of hook approach, then the hoist and its canopy. Out of that height, only the 20 m hold any energy.',
    ),
  },
  {
    id: 'tower-bracing',
    scene: 'tower',
    category: 'structure',
    name: l('Contreventement', 'Bracing'),
    short: l(
      'Les diagonales qui font du treillis une structure : sans elles, quatre montants se plieraient comme un parallélogramme au premier vent.',
      'The diagonals that make the lattice a structure: without them, four legs would fold like a parallelogram in the first wind.',
    ),
    description: lf(
      'Un carré de barres articulées n’est pas rigide : il suffit de le pousser pour qu’il se couche. Une diagonale le fige en triangles, et c’est tout le secret d’un treillis. Le vent charge chaque face à tour de rôle, si bien que chaque diagonale travaille tantôt en traction, tantôt en compression, et se fatigue à chaque rafale. C’est aussi ce qui garde le puits droit, donc les rails alignés. Rien de tout cela n’est calculé ici : le modèle ne connaît pas la tour, et le mât arrête simplement la machine au-dessus de {windStop}.',
      'A square of hinged bars is not rigid: push it and it lies down. A diagonal locks it into triangles, and that is the whole secret of a lattice. The wind loads each face in turn, so each diagonal works now in tension, now in compression, and tires at each gust. This is also what keeps the shaft straight, and so the rails aligned. None of that is calculated here: the model does not know the tower, and the mast simply stops the machine above {windStop}.',
    ),
    material: l(
      'Cornières d’acier galvanisé, goussets, boulons précontraints',
      'Galvanised steel angles, gusset plates, preloaded bolts',
    ),
    specs: [
      sp(
        'Ce qu’elle reprend',
        'What it takes',
        l('le vent et le balancement de la tête', 'the wind and the sway of the head'),
      ),
      sp('Travail', 'Duty', l('traction puis compression, à chaque rafale', 'tension then compression, at each gust')),
      sp(
        'Rails',
        'Rails',
        l('elle garde le puits droit, donc les rails alignés', 'it keeps the shaft straight, and so the rails aligned'),
      ),
      sp(
        'Dans le modèle',
        'In the model',
        l('rien : la tour n’est pas calculée', 'nothing: the tower is not calculated'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une fissure de fatigue qui part d’un trou de boulon dans un gousset, et des boulons qui prennent du jeu. Une cornière pliée par une levée de bloc mal guidée, qui ne travaille plus.',
        check:
          'Après chaque coup de vent, un tour à la jumelle : rouille fraîche autour d’un boulon, trait de peinture décalé. Un bruit de claquement par vent fort indique presque toujours une diagonale desserrée.',
        care: 'Remplacez une diagonale pliée, ne la redressez pas. Resserrez selon le plan de maintenance, avec des boulons neufs lorsque la notice l’exige.',
      },
      {
        failure:
          'A fatigue crack starting from a bolt hole in a gusset, and bolts developing play. An angle bent by a poorly guided block lift, which no longer does its job.',
        check:
          'After each gale, a tour with binoculars: fresh rust around a bolt, a broken paint line. A clacking noise in a strong wind nearly always means a loose diagonal.',
        care: 'Replace a bent diagonal, do not straighten it. Retighten to the maintenance plan, with new bolts where the manual asks for them.',
      },
    ),
    tip: l(
      'Regardez le treillis par une face : les diagonales se croisent ou se suivent en zigzag. Retirez-en une par la pensée, et le panneau devient un parallélogramme mou.',
      'Look at the lattice from one face: the diagonals cross or zigzag up. Take one away in your mind, and that panel becomes a soft parallelogram.',
    ),
    design: lf(
      'Une tour ronde et pleine se concevrait bien mieux, mais à {towerM} elle prendrait le vent sur toute sa surface. Le treillis répond à la même question que le poids entre ses rails : laisser au vent le moins de prise possible.',
      'A round solid tower would be simpler to design, but at {towerM} it would catch the wind over its whole surface. The lattice answers the same question as the weight between its rails: give the wind as little to hold as possible.',
    ),
  },
  {
    id: 'head-frame',
    scene: 'tower',
    category: 'structure',
    name: l('Portique de tête', 'Head frame'),
    short: l(
      'Le plancher d’acier tout en haut, qui reçoit le treuil et lui donne un point fixe : toute la charge passe par lui.',
      'The steel floor at the very top, which takes the hoist and gives it a fixed point: the whole load goes through it.',
    ),
    description: lf(
      'Toute la machine pend de ce plancher. Il reçoit le treuil de 1 321 kg par quatre boulons M30, et il reprend la traction de la moufle : {tensionKn} dans le brin le plus chargé en montée, et les trois autres ensuite. Il doit rester assez raide pour que le tambour et la poulie de renvoi restent alignés sous charge, faute de quoi le câble sort des gorges. Dessous, il garde une distance que le catalogue fixe à 0,83 m entre le crochet et le treuil. Dessus, un abri protège le moteur de la pluie, car un moteur à ventilation forcée aime peu l’eau.',
      'The whole machine hangs from this floor. It takes the 1,321 kg hoist on four M30 bolts, and it carries the pull of the hook block: {tensionKn} in the most loaded fall when climbing, then the other three. It must stay stiff enough for the drum and the return sheave to remain lined up under load, or the rope leaves the grooves. Below, it keeps a distance the catalogue sets at 0.83 m between the hook and the hoist. Above, a canopy keeps the rain off the motor, since a force-ventilated motor has little love for water.',
    ),
    material: l(
      'Poutres d’acier soudées et boulonnées, plancher en caillebotis, abri de tôle',
      'Welded and bolted steel beams, grating floor, sheet-metal canopy',
    ),
    specs: [
      sp('Treuil reçu', 'Hoist carried', l('1 321 kg, 4 boulons M30-8.8', '1,321 kg, 4 M30-8.8 bolts')),
      sp('Approche du crochet', 'Hook approach', l('0,83 m minimum', '0.83 m minimum')),
      sp('Tension du brin le plus chargé', 'Tension of the most loaded fall', v('{tensionKn}')),
      sp(
        'Son rôle pour le câble',
        'Its role for the rope',
        l('garder tambour et poulie alignés', 'keep the drum and sheave aligned'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'De l’eau qui stagne sur une poutre ou dans un coin soudé, la rouille qui suit. Une fissure à une soudure qui reçoit un pied du treuil, et des boulons M30 qui se desserrent sous les démarrages.',
        check:
          'Depuis le palier, une lampe rasante sur les soudures de la zone du treuil. Une marque de peinture sur les quatre boulons. Une règle sur le tambour et la poulie, qui dit si l’alignement est resté bon.',
        care: 'Percez un trou de drainage là où l’eau stagne, repeignez après chaque inspection, et gardez le caillebotis dégagé de tout outil oublié : ici, ce qui tombe tombe de {deckM}.',
      },
      {
        failure:
          'Water standing on a beam or in a welded corner, with rust following. A crack in a weld under one of the hoist’s feet, and M30 bolts loosening under repeated starts.',
        check:
          'From the landing, a low-angled torch on the welds around the hoist. A paint mark on the four bolts. A straight edge on the drum and the sheave, which shows if the alignment has held.',
        care: 'Drill a drain hole where water stands, repaint after each inspection, and keep the grating clear of forgotten tools: here, whatever drops falls {deckM}.',
      },
    ),
    tip: l(
      'Le treuil pèse plus d’une tonne : il est livré en un bloc, et il monte en une seule levée. Tout ce qui reste à faire ensuite tient dans l’espace laissé autour de lui.',
      'The hoist weighs over a tonne: it is delivered in one piece and goes up in a single lift. Everything left to do afterwards must fit in the space left around it.',
    ),
    design: l(
      'Le treuil est en haut et non au sol, ce qui lui évite une poulie et un câble de plus. Le catalogue publié prévoit justement ce montage fixe. C’est la seule pièce du lab où la charge est connue, et la tour qui la porte, elle, ne l’est pas.',
      'The hoist is at the top rather than on the ground, which saves one more sheave and more rope. The published catalogue provides for just this fixed mounting. It is the one place in the lab where the load is known, while the tower carrying it is not.',
    ),
  },
  {
    id: 'guide-rail',
    scene: 'tower',
    category: 'structure',
    name: l('Rail de guidage', 'Guide rail'),
    qty: 2,
    short: l(
      'Pas de balancement, pas de torsion : les rails tiennent la charge, et c’est la réponse à l’objection du vent.',
      'No swing, no twist: the rails hold the load, and that is the answer to the wind objection.',
    ),
    description: lf(
      'Une charge qui pend se balance, et c’est le reproche fait à bon droit aux tours à grues. Ici le châssis court entre des rails fixés aux montants, comme une cabine d’ascenseur, et aucune rafale ne peut lui faire prendre de l’élan. Ce guidage coûte peu : le lab suppose un frottement de {guideShare} du poids, soit {upGuideW} à pleine vitesse, un chiffre qu’aucune source ne mesure. Ce sont aussi ces rails que les coins du parachute mordent en cas de chute : ils doivent donc tenir bien plus que le frottement courant, et rester bien plus droits que ce qu’exigerait un simple guidage.',
      'A hanging load swings, which is the fair reproach made to crane towers. Here the carrier runs between rails fixed to the legs, like a lift car, and no gust can build up any momentum. This guiding costs little: the lab assumes friction of {guideShare} of the weight, that is {upGuideW} at full speed, a figure no source measures. These are also the rails that the safety gear’s wedges bite in a fall: so they must carry far more than everyday friction, and stay much straighter than guiding alone would ask.',
    ),
    material: l(
      'Profil d’acier en T, fixations réglables, éclisses boulonnées aux joints',
      'Steel T section, adjustable brackets, bolted fishplates at the joints',
    ),
    specs: [
      sp('Frottement supposé', 'Assumed friction', lf('{guideShare} du poids', '{guideShare} of the weight')),
      sp('Perte à pleine vitesse', 'Loss at full speed', v('{upGuideW}')),
      sp(
        'Effet du vent sous le seuil',
        'Effect of the wind under the limit',
        lf('{windFriction} de plus', '{windFriction} more'),
      ),
      sp(
        'Autre rôle',
        'Other role',
        l('c’est là que mordent les coins du parachute', 'this is where the safety gear’s wedges bite'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Une marche à un joint, qui fait sauter un patin. Du givre l’hiver, de la rouille dans une machine qui ne bouge que deux fois par jour, et un rail qui se déporte si un montant a bougé.',
        check:
          'Un fil tendu ou un laser sur toute la hauteur, à la mise en service puis à chaque inspection. Une main sur les joints, machine à l’arrêt et consignée : un rail bien posé ne se sent pas au toucher.',
        care: 'Un film léger de lubrifiant adapté, sans excès sur la zone des coins. Reprenez les joints à la lime fine, jamais à la meuleuse, et resserrez leurs fixations.',
      },
      {
        failure:
          'A step at a joint, which makes a shoe jump. Rime in winter, rust on a machine that moves only twice a day, and a rail that drifts if a leg has shifted.',
        check:
          'A taut wire or a laser over the whole height, at commissioning then at each inspection. A hand on the joints, the machine stopped and locked out: a well-set rail cannot be felt by touch.',
        care: 'A light film of a suitable lubricant, sparingly where the wedges act. Dress the joints with a fine file, never a grinder, and retighten their brackets.',
      },
    ),
    tip: l(
      'Le scénario « Le vent se lève » le montre : la machine s’arrête pour la tour, pas pour le poids. Une vidéo sceptique très vue a raison pour les grues, et elle ne dit rien de ce genre de rails.',
      'The “The wind gets up” scenario shows it: the machine stops for the tower, not for the weight. A much-watched sceptical video is right about cranes, and says nothing about this kind of rail.',
    ),
    design: l(
      'Le rail transforme un problème dynamique en une petite perte constante. Il oblige aussi à une tour droite : c’est un guidage d’ascenseur, avec ses exigences, et non un simple tube.',
      'The rail turns a dynamic problem into a small steady loss. It also calls for a straight tower: this is lift guiding, with all its demands, and not just a tube.',
    ),
  },
  {
    id: 'end-buffer',
    scene: 'tower',
    category: 'mechanical',
    name: l('Butée amortissante', 'End buffer'),
    short: l(
      'L’arrêt en douceur tout en bas de la course : pour une arrivée à vitesse de marche, pas pour une chute.',
      'The soft stop at the very bottom of the stroke: for an arrival at working speed, not for a fall.',
    ),
    description: lf(
      'Normalement le poids n’y arrive jamais : le fin de course l’arrête avant. La butée attend l’erreur, un capteur qui lâche à la vitesse de marche. Là, elle a la tâche facile, car 20 t à 4 m/min ne portent que {kineticJ} d’énergie cinétique. Elle n’a pas été pensée pour le reste : sans parachute, une chute depuis le haut arriverait à {impactMs} en {impactS}, avec les {grossMj} du stock dans le choc. C’est aussi là que le poids se repose pour les arrêts longs, le câble un peu détendu, sans rien demander aux freins.',
      'Normally the weight never reaches it: the limit switch stops it first. The buffer waits for the mistake, a sensor failing at working speed. There its job is easy, since 20 t at 4 m/min carries only {kineticJ} of kinetic energy. It was not meant for the rest: with no safety gear, a fall from the top would arrive at {impactMs} after {impactS}, with the store’s {grossMj} in the blow. It is also where the weight rests during long stops, the rope slightly slack, asking nothing of the brakes.',
    ),
    material: l('Amortisseur à huile sur platine d’acier, tige chromée', 'Oil buffer on a steel plate, chromed rod'),
    qty: 4,
    specs: [
      sp('Vitesse d’arrivée prévue', 'Arrival speed planned', l('4 m/min au plus', '4 m/min at most')),
      sp('Énergie à cette vitesse', 'Energy at that speed', v('{kineticJ}')),
      sp(
        'Une chute sans parachute',
        'A fall with no safety gear',
        lf('{impactMs} après {impactS}', '{impactMs} after {impactS}'),
      ),
      sp('Son rôle chaque jour', 'Its everyday role', l('un appui pour les longs arrêts', 'a rest for long stops')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite d’huile, une tige rayée ou rouillée qui ne revient plus. Des déchets, des feuilles, voire un outil au fond, qui retirent de la course sans se voir.',
        check:
          'Regardez le niveau d’huile et la hauteur libre. Mettez le poids dessus à très basse vitesse et regardez si les quatre appuient ensemble et si le câble se détend comme prévu.',
        care: 'Gardez le fond propre à chaque tour de ronde, complétez l’huile selon la notice. Entrez dans cette zone uniquement avec le poids posé et consigné.',
      },
      {
        failure:
          'An oil leak, a scored or rusty rod that no longer returns. Rubbish, leaves or even a tool at the bottom, taking away travel without showing.',
        check:
          'Look at the oil level and the free height. Set the weight on them at very low speed and see whether all four bear together and whether the rope slackens as planned.',
        care: 'Keep the bottom clean at each round, top up the oil as the manual says. Enter this zone only with the weight down and locked out.',
      },
    ),
    tip: lf(
      'Les {kineticJ} sont un chiffre surprenant : à 4 m/min, ces 20 t ne portent presque rien. L’énergie est dans la hauteur, et pas du tout dans la vitesse, à la différence d’un volant.',
      'The {kineticJ} is a surprising figure: at 4 m/min these 20 t carry almost nothing. The energy is in the height and not at all in the speed, unlike a spinning wheel.',
    ),
    video: ['18:58', '19:56'],
    design: l(
      'Dans une vidéo, le poids tombe et fend le béton en dessous, puis des matelas viennent attendre la charge. Une butée fait ce travail-là pour une petite erreur, et il faut la voir pour ce qu’elle est : pas une assurance contre la chute.',
      'In a video, the weight falls and cracks the concrete below, and then mattresses come to wait for the load. A buffer does that job for a small error, and should be seen for what it is: no insurance against a fall.',
    ),
  },
  {
    id: 'weight-carrier',
    scene: 'tower',
    category: 'structure',
    name: l('Châssis de charge', 'Weight carrier'),
    short: l(
      'Le plateau d’acier qui reçoit les blocs : il donne une forme à la masse et la relie aux rails et au crochet.',
      'The steel tray that takes the blocks: it gives the mass a shape and ties it to the rails and the hook.',
    ),
    description: lf(
      'Sans châssis, une pile de blocs ne serait qu’une pile. Celui-ci reçoit la pile de {stackT}, porte les patins et le parachute, et transmet tout au palonnier puis à la moufle. Avec eux, il pèse {carrierT}, ce qui reste des 20 t une fois la pile comptée : une hypothèse du lab, à vérifier une fois l’acier dessiné, et s’il pèse plus, il faudra retirer les demi-blocs. Et il pose une limite : la machine ne peut pas s’alléger en dessous de ce poids à vide, ce qui compte, puisque le modèle voit qu’à pleine vitesse elle cesse de rapporter sous {stopsPayingT}, juste au-dessous.',
      'Without a carrier, a stack of blocks is only a stack. This one takes the {stackT} stack, carries the shoes and the safety gear, and passes everything on to the lifting beam then the hook block. With them it weighs {carrierT}, what is left of the 20 t once the stack is counted: an assumption of the lab, to be checked once the steel is drawn, and if it weighs more, the half blocks must come off. And it sets a limit: the machine cannot go lighter than this empty weight, which matters, since the model sees that at full speed it stops paying below {stopsPayingT}, just below that.',
    ),
    material: l(
      'Poutres et tôles d’acier soudées, galvanisé, palonnier de levage',
      'Welded steel beams and plate, galvanised, lifting beam',
    ),
    specs: [
      sp('Pile reçue', 'Stack carried', v('{stackT}')),
      sp('Châssis, palonnier et moufle', 'Carrier, beam and hook block', v('{carrierT}')),
      sp('Hauteur de la pile', 'Height of the stack', v('{stackSize}')),
      sp('Il cesse de rapporter, à pleine vitesse, sous', 'It stops paying, at full speed, below', v('{stopsPayingT}')),
    ],
    maintenance: maint(
      {
        failure:
          'De l’eau piégée sous les blocs, qui rouille le plateau sans qu’on le voie. Une fissure de fatigue aux soudures du palonnier. Le poids mal réparti, qui charge un patin plus que l’autre.',
        check:
          'Pendant qu’il est au sol, une lampe sous le plateau et sur les soudures. Mesurez l’usure de chaque patin : une différence d’un côté à l’autre dit que la charge n’est pas centrée.',
        care: 'Laissez un trou de drainage à chaque point bas. Retouchez la protection à chaque retrait de blocs, l’occasion rare où l’on voit le dessus du plateau.',
      },
      {
        failure:
          'Water trapped under the blocks, rusting the tray out of sight. A fatigue crack in the welds of the beam. Weight badly distributed, loading one shoe more than the other.',
        check:
          'While it is on the ground, a torch under the tray and on the welds. Measure the wear on each shoe: a difference from one side to the other says the load is off-centre.',
        care: 'Leave a drain hole at each low point. Touch up the protection whenever blocks come off, the rare moment when you can see the top of the tray.',
      },
    ),
    tip: lf(
      'Essayez le scénario « Trop léger » : on retire des blocs pendant la descente. Sur cette machine, le châssis à vide suffit largement à descendre seul, et à pleine vitesse il rapporte encore, à peine : le modèle place la limite à {stopsPayingT}, juste au-dessous de lui.',
      'Try the “Too light” scenario: blocks come off on the way down. On this machine the empty carrier easily comes down by itself, and at full speed it still pays, barely: the model puts the limit at {stopsPayingT}, just below it.',
    ),
    design: l(
      'Le palonnier répartit une seule force de levage sur la largeur du plateau. Il faut alors que le centre de la pile tombe bien sous le crochet : c’est une affaire d’empilage plus que de calcul.',
      'The lifting beam spreads one lifting force across the width of the tray. The centre of the stack must then fall right under the hook: a matter of stacking more than of calculation.',
    ),
  },
  {
    id: 'concrete-block',
    scene: 'tower',
    category: 'structure',
    name: l('Bloc de béton', 'Concrete block'),
    short: lf(
      'La masse, sans rien d’habile : 2,4 t pour un bloc entier, 1,2 t pour un demi, et {blockWh} par bloc pour 20 m.',
      'The mass, nothing clever: 2.4 t for a whole block, 1.2 t for a half, and {blockWh} a block over 20 m.',
    ),
    description: lf(
      'Ce sont des blocs du commerce, ceux qu’on empile pour des murs de stockage, de 1,6 × 0,8 × 0,8 m et de {blockM3}. Un fabricant de moules annonce 2 400 kg pour ce volume, à titre indicatif. Six blocs entiers et deux demi-blocs font {stackT}, en une pile de 1,6 × 1,6 × {stackSize}. Rien dans ces blocs ne fait d’eux une batterie : du fer, des pierres ou de l’eau rendraient la même énergie par tonne, soit {whPerKg} à 20 m. C’est bien la phrase à retenir : la gravité ne regarde pas la matière, elle ne regarde que la masse et la hauteur. Il en faut donc beaucoup : un module de batterie atteint {lfpWhPerKg}, {densityRatio} fois plus.',
      'These are blocks from the trade, the kind stacked into storage walls, 1.6 × 0.8 × 0.8 m and {blockM3}. A mould maker gives 2,400 kg for that volume, as an indication. Six whole blocks and two half blocks make {stackT}, in a stack 1.6 × 1.6 × {stackSize}. Nothing about these blocks makes them a battery: iron, stones or water would give back the same energy per tonne, that is {whPerKg} at 20 m. That is the sentence to keep: gravity does not look at the material, only at the mass and the height. So it takes a great deal: a battery module reaches {lfpWhPerKg}, {densityRatio} times more.',
    ),
    material: l(
      'Béton ordinaire, souvent de rebut, anneaux de levage noyés',
      'Ordinary concrete, often reject, cast-in lifting eyes',
    ),
    qty: 8,
    specs: [
      sp('Bloc entier', 'Whole block', l('1,6 × 0,8 × 0,8 m, environ 2 400 kg', '1.6 × 0.8 × 0.8 m, about 2,400 kg')),
      sp('Demi-bloc', 'Half block', l('1,6 × 0,8 × 0,4 m, environ 1 200 kg', '1.6 × 0.8 × 0.4 m, about 1,200 kg')),
      sp('La pile', 'The stack', lf('6 + 2 blocs, {stackT}, {stackM3}', '6 + 2 blocks, {stackT}, {stackM3}')),
      sp(
        'Un bloc entier levé de 20 m',
        'A whole block raised 20 m',
        lf('{blockWh}, soit {blockKettleMin} de bouilloire', '{blockWh}, that is {blockKettleMin} of kettle'),
      ),
      sp('Énergie par kilo', 'Energy per kilo', v('{whPerKg}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des angles épaufrés quand on les pose durement, des anneaux rouillés, et le gel dans une fissure. Un bloc peut aussi perdre un morceau, et un morceau de béton n’a rien à faire en haut d’un puits où l’on passe.',
        check:
          'À chaque inspection, regardez les arêtes à la jumelle depuis le palier. Lors de chaque retrait de bloc, regardez le dessous et l’anneau. Toute fissure qui traverse un bloc le met dehors.',
        care: 'Du béton ne demande presque rien. Posez-les à plat et bien centrés, gardez les tenons propres, et notez dans le carnet tout bloc ajouté ou retiré, car la masse est une valeur de sécurité.',
      },
      {
        failure:
          'Corners chipped by rough setting down, rusty eyes, and frost in a crack. A block may also lose a piece, and a lump of concrete has no business at the top of a shaft people walk through.',
        check:
          'At each inspection, go over the edges with binoculars from the landing. Whenever a block comes off, look at its underside and the eye. Any crack through a block rules it out.',
        care: 'Concrete asks almost nothing. Set blocks flat and well centred, keep the studs clean, and note in the logbook any block added or removed, because the mass is a safety value.',
      },
    ),
    tip: lf(
      'Une nuit de {nightMax} demande {night7Blocks}, soit {night7M3} de béton, avec les pertes. Faites tourner le curseur de la nuit et voyez la pile fantôme grandir sur la cour.',
      'A {nightMax} night takes {night7Blocks}, that is {night7M3} of concrete, losses counted. Move the night’s slider and watch the ghost stack grow on the yard.',
    ),
    video: ['12:56', '15:35'],
    design: l(
      'Une pile de blocs emboîtés se monte et se démonte à la grue, sans outil spécial et en toute saison, et une masse de rebut ne coûte presque rien. Tout l’intérêt économique de la gravité se trouve dans ce genre de détails, pas dans son rendement.',
      'A stack of interlocking blocks goes up and comes down by crane, with no special tool and in any season, and reject mass costs almost nothing. All gravity’s economic interest lies in details like this, not in its efficiency.',
    ),
  },
  {
    id: 'stack-tie',
    scene: 'tower',
    category: 'structure',
    name: l('Tirant de pile', 'Stack tie'),
    qty: 4,
    short: l(
      'Il empêche les blocs de marcher : à force de petits chocs, une pile libre se déplace, et un bloc en haut d’une tour doit rester à sa place.',
      'It stops the blocks walking: with enough small jolts, a loose stack shifts, and a block at the top of a tower has to stay put.',
    ),
    description: l(
      'Des blocs posés les uns sur les autres ne sont tenus que par leur poids et leur frottement. À chaque démarrage, chaque arrêt et chaque passage de joint dans les rails, ils reçoivent un petit choc, et après des années de tels chocs une pile libre finit par se décaler. Les tirants sont des tiges d’acier qui serrent la pile sur le plateau, avec leurs écrous freinés. Elles doivent pouvoir se défaire sans outil spécial : on doit pouvoir retirer un bloc. Elles ne portent presque rien en service, sauf le jour où la charge est arrêtée brutalement par le parachute.',
      'Blocks set one on another are held only by their weight and friction. At each start, each stop and each joint passed in the rails they take a small jolt, and after years of such jolts a loose stack ends up shifting. The ties are steel rods clamping the stack onto the tray, with locked nuts. They must come undone without a special tool: a block must be removable. They carry almost nothing in service, except on the day the load is brought up short by the safety gear.',
    ),
    material: l(
      'Tiges filetées d’acier galvanisé, plaques de répartition, écrous freinés',
      'Galvanised steel threaded rods, spreader plates, locked nuts',
    ),
    specs: [
      sp('Rôle', 'Role', l('serrer la pile sur le plateau', 'clamp the stack onto the tray')),
      sp(
        'Effort en service',
        'Force in service',
        l('faible, sauf lors d’un arrêt par le parachute', 'small, except for a stop by the safety gear'),
      ),
      sp(
        'Démontage',
        'Removal',
        l('à la clé, pour pouvoir retirer un bloc', 'with a spanner, so that a block can come off'),
      ),
      sp(
        'Ce qui la remplace à petite échelle',
        'What replaces it at small scale',
        l('rien : une pierre dans un sac', 'nothing: a stone in a bag'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un écrou qui se desserre sous les vibrations, une tige rouillée au niveau d’un joint de bloc, et un tirant remonté trop lâche après un retrait de blocs.',
        check:
          'À chaque inspection, donnez un coup de clé sur chaque écrou, poids posé et consigné. Regardez si les joints de la pile sont restés alignés : un décalage dit qu’elle a bougé.',
        care: 'Graissez les filets et utilisez des écrous freinés neufs à chaque remontage. Serrez de façon régulière en croisant, pour ne pas faire basculer un bloc.',
      },
      {
        failure:
          'A nut working loose with vibration, a rod rusting at a block joint, and a tie put back too slack after blocks have come off.',
        check:
          'At each inspection, try each nut with a spanner, the weight down and locked out. See if the joints of the stack are still in line: an offset says it has moved.',
        care: 'Grease the threads and use new locked nuts at each reassembly. Tighten evenly in a cross pattern, so as not to tip a block.',
      },
    ),
    tip: lf(
      'Dans le scénario « Survitesse », la charge lancée à {fallPeak} s’arrête en {fallCm}, en moins d’une demi-seconde. Les tirants sont là pour ce moment, le seul où ils travaillent.',
      'In the “Overspeed” scenario the load, moving at {fallPeak}, stops within {fallCm}, in under half a second. The ties are there for that moment, the only one when they work.',
    ),
    design: l(
      'Le tirant répond à un danger d’une tour, pas d’une batterie : ici, tout ce qui se détache tombe. C’est le genre de pièce que l’on n’imagine pas avant de construire, et que tout le monde voit après.',
      'The tie answers a danger of towers rather than batteries: here, whatever comes loose falls. It is the kind of part you do not imagine before building, and that everyone sees afterwards.',
    ),
  },
  {
    id: 'guide-shoe',
    scene: 'tower',
    category: 'mechanical',
    name: l('Patin de guidage', 'Guide shoe'),
    qty: 4,
    short: l(
      'Le contact du châssis avec les rails : une garniture d’usure, simple et remplaçable, plutôt qu’un roulement.',
      'The carrier’s contact with the rails: a simple replaceable wear liner, rather than a bearing.',
    ),
    description: lf(
      'Les patins enserrent les rails, en haut et en bas du châssis, de chaque côté. À 4 m/min, un simple glissement sur une garniture de plastique dur suffit : pas besoin de galets comme dans un ascenseur rapide. Un peu de jeu reste nécessaire, car un rail n’est jamais parfaitement droit et une tour bouge dans le vent : {shoePlay} en tout sur la lame, dans ce dessin. Trop de jeu laisse la charge battre ; trop peu la fait frotter fort, jusqu’à manger le rendement. Le lab met tout ce frottement dans une seule hypothèse, {guideShare} du poids : sur {upGuideW} perdus à pleine vitesse, c’est la plus petite des pertes.',
      'The shoes wrap around the rails, at the top and bottom of the carrier, on each side. At 4 m/min, simple sliding on a hard plastic liner is enough: no need for rollers as in a fast lift. A little play is still needed, because a rail is never perfectly straight and a tower moves in the wind: {shoePlay} in all on the blade, in this drawing. Too much play lets the load knock; too little makes it rub hard enough to eat into the efficiency. The lab puts all this friction into one assumption, {guideShare} of the weight: at {upGuideW} lost at full speed, this is the smallest of the losses.',
    ),
    material: l('Semelle d’acier, garniture de polymère dur remplaçable', 'Steel base, replaceable hard polymer liner'),
    specs: [
      sp('Type', 'Type', l('patin glissant, pas de galet', 'sliding shoe, no roller')),
      sp('Vitesse', 'Speed', l('4 m/min au plus à pleine charge', '4 m/min at most at full load')),
      sp('Frottement supposé', 'Assumed friction', lf('{guideShare} du poids', '{guideShare} of the weight')),
      sp('Perte à pleine vitesse', 'Loss at full speed', v('{upGuideW}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une garniture usée qui laisse la charge battre, et un patin qui s’use d’un seul côté, signe d’une pile mal centrée ou d’un rail déporté. Un corps étranger coincé, qui raye le rail.',
        check:
          'Le poids sur la butée, passez une cale entre garniture et rail à plusieurs hauteurs : le jeu ne doit pas sortir de la plage de la notice. Écoutez une montée lente : un claquement régulier se trouve vite.',
        care: 'Changez la garniture avant qu’elle touche sa semelle : c’est la pièce d’usure prévue, et elle ne coûte presque rien à côté d’un rail.',
      },
      {
        failure:
          'A worn liner that lets the load knock, and a shoe wearing on one side only, a sign of an off-centre stack or a drifted rail. A foreign body wedged in, scoring the rail.',
        check:
          'With the weight on the buffer, slip a feeler gauge between liner and rail at several heights: the play must stay within the manual’s range. Listen to a slow climb: a regular knock is soon found.',
        care: 'Change the liner before it reaches its base: it is the planned wear part, and costs next to nothing beside a rail.',
      },
    ),
    tip: l(
      'Regardez le jeu : c’est le bon exemple d’un réglage qui ne se dessine pas. Il se trouve à la main, à la mise en service, sur la vraie tour.',
      'Look at the play: it is a good example of a setting that cannot be drawn. It is found by hand, at commissioning, on the real tower.',
    ),
    design: l(
      'Un patin glissant coûte un peu de rendement, mais il n’a ni roulement à gripper ni graisse à perdre. Pour une machine qui fait quelques courses par jour, cette simplicité vaut plus que les quelques watts d’un galet.',
      'A sliding shoe costs a little efficiency, but it has no bearing to seize and no grease to lose. For a machine that makes a few strokes a day, that simplicity is worth more than the few watts of a roller.',
    ),
  },
  {
    id: 'safety-gear',
    scene: 'tower',
    category: 'mechanical',
    name: l('Parachute', 'Safety gear'),
    short: lf(
      'Des coins qui mordent les rails si la charge dépasse {governorMs} : ils attrapent 20 t quand tout le reste a lâché.',
      'Wedges that bite the rails if the load passes {governorMs}: they catch 20 t when everything else has let go.',
    ),
    description: lf(
      'C’est une idée d’ascenseur : des coins d’acier, logés dans le châssis, à quelques millimètres des rails, tenus par une tringlerie reliée au limiteur de vitesse. Si un arbre casse, la charge accélère ; au-delà de {governorMs}, soit {governorTimes} sa vitesse de marche, le limiteur tire la tringlerie, et {governorDelayMs} plus tard les coins mordent. Le modèle prend une décélération de {wedgeG}, dans la plage d’un parachute progressif : la charge atteint {fallPeak}, et s’arrête en {fallCm}, en moins d’une demi-seconde. Il ne se réarme pas seul, et rien ne repart avant une inspection. Personne n’a publié d’essai à cette taille : ce sont des hypothèses.',
      'This is a lift idea: steel wedges, housed in the carrier a few millimetres from the rails, held by a linkage tied to the overspeed governor. If a shaft breaks, the load accelerates; beyond {governorMs}, which is {governorTimes} its working speed, the governor pulls the linkage, and {governorDelayMs} later the wedges bite. The model takes a deceleration of {wedgeG}, within the range of a progressive gear: the load reaches {fallPeak} and stops in {fallCm}, in under half a second. It does not reset by itself, and nothing moves again before an inspection. Nobody has published a test at this size: these are assumptions.',
    ),
    material: l(
      'Coins et mâchoires d’acier trempé, ressorts, tringlerie',
      'Hardened steel wedges and jaws, springs, linkage',
    ),
    specs: [
      sp(
        'Déclenche à',
        'Trips at',
        lf('{governorMs}, {governorTimes} la vitesse de marche', '{governorMs}, {governorTimes} the working speed'),
      ),
      sp('Délai avant morsure', 'Delay before the bite', v('{governorDelayMs}')),
      sp('Décélération', 'Deceleration', v('{wedgeG}')),
      sp('Vitesse atteinte, hauteur perdue', 'Speed reached, height lost', v('{fallPeak}, {fallCm}')),
      sp('Sans lui', 'Without it', lf('{impactMs} à la butée', '{impactMs} at the buffer')),
    ],
    maintenance: maint(
      {
        failure:
          'Le pire est qu’on ne le voie jamais agir : des coins grippés par la rouille, une tringlerie encrassée, un jeu au rail qui s’est refermé, ou qui s’est trop ouvert. Une pièce qui ne sert jamais est une pièce qui se bloque en silence.',
        check:
          'Un essai réel, déclenché à faible vitesse et chargé, par un organisme qualifié, à la mise en service puis aux intervalles qu’il fixe. Le jeu entre coins et rails se mesure à chaque inspection.',
        care: 'Nettoyez, graissez les articulations sans mettre de graisse sur les faces de morsure, et reprenez les rails après un déclenchement : un coin laisse des traces qu’il faut effacer.',
      },
      {
        failure:
          'The worst is that it is never seen working: wedges seized by rust, a fouled linkage, a rail gap that has closed up or opened too far. A part that is never used is a part that jams in silence.',
        check:
          'A real test, tripped at low speed and loaded, by a qualified body, at commissioning then at the intervals it sets. The gap between wedges and rails is measured at each inspection.',
        care: 'Clean and grease the joints, keeping grease off the biting faces, and dress the rails after a trip: a wedge leaves marks that must be removed.',
      },
    ),
    tip: lf(
      'Lancez le scénario « Survitesse », vu au vingtième, puis ôtez le parachute dans la Simulation et recommencez : {impactMs} à la butée, en {impactS}.',
      'Run the “Overspeed” scenario, seen at one twentieth, then take off the safety gear in the Simulation and do it again: {impactMs} at the buffer, in {impactS}.',
    ),
    video: ['18:58'],
    design: l(
      'Dans une vidéo, un couvercle mal vissé suffit à faire tomber un sac de pierres : rien ne l’attrape. Le parachute répond justement à cette question : que se passe-t-il quand ce que l’on croyait sûr lâche ? Il agit après tout le reste, sans électricité et sans personne.',
      'In a video, a badly screwed cover is enough to bring down a bag of rocks: nothing catches it. The safety gear answers just that question: what happens when what you thought was sound lets go? It acts after everything else, with no electricity and nobody on hand.',
    ),
  },
  {
    id: 'hook-block',
    scene: 'tower',
    category: 'mechanical',
    name: l('Moufle', 'Hook block'),
    short: l(
      'Deux poulies et un crochet : elle transforme un câble en quatre brins, le quart de la force et quatre fois la longueur.',
      'Two sheaves and a hook: it turns one rope into four falls, a quarter of the force and four times the length.',
    ),
    description: lf(
      'Un câble de 20 mm ne tient pas 20 t seul avec une marge correcte. Faites-lui faire l’aller-retour : tambour, moufle, poulie de renvoi, moufle, point fixe, et quatre brins se partagent la charge, soit {staticKn} par brin sur le papier. En échange, le tambour doit enrouler quatre fois la course : {ropeSpeed} de câble pour 4 m/min au crochet. Rien n’est gratuit : à {sheaveEta} par poulie, une hypothèse, les poulies coûtent {upReevingW} en montée à pleine vitesse. Le brin qui part vers le tambour porte alors le plus, {tensionKn}. La puissance reste la même : ce montage change la force et la vitesse, pas l’énergie.',
      'A 20 mm rope cannot carry 20 t alone with a decent margin. Send it there and back: drum, hook block, return sheave, hook block, anchor, and four falls share the load, {staticKn} a fall on paper. In exchange, the drum must wind in four times the stroke: {ropeSpeed} of rope for 4 m/min at the hook. Nothing is free: at {sheaveEta} a sheave, an assumption, the sheaves cost {upReevingW} when climbing at full speed. The fall going to the drum then carries the most, {tensionKn}. The power stays the same: this arrangement changes the force and the speed, not the energy.',
    ),
    material: l(
      'Flasques d’acier, poulies usinées sur roulements, crochet forgé',
      'Steel side plates, machined sheaves on bearings, forged hook',
    ),
    specs: [
      sp('Montage', 'Reeving', l('4 brins, 3 poulies en tout', '4 falls, 3 sheaves in all')),
      sp('Tension par brin, sans frottement', 'Tension per fall, no friction', v('{staticKn}')),
      sp('Tension du brin le plus chargé', 'Tension of the most loaded fall', v('{tensionKn}')),
      sp('Vitesse du câble', 'Rope speed', v('{ropeSpeed}')),
      sp('Une poulie', 'One sheave', v('{sheaveEta}')),
      sp(
        'Diamètre de poulie',
        'Sheave diameter',
        lf('au moins {sheaveM}, 18 fois le câble', 'at least {sheaveM}, 18 times the rope'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Un roulement de poulie qui se grippe : le câble glisse alors dans la gorge et s’use très vite. Une gorge usée qui pince le câble, et un crochet déformé, le signe d’une surcharge passée.',
        check:
          'Poids posé et consigné, faites tourner chaque poulie à la main : elle doit tourner libre et sans bruit. Une jauge de gorge dit son usure, et l’ouverture du crochet se compare à la valeur d’origine.',
        care: 'Graissez les roulements aux intervalles de la notice, et changez une poulie dont la gorge marque le câble : une poulie coûte bien moins cher que le câble qu’elle tue.',
      },
      {
        failure:
          'A sheave bearing seizing: the rope then slides in the groove and wears very quickly. A worn groove pinching the rope, and a deformed hook, the sign of a past overload.',
        check:
          'With the weight down and locked out, turn each sheave by hand: it must run freely and silently. A groove gauge gives its wear, and the hook’s opening is compared with its original value.',
        care: 'Grease the bearings at the manual’s intervals, and change a sheave whose groove marks the rope: a sheave costs far less than the rope it kills.',
      },
    ),
    tip: l(
      'Faites l’essai dans la Simulation : passez de 4 brins à 2 à pleine charge. Le limiteur refuse, car chaque brin porterait le double.',
      'Try it in the Simulation: go from 4 falls to 2 at full load. The overload cell refuses, because each fall would carry double.',
    ),
    design: l(
      'Les quatre brins expliquent pourquoi le crochet monte lentement : un treuil peut tirer vite ou fort, pas les deux. Ce rapport fait une partie du travail du réducteur, avec des pièces que l’on peut voir et inspecter.',
      'The four falls explain why the hook climbs slowly: a hoist can pull fast or hard, not both. This ratio does some of the gearbox’s work, with parts you can see and inspect.',
    ),
  },
  {
    id: 'hoist-rope',
    scene: 'tower',
    category: 'mechanical',
    name: l('Câble de levage', 'Hoist rope'),
    short: lf(
      'Le câble de 20 mm, {ropeM} : la pièce qui s’use, et celle dont parlent toutes les règles de levage.',
      'The 20 mm rope, {ropeM}: the part that wears, and the one all the lifting rules are about.',
    ),
    description: lf(
      'Un câble d’acier n’est pas une tige : il est fait de torons de fils qui glissent les uns sur les autres à chaque passage sur une poulie. Celui-ci fait 20 mm, porte 206 mm² d’acier et casse à 315 kN au moins ; le tableau publié annonce un coefficient d’au moins 5. À {staticKn} par brin, il travaille à {ropeFactorStatic} sans frottement, et à {ropeFactor} avec, dans le brin le plus chargé. Il pèse {ropeKg} pour {ropeM} : le tambour lève {ropeHangBottom} de câble au début de la montée, et {ropeHangTop} à la fin, soit {ropeEnergyPct} de l’énergie d’une course. Il meurt de ses flexions bien plus que de sa charge, souvent sans prévenir si personne ne regarde.',
      'A steel rope is not a rod: it is made of strands of wires that slide on one another at each pass over a sheave. This one is 20 mm, has 206 mm² of steel and breaks at 315 kN at least; the published table states a factor of at least 5. At {staticKn} a fall it works at {ropeFactorStatic} with no friction, and {ropeFactor} with it, in the most loaded fall. It weighs {ropeKg} for {ropeM}: the drum lifts {ropeHangBottom} of rope at the start of the climb and {ropeHangTop} at the end, {ropeEnergyPct} of the energy of a stroke. It dies of its bends far more than of its load, often with no warning if nobody looks.',
    ),
    material: l(
      'Fils d’acier galvanisé en torons, âme, lubrifiant',
      'Galvanised steel wires in strands, a core, lubricant',
    ),
    specs: [
      sp('Diamètre, brins', 'Diameter, falls', l('20 mm, 4 brins', '20 mm, 4 falls')),
      sp('Force de rupture minimale', 'Minimum breaking force', l('315 kN', '315 kN')),
      sp('Section métallique', 'Metallic area', l('206 mm²', '206 mm²')),
      sp('Longueur, masse', 'Length, mass', v('{ropeM}, {ropeKg}')),
      sp(
        'Coefficient, sans puis avec frottement',
        'Factor, without then with friction',
        v('{ropeFactorStatic}, {ropeFactor}'),
      ),
      sp('Part de l’énergie d’une course', 'Share of a stroke’s energy', v('{ropeEnergyPct}')),
    ],
    maintenance: maint(
      {
        failure:
          'Des fils cassés là où le câble passe sur les poulies, de la corrosion intérieure qui ne se voit pas, et un câble écrasé par un mauvais enroulement. La rupture vient rarement d’un seul coup, mais elle peut venir sans alerte visible si l’inspection est sautée.',
        check:
          'Une inspection visuelle sur toute la longueur, avec un comptage des fils cassés par longueur de référence, selon les critères de dépose d’une norme publiée. Mesurez le diamètre : une réduction est le signe d’une âme qui disparaît.',
        care: 'Graissez avec le produit prévu, qui doit pénétrer entre les torons. Retirez le câble au critère de dépose, sans discuter : il n’y a aucune réparation d’un câble de levage.',
      },
      {
        failure:
          'Broken wires where the rope goes over the sheaves, inner corrosion that cannot be seen, and a rope crushed by bad spooling. Failure rarely comes all at once, but it can come with no visible warning if inspection is skipped.',
        check:
          'A visual inspection over the whole length, counting broken wires over a reference length, by the discard criteria of a published standard. Measure the diameter: a reduction is the sign of a core going away.',
        care: 'Grease with the specified product, which must get in between the strands. Take the rope off at the discard criterion, no argument: a lifting rope has no repair.',
      },
    ),
    tip: lf(
      'Le câble compte dans le stock : les {ropeEnergyPct} de son énergie sont petits, mais ce sont {ropeKg} qu’il faut lever avec le reste. Le calcul se fait en énergie, et non en masse, car tout ce câble ne pend pas toute la course.',
      'The rope counts in the store: the {ropeEnergyPct} of its energy is small, but it is {ropeKg} to lift with the rest. The sum is made in energy, not mass, because all that rope does not hang for the whole stroke.',
    ),
    video: ['12:05'],
    design: lf(
      'Pourquoi un si gros tambour et de si grandes poulies ? Parce que chaque flexion fatigue les fils, et que la règle demande une poulie d’au moins 18 fois le diamètre du câble. Dans une vidéo, le câble d’un bricoleur lâche sur une petite poulie : ce n’est pas un hasard.',
      'Why so large a drum and such big sheaves? Because each bend tires the wires, and the rule asks for a sheave of at least 18 times the rope’s diameter. In a video, a home builder’s rope fails on a small pulley: that is no accident.',
    ),
  },
  {
    id: 'service-ladder',
    scene: 'tower',
    category: 'structure',
    name: l('Échelle et ligne de vie', 'Ladder and fall arrest'),
    short: lf(
      'L’inspection demande quelqu’un là-haut, à {deckM} : une échelle, un rail antichute et des paliers de repos.',
      'Inspection needs someone up there, at {deckM}: a ladder, a fall-arrest rail and rest landings.',
    ),
    description: lf(
      'Une machine sans entretien ? Pourtant, il faut quelqu’un qui monte voir les boulons, le câble et les freins, à {deckM}. D’où une échelle à crinoline ou à rail, avec un coulisseau relié à un harnais, qui se bloque en cas de chute. Des paliers donnent des pauses et un endroit où se tenir pour travailler. Ce travail en hauteur a un coût que les calculs d’énergie oublient : deux personnes, jamais une, et un plan pour redescendre un blessé, car les secours ne se préparent pas au dernier moment.',
      'A machine with no upkeep? And yet someone has to climb up to look at the bolts, the rope and the brakes, at {deckM}. Hence a caged or railed ladder, with a slider tied to a harness that locks in a fall. Landings give rests and a place to stand and work. This work at height has a cost that energy sums forget: two people, never one, and a plan for bringing an injured person down, since rescue is not something to prepare at the last moment.',
    ),
    material: l(
      'Échelle d’acier galvanisé, rail antichute, paliers en caillebotis',
      'Galvanised steel ladder, fall-arrest rail, grating landings',
    ),
    specs: [
      sp('Hauteur à monter', 'Height to climb', v('{deckM}')),
      sp('Protection', 'Protection', l('rail antichute et harnais', 'fall-arrest rail and harness')),
      sp('Effectif', 'Team', l('deux personnes au moins', 'two people at least')),
      sp('Pendant ce temps', 'Meanwhile', l('poids posé en bas, machine consignée', 'weight down, machine locked out')),
    ],
    maintenance: maint(
      {
        failure:
          'Un rail antichute encrassé qui bloque le coulisseau, un harnais trop vieux, et un barreau descellé par la rouille. Le risque le plus courant reste un geste : décrocher « juste pour passer ».',
        check:
          'Vérifiez le coulisseau sur le rail avant chaque montée, à hauteur d’homme. Le harnais et l’antichute passent à un contrôle périodique par une personne compétente, et leur date se lit sur l’étiquette.',
        care: 'Gardez l’échelle libre de câbles rajoutés et dégagée en haut. Ne montez jamais par vent fort, par givre ou pendant un orage : une tour isolée attire la foudre.',
      },
      {
        failure:
          'A fouled fall-arrest rail that jams the slider, a harness past its age, and a rung loosened by rust. The commonest risk remains a gesture: unclipping “just to get past”.',
        check:
          'Test the slider on the rail before each climb, at head height. The harness and the fall arrester go through a periodic check by a competent person, and their date is on the label.',
        care: 'Keep the ladder free of added cables and clear at the top. Never climb in a strong wind, in rime or during a storm: a lone tower attracts lightning.',
      },
    ),
    tip: l(
      'Le plan de sauvetage se répète au sol avant d’être utile en l’air : combien de temps faut-il pour redescendre quelqu’un de là-haut, avec les moyens du bord ?',
      'The rescue plan is rehearsed on the ground before it is needed in the air: how long would it take to bring someone down from up there, with what is at hand?',
    ),
    design: l(
      'Une échelle est bon marché, et elle rappelle ce qu’aucun bilan d’énergie ne compte : cette machine demande des gens, et des gens à l’aise en hauteur. Une batterie se change avec un chariot.',
      'A ladder is cheap, and it recalls what no energy balance counts: this machine needs people, and people at ease at height. A battery is changed with a trolley.',
    ),
  },
  {
    id: 'height-scale',
    scene: 'tower',
    category: 'structure',
    name: l('Échelle des kilowattheures', 'Kilowatt-hour scale'),
    short: lf(
      'Une règle sur un montant : des mètres d’un côté, des wattheures de l’autre. Chaque mètre de course vaut {metreWh}.',
      'A ruler on a leg: metres on one side, watt-hours on the other. Each metre of the stroke is worth {metreWh}.',
    ),
    description: lf(
      'Cette pièce n’est pas celle d’une vraie machine, c’est celle de ce lab : une règle posée le long de la course, qui se lit dans les deux unités. En bas, zéro ; en haut, {grossKwh}. Chaque mètre gagné par le poids vaut {metreWh}, ce qui est peu : un frigo de {fridgeW} tiendrait une demi-heure, sans aucune perte, sur un mètre. L’énergie est proportionnelle à la hauteur et à la masse, sans seuil et sans courbe, et cette ligne droite est le seul endroit vraiment simple de toute la machine. Tout ce qui suit dans ce lab traite de ce qu’on en récupère vraiment.',
      'This part does not belong to a real machine, it belongs to this lab: a ruler along the stroke, readable in both units. At the bottom, zero; at the top, {grossKwh}. Each metre the weight gains is worth {metreWh}, which is little: a {fridgeW} fridge would run half an hour, with no loss at all, on one metre. The energy is proportional to the height and the mass, with no threshold and no curve, and that straight line is the only truly simple place in the whole machine. Everything else in this lab deals with what you really get back.',
    ),
    material: l(
      'Bandes peintes, repères de tôle : un ajout pédagogique',
      'Painted strips, sheet-metal marks: a teaching addition',
    ),
    specs: [
      sp('Un mètre de course', 'One metre of stroke', v('{metreWh}')),
      sp('Toute la course', 'The whole stroke', lf('20 m, {grossKwh}', '20 m, {grossKwh}')),
      sp(
        'Une tonne à la même énergie',
        'One tonne for the same energy',
        lf('{kwhHeight} par kilowattheure', '{kwhHeight} per kilowatt-hour'),
      ),
      sp('Nature', 'Nature', l('pédagogique : pas sur une vraie machine', 'for teaching: not on a real machine')),
    ],
    maintenance: maint(
      {
        failure:
          'Elle s’efface au soleil et ne dit plus la vérité si la tour a bougé. Elle ne casse jamais la machine : c’est une règle, et personne ne s’en sert pour commander.',
        check:
          'Comparez sa lecture avec la hauteur donnée par le codeur et avec les fins de course, en haut et en bas : un écart dit soit que la règle a glissé, soit que le câble s’est allongé.',
        care: 'Repeignez les repères à l’occasion d’une inspection, poids posé. Le vrai chiffre est au compteur, et la règle reste là pour ceux qui passent.',
      },
      {
        failure:
          'It fades in the sun and stops telling the truth if the tower has moved. It never breaks the machine: it is a ruler, and nobody uses it for control.',
        check:
          'Compare its reading with the height from the encoder and the limit switches, top and bottom: a gap says either that the ruler has slipped or that the rope has stretched.',
        care: 'Repaint the marks during an inspection, with the weight down. The true figure is at the meter, and the ruler stays there for those passing by.',
      },
    ),
    tip: lf(
      'Une tonne, {kwhHeight} : c’est la phrase du lab. Regardez ce poids s’élever d’un mètre, et comptez ce qu’il aurait fallu pour votre bouilloire.',
      'One tonne, {kwhHeight}: that is the sentence of the lab. Watch this weight rise by a metre, and count what your kettle would have needed.',
    ),
    design: l(
      'Une batterie affiche un pourcentage ; une tour montre sa charge à qui lève la tête. C’est peut-être le plus beau de cette machine : son état de charge se voit de loin, à l’œil nu, sans aucun instrument.',
      'A battery shows a percentage; a tower shows its charge to anyone who looks up. That may be the finest thing about this machine: its state of charge can be seen from far off, with the naked eye and no instrument.',
    ),
  },
];
