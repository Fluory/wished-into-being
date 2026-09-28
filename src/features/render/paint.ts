import { GLOWING, IslandMap, SPRITE_SIZE, type Element, type PaletteChar, type World } from '@/features/island';
import { PixelCanvas } from './canvas';
import { MOONLIT, NIGHT } from './palette';
import { paintSky, type PlacedStar } from './sky';
import { paintTerrain, TILE, type Frame } from './terrain';

export { TILE, type Frame };

/** Standard frame sizes in tiles; the smallest that fits the island (plus open sea) is used. */
export const FRAME_SIZES = [12, 16, 20, 24, 32, 40, 48, 64] as const;

export const OVERLAYS = ['waveA', 'waveB', 'glow', 'twinkleA', 'twinkleB', 'mark'] as const;
export type Overlay = (typeof OVERLAYS)[number];

export interface PaintedIsland {
  frame: Frame;
  width: number;
  /** Total height: the sky band plus the island. */
  height: number;
  /** Height of the sky band on top (0 without a sky). */
  sky: number;
  base: PixelCanvas;
  overlays: Record<Overlay, PixelCanvas>;
  stars: PlacedStar[];
  /** Pixel box of every element that is in the frame (for hover and labels). */
  boxes: { element: Element; x: number; y: number }[];
}

export interface PaintOptions {
  frame?: Frame;
  /** Draw the sky band with the moon and the wish stars. Default true. */
  sky?: boolean;
  /** Element to mark as "new today"; defaults to the latest day's element, `null` for none. */
  highlight?: string | null;
}

/** Smallest standard frame that shows the whole island with a margin of open sea. */
export function chooseFrame(world: Pick<World, 'terrain' | 'elements' | 'width' | 'height'>): Frame {
  const map = IslandMap.fromRows(world.terrain);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (let y = 0; y < world.height; y++) for (let x = 0; x < world.width; x++) if (map.isLand(x, y)) include(x, y);
  for (const e of world.elements) include(e.x, e.y);
  if (!Number.isFinite(minX)) return { x: 0, y: 0, size: world.width };
  const span = Math.max(maxX - minX, maxY - minY) + 1 + 2 * 3;
  const size = FRAME_SIZES.find((s) => s >= span && s <= world.width) ?? world.width;
  const clamp = (v: number) => Math.max(0, Math.min(world.width - size, v));
  const x = clamp(Math.round((minX + maxX + 1) / 2 - size / 2));
  const y = clamp(Math.round((minY + maxY + 1) / 2 - size / 2));
  return { x, y, size };
}

/** Pixels of a sprite in the given colours: [x, y, colour, glowing]. */
export function spritePixels(
  sprite: readonly string[],
  colors: Record<PaletteChar, string> = MOONLIT,
): [number, number, string, boolean][] {
  const out: [number, number, string, boolean][] = [];
  sprite.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x] as PaletteChar;
      const color = colors[ch];
      if (color) out.push([x, y, color, GLOWING.includes(ch)]);
    }
  });
  return out;
}

function halo(target: PixelCanvas, cx: number, cy: number, radius: number): void {
  const rings: [number, string][] = [
    [radius * 0.36, NIGHT.halo0],
    [radius * 0.68, NIGHT.halo1],
    [radius, NIGHT.halo2],
  ];
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const ring = rings.find(([r]) => d <= r);
      if (ring && !target.get(x, y)) target.put(x, y, ring[1]);
    }
  }
}

