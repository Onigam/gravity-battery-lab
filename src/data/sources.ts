// The Sources panel: notices, safety and law said once, credits and links, the outline of the main video. The lead wires it with `about: sourcesPanel` in src/lab.ts
// (and `video: { id: VIDEO_ID }`, see chapters.ts). Real projects and makers are named here and in lesson 6, nowhere else; no endorsement is implied.
// From docs/research.md §1 and §7. Left out on purpose: the TEDx talk, which is about a flywheel, and the former site of a liquidated company, which now serves a casino page:
// the company is cited through the Gazette and the trade press.
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS, type AppContext } from '@onigam/lab-kit/ui';
import { t } from '../i18n/ui';
import { CHAPTERS, VIDEO_ID } from './chapters';

export interface SourceLink {
  href: string;
  label: string | L;
  note: L;
}

export interface SourceGroup {
  title: L;
  links: SourceLink[];
}

export const MAIN_VIDEO: SourceLink = {
  href: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
  label: 'DIY Gravity Battery: Unexpected Results!',
  note: l(
    'engineericly, 12 juin 2023. Un montage réel dans une cour, ses pannes et ses limites : c’est le récit qui accompagne ce lab. La vidéo est sponsorisée, et ne donne ni hauteur, ni puissance, ni durée. Aucune image n’en est reprise.',
    'engineericly, 12 June 2023. A real build in a courtyard, its failures and its limits: the story that goes with this lab. The video is sponsored, and gives no height, no power and no run time. No footage from it is reused.',
  ),
};

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    title: l('Autres vidéos', 'Other videos'),
    links: [
      {
        href: 'https://www.youtube.com/watch?v=iGGOjD_OtAM',
        label: 'The Energy Vault is a Dumb Idea, Here’s Why',
        note: l(
          'Adam Something, 20 décembre 2021. Le point de vue sceptique : le CO₂ du béton, le vent, une énergie jugée petite. Une opinion, dont le lab ne reprend que l’arithmétique.',
          'Adam Something, 20 December 2021. The sceptical view: the concrete’s CO₂, the wind, an energy judged small. An opinion, of which the lab keeps only the arithmetic.',
        ),
      },
      {
        href: 'https://www.youtube.com/watch?v=XxGQgAr4OCo',
        label: 'Energy Vault: MEGA-BUSTED!',
        note: l(
          'Thunderf00t, 28 mars 2022. Le calcul de coin de table et son meilleur argument : à la tonne, l’eau et le béton gardent la même énergie. Antérieure à la tour chinoise, avec une masse et une hauteur devinées.',
          'Thunderf00t, 28 March 2022. The back-of-the-envelope sum and its best point: per tonne, water and concrete keep the same energy. It predates the Chinese tower, and guesses its mass and height.',
        ),
      },
      {
        href: 'https://www.youtube.com/watch?v=I9lMcWJrkfQ',
        label: 'Stocker l’énergie grâce aux systèmes à poids tombants',
        note: l(
          'Globe Oculaire Technologique, 23 octobre 2025. Vue pour se faire une idée d’ensemble : ses chiffres ne sont pas utilisés, certains étant faux après vérification.',
          'Globe Oculaire Technologique, 23 October 2025. Watched for a general picture: its figures are not used, as some turned out wrong when checked.',
        ),
      },
    ],
  },
  {
    title: l('Les études', 'The studies'),
    links: [
      {
        href: 'https://research.ee.sun.ac.za/emr/emr/files/u1/2019-ELSEVIER-Botha.pdf',
        label: 'Botha & Kamper, 2019',
        note: l(
          'Capability study of dry gravity energy storage, Journal of Energy Storage : la référence d’ingénierie, de l’énergie aux règles de câble et de poulie.',
          'Capability study of dry gravity energy storage, Journal of Energy Storage: the engineering reference, from the energy to the rules for ropes and sheaves.',
        ),
      },
      {
        href: 'https://ora.ox.ac.uk/objects/uuid:0482b2fa-f51b-4276-a369-8892cb5095c4',
        label: 'Morstyn, Chilcott & McCulloch, 2019',
        note: l(
          'Gravity energy storage with suspended weights for abandoned mine shafts, Applied Energy : le calcul des poids, et le relevé de 3 234 puits des Midlands anglaises.',
          'Gravity energy storage with suspended weights for abandoned mine shafts, Applied Energy: the weight sizing, and the survey of 3,234 shafts in the English Midlands.',
        ),
      },
      {
        href: 'https://www.sandia.gov/app/uploads/sites/256/2024/02/ESGC-Cost-Performance-Report-2022-PNNL-33283.pdf',
        label: 'Viswanathan et al., PNNL, 2022',
        note: l(
          '2022 Grid Energy Storage Technology Cost and Performance Assessment, section 4.7 : coûts et rendements, fournis par les développeurs et non mis à jour en 2024.',
          '2022 Grid Energy Storage Technology Cost and Performance Assessment, section 4.7: costs and efficiencies, supplied by the developers and not updated in 2024.',
        ),
      },
      {
        href: 'https://ideas.repec.org/a/eee/energy/v254y2022ipas0360544222010052.html',
        label: 'Hunt et al., 2022',
        note: l(
          'Lift Energy Storage Technology, Energy : un coût modélisé dans les grands immeubles. Seul le résumé a été lu.',
          'Lift Energy Storage Technology, Energy: a modelled cost in tall buildings. Only the abstract was read.',
        ),
      },
    ],
  },
  {
    title: l('Les données publiées des fabricants', 'Makers’ published data'),
    links: [
      {
        href: 'https://www.aceindustries.com/content/StahlSH_Manual.pdf',
        label: l('STAHL CraneSystems, palans à câble SH, 07.2018', 'STAHL CraneSystems, SH wire rope hoists, 07.2018'),
        note: l(
          'Le tableau de référence : charge, course, vitesses, moteur, câble, cotes. Une copie hébergée par un revendeur. Aucun contact avec le fabricant, et la 3D reste générique.',
          'The reference table: load, stroke, speeds, motor, rope, dimensions. A copy hosted by a dealer. No contact with the maker, and the 3D stays generic.',
        ),
      },
      {
        href: 'https://www.pfeifer.info/out/assets/6X36WS-WC_SDB_EN_1.PDF',
        label: l('PFEIFER, câble 6x36WS-WC, 10/2020', 'PFEIFER, 6x36WS-WC rope, 10/2020'),
        note: l(
          'La masse linéique et les forces de rupture d’un câble générique.',
          'The mass per metre and the breaking forces of a generic rope.',
        ),
      },
      {
        href: 'https://pe.urany.net/assets/img/k_891_v17_en_26_03_2018.pdf',
        label: 'mayr, ROBA-stop-M, K.891.V17.EN',
        note: l(
          'La puissance de bobine d’un frein à ressorts, prise comme référence : ce n’est pas le frein du treuil.',
          'The coil power of a spring-applied brake, used as a reference: it is not the hoist’s own brake.',
        ),
      },
      {
        href: 'https://www.landratsamt-roth.de/uwao-api/web/files/bypath/Sonstiges/Veroeffentlichungen/Immissionsschutz/%C2%A7%C2%A7%204,%2010%20BImSchG%20/03.06.02-J-5868-Brochure-Legioblock-DE.pdf',
        label: 'Legioblock (Jansen Betonwaren)',
        note: l('Les tailles des blocs.', 'The sizes of the blocks.'),
      },
      {
        href: 'https://betonblock.com/en/products/concrete-blocks/160-80-80',
        label: 'Betonblock',
        note: l(
          'Le volume et la masse d’un bloc, annoncés par un fabricant de moules, à titre indicatif.',
          'The volume and mass of a block, stated by a mould maker, as an indication.',
        ),
      },
      {
        href: 'https://fvcomponentes.com/wp-content/uploads/2024/01/Pylontech-US5000-48KWh-48V.pdf',
        label: l('Pylontech US5000, fiche technique', 'Pylontech US5000, data sheet'),
        note: l(
          'Le module LFP du lab : énergie, taille, masse, courants.',
          'The lab’s LFP module: energy, size, mass, currents.',
        ),
      },
      {
        href: 'https://www.wattuneed.com/en/lithium-battery/1922-pylontech-lithium-battery-50-24-kwh-0768563815706.html',
        label: 'Wattuneed',
        note: l(
          'Le prix public de ce module, avril 2026, et sa durée de vie annoncée.',
          'The retail price of that module, April 2026, and its stated life.',
        ),
      },
      {
        href: 'https://en.wikipedia.org/wiki/Premium_efficiency',
        label: l('Encyclopédie, classes de rendement des moteurs', 'Encyclopaedia, motor efficiency classes'),
        note: l(
          'Le rendement nominal de classe IE3 que le modèle donne au moteur.',
          'The IE3 rated efficiency that the model gives the motor.',
        ),
      },
    ],
  },
  {
    title: l('Les projets réels, à leur date', 'The real projects, as of their date'),
    links: [
      {
        href: 'https://www.solarpowerportal.co.uk/gravitricity_celebrates_success_of_250kw_energy_storage_demonstrator',
        label: l('Solar Power Portal, 23 avril 2021', 'Solar Power Portal, 23 April 2021'),
        note: l(
          'Le démonstrateur de Gravitricity à Édimbourg : 2 × 25 t, tour de 15 m, 250 kW, démonté en juillet 2021.',
          'The Gravitricity demonstrator in Edinburgh: 2 × 25 t, a 15 m tower, 250 kW, taken down in July 2021.',
        ),
      },
      {
        href: 'https://www.solarpowerportal.co.uk/energy-storage/gravitricity-wound-up-voluntarily-with-under-8k-assets',
        label: l('Solar Power Portal, 13 février 2026', 'Solar Power Portal, 13 February 2026'),
        note: l(
          'La liquidation de Gravitricity Ltd, et l’état de ses actifs.',
          'The winding-up of Gravitricity Ltd, and the state of its assets.',
        ),
      },
      {
        href: 'https://www.thegazette.co.uk/notice/4975281',
        label: 'The London Gazette',
        note: l('L’avis de liquidation : 1er octobre 2025.', 'The winding-up notice: 1 October 2025.'),
      },
      {
        href: 'https://find-and-update.company-information.service.gov.uk/company/07827384',
        label: 'Companies House',
        note: l('Le registre britannique, société 07827384.', 'The British register, company 07827384.'),
      },
      {
        href: 'https://www.cleanthinking.de/gess-gravity-energy-storage-system/',
        label: l('Cleanthinking, mis à jour le 17 août 2026', 'Cleanthinking, updated 17 August 2026'),
        note: l(
          'Où en est Energy Vault en 2026 : Rudong, aucune installation en service commercial, un virage vers les batteries. Source secondaire.',
          'Where Energy Vault stands in 2026: Rudong, no plant in commercial operation, a turn towards batteries. A secondary source.',
        ),
      },
      {
        href: 'https://www.renewableenergyworld.com/?p=335639',
        label: l('Renewable Energy World, mai 2024', 'Renewable Energy World, May 2024'),
        note: l('Les essais de Rudong, en attente d’autorisations.', 'The Rudong tests, with approvals pending.'),
      },
      {
        href: 'https://en.wikipedia.org/wiki/Energy_Vault',
        label: l('Encyclopédie, Energy Vault', 'Encyclopaedia, Energy Vault'),
        note: l(
          'L’essai d’un bloc en décembre 2020, le seul chiffre proche d’une mesure. Aucun rapport d’origine n’a été trouvé.',
          'The one-block test of December 2020, the only figure close to a measurement. No primary report could be found.',
        ),
      },
      {
        href: 'https://www.srf.ch/news/schweiz/energiespeichernder-turm-superbatterie-aus-dem-tessin-stoesst-auf-internationales-interesse',
        label: 'SRF',
        note: l(
          'La tour du Tessin, dans la presse suisse. Lu en résumé.',
          'The Ticino tower, in the Swiss press. Read in summary.',
        ),
      },
      {
        href: 'https://www.laregione.ch/cantone/bellinzonese/1567649/servizi',
        label: 'laRegione',
        note: l('L’annonce de son démontage. Lu en résumé.', 'The announcement of its dismantling. Read in summary.'),
      },
      {
        href: 'https://eepower.com/news/green-gravity-tests-energy-storage-in-australian-mine-shaft/',
        label: 'EE Power',
        note: l(
          'Green Gravity à Russell Vale. Le début des essais n’est pas confirmé.',
          'Green Gravity at Russell Vale. The start of the trials is unconfirmed.',
        ),
      },
      {
        href: 'https://www.energy.nsw.gov.au/stories/green-gravity',
        label: l('Gouvernement de Nouvelle-Galles du Sud', 'New South Wales government'),
        note: l('Le même projet, vu par son soutien public.', 'The same project, seen by its public backer.'),
      },
      {
        href: 'https://www.engineeringforchange.org/solutions/product/deciwatt-gravitylight',
        label: 'Engineering for Change',
        note: l(
          'La lampe à poids GravityLight, le plus petit produit réel.',
          'The GravityLight weight-driven lamp, the smallest real product.',
        ),
      },
      {
        href: 'https://www.alpiq.com/energy/assets/hydropower/nant-de-drance-pumped-storage-power-plant',
        label: 'Alpiq',
        note: l('La centrale de pompage de Nant de Drance.', 'The Nant de Drance pumped-storage plant.'),
      },
      {
        href: 'https://en.wikipedia.org/wiki/Nant_de_Drance_Hydropower_Plant',
        label: l('Encyclopédie, Nant de Drance', 'Encyclopaedia, Nant de Drance'),
        note: l('Sa hauteur de chute et son volume.', 'Its head and its volume.'),
      },
    ],
  },
  {
    title: l('Le reste', 'The rest'),
    links: [
      {
        href: 'https://ekwateur.fr/blog/ma-consommation-d-energie/combien-consomme-un-frigo-quel-modele-choisir-en-2025/',
        label: 'ekWateur',
        note: l(
          'La consommation d’un frigo, d’après des chiffres attribués à l’ADEME.',
          'A fridge’s consumption, from figures attributed to ADEME.',
        ),
      },
      {
        href: 'https://selectra.info/energie/guides/conso/refrigerateur',
        label: 'Selectra',
        note: l('Les mêmes chiffres, sur un autre guide.', 'The same figures, in another guide.'),
      },
      {
        href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8970910/table/tab2',
        label: l('Carbone du béton, une étude', 'Concrete carbon, a study'),
        note: l('Une fourchette, à périmètres variables.', 'A range, with varying boundaries.'),
      },
      {
        href: 'https://www.frontiersin.org/articles/10.3389/fenvs.2026.1630913/full',
        label: l('Carbone des batteries, une étude', 'Battery carbon, a study'),
        note: l('Une fourchette, à périmètres variables.', 'A range, with varying boundaries.'),
      },
      {
        href: 'https://osha.europa.eu/en/legislation/directive/regulation-20231230eu-machinery',
        label: 'EU-OSHA',
        note: l('Le règlement européen sur les machines.', 'The European machinery regulation.'),
      },
      {
        href: 'https://www.seco.admin.ch/fr/machines',
        label: 'SECO',
        note: l('Les règles suisses sur les machines.', 'The Swiss rules on machinery.'),
      },
      {
        href: 'https://www.iso.org/standard/66759.html',
        label: 'ISO 4309',
        note: l(
          'Le soin, l’inspection et la dépose des câbles. Seule la page du catalogue a été lue : le texte est payant.',
          'The care, inspection and discard of ropes. Only the catalogue page was read: the text is paid for.',
        ),
      },
      {
        href: 'https://www.evs.ee/en/evs-en-14492-2-2019',
        label: 'EN 14492-2',
        note: l(
          'Les treuils et palans motorisés. Seule la page du catalogue a été lue.',
          'Powered hoists. Only the catalogue page was read.',
        ),
      },
      {
        href: 'https://pelton-lab.vercel.app',
        label: 'Pelton Lab',
        note: l(
          'Le premier lab de la série, sur une micro-centrale hydraulique.',
          'The first lab of the series, on a micro-hydro plant.',
        ),
      },
    ],
  },
];

