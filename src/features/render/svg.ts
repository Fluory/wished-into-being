import { formatDate, islandStats, type World } from '@/features/island';
import type { PixelCanvas } from './canvas';
import { GLYPH_HEIGHT, rasterText, textWidth, wrapText } from './font';
import { paintIsland, type Overlay, type PaintOptions } from './paint';
import { NIGHT } from './palette';
import { pngDataUri } from './png';
import { moonName, moonPhase } from './sky';

/**
 * The README image: tonight's island as animated pixel art – the sky with a star for every
 * waiting wish, the island with every wish that came true, and a caption. The still layers
 * (ground, sprites, glow) are embedded as indexed PNG, the moving ones (waves, twinkling stars,
 * today's mark) are vector paths. Deterministic: the same world always yields the same bytes.
 */

const WIDTH = 1024;
const PAD = 40;

export const escapeXml = (text: string) =>
  text.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c] ?? c);

function runsToPath(runs: [number, number, number][]): string {
  return runs.map(([x, y, w]) => `M${x} ${y}h${w}v1h-${w}z`).join('');
}

function colorAttrs(color: string): string {
  if (color.length === 9) {
    const alpha = parseInt(color.slice(7, 9), 16) / 255;
    return `fill="${color.slice(0, 7)}" fill-opacity="${alpha.toFixed(3)}"`;
  }
  return `fill="${color}"`;
}

export function canvasPaths(canvas: PixelCanvas): string {
  const runs = [...canvas.runs().entries()].sort(([a], [b]) => a.localeCompare(b));
  return runs.map(([color, list]) => `<path ${colorAttrs(color)} d="${runsToPath(list)}"/>`).join('');
}

export function textPath(text: string): string {
  const pixels: [number, number][] = [];
  rasterText(text, (x, y) => pixels.push([x, y]));
  pixels.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const runs: [number, number, number][] = [];
  for (const [x, y] of pixels) {
    const last = runs[runs.length - 1];
    if (last && last[1] === y && last[0] + last[2] === x) last[2]++;
    else runs.push([x, y, 1]);
  }
  return runsToPath(runs);
}

const OVERLAY_CLASS: Record<Overlay, string> = {
  waveA: 'fa',
  waveB: 'fb',
  glow: 'glow',
  twinkleA: 'ta',
  twinkleB: 'tb',
  mark: 'mark',
};

const STYLE = [
  '.fa{animation:fa 2s steps(1) infinite}',
  '.fb{animation:fb 2s steps(1) infinite}',
  '.ta{animation:fa 3.1s steps(1) infinite}',
  '.tb{animation:fb 2.3s steps(1) infinite}',
  '.glow{animation:glow 3.4s ease-in-out infinite}',
  '.mark{animation:mark 1.2s steps(1) infinite}',
  '@keyframes fa{0%{opacity:1}50%{opacity:0}}',
  '@keyframes fb{0%{opacity:0}50%{opacity:1}}',
  '@keyframes glow{0%,100%{opacity:1}50%{opacity:.55}}',
  '@keyframes mark{0%{opacity:1}50%{opacity:.2}}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
].join('');

export interface SvgOptions extends PaintOptions {
  /** Animate waves, glows, stars and the mark. Default true. */
  animated?: boolean;
  /** Caption below the picture. Default true. */
  caption?: boolean;
}

/** The small print under the title: who wished it, or where it came from. */
export function creditLine(world: World): string {
  const latest = world.days[world.days.length - 1];
  if (!latest || latest.action === 'genesis') return 'THE WELL IS WAITING FOR THE FIRST WISH';
  if (latest.action === 'bottle') return 'A MESSAGE IN A BOTTLE FROM THE ISLANDERS';
  return `WISHED BY @${latest.wisher ?? '?'} · #${latest.issue ?? '?'} · ${latest.votes ?? 0} VOTES`;
}

