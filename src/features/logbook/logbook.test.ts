import { describe, expect, it } from 'vitest';
import { applyBottle, applyDay, checkSprite, createGenesis, parseSprite } from '@/features/island';
import { wish } from '@/features/island/testing';
import { renderLogbook } from './logbook';
import { renderRulesDoc } from './rules-doc';

describe('LOGBOOK.md', () => {
  const genesis = createGenesis('2026-09-28');
  const world = applyBottle(applyDay(genesis, wish({ issue: 12, votes: 1 }), '2026-09-29').world, '2026-09-30').world;
  const book = renderLogbook(world);

  it('lists the days newest first with their sprites', () => {
    expect(book.indexOf('Day 2 ·')).toBeLessThan(book.indexOf('Day 1 ·'));
    expect(book).toContain('<img src="world/sprites/w2.svg"');
  });

  it('credits wishers with links, and bottles as bottles', () => {
    expect(book).toContain('wished by [@octo-cat](https://github.com/octo-cat) in [#12](https://github.com/Fluory/wished-into-being/issues/12) · 1 vote');
    expect(book).toContain('a message in a bottle from the islanders · picked by the director');
  });
});

describe('RULES.md', () => {
  it('shows an example sprite that passes the sprite check', () => {
    const doc = renderRulesDoc();
    const example = doc.slice(doc.indexOf('```text') + 7, doc.lastIndexOf('```'));
    expect(checkSprite(parseSprite(example))).toBeNull();
  });
});
