import { IslandMap } from './map';
import { hashCell, hashString } from './rng';
import { HEIGHT, WIDTH, type Element, type Kind, type Terrain, type World } from './schema';

/**
 * Where a wish may stand and how many of a kind the island has room for. The sea raises one
 * tile of land every dawn, so a wish that does not fit *yet* only has to wait: the limits grow
 * with the island. Together the limits grow faster than one per tile, so some kind always has
 * room – the island can never lock itself up.
 */

/** Tiles kept free along the edge of the map. */
export const MARGIN = 4;

export interface KindInfo {
  label: string;
  plural: string;
  /** Where it stands: on grass, on any land, or in the water next to the shore. */
  ground: 'grass' | 'land' | 'coast';
  /** How many the island has room for, given its size. */
  limit: (land: number, coast: number) => number;
  rule: string;
  examples: string;
}

export const KIND_INFO: Record<Kind, KindInfo> = {
  building: {
    label: 'building',
    plural: 'buildings',
    ground: 'grass',
    limit: (land) => 1 + Math.floor(land / 6),
    rule: 'stands on grass; one building for every 6 tiles of land, plus one',
    examples: 'a cottage, a tower, a tent, a tiny library',
  },
  plant: {
    label: 'plant',
    plural: 'plants',
    ground: 'grass',
    limit: (land) => 2 + Math.floor(land / 3),
    rule: 'grows on grass; one plant for every 3 tiles of land, plus two',
    examples: 'a tree, a flower bed, mushrooms, a hedge',
  },
  creature: {
    label: 'creature',
    plural: 'creatures',
    ground: 'land',
    limit: (land) => 1 + Math.floor(land / 5),
    rule: 'lives on land; one creature for every 5 tiles of land, plus one',
    examples: 'a cat, an owl, a snail, a fox',
  },
  object: {
    label: 'object',
    plural: 'objects',
    ground: 'land',
    limit: (land) => 2 + Math.floor(land / 4),
    rule: 'stands on land; one object for every 4 tiles of land, plus two',
    examples: 'a bench, a telescope, a signpost, a kite',
  },
  light: {
    label: 'light',
    plural: 'lights',
    ground: 'land',
    limit: (land) => 1 + Math.floor(land / 6),
    rule: 'stands on land and glows at night; one light for every 6 tiles of land, plus one',
    examples: 'a lantern, a campfire, a glowing crystal',
  },
  water: {
    label: 'water wish',
    plural: 'water wishes',
    ground: 'coast',
    limit: (_land, coast) => 1 + Math.floor(coast / 4),
    rule: 'floats in the water next to the shore; one for every 4 tiles of shore, plus one',
    examples: 'a rowboat, a golden fish, a buoy',
  },
};

export interface IslandState {
  map: IslandMap;
  elements: readonly Element[];
  /** The elements by tile (`y * WIDTH + x`). */
  taken: ReadonlyMap<number, Element>;
}

export function islandState(map: IslandMap, elements: readonly Element[]): IslandState {
  const taken = new Map<number, Element>();
  for (const e of elements) taken.set(e.y * WIDTH + e.x, e);
  return { map, elements, taken };
}

export function stateOf(world: Pick<World, 'terrain' | 'elements'>): IslandState {
  return islandState(IslandMap.fromRows(world.terrain), world.elements);
}

export function landCount(map: IslandMap): number {
  return map.count((t) => t !== 'water');
}

export function coastCount(map: IslandMap): number {
  return map.count((_t, x, y) => map.isCoast(x, y));
}

export function inside(x: number, y: number): boolean {
  return x >= MARGIN && y >= MARGIN && x < WIDTH - MARGIN && y < HEIGHT - MARGIN;
}

export function occupied(state: IslandState, x: number, y: number): Element | undefined {
  return state.taken.get(y * WIDTH + x);
}

function groundFits(ground: KindInfo['ground'], terrain: Terrain, map: IslandMap, x: number, y: number): boolean {
  if (ground === 'coast') return map.isCoast(x, y);
  if (ground === 'grass') return terrain === 'grass';
  return terrain !== 'water';
}

/** Why a kind cannot get another wish right now, or null. */
export function kindRoom(state: IslandState, kind: Kind): string | null {
  const info = KIND_INFO[kind];
  const land = landCount(state.map);
  const coast = coastCount(state.map);
  const have = state.elements.filter((e) => e.kind === kind).length;
  const limit = info.limit(land, coast);
  if (have < limit) return null;
  const more = kind === 'water' ? 'shore' : 'land';
  return `the island has room for ${limit} ${info.plural} and already has ${have} – it needs more ${more} first`;
}

/** Why a wish of this kind cannot stand on (x, y), or null. */
export function checkTile(state: IslandState, kind: Kind, x: number, y: number): string | null {
  if (!inside(x, y)) return `(${x}, ${y}) is too close to the edge of the map`;
  const taken = occupied(state, x, y);
  if (taken) return `(${x}, ${y}) is taken by ${taken.name}`;
  const info = KIND_INFO[kind];
  const terrain = state.map.get(x, y);
  if (!groundFits(info.ground, terrain, state.map, x, y)) {
    const where = info.ground === 'coast' ? 'water next to the shore' : info.ground === 'grass' ? 'grass' : 'land';
    return `a ${info.label} needs ${where}, (${x}, ${y}) is ${state.map.isCoast(x, y) ? 'shore water' : terrain}`;
  }
  return null;
}