export function renderIsleSvg(world: World, options: SvgOptions = {}): string {
  const painted = paintIsland(world, options);
  const animated = options.animated ?? true;
  const scale = WIDTH / painted.width;
  const top = painted.height * scale;
  const stats = islandStats(world);
  const latest = stats.latest;

  // labels for the three brightest wish stars
  const labels = painted.stars
    .filter((s) => s.rank < 3)
    .map((s) => {
      const label = `#${s.issue}`;
      const size = 2;
      const lx = Math.min(WIDTH - PAD / 2 - textWidth(label) * size, Math.max(PAD / 2, s.x * scale - (textWidth(label) * size) / 2));
      const ly = s.y * scale + (s.size + 2) * scale + 6;
      return `<path transform="translate(${lx.toFixed(1)} ${ly.toFixed(1)}) scale(${size})" fill="${NIGHT.gold}" fill-opacity=".85" d="${textPath(label)}"/>`;
    })
    .join('');

  let captionHeight = 0;
  let caption = '';
  if (options.caption ?? true) {
    const small = 3;
    const big = 4;
    const phase = moonName(moonPhase(latest.date)).toUpperCase();
    const line1 = `DAY ${latest.day} · ${formatDate(latest.date)} · ${phase}`;
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
    const right = `${plural(stats.wishes, 'WISH', 'WISHES')} · ${plural(stats.open, 'STAR', 'STARS')}`;
    const fits = textWidth(line1) * small + textWidth(right) * small + 40 <= WIDTH - PAD * 2;
    const titleLines = wrapText(latest.title, Math.floor((WIDTH - PAD * 2) / big), 2);
    const credit = creditLine(world);
    const line1Y = 34;
    const titleY = line1Y + GLYPH_HEIGHT * small + 22;
    const creditY = titleY + titleLines.length * (GLYPH_HEIGHT * big + 14) + 6;
    captionHeight = creditY + GLYPH_HEIGHT * small + 32;
    caption = [
      `<rect x="0" y="${top}" width="${WIDTH}" height="${captionHeight}" fill="${NIGHT.bg}"/>`,
      `<rect x="0" y="${top}" width="${WIDTH}" height="4" fill="${NIGHT.gold}" fill-opacity=".8"/>`,
      `<path transform="translate(${PAD} ${top + line1Y}) scale(${small})" fill="${NIGHT.textDim}" d="${textPath(line1)}"/>`,
      fits
        ? `<path transform="translate(${WIDTH - PAD - textWidth(right) * small} ${top + line1Y}) scale(${small})" fill="${NIGHT.textDim}" d="${textPath(right)}"/>`
        : '',
      ...titleLines.map(
        (line, i) =>
          `<path transform="translate(${PAD} ${top + titleY + i * (GLYPH_HEIGHT * big + 14)}) scale(${big})" fill="${NIGHT.text}" d="${textPath(line)}"/>`,
      ),
      `<path transform="translate(${PAD} ${top + creditY}) scale(${small})" fill="${NIGHT.gold}" d="${textPath(credit)}"/>`,
    ].join('');
  }

  const height = Math.round(top + captionHeight);
  const raster = (canvas: PixelCanvas, cls?: string) =>
    `<image${cls ? ` class="${cls}"` : ''} width="${canvas.width}" height="${canvas.height}" image-rendering="optimizeSpeed" style="image-rendering:pixelated" href="${pngDataUri(canvas)}"/>`;
  const overlays = (Object.keys(painted.overlays) as Overlay[])
    .filter((name) => !painted.overlays[name].isEmpty())
    .filter((name) => animated || !['waveB', 'twinkleB'].includes(name))
    .map((name) => {
      const cls = animated ? OVERLAY_CLASS[name] : undefined;
      if (name === 'glow') return raster(painted.overlays[name], cls);
      return `<g${cls ? ` class="${cls}"` : ''}>${canvasPaths(painted.overlays[name])}</g>`;
    })
    .join('');

  const title = `${world.name} – Day ${latest.day}: ${latest.title}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" width="${WIDTH}" height="${height}" role="img" aria-labelledby="t d" shape-rendering="crispEdges">`,
    `<title id="t">${escapeXml(title)}</title>`,
    `<desc id="d">${escapeXml(latest.lore)}</desc>`,
    animated ? `<style>${STYLE}</style>` : '',
    `<g transform="scale(${scale})">`,
    raster(painted.base),
    overlays,
    '</g>',
    labels,
    caption,
    '</svg>',
    '',
  ].join('\n');
}
