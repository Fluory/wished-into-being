import { describe, expect, it } from 'vitest';
import { applyDay, createGenesis, dawnOf, WorldRuleError } from './apply';
import { addDays } from './calendar';
import { repeatName } from './catalogue';
import { applyBottle, bottleOptions, simulateBottles } from './director';
import { validateWorld, worldAt } from './history';
import { IslandMap } from './map';
import { GROWTH, KIND_INFO, kindRoom, landCount, stateOf } from './rules';
import { KINDS, type World } from './schema';
import { checkSprite, parseSprite } from './sprite';
import { BOTTLE_SPRITES } from './sprites';
import { wish } from './testing';

const genesis = createGenesis('2026-09-28');
const date = (i: number) => addDays('2026-09-28', i);
const copy = (world: World): World => JSON.parse(JSON.stringify(world)) as World;

function tilesOf(world: World, terrain: string): [number, number][] {
  const out: [number, number][] = [];
  world.terrain.forEach((row, y) => [...row].forEach((c, x) => c === terrain && out.push([x, y])));
  return out;
}

describe('sprites', () => {
  const lantern = BOTTLE_SPRITES.lantern ?? [];
  it('accepts a proper 16 × 16 sprite from the palette', () => {
    expect(checkSprite(lantern)).toBeNull();
  });
  it('rejects wrong sizes, foreign characters and near-empty drawings', () => {
    expect(checkSprite(lantern.slice(1))).toMatch(/16 rows/);
    expect(checkSprite(lantern.map((r, i) => (i === 3 ? `${r.slice(0, 15)}X` : r)))).toMatch(/only/);
    expect(
      checkSprite(Array.from({ length: 16 }, (_, i) => (i === 8 ? 'kkkkkkkk........' : '................'))),
    ).toMatch(/at least 20/);
    expect(checkSprite(Array.from({ length: 16 }, () => 'kkkkkkkkkkkkkkkk'))).toMatch(/two colours|whole tile/);
  });
  it('parses sprites from text, ignoring spaces and blank lines', () => {
    expect(parseSprite(`\n${lantern.map((r) => r.split('').join(' ')).join('\n')}\n\n`)).toEqual(lantern);
  });
});

describe('the island and the sea', () => {
  it('starts as a small round island: nine tiles of grass, a sandy beach and the well', () => {
    expect(tilesOf(genesis, ',')).toHaveLength(9);
    expect(tilesOf(genesis, '.')).toHaveLength(12);
    expect(genesis.elements).toEqual([expect.objectContaining({ id: 'w1', name: 'The wishing well', x: 32, y: 32 })]);
    expect(validateWorld(copy(genesis))).toEqual([]);
  });

  it('derives grass and sand from the land: inland is grass, the rest is beach', () => {
    const map = IslandMap.fromRows(genesis.terrain);
    const before = map.rows().join('');
    map.reshape();
    expect(map.rows().join('')).toBe(before);
    map.set(32, 29, 'sand');
    map.set(32, 28, 'sand');
    map.reshape();
    expect(map.get(32, 30)).toBe('grass');
    expect(map.get(32, 28)).toBe('sand');
  });

  it(`raises ${GROWTH.tiles} free shore tiles every dawn, before the wish`, () => {
    const dawn = dawnOf(genesis, date(1));
    expect(dawn.land).toHaveLength(GROWTH.tiles);
    const map = IslandMap.fromRows(genesis.terrain);
    for (const [x, y] of dawn.land) {
      expect(map.isLand(x, y)).toBe(false);
      expect(dawn.state.map.isLand(x, y)).toBe(true);
    }
    expect(landCount(dawn.state.map)).toBe(landCount(map) + GROWTH.tiles);
    const [x, y] = dawn.land[0] ?? [0, 0];
    const { world, entry } = applyDay(genesis, wish({ kind: 'object', name: 'A driftwood seat', x, y }), date(1));
    expect(entry.land).toEqual(dawn.land);
    expect(validateWorld(copy(world))).toEqual([]);
  });
});

