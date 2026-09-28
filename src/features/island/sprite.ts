import { PALETTE_CHARS, SPRITE_SIZE, TRANSPARENT } from './palette';

/** Checks for the 16 × 16 sprites Claude draws for every wish. */

export const MIN_PIXELS = 20;

export interface SpriteStats {
  opaque: number;
  colors: number;
}

export function spriteStats(rows: readonly string[]): SpriteStats {
  const used = new Set<string>();
  let opaque = 0;
  for (const row of rows) {
    for (const c of row) {
      if (c === TRANSPARENT) continue;
      opaque++;
      used.add(c);
    }
  }
  return { opaque, colors: used.size };
}

/** A reason why the sprite is not usable, or null. */
export function checkSprite(rows: readonly string[]): string | null {
  if (rows.length !== SPRITE_SIZE) return `a sprite has ${SPRITE_SIZE} rows, this one has ${rows.length}`;
  const allowed = new Set([TRANSPARENT, ...PALETTE_CHARS]);
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y] ?? '';
    if (row.length !== SPRITE_SIZE) return `row ${y + 1} has ${row.length} characters, expected ${SPRITE_SIZE}`;
    for (const c of row) {
      if (!allowed.has(c))
        return `row ${y + 1} uses "${c}" – only "${TRANSPARENT}" and ${PALETTE_CHARS.join('')} are allowed`;
    }
  }
  const stats = spriteStats(rows);
  if (stats.opaque < MIN_PIXELS) return `a sprite needs at least ${MIN_PIXELS} coloured pixels (has ${stats.opaque})`;
  if (stats.colors < 2) return 'a sprite needs at least two colours (an outline and a fill)';
  if (stats.opaque === SPRITE_SIZE * SPRITE_SIZE)
    return 'a sprite may not fill the whole tile – leave some transparent pixels';
  return null;
}

/** Parse a sprite from text: 16 lines of 16 characters (blank lines and spaces ignored). */
export function parseSprite(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ''))
    .filter((line) => line.length > 0);
}
