import { seasonOf, type Season } from './calendar';
import { coastCount, landCount, stateOf } from './rules';
import { KINDS, type DayEntry, type Kind, type World } from './schema';

export interface IslandStats {
  day: number;
  date: string;
  season: Season;
  latest: DayEntry;
  land: number;
  coast: number;
  wishes: number;
  bottles: number;
  wishers: number;
  votes: number;
  byKind: Record<Kind, number>;
  /** Open wishes as recorded by the routine on the latest day. */
  open: number;
}

export function islandStats(world: World): IslandStats {
  const state = stateOf(world);
  const latest = world.days[world.days.length - 1] as DayEntry;
  const byKind = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<Kind, number>;
  for (const e of world.elements) byKind[e.kind]++;
  const granted = world.elements.filter((e) => e.issue);
  return {
    day: latest.day,
    date: latest.date,
    season: seasonOf(latest.date),
    latest,
    land: landCount(state.map),
    coast: coastCount(state.map),
    wishes: granted.length,
    bottles: world.days.filter((d) => d.action === 'bottle').length,
    wishers: new Set(granted.map((e) => e.wisher)).size,
    votes: granted.reduce((sum, e) => sum + (e.votes ?? 0), 0),
    byKind,
    open: latest.stars?.length ?? 0,
  };
}
