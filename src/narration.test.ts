import { readManifest, validateManifest } from '@onigam/lab-kit/narration';
import { describe, expect, it } from 'vitest';
import { WORLD_IDS, type WorldId } from './data/overviews';
import { PARTS } from './data/parts';
import { WORLD } from './three';

// The spoken guide: the scripts (narration/<lang>.json) and, once generated, the manifests (public/audio/<lang>) must agree with the lab's
// worlds, parts and modes, and say each of the lab's truths once. The audio files are only listed, never loaded.

const sceneIds: string[] = [...WORLD_IDS];
const partIds: string[] = PARTS.map((p) => p.id);
const worldOf = (partId: string): string | undefined => PARTS.find((p) => p.id === partId)?.scene;

const CUE = /\[\[([a-z]+)(?::([^\]]*))?\]\]/g;
const BOOLEAN_CUES = ['xray', 'cutaway', 'flows', 'isolate'];
const MODES = ['explore', 'assembly', 'install', 'sim', 'plans', 'lessons'];
const CAMERA_CUES = ['home', 'scene', 'frame', 'select'];
/** Ceiling set by the owner for the spoken characters of one language. */
const BUDGET = 30_000;
/** This lab's guide is in the local voice (generate.mjs --engine voicebox): a change of voice must be a decision, not an accident. */
const LOCAL_VOICE = 'qwen3-tts-1.7B';

interface Segment {
  id: string;
  scope: string;
  title: string;
  scene: string;
  text: string;
}
interface Script {
  lang: string;
  segments: Segment[];
}

