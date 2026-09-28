import { BOTTLE_SPRITES } from '@/features/island';
import { NIGHT, rasterText, spritePixels } from '@/features/render';

/**
 * README banner and social preview: the title in the island's pixel font next to a strip of
 * island where wishes come true one after another under twinkling wish-stars (CSS keyframes, so it
 * moves inside GitHub's image renderer). Pure SVG – no fonts, no images.
 */

function textPath(text: string): string {
  const parts: string[] = [];
  rasterText(text, (x, y) => parts.push(`M${x} ${y}h1v1h-1z`));
  return parts.join('');
}

function spriteGroup(rows: readonly string[], x: number, y: number, px: number): string {
  const byColor = new Map<string, string[]>();
  for (const [cx, cy, color] of spritePixels(rows)) {
    const list = byColor.get(color) ?? [];
    list.push(`M${cx} ${cy}h1v1h-1z`);
    byColor.set(color, list);
  }
  const paths = [...byColor.entries()].map(([c, d]) => `<path fill="${c}" d="${d.join('')}"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${px})" shape-rendering="crispEdges">${paths}</g>`;
}

const PARADE = ['lantern', 'cottage', 'pine', 'cat', 'owl', 'crystal'] as const;

/** Moonlit wave glints on the sea band, in two alternating frames. */
function waves(width: number, top: number, bottom: number, animated: boolean): string {
  const a: string[] = [];
  const b: string[] = [];
  for (let i = 0; i < 26; i++) {
    const x = (i * 211) % width;
    const y = top + ((i * 37) % Math.max(8, bottom - top - 8));
    a.push(`M${x} ${y}h14v3h-14z`);
    b.push(`M${x + 6} ${y}h14v3h-14z`);
  }
  const frame = (d: string[], cls: string) =>
    `<path class="${animated ? cls : ''}" fill="${NIGHT.sea3}" d="${d.join('')}"/>`;
  return animated ? frame(a, 'wa') + frame(b, 'wb') : frame(a, '');
}

export function bannerSvg(options: { width?: number; height?: number; animated?: boolean } = {}): string {
  const width = options.width ?? 1280;
  const height = options.height ?? 400;
  const animated = options.animated ?? true;
  const big = height >= 600;
  const px = big ? 6 : 5;
  const ground = Math.round(height * (big ? 0.8 : 0.78));
  const loop = 14;

  // star dust and a few wish-stars
  const dust: string[] = [];
  for (let i = 0; i < 140; i++) {
    const x = (i * 197) % width;
    const y = (i * 89) % Math.round(height * 0.7);
    dust.push(`M${x} ${y}h${i % 5 === 0 ? 3 : 2}v${i % 5 === 0 ? 3 : 2}h-${i % 5 === 0 ? 3 : 2}z`);
  }
  const wishStars = [
    { x: width * 0.56, y: height * 0.16, s: 5 },
    { x: width * 0.68, y: height * 0.3, s: 3 },
    { x: width * 0.9, y: height * 0.12, s: 4 },
    { x: width * 0.78, y: height * 0.2, s: 2 },
  ]
    .map(
      (s, i) =>
        `<g class="${animated ? `tw tw${i % 2}` : ''}" transform="translate(${s.x.toFixed(0)} ${s.y.toFixed(0)})"><path fill="${NIGHT.star}" d="M${-s.s} -1h${2 * s.s}v2h-${2 * s.s}zM-1 ${-s.s}h2v${2 * s.s}h-2z"/><rect x="-2" y="-2" width="4" height="4" fill="#fff8e0"/></g>`,
    )
    .join('');

  // the strip of island
  const stripX = Math.round(width * (big ? 0.5 : 0.52));
  const stripW = width - stripX - 40;
  const tile = 16 * px;
  const strip = [
    `<rect x="${stripX - 24}" y="${ground}" width="${stripW + 48}" height="${Math.round(px * 3)}" fill="${NIGHT.sand1}"/>`,
    `<rect x="${stripX}" y="${ground - px * 2}" width="${stripW}" height="${px * 2 + 1}" fill="${NIGHT.grass2}"/>`,
    `<rect x="${stripX - 24}" y="${ground + px * 3}" width="${stripW + 48}" height="${px}" fill="${NIGHT.foam}" opacity=".7"/>`,
  ].join('');
  const gap = Math.max(0, (stripW - PARADE.length * tile) / (PARADE.length - 1));
  const keyframes: string[] = [];
  const sprites = PARADE.map((key, i) => {
    const x = Math.round(stripX + i * (tile + gap));
    const y = ground - tile - px;
    const start = 6 + i * 11;
    keyframes.push(
      `@keyframes p${i}{0%,${start}%{transform:translateY(${px * 6}px);opacity:0}${start + 4}%{transform:translateY(-${px}px);opacity:1}${start + 7}%,90%{transform:translateY(0);opacity:1}97%,100%{transform:translateY(0);opacity:0}}`,
    );
    const glow = key === 'lantern' || key === 'crystal' || key === 'cottage';
    const halo = glow
      ? `<circle cx="${x + tile / 2}" cy="${y + tile * 0.4}" r="${tile * 0.7}" fill="url(#halo)"/>`
      : '';
    const style = animated ? ` style="animation:p${i} ${loop}s cubic-bezier(.22,1,.36,1) infinite"` : '';
    return `<g${style}>${halo}${spriteGroup(BOTTLE_SPRITES[key] ?? [], x, y, px)}</g>`;
  }).join('');

  const title = big ? 10 : 8;
  const left = big ? 72 : 64;
  const top = Math.round(height * (big ? 0.2 : 0.14));
  const line2 = top + 8 * title + (big ? 16 : 12);
  const sub = line2 + 8 * title + (big ? 40 : 28);
  const style = [
    ...keyframes,
    '.tw{animation:tw 2.6s steps(1) infinite}.tw1{animation-delay:-1.3s}',
    '.wa{animation:tw 1.8s steps(1) infinite}.wb{animation:wb 1.8s steps(1) infinite}',
    '@keyframes wb{0%{opacity:.35}50%{opacity:1}}',
    '@keyframes tw{0%{opacity:1}50%{opacity:.35}}',
    '.shoot{animation:shoot 7s ease-in infinite}',
    `@keyframes shoot{0%,78%{transform:translate(0,0);opacity:0}80%{opacity:1}92%{transform:translate(-${Math.round(width * 0.35)}px,${Math.round(height * 0.3)}px);opacity:0}100%{opacity:0}}`,
    '.cursor{animation:tw 1.1s steps(1) infinite}',
    '@media (prefers-reduced-motion:reduce){*{animation:none!important}}',
  ].join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Wished into Being – an island where everything was wished for by someone">`,
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${NIGHT.sky0}"/><stop offset=".6" stop-color="${NIGHT.sky2}"/><stop offset="1" stop-color="${NIGHT.horizon}"/></linearGradient>`,
    `<radialGradient id="halo"><stop offset="0" stop-color="#ffd45e" stop-opacity=".45"/><stop offset="1" stop-color="#ffd45e" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="moonglow"><stop offset="0" stop-color="#f6eecf" stop-opacity=".25"/><stop offset="1" stop-color="#f6eecf" stop-opacity="0"/></radialGradient></defs>`,
    animated ? `<style>${style}</style>` : '',
    `<rect width="${width}" height="${height}" fill="url(#sky)"/>`,
    `<path fill="${NIGHT.starDim}" opacity=".7" d="${dust.join('')}"/>`,
    `<circle cx="${width - 120}" cy="${Math.round(height * 0.2)}" r="${big ? 110 : 80}" fill="url(#moonglow)"/>`,
    `<circle cx="${width - 120}" cy="${Math.round(height * 0.2)}" r="${big ? 34 : 26}" fill="${NIGHT.moon}"/>`,
    `<circle cx="${width - 108}" cy="${Math.round(height * 0.2) - 6}" r="${big ? 32 : 24}" fill="${NIGHT.sky1}"/>`,
    wishStars,
    animated
      ? `<g class="shoot"><rect x="${Math.round(width * 0.8)}" y="${Math.round(height * 0.06)}" width="46" height="3" fill="#fff3c4" transform="rotate(-40 ${Math.round(width * 0.8)} ${Math.round(height * 0.06)})"/></g>`
      : '',
    `<rect y="${ground + px * 4}" width="${width}" height="${height - ground}" fill="${NIGHT.sea1}"/>`,
    waves(width, ground + px * 5, height, animated),
    strip,
    sprites,
    `<path transform="translate(${left} ${top}) scale(${title})" fill="${NIGHT.gold}" d="${textPath('WISHED')}"/>`,
    `<path transform="translate(${left} ${line2}) scale(${title})" fill="${NIGHT.text}" d="${textPath('INTO BEING')}"/>`,
    animated
      ? `<rect class="cursor" x="${left + 60 * title}" y="${line2}" width="${5 * title}" height="${7 * title}" fill="${NIGHT.gold}" opacity=".85"/>`
      : '',
    `<path transform="translate(${left + 2} ${sub}) scale(3)" fill="${NIGHT.textDim}" d="${textPath('AN ISLAND WHERE EVERYTHING')}"/>`,
    `<path transform="translate(${left + 2} ${sub + 30}) scale(3)" fill="${NIGHT.textDim}" d="${textPath('WAS WISHED FOR BY SOMEONE')}"/>`,
    `<path transform="translate(${left + 2} ${sub + 68}) scale(2)" fill="${NIGHT.gold}" opacity=".8" d="${textPath('OPEN A WISH · GATHER VOTES · ONE COMES TRUE EVERY DAY')}"/>`,
    '</svg>',
    '',
  ].join('\n');
}
