import { createGenesis } from './apply';
import { daysBetween } from './calendar';
import { IslandMap } from './map';
import { checkTile, GROWTH, growthTile, inside, islandState, kindRoom, occupied } from './rules';
import { WorldSchema, type World } from './schema';
import { checkSprite } from './sprite';

/** The island as it was on `day`: later wishes removed, the land raised later back under water. */
export function worldAt(world: World, day: number): World {
  const map = IslandMap.fromRows(world.terrain);
  for (const entry of world.days) if (entry.day > day) for (const [x, y] of entry.land ?? []) map.set(x, y, 'water');
  map.reshape();
  return {
    ...world,
    terrain: map.rows(),
    elements: world.elements.filter((e) => e.day <= day),
    days: world.days.filter((d) => d.day <= day),
  };
}

/**
 * `npm run world:check`: the schema, a consistent log, new shore every dawn, and every
 * wish legal on the day it came true (ground, free tile, room for its kind).
 */
export function validateWorld(input: unknown): string[] {
  const parsed = WorldSchema.safeParse(input);
  if (!parsed.success) return parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  const world = parsed.data;
  const errors: string[] = [];
  const first = world.days[0];
  if (!first || first.action !== 'genesis' || first.day !== 0 || first.date !== world.genesis)
    errors.push('the log must start with the genesis entry (day 0 on the genesis date)');
  if (world.elements.length !== world.days.length) errors.push('every day adds exactly one element');

  const map = IslandMap.fromRows(createGenesis(world.genesis).terrain);
  const issues = new Set<number>();
  const names = new Set<string>();
  world.days.forEach((d, i) => {
    if (d.day !== daysBetween(world.genesis, d.date)) errors.push(`day ${d.day}: date ${d.date} does not match`);
    const prev = world.days[i - 1];
    if (prev && d.day <= prev.day) errors.push(`day ${d.day}: days must be strictly increasing`);
    if (i > 0 && d.action === 'genesis') errors.push(`day ${d.day}: only day 0 may be the genesis`);
    const element = world.elements[i];
    if (!element || element.id !== d.element || element.id !== `w${i + 1}`) {
      errors.push(`day ${d.day}: expected element w${i + 1} in order, got ${d.element}`);
      return;
    }
    if (element.day !== d.day) errors.push(`${element.id}: day ${element.day} does not match its log entry`);
    const sprite = checkSprite(element.sprite);
    if (sprite) errors.push(`${element.id}: ${sprite}`);
    const name = element.name.toLowerCase();
    if (names.has(name)) errors.push(`${element.id}: the name "${element.name}" is used twice`);
    names.add(name);
    if (d.action === 'wish') {
      if (!d.issue || d.issue !== element.issue || !d.wisher || d.wisher !== element.wisher)
        errors.push(`day ${d.day}: a wish needs the same issue and wisher in the log and on the element`);
      if (d.issue && issues.has(d.issue)) errors.push(`day ${d.day}: wish #${d.issue} came true twice`);
      if (d.issue) issues.add(d.issue);
    } else if (d.issue || d.wisher || element.issue || element.wisher) {
      errors.push(`day ${d.day}: only a wish may name an issue or a wisher`);
    }
    if (i === 0) {
      if (d.land) errors.push('the genesis raises no extra land');
      return;
    }

    const earlier = world.elements.slice(0, i);
    const raised = d.land ?? [];
    for (const [x, y] of raised) {
      if (!inside(x, y) || !map.isCoast(x, y) || occupied(islandState(map, earlier), x, y))
        errors.push(`day ${d.day}: the sea only raises free shore tiles, not (${x}, ${y})`);
      map.set(x, y, 'sand');
      map.reshape();
    }
    if (raised.length < GROWTH.tiles && growthTile(islandState(map, earlier), world.genesis, d.date))
      errors.push(`day ${d.day}: the sea raises ${GROWTH.tiles} tiles every dawn, this day raised ${raised.length}`);
    const after = islandState(map, earlier);
    const tile = checkTile(after, element.kind, element.x, element.y);
    if (tile) errors.push(`day ${d.day}: ${element.name} – ${tile}`);
    const room = kindRoom(after, element.kind);
    if (room) errors.push(`day ${d.day}: ${element.name} – ${room}`);
  });
  if (map.rows().join('\n') !== world.terrain.join('\n'))
    errors.push('terrain does not match the genesis plus the land the sea raised in the log');
  return errors;
}
