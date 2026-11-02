import { strL } from '@onigam/lab-kit/i18n';
import type { AppContext, LabDefinition } from '@onigam/lab-kit/ui';
import { ASSEMBLY } from './data/assembly';
import { VIDEO_ID } from './data/chapters';
import { INSTALL } from './data/install';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { sourcesPanel } from './data/sources';
import { SHEETS } from './drawings';
import './i18n/ui';
import { SimPanel } from './panels/sim';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { GravitySim } from './sim/engine';
import { WORLD, createHoistScene, createPowerroomScene, createSiteScene, createTowerScene } from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

const sim = new GravitySim();

export const lab: LabDefinition<GravitySim> = {
  id: 'gravity-battery-lab',
  brand: { title: strL('labTitle'), tagline: strL('tagline'), icon: './favicon.svg' },
  sim,
  defaultScene: 'site',
  video: { id: VIDEO_ID },
  parts: PARTS,
  scenes: [
    {
      id: 'site',
      label: strL('sceneSite'),
      module: createSiteScene(() => sim.params),
      ...WORLD.site,
      overview: {
        ...OVERVIEWS.site,
        actions: [
          { label: strL('goTower'), scene: 'tower', primary: true },
          { label: strL('goPowerRoom'), scene: 'power-room' },
        ],
      },
    },
    {
      id: 'tower',
      label: strL('sceneTower'),
      module: createTowerScene(),
      ...WORLD.tower,
      overview: {
        ...OVERVIEWS.tower,
        actions: [
          { label: strL('goHoist'), scene: 'hoist', primary: true },
          { label: strL('goSite'), scene: 'site' },
        ],
      },
    },
    {
      id: 'hoist',
      label: strL('sceneHoist'),
      module: createHoistScene(),
      ...WORLD.hoist,
      overview: {
        ...OVERVIEWS.hoist,
        actions: [
          { label: strL('goTower'), scene: 'tower', primary: true },
          { label: strL('goPowerRoom'), scene: 'power-room' },
        ],
      },
    },
    {
      id: 'power-room',
      label: strL('scenePowerRoom'),
      module: createPowerroomScene(),
      ...WORLD['power-room'],
      overview: {
        ...OVERVIEWS['power-room'],
        actions: [
          { label: strL('goSite'), scene: 'site', primary: true },
          { label: strL('goHoist'), scene: 'hoist' },
        ],
      },
    },
  ],
  partLinks: {
    'machine-tower': { scene: 'tower', label: strL('goTower') },
    'head-frame': { scene: 'hoist', label: strL('goHoist') },
    'power-shed': { scene: 'power-room', label: strL('goPowerRoom') },
  },
  guides: {
    // each step names its world: the assembly starts on the farm and climbs the tower, the installation goes from the yard into the power room
    assembly: { scene: 'tower', steps: ASSEMBLY },
    install: { scene: 'power-room', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: {
    sheets: SHEETS,
    groups: [
      { id: 'site', label: strL('groupSite') },
      { id: 'tower', label: strL('groupTower') },
      { id: 'hoist', label: strL('groupHoist') },
      { id: 'power-room', label: strL('groupPowerRoom') },
      { id: 'chart', label: strL('groupChart') },
    ],
    intro: strL('plansIntro'),
  },
  // spoken guide: audio and subtitles generated from narration/<lang>.json (see narration/README.md); until the audio exists the kit shows nothing of it
  narration: { manifest: 'audio/{lang}/manifest.json' },
  simPanel: (ctx: AppContext<GravitySim>) => new SimPanel(ctx),
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: sourcesPanel,
};
