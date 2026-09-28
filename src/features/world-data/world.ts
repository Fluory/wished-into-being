import worldJson from '../../../world/world.json';
import {
  createGenesis,
  islandStats,
  parseWorld,
  simulateBottles,
  worldAt,
  type DayEntry,
  type Element,
  type Star,
  type World,
} from '@/features/island';

/**
 * Build-time access to the island. world.json is bundled into the server build, so every
 * deployment (one per daily commit) renders exactly the state of that commit.
 */

let cached: World | undefined;

export function getWorld(): World {
  cached ??= parseWorld(worldJson);
  return cached;
}

export function getStats() {
  return islandStats(getWorld());
}

export function getLatest(): DayEntry {
  const days = getWorld().days;
  return days[days.length - 1] as DayEntry;
}

/** Newest first. */
export function getDaysNewestFirst(): DayEntry[] {
  return [...getWorld().days].reverse();
}

export function getDay(day: number): DayEntry | undefined {
  return getWorld().days.find((d) => d.day === day);
}

export function getElement(id: string): Element | undefined {
  return getWorld().elements.find((e) => e.id === id);
}

/** Every element with the day it came true, newest first. */
export function getWishes(): { element: Element; entry: DayEntry }[] {
  const world = getWorld();
  return world.days
    .map((entry) => ({ entry, element: world.elements.find((e) => e.id === entry.element) as Element }))
    .reverse();
}

/** The wishes still waiting, as recorded by the routine on the latest day, brightest first. */
export function getStars(): Star[] {
  return [...(getLatest().stars ?? [])].sort((a, b) => b.votes - a.votes || a.issue - b.issue);
}

export function getWorldAt(day: number): World {
  return worldAt(getWorld(), day);
}

let simulated: World | undefined;

/**
 * A simulated first year, grown with messages in a bottle from the same genesis. Clearly
 * labelled on the website – it shows what the rules can build, not the real island.
 */
export function getSimulation(days = 365): World {
  simulated ??= simulateBottles(createGenesis(getWorld().genesis), days);
  return simulated;
}
