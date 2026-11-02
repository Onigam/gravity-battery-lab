import { describe, expect, it } from 'vitest';
import {
  BLOCK,
  CARRIER_MASS,
  FARM,
  FARM_DRUM_DIAMETER,
  HALF_BLOCK,
  HOOK_APPROACH,
  ROPE_DIAMETER,
  STACK_BLOCKS,
  STACK_HALVES,
  STACK_HEIGHT,
  TOWER_HEIGHT,
} from '../sim/machine';
import { fallLength, ropeLength } from '../sim/reeving';
import {
  AXLE_ABOVE_SADDLE,
  BUFFER_TOP,
  CARRIER,
  CROSSHEAD_TOP_Y0,
  DECK_TOP,
  DECK_Y0,
  DRUM_R,
  DRUM_Z,
  FOOT_X,
  FRAME_FRONT,
  FRAME_REAR,
  GEARS,
  GEAR_RATIO,
  HOIST,
  HOIST_REAR,
  HOIST_X,
  HOOK_BLOCK,
  MOTOR_Z,
  PAD,
  PAD_TOP,
  PLATE_IN,
  PV_WATTS,
  RAIL,
  SADDLE_Y0,
  SHOE,
  STACK,
  STROKE,
  TOWER,
  WH100_M,
  liftAt,
  windingX,
  woundAt,
} from './dims';

// The dimensions agree with each other and with the maker's page (S9 p. 1/55), and whatever the physics holds is imported, never retyped.

describe("the maker's page", () => {
  it("e1 2468, e12 1940, 32 from the hole to the foot's outer edge", () => {
    expect(HOIST_X(HOIST.e1) - HOIST_X(0)).toBeCloseTo(2.468, 6);
    expect(FOOT_X[1] - FOOT_X[0]).toBeCloseTo(1.94, 6);
    expect(HOIST_X(HOIST.e1) - FOOT_X[1]).toBeCloseTo(0.032, 6);
    expect(FOOT_X[0] - HOIST_X(0)).toBeCloseTo(HOIST.e7 + 0.001, 6);
  });
  it('924 across the frame, 1314 overall, the motor 199 from the rear, 420 from the drum', () => {
    expect(FRAME_REAR - FRAME_FRONT).toBeCloseTo(0.924, 6);
    expect(HOIST_REAR - FRAME_FRONT).toBeCloseTo(1.314, 6);
    expect(HOIST_REAR - MOTOR_Z).toBeCloseTo(0.199, 6);
    expect(MOTOR_Z - DRUM_Z).toBeCloseTo(0.42, 6);
  });
  it('the motor stays inside e2', () => {
    expect(HOIST.encoderEnd).toBeLessThanOrEqual(HOIST.e2);
    expect(HOIST.motorEnd).toBeLessThan(HOIST.brakeEnd);
    expect(HOIST.brakeEnd).toBeLessThan(HOIST.hoodEnd);
    expect(HOIST.hoodEnd).toBeLessThan(HOIST.encoderEnd);
  });
  it('the block is e10 tall, C leaves 74 mm under the feet at the top', () => {
    expect(AXLE_ABOVE_SADDLE + HOOK_BLOCK.sheaveR + HOOK_BLOCK.sheaveRim).toBeCloseTo(0.756, 6);
    expect(HOOK_APPROACH).toBe(0.83);
  });
  it('the motor clears the frame: it runs beside the drum, as the page draws it', () => {
    expect(MOTOR_Z - HOIST.ribR).toBeGreaterThan(FRAME_REAR - 0.002);
    expect(MOTOR_Z - HOIST.ribR).toBeGreaterThan(DRUM_Z + HOIST.flangeR);
  });
});

describe('the physics is imported, not retyped', () => {
  it('stroke, stack, rope, drum, tower', () => {
    expect(STROKE).toBe(20);
    expect(STACK.height).toBe(STACK_HEIGHT);
    expect(STACK.blocks).toBe(STACK_BLOCKS);
    expect(STACK.halves).toBe(STACK_HALVES);
    expect(2 * DRUM_R).toBe(FARM_DRUM_DIAMETER);
    expect(TOWER.height).toBe(TOWER_HEIGHT);
    expect(HOOK_BLOCK.sheaveR).toBeCloseTo(9 * ROPE_DIAMETER, 9);
  });
  it("the block sizes are the block maker's", () => {
    expect([BLOCK.length, BLOCK.width, BLOCK.height]).toEqual([1.6, 0.8, 0.8]);
    expect([HALF_BLOCK.length, HALF_BLOCK.width, HALF_BLOCK.height]).toEqual([1.6, 0.8, 0.4]);
    expect(STACK_HEIGHT).toBeCloseTo(3 * 0.8 + 0.4, 9);
  });
});

