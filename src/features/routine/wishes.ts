import { z } from 'zod';
import {
  checkLogin,
  checkSprite,
  checkText,
  checkWish,
  dawnOf,
  isKind,
  parseSprite,
  pickTile,
  repeatName,
  tidyName,
  type Kind,
  type Near,
  type World,
} from '@/features/island';
import { REPO } from '@/shared/repo';

/**
 * The open wishes, as copied from the issue forms by the read-only `wish-reader` agent, checked
 * and ranked by code. The model never has to interpret an issue: whatever a wish says, it can
 * only become the *fields* of a wish, and every field is validated here before anything is drawn.
 */

export const RawWishSchema = z
  .object({
    issue: z.number().int().min(1),
    author: z.string().max(100),
    authorId: z.number().int().min(1).optional(),
    createdAt: z.string().max(40),
    votes: z.number().int().min(0).max(100_000),
    kind: z.string().max(40).default(''),
    name: z.string().max(200).default(''),
    near: z.string().max(40).optional(),
    description: z.string().max(5000).default(''),
    sprite: z
      .union([z.array(z.string().max(80)).max(40), z.string().max(2000)])
      .nullable()
      .optional(),
    labels: z.array(z.string().max(60)).max(20).optional(),
    suspicious: z.boolean().optional(),
  })
  .strict();
export type RawWish = z.infer<typeof RawWishSchema>;

export type Verdict = 'fits' | 'wait' | 'no-votes' | 'invalid' | 'granted';

export interface CheckedWish {
  issue: number;
  author: string;
  authorId?: number;
  votes: number;
  createdAt: string;
  kind: Kind | string;
  name: string;
  near: Near;
  description: string;
  sprite: string[] | null;
  spriteProblem?: string;
  verdict: Verdict;
  reason?: string;
  renamed?: boolean;
  suspicious?: boolean;
}

const NEAR_WORDS: [RegExp, Near][] = [
  [/well/i, 'well'],
  [/water|shore|sea|beach/i, 'water'],
  [/quiet|alone|far/i, 'quiet'],
];

function nearOf(value: string | undefined): Near {
  for (const [pattern, near] of NEAR_WORDS) if (value && pattern.test(value)) return near;
  return 'anywhere';
}

