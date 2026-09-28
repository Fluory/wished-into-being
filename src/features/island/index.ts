/** Public interface of the island engine – other modules import only from here. */
export {
  applyDay,
  CENTER,
  checkWish,
  createGenesis,
  dawnOf,
  GENESIS_LORE,
  GENESIS_TITLE,
  WorldRuleError,
  type Dawn,
  type DayResult,
  type WishInput,
} from './apply';
export {
  addDays,
  berlinDate,
  daysBetween,
  formatDate,
  formatMonth,
  isIsoDate,
  seasonOf,
  TIME_ZONE,
  type Season,
} from './calendar';
export { BOTTLE_WISHES, bottleSprite, findBottle, repeatName, type BottleWish } from './catalogue';
export { applyBottle, bottleOptions, bottleWish, simulateBottles, type BottleChoice } from './director';
export { validateWorld, worldAt } from './history';
export { checkLogin, checkText, tidyName } from './lore';
export { IslandMap } from './map';
export { GLOWING, PALETTE_CHARS, PALETTE_NAMES, SPRITE_PALETTE, SPRITE_SIZE, TRANSPARENT, type PaletteChar } from './palette';
export { createRng, hashCell, hashString, pick, type Rng } from './rng';
export {
  checkTile,
  coastCount,
  freeTiles,
  GROWTH,
  growthTile,
  hasFreeTile,
  inside,
  islandState,
  KIND_INFO,
  kindRoom,
  landCount,
  MARGIN,
  NEAR,
  occupied,
  pickTile,
  shoreField,
  stateOf,
  type IslandState,
  type KindInfo,
  type Near,
} from './rules';
export {
  ACTIONS,
  HEIGHT,
  isKind,
  KINDS,
  LOGIN,
  parseWorld,
  TERRAIN_CHARS,
  TERRAINS,
  WIDTH,
  WorldSchema,
  type Action,
  type DayEntry,
  type Element,
  type Kind,
  type Star,
  type Terrain,
  type World,
} from './schema';
export { checkSprite, MIN_PIXELS, parseSprite, spriteStats, type SpriteStats } from './sprite';
export { BOTTLE_SPRITES, WELL } from './sprites';
export { islandStats, type IslandStats } from './stats';
