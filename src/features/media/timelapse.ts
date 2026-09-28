import { worldAt, type World } from '@/features/island';
import { chooseFrame, NIGHT, paintIsland, rasterText, toRgba } from '@/features/render';
import { encodeGif } from './gif';

/**
 * The island growing day by day as an animated GIF – one frame per day (or every n-th day) on a
 * fixed frame, the moon changing its phase above it, the day number burnt in. Used for the
 * monthly release and the README.
 */
export function timelapseGif(
  world: World,
  options: { every?: number; scale?: number; label?: string } = {},
): Uint8Array {
  const every = options.every ?? 1;
  const scale = options.scale ?? 1;
  const frame = chooseFrame(world);
  const last = world.days[world.days.length - 1]?.day ?? 0;
  const days: number[] = [];
  for (let d = 0; d <= last; d += every) days.push(d);
  if (days[days.length - 1] !== last) days.push(last);

  let width = 0;
  let height = 0;
  const frames = days.map((day) => {
    const painted = paintIsland(worldAt(world, day), { frame, highlight: null });
    width = painted.width;
    height = painted.height;
    const rgba = toRgba([painted.base, painted.overlays.waveA, painted.overlays.glow], NIGHT.bg);
    const stamp = (text: string, x0: number, y0: number, color: [number, number, number]) => {
      const plot = (x: number, y: number, c: [number, number, number]) => {
        const px = x0 + x;
        const py = y0 + y;
        if (px < 0 || py < 0 || px >= width || py >= height) return;
        const i = (py * width + px) * 4;
        rgba[i] = c[0];
        rgba[i + 1] = c[1];
        rgba[i + 2] = c[2];
      };
      rasterText(text, (x, y) => plot(x + 1, y + 1, [7, 6, 26]));
      rasterText(text, (x, y) => plot(x, y, color));
    };
    stamp(`DAY ${String(day).padStart(3, '0')}`, 6, 6, [255, 212, 94]);
    if (options.label) stamp(options.label, 6, height - 12, [244, 234, 208]);
    return rgba;
  });
  return encodeGif(frames, width, height, { delay: 90, lastDelay: 3000, scale });
}
