# Narration scripts (French and English)

`fr.json` and `en.json` follow `lab-kit/docs/narration.md`: **57 segments each** (`intro`, 4 worlds, 52 parts: site 10, tower 15, hoist 13, power room 14), ids `intro`, `scene-<world>`,
`part-<id>`, no lesson segments. **The audio exists in both languages, in the local voice, checked by transcription and not yet by a human ear.** The lab's guide is in the **local voice** (`--engine voicebox`, profiles `Onigam narrateur FR` and `EN`, no credit), and only the lead generates.

Check the plan without generating anything (`HOME=<empty dir>` keeps the tool from even opening a key file):
`HOME=$(mktemp -d) node <lab-kit>/tools/narration/generate.mjs --src narration/fr.json --out public/audio/fr --dry-run --engine voicebox`.

## Budget (spoken characters, cues removed)

- French **21 288** (intro 2 336, worlds 2 836, parts 16 116), English **20 602** (intro 2 221, worlds 2 887, parts 15 494). The aim is 17 000 to 24 000, the owner's ceiling 30 000
  per language (`src/narration.test.ts`). The research's estimate was about 20 000: the French is about 6 % over it, and costs nothing here.
- Ordinary part 230 to 345 characters; the longest are `energy-meter` (472), `lfp-module` (448), `safety-gear` (422), then `hook-block`, `regen-supply`, `hoist-gearbox`, `concrete-block`.

## Register

Pelton Lab's tone (`lab-kit/docs/narration-style.md`): a warm, slightly mischievous storyteller, « vous » / « on », short sentences, a question now and then, rare exclamations.
The thread is **one ray of sunlight**: it falls on the barn roof, runs under the yard, climbs into the weight and waits there as height, then comes back through the meter to one lit
window (the intro, `scene-power-room` and `part-pv-inverter` call it back). The English is an adaptation in British spelling and units, with the same cues at the matching point.

- **Anonymous**: no person, channel, company, brand, institution or existing series in a text or a title. « La vidéo » (five parts) is the courtyard build credited in the Sources, and the intro says so once.
  The demonstrator of `machine-tower` is « construit en Europe », with no place. A test refuses the names of the sources. Nothing is said about what became of any company.

## The truths, each said once (`src/narration.test.ts` holds them to these segments)

| Truth                                                                        | Segment             |
| ---------------------------------------------------------------------------- | ------------------- |
| Educational reconstruction, generic machine, figures from sources or model   | `intro`             |
| One tonne raised 367 m: the wonder and the disappointment                    | `intro`             |
| 1.09 kWh; a 40 kg module holds 4.4 towers; the battery wins, and it is no defeat | `intro`          |
| Below 1.9 kW at the hook nothing comes out; 100 W costs about 2 kW at the hook | `scene-power-room` |
| 53 % is what our model finds; the makers' figures are claims                 | `part-energy-meter` |
| About 7 % over a real day; the controls alone, an estimate, draw what the weight holds; nothing like it has been measured | `part-energy-meter` |
| Never under a suspended load, never built without an engineer and an inspector | `scene-tower`     |

`docs/research.md` §7 proposed the suspended-load sentence at `part-hoist-rope`; it is in `scene-tower`, as the overview has it, because a world is heard more often than a part.
« Notre modèle » appears only in `intro` and `part-energy-meter`. Elsewhere an estimate says « environ », « on suppose », « une hypothèse », or what the maker does not publish.
A fridge is never said to be out of reach (a test refuses it): the tower serves it, at a price.

**Other safety lines, once each, short:** the link stays charged (`dc-link`), the panel has several sources (`ac-panel`), the stop button isolates nothing (`emergency-stop`), two people on the
ladder (`service-ladder`), a line still live (`grid-connection`), never touch the brake's springs (`service-brake`).

## Cues (97 in each language, the same in both)

- Totals: frame 37, flows 16, home 10, cutaway 8, scene 7, mode 6, explode 6, xray 6, select 1. Every « on » has its « off » before the end of the segment.
- Intro (26): `home`, `frame` on the tower, roof, trench; `scene` hops hoist, tower, power room, site; the module framed for the verdict; `mode` hops assembly, install, sim, lessons, plans, explore; `scene:site`, `select:none`.
- Worlds: `home` then at least five parts framed. `flows` in the site (it also shows the ghost stack, which the voice then explains, at the default night of 3 kWh: 128 t), the tower and the power room;
  `explode` in the tower and the hoist; `xray` in the tower, on the safety gear; `cutaway` in the hoist only (`WORLD[...].cutaway`, read by the test).
- Parts (they start framed and selected, so none moves the camera): `cutaway` on `hoist-motor`, `hoist-gearbox`, `rope-drum`, none on the brake, framed from the side, where a horizontal section shows nothing; `flows` on `hook-block`, `hoist-rope`, `regen-supply`, `motor-inverter`,
  `battery-inverter`; `explode` on `concrete-block`; `xray` on `safety-gear` (the wedges among ghosts) and `service-brake`.
- The flows move only when the machine does: the voice says what they mean and never claims a movement on screen at a given word.
- Spacing: camera cues at least 35 spoken characters apart. No `lab:` cue: `src/lab.ts` defines no `narration.onCue` (`docs/kit-requests.md` item 13). The weight does not move on the narrator's word.

## Checked

`npx vitest run src/narration.test.ts`: contract, ids, scopes and starting worlds, known cues on parts of the current world, everything switched off, camera spacing, section rule, no camera cue in a part, the
intro's hops, each truth once in its segment, the fridge, the model's word, anonymity, no digit, symbol or abbreviation, sentence length, no « tu », British spelling, budget, no seven-word run from
the private transcripts (`~/.cache/lab-review/research/gravity-battery-lab/transcript-*.txt`, nothing to compare in CI), same cues in both languages within a quarter of the segment, and,
once `public/audio/<lang>/manifest.json` exists, the manifest, the audio files and the local voice.

## The audio

`src/lab.ts` has `narration: { manifest: 'audio/{lang}/manifest.json' }` and the build runs `scripts/check-narration.mjs`. Back-transcription, rate and subtitles are done; three clips were redone on another seed. Nobody has listened to it yet.

## Words the voice may stumble on

moufle, palonnier, caillebotis, treillis, masselottes, consignation, hacheur, spire, fourreaux, kilonewtons, newtons-mètres, figures such as « deux tonnes sept » ; in English: sheave, falls, spreader beam, flyweights, lockout, grating, discard criterion, kilonewtons, newton-metres.
