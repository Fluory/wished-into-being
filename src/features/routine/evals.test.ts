import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createGenesis } from '@/features/island';
import { rankWishes } from './wishes';

/**
 * The code half of the eval set in evals/wishes.json: whatever a wish tries, the checks in code
 * must hold. The judgement half (which reason to decline with) is reviewed with ROUTINE.md.
 */

interface EvalCase {
  id: string;
  wish: Record<string, unknown>;
  code: {
    verdict: string;
    reasonHas?: string;
    descriptionHas?: string;
    descriptionIs?: string;
    suspicious?: boolean;
    spriteProblem?: boolean;
    votes?: number;
  };
  routine: string;
}

const file = join(process.cwd(), 'evals', 'wishes.json');
const { cases } = JSON.parse(readFileSync(file, 'utf8')) as { cases: EvalCase[] };
const genesis = createGenesis('2026-09-28');

describe('eval set: wishes that try to break the routine', () => {
  it.each(cases.map((c, i) => [c.id, c, i] as const))('%s', (_id, c, i) => {
    const wish = {
      issue: 100 + i,
      author: 'wisher',
      createdAt: '2026-09-28T09:00:00Z',
      votes: 1,
      ...c.wish,
    };
    const report = rankWishes(genesis, '2026-09-29', { repo: 'Fluory/wished-into-being', wishes: [wish] });
    const checked = report.wishes[0];
    expect(checked?.verdict).toBe(c.code.verdict);
    if (c.code.reasonHas) expect(checked?.reason).toContain(c.code.reasonHas);
    if (c.code.descriptionHas) expect(checked?.description).toContain(c.code.descriptionHas);
    if (c.code.descriptionIs) expect(checked?.description).toBe(c.code.descriptionIs);
    if (c.code.suspicious) expect(checked?.suspicious).toBe(true);
    if (c.code.spriteProblem) expect(checked?.spriteProblem).toBeTruthy();
    if (c.code.votes !== undefined) expect(checked?.votes).toBe(c.code.votes);
    // nothing a wish says ever reaches the logbook as markup, links or mentions
    expect(checked?.description ?? '').not.toMatch(/https?:\/\/|<|>|`|@\w/);
    expect(c.routine.length).toBeGreaterThan(5);
  });
});
