# Gravity storage: keeping energy by lifting weights

An interactive 3D lab of a **gravity store on a farm**: a 20-tonne stack of concrete blocks, a 28 m lattice tower, a 15 kW hoist that runs both ways. It asks one question, _can you store energy by lifting weights?_, and answers it with numbers: one tonne raised 367 m is one kilowatt-hour, so this tower holds 1.09 kWh, and a 40 kg battery module beside it holds 4.4 towers.

**▶ https://gravity-battery-lab.onigam.io** · French and English · desktop, tablet and phone

It is part of a series of energy labs that started with [Pelton Lab](https://github.com/Onigam/pelton-lab), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit). The lab is still being built (`"status": "building"` in `public/lab.json`): it is not released until it meets the bar of the series and its owner says yes.

## What is in it

- **Four 3D worlds**: the **farm** (a flat yard with no hill or lake, the solar barn, the house, the tower behind its fence), the **tower** (pad, legs, bracing, rails, carrier, blocks, safety gear, hook block, rope), the **hoist** at the top (motor, brakes, gearbox, drum, rope guide, governor), and the **power room** in the order the current flows (solar inverter, meter, panel, regenerative supply, DC link, inverter, chopper, resistor, safety chain, and the battery module on its shelf).
- **52 part sheets** (Overview, Specs, Maintenance, Design), an **assembly guide** of 20 steps and an **installation guide** of 10: how such a machine goes up in the hands of a qualified crew, explained rather than ready to build.
- **Six lessons with 15 quiz questions**, each opening on a scenario of the simulation: what a kilowatt-hour weighs, where the energy goes, power is not energy, why the weight will not come down, what holds 20 tonnes up, who wins and where.
- **A simulation** (pure, unit-tested TypeScript): the whole energy chain from the meter to the hook and back, ten scenarios, nine presets from a weight-driven lamp to an Alpine pumped-storage plant, a chart of real machines by mass and height, a ghost stack that grows on the yard with your night.
- **Eight A3 sheets** generated from the same dimensions as the 3D model and from the simulation, each marked "not for construction" in its title block.
- **A spoken guide**, in both languages: the scripts in `narration/`, the audio in `public/audio/`, in a local voice.

## What the lab finds

The physics is honest and the machine is small. The model gives **0.53 round trip at full speed** (0.40 to 0.66 by its assumptions), where makers claim 0.75 to 0.90 at much larger scales. **Nothing comes out below 1.9 kW at the hook**, and a 100 W fridge costs 2 kW at the hook, 5 % efficiency. The controls draw 40 W, about 0.96 kWh a day, roughly what the weight holds, so over a real day the machine gives back 7 % of what it takes. At this scale a battery wins, by a long way; the lab says so plainly, and shows what gravity offers in exchange and where it might make sense: a shaft already dug. Nothing in any source measures a machine of this size: all of these are the model's results, marked as such, and `docs/physics.md` says how far each can move.

Every number on a visitor's screen is marked: no mark, reported by a source; `†` computed from published figures; `*` an estimate of this lab or a result of its model.

## Sources

The main story comes from a real build in a courtyard, _DIY Gravity Battery: Unexpected Results!_ (engineericly, 2023). The numbers come from published papers and makers' data (the reference hoist, rope, brake, blocks and battery module), with no endorsement implied. Real projects are named with their dates in the Sources panel and in lesson 6. No footage, image or transcript from any video is reused. The research, with every figure and its status, is in `docs/research.md`.

This is an **independent educational reconstruction of a generic machine**, not anyone's product and not a construction plan: the tower and its foundation are not calculated.

## Run locally

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs. Every push to `main` deploys to Vercel. Read `BRIEF.md` first: it holds the frame, the roles and the quality gates. The content rules of the texts and the sheets are in `docs/data.md`, `docs/lessons.md` and `docs/drawings.md`; the model in `docs/physics.md`; the worlds and the scenery in `docs/3d.md` and `docs/scenery.md`.

MIT licence.

---

## Français

**Stockage par gravité : garder l’énergie en soulevant des poids.** Un lab 3D interactif sur un **stockage par gravité à la ferme** : 20 tonnes de blocs de béton, une tour en treillis de 28 m, un treuil de 15 kW qui marche dans les deux sens. Il pose une seule question, _peut-on stocker l’énergie en soulevant des poids ?_, et y répond avec des chiffres : une tonne levée de 367 m garde un kilowattheure, cette tour garde donc 1,09 kWh, et un module de batterie de 40 kg, posé à côté, garde 4,4 tours.

**▶ https://gravity-battery-lab.onigam.io** · français et anglais · ordinateur, tablette et téléphone

Il fait partie d’une série de labs de l’énergie commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), sur le même socle, [lab-kit](https://github.com/Onigam/lab-kit). Le lab est encore en construction (`"status": "building"` dans `public/lab.json`) : il n’est pas livré tant qu’il ne tient pas la barre de la série et que son propriétaire n’a pas dit oui.

**Au programme** : quatre mondes 3D (la ferme, la tour, le treuil, le local électrique), 52 fiches de pièces, un guide de montage de 20 étapes et un guide d’installation de 10, expliqués et non prêts à construire, six leçons et 15 questions, une simulation testée (toute la chaîne d’énergie, dix scénarios, neuf points de départ, le graphique des machines réelles, la pile fantôme de votre nuit) et huit planches A3 générées depuis les cotes du modèle 3D, marquées « ne pas construire » dans leur cartouche. Le guide parlé existe dans les deux langues, dans une voix locale : les scripts dans `narration/`, l’audio dans `public/audio/`.

**Ce que le lab trouve** : la physique est honnête et la machine est petite. Le modèle donne **0,53 d’aller-retour à pleine vitesse** (de 0,40 à 0,66 selon ses hypothèses), là où des fabricants annoncent de 0,75 à 0,90 à bien plus grande échelle. **Rien ne sort sous 1,9 kW au crochet**, et un frigo de 100 W coûte 2 kW au crochet, soit 5 % de rendement. Le contrôle prend 40 W, environ 0,96 kWh par jour, à peu près ce que garde le poids : sur une vraie journée, la machine rend 7 % de ce qu’elle prend. À cette échelle, une batterie gagne, et de loin ; le lab le dit franchement, et montre ce que la gravité offre en échange, et où elle aurait un sens : un puits déjà creusé. Aucune source ne mesure une machine de cette taille : ce sont des résultats du modèle, marqués comme tels.

**Les chiffres** : sans marque, ils viennent d’une source ; `†` ils sont calculés à partir de chiffres publiés ; `*` ils dépendent d’une estimation de ce lab, ou sortent de son modèle. Reconstitution pédagogique indépendante d’une machine générique, ce n’est le produit de personne ni un plan de construction : la tour et sa fondation ne sont pas calculées. Aucune image ni transcription de vidéo n’est reprise.

**Lancer en local** : `npm install` puis `npm run dev`. Chaque push sur `main` déploie sur Vercel. Lire `BRIEF.md` d’abord.
