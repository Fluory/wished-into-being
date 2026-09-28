import { hashCell, type IslandMap, type Terrain } from '@/features/island';
import type { PixelCanvas } from './canvas';
import { NIGHT } from './palette';

/**
 * The ground at pixel level. A tile is 16 × 16 pixels – one sprite – but the coast is
 * interpolated between tile centres, so the island gets soft, rounded shores instead of hard
 * squares. The sea darkens with distance from the shore, dithered like old console games, and
 * the texture (tufts, speckles, waves) is placed per tile so the SVG stays small.
 */

export const TILE = 16;

const TYPES: readonly Terrain[] = ['water', 'sand', 'grass'];
const WATER = 0;
const SAND = 1;
const GRASS = 2;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] as number;

/** A square window onto the map, in tiles. */
export interface Frame {
  x: number;
  y: number;
  size: number;
}

export interface TerrainLayers {
  base: PixelCanvas;
  waveA: PixelCanvas;
  waveB: PixelCanvas;
}

/** Pixel classes of a frame, reused by the painter to seat sprites and draw glows. */
export interface Ground {
  size: number;
  kind: Uint8Array;
  /** Distance from land in pixels (0 on land). */
  dist: Float32Array;
}

export function classify(map: IslandMap, frame: Frame): Ground {
  const size = frame.size * TILE;
  const originX = frame.x * TILE;
  const originY = frame.y * TILE;
  const kind = new Uint8Array(size * size);
  const typeIndex = (tx: number, ty: number) => TYPES.indexOf(map.get(tx, ty));
  const acc = new Float32Array(TYPES.length);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const gx = originX + px;
      const gy = originY + py;
      const fx = (gx + 0.5) / TILE - 0.5;
      const fy = (gy + 0.5) / TILE - 0.5;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const ax = fx - x0;
      const ay = fy - y0;
      acc.fill(0);
      acc[typeIndex(x0, y0)]! += (1 - ax) * (1 - ay);
      acc[typeIndex(x0 + 1, y0)]! += ax * (1 - ay);
      acc[typeIndex(x0, y0 + 1)]! += (1 - ax) * ay;
      acc[typeIndex(x0 + 1, y0 + 1)]! += ax * ay;
      const noise = ((hashCell(gx >> 1, gy >> 1, 5) % 1000) / 1000 - 0.5) * 0.12;
      let k = WATER;
      if (1 - (acc[WATER] as number) + noise > 0.5) {
        const grassy = (acc[GRASS] as number) + ((hashCell(gx >> 1, gy >> 1, 21) % 1000) / 1000 - 0.5) * 0.1;
        k = grassy > (acc[SAND] as number) ? GRASS : SAND;
      }
      kind[py * size + px] = k;
    }
  }

  // chamfer distance (3-4) from land, stored in pixels
  const dist = new Float32Array(size * size);
  for (let i = 0; i < dist.length; i++) dist[i] = kind[i] === WATER ? 1e9 : 0;
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= size || y >= size ? 1e9 : (dist[y * size + x] as number);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      dist[i] = Math.min(dist[i] as number, at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
    }
  for (let y = size - 1; y >= 0; y--)
    for (let x = size - 1; x >= 0; x--) {
      const i = y * size + x;
      dist[i] = Math.min(dist[i] as number, at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
    }
  for (let i = 0; i < dist.length; i++) dist[i] = (dist[i] as number) / 3;
  return { size, kind, dist };
}

export function paintTerrain(map: IslandMap, frame: Frame, layers: TerrainLayers): Ground {
  const ground = classify(map, frame);
  const { size, kind, dist } = ground;
  const originX = frame.x * TILE;
  const originY = frame.y * TILE;
  const kindAt = (x: number, y: number) =>
    x < 0 || y < 0 || x >= size || y >= size ? WATER : (kind[y * size + x] as number);
  const touches = (x: number, y: number, k: number) =>
    kindAt(x - 1, y) === k || kindAt(x + 1, y) === k || kindAt(x, y - 1) === k || kindAt(x, y + 1) === k;
  const C = NIGHT;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const gx = originX + px;
      const gy = originY + py;
      const k = kind[py * size + px] as number;
      let color: string;
      if (k === WATER) {
        const d = dist[py * size + px] as number;
        const h = hashCell(gx, gy, 3) % 100;
        if (d <= 1.01) color = h < 22 ? C.sea3 : C.foam;
        else if (d <= 4) color = C.sea3;
        else if (d <= 7) color = bayer(gx, gy) < (d - 4) / 3 ? C.sea2 : C.sea3;
        else if (d <= 14) color = C.sea2;
        else if (d <= 22) color = bayer(gx, gy) < (d - 14) / 8 ? C.sea1 : C.sea2;
        else if (d <= 40) color = C.sea1;
        else if (d <= 56) color = bayer(gx, gy) < (d - 40) / 16 ? C.sea0 : C.sea1;
        else color = C.sea0;
      } else if (k === SAND) {
        color = touches(px, py, WATER) ? C.sand0 : C.sand1;
      } else {
        color = touches(px, py, SAND) || touches(px, py, WATER) ? ((gx + gy) & 1 ? C.grass1 : C.sand1) : C.grass1;
      }
      layers.base.put(px, py, color);
    }
  }

  // texture, placed per tile: speckles on sand, tufts and dark patches on grass
  for (let ty = 0; ty < frame.size; ty++) {
    for (let tx = 0; tx < frame.size; tx++) {
      const terrain = map.get(frame.x + tx, frame.y + ty);
      if (terrain === 'water') continue;
      for (let n = 0; n < 4; n++) {
        const h = hashCell(frame.x + tx, frame.y + ty, 40 + n);
        const px = tx * TILE + 2 + (h % 12);
        const py = ty * TILE + 2 + ((h >> 5) % 12);
        const here = kindAt(px, py);
        if (here === SAND && n < 2) layers.base.put(px, py, n === 0 ? C.sand2 : C.sand0);
        if (here === GRASS && kindAt(px - 1, py) === GRASS && kindAt(px + 1, py) === GRASS && kindAt(px, py - 1) === GRASS) {
          if (n < 3) {
            layers.base.put(px - 1, py, C.grass2);
            layers.base.put(px + 1, py, C.grass2);
            layers.base.put(px, py - 1, (h >> 11) % 5 === 0 ? C.grass3 : C.grass2);
          } else {
            layers.base.put(px, py, C.grass0);
            layers.base.put(px + 1, py, C.grass0);
          }
        }
      }
    }
  }

  // waves and moon glints on open water, two frames
  for (let ty = 0; ty < frame.size; ty++) {
    for (let tx = 0; tx < frame.size; tx++) {
      const hw = hashCell(frame.x + tx, frame.y + ty, 9);
      if (hw % 3 !== 0) continue;
      const wx = tx * TILE + (hw % 9);
      const wy = ty * TILE + 2 + ((hw >> 4) % 11);
      let open = true;
      for (let i = -2; i < 7; i++) {
        const x = Math.min(size - 1, Math.max(0, wx + i));
        if (kindAt(x, wy) !== WATER || (dist[wy * size + x] as number) < 10) open = false;
      }
      if (!open) continue;
      const glint = (hw >> 9) % 4 === 0;
      const color = glint ? C.glint : C.sea3;
      for (let i = 0; i < (glint ? 2 : 4); i++) {
        layers.waveA.put(wx + i, wy, color);
        layers.waveB.put(wx + i + 1, wy + (glint ? 0 : 1), color);
      }
    }
  }
  return ground;
}
