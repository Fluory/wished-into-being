import { applyDay, dawnOf, type DayResult, type WishInput } from './apply';
import { addDays } from './calendar';
import { BOTTLE_WISHES, bottleSprite, repeatName, type BottleWish } from './catalogue';
import { createRng, hashString } from './rng';
import { coastCount, hasFreeTile, KIND_INFO, kindRoom, landCount, type IslandState } from './rules';
import { KINDS, type Kind, type Star, type World } from './schema';

export interface BottleChoice {
  bottle: BottleWish;
  /** 1 for the first bottle of its kind on the island, 2 for "Another …", and so on. */
  count: number;
  name: string;
  lore: string;
}

function countOf(state: IslandState, bottle: BottleWish): number {
  const names = new Set(state.elements.map((e) => e.name.toLowerCase()));
  let n = 1;
  while (names.has(repeatName(bottle.name, n).toLowerCase())) n++;
  return n;
}

/** Every bottle that could come true on the island at dawn: its kind has room and a free tile. */
export function bottleOptions(state: IslandState): BottleChoice[] {
  const open = new Map<Kind, boolean>();
  const fits = (kind: Kind) => {
    if (!open.has(kind)) open.set(kind, kindRoom(state, kind) === null && hasFreeTile(state, kind));
    return open.get(kind) === true;
  };
  return BOTTLE_WISHES.filter((b) => fits(b.kind)).map((bottle) => {
    const count = countOf(state, bottle);
    return {
      bottle,
      count,
      name: repeatName(bottle.name, count),
      lore: bottle.lore[(count - 1) % bottle.lore.length] ?? '',
    };
  });
}

/** How full each kind is, 0 (empty) to 1 (no room). */
function fullness(state: IslandState): Record<Kind, number> {
  const land = landCount(state.map);
  const coast = coastCount(state.map);
  const out = {} as Record<Kind, number>;
  for (const kind of KINDS)
    out[kind] = state.elements.filter((e) => e.kind === kind).length / Math.max(1, KIND_INFO[kind].limit(land, coast));
  return out;
}

/**
 * The fallback when no wish fits: a message in a bottle from the islanders. New bottles come
 * first, roughly in catalogue order (the island's first chapter is curated); after that the
 * emptiest kinds get the next bottle. Deterministic: same island, same date, same bottle.
 */
export function bottleWish(world: World, date: string, stars?: Star[]): WishInput | null {
  const { state } = dawnOf(world, date);
  const options = bottleOptions(state);
  if (options.length === 0) return null;
  const rng = createRng(hashString(`bottle:${date}`));
  const fresh = options.filter((o) => o.count === 1);
  const full = fresh.length > 0 ? null : fullness(state);
  const pool = full
    ? [...options].sort((a, b) => full[a.bottle.kind] - full[b.bottle.kind]).slice(0, 5)
    : fresh.slice(0, 4);
  const choice = pool[Math.floor(rng() * pool.length)] ?? options[0];
  if (!choice) return null;
  return {
    action: 'bottle',
    kind: choice.bottle.kind,
    name: choice.name,
    sprite: bottleSprite(choice.bottle.key),
    lore: choice.lore,
    near: choice.bottle.near,
    ...(stars ? { stars } : {}),
    source: 'director',
  };
}

export function applyBottle(world: World, date: string, stars?: Star[]): DayResult {
  const wish = bottleWish(world, date, stars);
  if (!wish) throw new Error('no message in a bottle fits the island today');
  return applyDay(world, wish, date);
}

/** Grow the island `days` days with bottles only (simulation, tests). */
export function simulateBottles(world: World, days: number): World {
  let w = world;
  const start = w.days[w.days.length - 1]?.date ?? w.genesis;
  for (let i = 1; i <= days; i++) w = applyBottle(w, addDays(start, i)).world;
  return w;
}
