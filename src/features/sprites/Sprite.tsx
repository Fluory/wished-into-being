import { SPRITE_PALETTE, type PaletteChar } from '@/features/island';

/**
 * A 16 × 16 wish sprite as crisp inline SVG – one path per colour, so a gallery of hundreds of
 * sprites stays light. Decorative unless a label is given.
 */
export function Sprite({
  rows,
  size = 64,
  label,
  className,
  colors = SPRITE_PALETTE,
}: {
  rows: readonly string[];
  size?: number;
  label?: string;
  className?: string;
  colors?: Record<PaletteChar, string>;
}) {
  const paths = new Map<string, string[]>();
  const width = Math.max(1, ...rows.map((r) => r.length));
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x] as PaletteChar;
      const color = colors[ch];
      if (!color) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const list = paths.get(color) ?? [];
      list.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      paths.set(color, list);
      x = end;
    }
  });
  return (
    <svg
      className={className}
      width={size}
      height={(size * rows.length) / width}
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {[...paths.entries()].map(([color, d]) => (
        <path key={color} fill={color} d={d.join('')} />
      ))}
    </svg>
  );
}
