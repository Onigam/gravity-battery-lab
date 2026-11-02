import { beforeAll, describe, expect, it } from 'vitest';
import type { L } from '@onigam/lab-kit/i18n';
import { boldParts, rich } from '@onigam/lab-kit/ui';
import { FakeElement, installFakeDom } from '../panels/test-dom';
import { SHEETS } from '../drawings';
import { ASSEMBLY } from './assembly';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';

// The kit's `rich()` draws what the visitor reads, and this lab's star marks stand next to its bold markers. Since kit 0.6.0 a star may stand inside the bold: these tests run the lab's own
// sentences through the kit's own function, in both languages, so that a change of the kit or of a text cannot put raw stars back on the screen.

beforeAll(() => installFakeDom());

const lesson = (id: string) => LESSONS.find((les) => les.id === id)!;
const three = lesson('power-not-energy');

/** What the kit renders with `rich`: everything but names and spec rows, which it writes as plain text. */
function renderedTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const les of LESSONS) {
    out.push([`${les.id}.summary`, les.summary]);
    les.body.forEach((b, i) => out.push([`${les.id}.body[${i}]`, b]));
    les.quiz?.forEach((qu, i) =>
      out.push([`${les.id}.quiz[${i}].q`, qu.q], [`${les.id}.quiz[${i}].explain`, qu.explain]),
    );
  }
  for (const p of PARTS) {
    out.push([`${p.id}.short`, p.short], [`${p.id}.description`, p.description]);
    if (p.maintenance) out.push([`${p.id}.maintenance`, p.maintenance]);
    if (p.tip) out.push([`${p.id}.tip`, p.tip]);
    if (p.design) out.push([`${p.id}.design`, p.design]);
  }
  for (const s of [...ASSEMBLY, ...INSTALL]) {
    out.push([`${s.id}.text`, s.text]);
    if (s.tip) out.push([`${s.id}.tip`, s.tip]);
    if (s.warning) out.push([`${s.id}.warning`, s.warning]);
  }
  for (const [world, o] of Object.entries(OVERVIEWS)) out.push([`overview ${world}`, o.text]);
  for (const s of SHEETS) out.push([`${s.id}.description`, s.description]);
  return out;
}

describe('the bold and the star marks, through the kit’s own function', () => {
  it('draws the three sentences of lesson 3 in bold, each with its star and no marker, in both languages', () => {
    const cases: [L | undefined, string, string][] = [
      [
        three.body[2],
        'sous 1,90 kW* au crochet, la machine ne rend rien',
        'below 1.90 kW* at the hook, the machine gives nothing',
      ],
      [three.quiz?.[0]?.explain, 'Il paie 1,44 kW*.', 'It pays 1.44 kW*.'],
      [three.quiz?.[1]?.explain, 'Oui, mais pour 54 Wh* seulement.', 'Yes, but for only 54 Wh*.'],
    ];
    for (const [text, fr, en] of cases) {
      for (const [lang, bold] of [
        ['fr', fr],
        ['en', en],
      ] as const) {
        const frag = rich(text![lang]) as unknown as FakeElement;
        expect(frag.find('strong').map((s) => s.textContent)).toContain(bold);
        expect(frag.textContent).not.toContain('**');
      }
    }
  });
  it('holds a bold that ends on a star mark', () => {
    expect(boldParts('**54 Wh*** suffisent')).toEqual([
      { text: '54 Wh*', bold: true },
      { text: ' suffisent', bold: false },
    ]);
  });
  it('leaves no raw marker anywhere the kit renders with it, in either language', () => {
    const raw: string[] = [];
    const texts = renderedTexts();
    expect(texts.length).toBeGreaterThan(300);
    for (const [where, t] of texts) {
      for (const lang of ['fr', 'en'] as const) {
        // the kit cuts a text into paragraphs first
        for (const para of t[lang].split(/\n\s*\n/)) {
          for (const piece of boldParts(para)) {
            if (piece.text.includes('**')) raw.push(`${where} (${lang}): ${piece.text}`);
          }
        }
      }
    }
    expect(raw.join('\n')).toBe('');
  });
});
