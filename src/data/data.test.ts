import { describe, expect, it } from 'vitest';
import type { GuideStep, PartInfo } from '@onigam/lab-kit/content';
import { setLang, type L } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { LAB_STRINGS } from '../i18n/ui';
import { tagMark } from '../sim/ladder';
import { installFakeDom } from '../panels/test-dom';
import {
  BLOCK,
  FARM_MASS,
  FARM_STROKE,
  HALF_BLOCK,
  HOOK_APPROACH,
  HOIST_MASS,
  ROPE_DIAMETER,
  ROPE_FMIN,
} from '../sim/machine';
import { HOIST, MODULE } from '../three/dims';
import { POWER_PARTS } from '../three/powerroom/parts';
import { HOIST_PARTS } from '../three/rig/hoist';
import { TOWER_PARTS } from '../three/rig/machine';
import siteScene from '../three/site/scene.ts?raw';
import { ASSEMBLY } from './assembly';
import { CHAPTERS, VIDEO_ID } from './chapters';
import { FIG, markOf, type Fig } from './figures';
import { INSTALL } from './install';
import { OVERVIEWS, WORLD_IDS } from './overviews';
import { PARTS } from './parts';
import { MAIN_VIDEO, SOURCE_GROUPS, sourcesPanel } from './sources';
import { DIM_SPECS } from './parts/dim-specs';
import { nEn, nFr } from './units';

// Content checks of the data role: the catalogue and the guides against the ids of docs/research.md §4, FR/EN parity, the rules of the visitor's texts (no research code, no internal
// word, nobody named outside the Sources and lesson 6, British spelling), the marks on the numbers, and the things the owner's reviews asked to be said once.

const IDS: Record<string, string[]> = {
  site: [
    'barn-solar-roof',
    'farmhouse',
    'machine-tower',
    'power-shed',
    'cable-trench',
    'grid-connection',
    'exclusion-fence',
    'interlocked-gate',
    'wind-mast',
    'block-yard',
  ],
  tower: [
    'foundation-pad',
    'tower-leg',
    'tower-bracing',
    'head-frame',
    'guide-rail',
    'end-buffer',
    'weight-carrier',
    'concrete-block',
    'stack-tie',
    'guide-shoe',
    'safety-gear',
    'hook-block',
    'hoist-rope',
    'service-ladder',
    'height-scale',
  ],
  hoist: [
    'hoist-motor',
    'motor-encoder',
    'service-brake',
    'hoist-gearbox',
    'rope-drum',
    'drum-brake',
    'rope-guide',
    'rope-anchor',
    'return-sheave',
    'overload-cell',
    'limit-switch',
    'overspeed-governor',
    'hoist-base',
  ],
  'power-room': [
    'pv-inverter',
    'energy-meter',
    'ac-panel',
    'regen-supply',
    'dc-link',
    'motor-inverter',
    'brake-chopper',
    'brake-resistor',
    'motor-cable',
    'safety-controller',
    'emergency-stop',
    'control-ups',
    'battery-inverter',
    'lfp-module',
  ],
};
const ALL_IDS = Object.values(IDS).flat();
const SCENE_OF = new Map(Object.entries(IDS).flatMap(([scene, ids]) => ids.map((id) => [id, scene] as const)));

const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && 'fr' in v && 'en' in v;
const sentences = (t: string): number => t.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9«“"(*])/).length;
const words = (t: string): number => t.trim().split(/\s+/).length;

function partTexts(p: PartInfo): [string, L][] {
  const out: [string, L][] = [
    ['name', p.name],
    ['short', p.short],
    ['description', p.description],
    ['material', p.material],
  ];
  if (p.maintenance) out.push(['maintenance', p.maintenance]);
  if (p.tip) out.push(['tip', p.tip]);
  if (p.design) out.push(['design', p.design]);
  const generated = DIM_SPECS[p.id]?.length ?? 0;
  p.specs.slice(0, p.specs.length - generated).forEach((s, i) => {
    out.push([`specs[${i}].label`, s.label]);
    if (isL(s.value)) out.push([`specs[${i}].value`, s.value]);
    else out.push([`specs[${i}].value`, { fr: s.value, en: s.value }]);
  });
  return out;
}

