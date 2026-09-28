import { GLOWING, SPRITE_PALETTE, type PaletteChar } from '@/features/island';

/**
 * The night palette. The island is always seen at night, under the stars that are still wishes:
 * an indigo sea, moonlit sand, dark grass – and gold for everything that glows. The README
 * picture, the GIF and the 3D scene all take their colours from here.
 */
export const NIGHT = {
  sky0: '#07061a',
  sky1: '#0d0b29',
  sky2: '#161339',
  sky3: '#211c4d',
  horizon: '#2e2763',
  sea0: '#0a0d2c',
  sea1: '#0f1640',
  sea2: '#162256',
  sea3: '#24397a',
  glint: '#8fa6e6',
  foam: '#b9c6f2',
  sand0: '#6e6391',
  sand1: '#9486b3',
  sand2: '#b8aad0',
  grass0: '#17392f',
  grass1: '#1f4c3b',
  grass2: '#2f6a4b',
  grass3: '#4c8a5c',
  halo0: '#ffd45e38',
  halo1: '#ffd45e1f',
  halo2: '#ffd45e10',
  star: '#ffe39a',
  starDim: '#a99ad6',
  moon: '#f6eecf',
  moonShade: '#2a2452',
  gold: '#ffd45e',
  bg: '#0d0b29',
  text: '#f4ead0',
  textDim: '#a79fd0',
} as const;

export type NightColor = keyof typeof NIGHT;

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa
    .map((v, i) =>
      Math.round(v + ((pb[i] ?? 0) - v) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** Sprite colours under the moon: everything a little bluer and darker, except what glows. */
export const MOONLIT: Record<PaletteChar, string> = Object.fromEntries(
  (Object.entries(SPRITE_PALETTE) as [PaletteChar, string][]).map(([char, hex]) => [
    char,
    GLOWING.includes(char) ? hex : mix(hex, '#141040', 0.3),
  ]),
) as Record<PaletteChar, string>;

/** The true colours, for sprite previews and the wish gallery. */
export const DAYLIGHT: Record<PaletteChar, string> = { ...SPRITE_PALETTE };
