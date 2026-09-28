import { daysBetween } from './calendar';
import { checkLogin, checkText, tidyName } from './lore';
import { IslandMap } from './map';
import {
  checkTile,
  GROWTH,
  growthTile,
  islandState,
  KIND_INFO,
  kindRoom,
  pickTile,
  type IslandState,
  type Near,
} from './rules';
import { HEIGHT, WIDTH, type DayEntry, type Element, type Kind, type Star, type World } from './schema';
import { checkSprite } from './sprite';
import { WELL } from './sprites';

export const GENESIS_TITLE = 'A wishing well on a small island';
export const GENESIS_LORE = 'Somebody has to make the first wish. The well is ready when you are.';
export const CENTER: [number, number] = [32, 32];

/** A wish or a choice that breaks a rule. `wait` means: it may fit once the island has grown. */
export class WorldRuleError extends Error {
  constructor(
    message: string,
    readonly wait = false,
  ) {
    super(message);
    this.name = 'WorldRuleError';
  }
}

export function createGenesis(date: string): World {
  const map = IslandMap.empty();
  const [cx, cy] = CENTER;
  for (let y = cy - 3; y <= cy + 3; y++)
    for (let x = cx - 3; x <= cx + 3; x++) if (Math.hypot(x - cx, y - cy) <= 2.5) map.set(x, y, 'sand');
  map.reshape();
  const well: Element = { id: 'w1', day: 0, kind: 'object', name: 'The wishing well', x: cx, y: cy, sprite: [...WELL] };
  return {
    version: 1,
    name: 'Wished into Being',
    genesis: date,
    width: WIDTH,
    height: HEIGHT,
    terrain: map.rows(),
    elements: [well],
    days: [{ day: 0, date, action: 'genesis', element: 'w1', title: GENESIS_TITLE, lore: GENESIS_LORE, source: 'genesis' }],
  };
}

/** The island at dawn: the day number, the tiles the sea raised and the island with them. */
export interface Dawn {
  day: number;
  date: string;
  land: [number, number][];
  state: IslandState;
}

/**
 * Every dawn the sea raises `GROWTH.tiles` tiles of shore (while the map has room), one after
 * the other. This happens before the day's wish, so the wish may already stand on new land.
 */
export function dawnOf(world: World, date: string): Dawn {
  const day = daysBetween(world.genesis, date);
  const last = world.days[world.days.length - 1];
  if (!last || day <= last.day) throw new WorldRuleError(`day ${day} (${date}) is already recorded`);
  const map = IslandMap.fromRows(world.terrain);
  const land: [number, number][] = [];
  for (let i = 0; i < GROWTH.tiles; i++) {
    const tile = growthTile(islandState(map, world.elements), world.genesis, `${date}#${i}`);
    if (!tile) break;
    map.set(tile[0], tile[1], 'sand');
    map.reshape();
    land.push(tile);
  }
  return { day, date, land, state: islandState(map, world.elements) };
}

export interface WishInput {
  action: 'wish' | 'bottle';
  kind: Kind;
  name: string;
  sprite: string[];
  issue?: number;
  wisher?: string;
  votes?: number;
  x?: number;
  y?: number;
  near?: Near;
  title?: string;
  lore: string;
  stars?: Star[];
  source: 'claude' | 'director';
}

export interface DayResult {
  world: World;
  entry: DayEntry;
  element: Element;
}

/** Everything that stops a wish on the island as it is (`dawnOf(...).state`), or null. */
export function checkWish(state: IslandState, input: WishInput): { reason: string; wait: boolean } | null {
  const bad = (reason: string, wait = false) => ({ reason, wait });
  const name = tidyName(input.name);
  const text = checkText('name', name) ?? checkText('lore', input.lore) ?? (input.title ? checkText('title', input.title) : null);
  if (text) return bad(text);
  const sprite = checkSprite(input.sprite);
  if (sprite) return bad(sprite);
  if (input.action === 'wish') {
    if (!input.issue) return bad('a wish needs the number of its issue');
    if (!input.wisher) return bad('a wish needs the GitHub username of the person who wished it');
    const login = checkLogin(input.wisher);
    if (login) return bad(login);
    if (state.elements.some((e) => e.issue === input.issue)) return bad(`wish #${input.issue} has already come true`);
  }
  if (state.elements.some((e) => e.name.toLowerCase() === name.toLowerCase()))
    return bad(`the island already has "${name}" – give the new wish its own name`);
  const room = kindRoom(state, input.kind);
  if (room) return bad(room, true);
  return null;
}

/** Record one day: the sea raises a tile, then one wish (or bottle) comes true on one tile. */
export function applyDay(world: World, input: WishInput, date: string): DayResult {
  const dawn = dawnOf(world, date);
  const { state } = dawn;
  const problem = checkWish(state, input);
  if (problem) throw new WorldRuleError(problem.reason, problem.wait);

  let tile: [number, number] | null;
  if (input.x !== undefined && input.y !== undefined) {
    const reason = checkTile(state, input.kind, input.x, input.y);
    if (reason) throw new WorldRuleError(reason);
    tile = [input.x, input.y];
  } else {
    tile = pickTile(state, input.kind, input.near ?? 'anywhere', date);
  }
  if (!tile) throw new WorldRuleError(`there is no free place for a ${KIND_INFO[input.kind].label} today`, true);

  const element: Element = {
    id: `w${world.elements.length + 1}`,
    day: dawn.day,
    kind: input.kind,
    name: tidyName(input.name),
    x: tile[0],
    y: tile[1],
    ...(input.issue ? { issue: input.issue } : {}),
    ...(input.wisher ? { wisher: input.wisher } : {}),
    ...(input.votes !== undefined ? { votes: input.votes } : {}),
    sprite: [...input.sprite],
  };
  const entry: DayEntry = {
    day: dawn.day,
    date,
    action: input.action,
    element: element.id,
    title: (input.title ?? element.name).trim(),
    lore: input.lore.trim(),
    source: input.source,
    ...(input.issue ? { issue: input.issue } : {}),
    ...(input.wisher ? { wisher: input.wisher } : {}),
    ...(input.votes !== undefined ? { votes: input.votes } : {}),
    ...(dawn.land.length > 0 ? { land: dawn.land } : {}),
    ...(input.stars && input.stars.length > 0 ? { stars: input.stars.slice(0, 60) } : {}),
  };
  return {
    world: { ...world, terrain: state.map.rows(), elements: [...world.elements, element], days: [...world.days, entry] },
    entry,
    element,
  };
}