function stepTexts(s: GuideStep): [string, L][] {
  const out: [string, L][] = [
    ['title', s.title],
    ['text', s.text],
  ];
  if (s.tip) out.push(['tip', s.tip]);
  if (s.warning) out.push(['warning', s.warning]);
  s.tools?.forEach((t, i) => out.push([`tools[${i}]`, t]));
  return out;
}

/** Every bilingual text of the sheets, the guides, the overviews and the chapters, labelled. `legal` and the Sources have their own rules, below. */
function allTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) for (const [k, v] of partTexts(p)) out.push([`part ${p.id}.${k}`, v]);
  for (const [guide, steps] of [
    ['assembly', ASSEMBLY],
    ['install', INSTALL],
  ] as const)
    for (const s of steps) for (const [k, v] of stepTexts(s)) out.push([`${guide} ${s.id}.${k}`, v]);
  for (const [world, o] of Object.entries(OVERVIEWS)) {
    out.push([`overview ${world}.title`, o.title]);
    out.push([`overview ${world}.text`, o.text]);
  }
  for (const [ts, fr, en] of CHAPTERS) out.push([`chapter ${ts}`, { fr, en }]);
  return out;
}

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
function numbers(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

/**
 * The figures that are REPORTED by a source, written in the text with no mark, each with where it comes from (research numbers). Anything else must carry a mark; `lf` adds it to a
 * placeholder, and the test below catches a number typed by hand.
 */
const REPORTED = new Set(
  [
    // the machine as published: K6, K8, K10, K13, K15, S9
    '20', // t and m (K6), mm (K13)
    '4', // m/min, four falls (K8, K6), "4 ×" bolts
    '0.08', // m/min (K8)
    '15', // kW (K10), and the 15 m tower of Edinburgh (K19)
    '100', // Hz (K10), the reference brake's N·m (K16), 1 kW at 100 Hz
    '28', // A (K10)
    '0.82', // cos φ (K10)
    '70', // % duty (K10)
    '206', // mm² (K13)
    '315', // kN (K13)
    '5', // the maker's factor of 5 (K13), a 5 kW motor on the slider (physics.md K49)
    '1321', // kg (K15)
    '30', // M30 (S9)
    '34', // Ø34 (S9)
    '0.83', // m, the hook's approach (S9)
    '2.468', // e1 (S9)
    '1.94', // e12 (S9)
    '1.314', // overall (S9)
    '0.924', // frame (S9)
    '2.33', // h/day, group M5's worked example (S9 p. 1/20)
    '1.5', // s, the shortest ramp (S9 p. 1/14)
    '3', // three sheaves, the reeving of the table (K6); × 3 in the cable's loss formula
    '18', // × the rope for a sheave (S6 table 7)
    // the brake: K16
    '66', // IP 66
    '1',
    '2', // 1 to 2 million operations; 2 × 25 t (K19)
    '69', // W, the reference brake
    // the blocks: K17, K18, S12
    '1.6',
    '0.8',
    '0.4',
    '2.4',
    '1.2',
    '2400',
    '1200',
    '6', // six whole blocks (K18)
    // real machines: K19, K29
    '25', // 2 × 25 t
    '2021',
    '12', // kg, the stall (K29)
    '27', // 1:27 (K29)
    '620', // rpm (K29)
    '16000', // rpm (S1)
    '160', // kg, the pulley (K29)
    // the fridge: K42
    '174',
    '346',
    // the module: K31
    '4.8',
    '4.56',
    '48',
    '442',
    '420',
    '162',
    '40',
    '50',
    '6000',
    '1110.80',
    '2026',
    // what others claim: K35
    '75',
    '90',
    // the supply of the farm: research §0
    '400',
  ].map(String),
);
/** A text without the names that hold digits but are no figures: the bolt class, the protection class, the motor class. */
const bare = (t: string): string =>
  t
    .replace(/M30-8\.8/g, 'M30')
    .replace(/\bIE3\b/g, '')
    .replace(/CO₂/g, 'CO');

/** Numbers of the timestamps and of what a guide or a chapter names as a label ("12 V" in the outline of the video). */
const CHAPTER_NUMBERS = new Set(['12']);

const figNumbers = new Set(
  Object.values(FIG as Record<string, Fig>).flatMap((f) => [
    numbers(nFr(f.v, f.d), 'fr')[0],
    numbers(nEn(f.v, f.d), 'en')[0],
  ]),
);

describe('parts catalogue', () => {
  it('has exactly the ids of docs/research.md §4, each once, in that order, 52 in all', () => {
    expect(PARTS.map((p) => p.id)).toEqual(ALL_IDS);
    expect(new Set(ALL_IDS).size).toBe(52);
  });
  it('gives every part its world and a category of the kit', () => {
    for (const p of PARTS) {
      expect(p.scene, p.id).toBe(SCENE_OF.get(p.id));
      expect(['mechanical', 'electrical', 'structure', 'site'], p.id).toContain(p.category);
    }
  });
  it('has at least three specs per part, a one-line summary, and a description of two to seven sentences', () => {
    for (const p of PARTS) {
      expect(p.specs.length, p.id).toBeGreaterThanOrEqual(3);
      for (const lang of ['fr', 'en'] as const) {
        expect(p.short[lang].length, `${p.id} short ${lang}: ${p.short[lang].length}`).toBeLessThanOrEqual(170);
        expect(p.short[lang], p.id).not.toMatch(/\n/);
        const n = sentences(p.description[lang]);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeGreaterThanOrEqual(2);
        expect(n, `${p.id}.description ${lang}: ${n} sentences`).toBeLessThanOrEqual(8);
      }
    }
  });
  it('writes the maintenance in three labelled paragraphs, and gives every part a tip and a design note', () => {
    for (const p of PARTS) {
      expect(p.tip, `${p.id} tip`).toBeDefined();
      expect(p.design, `${p.id} design`).toBeDefined();
      for (const [lang, labels] of [
        ['fr', ['**Panne à prévoir.**', '**À vérifier.**', '**Entretien.**']],
        ['en', ['**Typical failure.**', '**How to check.**', '**Maintenance.**']],
      ] as const) {
        const paragraphs = p.maintenance![lang].split('\n\n');
        expect(paragraphs.length, `${p.id} ${lang}`).toBe(3);
        labels.forEach((label, i) => expect(paragraphs[i]?.startsWith(label), `${p.id} ${lang} ${label}`).toBe(true));
      }
    }
  });
  it('has enough to feed the spoken guide: at least 120 words a sheet in each language, before the specs', () => {
    for (const p of PARTS) {
      for (const lang of ['fr', 'en'] as const) {
        const n = words(`${p.description[lang]} ${p.design?.[lang] ?? ''} ${p.tip?.[lang] ?? ''}`);
        expect(n, `${p.id} ${lang}: ${n} words`).toBeGreaterThanOrEqual(120);
      }
    }
  });
  it('links the video only where the video really shows the thing, inside its 23 minutes', () => {
    const linked = PARTS.filter((p) => p.video).map((p) => p.id);
    expect(linked.length).toBeGreaterThanOrEqual(8);
    for (const p of PARTS) {
      let last = -1;
      for (const ts of p.video ?? []) {
        expect(ts, p.id).toMatch(/^\d{2}:[0-5]\d$/);
        const [m, s] = ts.split(':').map(Number);
        const at = (m ?? 0) * 60 + (s ?? 0);
        expect(at, p.id).toBeGreaterThan(last);
        expect(at, p.id).toBeLessThanOrEqual(23 * 60 + 1);
        last = at;
      }
    }
  });
  it('generates its dimension rows from dims.ts for ids that exist', () => {
    for (const id of Object.keys(DIM_SPECS)) expect(ALL_IDS, id).toContain(id);
    expect(Object.keys(DIM_SPECS).length).toBeGreaterThanOrEqual(30);
  });
  it('matches what the prose types by hand against the simulation and the dimensions', () => {
    expect(FARM_MASS).toBe(20000);
    expect(FARM_STROKE).toBe(20);
    expect(HOIST_MASS).toBe(1321);
    expect(ROPE_DIAMETER).toBe(0.02);
    expect(ROPE_FMIN).toBe(315000);
    expect(HOOK_APPROACH).toBe(0.83);
    expect([BLOCK.length, BLOCK.width, BLOCK.height, BLOCK.mass]).toEqual([1.6, 0.8, 0.8, 2400]);
    expect([HALF_BLOCK.length, HALF_BLOCK.width, HALF_BLOCK.height, HALF_BLOCK.mass]).toEqual([1.6, 0.8, 0.4, 1200]);
    expect([HOIST.e1, HOIST.e12, HOIST.overall, HOIST.frameW, HOIST.hole, HOIST.bolt]).toEqual([
      2.468, 1.94, 1.314, 0.924, 0.034, 0.03,
    ]);
    expect([MODULE.w, MODULE.d, MODULE.h, MODULE.kg]).toEqual([0.442, 0.42, 0.162, 40]);
  });
});

function guideChecks(name: string, steps: GuideStep[], count: number) {
  describe(`the ${name} guide`, () => {
    it(`has ${count} steps, with distinct ids`, () => {
      expect(steps.length).toBe(count);
      expect(new Set(steps.map((s) => s.id)).size).toBe(count);
    });
    it('frames, in every step, parts that exist in the world of the step', () => {
      for (const s of steps) {
        expect(s.parts.length, s.id).toBeGreaterThan(0);
        for (const id of s.parts) expect(SCENE_OF.get(id), `${s.id}: ${id}`).toBe(s.scene);
      }
    });
    it('names in bold what it installs, in both languages', () => {
      for (const s of steps)
        for (const lang of ['fr', 'en'] as const) expect(s.text[lang], `${s.id} ${lang}`).toMatch(/\*\*/);
    });
    it('stays short enough to read beside the 3D view: at most 90 words a step', () => {
      for (const s of steps)
        for (const lang of ['fr', 'en'] as const)
          expect(words(s.text[lang]), `${s.id} ${lang}: ${words(s.text[lang])} words`).toBeLessThanOrEqual(90);
    });
    it('gives no duration and no torque: no source has any, and this is not a build manual', () => {
      for (const s of steps) {
        expect(s.duration, s.id).toBeUndefined();
        expect(s.torque, s.id).toBeUndefined();
      }
    });
  });
}
guideChecks('assembly', ASSEMBLY, 20);
guideChecks('installation', INSTALL, 10);

describe('the two guides together', () => {
  it('assembly installs every part of `tower` and `hoist`, and `machine-tower` last', () => {
    const named = new Set(ASSEMBLY.flatMap((s) => s.parts));
    for (const id of [...(IDS.tower ?? []), ...(IDS.hoist ?? [])]) expect(named.has(id), id).toBe(true);
    expect(ASSEMBLY[ASSEMBLY.length - 1]?.parts).toEqual(['machine-tower']);
  });
  it('installation installs every part of `power-room`, and the farm’s links', () => {
    const named = new Set(INSTALL.flatMap((s) => s.parts));
    for (const id of IDS['power-room'] ?? []) expect(named.has(id), id).toBe(true);
    for (const id of ['power-shed', 'cable-trench', 'grid-connection', 'interlocked-gate', 'wind-mast'])
      expect(named.has(id), id).toBe(true);
  });
  it('follows the order of the research', () => {
    expect(ASSEMBLY.map((s) => s.id).slice(0, 3)).toEqual(['survey', 'soil-pad', 'anchors']);
    expect(INSTALL[1]?.id).toBe('grid');
    expect(INSTALL[9]?.id).toBe('commission');
  });
});

describe('the catalogue and the 3D registries', () => {
  it('use the same ids, world by world, so that every id of a guide step or a lesson can be seen', () => {
    const site = [...siteScene.matchAll(/registry\.add\('([a-z-]+)'/g)].map((m) => m[1]);
    expect([...site].sort()).toEqual([...(IDS.site ?? [])].sort());
    expect([...TOWER_PARTS].sort()).toEqual([...(IDS.tower ?? [])].sort());
    expect([...HOIST_PARTS].sort()).toEqual([...(IDS.hoist ?? [])].sort());
    expect([...POWER_PARTS].sort()).toEqual([...(IDS['power-room'] ?? [])].sort());
  });
});

describe('every text', () => {
  const texts = allTexts();
  it('finds what it should', () => {
    expect(texts.length).toBeGreaterThan(600);
  });
  it('is bilingual, with no empty text, and a similar length', () => {
    for (const [where, t] of texts) {
      expect(t.fr.trim().length, `${where} fr`).toBeGreaterThan(0);
      expect(t.en.trim().length, `${where} en`).toBeGreaterThan(0);
      if (t.fr.length > 60 && t.en.length > 60) {
        const ratio = t.fr.length / t.en.length;
        expect(ratio, `${where}: fr ${t.fr.length} / en ${t.en.length}`).toBeGreaterThan(0.75);
        expect(ratio, `${where}: fr ${t.fr.length} / en ${t.en.length}`).toBeLessThan(1.4);
      }
    }
  });
  it('carries the same numbers in both languages', () => {
    for (const [where, t] of texts) expect(numbers(t.fr, 'fr'), where).toEqual(numbers(t.en, 'en'));
  });
  it('quotes no number but the research’s, the dimensions’ or the model’s', () => {
    const odd: string[] = [];
    for (const [where, t] of texts) {
      if (where.startsWith('chapter ')) {
        for (const n of numbers(t.en, 'en')) if (!CHAPTER_NUMBERS.has(n)) odd.push(`${where}: ${n}`);
        continue;
      }
      for (const lang of ['fr', 'en'] as const) {
        for (const n of numbers(bare(t[lang]), lang))
          if (!REPORTED.has(n) && !figNumbers.has(n)) odd.push(`${where} (${lang}): ${n}`);
      }
    }
    expect(odd.join('\n')).toBe('');
  });
  it('keeps its list of reported numbers honest: each one is used by some text', () => {
    const used = new Set(texts.flatMap(([, t]) => numbers(bare(t.fr), 'fr')));
    expect([...REPORTED].filter((n) => !used.has(n))).toEqual([]);
  });
  it('marks every number that is not reported: † or *, right behind its unit', () => {
    const unmarked: string[] = [];
    for (const [where, t] of texts) {
      if (where.startsWith('chapter ')) continue;
      for (const lang of ['fr', 'en'] as const) {
        const re = lang === 'fr' ? /\d+(?: \d{3})*(?:,\d+)?/g : /\d+(?:,\d{3})*(?:\.\d+)?/g;
        const text = bare(t[lang]);
        for (const m of text.matchAll(re)) {
          const n = numbers(m[0], lang)[0] ?? '';
          if (REPORTED.has(n)) continue;
          const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 12);
          if (!/^(?: ?[\p{L}/%²³·:€$]+(?:\/\p{L}+)?\d?)?[†*]/u.test(after))
            unmarked.push(`${where} (${lang}): ${m[0]}${after}`);
        }
      }
    }
    expect(unmarked.join('\n')).toBe('');
  });
  it('never writes the figures the physics corrected, nor the claim it refuted', () => {
    const banned: [RegExp, string][] = [
      [/\b1[,.]2 kW/, 'the old cut-in'],
      [/\b0[,.]37 m\/min/, 'the old cut-in speed'],
      [/cannot be served|ne peut pas être servi|cannot serve/i, 'a fridge can be served, at a price'],
      [/\b0[,.]7 ?%/, 'the rope in mass, not energy'],
      [/9[,.]6 MJ/, 'a source’s error'],
      [/gravitricity\.com/i, 'a casino page'],
      [/flywheel|volant d’inertie|TEDx/i, 'the talk that is not about gravity'],
    ];
    for (const [where, t] of texts) {
      for (const [re, why] of banned) {
        expect(re.test(t.fr), `${where} fr: ${why}`).toBe(false);
        expect(re.test(t.en), `${where} en: ${why}`).toBe(false);
      }
    }
  });
  it('shows no research code, no internal word, no placeholder', () => {
    for (const [where, t] of texts) {
      for (const text of [t.fr, t.en]) {
        expect(text, where).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, where).not.toMatch(/\{\w+\}|undefined|NaN|TODO|lorem|dims\.ts|\bpreset\b/);
      }
    }
  });
  it('names nobody: makers, channels and companies stay in the Sources and lesson 6', () => {
    const names =
      /STAHL|PFEIFER|\bmayr\b|Legioblock|Jansen|Betonblock|Pylontech|Wattuneed|Gravitricity|Energy Vault|Huisman|Deciwatt|GravityLight|Green Gravity|engineericly|Adam Something|Thunderf00t|Globe Oculaire/i;
    for (const [where, t] of texts) {
      expect(names.test(t.fr), `${where}: ${t.fr.match(names)?.[0]}`).toBe(false);
      expect(names.test(t.en), `${where}: ${t.en.match(names)?.[0]}`).toBe(false);
    }
  });
  it('writes British English', () => {
    const us =
      /\b(color|center|centered|aluminum|gray|fiber|liter|meters?\b(?=\s+(?:of|long|high|wide|tall))|organiz|recogniz|analyz|harbor|tonne?s? of steel\b(?!)|defense|neighbor|program\b(?!me)|labor)\b/i;
    for (const [where, t] of texts) expect(us.test(t.en), `${where}: ${t.en.match(us)?.[0]}`).toBe(false);
  });
  it('writes typographic apostrophes and no doubled space', () => {
    for (const [where, t] of texts) {
      for (const text of [t.fr, t.en]) {
        expect(text, where).not.toMatch(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/);
        expect(text, where).not.toMatch(/ {2,}/);
        expect(text, where).toBe(text.trim());
      }
    }
  });
  it('does not repeat what must be said once', () => {
    const count = (re: RegExp) => texts.filter(([, t]) => re.test(t.fr) || re.test(t.en)).map(([w]) => w);
    expect(count(/charge suspendue|suspended load/i)).toEqual(['overview tower.text']);
    expect(count(/reconstitution|reconstruction/i)).toEqual(['overview tower.text']);
    expect(count(/avis juridique|legal advice/i)).toEqual(['install grid.warning']);
    expect(count(/ne pas construire|not for construction/i)).toEqual([]);
  });
  it('says the regenerative supply is ours, not the catalogue’s, and the fridge costs 2 kW rather than being impossible', () => {
    const part = (id: string) => PARTS.find((p) => p.id === id)!;
    expect(part('regen-supply').description.en).toMatch(/not a catalogue part/);
    expect(part('regen-supply').description.fr).toMatch(/pas une pièce du catalogue/);
    expect(part('farmhouse').description.en).toMatch(/costs 2\.02 kW\*/);
    expect(part('farmhouse').description.fr).toMatch(/coûtent 2,02 kW\*/);
  });
});