describe('the heights add up', () => {
  it("the research's tower: deck, then room for the hoist and its roof, 28 m", () => {
    expect(DECK_TOP).toBeCloseTo(SADDLE_Y0 + STROKE + HOOK_APPROACH, 9);
    expect(DECK_TOP).toBeLessThan(TOWER.height - 2);
    expect(DECK_TOP + HOIST.height).toBeLessThan(TOWER.eavesY - 0.5);
  });
  it('the falls of the model are the distance from the deck to the saddle', () => {
    for (const z of [0, 7, 20]) expect(DECK_TOP - (SADDLE_Y0 + z)).toBeCloseTo(fallLength(STROKE, z), 9);
  });
  it('a pad wider than the legs, its top above the ground', () => {
    expect(PAD.side).toBeGreaterThan(2 * TOWER.legX + TOWER.basePlate);
    expect(PAD_TOP).toBeGreaterThan(0);
  });
  it('lift follows the fraction, clamped', () => {
    expect(liftAt(0.5)).toBe(10);
    expect(liftAt(-1)).toBe(0);
    expect(liftAt(2)).toBe(20);
  });
});

describe('the rope and the drum', () => {
  it("holds the model's rope", () => {
    expect(woundAt(STROKE)).toBe(ropeLength(4, STROKE));
    expect(ropeLength(4, STROKE)).toBe(84);
  });
  it('the winding fits between the plates, with the disc of the drum brake past its start', () => {
    expect(windingX(woundAt(STROKE))).toBeGreaterThan(PLATE_IN[0]);
    expect(windingX(0)).toBeLessThan(HOIST_X(HOIST.discAt) - HOIST.discT);
  });
  it("the rope reaches the hook sheave's side straight down at the drum's pitch", () => {
    expect(DRUM_Z - DRUM_R).toBeCloseTo(HOOK_BLOCK.sheaveR, 9);
  });
  it("the gears give the physics' ratio within 1 %, and their centre distances the maker's 420 mm", () => {
    const ratio = GEARS.stages.reduce((a, s) => a * (s.wheel / s.pinion), 1);
    expect(Math.abs(ratio - GEAR_RATIO) / GEAR_RATIO).toBeLessThan(0.01);
    const centres = GEARS.stages.reduce((a, s) => a + s.pinion + s.wheel, 0);
    expect(Math.abs(centres - HOIST.drumToMotor)).toBeLessThan(0.001);
    expect(FARM.stages).toBe(GEARS.stages.length);
  });
});

describe('the weight is what the research assumes', () => {
  it('the steel of the carrier, the sling and the block comes in under the 3.2 t of K18', () => {
    const steel = 7850;
    // section areas of the members as drawn (rig/weight.ts), m²
    const hArea = (w: number, d: number, tf: number, tw: number) => 2 * w * tf + (d - 2 * tf) * tw;
    const under = DECK_Y0 - CARRIER.deckT - (BUFFER_TOP + CARRIER.strikeT);
    const volume =
      CARRIER.deckSide * CARRIER.deckSide * CARRIER.deckT +
      2 * (2 * CARRIER.uprightX) * hArea(CARRIER.beamW, under, 0.024, 0.016) +
      2 * CARRIER.deckSide * hArea(CARRIER.uprightW, under, 0.02, 0.014) +
      2 * (CROSSHEAD_TOP_Y0 - BUFFER_TOP) * hArea(CARRIER.uprightW, CARRIER.uprightW, 0.018, 0.012) +
      (2 * CARRIER.uprightX + CARRIER.uprightW) * hArea(CARRIER.crossheadW, CARRIER.crossheadD, 0.025, 0.02) +
      4 * 0.3 * 0.3 * CARRIER.strikeT +
      2 * 1.5 * CARRIER.beamW * CARRIER.strikeT +
      4 * (STACK.height + 0.1) * Math.PI * 0.015 * 0.015 +
      2 * 1.8 * 0.05 * 0.05 +
      0.8 * 0.05 * 0.05 * 2;
    // what is not computed here: shoes and safety gear 260 kg, hook block 380 kg (a 20 t bottom block, estimate)
    const kg = volume * steel + 260 + 380;
    expect(CARRIER_MASS).toBe(3200);
    expect(kg).toBeLessThan(CARRIER_MASS);
    expect(kg).toBeGreaterThan(2000);
  });
  it('the stack sits under the sling: the crosshead clears it, the deck carries it', () => {
    expect(DECK_Y0 + STACK.height).toBeLessThan(SADDLE_Y0);
    expect(STACK.width / 2).toBeLessThan(CARRIER.uprightX - CARRIER.uprightW / 2);
    expect(STACK.width).toBeLessThan(CARRIER.deckSide);
  });
  it('the rails and the shoes meet', () => {
    expect(RAIL.bladeT).toBeLessThan(SHOE.slot);
  });
  it('100 Wh is what m·g·h says, at 20 t', () => {
    expect(WH100_M).toBeCloseTo(1.835, 3);
    expect(PV_WATTS).toBe(36000);
  });
});
