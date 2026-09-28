/** Public interface of the render module. */
export { PixelCanvas, parseHex, toRgba } from './canvas';
export { GLYPH_HEIGHT, rasterText, textWidth, wrapText } from './font';
export {
  chooseFrame,
  FRAME_SIZES,
  OVERLAYS,
  paintIsland,
  spritePixels,
  TILE,
  type Frame,
  type Overlay,
  type PaintedIsland,
  type PaintOptions,
} from './paint';
export { renderElementSvg } from './element-svg';
export { DAYLIGHT, MOONLIT, NIGHT, type NightColor } from './palette';
export { encodePng, pngDataUri } from './png';
export { moonName, moonPhase, type PlacedStar } from './sky';
export { renderSpriteSvg, type SpriteSvgOptions } from './sprite-svg';
export { canvasPaths, creditLine, escapeXml, renderIsleSvg, textPath, type SvgOptions } from './svg';