describe('the worlds’ overviews', () => {
  it('has the four worlds, each with a title and bold part names', () => {
    expect(Object.keys(OVERVIEWS)).toEqual([...WORLD_IDS]);
    for (const w of WORLD_IDS) {
      expect(OVERVIEWS[w].title.fr).not.toBe(OVERVIEWS[w].title.en);
      expect(OVERVIEWS[w].text.fr, w).toMatch(/\*\*/);
      expect(OVERVIEWS[w].text.en, w).toMatch(/\*\*/);
    }
  });
  it('explains the marks once, in the first world', () => {
    const said = WORLD_IDS.filter((w) =>
      /†/.test(OVERVIEWS[w].text.en.replace(/\d[\d.,]* ?\p{L}*(?:\/\p{L}+)?†/gu, '')),
    );
    expect(said).toEqual(['site']);
  });
});

describe('the Sources', () => {
  const links = [MAIN_VIDEO, ...SOURCE_GROUPS.flatMap((g) => g.links)];
  it('builds its panel in both languages, with the notices, the credits and the outline', () => {
    installFakeDom();
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      const ctx = {
        videoUrl: (ts: string) => `https://www.youtube.com/watch?v=${VIDEO_ID}&t=${ts}`,
      } as unknown as AppContext;
      const html = sourcesPanel(ctx)
        .map((e) => (e as unknown as { textContent: string }).textContent)
        .join(' ');
      expect(html).toContain(lang === 'fr' ? 'charge suspendue' : 'suspended load');
      expect(html).toContain('DIY Gravity Battery');
      expect(html).toContain('STAHL');
      expect(html).toContain('18:58');
    }
    setLang('fr');
  });
  it('credits and links every source with an address and a note in both languages', () => {
    expect(links.length).toBeGreaterThan(30);
    for (const s of links) {
      expect(s.href, s.href).toMatch(/^https:\/\//);
      expect(s.note.fr.length, s.href).toBeGreaterThan(5);
      expect(s.note.en.length, s.href).toBeGreaterThan(5);
    }
    expect(new Set(links.map((s) => s.href)).size).toBe(links.length);
  });
  it('credits the videos and the makers, and leaves out what the research rejected', () => {
    const text = links.map((s) => `${s.href} ${typeof s.label === 'string' ? s.label : s.label.en}`).join(' ');
    for (const needed of [
      'MVuVJC8lGck',
      'iGGOjD_OtAM',
      'XxGQgAr4OCo',
      'I9lMcWJrkfQ',
      'STAHL',
      'PFEIFER',
      'mayr',
      'Legioblock',
      'Pylontech',
    ])
      expect(text).toContain(needed);
    expect(text).not.toContain('N2u6EDwumdQ'); // the TEDx talk, about a flywheel
    expect(text.toLowerCase()).not.toContain('gravitricity.com'); // a casino page now
  });
  it('says plainly that the figures of the French overview video are not used', () => {
    const s = links.find((x) => x.href.includes('I9lMcWJrkfQ'))!;
    expect(s.note.en).toMatch(/figures are not used/);
    expect(s.note.fr).toMatch(/chiffres ne sont pas utilisés/);
  });
  it('holds the outline of the main video within its length, in order', () => {
    const at = CHAPTERS.map(([ts]) => {
      const [m, s] = ts.split(':').map(Number);
      return (m ?? 0) * 60 + (s ?? 0);
    });
    expect(at).toEqual([...at].sort((a, b) => a - b));
    expect(at[at.length - 1]).toBeLessThanOrEqual(23 * 60 + 1);
  });
  it('holds the notices said once in the interface strings, in both languages', () => {
    expect(LAB_STRINGS.safety[1]).toMatch(/suspended load/);
    expect(LAB_STRINGS.safety[0]).toMatch(/charge suspendue/);
    expect(LAB_STRINGS.disclaimer[1]).toMatch(/educational reconstruction/);
    expect(LAB_STRINGS.legal[0]).toMatch(/2023\/1230/);
    expect(LAB_STRINGS.legal[1]).toMatch(/2023\/1230/);
    expect(markOf('derived')).toBe('†');
    expect(markOf('model')).toBe('*');
  });
  it('gives a mark one meaning: the panel’s and the sheets’ tags mark as the texts do', () => {
    for (const s of ['derived', 'model', 'estimate', 'assumption'] as const) expect(tagMark(s)).toBe(markOf(s));
    expect(tagMark('reported')).toBe('');
  });
});
