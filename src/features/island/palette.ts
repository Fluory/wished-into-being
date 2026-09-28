/**
 * The sprite palette. Every wish is drawn as a 16 × 16 sprite from these fifteen colours
 * (plus "." for transparent) – small enough to validate, rich enough to draw anything.
 */
export const SPRITE_SIZE = 16;

export const SPRITE_PALETTE = {
  k: '#1b1330',
  n: '#2b2d5c',
  v: '#5b3f8c',
  p: '#b86ad8',
  r: '#d9534f',
  o: '#f28c38',
  y: '#ffd45e',
  c: '#fff3c4',
  w: '#f5f5f5',
  g: '#5fb35f',
  d: '#2f6b3f',
  b: '#4aa3df',
  t: '#7fdcd0',
  u: '#8b5a3c',
  e: '#9aa0b5',
} as const;

export type PaletteChar = keyof typeof SPRITE_PALETTE;
export const PALETTE_CHARS = Object.keys(SPRITE_PALETTE) as PaletteChar[];
export const TRANSPARENT = '.';

/** Colours that glow at night (lights, windows, fire). */
export const GLOWING: readonly PaletteChar[] = ['y', 'c', 'o'];

export const PALETTE_NAMES: Record<PaletteChar, string> = {
  k: 'ink',
  n: 'navy',
  v: 'violet',
  p: 'lilac',
  r: 'red',
  o: 'orange',
  y: 'gold',
  c: 'cream',
  w: 'white',
  g: 'green',
  d: 'dark green',
  b: 'blue',
  t: 'teal',
  u: 'brown',
  e: 'grey',
};
