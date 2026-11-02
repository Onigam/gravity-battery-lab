import { beforeAll, describe, expect, it } from 'vitest';
import { COLOUR, ISO_COLOUR } from './model';

// The colours this lab writes into its panel, read on the kit's own card in both themes. None of them colours a text, so the bar is 3:1, for a graphic.

// the stylesheet comes from disk: the test runner empties any import of a .css. No node types in this lab: the module is named at run time.
const load = (name: string): Promise<any> => import(/* @vite-ignore */ name);
let css = '';
beforeAll(async () => {
  const fs = await load('node:fs');
  css = String(fs.readFileSync('node_modules/@onigam/lab-kit/dist/styles.css', 'utf8'));
});

/** The block of a selector in the stylesheet: its `--name: value` tokens. */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThan(-1);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));
}

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('the colours of the panel', () => {
  for (const [theme, selector] of [
    ['light', ':root'],
    ['dark', ":root[data-theme='dark']"],
  ]) {
    const theming = () => {
      const t = tokens(selector);
      return { t, resolve: (c: string): string => (c.startsWith('var(') ? t[c.slice(4, -1)] : c) };
    };

    it(`hold 3:1 on the card, ${theme}`, () => {
      const { t, resolve } = theming();
      expect(t['--card']).toMatch(/^#/);
      for (const [name, c] of [...Object.entries(COLOUR), ['iso', ISO_COLOUR]]) {
        expect(contrast(resolve(c), t['--card']), name).toBeGreaterThanOrEqual(3);
      }
    });

    it(`keep the stages of the bar apart, ${theme}`, () => {
      const { resolve } = theming();
      const stages = Object.values(COLOUR).map(resolve);
      expect(new Set(stages).size).toBe(stages.length);
    });
  }
});
