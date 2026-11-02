import { beforeAll, describe, expect, it } from 'vitest';
import { configureDrawings } from '@onigam/lab-kit/drawings';
import { setLang } from '@onigam/lab-kit/i18n';
import { PARTS } from '../data/parts';
import { nEn, nFr } from '../data/units';
import { chainAt, shaftsAt } from '../sim/chain';
import { FARM, FARM_MASS } from '../sim/machine';
import { reevingSumDown, reevingSumUp } from '../sim/reeving';
import { RUNGS } from '../sim/ladder';
import { DECK_TOP, FOOT_X, GEARS, HOIST, HOOK_BLOCK, PAD, SITE, TOWER } from '../three/dims';
import siteScene from '../three/site/scene.ts?raw';
import plSite from './pl01-site.ts?raw';
import { SHEETS } from './index';
import { fallTensions, FALL_SPEED } from './pl04-reeving';
import { gearCentres, shaftRows } from './pl06-drive';
import { lossesOf, ropePower } from './pl08-energy';
import { FakeElement, installFakeDom, textBoxes, textExtent } from './test-dom';

// The eight A3 sheets of the "Plans" mode: the contract, a render in French and in English with no NaN and no text on text or off the sheet, the cartouche, the dimensions read from dims.ts, the model's
// figures recomputed from src/sim.

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;
const key = (id: string, lang: Lang): string => `${id}/${lang}`;
const textsOf = (id: string, lang: Lang): string[] => textBoxes(rendered.get(key(id, lang))!).map((t) => t.content);
const n = (v: number, lang: Lang, d = 0): string => (lang === 'fr' ? nFr(v, d) : nEn(v, d));

beforeAll(() => {
  installFakeDom();
  configureDrawings({ date: '2026-11-02' });
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
  }
  setLang('fr');
});

describe('the contract', () => {
  it('has eight sheets, numbered in order, each with a group, a world and existing parts of that world', () => {
    expect(SHEETS.length).toBe(8);
    expect(SHEETS.map((s) => s.number)).toEqual([
      'PL-G01',
      'PL-G02',
      'PL-G03',
      'PL-G04',
      'PL-G05',
      'PL-G06',
      'PL-G07',
      'PL-G08',
    ]);
    expect(new Set(SHEETS.map((s) => s.id)).size).toBe(8);
    for (const s of SHEETS) {
      expect(['site', 'tower', 'hoist', 'power-room', 'chart'], s.id).toContain(s.group);
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      for (const id of s.parts ?? []) expect(PARTS.find((p) => p.id === id)?.scene, `${s.id}: ${id}`).toBe(s.scene);
    }
  });
  it('follows the list of the research', () => {
    expect(SHEETS.map((s) => s.id)).toEqual([
      'site-plan',
      'tower-elevation',
      'hoist-layout',
      'reeving',
      'weight-stack',
      'drive-train',
      'single-line',
      'energy-chain',
    ]);
  });
  it('describes each sheet in both languages, with what it shows and how to read it', () => {
    for (const s of SHEETS) {
      for (const lang of LANGS) {
        expect(s.title[lang].length, s.id).toBeGreaterThan(5);
        expect(s.description[lang].split(/(?<=[.!?])\s+/).length, s.id).toBeGreaterThanOrEqual(2);
      }
      expect(s.title.fr).not.toBe(s.title.en);
      const ratio = s.description.fr.length / s.description.en.length;
      expect(ratio, s.id).toBeGreaterThan(0.8);
      expect(ratio, s.id).toBeLessThan(1.3);
    }
  });
  it('names nobody on a sheet: no maker, no company', () => {
    const names =
      /STAHL|PFEIFER|\bmayr\b|Legioblock|Betonblock|Pylontech|Gravitricity|Energy Vault|GravityLight|Green Gravity|engineericly/i;
    for (const s of SHEETS)
      for (const lang of LANGS) {
        expect(names.test(s.description[lang]), s.id).toBe(false);
        for (const t of textsOf(s.id, lang)) expect(names.test(t), `${s.id}: ${t}`).toBe(false);
      }
  });
});

