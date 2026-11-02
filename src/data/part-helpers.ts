// Helpers shared by the part catalogues (src/data/parts/*.ts), the guides, the overviews and the lessons. Adapted from Mill Lab's.
//
// A figure with no mark is REPORTED by a source of docs/research.md, typed in the text in both spellings and checked against the list of
// figures.test.ts. Any other figure is written by {placeholder}: `lf` fills in the number, its unit and its mark (see figures.ts), so a
// modelled number cannot lose its star. Research codes (K12, S9) never reach the visitor.
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { FIG, markOf, type Fig, type FigName } from './figures';
import { nEn, nFr } from './units';

function figText(fig: Fig, lang: 'fr' | 'en'): string {
  const n = lang === 'fr' ? nFr(fig.v, fig.d) : nEn(fig.v, fig.d);
  const u = typeof fig.u === 'string' ? fig.u : fig.u ? fig.u[lang === 'fr' ? 0 : 1] : '';
  return `${lang === 'en' && fig.pre ? fig.pre : ''}${n}${u}${markOf(fig.s)}`;
}

function fill(text: string, lang: 'fr' | 'en'): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const fig = FIG[key as FigName] as Fig | undefined;
    if (!fig) throw new Error(`unknown figure {${key}} in "${text}"`);
    return figText(fig, lang);
  });
}

/** Bilingual text whose {placeholders} are figures of FIG: number, unit and mark, the right way in each language. */
export function lf(fr: string, en: string): L {
  return l(fill(fr, 'fr'), fill(en, 'en'));
}

/** The same text in both languages, for a value made only of figures: `v('{cutInKw}')`. */
export const v = (text: string): L => lf(text, text);

/** Spec row: a bilingual label and a value (`lf`, `l` or a string that reads the same in both languages). */
export function sp(fr: string, en: string, value: L | string): Spec {
  return { label: l(fr, en), value };
}

/**
 * The three paragraphs of a `maintenance` text (the kit renders a blank line as a paragraph break), each opened by a bold label, in this
 * order: the typical failure, how to check it, the routine care.
 */
export function maint(
  fr: { failure: string; check: string; care: string },
  en: { failure: string; check: string; care: string },
): L {
  return lf(
    `**Panne à prévoir.** ${fr.failure}\n\n**À vérifier.** ${fr.check}\n\n**Entretien.** ${fr.care}`,
    `**Typical failure.** ${en.failure}\n\n**How to check.** ${en.check}\n\n**Maintenance.** ${en.care}`,
  );
}