/** Whether a kind has at least one free tile (cheaper than `freeTiles`). */
export function hasFreeTile(state: IslandState, kind: Kind): boolean {
  for (let y = MARGIN; y < HEIGHT - MARGIN; y++)
    for (let x = MARGIN; x < WIDTH - MARGIN; x++) if (checkTile(state, kind, x, y) === null) return true;
  return false;
}

export function freeTiles(state: IslandState, kind: Kind): [number, number][] {
  const out: [number, number][] = [];
  for (let y = MARGIN; y < HEIGHT - MARGIN; y++)
    for (let x = MARGIN; x < WIDTH - MARGIN; x++) if (checkTile(state, kind, x, y) === null) out.push([x, y]);
  return out;
}

export type Near = 'anywhere' | 'well' | 'water' | 'quiet';
export const NEAR: readonly Near[] = ['anywhere', 'well', 'water', 'quiet'];

/** Pick a free tile for a wish; `near` is the wisher's hint. Deterministic per day. */
export function pickTile(state: IslandState, kind: Kind, near: Near, seed: string): [number, number] | null {
  const tiles = freeTiles(state, kind);
  if (tiles.length === 0) return null;
  const well = state.elements[0];
  const score = ([x, y]: [number, number]): number => {
    const jitter = (hashString(`${seed}:${x},${y}`) % 1000) / 1000;
    switch (near) {
      case 'well':
        return -Math.hypot(x - (well?.x ?? WIDTH / 2), y - (well?.y ?? HEIGHT / 2)) + jitter * 0.5;
      case 'water': {
        let best = 99;
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++)
            if (!state.map.isLand(x + dx, y + dy)) best = Math.min(best, Math.hypot(dx, dy));
        return -best + jitter * 0.5;
      }
      case 'quiet': {
        const nearest = Math.min(99, ...state.elements.map((e) => Math.hypot(e.x - x, e.y - y)));
        return nearest + jitter * 0.5;
      }
      default:
        return jitter;
    }
  };
  let best = tiles[0] as [number, number];
  let bestScore = -Infinity;
  for (const t of tiles) {
    const s = score(t);
    if (s > bestScore) {
      best = t;
      bestScore = s;
    }
  }
  return best;
}

/**
 * A smooth field over the map, fixed for each island: where it is high the sea likes to raise
 * land, so the island grows capes and bays instead of a perfect circle.
 */
export function shoreField(x: number, y: number, salt: number): number {
  const size = 5;
  const gx = Math.floor(x / size);
  const gy = Math.floor(y / size);
  const ease = (t: number) => t * t * (3 - 2 * t);
  const fx = ease(x / size - gx);
  const fy = ease(y / size - gy);
  const v = (i: number, j: number) => (hashCell(gx + i, gy + j, salt) % 1000) / 1000;
  const top = v(0, 0) + (v(1, 0) - v(0, 0)) * fx;
  const bottom = v(0, 1) + (v(1, 1) - v(0, 1)) * fx;
  return top + (bottom - top) * fy;
}

/**
 * The growth: tiles per dawn, the weight of the shore field, the pull towards the middle (keeps
 * the island roughly round) and the daily jitter.
 */
export const GROWTH = { tiles: 2, field: 2.6, pull: 0.1, jitter: 1.4 } as const;

/** Water wishes keep open water this far around them, so the land never locks a boat in a pond. */
export const HARBOUR = 2;

/**
 * Where the sea raises land at dawn: a free shore tile, preferring tiles with much land around
 * them (so bays fill up) and the high parts of the island's shore field, never next to a water
 * wish. Null when the island has reached the edge of the map everywhere.
 */
export function growthTile(state: IslandState, genesis: string, date: string): [number, number] | null {
  const salt = hashString(`shore:${genesis}`);
  const harbours = state.elements.filter((e) => KIND_INFO[e.kind].ground === 'coast');
  let best: [number, number] | null = null;
  let bestScore = -Infinity;
  for (let y = MARGIN; y < HEIGHT - MARGIN; y++) {
    for (let x = MARGIN; x < WIDTH - MARGIN; x++) {
      if (!state.map.isCoast(x, y) || occupied(state, x, y)) continue;
      if (harbours.some((e) => Math.abs(e.x - x) <= HARBOUR && Math.abs(e.y - y) <= HARBOUR)) continue;
      const jitter = (hashString(`${date}:${x},${y}`) % 1000) / 1000;
      const pull = Math.hypot(x - WIDTH / 2, y - HEIGHT / 2);
      const score =
        state.map.landNeighbours(x, y) +
        GROWTH.field * shoreField(x, y, salt) -
        GROWTH.pull * pull +
        GROWTH.jitter * jitter;
      if (score > bestScore) {
        best = [x, y];
        bestScore = score;
      }
    }
  }
  return best;
}