const langOf = (path: string, folder: RegExp): string => folder.exec(path)![1]!;
const scripts = Object.fromEntries(
  Object.entries(
    import.meta.glob('../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
  ).map(([path, script]) => [langOf(path, /\/(\w+)\.json$/), script]),
);
const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [langOf(path, /\/audio\/(\w+)\//), raw],
  ),
);
const audioFiles = Object.keys(import.meta.glob('../public/audio/*/*.mp3'));

const spokenOf = (s: Pick<Segment, 'text'>): string => s.text.replace(CUE, '');

/** Each truth of the lab, said in one segment and no other. Regular expressions per language; `where` is the only segment allowed. */
const ONCE: Record<string, Record<string, [RegExp, string]>> = {
  fr: {
    notice: [/reconstitution pédagogique/i, 'intro'],
    generic: [/générique/i, 'intro'],
    figures: [/sources publiées/i, 'intro'],
    tonne: [/trois cent soixante-sept/i, 'intro'],
    grossEnergy: [/un virgule zéro neuf/i, 'intro'],
    towers: [/quatre virgule quatre/i, 'intro'],
    verdict: [/la batterie gagne/i, 'intro'],
    notADefeat: [/défaite/i, 'intro'],
    cutIn: [/un virgule neuf kilowatt/i, 'scene-power-room'],
    fridge: [/frigo de cent watts/i, 'scene-power-room'],
    fridgeAtHook: [/deux kilowatts au crochet/i, 'scene-power-room'],
    roundTrip: [/cinquante-trois pour cent/i, 'part-energy-meter'],
    claims: [/annoncent davantage/i, 'part-energy-meter'],
    realDay: [/(?<![\p{L}-])sept pour cent/iu, 'part-energy-meter'],
    controls: [/seuls contrôles/i, 'part-energy-meter'],
    suspendedLoad: [/charge suspendue/i, 'scene-tower'],
    canKill: [/peut tuer/i, 'scene-tower'],
  },
  en: {
    notice: [/educational reconstruction/i, 'intro'],
    generic: [/generic/i, 'intro'],
    figures: [/published sources/i, 'intro'],
    tonne: [/three hundred and sixty-seven/i, 'intro'],
    grossEnergy: [/one point zero nine/i, 'intro'],
    towers: [/four point four/i, 'intro'],
    verdict: [/the battery wins/i, 'intro'],
    notADefeat: [/defeat/i, 'intro'],
    cutIn: [/one point nine kilowatts/i, 'scene-power-room'],
    fridge: [/hundred-watt fridge/i, 'scene-power-room'],
    fridgeAtHook: [/two kilowatts at the hook/i, 'scene-power-room'],
    roundTrip: [/fifty-three per cent/i, 'part-energy-meter'],
    claims: [/makers claim more/i, 'part-energy-meter'],
    realDay: [/(?<![\p{L}-])seven per cent/iu, 'part-energy-meter'],
    controls: [/controls alone/i, 'part-energy-meter'],
    suspendedLoad: [/suspended load/i, 'scene-tower'],
    canKill: [/can kill/i, 'scene-tower'],
  },
};
/** A fridge is never said to be out of reach: the tower serves it, at a price. */
const FRIDGE_REFUSED: Record<string, RegExp> = {
  fr: /frigo[^.!?]*(ne peut pas|ne saurait|impossible|jamais)|(ne peut pas|ne saurait|impossible)[^.!?]*frigo/i,
  en: /fridge[^.!?]*(cannot|can’t|impossible|never)|(cannot|can’t|impossible|never)[^.!?]*fridge/i,
};
/** « notre modèle »: said where the figures' origin is told, and where a figure stands against the makers' claims, nowhere else. */
const MODEL_WORD: Record<string, RegExp> = {
  fr: /(notre|le|du) modèle/i,
  en: /(our|the) model/i,
};

describe('narration wiring', () => {
  // the lab asks for the manifests only once the audio is generated
  it.skipIf(Object.keys(manifests).length === 0)('asks for the manifest of the interface language', async () => {
    const { lab } = await import('./lab');
    expect(lab.narration?.manifest).toBe('audio/{lang}/manifest.json');
  });
});

describe('the contract', () => {
  it('has 4 worlds and 52 parts, so 57 segments per language', () => {
    expect(sceneIds).toHaveLength(4);
    expect(partIds).toHaveLength(52);
    expect(Object.keys(scripts).sort()).toEqual(['en', 'fr']);
    for (const lang of Object.keys(scripts)) expect(scripts[lang]!.segments, lang).toHaveLength(1 + 4 + 52);
  });
});

describe.each(Object.keys(scripts))('narration script %s', (lang) => {
  const script = scripts[lang]!;
  const seg = (id: string): Segment => script.segments.find((s) => s.id === id)!;
  const where = (re: RegExp): string[] => script.segments.filter((s) => re.test(spokenOf(s))).map((s) => s.id);

  it('has the lab language and a segment for the intro, every world and every part, once each', () => {
    expect(script.lang).toBe(lang);
    const scopes = script.segments.map((s) => s.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(new Set(script.segments.map((s) => s.id)).size).toBe(script.segments.length);
    expect([...scopes].sort()).toEqual(
      ['intro', ...sceneIds.map((id) => `scene:${id}`), ...partIds.map((id) => `part:${id}`)].sort(),
    );
  });

  it('names its segments intro, scene-<world> and part-<id>, with a title and the voice label', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      expect(s.id, s.scope).toBe(kind === 'intro' ? 'intro' : `${kind === 'part' ? 'part' : 'scene'}-${id}`);
      expect(s.title.trim().length, s.id).toBeGreaterThan(2);
      expect(s.text.trim().length, s.id).toBeGreaterThan(150);
    }
    expect(script).toHaveProperty('voiceLabel.fr', 'Voix de synthèse');
    expect(script).toHaveProperty('voiceLabel.en', 'Synthetic voice');
  });

  it('starts every segment in the right world', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      const expected = kind === 'part' ? worldOf(id) : kind === 'scene' ? id : 'site';
      expect(s.scene, s.id).toBe(expected);
    }
  });

  it('writes only cues the app knows, on worlds, parts and modes of the lab', () => {
    for (const s of script.segments) {
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        const at = `${s.id}: [[${name}${arg ? ':' + arg : ''}]]`;
        if (name === 'home') expect(arg, at).toBe('');
        else if (name === 'scene') expect(sceneIds, at).toContain(arg);
        else if (name === 'frame') for (const id of arg.split(',')) expect(partIds, at).toContain(id);
        else if (name === 'select') expect([...partIds, 'none'], at).toContain(arg);
        else if (name === 'explode') {
          expect(Number(arg), at).toBeGreaterThanOrEqual(0);
          expect(Number(arg), at).toBeLessThanOrEqual(1);
        } else if (BOOLEAN_CUES.includes(name)) expect(['on', 'off'], at).toContain(arg);
        else if (name === 'mode') expect(MODES, at).toContain(arg);
        else expect.fail(`${at}: unknown cue`);
      }
    }
  });

  it('frames only parts of the current world and switches off what it switches on', () => {
    for (const s of script.segments) {
      let world = s.scene;
      const on = new Set<string>();
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg;
        if (name === 'frame') for (const id of arg.split(',')) expect(worldOf(id), `${s.id}: frame ${id}`).toBe(world);
        if (name === 'select' && arg !== 'none') expect(worldOf(arg), `${s.id}: select ${arg}`).toBe(world);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
      }
      expect([...on], `${s.id} leaves cues on`).toEqual([]);
    }
  });

  it('cuts only where the world has a section, and in the site uses X-ray only on a selected part', () => {
    for (const s of script.segments) {
      let world = s.scene as WorldId;
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg as WorldId;
        if (name === 'cutaway' && arg === 'on') expect(WORLD[world].cutaway, `${s.id}: section in ${world}`).toBe(true);
        if (name === 'xray' && arg === 'on' && world === 'site')
          expect(s.scope.startsWith('part:'), `${s.id}: X-ray in the site with nothing selected`).toBe(true);
      }
    }
  });

  it('keeps a part segment framed by itself: no camera cue, no change of world or mode', () => {
    for (const s of script.segments.filter((x) => x.scope.startsWith('part:'))) {
      const camera = [...s.text.matchAll(CUE)].filter((m) => CAMERA_CUES.includes(m[1] ?? '') || m[1] === 'mode');
      expect(
        camera.map((m) => m[0]),
        s.id,
      ).toEqual([]);
    }
  });

  it('moves the camera at most once every 35 spoken characters', () => {
    for (const s of script.segments) {
      let last: { at: number; cue: string } | undefined;
      let removed = 0;
      for (const m of s.text.matchAll(CUE)) {
        const at = m.index - removed;
        removed += m[0].length;
        if (!CAMERA_CUES.includes(m[1] ?? '')) continue;
        if (last) expect(at - last.at, `${s.id}: ${last.cue} then ${m[0]}`).toBeGreaterThanOrEqual(35);
        last = { at, cue: m[0] };
      }
    }
  });

  it('hops through the four worlds and the modes in the introduction, and ends on the farm, nothing selected', () => {
    const cues = [...seg('intro').text.matchAll(CUE)].map((m) => m[0]);
    for (const w of ['hoist', 'tower', 'power-room', 'site']) expect(cues, w).toContain(`[[scene:${w}]]`);
    const modes = cues.filter((c) => c.startsWith('[[mode:'));
    expect(modes).toEqual(['assembly', 'install', 'sim', 'lessons', 'plans', 'explore'].map((m) => `[[mode:${m}]]`));
    expect(cues.slice(-2)).toEqual(['[[scene:site]]', '[[select:none]]']);
  });

  it('gives each world a home view first and walks through its parts', () => {
    for (const w of sceneIds) {
      const text = seg(`scene-${w}`).text;
      expect(text.startsWith('[[home]]'), w).toBe(true);
      const framed = new Set([...text.matchAll(/\[\[frame:([^\]]*)\]\]/g)].flatMap((m) => m[1]!.split(',')));
      expect(framed.size, `${w} frames at least 5 parts`).toBeGreaterThanOrEqual(5);
    }
  });

  it('says each truth of the lab once, in its place', () => {
    const set = ONCE[lang]!;
    for (const [truth, [re, id]] of Object.entries(set)) expect(where(re), truth).toEqual([id]);
  });

  it('never says a fridge cannot be served', () => {
    expect(where(FRIDGE_REFUSED[lang]!)).toEqual([]);
  });

  it('names its model only where the figures come from, and against the makers’ claims', () => {
    expect(where(MODEL_WORD[lang]!)).toEqual(['intro', 'part-energy-meter']);
  });

  it('is anonymous: no person, channel, company, brand, institution or existing series, in a text or a title', () => {
    const names =
      /gravitricity|energy ?vault|engineericly|globe oculaire|adam something|thunderf00t|stahl|pfeifer|\bmayr\b|legioblock|jansen|pylontech|deciwatt|gravitylight|rudong|\bleith\b|édimbourg|edinburgh|tessin|ticino|nant de drance|youtube|wikipedia|\btedx?\b|il était une fois|once upon a time|maestro/i;
    for (const s of script.segments) expect(`${s.title} ${s.text}`, s.id).not.toMatch(names);
  });

  it('is spoken text: no digit, symbol, abbreviation or straight quote, one space, no markdown', () => {
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      expect(spoken, s.id).not.toMatch(/[*≈×Ø″%°²³_#<>/\\|†]|\d/);
      expect(spoken, s.id).not.toMatch(/\b(kW|kWh|Wh|kN|rpm|Hz|mm|cm|km|tr\/min|etc|LFP|IGBT|UPS|DC|AC|CO2|M30|IP)\b/);
      expect(spoken, s.id).not.toMatch(/['"]/);
      // a cue stands between two spaces (or at an edge), so that taking it out never glues two words together
      expect(s.text, s.id).not.toMatch(/ {2}|\n|^\s|\s$|\S\[\[|\]\]\S/);
      expect(spoken, s.id).not.toMatch(/\.\.(?!\.)|\.{3}/);
    }
  });

  it('keeps the sentences short enough for the subtitles', () => {
    let over120 = 0;
    for (const s of script.segments) {
      for (const sentence of spokenOf(s)
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[.!?…])\s+/)) {
        expect(sentence.length, `${s.id}: ${sentence.slice(0, 60)}`).toBeLessThanOrEqual(130);
        if (sentence.length > 120) over120++;
      }
    }
    expect(over120).toBeLessThanOrEqual(4);
  });

  it('speaks to the listener the way the series does: "vous", "on", never "tu"', () => {
    if (lang !== 'fr') return;
    const tu = /(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(tu);
  });

  it('writes British English', () => {
    if (lang !== 'en') return;
    // « meter » stays: the energy meter is one in British English too
    const american = /\b(meters|liters?|tons?|aluminum|elevators?|color|gray|program|center|fiber)\b/i;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(american);
  });

  it('stays within the budget, and near the aim', () => {
    const total = script.segments.reduce((n, s) => n + spokenOf(s).replace(/\s+/g, ' ').trim().length, 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
    expect(total).toBeGreaterThanOrEqual(17_000);
    expect(total).toBeLessThanOrEqual(24_000);
  });
});

describe.each(Object.keys(manifests))('narration audio %s', (lang) => {
  const { manifest, problems } = readManifest(manifests[lang]);

  it('is a usable manifest that agrees with the lab, in the local voice', () => {
    expect(problems).toEqual([]);
    expect(manifest).not.toBeNull();
    expect(validateManifest(manifest!, { scenes: sceneIds, parts: partIds })).toEqual([]);
    expect((manifests[lang] as { model?: string }).model).toBe(LOCAL_VOICE);
  });

  it('has an audio file for every segment and none without a segment', () => {
    const files = audioFiles.filter((f) => f.includes(`/audio/${lang}/`)).map((f) => f.split('/').pop());
    expect(files.sort()).toEqual(manifest!.segments.map((s) => s.file).sort());
  });

  it('is the audio of the script of the same language', () => {
    const script = scripts[lang];
    if (!script) return;
    expect(manifest!.segments.map((s) => s.id).sort()).toEqual(script.segments.map((s) => s.id).sort());
  });
});

describe('the private transcripts', () => {
  // Third-party transcripts stay outside any repository (docs/research.md): where they are present on this machine, no run of seven words
  // of either script may be copied from them. Absent in CI: skipped. No node types in this lab: the modules are named at run time.
  const load = (name: string): Promise<any> => import(/* @vite-ignore */ name);
  const words = (t: string): string[] =>
    t
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-zàâäçéèêëîïôöùûüÿœ0-9' ]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const grams = (w: string[], n: number): string[] =>
    Array.from({ length: Math.max(0, w.length - n + 1) }, (_, i) => w.slice(i, i + n).join(' '));

  it('copies no seven-word run of the videos’ captions', async () => {
    const [fs, os, path] = await Promise.all([load('node:fs'), load('node:os'), load('node:path')]);
    const dir: string = path.join(os.homedir(), '.cache/lab-review/research/gravity-battery-lab');
    const files: string[] = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f: string) => /^transcript-.*\.txt$/.test(f))
      : [];
    const source = new Set(
      files.flatMap((f) =>
        grams(words(String(fs.readFileSync(path.join(dir, f), 'utf8')).replace(/\b\d{1,2}(:\d\d){1,2}\b/g, ' ')), 7),
      ),
    );
    const copied = Object.entries(scripts).flatMap(([lang, script]) =>
      script.segments.flatMap((s) =>
        grams(words(spokenOf(s)), 7)
          .filter((g) => source.has(g))
          .map((g) => `${lang}/${s.id}: "${g}"`),
      ),
    );
    expect(copied).toEqual([]);
  });
});

describe('narration scripts agree between languages', () => {
  const cues = (text: string) => [...text.matchAll(CUE)].map((m) => m[0]);

  it('have the same segments and the same cues in the same order', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    expect(en.segments.map((s) => [s.id, s.scope, s.scene])).toEqual(fr.segments.map((s) => [s.id, s.scope, s.scene]));
    for (const s of fr.segments) expect(cues(en.segments.find((x) => x.id === s.id)!.text), s.id).toEqual(cues(s.text));
  });

  it('put the cues at the same place in the sentence (within a quarter of the segment)', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    for (const s of fr.segments) {
      const t = en.segments.find((x) => x.id === s.id)!;
      const share = (text: string) => {
        let removed = 0;
        const total = spokenOf({ text }).length || 1;
        return [...text.matchAll(CUE)].map((m) => {
          const at = m.index - removed;
          removed += m[0].length;
          return at / total;
        });
      };
      const [a, b] = [share(s.text), share(t.text)];
      a.forEach((x, i) => expect(Math.abs(x - b[i]!), `${s.id}: cue ${i}`).toBeLessThanOrEqual(0.25));
    }
  });
});