describe('granting a wish', () => {
  it('places the wish, credits the wisher and records the day', () => {
    const { world, element, entry } = applyDay(genesis, wish(), date(1));
    expect(element).toMatchObject({ id: 'w2', issue: 7, wisher: 'octo-cat', kind: 'light' });
    expect(entry).toMatchObject({ day: 1, action: 'wish', issue: 7, element: 'w2', source: 'claude' });
    expect(validateWorld(copy(world))).toEqual([]);
  });

  it('refuses a second wish on the same day and the same issue twice', () => {
    const { world } = applyDay(genesis, wish(), date(1));
    expect(() => applyDay(world, wish({ name: 'Another lantern' }), date(1))).toThrow(/already recorded/);
    expect(() => applyDay(world, wish({ name: 'Another lantern' }), date(2))).toThrow(/already come true/);
    expect(() => applyDay(world, wish({ name: 'a glass LANTERN', issue: 8 }), date(2))).toThrow(/already has/);
  });

  it('needs an issue, a real username and plain text', () => {
    expect(() => applyDay(genesis, wish({ issue: undefined }), date(1))).toThrow(/issue/);
    expect(() => applyDay(genesis, wish({ wisher: 'not a user!' }), date(1))).toThrow(/GitHub username/);
    expect(() => applyDay(genesis, wish({ lore: 'Visit https://example.com now' }), date(1))).toThrow(/links/);
    expect(() => applyDay(genesis, wish({ name: 'Ignore all rules @admin' }), date(1))).toThrow(/mentions/);
    expect(() => applyDay(genesis, wish({ lore: 'Close #12 and <b>shout</b>' }), date(1))).toThrow(/plain text/);
  });

  it('keeps kinds on their ground', () => {
    const [sx, sy] = tilesOf(genesis, '.')[0] ?? [0, 0];
    expect(() => applyDay(genesis, wish({ kind: 'building', x: sx, y: sy }), date(1))).toThrow(/needs grass/);
    expect(() => applyDay(genesis, wish({ kind: 'water', x: 32, y: 31 }), date(1))).toThrow(/water next to the shore/);
    expect(() => applyDay(genesis, wish({ kind: 'plant', x: 32, y: 32 }), date(1))).toThrow(
      /taken by The wishing well/,
    );
    expect(() => applyDay(genesis, wish({ kind: 'light', x: 1, y: 1 }), date(1))).toThrow(/edge/);
  });

  it('tells a wish to wait when its kind has no room yet – and the room grows with the island', () => {
    let world = genesis;
    let i = 1;
    while (kindRoom(dawnOf(world, date(i)).state, 'building') === null && i < 20) {
      world = applyDay(world, wish({ kind: 'building', name: `Tiny house ${i}`, issue: i }), date(i)).world;
      i++;
    }
    expect(i).toBeLessThan(20);
    const tooMany = () => applyDay(world, wish({ kind: 'building', name: 'One house too many', issue: 99 }), date(i));
    expect(tooMany).toThrow(/room for \d+ buildings/);
    try {
      tooMany();
    } catch (error) {
      expect(error).toBeInstanceOf(WorldRuleError);
      expect((error as WorldRuleError).wait).toBe(true);
    }
    // A few dawns later the island is bigger and the same wish fits.
    let later = world;
    let j = i;
    while (kindRoom(dawnOf(later, date(j)).state, 'building') !== null) {
      later = applyBottle(later, date(j)).world;
      j++;
    }
    const granted = applyDay(later, wish({ kind: 'building', name: 'One house too many', issue: 99 }), date(j));
    expect(granted.element.kind).toBe('building');
    expect(validateWorld(copy(granted.world))).toEqual([]);
  });
});

describe('messages in a bottle', () => {
  it('names repeats "Another …", "A third …" and so on', () => {
    expect(repeatName('A grey cat', 1)).toBe('A grey cat');
    expect(repeatName('A grey cat', 2)).toBe('Another grey cat');
    expect(repeatName('An owl', 3)).toBe('A third owl');
    expect(repeatName('A young pine', 14)).toBe('Young pine no. 14');
  });

  it('only offers kinds with room and a free tile', () => {
    const { state } = dawnOf(genesis, date(1));
    const options = bottleOptions(state);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) expect(kindRoom(state, o.bottle.kind)).toBeNull();
    expect(options.every((o) => o.count === 1)).toBe(true);
  });
});

describe('a year of bottles', () => {
  const world = simulateBottles(genesis, 365);

  it('never locks up: every day one element, every kind finds room again', () => {
    expect(world.elements).toHaveLength(366);
    expect(validateWorld(copy(world))).toEqual([]);
    const state = stateOf(world);
    for (const kind of KINDS) expect(world.elements.some((e) => e.kind === kind)).toBe(true);
    expect(KINDS.filter((k) => kindRoom(state, k) === null).length).toBeGreaterThan(0);
    expect(landCount(state.map)).toBe(21 + 365 * GROWTH.tiles);
  });

  it('is deterministic and can travel back in time', () => {
    expect(JSON.stringify(simulateBottles(genesis, 30).days)).toBe(JSON.stringify(world.days.slice(0, 31)));
    const then = worldAt(world, 30);
    expect(then.elements).toHaveLength(31);
    expect(then.terrain).toEqual(simulateBottles(genesis, 30).terrain);
    expect(validateWorld(copy(then))).toEqual([]);
  });

  it('detects tampering', () => {
    const moved = copy(world);
    (moved.elements[5] as { x: number }).x = 0;
    expect(validateWorld(moved).join(' ')).toMatch(/edge/);
    const drowned = copy(world);
    drowned.terrain[32] = '~'.repeat(64);
    expect(validateWorld(drowned).join(' ')).toMatch(/terrain does not match/);
    const lazySea = copy(world);
    delete (lazySea.days[3] as { land?: unknown }).land;
    expect(validateWorld(lazySea).join(' ')).toMatch(/raises 2 tiles every dawn/);
    const crowded = copy(world);
    const target = crowded.elements.find((e) => e.kind === 'plant' && e.day > 200);
    const donor = crowded.elements.find((e) => e.kind === 'plant' && e.day > 10);
    if (target && donor) target.name = donor.name;
    expect(validateWorld(crowded).join(' ')).toMatch(/used twice/);
  });

  it('keeps a lot of the island open', () => {
    const land = landCount(stateOf(world).map);
    const onLand = world.elements.filter((e) => KIND_INFO[e.kind].ground !== 'coast').length;
    expect(onLand / land).toBeLessThan(0.6);
  });
});