export function paintIsland(world: World, options: PaintOptions = {}): PaintedIsland {
  const frame = options.frame ?? chooseFrame(world);
  const width = frame.size * TILE;
  const sky = options.sky === false ? 0 : Math.max(48, Math.round(width * 0.28));
  const height = sky + width;
  const base = new PixelCanvas(width, height);
  const overlays = Object.fromEntries(OVERLAYS.map((o) => [o, new PixelCanvas(width, height)])) as Record<
    Overlay,
    PixelCanvas
  >;
  const latest = world.days[world.days.length - 1];

  // the island, painted into its own canvases and copied below the sky
  const island = { base: new PixelCanvas(width, width), waveA: new PixelCanvas(width, width), waveB: new PixelCanvas(width, width) };
  const map = IslandMap.fromRows(world.terrain);
  paintTerrain(map, frame, island);
  const copy = (from: PixelCanvas, to: PixelCanvas) => {
    for (let y = 0; y < width; y++)
      for (let x = 0; x < width; x++) {
        const c = from.get(x, y);
        if (c) to.put(x, sky + y, c);
      }
  };
  copy(island.base, base);
  copy(island.waveA, overlays.waveA);
  copy(island.waveB, overlays.waveB);

  const stars =
    sky > 0 ? paintSky({ base, twinkleA: overlays.twinkleA, twinkleB: overlays.twinkleB }, sky, latest?.date ?? world.genesis, latest?.stars ?? []) : [];

  // the wishes, back to front
  const inFrame = (e: Element) => e.x >= frame.x && e.y >= frame.y && e.x < frame.x + frame.size && e.y < frame.y + frame.size;
  const drawables = world.elements.filter(inFrame).sort((a, b) => a.y - b.y || a.x - b.x);
  const boxes: PaintedIsland['boxes'] = [];
  for (const e of drawables) {
    const left = (e.x - frame.x) * TILE;
    const top = sky + (e.y - frame.y) * TILE;
    const pixels = spritePixels(e.sprite);
    boxes.push({ element: e, x: left, y: top });
    if (pixels.length === 0) continue;
    // a soft shadow (land) or a ring of ripples (water) under the lowest row
    const bottom = Math.max(...pixels.map(([, y]) => y));
    const xs = pixels.filter(([, y]) => y >= bottom - 1).map(([x]) => x);
    const from = Math.min(...xs) - 1;
    const to = Math.max(...xs) + 1;
    const water = e.kind === 'water';
    for (let x = from; x <= to; x++) {
      const yy = Math.min(SPRITE_SIZE - 1, bottom + 1);
      if (water) {
        if ((x + e.x) % 3 !== 0) base.put(left + x, top + yy, NIGHT.foam);
      } else {
        const under = base.get(left + x, top + yy);
        if (under) base.put(left + x, top + yy, mixShadow(under));
      }
    }
    for (const [x, y, color] of pixels) base.put(left + x, top + y, color);
    // glow: lights get a big halo, windows and flames a small one
    const glowing = pixels.filter(([, , , g]) => g);
    if (glowing.length > 0) {
      const cx = left + glowing.reduce((s, [x]) => s + x, 0) / glowing.length;
      const cy = top + glowing.reduce((s, [, y]) => s + y, 0) / glowing.length;
      halo(overlays.glow, cx, cy, e.kind === 'light' ? 22 : glowing.length >= 6 ? 10 : 6);
    }
  }

  // today's wish: blinking gold corners
  const markId = options.highlight === undefined ? latest?.element : options.highlight;
  const marked = markId ? boxes.find((b) => b.element.id === markId) : undefined;
  if (marked && latest && latest.day > 0) {
    const { x, y } = marked;
    const s = TILE + 1;
    for (const [cx, cy, dx, dy] of [
      [x - 1, y - 1, 1, 1],
      [x + s - 1, y - 1, -1, 1],
      [x - 1, y + s - 1, 1, -1],
      [x + s - 1, y + s - 1, -1, -1],
    ] as const) {
      for (let i = 0; i < 4; i++) {
        overlays.mark.put(cx + dx * i, cy, NIGHT.gold);
        overlays.mark.put(cx, cy + dy * i, NIGHT.gold);
      }
    }
  }
  return { frame, width, height, sky, base, overlays, stars, boxes };
}

const SHADOWS = new Map<string, string>();
/** The colour under a sprite's feet, darkened (cached per colour). */
function mixShadow(color: string): string {
  let out = SHADOWS.get(color);
  if (!out) {
    const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    out = `#${rgb.map((v) => Math.round(v * 0.55).toString(16).padStart(2, '0')).join('')}`;
    SHADOWS.set(color, out);
  }
  return out;
}
