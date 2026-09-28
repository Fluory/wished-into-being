import {
  createGenesis,
  GLOWING,
  hashString,
  IslandMap,
  SPRITE_PALETTE,
  type PaletteChar,
  type Star,
  type World,
} from '@/features/island';

/**
 * Turns the world into plain data for the 3D island (no three.js here, so it is cheap to rebuild
 * and easy to test). Everything knows the day it appeared – the scene uses that to let the island
 * grow when the displayed day changes.
 */

export const GROUND = { sand: 0.32, grass: 0.5 } as const;

export interface Tile {
  x: number;
  y: number;
  /** Day the sea raised it (0 for the genesis island). */
  rose: number;
  /** Day it turned from beach to grass, if it ever did. */
  grass: number | null;
}

/** Every land tile with the day it rose and the day it turned green, replayed from the log. */
export function tileTimeline(world: World): Tile[] {
  const map = IslandMap.fromRows(createGenesis(world.genesis).terrain);
  const tiles = new Map<number, Tile>();
  const key = (x: number, y: number) => y * world.width + x;
  const note = (day: number) => {
    for (let y = 0; y < world.height; y++)
      for (let x = 0; x < world.width; x++) {
        const t = map.get(x, y);
        if (t === 'water') continue;
        const k = key(x, y);
        let tile = tiles.get(k);
        if (!tile) {
          tile = { x, y, rose: day, grass: null };
          tiles.set(k, tile);
        }
        if (t === 'grass' && tile.grass === null) tile.grass = day;
      }
  };
  note(0);
  for (const entry of world.days) {
    if (!entry.land?.length) continue;
    for (const [x, y] of entry.land) map.set(x, y, 'sand');
    map.reshape();
    note(entry.day);
  }
  return [...tiles.values()];
}

export interface Bounds {
  cx: number;
  cz: number;
  radius: number;
}

/** Centre and radius of the land on `day` (tile centres at x + 0.5). */
export function boundsAt(tiles: readonly Tile[], day: number): Bounds {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const t of tiles) {
    if (t.rose > day) continue;
    minX = Math.min(minX, t.x);
    maxX = Math.max(maxX, t.x);
    minY = Math.min(minY, t.y);
    maxY = Math.max(maxY, t.y);
  }
  if (!Number.isFinite(minX)) return { cx: 32, cz: 32, radius: 3 };
  return {
    cx: (minX + maxX + 1) / 2,
    cz: (minY + maxY + 1) / 2,
    radius: Math.max(3, Math.hypot(maxX - minX + 1, maxY - minY + 1) / 2),
  };
}

/** Distance (in tiles) from every map cell to the nearest land on `day` – drives sea colour and foam. */
export function distanceAt(tiles: readonly Tile[], day: number, width: number, height: number): Float32Array {
  const dist = new Float32Array(width * height).fill(1e6);
  for (const t of tiles) if (t.rose <= day) dist[t.y * width + t.x] = 0;
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? 1e6 : (dist[y * width + x] as number);
  const d1 = 1;
  const d2 = Math.SQRT2;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      dist[i] = Math.min(
        dist[i] as number,
        at(x - 1, y) + d1,
        at(x, y - 1) + d1,
        at(x - 1, y - 1) + d2,
        at(x + 1, y - 1) + d2,
      );
    }
  for (let y = height - 1; y >= 0; y--)
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      dist[i] = Math.min(
        dist[i] as number,
        at(x + 1, y) + d1,
        at(x, y + 1) + d1,
        at(x + 1, y + 1) + d2,
        at(x - 1, y + 1) + d2,
      );
    }
  return dist;
}

/**
 * Every opaque sprite pixel of every wish as one voxel: the element's anchor (tile centre and
 * ground height), the pixel's place in the sprite, its colour, whether it glows, and the day
 * the wish came true. Packed into typed arrays for one instanced draw call.
 */
export interface Voxels {
  count: number;
  anchor: Float32Array; // x, z, ground
  pixel: Float32Array; // column, row (0 = top)
  color: Float32Array; // r, g, b (linear 0…1 sRGB values)
  info: Float32Array; // day, glow, water, seed
}

const RGB = Object.fromEntries(
  (Object.entries(SPRITE_PALETTE) as [PaletteChar, string][]).map(([c, hex]) => [
    c,
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number],
  ]),
) as Record<PaletteChar, [number, number, number]>;

export function voxelsOf(world: World, tiles: readonly Tile[]): Voxels {
  const grassDay = new Map<number, number | null>();
  for (const t of tiles) grassDay.set(t.y * world.width + t.x, t.grass);
  let count = 0;
  for (const e of world.elements) for (const row of e.sprite) for (const c of row) if (c !== '.') count++;
  const anchor = new Float32Array(count * 3);
  const pixel = new Float32Array(count * 2);
  const color = new Float32Array(count * 3);
  const info = new Float32Array(count * 4);
  let i = 0;
  for (const e of world.elements) {
    const water = e.kind === 'water';
    const g = grassDay.get(e.y * world.width + e.x);
    const ground = water ? 0.02 : g !== null && g !== undefined && g <= e.day ? GROUND.grass : GROUND.sand;
    const seed = (hashString(e.id) % 1000) / 1000;
    e.sprite.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const ch = row[c] as PaletteChar | '.';
        if (ch === '.') continue;
        const rgb = RGB[ch];
        anchor.set([e.x + 0.5, e.y + 0.5, ground], i * 3);
        pixel.set([c, r], i * 2);
        color.set(rgb, i * 3);
        info.set([e.day, GLOWING.includes(ch) ? 1 : 0, water ? 1 : 0, seed], i * 4);
        i++;
      }
    });
  }
  return { count, anchor, pixel, color, info };
}

export interface Glow {
  x: number;
  z: number;
  y: number;
  day: number;
  /** 1 for lights, smaller for windows and flames on other wishes. */
  strength: number;
  seed: number;
}

/** Where warm light pools on the island at night. */
export function glowsOf(world: World): Glow[] {
  const out: Glow[] = [];
  for (const e of world.elements) {
    let n = 0;
    let sumRow = 0;
    e.sprite.forEach((row, r) => {
      for (const c of row)
        if (GLOWING.includes(c as PaletteChar)) {
          n++;
          sumRow += r;
        }
    });
    if (n === 0) continue;
    const strength = e.kind === 'light' ? 1 : Math.min(0.55, 0.12 + n / 60);
    out.push({
      x: e.x + 0.5,
      z: e.y + 0.5,
      y: GROUND.grass + (1 - sumRow / n / 16) * 1.0,
      day: e.day,
      strength,
      seed: (hashString(e.id) % 1000) / 1000,
    });
  }
  return out;
}

/** Positions of the wish stars on the sky dome: fixed per issue, brighter with more votes. */
export function starPlacement(
  stars: readonly Star[],
): { issue: number; votes: number; azimuth: number; elevation: number; size: number }[] {
  const max = Math.max(1, ...stars.map((s) => s.votes));
  return stars.map((s) => {
    const h = hashString(`star:${s.issue}`);
    return {
      issue: s.issue,
      votes: s.votes,
      azimuth: ((h % 3600) / 3600) * Math.PI * 2,
      elevation: 0.35 + (((h >>> 12) % 1000) / 1000) * 0.75,
      size: 0.5 + (s.votes / max) * 1.1,
    };
  });
}
