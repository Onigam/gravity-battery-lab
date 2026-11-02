# Brief for the lab team

You are building **one interactive 3D lab** about an energy / autonomy device, in the series started by
[Pelton Lab](https://github.com/Onigam/pelton-lab). Read this whole file first. The lab ends up in the owner's
educational portfolio, next to nine others, so **consistency matters as much as the content**.

## 1. What a lab is

An educational web app where a visitor can: see the whole device in 3D and in its setting, isolate / x-ray / cut any
part, take it apart and put it back, follow a part-by-part assembly guide, run a live simulation with editable
parameters, read A3 design drawings and short lessons with a quiz. Everything is bilingual **French / English**.

**There is one bar, not levels.** A lab is only "livré" when it meets the lab standard
([`lab-kit/docs/lab-standard.md`](https://github.com/Onigam/lab-kit/blob/main/docs/lab-standard.md), checked by `src/standard.ts` and
`src/standard.test.ts` of this repo): **4 3D worlds** (the setting, the machine, at least two detailed sub-assemblies or rooms), **36
parts** with a sheet, assembly guide of **20 steps** and installation guide of **10**, **6 lessons** with **12 quiz questions**, **8 A3
drawings**, a **spoken guide in French and English** (one segment for the introduction, one per world, one per part), README in English
then French, `public/lab.json` filled. `public/lab.json` carries `"status"`: `"building"` (the default: `npm test` lists every shortfall
as a todo) until the bar is met and the owner says yes, then `"released"` (a shortfall fails the test and the CI). Never write "finished"
before `released`. Plan the work against the bar from the first day; the lab's `docs/research.md` §0 states the plan and its cost.
Build in waves and deploy early, but the waves end at the bar, not before.

## 2. The frame is locked (non-negotiable)

Every lab has the **same graphic frame, app structure and UX** as Pelton Lab. It lives in
[`@onigam/lab-kit`](https://github.com/Onigam/lab-kit); this repo only provides **content**.

| Locked (do not touch)                                                                                              | Yours                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Look: paper grid, copper accent, Space Grotesk / JetBrains Mono, colours, radii, shadows (`styles.css` of the kit) | The device and its 3D worlds                                           |
| Layout: top bar (worlds, language), mode rail, 3D view, resizable side panel, floating toolbar, bottom strip       | The simulation, its parameters, scenarios and the simulation panel     |
| Modes and their order: Explore, Assembly, Installation, Simulation, Drawings, Lessons, Parts, Sources              | Parts, guides, lessons, drawings, sources, all bilingual text          |
| Part sheet tabs (Overview, Specs, Maintenance, Design), toolbar tools, panel behaviour, mobile bottom sheet        | Which modes make sense for this lab (a mode without content is hidden) |
| Drawing frame (A3 SVG, title block, legends, zoom, download, print)                                                | Which worlds, which drawings                                           |

How it is enforced: **by construction**. You never write layout CSS, never override kit colours or fonts, never rename
or reorder modes, never copy kit code into the lab. If the frame lacks something, write it in `docs/kit-requests.md`
(what, why, which lab needs it) and tell the lead: it becomes a change of the kit for _all_ labs, never a local
workaround. Do not patch `node_modules/@onigam/lab-kit`.

Use the kit's building blocks: `mountLab`, `LabDefinition`, `PartRegistry`, the `MAT` materials, `group` / `mesh`
helpers, `Drawing` / `View`, the form widgets (`slider`, `select`, `toggle`, `section`), `LineChart` / `CurveChart`,
`registerStrings`, and the physics helpers in `@onigam/lab-kit/sim/*`. Their types are in
`node_modules/@onigam/lab-kit/dist/**/*.d.ts` and the contract in `…/dist/ui/lab.d.ts`.

## 3. Versions: one by default

Pelton Lab had a "V1 prototype" and a "V2 pro"; the V2 alone would have been enough. So: **a lab has one version.**
Add a second only if it is truly necessary (two really different machines to compare, or a change of scale that teaches
something one version cannot show). Justify it in three lines in `docs/research.md`; the owner validates it at the
checkpoint. The kit has **no version switch yet**: do not build one inside the lab. Ask the lead, the kit gets it first.

## 4. The team and the files each role owns

Roles work in waves; a role only edits its own files and reads the others'.

| Wave | Role               | Delivers                                                                                                                       | Files                                                           |
| ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 1    | **Research**       | sources, transcript, key figures with timestamps, official dimensions, versions decision, safety, open questions for the owner | `docs/research.md`, `docs/transcript.md` (private, git-ignored) |
| 1    | **Physics**        | simulation engine + a unit test per key figure of the source (the figures of the video are retrieved)                          | `src/sim/**` (engine, presets, scenarios, `*.test.ts`)          |
| 2    | **Data**           | parts catalogue (36 parts at least), assembly / installation guide, lessons, lab UI strings                                    | `src/data/**`, `src/i18n/ui.ts`                                 |
| 2    | **3D**             | dimensions (one source), the device and its worlds, explode offsets, hotspots, x-ray / cutaway rules                           | `src/three/**` (with `dims.ts`)                                 |
| 3    | **Drawings**       | A3 sheets generated from `dims.ts`                                                                                             | `src/drawings/**`                                               |
| 3    | **Lessons & quiz** | the lessons and their scenarios (with the Physics role)                                                                        | `src/data/lessons.ts`                                           |
| 4    | **QA**             | quality gates below and the review of `lab-kit/docs/lab-quality.md` (never by an agent that built the lab), 3 widths, FR/EN    | `tools/**`, a QA report in `docs/qa.md`                         |
| all  | **Lead**           | integration in `src/lab.ts`, kit requests, owner checkpoint, deployment                                                        | `src/lab.ts`, `src/main.ts`, `README.md`, `public/lab.json`     |

**Each role has a dedicated agent** (sources in [`lab-kit/agents/`](https://github.com/Onigam/lab-kit/tree/main/agents),
installed in `~/.claude/agents/`): `lab-researcher` (research), `lab-physicist` (physics), `lab-modeler` (3D), `lab-author`
(data, drawings, lessons and quiz), `lab-narrator` (the spoken guide, never spends credits) and `lab-reviewer` (QA: the
independent walk, never on a lab it built). The lead uses them rather than general-purpose agents.

Waves: 1 research + physics → 2 3D ‖ data (in parallel) → 3 drawings ‖ lessons → 4 QA → **checkpoint with the owner** →
fixes → deploy. The data role and the 3D role agree on part ids first (a short list in `docs/research.md` §4): an id in
`registry.add(id, …)` must exist in `src/data/parts.ts`, and every id in a guide step must exist in both.

## 5. Conventions

- **TypeScript strict**, Vite, vanilla DOM (no framework). Prettier (`.prettierrc.json`): single quotes, width 120,
  trailing commas. `npm run format` before committing.
- **One source of truth for dimensions**: `src/three/dims.ts` (metres). The 3D model, the drawings and the
  simulation import from it. Never retype a dimension.
- **Official / maker data first.** Fetch it _before_ modelling (Pelton Lab had to be realigned afterwards). Estimates
  are marked as estimates in the part sheets and the drawings.
- **FR/EN parity**: every text is `l(fr, en)` (or a registered UI string), both languages written together, same level
  of detail, no empty strings, no placeholders. UI strings shared by all labs are in the kit; add only lab-specific ones
  in `src/i18n/ui.ts`.
- **Physics stays pure**: no DOM, no three.js in `src/sim`, so it is unit-testable and can run in Node.
- **Part ids** are kebab-case, stable, unique across worlds; the catalogue, the registry, the guides, the lessons and the
  drawings all use the same ids.
- **Nothing is inferred from a name**: a numeric claim in a text comes from `docs/research.md` or from `dims.ts`.
- Commits: short imperative English subject, what and why in the body. Push to `main` only through the lead:
  every push deploys to production (Vercel, 100 deployments per day on the free plan: batch your pushes).

## 6. Quality gates — a lab is finished only if…

- [ ] **frame respected**: no layout CSS in the lab; `tools/visual-regression` screenshots at 1280×800, 768×1024 and
      390×844 look like Pelton Lab's frame;
- [ ] **versions justified** in `docs/research.md` (one by default);
- [ ] the **figures of the source video are retrieved** by the simulation, each with a unit test (`npm test`);
- [ ] **one source of dimensions**; drawings, part sheets and 3D agree (grep a few numbers);
- [ ] **FR/EN parity** (no missing or empty text);
- [ ] **mechanical plausibility**: no floating part, every moving part visibly attached to what drives it; explode and
      isolate checked on every part;
- [ ] nothing hidden or overlapping at the three widths (tabs, panels, toolbar);
- [ ] `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build` all pass (CI runs them);
- [ ] warnings where useful: fire, carbon monoxide, gas, pressure, mains electricity; the legal note for the country;
- [ ] "independent educational reconstruction" notice, **credit and link** to the source video and the maker; no footage
      or images taken from the video;
- [ ] no transcript or caption of a third-party video committed (`docs/transcript*.md` is git-ignored: summarise and
      cite with timestamps instead);
- [ ] `public/lab.json` filled (title, tagline, tags, difficulty, minutes) for the portfolio hub;
- [ ] README with the English version first and the French one at the end.
- [ ] **quality and detail**: every rule of
      [`lab-kit/docs/lab-quality.md`](https://github.com/Onigam/lab-kit/blob/main/docs/lab-quality.md) checked by a reviewer
      who did not build the lab (close-ups of every part in every world, every mode at three widths in both languages), report
      in `docs/qa.md`; the owner's past finds listed there would all have been caught;
- [ ] **the spoken guide** (part of the bar, written after the checkpoint from the final part sheets): its script follows
      `lab-kit/docs/narration-style.md` (Pelton Lab's tone is the standard), `tone-stats.mjs` is run against Pelton's, the
      lab's narration test and `check-narration.mjs` pass, no credit is spent before the owner says yes, and the audio is
      transcribed back and compared with the script before the owner listens.

## 7. Lessons learned (the owner reviews closely)

The full list, with how to check each rule and where it came from, is
[`lab-kit/docs/lab-quality.md`](https://github.com/Onigam/lab-kit/blob/main/docs/lab-quality.md). Read it before modelling.

1. Mechanical plausibility is checked: a spring "floating in the void" or a misaligned base was noticed at once. Every
   moving part must visibly connect to what drives it; nothing floats, nothing sinks into the ground.
2. Official data before modelling; one source of dimensions; ratings and torques identical across data, drawings and 3D.
3. Fast rotations look like they run backwards (wagon-wheel effect): cap the visual speed and add a blur disc.
4. Check the layout at three widths: a panel and its tabs were broken on a narrow screen.
5. Visual and numerical consistency is verified with a script, not by eye alone.
6. Deploy early, loop short: the owner tests quickly and gives precise feedback.
7. The spoken guide is part of the bar but comes last: after the owner's checkpoint, from the final part sheets. Read
   `lab-kit/docs/narration-style.md` first (voice, register, anonymity, honesty, budget, process) and use
   `pelton-lab/narration/fr.json` as the model: the owner judged its tone perfect.
8. A machine shown in two worlds is the same machine (same build function, same dimensions), never redrawn simpler (Mill
   Lab's site showed a box where its screw world has a chain and a belt). Every system a visitor can name gets a place to
   look at it (Piggott Lab had no view of its equipment room and battery).
9. Every prop reads as what it is, close up and from afar (Mill Lab's willow looked like a jellyfish), and the water
   follows the physics wherever the physics says something.
10. The simulation is never tuned to print the source's figures: when it disagrees, say so and why. Warnings are said
    once, where they matter, not on every figure.

## 8. When you are stuck

- **A decision that is the owner's** (scope, versions, naming, anything outward-facing): stop and ask the lead.
- **The kit lacks something** (a widget, a hook, a world feature): `docs/kit-requests.md`, tell the lead.
- **The source is silent on a number**: say "unknown" in `docs/research.md`, propose an estimate with its reasoning,
  flag it in the part sheet.
- **A risky topic** (gasifier, biogas, stoves, mains): no step-by-step "ready to build" dimensions beyond what the source
  gives; show the warnings prominently.
