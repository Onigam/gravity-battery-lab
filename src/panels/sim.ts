import { getLang, tx } from '@onigam/lab-kit/i18n';
import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  select as kitSelect,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import { comparatorRows, lfpCo2Kg, towerCo2Tonnes } from '../sim/comparator';
import type { DayResult, GravitySim } from '../sim/engine';
import { energyWh, heightForKwh } from '../sim/energy';
import { ISO_ENERGIES, LADDER_BOX, rung, RUNGS, rungEnergyTag, rungEnergyWh, tagMark, type Tag } from '../sim/ladder';
import { LFP } from '../sim/lfp';
import { FALLS_OPTIONS, machineKind, PRESET_IDS, rangeFor, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import type { Control, GravityParams, PresetId, ScenarioId } from '../sim/types';
import type { EfficiencyCurve } from '../sim/chain';
import {
  carbonKg,
  dayChartData,
  etaChartData,
  isFarmTower,
  ISO_COLOUR,
  isoMarks,
  ladderChartData,
  ladderMark,
  liveChartData,
  lossSegments,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  outChartData,
  PRESET_KEYS,
  raceLeft,
  RUNG_KEYS,
  rungMarks,
  SCENARIO_KEYS,
  SCENARIO_NOTES,
  statusOf,
  towerCostRange,
} from './model';
import { dropText, durationText, energyText, massText, num, powerText, shortMass, st, type SimKey } from './strings';

// Simulation mode: introduction, starting points and scenarios, a few live figures, where the power goes, then everything else folded: the
// control, the machine, the night and the battery, the site, all the figures; and the charts (what comes out, efficiency, a day, the
// ladder of real machines, tower against module against lake, the race, the last minute). Built only from the kit's widgets and charts.

type ChartOpts = ConstructorParameters<typeof LineChart>[0];

/** Real seconds the machine must stay unchanged before the curves and the day are recomputed. */
const CURVE_DELAY = 0.35;

/** A control the panel keeps in step with the simulation (a scenario can flip a switch or move a slider by itself). */
interface Tracked {
  key: keyof GravityParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle' | 'select';
  fmt?: (v: number) => string;
  /** From the parameter to the slider's own scale (the log sliders). */
  toSlider?: (v: number) => number;
}

const CONTROLS: Control[] = ['day', 'hold', 'raise', 'lower', 'load'];
const CONTROL_KEYS: Record<Control, SimKey> = {
  day: 'controlDay',
  hold: 'controlHold',
  raise: 'controlRaise',
  lower: 'controlLower',
  load: 'controlLoad',
};

const mark = (tag: Tag): string => tagMark(tag);

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private status = h('div', {});
  private note = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private more = h('div', { class: 'loss-legend' });
  private chain = h('div', { class: 'losses' });
  private facts = h('div', { class: 'loss-legend' });
  private night = h('div', { class: 'loss-legend' });
  private falling = h('div', { class: 'loss-legend' });
  private dayFacts = h('div', { class: 'loss-legend' });
  private rungs = h('div', { class: 'loss-legend' });
  private rungNotes = h('div', {});
  private calc = h('div', { class: 'loss-legend' });
  private compare = h('div', {});
  private race = h('div', {});
  private tracked: Tracked[] = [];

  private outChart: LineChart;
  private etaChart: LineChart;
  private dayChart: LineChart;
  private heightChart: LineChart;
  private ladderChart: LineChart;
  private liveChart: LineChart;
  private outOpts: ChartOpts;
  private etaOpts: ChartOpts;
  private dayOpts: ChartOpts;
  private heightOpts: ChartOpts;
  private liveOpts: ChartOpts;
  private curveUnit = 'kW';
  private curveScale = 1000;

  private lastReadouts = 0;
  private lastCharts = 0;
  private lastScope = 0;
  private key = '';
  private wait = 0;
  private jobs: ('curve' | 'day')[] = [];
  private curve: EfficiencyCurve | null = null;
  private dayData: DayResult | null = null;

  constructor(private ctx: AppContext<GravitySim>) {
    const sim = () => this.ctx.sim;
    const kwFmt = (v: number) => num(v, Math.abs(v) < 10 && v !== Math.round(v) ? 1 : 0);
    const hourFmt = (v: number) => `${num(v)} h`;
    const seconds = (v: number) => (v === 0 ? '0' : `${num(v)} s`);
    this.outOpts = {
      height: 150,
      series: [
        { key: 'out', label: () => st('seriesOut'), color: SERIES_COLORS.hydro, bold: true },
        { key: 'ideal', label: () => st('seriesIdeal'), color: SERIES_COLORS.pv, dash: true },
      ],
      yFmt: kwFmt,
      xFmt: (v) => `${kwFmt(v)} ${this.curveUnit}`,
      markers: () => {
        const out: ReturnType<NonNullable<ChartOpts['markers']>> = [];
        const cut = sim().getCutIn();
        if (cut) out.push({ x: cut.hook / this.curveScale, label: st('markCutIn') });
        const s = sim().state;
        if (s.mode === 'lowering') {
          out.push({
            x: s.chain.hook / this.curveScale,
            y: -s.chain.meter / this.curveScale,
            label: st('markNow'),
            color: SERIES_COLORS.dump,
          });
        }
        return out;
      },
    };
    this.outChart = new LineChart(this.outOpts);
    this.etaOpts = {
      height: 130,
      series: [
        { key: 'down', label: () => st('seriesDown'), color: SERIES_COLORS.hydro, bold: true },
        { key: 'up', label: () => st('seriesUp'), color: SERIES_COLORS.load },
        { key: 'roundTrip', label: () => st('seriesRoundTrip'), color: SERIES_COLORS.dump },
      ],
      yMin: 0,
      yMax: 90,
      yFmt: (v) => num(v),
      xFmt: (v) => `${kwFmt(v)} ${this.curveUnit}`,
      markers: () => {
        const s = sim().state;
        if (s.mode !== 'lowering' && s.mode !== 'raising') return [];
        return [
          {
            x: s.chain.hook / this.curveScale,
            y: 100 * s.etaNow,
            label: st('markNow'),
            color: SERIES_COLORS.dump,
          },
        ];
      },
    };
    this.etaChart = new LineChart(this.etaOpts);
    this.dayOpts = {
      height: 130,
      series: [
        { key: 'pv', label: () => st('seriesPv'), color: SERIES_COLORS.pv },
        { key: 'load', label: () => st('seriesLoad'), color: SERIES_COLORS.load },
        { key: 'meter', label: () => st('seriesMeter'), color: SERIES_COLORS.dump, bold: true },
      ],
      yFmt: kwFmt,
      xFmt: hourFmt,
      markers: () => [{ x: sim().state.hour, label: st('markNow') }],
    };
    this.dayChart = new LineChart(this.dayOpts);
    this.heightOpts = {
      height: 80,
      series: [{ key: 'z', label: () => st('seriesHeight'), color: SERIES_COLORS.hydro, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v, v < 10 && v !== Math.round(v) ? 1 : 0),
      xFmt: hourFmt,
      markers: () => [{ x: sim().state.hour, label: st('markNow') }],
    };
    this.heightChart = new LineChart(this.heightOpts);
    const box = LADDER_BOX;
    this.ladderChart = new LineChart({
      height: 260,
      legend: false,
      series: ISO_ENERGIES.map((wh, i) => ({
        key: `iso-${i}`,
        label: () => energyText(wh),
        color: ISO_COLOUR,
        dash: true,
      })),
      yMin: box.yMin,
      yMax: box.yMax,
      yFmt: (v) => shortMass(Math.pow(10, v)),
      xFmt: (v) => `${num(Math.pow(10, v))} m`,
      markers: () => {
        const p = sim().params;
        const you = ladderMark(p.ladderTonnes, p.ladderHeight);
        return [
          ...isoMarks().map((m) => ({ x: m.x, y: m.y, label: m.label, color: ISO_COLOUR })),
          ...rungMarks().map((r) => ({ x: r.x, y: r.y, label: r.label, color: SERIES_COLORS.hydro })),
          { x: you.x, y: you.y, label: st('markYou'), color: SERIES_COLORS.dump },
        ];
      },
    });
    this.liveOpts = {
      height: 100,
      series: [
        { key: 'hook', label: () => st('seriesHook'), color: SERIES_COLORS.pv },
        { key: 'meter', label: () => st('seriesMeterOut'), color: SERIES_COLORS.hydro, bold: true },
      ],
      yFmt: kwFmt,
      xFmt: seconds,
    };
    this.liveChart = new LineChart(this.liveOpts);
  }

  /** Apply a change live; the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<GravityParams>): void {
    this.ctx.sim.set(patch);
    this.renderStatus();
    this.renderReadouts();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    const machine = p.machine;
    const kind = machineKind(machine);
    this.tracked = [];

    const presetSelect = h(
      'select',
      {
        'aria-label': st('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, st(PRESET_KEYS[id]))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, st('custom')),
    );
    this.presetSelect = presetSelect;

    const track = (
      key: keyof GravityParams,
      el: HTMLElement,
      trackKind: Tracked['kind'],
      fmt?: (v: number) => string,
    ) => {
      this.tracked.push({ key, el, kind: trackKind, fmt });
      return el;
    };
    const slider = (key: SimKey, field: RangedKey, fmt: (v: number) => string) => {
      const r = rangeFor(field, machine);
      return track(
        field,
        kitSlider(st(key), p[field], r.min, r.max, r.step, fmt, (v) =>
          this.set({ [field]: v } as Partial<GravityParams>),
        ),
        'slider',
        fmt,
      );
    };
    /** A slider moved in log10 of its parameter, for what spans decades. */
    const logSlider = (key: SimKey, field: 'ladderTonnes' | 'ladderHeight', fmt: (v: number) => string) => {
      const r = rangeFor(field, machine);
      const lo = Math.log10(r.min);
      const hi = Math.log10(r.max);
      const el = kitSlider(
        st(key),
        Math.log10(p[field]),
        lo,
        hi,
        (hi - lo) / 400,
        (v) => fmt(Math.pow(10, v)),
        (v) => this.set({ [field]: Math.pow(10, v) } as Partial<GravityParams>),
      );
      this.tracked.push({ key: field, el, kind: 'slider', fmt, toSlider: Math.log10 });
      return el;
    };
    const toggle = (
      key: SimKey,
      field: 'buffer' | 'sleepWhenIdle' | 'waitForSun' | 'gateOpen' | 'grid' | 'safetyGear',
    ) =>
      track(
        field,
        kitToggle(st(key), p[field], (v) => this.set({ [field]: v } as Partial<GravityParams>)),
        'toggle',
      );
    const hint = (key: SimKey) => h('p', { class: 'hint' }, st(key));
    const folded = (title: string, ...children: (HTMLElement | null)[]) => {
      const d = kitSection(title, ...children) as HTMLDetailsElement;
      d.open = false;
      return d;
    };
    const tonnes = (v: number) => massText(v);
    const hasDrive = kind === 'hoist';

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, tx('modeSim')),
      hint('simIntro'),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': st('resetSim'),
            title: st('resetSim'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      machine !== 'farm' ? hint('presetKeepsTower') : null,
      h('div', { class: 'eyebrow' }, st('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id: ScenarioId) =>
          h(
            'button',
            {
              class: `part-chip${sim.scenario === id ? ' is-on' : ''}`,
              onclick: () => (sim.applyScenario(id), this.render()),
            },
            st(SCENARIO_KEYS[id]),
          ),
        ),
      ),
      this.note,
      this.status,
      this.readouts,
      hint('meterHint'),
      hint('marksLegend'),
      hasDrive ? h('div', { class: 'eyebrow' }, st('chainTitle')) : null,
      hasDrive ? this.chain : null,
      hasDrive ? hint('chainHint') : null,
      kind !== 'energy'
        ? folded(
            st('secControl'),
            track(
              'control',
              kitSelect<Control>(
                st('control'),
                p.control,
                CONTROLS.map((c) => [c, st(CONTROL_KEYS[c])] as [Control, string]),
                (v) => this.set({ control: v }),
              ),
              'select',
            ),
            hasDrive ? slider('raiseSpeed', 'raiseSpeed', (v) => `${num(v, 2)} m/min`) : null,
            hasDrive ? slider('lowerPower', 'lowerPower', (v) => powerText(v)) : null,
            hasDrive ? slider('loadPower', 'loadPower', (v) => powerText(v)) : null,
            hasDrive ? hint('controlHint') : null,
          )
        : null,
      kind !== 'energy'
        ? folded(
            st('secMachine'),
            slider('massSlider', 'mass', tonnes),
            hasDrive ? slider('strokeSlider', 'stroke', (v) => `${num(v, 1)} m`) : null,
            hasDrive
              ? track(
                  'falls',
                  kitSelect<number>(
                    st('fallsSelect'),
                    p.falls,
                    FALLS_OPTIONS.map((n) => [n, String(n)] as [number, string]),
                    (v) => this.set({ falls: v }),
                  ),
                  'select',
                )
              : null,
            hasDrive ? slider('motorSlider', 'motorKw', (v) => `${num(v, v < 100 ? 1 : 0)} kW`) : null,
            hasDrive ? hint('motorHint') : null,
            this.facts,
          )
        : null,
      folded(
        st('secNight'),
        slider('nightSlider', 'nightKwh', (v) => `${num(v, 1)} kWh`),
        hint('nightHint'),
        this.night,
        hint('nightPathHint'),
        hasDrive ? toggle('buffer', 'buffer') : null,
        hasDrive ? slider('modules', 'modules', (v) => num(v)) : null,
        hasDrive ? slider('pvSlider', 'pvKw', (v) => `${num(v)} kW`) : null,
        hasDrive ? toggle('waitForSun', 'waitForSun') : null,
        hasDrive ? toggle('sleepWhenIdle', 'sleepWhenIdle') : null,
        hasDrive ? hint('sleepHint') : null,
      ),
      hasDrive
        ? folded(
            st('secSite'),
            slider('windSlider', 'wind', (v) => `${num(v, 1)} m/s`),
            slider('windStop', 'windStop', (v) => `${num(v)} m/s`),
            toggle('gateOpen', 'gateOpen'),
            toggle('grid', 'grid'),
            toggle('safetyGear', 'safetyGear'),
            hint('siteHint'),
            this.falling,
          )
        : null,
      folded(st('secMore'), this.more),
      hasDrive ? h('div', { class: 'eyebrow' }, st('chartOut')) : null,
      hasDrive ? this.outChart.el : null,
      hasDrive ? h('div', { class: 'eyebrow' }, st('chartEta')) : null,
      hasDrive ? this.etaChart.el : null,
      hasDrive ? hint('chartEtaHint') : null,
      hasDrive ? h('div', { class: 'eyebrow' }, st('chartDay')) : null,
      hasDrive ? this.dayChart.el : null,
      hasDrive ? h('div', { class: 'eyebrow' }, st('chartHeight')) : null,
      hasDrive ? this.heightChart.el : null,
      hasDrive ? this.dayFacts : null,
      hasDrive ? hint('dayHint') : null,
      h('div', { class: 'eyebrow' }, st('chartLadder')),
      hint('ladderAha'),
      this.ladderChart.el,
      logSlider('ladderMass', 'ladderTonnes', (v) => massText(v * 1000)),
      logSlider('ladderHeight', 'ladderHeight', (v) => `${num(v, v < 10 ? 1 : 0)} m`),
      this.calc,
      this.rungs,
      folded(st('secRungs'), this.rungNotes),
      h('div', { class: 'eyebrow' }, st('chartCompare')),
      this.compare,
      hint('compareHint'),
      hasDrive ? h('div', { class: 'eyebrow' }, st('chartRace')) : null,
      hasDrive ? this.race : null,
      hasDrive ? hint('raceHint') : null,
      hasDrive ? h('div', { class: 'eyebrow' }, st('chartLive')) : null,
      hasDrive ? this.liveChart.el : null,
    );
    this.key = this.curveKey();
    this.wait = 0;
    this.jobs = hasDrive ? ['curve', 'day'] : [];
    this.curve = null;
    this.dayData = null;
    while (this.jobs.length) this.runJob();
    this.drawLadder();
    this.renderRungs();
    this.renderCompare();
    this.refresh();
  }

  /** Called every frame while the panel is open: readouts at 5 Hz, the last minute at 4 Hz, the curves at 2 Hz. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastCharts += dt;
    this.lastScope += dt;
    this.scheduleCurves(dt);
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastScope > 0.25) {
      this.lastScope = 0;
      this.drawLive();
    }
    if (this.lastCharts > 0.5) {
      this.lastCharts = 0;
      this.drawCurves();
      this.drawLadder();
    }
  }

  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.drawLive();
    this.drawCurves();
  }

  // ------------------------------------------------------------------ the curves

  private curveKey(): string {
    const p = this.ctx.sim.params;
    return JSON.stringify([
      p.machine,
      p.motorKw,
      p.falls,
      p.stroke,
      Math.round(p.mass / 50),
      p.buffer,
      p.modules,
      p.nightKwh,
      p.pvKw,
      p.sleepWhenIdle,
      p.waitForSun,
    ]);
  }

  /** The curves cost a few milliseconds and the day some tens: they start once the controls have been quiet for a moment. */
  private scheduleCurves(dt: number): void {
    const key = this.curveKey();
    if (key !== this.key) {
      this.key = key;
      this.wait = CURVE_DELAY;
      this.jobs = [];
    } else if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) this.jobs = ['curve', 'day'];
    }
    this.runJob();
  }

  private runJob(): void {
    const job = this.jobs.shift();
    const sim = this.ctx.sim;
    if (!sim.hoist) return;
    if (job === 'curve') this.curve = sim.getCurve();
    else if (job === 'day') this.dayData = sim.getDay();
    if (job) this.lastCharts = 1; // draw at once
  }

  // ------------------------------------------------------------------ status and readouts

  private renderStatus(): void {
    const sim = this.ctx.sim;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    const { key, tone } = statusOf(sim.state, sim.params, sim.spec.kind);
    fill(
      this.status,
      tone === 'warn'
        ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, st(key)))
        : h('p', { class: 'hint' }, st(key)),
    );
    const id = sim.scenario;
    fill(
      this.note,
      id ? h('p', { class: 'hint' }, st(SCENARIO_NOTES[id])) : h('p', { class: 'hint' }, st('scenarioHint')),
    );
  }

  private renderReadouts(): void {
    const sim = this.ctx.sim;
    const s = sim.state;
    const box = (label: string, value: string, small = '') =>
      h(
        'div',
        { class: 'readout' },
        h('span', {}, label),
        h('b', {}, value, small ? h('small', {}, ` ${small}`) : null),
      );
    const line = (label: string, value: string, small = '', colour = '') =>
      h(
        'span',
        {},
        colour ? h('i', { style: `background:${colour}` }) : null,
        `${label} `,
        h('b', {}, value),
        small ? h('small', {}, ` ${small}`) : null,
      );
    fill(
      this.readouts,
      ...mainReadouts(s).map((r) => box(st(r.key), num(r.value, r.digits), `${r.unit}${mark(r.tag)}`)),
    );
    fill(
      this.more,
      ...moreReadouts(s, st('unitPerRev')).map((r) =>
        line(st(r.key), num(r.value, r.digits), `${r.unit}${mark(r.tag)}`),
      ),
    );
    this.renderChain();
    this.renderFacts(line);
    this.renderNight(line);
    this.renderFalling(line);
    this.renderDayFacts(line);
    this.renderCalc(line);
    this.renderRace();
  }

  private renderChain(): void {
    const s = this.ctx.sim.state;
    const rows = lossSegments(s);
    if (!rows.length) {
      fill(
        this.chain,
        h(
          'div',
          { class: 'loss-legend' },
          h(
            'span',
            {},
            `${st('chainStanding')} `,
            h('b', {}, powerText(s.chain.meter)),
            h('small', {}, ` ${mark('estimate')}`),
          ),
        ),
      );
      return;
    }
    const total = rows.reduce((a, r) => a + r.watts, 0) || 1;
    fill(
      this.chain,
      h(
        'div',
        { class: 'loss-bar', role: 'img', 'aria-label': st('chainTitle') },
        ...rows.map((r) =>
          h('span', {
            style: `flex:${Math.max(r.watts, 0.0001)};background:${r.colour}`,
            title: `${st(r.key)} ${powerText(r.watts)}`,
          }),
        ),
      ),
      h(
        'div',
        { class: 'loss-legend' },
        ...rows.map((r) =>
          h(
            'span',
            {},
            h('i', { style: `background:${r.colour}` }),
            `${st(r.key)} `,
            // a figure stays with its unit when the legend wraps
            h('b', {}, powerText(r.watts).replace(' ', '\u00a0')),
            h('small', {}, ` ${num((100 * r.watts) / total)}\u00a0%`),
          ),
        ),
      ),
    );
  }

  private renderFacts(line: (l: string, v: string, s?: string) => HTMLElement): void {
    const sim = this.ctx.sim;
    const m = sim.hoist;
    if (!m) {
      fill(this.facts);
      return;
    }
    const cut = sim.getCutIn();
    const stroke = sim.getStroke();
    const lightest = sim.getLightest();
    fill(
      this.facts,
      line(st('factRatio'), `${num(m.ratio)}:1`, mark('estimate')),
      line(st('factTop'), `${num(m.vRated * 60, 2)} m/min`),
      line(st('factLowest'), `${num(m.vMin * 60, 2)} m/min`),
      line(st('factRope'), num(sim.state.ropeFactor, 1), mark('derived')),
      cut ? line(st('factCutIn'), powerText(cut.hook), mark('estimate')) : null,
      lightest !== null ? line(st('factLightest'), massText(lightest), mark('estimate')) : null,
      stroke ? line(st('factStrokeIn'), energyText(stroke.input), mark('estimate')) : null,
      stroke ? line(st('factStrokeOut'), energyText(stroke.output), mark('estimate')) : null,
      stroke ? line(st('factRoundTrip'), `${num(100 * stroke.roundTrip)} %`, mark('estimate')) : null,
    );
  }

  private renderNight(line: (l: string, v: string, s?: string) => HTMLElement): void {
    const n = this.ctx.sim.getNight();
    fill(
      this.night,
      line(st('nightGross'), massText(n.tonnesGross * 1000), mark('derived')),
      line(st('nightTonnes'), massText(n.tonnes * 1000), mark('estimate')),
      line(st('nightTowers'), num(n.towers, 1), `${st('unitTowers')}${mark('estimate')}`),
      line(st('nightBlocks'), num(n.blocks), `${st('unitBlocks')}${mark('estimate')}`),
      line(st('nightConcrete'), `${num(n.volume)} m³`, mark('estimate')),
      line(st('nightModule'), `${num(Math.min(100, (100 * LFP.usableKwh * 1000) / n.wh))} %`, st('nightModuleUnit')),
    );
  }

  private renderFalling(line: (l: string, v: string, s?: string) => HTMLElement): void {
    const s = this.ctx.sim.state;
    if (s.fallTime <= 0) {
      fill(this.falling);
      return;
    }
    fill(
      this.falling,
      line(st('fallPeak'), `${num(s.fallPeak, 2)} m/s`, mark('estimate')),
      line(st('fallDrop'), dropText(s.fallDrop), mark('estimate')),
      line(st('fallTime'), `${num(s.fallTime, 2)} s`, mark('estimate')),
      s.impactSpeed > 0 ? line(st('fallImpact'), `${num(s.impactSpeed, 1)} m/s`, mark('derived')) : null,
    );
  }

  private renderDayFacts(line: (l: string, v: string, s?: string) => HTMLElement): void {
    const d = this.dayData;
    if (!d) {
      fill(this.dayFacts);
      return;
    }
    fill(
      this.dayFacts,
      line(st('dayIn'), energyText(d.energyIn), mark('estimate')),
      line(st('dayOut'), energyText(d.energyOut), mark('estimate')),
      line(st('dayStanding'), energyText(d.standing), mark('estimate')),
      line(st('dayRoundTrip'), `${num(100 * d.roundTrip)} %`, mark('estimate')),
      line(st('dayServed'), `${num(d.asked > 0 ? (100 * d.served) / d.asked : 0)} %`, mark('estimate')),
    );
  }

  private renderCalc(line: (l: string, v: string, s?: string) => HTMLElement): void {
    const p = this.ctx.sim.params;
    const kg = p.ladderTonnes * 1000;
    fill(
      this.calc,
      line(st('ladderEnergy'), energyText(energyWh(kg, p.ladderHeight)), mark('derived')),
      line(st('ladderKwhHeight'), `${num(heightForKwh(kg), heightForKwh(kg) < 100 ? 1 : 0)} m`, mark('derived')),
    );
  }

  private renderRungs(): void {
    fill(
      this.rungs,
      ...RUNGS.map((r, i) =>
        h(
          'span',
          {},
          `${i + 1}. ${st(RUNG_KEYS[r.id])} `,
          h('b', {}, energyText(rungEnergyWh(rung(r.id)))),
          h('small', {}, ` ${mark(rungEnergyTag(r))}`),
        ),
      ),
    );
    const lang = getLang() === 'en' ? 'en' : 'fr';
    fill(this.rungNotes, ...RUNGS.map((r, i) => h('p', { class: 'hint' }, `${i + 1}. ${r.note[lang]}`)));
  }

  private renderCompare(): void {
    const sim = this.ctx.sim;
    const rows = comparatorRows(sim.hoist ?? undefined, sim.hoist ? sim.params.mass : undefined);
    const titles: Record<(typeof rows)[number]['id'], SimKey> = {
      tower: 'rowTower',
      module: 'rowModule',
      reservoir: 'rowReservoir',
    };
    const trip = (a: number, b: number) =>
      Math.abs(a - b) < 0.005 ? `${num(100 * a)} %` : `${num(100 * a)}–${num(100 * b)} %`;
    // the unit where each language writes it, as the sheets do: 231 €, €231; 100 CHF, CHF 100
    const money = (text: string, unit: string) =>
      getLang() !== 'en' ? `${text} ${unit}` : unit === '€' ? `€${text}` : `${unit} ${text}`;
    const kg = (v: number) => {
      const c = carbonKg(v);
      return num(c.value, c.digits);
    };
    const carbon: Record<(typeof rows)[number]['id'], string> = {
      tower: (() => {
        const c = towerCo2Tonnes();
        return `${num(c.min, 1)}–${num(c.max, 1)} t CO₂`;
      })(),
      module: (() => {
        const c = lfpCo2Kg(rows[0].energy / 1000);
        return `${kg(c.min)}–${kg(c.max)} kg CO₂`;
      })(),
      reservoir: '—',
    };
    // the farm tower's price and carbon are the research's; for another machine, there is no figure to show
    const farm = isFarmTower(rows[0]);
    const towerCost = towerCostRange(rows[0]);
    const price = (r: (typeof rows)[number]): string | null => {
      if (r.id !== 'tower') return money(num(r.costMin), r.id === 'reservoir' ? 'CHF' : '€');
      return towerCost && money(`${num(towerCost.min)}–${num(towerCost.max)}`, '€');
    };
    const item = (label: string, value: string, tag: Tag) =>
      h('span', {}, `${label} `, h('b', {}, value), h('small', {}, ` ${mark(tag)}`));
    fill(
      this.compare,
      ...rows.map((r) => {
        const cost = price(r);
        return h(
          'div',
          {},
          h('div', { class: 'eyebrow' }, st(titles[r.id])),
          h(
            'div',
            { class: 'loss-legend' },
            item(st('rowEnergy'), energyText(r.energy), r.tags.energy),
            item(st('rowPower'), powerText(r.power), r.tags.energy),
            // 20 t is the hoist's published rating, unmarked everywhere; any other load on the tower is a setting
            item(st('rowMass'), massText(r.mass), r.id !== 'tower' ? r.tags.energy : farm ? 'reported' : 'assumption'),
            item(st('rowDensity'), `${num(r.whPerKg, r.whPerKg < 1 ? 3 : 0)} Wh/kg`, 'derived'),
            item(st('rowRoundTrip'), trip(r.roundTripMin, r.roundTripMax), r.tags.roundTrip),
            cost ? item(st('rowCost'), cost, r.tags.cost) : null,
            r.id === 'module' || (r.id === 'tower' && farm) ? item(st('rowCarbon'), carbon[r.id], 'estimate') : null,
          ),
        );
      }),
    );
  }

  private renderRace(): void {
    const sim = this.ctx.sim;
    const lanes = sim.getRace();
    if (!lanes) return;
    const titles = { tower: 'laneTower', module: 'laneModule', water: 'laneWater' } as const;
    const elapsed = sim.scenario === 'race' ? sim.state.simTime : 0;
    fill(
      this.race,
      ...lanes.map((lane, i) =>
        h(
          'div',
          { class: 'losses' },
          h(
            'div',
            { class: 'loss-bar', role: 'img', 'aria-label': st(titles[lane.id]) },
            h('span', {
              style: `flex:${Math.max(raceLeft(lane.lasts, elapsed), 0.0001)};background:${[SERIES_COLORS.dump, SERIES_COLORS.load, SERIES_COLORS.hydro][i]}`,
            }),
            h('span', { style: `flex:${Math.max(1 - raceLeft(lane.lasts, elapsed), 0.0001)};background:var(--line)` }),
          ),
          h(
            'div',
            { class: 'loss-legend' },
            h(
              'span',
              {},
              `${st(titles[lane.id])} `,
              h('b', {}, lane.lasts > 0 ? durationText(lane.lasts) : st('raceNoTower')),
              h('small', {}, ` ${mark('estimate')}`),
            ),
          ),
        ),
      ),
    );
  }

  /** A scenario can move a slider or flip a switch by itself: the controls follow. */
  private followScript(): void {
    const p = this.ctx.sim.params;
    for (const c of this.tracked) {
      const value = p[c.key];
      if (c.kind === 'select') {
        const sel = c.el.querySelector('select') as HTMLSelectElement | null;
        if (sel && sel.value !== String(value)) sel.value = String(value);
        continue;
      }
      const input = c.el.querySelector('input') as HTMLInputElement | null;
      if (!input) continue;
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number') {
        const on = c.toSlider ? c.toSlider(value) : value;
        if (Math.abs(Number(input.value) - on) > 1e-9) {
          // the browser rounds to the slider's step: compare in steps so that a value off its step is not written for ever
          const step = Number(input.getAttribute('step') ?? 0) || 0;
          if (Math.abs(Number(input.value) - on) > step / 2) {
            input.value = String(on);
            const out = c.el.querySelector('output');
            if (out && c.fmt) out.textContent = c.fmt(value);
          }
        }
      }
    }
  }

  // ------------------------------------------------------------------ charts

  private drawLive(): void {
    if (!this.ctx.sim.hoist) return;
    const d = liveChartData(this.ctx.sim.scope);
    this.liveOpts.yMin = 0;
    const low = Math.min(0, ...d.meter);
    const top = niceCeil3(Math.max(1, ...d.hook, ...d.meter) * 1.1);
    if (low < 0) {
      this.liveOpts.yMin = -top / 3;
      this.liveOpts.yMax = top - top / 3;
    } else {
      this.liveOpts.yMax = top;
    }
    this.liveChart.setData(d.xs, { hook: d.hook, meter: d.meter });
    this.liveChart.draw();
  }

  private drawLadder(): void {
    const d = ladderChartData();
    this.ladderChart.setData(d.xs, d.ys);
    this.ladderChart.draw();
  }

  private drawCurves(): void {
    if (!this.ctx.sim.hoist) return;
    if (this.curve) {
      const o = outChartData(this.curve);
      this.curveUnit = o.unit;
      this.curveScale = o.scale;
      this.outOpts.yMin = o.yMin;
      this.outOpts.yMax = o.yMax;
      this.outChart.setData(o.xs, o.ys);
      this.outChart.draw();
      const e = etaChartData(this.curve);
      this.etaChart.setData(e.xs, e.ys);
      this.etaChart.draw();
    }
    if (this.dayData) {
      const d = dayChartData(this.dayData);
      const peak = Math.max(1, ...d.power.pv, ...d.power.load, ...d.power.meter);
      const low = Math.min(0, ...d.power.meter);
      const top = niceCeil3(peak * 1.05);
      this.dayOpts.yMin = low < 0 ? -top / 3 : 0;
      this.dayOpts.yMax = low < 0 ? top - top / 3 : top;
      if (low < 0 && top - top / 3 < peak) {
        this.dayOpts.yMin = -top / 2;
        this.dayOpts.yMax = top;
      }
      this.dayChart.setData(d.xs, d.power);
      this.dayChart.draw();
      this.heightOpts.yMax = niceCeil3(Math.max(1, ...d.height.z));
      this.heightChart.setData(d.xs, d.height);
      this.heightChart.draw();
    }
  }
}
