import { z } from 'zod';
import { isIsoDate } from './calendar';
import { PALETTE_CHARS, SPRITE_SIZE, TRANSPARENT } from './palette';

/**
 * The island model. `world/world.json` is the single source of truth: terrain as ASCII rows,
 * every granted wish with its hand-drawn sprite, and one log line per day.
 */

export const WIDTH = 64;
export const HEIGHT = 64;

export const TERRAIN_CHARS = { water: '~', sand: '.', grass: ',' } as const;
export type Terrain = keyof typeof TERRAIN_CHARS;
export const TERRAINS = Object.keys(TERRAIN_CHARS) as Terrain[];

export const KINDS = ['building', 'plant', 'creature', 'object', 'light', 'water'] as const;
export type Kind = (typeof KINDS)[number];

export const ACTIONS = ['genesis', 'wish', 'bottle'] as const;
export type Action = (typeof ACTIONS)[number];

/** GitHub login: letters, digits and single hyphens, at most 39 characters. */
export const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

const isoDate = z.string().refine(isIsoDate, 'expected a date as YYYY-MM-DD');
const coord = (max: number) => z.number().int().min(0).max(max - 1);
const spriteRow = z.string().regex(new RegExp(`^[${TRANSPARENT}${PALETTE_CHARS.join('')}]{${SPRITE_SIZE}}$`));

export const ElementSchema = z
  .object({
    id: z.string().regex(/^w\d+$/),
    day: z.number().int().min(0),
    kind: z.enum(KINDS),
    name: z.string().min(3).max(40),
    x: coord(WIDTH),
    y: coord(HEIGHT),
    issue: z.number().int().min(1).optional(),
    wisher: z.string().regex(LOGIN).optional(),
    votes: z.number().int().min(0).max(100_000).optional(),
    sprite: z.array(spriteRow).length(SPRITE_SIZE),
  })
  .strict();

export const StarSchema = z
  .object({
    issue: z.number().int().min(1),
    votes: z.number().int().min(0).max(100_000),
  })
  .strict();

export const DayEntrySchema = z
  .object({
    day: z.number().int().min(0),
    date: isoDate,
    action: z.enum(ACTIONS),
    element: z.string().regex(/^w\d+$/),
    title: z.string().min(3).max(80),
    lore: z.string().min(3).max(200),
    source: z.enum(['genesis', 'claude', 'director']),
    issue: z.number().int().min(1).optional(),
    wisher: z.string().regex(LOGIN).optional(),
    votes: z.number().int().min(0).max(100_000).optional(),
    land: z.array(z.tuple([coord(WIDTH), coord(HEIGHT)])).min(1).max(4).optional(),
    stars: z.array(StarSchema).max(60).optional(),
  })
  .strict();

export const WorldSchema = z
  .object({
    version: z.literal(1),
    name: z.string().min(1),
    genesis: isoDate,
    width: z.literal(WIDTH),
    height: z.literal(HEIGHT),
    terrain: z.array(z.string().regex(/^[~.,]+$/).length(WIDTH)).length(HEIGHT),
    elements: z.array(ElementSchema).min(1),
    days: z.array(DayEntrySchema).min(1),
  })
  .strict();

export type Element = z.infer<typeof ElementSchema>;
export type Star = z.infer<typeof StarSchema>;
export type DayEntry = z.infer<typeof DayEntrySchema>;
export type World = z.infer<typeof WorldSchema>;

export function parseWorld(input: unknown): World {
  return WorldSchema.parse(input);
}

export function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}