describe('the render', () => {
  it('prints no bad number, no placeholder', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textsOf(s.id, lang)) expect(t, s.id).not.toMatch(/NaN|undefined|Infinity|\{\w+\}|\[object/);
  });
  it('marks every sheet « not for construction » in its cartouche, in both languages', () => {
    for (const s of SHEETS) {
      expect(textsOf(s.id, 'fr').join(' '), s.id).toContain('NE PAS CONSTRUIRE');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain('NOT FOR CONSTRUCTION');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain(s.number);
    }
  });
  it('has its own French and English, not one language in both', () => {
    for (const s of SHEETS) expect(textsOf(s.id, 'fr').join(' ')).not.toBe(textsOf(s.id, 'en').join(' '));
  });
  it('keeps every text on the sheet', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textBoxes(rendered.get(key(s.id, lang))!)) {
          if (t.rotated) continue;
          const e = textExtent(t);
          expect(e.x0, `${s.id} ${lang}: ${t.content}`).toBeGreaterThanOrEqual(7);
          expect(e.x1, `${s.id} ${lang}: ${t.content}`).toBeLessThanOrEqual(413);
          expect(e.y0, `${s.id} ${lang}: ${t.content}`).toBeGreaterThanOrEqual(7);
          expect(e.y1, `${s.id} ${lang}: ${t.content}`).toBeLessThanOrEqual(290);
        }
  });
  it('writes no text on another text', () => {
    const clashes: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const boxes = textBoxes(rendered.get(key(s.id, lang))!).filter((t) => !t.rotated && t.content.trim());
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = textExtent(boxes[i]!);
            const b = textExtent(boxes[j]!);
            const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
            if (w > 1 && h > 0.6) clashes.push(`${s.number} ${lang}: “${boxes[i]!.content}” / “${boxes[j]!.content}”`);
          }
      }
    expect(clashes.join('\n')).toBe('');
  });
  it('keeps out of the title block', () => {
    const X0 = 232;
    const Y0 = 249;
    for (const s of SHEETS) {
      const fr = textBoxes(rendered.get(key(s.id, 'fr'))!);
      const outside = fr.filter((t) => {
        const e = textExtent(t);
        return e.x1 > X0 + 1 && e.y1 > Y0 + 1;
      });
      // what is in the block: the kit's own texts (title, subtitle, project, disclaimer, four labels, four values, the projection's note)
      expect(outside.length, `${s.number}: ${outside.map((t) => t.content).join(' | ')}`).toBeLessThanOrEqual(13);
    }
  });
  it('tags what it prints: a kilowatt or a watt the model gives carries its star, only the motor’s rating has none', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textsOf(s.id, lang)) {
          for (const m of t.matchAll(/(\d[\d ,.]*) (kW|W)(?![*†a-zA-Zh])/g)) {
            const numText = m[1]!.trim();
            expect(['15'].includes(numText) || numText === '400', `${s.number}: ${t}`).toBe(true);
          }
        }
  });
});

