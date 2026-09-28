import { BOTTLE_SPRITES, WELL } from '@/features/island';

/** Small pixel drawings for the interface, in the same palette as the wishes. */

/** The brand mark: a wish-star. */
export const STAR = [
  '....o....',
  '....y....',
  '...yyy...',
  '.oyycyyo.',
  'yyycccyyy',
  '.oyycyyo.',
  '...yyy...',
  '....y....',
  '....o....',
];

/** A message in a bottle. */
export const BOTTLE = [
  '................',
  '................',
  '..........kk....',
  '.........kuuk...',
  '........kkuk....',
  '.......kbtbk....',
  '......kbtcbk....',
  '.....kbtccbk....',
  '....kbtcctbk....',
  '...kbtcctbk.....',
  '..kbtctttbk.....',
  '..kbttttbk......',
  '..kbbbbbk.......',
  '...kkkkk........',
  '................',
  '................',
];

/** A thumbs-up, for votes. */
export const THUMB = [
  '................',
  '................',
  '.......kk.......',
  '......kyyk......',
  '......kyyk......',
  '.....kyyyk......',
  '.kkkkyyyykkkk...',
  '.kyykyyyyyyyyk..',
  '.kyykyyyyyykk...',
  '.kyykyyyyyyyyk..',
  '.kyykyyyyyykk...',
  '.kyykyyyyyyyyk..',
  '.kkkkkyyyyykk...',
  '.....kkkkkk.....',
  '................',
  '................',
];

/** An open issue: a speech bubble with a pencil line. */
export const ISSUE = [
  '................',
  '................',
  '..kkkkkkkkkkkk..',
  '.kccccccccccccck',
  '.kcvvvvvvvvvvck.',
  '.kccccccccccccck',
  '.kcvvvvvvvcccck.',
  '.kccccccccccccck',
  '..kkkkcckkkkkkk.',
  '......kck.......',
  '.......kk.......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

export const WELL_ICON = WELL;

export const ICONS = {
  star: STAR,
  well: WELL,
  bottle: BOTTLE,
  thumb: THUMB,
  issue: ISSUE,
  lantern: BOTTLE_SPRITES.lantern ?? [],
  cottage: BOTTLE_SPRITES.cottage ?? [],
  cat: BOTTLE_SPRITES.cat ?? [],
  owl: BOTTLE_SPRITES.owl ?? [],
  rowboat: BOTTLE_SPRITES.rowboat ?? [],
  pine: BOTTLE_SPRITES.pine ?? [],
  telescope: BOTTLE_SPRITES.telescope ?? [],
  crystal: BOTTLE_SPRITES.crystal ?? [],
  campfire: BOTTLE_SPRITES.campfire ?? [],
} as const;

export type IconName = keyof typeof ICONS;
