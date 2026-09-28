import type { DayEntry, Element, World } from '@/features/island';

/**
 * Stable, diff-friendly JSON for world.json: one terrain row, element or day per line, keys
 * in a fixed order. A daily commit therefore shows up as a few changed map characters (the new
 * shore), one new element line (with its sprite) and one new log line.
 */

const ELEMENT_KEYS: (keyof Element)[] = ['id', 'day', 'kind', 'name', 'x', 'y', 'issue', 'wisher', 'votes', 'sprite'];
const DAY_KEYS: (keyof DayEntry)[] = [
  'day',
  'date',
  'action',
  'element',
  'title',
  'lore',
  'source',
  'issue',
  'wisher',
  'votes',
  'land',
  'stars',
];

function ordered<T extends object>(value: T, keys: readonly (keyof T)[]): string {
  const parts: string[] = [];
  for (const k of keys) {
    const v = value[k];
    if (v !== undefined) parts.push(`${JSON.stringify(k)}:${JSON.stringify(v)}`);
  }
  return `{${parts.join(',')}}`;
}

function list(items: string[]): string {
  return items.length === 0 ? '[]' : `[\n    ${items.join(',\n    ')}\n  ]`;
}

export function serializeWorld(world: World): string {
  return [
    '{',
    `  "version": ${world.version},`,
    `  "name": ${JSON.stringify(world.name)},`,
    `  "genesis": ${JSON.stringify(world.genesis)},`,
    `  "width": ${world.width},`,
    `  "height": ${world.height},`,
    `  "terrain": ${list(world.terrain.map((r) => JSON.stringify(r)))},`,
    `  "elements": ${list(world.elements.map((e) => ordered(e, ELEMENT_KEYS)))},`,
    `  "days": ${list(world.days.map((d) => ordered(d, DAY_KEYS)))}`,
    '}',
    '',
  ].join('\n');
}
