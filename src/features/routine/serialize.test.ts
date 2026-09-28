import { describe, expect, it } from 'vitest';
import { applyDay, createGenesis, parseWorld, simulateBottles } from '@/features/island';
import { wish } from '@/features/island/testing';
import { serializeWorld } from './serialize';

describe('world.json serialisation', () => {
  const world = applyDay(
    simulateBottles(createGenesis('2026-09-28'), 20),
    wish({ stars: [{ issue: 9, votes: 2 }] }),
    '2026-10-19',
  ).world;
  const text = serializeWorld(world);

  it('round-trips without loss', () => {
    expect(parseWorld(JSON.parse(text))).toEqual(world);
  });

  it('puts every terrain row, element and day on its own line', () => {
    const lines = text.split('\n');
    expect(lines.filter((l) => l.startsWith('    {"id":'))).toHaveLength(world.elements.length);
    expect(lines.filter((l) => l.startsWith('    {"day":'))).toHaveLength(world.days.length);
    expect(lines.filter((l) => /^ {4}"[~.,]+",?$/.test(l))).toHaveLength(world.height);
  });

  it('adds one element line and one day line per day, plus the new shore', () => {
    const next = serializeWorld(applyDay(world, wish({ name: 'A second lantern', issue: 8 }), '2026-10-20').world);
    const before = new Set(text.split('\n'));
    const added = next.split('\n').filter((l) => !before.has(l));
    expect(added.filter((l) => l.includes('"id":"w23"'))).toHaveLength(1);
    expect(added.filter((l) => l.startsWith('    {"day":22,'))).toHaveLength(1);
    // the shore: two raised tiles, reshaping at most the rows around them
    const shore = added.filter((l) => /^ {4}"[~.,]+",?$/.test(l)).length;
    expect(shore).toBeGreaterThan(0);
    expect(shore).toBeLessThanOrEqual(6);
    // the new element and day, and the previous last element and day, which gain a comma
    expect(added.length - shore).toBe(4);
  });
});
