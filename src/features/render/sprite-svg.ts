import type { PaletteChar } from '@/features/island';
import { PixelCanvas } from './canvas';
import { GLYPH_HEIGHT, textWidth } from './font';
import { spritePixels } from './paint';
import { DAYLIGHT, MOONLIT, NIGHT } from './palette';
import { canvasPaths, textPath } from './svg';

/**
 * A sprite on its own, large: for the routine to look at its drawing before a wish comes true
 * (`npm run day -- sprite-preview`), and for the wish gallery. Left: the sprite at 16× on a
 * checkerboard with numbered rows and columns; right: how it will look on the island at night.
 */

export interface SpriteSvgOptions {
  /** Include the "on the island" preview on the right. Default true. */
  context?: boolean;
  /** Pixel size of the large view. Default 24. */
  cell?: number;
}

export function renderSpriteSvg(sprite: readonly string[], options: SpriteSvgOptions = {}): string {
  const cell = options.cell ?? 24;
  const size = 16;
  const margin = 36;
  const big = size * cell;
  const context = options.context ?? true;
  const small = 6;
  const tile = size * small;
  const panel = context ? tile * 3 : 0;
  const width = margin + big + (context ? margin + panel : 0) + 20;
  const height = margin + big + 20;
  const parts: string[] = [];
  parts.push(`<rect width="${width}" height="${height}" fill="${NIGHT.bg}"/>`);

  // checkerboard + sprite in true colours
  const board: string[] = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if ((x + y) % 2 === 0) board.push(`M${margin + x * cell} ${margin + y * cell}h${cell}v${cell}h-${cell}z`);
  parts.push(`<rect x="${margin}" y="${margin}" width="${big}" height="${big}" fill="#1c1840"/>`);
  parts.push(`<path fill="#242050" d="${board.join('')}"/>`);
  const byColor = new Map<string, string[]>();
  for (const [x, y, color] of spritePixels(sprite, DAYLIGHT as Record<PaletteChar, string>)) {
    const list = byColor.get(color) ?? [];
    list.push(`M${margin + x * cell} ${margin + y * cell}h${cell}v${cell}h-${cell}z`);
    byColor.set(color, list);
  }
  for (const [color, list] of [...byColor.entries()].sort(([a], [b]) => a.localeCompare(b)))
    parts.push(`<path fill="${color}" d="${list.join('')}"/>`);

  // grid lines, every fourth one stronger, numbered rows and columns
  const lines: string[] = [];
  const strong: string[] = [];
  for (let i = 0; i <= size; i++) {
    const p = i * cell;
    (i % 4 === 0 ? strong : lines).push(`M${margin + p} ${margin}v${big}M${margin} ${margin + p}h${big}`);
  }
  parts.push(`<path d="${lines.join('')}" stroke="#ffffff" stroke-opacity=".12" stroke-width="1" fill="none"/>`);
  parts.push(`<path d="${strong.join('')}" stroke="#ffffff" stroke-opacity=".3" stroke-width="1" fill="none"/>`);
  const label = (text: string, x: number, y: number) =>
    `<path transform="translate(${x} ${y}) scale(2)" fill="${NIGHT.textDim}" d="${textPath(text)}"/>`;
  for (let i = 0; i < size; i++) {
    const n = String(i);
    parts.push(label(n, margin + i * cell + cell / 2 - textWidth(n), margin - GLYPH_HEIGHT * 2 - 8));
    parts.push(label(n, margin - textWidth(n) * 2 - 8, margin + i * cell + cell / 2 - GLYPH_HEIGHT));
  }

  // the sprite at night, on grass and on sand, at island scale
  if (context) {
    const left = margin + big + margin;
    const canvas = new PixelCanvas(48, 64);
    canvas.fill(0, 0, 48, 32, NIGHT.grass1);
    canvas.fill(0, 32, 48, 32, NIGHT.sand1);
    for (let i = 0; i < 40; i++) canvas.put((i * 29) % 48, (i * 17) % 64, i % 2 ? NIGHT.grass2 : NIGHT.sand2);
    for (const [x, y, color] of spritePixels(sprite, MOONLIT)) {
      canvas.put(16 + x, 8 + y, color);
      canvas.put(16 + x, 40 + y, color);
    }
    parts.push(`<g transform="translate(${left} ${margin}) scale(${(panel / 48).toFixed(3)})">${canvasPaths(canvas)}</g>`);
    parts.push(label('ON THE ISLAND AT NIGHT', left, margin - GLYPH_HEIGHT * 2 - 8));
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">`,
    ...parts,
    '</svg>',
    '',
  ].join('\n');
}
