import { hashString, type Star } from '@/features/island';
import type { PixelCanvas } from './canvas';
import { NIGHT } from './palette';

/**
 * The sky above the island: a dithered night gradient, the moon in its real phase for the date,
 * a dust of small stars – and one bright star for every wish that is still waiting. The more
 * thumbs-up a wish has, the bigger its star.
 */

const SYNODIC = 29.530588853;
/** A new moon: 2000-01-06 18:14 UTC. */
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

/** 0 = new moon, 0.5 = full moon, for the night of `date` (YYYY-MM-DD). */
export function moonPhase(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const night = Date.UTC(y, m - 1, d, 21);
  const days = (night - NEW_MOON) / 86_400_000;
  return (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
}

export function moonName(phase: number): string {
  const names = [
    'new moon',
    'waxing crescent',
    'first quarter',
    'waxing gibbous',
    'full moon',
    'waning gibbous',
    'last quarter',
    'waning crescent',
  ];
  return names[Math.round(phase * 8) % 8] ?? 'moon';
}

export interface PlacedStar extends Star {
  x: number;
  y: number;
  size: 1 | 2 | 3;
  rank: number;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export interface SkyLayers {
  base: PixelCanvas;
  twinkleA: PixelCanvas;
  twinkleB: PixelCanvas;
}

const SHAPES: Record<1 | 2 | 3, [number, number, 'core' | 'ray'][]> = {
  1: [
    [0, 0, 'core'],
    [1, 0, 'ray'],
    [-1, 0, 'ray'],
    [0, 1, 'ray'],
    [0, -1, 'ray'],
  ],
  2: [
    [0, 0, 'core'],
    [1, 0, 'core'],
    [-1, 0, 'core'],
    [0, 1, 'core'],
    [0, -1, 'core'],
    [2, 0, 'ray'],
    [-2, 0, 'ray'],
    [0, 2, 'ray'],
    [0, -2, 'ray'],
  ],
  3: [
    [0, 0, 'core'],
    [1, 0, 'core'],
    [-1, 0, 'core'],
    [0, 1, 'core'],
    [0, -1, 'core'],
    [1, 1, 'ray'],
    [-1, -1, 'ray'],
    [1, -1, 'ray'],
    [-1, 1, 'ray'],
    [2, 0, 'core'],
    [-2, 0, 'core'],
    [0, 2, 'core'],
    [0, -2, 'core'],
    [3, 0, 'ray'],
    [-3, 0, 'ray'],
    [0, 3, 'ray'],
    [0, -3, 'ray'],
  ],
};

/** Paint the sky band (height `h`, full canvas width) and return where the wish stars are. */
export function paintSky(layers: SkyLayers, h: number, date: string, stars: readonly Star[]): PlacedStar[] {
  const w = layers.base.width;
  const C = NIGHT;
  // an ordered-dither gradient from deep night at the top to a violet haze at the horizon
  const bands = [C.sky0, C.sky1, C.sky2, C.sky3, C.horizon];
  for (let y = 0; y < h; y++) {
    const t = (y / Math.max(1, h - 1)) * (bands.length - 1);
    const i = Math.min(bands.length - 2, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < w; x++)
      layers.base.put(x, y, (BAYER[(y & 3) * 4 + (x & 3)] as number) < f ? bands[i + 1]! : bands[i]!);
  }

  // the moon, upper right
  const r = Math.max(4, Math.round(h * 0.16));
  const mx = w - Math.round(h * 0.45) - r;
  const my = Math.round(h * 0.36);
  const phase = moonPhase(date);
  const k = Math.cos(2 * Math.PI * phase);
  const waxing = phase < 0.5;
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r + r * 0.6) continue;
      const v = y / r;
      const u = x / r;
      const half = Math.sqrt(Math.max(0, 1 - v * v));
      const lit = waxing ? u >= k * half : u <= -k * half;
      layers.base.put(mx + x, my + y, lit ? C.moon : C.moonShade);
    }
  }

  // star dust, some of it twinkling
  const dust = Math.round((w * h) / 90);
  for (let i = 0; i < dust; i++) {
    const hsh = hashString(`dust:${i}`);
    const x = hsh % w;
    const y = (hsh >>> 12) % Math.max(1, h - 4);
    if (Math.hypot(x - mx, y - my) < r + 3) continue;
    const layer = i % 7 === 0 ? layers.twinkleA : i % 7 === 1 ? layers.twinkleB : layers.base;
    layer.put(x, y, C.starDim);
  }

  // one star per open wish: position from the issue number, size from the votes
  const sorted = [...stars].sort((a, b) => b.votes - a.votes || a.issue - b.issue);
  const placed: PlacedStar[] = [];
  sorted.forEach((star, rank) => {
    const size: 1 | 2 | 3 = rank === 0 && star.votes > 0 ? 3 : star.votes >= 3 ? 2 : 1;
    let best: [number, number] = [0, 0];
    let bestGap = -1;
    for (let attempt = 0; attempt < 12; attempt++) {
      const hsh = hashString(`star:${star.issue}:${attempt}`);
      const x = 5 + (hsh % Math.max(1, w - 10));
      const y = 4 + ((hsh >>> 11) % Math.max(1, h - 12));
      if (Math.hypot(x - mx, y - my) < r + 6) continue;
      const gap = Math.min(99, ...placed.map((p) => Math.hypot(p.x - x, p.y - y)));
      if (gap > bestGap) {
        best = [x, y];
        bestGap = gap;
      }
      if (gap > 14) break;
    }
    const [x, y] = best;
    placed.push({ ...star, x, y, size, rank });
    for (const [dx, dy, part] of SHAPES[size]) {
      const target = part === 'ray' && size > 1 ? (rank % 2 ? layers.twinkleA : layers.twinkleB) : layers.base;
      target.put(x + dx, y + dy, part === 'core' ? C.star : C.gold);
    }
  });
  return placed;
}