/** The Sources panel, for `about` in src/lab.ts. */
export function sourcesPanel(ctx: AppContext): HTMLElement[] {
  const link = (s: SourceLink): HTMLElement =>
    h(
      'li',
      {},
      h(
        'a',
        { href: s.href, target: '_blank', rel: 'noopener noreferrer' },
        typeof s.label === 'string' ? s.label : tr(s.label),
      ),
      ' — ',
      tr(s.note),
    );
  const warn = (key: 'safety' | 'legal'): HTMLElement =>
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t(key)));
  const tip = (key: 'disclaimer' | 'noticeGeneric' | 'noticeMarks'): HTMLElement =>
    h('div', { class: 'callout callout--tip' }, h('span', {}, t(key)));
  return [
    tip('disclaimer'),
    tip('noticeGeneric'),
    tip('noticeMarks'),
    warn('safety'),
    warn('legal'),
    h('h3', { class: 'section-title' }, t('sourceMain')),
    h('ul', { class: 'links' }, link(MAIN_VIDEO)),
    h('h3', { class: 'section-title' }, t('chapters')),
    h(
      'ul',
      { class: 'chapters' },
      ...CHAPTERS.map(([ts, fr, en]) =>
        h(
          'li',
          {},
          h('a', { href: ctx.videoUrl(ts), target: '_blank', rel: 'noopener noreferrer' }, ts),
          ' ',
          tr({ fr, en }),
        ),
      ),
    ),
    ...SOURCE_GROUPS.flatMap((g) => [
      h('h3', { class: 'section-title' }, tr(g.title)),
      h('ul', { class: 'links' }, ...g.links.map(link)),
    ]),
    h('p', { class: 'hint' }, t('sourcesNoCopy')),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  ];
}
