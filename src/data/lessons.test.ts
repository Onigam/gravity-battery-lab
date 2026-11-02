import { describe, expect, it } from 'vitest';
import type { L } from '@onigam/lab-kit/i18n';
import { SIM_STRINGS } from '../panels/strings';
import { CARRIER_MASS } from '../sim/machine';
import { SCENARIO_IDS, scenarioSetup } from '../sim/presets';
import { FIG, type Fig } from './figures';
import { LESSONS } from './lessons';
import { ASSEMBLY } from './assembly';
import { INSTALL } from './install';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';
import { nEn, nFr } from './units';

// The six lessons: the contract (ids, worlds, parts, scenarios), the shape, the honest points, and the names of the scenarios, which the visitor must find in the panel word for word.

const words = (t: string): number => t.trim().split(/\s+/).length;
const SCENARIO_KEY: Record<string, keyof typeof SIM_STRINGS> = {
  'sunny-day': 'scenarioSunnyDay',
  kettle: 'scenarioKettle',
  'fridge-direct': 'scenarioFridgeDirect',
  'fridge-buffer': 'scenarioFridgeBuffer',
  night: 'scenarioNight',
  'too-light': 'scenarioTooLight',
  blackout: 'scenarioBlackout',
  overspeed: 'scenarioOverspeed',
  'wind-stop': 'scenarioWindStop',
  race: 'scenarioRace',
};
const labels = (id: string): { fr: string; en: string } => {
  const [fr, en] = SIM_STRINGS[SCENARIO_KEY[id] ?? 'scenarioRace'];
  return { fr, en };
};
const bodyOf = (lesson: (typeof LESSONS)[number], lang: 'fr' | 'en'): string =>
  lesson.body.map((b) => b[lang]).join(' ');

function texts(): [string, L][] {
  const out: [string, L][] = [];
  for (const les of LESSONS) {
    out.push([`${les.id}.title`, les.title], [`${les.id}.summary`, les.summary]);
    les.body.forEach((b, i) => out.push([`${les.id}.body[${i}]`, b]));
    les.figures?.forEach((f, i) => {
      out.push([`${les.id}.figures[${i}].label`, f.label]);
      if (typeof f.value !== 'string') out.push([`${les.id}.figures[${i}].value`, f.value]);
    });
    les.quiz?.forEach((qu, i) => {
      out.push([`${les.id}.quiz[${i}].q`, qu.q], [`${les.id}.quiz[${i}].explain`, qu.explain]);
      qu.choices.forEach((c, j) => out.push([`${les.id}.quiz[${i}].choices[${j}]`, c]));
    });
  }
  return out;
}

