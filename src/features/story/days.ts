import type { World } from '@/features/island';

export interface DayLite {
  day: number;
  date: string;
  title: string;
  lore: string;
  sprite: readonly string[];
}

/** The light version of a world's days for the timelapse caption (server and client). */
export function daysLite(world: Pick<World, 'days' | 'elements'>): DayLite[] {
  const sprites = new Map(world.elements.map((e) => [e.id, e.sprite]));
  return world.days.map(({ day, date, title, lore, element }) => ({
    day,
    date,
    title,
    lore,
    sprite: sprites.get(element) ?? [],
  }));
}
