import { HEIGHT, TERRAIN_CHARS, WIDTH, type Terrain } from './schema';

/** The terrain as a mutable grid, read from and written back to the ASCII rows of world.json. */

const FROM_CHAR: Record<string, Terrain> = { '~': 'water', '.': 'sand', ',': 'grass' };

export class IslandMap {
  private constructor(private readonly cells: Terrain[]) {}

  static fromRows(rows: readonly string[]): IslandMap {
    const cells: Terrain[] = [];
    for (const row of rows) for (const c of row) cells.push(FROM_CHAR[c] ?? 'water');
    return new IslandMap(cells);
  }

  static empty(): IslandMap {
    return new IslandMap(new Array<Terrain>(WIDTH * HEIGHT).fill('water'));
  }

  clone(): IslandMap {
    return new IslandMap([...this.cells]);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
  }

  get(x: number, y: number): Terrain {
    return this.inBounds(x, y) ? (this.cells[y * WIDTH + x] ?? 'water') : 'water';
  }

  set(x: number, y: number, terrain: Terrain): void {
    if (this.inBounds(x, y)) this.cells[y * WIDTH + x] = terrain;
  }

  isLand(x: number, y: number): boolean {
    return this.get(x, y) !== 'water';
  }

  /** Water next to land (four neighbours) – where boats and fish go. */
  isCoast(x: number, y: number): boolean {
    if (this.isLand(x, y)) return false;
    return [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([dx, dy]) => this.isLand(x + (dx ?? 0), y + (dy ?? 0)));
  }

  /** True when all four neighbours are land – such a tile is inland, not beach. */
  isInland(x: number, y: number): boolean {
    return this.isLand(x, y - 1) && this.isLand(x + 1, y) && this.isLand(x, y + 1) && this.isLand(x - 1, y);
  }

  /**
   * Derive grass and sand from the land itself: inland tiles are grass, the rest of the land is
   * beach. The terrain is therefore a pure function of which tiles are land.
   */
  reshape(): void {
    const next = this.cells.map((terrain, i) => {
      if (terrain === 'water') return terrain;
      return this.isInland(i % WIDTH, Math.floor(i / WIDTH)) ? 'grass' : 'sand';
    });
    next.forEach((terrain, i) => (this.cells[i] = terrain));
  }

  landNeighbours(x: number, y: number): number {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && this.isLand(x + dx, y + dy)) n++;
    return n;
  }

  count(filter: (terrain: Terrain, x: number, y: number) => boolean): number {
    let n = 0;
    for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) if (filter(this.get(x, y), x, y)) n++;
    return n;
  }

  rows(): string[] {
    const out: string[] = [];
    for (let y = 0; y < HEIGHT; y++) {
      let row = '';
      for (let x = 0; x < WIDTH; x++) row += TERRAIN_CHARS[this.get(x, y)];
      out.push(row);
    }
    return out;
  }
}
