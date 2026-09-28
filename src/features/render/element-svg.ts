import type { PaletteChar } from '@/features/island';
import { spritePixels } from './paint';
import { DAYLIGHT } from './palette';

/**
 * One wish as a small standalone SVG (`world/sprites/<id>.svg`) – for the logbook, the README
 * and anyone who wants to reuse the drawing. True colours, transparent background.
 */
export function renderElementSvg(sprite: readonly string[], title: string): string {
  const byColor = new Map<string, [number, number][]>();
  for (const [x, y, color] of spritePixels(sprite, DAYLIGHT as Record<PaletteChar, string>)) {
    const list = byColor.get(color) ?? [];
    list.push([x, y]);
    byColor.set(color, list);
  }
  const paths = [...byColor.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([color, pixels]) => {
      const runs: [number, number, number][] = [];
      for (const [x, y] of pixels) {
        const last = runs[runs.length - 1];
        if (last && last[1] === y && last[0] + last[2] === x) last[2]++;
        else runs.push([x, y, 1]);
      }
      return `<path fill="${color}" d="${runs.map(([x, y, w]) => `M${x} ${y}h${w}v1h-${w}z`).join('')}"/>`;
    });
  const safe = title.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] ?? c);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="64" height="64" shape-rendering="crispEdges" role="img" aria-label="${safe}">`,
    ...paths,
    '</svg>',
    '',
  ].join('\n');
}
