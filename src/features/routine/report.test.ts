import { describe, expect, it } from 'vitest';
import { applyBottle, applyDay, createGenesis } from '@/features/island';
import { wish } from '@/features/island/testing';
import {
  commitMessage,
  commitTitle,
  declinedComment,
  grantedComment,
  plan,
  prBody,
  status,
  waitingComment,
} from './report';

const genesis = createGenesis('2026-09-28');
const granted = applyDay(genesis, wish({ issue: 12, wisher: 'octo-cat', votes: 5 }), '2026-09-29').world;

describe('status and plan', () => {
  it('knows when today is already done', () => {
    expect(status(genesis, '2026-09-28').done).toBe(true);
    expect(status(genesis, '2026-09-29')).toMatchObject({ day: 1, done: false });
  });

  it('shows the dawn, the room per kind and a fallback bottle', () => {
    const sheet = plan(genesis, '2026-09-29');
    expect(sheet).toMatchObject({ day: 1, done: false });
    if (!('kinds' in sheet)) throw new Error('expected a full plan');
    expect(sheet.dawn.raised).toHaveLength(2);
    expect(sheet.kinds.map((k) => k.kind)).toEqual(['building', 'plant', 'creature', 'object', 'light', 'water']);
    expect(sheet.kinds.every((k) => k.room)).toBe(true);
    expect(sheet.recommendation).toMatchObject({ action: 'bottle' });
    expect(sheet.bottles.length).toBeGreaterThan(0);
  });
});

describe('commit and pull request', () => {
  it('titles a wish with its issue and wisher, a bottle as such', () => {
    expect(commitTitle(granted)).toBe('Day 1: A glass lantern (wish #12 by @octo-cat)');
    expect(commitTitle(applyBottle(genesis, '2026-09-29').world)).toMatch(/^Day 1: .+ \(message in a bottle\)$/);
  });

  it('keeps the title within what the merge job accepts', () => {
    const long = applyDay(
      genesis,
      wish({ title: 'A'.repeat(80), wisher: 'a'.repeat(39), issue: 12345 }),
      '2026-09-29',
    ).world;
    const title = commitTitle(long);
    expect(title).toMatch(/^Day [0-9]+: .{3,120}$/);
    expect(title.endsWith(`(wish #12345 by @${'a'.repeat(39)})`)).toBe(true);
  });

  it('credits the wisher as co-author when the user id is known', () => {
    expect(commitMessage(granted, { wisherId: 4242 })).toContain(
      'Co-authored-by: octo-cat <4242+octo-cat@users.noreply.github.com>',
    );
    expect(commitMessage(granted)).not.toContain('Co-authored-by');
    expect(commitMessage(granted)).toContain('Wished by @octo-cat in #12 with 5 votes.');
  });

  it('writes the PR body in the template sections and closes the wish', () => {
    const body = prBody(granted, { imageUrl: 'https://example.org/isle.svg' });
    for (const heading of [
      '## Warum',
      '## Was ist passiert (Klartext)',
      '## Plan-Pflicht',
      '## Nachweis',
      '## Doku-Entscheidung',
    ])
      expect(body).toContain(heading);
    expect(body).toContain('Closes #12');
    expect(prBody(applyBottle(genesis, '2026-09-29').world)).not.toContain('Closes');
  });
});

describe('issue comments', () => {
  it('have a fixed, friendly wording', () => {
    expect(grantedComment(granted, { prUrl: 'https://github.com/x/y/pull/3' })).toMatch(
      /came true on day 1.*A glass lantern/s,
    );
    expect(waitingComment('the island has room for 4 buildings and already has 4')).toContain('does not fit yet');
    expect(declinedComment('brand')).toContain('trademarks');
  });
});