/** A description as a drawing brief: one line, no markup, no links, at most 300 characters. */
export function cleanDescription(text: string): string {
  const flat = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+|www\.\S+/gi, '(link)')
    .replace(/@(\w)/g, '$1')
    .replace(/[<>`*_#|\\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > 300 ? `${flat.slice(0, 297).trimEnd()}...` : flat;
}

function spriteOf(raw: RawWish['sprite']): string[] | null {
  if (!raw) return null;
  const rows = parseSprite(Array.isArray(raw) ? raw.join('\n') : raw);
  return rows.length === 0 ? null : rows;
}

export interface WishesReport {
  day: number;
  /** The wish to grant today: the most 👍 that fits (at least one vote), older first on a tie. */
  next: number | null;
  /** Open wishes that shine as stars tonight (everything still open except today's): `--stars`. */
  stars: string;
  wishes: CheckedWish[];
}

/** What the wish-reader returns: its own repository (checked here) and the wishes it copied. */
export const ReaderReportSchema = z.object({
  repo: z.string(),
  wishes: z.array(z.unknown()).max(500),
});

export function rankWishes(world: World, date: string, input: unknown): WishesReport {
  const report = ReaderReportSchema.safeParse(input);
  if (!report.success) throw new Error('the wish-reader must answer with {"repo": …, "wishes": [...]}');
  if (report.data.repo.toLowerCase() !== REPO.toLowerCase())
    throw new Error(`the wish-reader read ${report.data.repo}, not ${REPO} – ask it again`);
  const list = report.data.wishes;
  const { day, state } = dawnOf(world, date);
  const granted = new Set(world.elements.flatMap((e) => (e.issue ? [e.issue] : [])));
  const names = new Set(world.elements.map((e) => e.name.toLowerCase()));

  const wishes: CheckedWish[] = list.map((item) => {
    const parsed = RawWishSchema.safeParse(item);
    if (!parsed.success) {
      const issue = typeof (item as { issue?: unknown })?.issue === 'number' ? (item as { issue: number }).issue : 0;
      return {
        issue,
        author: '',
        votes: 0,
        createdAt: '',
        kind: '',
        name: '',
        near: 'anywhere',
        description: '',
        sprite: null,
        verdict: 'invalid',
        reason: `unreadable wish: ${parsed.error.issues[0]?.message ?? 'bad format'}`,
      };
    }
    const raw = parsed.data;
    const sprite = spriteOf(raw.sprite);
    const base: CheckedWish = {
      issue: raw.issue,
      author: raw.author,
      ...(raw.authorId ? { authorId: raw.authorId } : {}),
      votes: raw.votes,
      createdAt: raw.createdAt,
      kind: raw.kind.trim().toLowerCase(),
      name: tidyName(raw.name),
      near: nearOf(raw.near),
      description: cleanDescription(raw.description),
      sprite,
      ...(sprite && checkSprite(sprite) ? { spriteProblem: checkSprite(sprite) ?? '' } : {}),
      ...(raw.suspicious ? { suspicious: true } : {}),
      verdict: 'fits',
    };
    const invalid = (reason: string): CheckedWish => ({ ...base, verdict: 'invalid', reason });
    if (granted.has(raw.issue)) return { ...base, verdict: 'granted', reason: 'this wish has already come true' };
    if (raw.labels?.includes('wish-declined')) return invalid('the wish was declined before');
    const login = checkLogin(raw.author);
    if (login) return invalid(login);
    if (!isKind(base.kind))
      return invalid(`"${raw.kind}" is not a kind – one of building, plant, creature, object, light, water`);
    const text = checkText('name', base.name);
    if (text) return invalid(text);
    let name = base.name;
    let renamed = false;
    if (names.has(name.toLowerCase())) {
      let n = 2;
      while (names.has(repeatName(name, n).toLowerCase())) n++;
      name = repeatName(name, n);
      renamed = true;
      if (checkText('name', name)) return invalid(`the island already has "${base.name}"`);
    }
    const checked: CheckedWish = { ...base, name, ...(renamed ? { renamed } : {}) };
    // Room and ground, with a stand-in drawing: the real sprite is checked when it is applied.
    const problem = checkWish(state, {
      action: 'wish',
      kind: base.kind as Kind,
      name,
      sprite: sprite && !checkSprite(sprite) ? sprite : STAND_IN,
      issue: raw.issue,
      wisher: raw.author,
      votes: raw.votes,
      lore: 'A wish that is being checked.',
      source: 'claude',
    });
    if (problem) return { ...checked, verdict: problem.wait ? 'wait' : 'invalid', reason: problem.reason };
    if (!pickTile(state, base.kind as Kind, checked.near, date))
      return { ...checked, verdict: 'wait', reason: `there is no free place for this kind today` };
    if (raw.votes < 1) return { ...checked, verdict: 'no-votes', reason: 'a wish needs at least one 👍 to come true' };
    return checked;
  });

  const order = (a: CheckedWish, b: CheckedWish) =>
    b.votes - a.votes || a.createdAt.localeCompare(b.createdAt) || a.issue - b.issue;
  wishes.sort(order);
  const next = wishes.find((w) => w.verdict === 'fits')?.issue ?? null;
  const stars = wishes
    .filter((w) => w.issue !== next && (w.verdict === 'fits' || w.verdict === 'wait' || w.verdict === 'no-votes'))
    .slice(0, 60)
    .map((w) => `${w.issue}:${w.votes}`)
    .join(',');
  return { day, next, stars, wishes };
}

/** A plain stand-in sprite used only to check room and ground before the real drawing exists. */
const STAND_IN = [
  '................',
  '................',
  '................',
  '................',
  '......kkkk......',
  '.....kyyyyk.....',
  '....kyyyyyyk....',
  '....kyyyyyyk....',
  '....kyyyyyyk....',
  '....kyyyyyyk....',
  '.....kyyyyk.....',
  '......kkkk......',
  '................',
  '................',
  '................',
  '................',
];
