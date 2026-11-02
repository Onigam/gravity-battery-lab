import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { RUNGS } from '../sim/ladder';
import { durationText, energyText, massText, num, powerText, shortMass, SIM_STRINGS, st, type SimKey } from './strings';
import { installFakeDom } from './test-dom';

// The simulation's texts: French and English written together, same detail, no placeholder, no research code, no internal word, and no number
// in a text that does not come from docs/research.md.

beforeAll(() => installFakeDom()); // setLang writes the language on the document element
afterEach(() => setLang('fr'));

const entries = Object.entries(SIM_STRINGS) as [SimKey, readonly [string, string]][];
const numbers = (s: string): string[] => (s.replace(/(\d),(\d)/g, '$1.$2').match(/\d+(\.\d+)?/g) ?? []).sort();

/**
 * Every number a text may contain, with its source. 1 and 7: the night's slider (K43), and the race's 1 kW, a setting. 2020, 2021: the dates of the Swiss
 * test and of Edinburgh (K19, K21). 40: the module's mass (K31). 70: the motor's duty (K10). 367: K1.
 */
const ALLOWED = new Set(['1', '7', '40', '70', '367', '2020', '2021']);

describe('the simulation’s strings', () => {
  it('never shows a research code (K12, S3…) or an internal word to the visitor', () => {
    for (const [key, [fr, en]] of entries) {
      for (const text of [fr, en]) {
        expect(text, key).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, key).not.toMatch(/\bid\b|\bworld\b|\bundefined\b|\bpreset\b/i);
      }
    }
  });
  it('exist in both languages, non-empty, with no placeholder', () => {
    expect(entries.length).toBeGreaterThan(150);
    for (const [key, [fr, en]] of entries) {
      expect(fr.trim().length, `${key} fr`).toBeGreaterThan(0);
      expect(en.trim().length, `${key} en`).toBeGreaterThan(0);
      for (const text of [fr, en]) expect(text, key).not.toMatch(/TODO|FIXME|lorem|xxx|\[\[|\{\{/i);
    }
  });
  it('carry the same numbers in French and in English', () => {
    for (const [key, [fr, en]] of entries) expect(numbers(fr), key).toEqual(numbers(en));
  });
  it('have the same level of detail in both', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr.length < 40 && en.length < 40) continue;
      expect(fr.length / en.length, key).toBeGreaterThan(0.6);
      expect(fr.length / en.length, key).toBeLessThan(1.7);
    }
  });
  it('are translated where it matters: the same text in both is a unit, a name or a word', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr === en) expect(fr.split(/\s+/).length, `${key}: ${fr}`).toBeLessThanOrEqual(5);
    }
  });
  it('quote no number but those of the research', () => {
    for (const [key, [, en]] of entries) {
      const text = en.replace(/\bLFP\b/g, '');
      for (const n of numbers(text)) expect(ALLOWED.has(n), `${key}: ${n} in « ${en} »`).toBe(true);
    }
  });
  it('have a space after a colon, in French too', () => {
    setLang('fr');
    for (const [key] of entries) expect(st(key), key).not.toMatch(/:\S/);
  });
  it('the warning about the suspended load is not repeated here: it is the tower world’s and the Sources’', () => {
    expect(entries.filter(([, [, en]]) => /suspended load/.test(en))).toEqual([]);
  });
  it('saying "this is a model" happens only where it matters: the intro and the legend of the marks', () => {
    const said = entries.filter(([, [, en]]) => /estimate of this lab/.test(en)).map(([k]) => k);
    expect(said.sort()).toEqual(['marksLegend', 'simIntro']);
  });
});

describe('the notes of the ladder', () => {
  it('are bilingual, with no research code', () => {
    for (const r of RUNGS) {
      for (const text of [r.note.fr, r.note.en]) {
        expect(text.length, r.id).toBeGreaterThan(10);
        expect(text, r.id).not.toMatch(/\b[KS]\d{1,2}\b/);
      }
      expect(numbers(r.note.fr), r.id).toEqual(numbers(r.note.en));
    }
  });
});

describe('the formats', () => {
  it('write the decimal separator of the language', () => {
    setLang('fr');
    expect(num(7.5, 1)).toBe('7,5');
    setLang('en');
    expect(num(7.5, 1)).toBe('7.5');
    expect(num(Number.NaN)).toBe('—');
    expect(num(-0.001, 1)).toBe('0.0');
  });
  it('choose the unit', () => {
    setLang('en');
    expect(powerText(262)).toBe('262 W');
    expect(powerText(13080)).toBe('13.1 kW');
    expect(powerText(900e6)).toBe('900 MW');
    expect(energyText(1090)).toBe('1.09 kWh');
    expect(energyText(20e9)).toBe('20.0 GWh');
    expect(massText(46)).toBe('46.0 kg');
    expect(massText(20000)).toBe('20 t');
    expect(durationText(30)).toBe('30 s');
    expect(durationText(1280)).toBe('21 min');
    expect(durationText(15450)).toBe('4.3 h');
    expect(durationText(1e6)).toBe('12 days');
    expect(shortMass(0.001)).toBe('1 kg');
    expect(shortMass(10)).toBe('10 t');
    expect(shortMass(1e5)).toBe('100 kt');
    expect(shortMass(1e9)).toBe('1 Gt');
  });
});