function numbers(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

/** The numbers a lesson may quote with no mark, with their source (research numbers). Reported figures only. */
const REPORTED = new Set([
  '9.81', // g
  '3.6', // MJ per kWh
  '20', // t and m (K6); 20 GWh (K33)
  '40', // kg (K31)
  '8', // kg, the light end of the lamp's bag (K28)
  '12.5', // kg, its heavy end (K28)
  '1.8', // m (K28)
  '2', // 2 × 25 t (K19)
  '25', // t (K19); 25 million m³ (K33); 25 MW (K23)
  '15', // m (K19), kW (K10)
  '4', // m/min (K8)
  '0.08', // m/min (K8)
  '12', // kg (K29)
  '27', // 1:27 (K29)
  '1', // 1:27, £1 M, 1 October (K19, K40), 1 kW of the race
  '46', // kg (K29)
  '5', // the maker's factor (K13), a 5 kW motor on the slider
  '315', // kN (K13)
  '80', // % (K35)
  '90', // % (K35)
  '2020', // (K21)
  '2021', // (K19)
  '2022', // the videos (S5)
  '2023', // Rudong (K23)
  '2025', // liquidation (K40)
  '2026', // Rudong, approvals (K23)
  '75', // % (K21)
  '1.5', // kW, the garden preset (physics.md)
  '300', // kW, the structure at a large size (physics.md)
  '250', // kW (K19)
  '100', // MWh (K23); 100 m (K38)
  '2000', // m (K38)
  '340', // (K25)
  '3234', // (K25)
  '0.804', // GWh (K25)
  '150', // kW (K27)
  '400', // m (K27)
]);
const figNumbers = new Set(
  Object.values(FIG as Record<string, Fig>).flatMap((f) => [
    numbers(nFr(f.v, f.d), 'fr')[0],
    numbers(nEn(f.v, f.d), 'en')[0],
  ]),
);
const bare = (t: string): string => t.replace(/CO₂/g, 'CO');

describe('the lessons', () => {
  it('are six, with 15 questions (the bar asks for 6 and 12, the research planned 14)', () => {
    expect(LESSONS.length).toBe(6);
    expect(LESSONS.map((l) => l.quiz?.length)).toEqual([3, 2, 3, 2, 2, 3]);
  });
  it('open each on one world, one existing part of that world, and a scenario of the simulation', () => {
    for (const les of LESSONS) {
      expect(['site', 'tower', 'hoist', 'power-room'], les.id).toContain(les.focus.scene);
      const part = PARTS.find((p) => p.id === les.focus.part);
      expect(part?.scene, les.id).toBe(les.focus.scene);
      expect(SCENARIO_IDS, les.id).toContain(les.focus.scenario);
    }
    expect(LESSONS.map((l) => l.focus.scenario)).toEqual([
      'night',
      'sunny-day',
      'fridge-direct',
      'too-light',
      'overspeed',
      'race',
    ]);
  });
  it('reach all ten scenarios: opened by a lesson, or named word for word in its text', () => {
    for (const id of SCENARIO_IDS) {
      const opened = LESSONS.some((l) => l.focus.scenario === id);
      const named =
        LESSONS.some((l) => bodyOf(l, 'fr').includes(`« ${labels(id).fr} »`)) &&
        LESSONS.some((l) => bodyOf(l, 'en').includes(`“${labels(id).en}”`));
      expect(opened || named, id).toBe(true);
    }
  });
  it('name every scenario the way the panel does, in the sheets and guides too', () => {
    const known = {
      fr: new Set(SCENARIO_IDS.map((i) => labels(i).fr)),
      en: new Set(SCENARIO_IDS.map((i) => labels(i).en)),
    };
    const all: L[] = [
      ...PARTS.flatMap((p) => (p.tip ? [p.tip] : [])),
      ...[...ASSEMBLY, ...INSTALL].flatMap((s) => (s.tip ? [s.tip] : [])),
      ...Object.values(OVERVIEWS).map((o) => o.text),
      ...LESSONS.flatMap((l) => l.body),
    ];
    for (const t of all) {
      for (const m of t.fr.matchAll(/scénario[s]? « ([^»]+) »/g)) expect(known.fr.has(m[1] ?? ''), m[1]).toBe(true);
      for (const m of t.en.matchAll(/“([^”]+)” scenario/g)) expect(known.en.has(m[1] ?? ''), m[1]).toBe(true);
    }
  });
  it('have four paragraphs of at most 95 words, a formula and three chips', () => {
    for (const les of LESSONS) {
      expect(les.body.length, les.id).toBe(4);
      expect(les.formula, les.id).toBeTruthy();
      expect(les.figures?.length, les.id).toBe(3);
      for (const b of les.body) {
        for (const lang of ['fr', 'en'] as const)
          expect(words(b[lang]), `${les.id} ${lang}: ${words(b[lang])} words`).toBeLessThanOrEqual(95);
      }
    }
  });
  it('ask questions with three choices of about the same length, the right answer not always in one place', () => {
    const answers = new Set<number>();
    for (const les of LESSONS) {
      for (const qu of les.quiz ?? []) {
        expect(qu.choices.length, les.id).toBe(3);
        expect(qu.answer, les.id).toBeLessThan(3);
        answers.add(qu.answer);
        for (const lang of ['fr', 'en'] as const) {
          const lengths = qu.choices.map((c) => c[lang].length);
          expect(Math.max(...lengths) / Math.min(...lengths), `${les.id}: ${qu.q[lang]}`).toBeLessThan(2.1);
        }
      }
    }
    expect(answers).toEqual(new Set([0, 1, 2]));
  });
  it('do not give the answer away by its length: the longest is right about one time in three, in each language', () => {
    const questions = LESSONS.flatMap((les) => les.quiz ?? []);
    for (const lang of ['fr', 'en'] as const) {
      const lengths = questions.map((qu) => ({ of: qu.choices.map((c) => c[lang].length), right: qu.answer }));
      const longest = lengths.filter((q) => q.of[q.right] === Math.max(...q.of)).length;
      const shortest = lengths.filter((q) => q.of[q.right] === Math.min(...q.of)).length;
      // chance is 5 of 15: neither the longest nor the shortest may become a tell, whichever way
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeGreaterThanOrEqual(3);
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeLessThanOrEqual(6);
      expect(shortest, `${lang}: the shortest is right in ${shortest} of ${questions.length}`).toBeLessThanOrEqual(6);
    }
  });
  it('write French and English together, with the same numbers', () => {
    for (const [where, t] of texts()) {
      expect(t.fr.trim().length, where).toBeGreaterThan(0);
      expect(t.en.trim().length, where).toBeGreaterThan(0);
      expect(numbers(bare(t.fr), 'fr'), where).toEqual(numbers(bare(t.en), 'en'));
      if (t.fr.length > 60 && t.en.length > 60) {
        expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeGreaterThan(0.72);
        expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeLessThan(1.42);
      }
    }
  });
  it('quote no number but the research’s, and mark every other', () => {
    const problems: string[] = [];
    for (const [where, t] of texts()) {
      for (const lang of ['fr', 'en'] as const) {
        const text = bare(t[lang]);
        const re = lang === 'fr' ? /\d+(?: \d{3})*(?:,\d+)?/g : /\d+(?:,\d{3})*(?:\.\d+)?/g;
        for (const m of text.matchAll(re)) {
          const n = numbers(m[0], lang)[0] ?? '';
          if (REPORTED.has(n)) continue;
          if (!figNumbers.has(n)) problems.push(`${where} (${lang}): unknown ${m[0]}`);
          const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 12);
          if (!/^(?: ?[\p{L}/%²³·:€$]+(?:\/\p{L}+)?\d?)?[†*]/u.test(after))
            problems.push(`${where} (${lang}): unmarked ${m[0]}${after}`);
        }
      }
    }
    expect(problems.join('\n')).toBe('');
  });
  it('name real companies in lesson 6 only, and with dates', () => {
    const names = /Gravitricity|Energy Vault|Green Gravity|STAHL|Pylontech|engineericly|Adam Something|Thunderf00t/i;
    for (const [where, t] of texts()) {
      if (where.startsWith('who-wins-where')) continue;
      expect(names.test(t.fr), where).toBe(false);
      expect(names.test(t.en), where).toBe(false);
    }
    const six = LESSONS.find((l) => l.id === 'who-wins-where')!;
    expect(bodyOf(six, 'en')).toMatch(/Gravitricity/);
    expect(bodyOf(six, 'en')).toMatch(/1 October 2025/);
    expect(bodyOf(six, 'fr')).toMatch(/1er octobre 2025/);
    expect(bodyOf(six, 'en')).toMatch(/Energy Vault/);
    expect(bodyOf(six, 'en')).toMatch(/March 2026/);
    expect(bodyOf(six, 'fr')).toMatch(/mars 2026/);
  });
  it('say the fridge costs 2 kW, and never that it cannot be served', () => {
    const three = LESSONS.find((l) => l.id === 'power-not-energy')!;
    expect(bodyOf(three, 'en')).toMatch(/can be served/);
    expect(bodyOf(three, 'fr')).toMatch(/peut être servi/);
    expect(bodyOf(three, 'en')).toMatch(/2\.02 kW\* at the hook/);
    for (const [where, t] of texts()) {
      expect(/cannot be served|ne peut pas être servi/i.test(t.en + t.fr), where).toBe(false);
      expect(/\b1[,.]2 kW/.test(t.en + t.fr), where).toBe(false);
      expect(/\b0[,.]7 ?%/.test(t.en + t.fr), where).toBe(false);
      expect(/flywheel|volant d’inertie/i.test(t.en + t.fr), where).toBe(false);
    }
  });
  it('give the lamp’s bag as the range the research has, and say that “Too light” ends as a thought experiment', () => {
    const one = LESSONS.find((l) => l.id === 'kilowatt-hour-weight')!;
    expect(bodyOf(one, 'fr')).toContain('8 à 12,5 kg');
    expect(bodyOf(one, 'en')).toContain('8 to 12.5 kg');
    const four = LESSONS.find((l) => l.id === 'will-not-come-down')!;
    expect(bodyOf(four, 'fr')).toContain('par la pensée');
    expect(bodyOf(four, 'en')).toContain('thought experiment');
    // the scenario does go below the empty carrier: if it stopped doing so, the sentence would be wrong
    const ramp = scenarioSetup('too-light').ramps.find((r) => r.key === 'mass');
    expect(ramp?.to).toBeLessThan(CARRIER_MASS);
  });
  it('say the battery wins, plainly, at this scale', () => {
    const six = LESSONS.find((l) => l.id === 'who-wins-where')!;
    expect(bodyOf(six, 'en')).toMatch(/\*\*the battery wins\*\*/);
    expect(bodyOf(six, 'fr')).toMatch(/\*\*la batterie gagne\*\*/);
  });
  it('do not repeat the suspended-load notice, nor that it is a model on every line: the word is said where a claim is made', () => {
    for (const [where, t] of texts()) {
      expect(/charge suspendue|suspended load/i.test(t.fr + t.en), where).toBe(false);
      expect(/reconstitution|reconstruction/i.test(t.fr + t.en), where).toBe(false);
    }
  });
  it('show no research code and no placeholder, in British English', () => {
    const us = /\b(color|center|aluminum|gray|fiber|liter|organiz|recogniz|analyz|neighbor|labor)\b/i;
    for (const [where, t] of texts()) {
      for (const text of [t.fr, t.en]) {
        expect(text, where).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, where).not.toMatch(/\{\w+\}|undefined|NaN/);
        expect(text, where).not.toMatch(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/);
        expect(text, where).not.toMatch(/ {2,}/);
      }
      expect(us.test(t.en), `${where}: ${t.en.match(us)?.[0]}`).toBe(false);
    }
  });
});