describe('the numbers are read, not typed', () => {
  it('PL-G01 prints the fence, the shed and the barn from dims.ts', () => {
    for (const lang of LANGS) {
      const t = textsOf('site-plan', lang);
      expect(t).toContain(`${n(SITE.fenceR, lang)} m*`);
      expect(t).toContain(`${n(-(-35), lang)} m*`);
      expect(t).toContain(`${n(SITE.barn.len, lang)} m*`);
    }
  });
  it('PL-G01 and the 3D plant the grid’s pole from the one figure in dims.ts', () => {
    expect(siteScene).toContain('V(SITE.pole.x, 0, SITE.pole.z)');
    expect(plSite).toContain('P(SITE.pole.x, SITE.pole.z)');
  });
  it('PL-G02 adds up to the tower’s height, from its levels in dims.ts', () => {
    for (const lang of LANGS) {
      const t = textsOf('tower-elevation', lang);
      expect(t).toContain(`${n(TOWER.height, lang)} m*`);
      expect(t).toContain(`${n(PAD.side, lang)} m*`);
      expect(t.join(' ')).toContain(n(DECK_TOP, lang, 2));
      expect(t).toContain(lang === 'fr' ? '0,83 m' : '0.83 m');
      expect(t).toContain('20 m');
    }
  });
  it('PL-G03 prints the maker’s dimensions, with no mark', () => {
    for (const lang of LANGS) {
      const t = textsOf('hoist-layout', lang);
      for (const v of [
        HOIST.e1,
        HOIST.e2,
        HOIST.e7,
        HOIST.e12,
        HOIST.overall,
        HOIST.frameW,
        HOIST.drumToMotor,
        HOIST.holes,
        HOIST.axisY,
        HOIST.height,
      ])
        expect(t, String(v)).toContain(n(v * 1000, lang));
    }
    expect(FOOT_X[1] - FOOT_X[0]).toBeCloseTo(HOIST.e12, 9);
  });
  it('PL-G04 gives the model’s tensions: they add up to the force, fall by fall', () => {
    const force = (up: boolean) => chainAt(FARM, FARM_MASS, FARM.stroke / 2, up ? FARM.vRated : -FARM.vRated).force;
    const up = fallTensions(true);
    const down = fallTensions(false);
    expect(up.reduce((a, b) => a + b, 0)).toBeCloseTo(force(true), 6);
    expect(down.reduce((a, b) => a + b, 0)).toBeCloseTo(force(false), 6);
    expect(up[0]!).toBeCloseTo(force(true) / reevingSumUp(4), 6);
    expect(down[0]!).toBeCloseTo(force(false) / reevingSumDown(4), 6);
    // the fall on the drum carries the most going up, the fall on the anchor going down, as the sheets of the part say
    expect(up[0]).toBe(Math.max(...up));
    expect(down[3]).toBe(Math.max(...down));
    // the rope's speeds add up to what the drum winds: four times the hook's when the falls are all counted through the sheaves
    expect(FALL_SPEED[0]).toBe(FARM.falls);
    expect(FALL_SPEED[3]).toBe(0);
    for (const lang of LANGS) expect(textsOf('reeving', lang).join(' ')).toContain(n(up[0]! / 1000, lang, 1));
  });
  it('PL-G05 prints the sizes of the blocks and the clearance of a shoe', () => {
    for (const lang of LANGS) {
      const t = textsOf('weight-stack', lang).join(' ');
      expect(t).toContain(lang === 'fr' ? '1,6 × 0,8 × 0,8 m' : '1.6 × 0.8 × 0.8 m');
      expect(t).toContain('4 mm*');
      expect(t).toContain(lang === 'fr' ? '16,8 t†' : '16.8 t†');
    }
  });
  it('PL-G06 draws the gears so that they add up to the maker’s 420 mm, and the ratio to the model’s', () => {
    const [c0, , , c3] = gearCentres();
    expect(c0 - c3).toBeCloseTo(HOIST.drumToMotor, 2);
    const drawnRatio = GEARS.stages.reduce((r, s) => (r * s.teethW) / s.teethP, 1);
    expect(Math.abs(drawnRatio - FARM.ratio) / FARM.ratio).toBeLessThan(0.01);
    const rows = shaftRows();
    const s = shaftsAt(FARM, FARM_MASS);
    expect(rows[0]!.torque).toBeCloseTo(s.drum.torque, 6);
    expect(rows[3]!.rpm).toBeCloseTo(s.motor.rpm, 6);
    expect(rows.map((r) => r.rpm)).toEqual([...rows.map((r) => r.rpm)].sort((a, b) => a - b));
    expect(rows.map((r) => r.torque)).toEqual([...rows.map((r) => r.torque)].sort((a, b) => b - a));
  });
  it('PL-G07 says the regenerative supply is the lab’s addition, and shows both ways', () => {
    expect(textsOf('single-line', 'fr').join(' ')).toContain('ajout du lab');
    expect(textsOf('single-line', 'en').join(' ')).toContain('the lab’s addition');
    const up = chainAt(FARM, FARM_MASS, FARM.stroke / 2, FARM.vRated);
    const down = chainAt(FARM, FARM_MASS, FARM.stroke / 2, -FARM.vRated);
    for (const lang of LANGS) {
      const t = textsOf('single-line', lang).join(' ');
      expect(t).toContain(`${n(up.meter / 1000, lang, 2)} kW*`);
      expect(t).toContain(`${n(-down.meter / 1000, lang, 2)} kW*`);
    }
  });
  it('PL-G08: the Sankey’s losses add up to the meter, both ways, and the chart holds every real machine', () => {
    const up = chainAt(FARM, FARM_MASS, FARM.stroke / 2, FARM.vRated);
    const down = chainAt(FARM, FARM_MASS, FARM.stroke / 2, -FARM.vRated);
    const sum = (p: typeof up): number => lossesOf(p).reduce((a, b) => a + b.w, 0);
    expect(up.hook + ropePower() + sum(up)).toBeCloseTo(up.meter, 3);
    expect(down.hook + ropePower() - sum(down)).toBeCloseTo(-down.meter, 3);
    const t = textsOf('energy-chain', 'en').join(' ');
    expect(t).toContain('Nant de Drance');
    expect(t).toContain('Rudong');
    for (let i = 1; i <= RUNGS.length; i++) expect(textsOf('energy-chain', 'en')).toContain(String(i));
    expect(HOOK_BLOCK.sheaveR).toBeGreaterThan(0);
  });
});
