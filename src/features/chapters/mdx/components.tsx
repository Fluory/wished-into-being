import type { ReactNode } from 'react';
import {
  BOTTLE_WISHES,
  bottleSprite,
  GLOWING,
  GROWTH,
  HARBOUR,
  KIND_INFO,
  KINDS,
  PALETTE_CHARS,
  PALETTE_NAMES,
  SPRITE_PALETTE,
  worldAt,
  type World,
} from '@/features/island';
import { renderIsleSvg } from '@/features/render';
import { Sprite } from '@/features/sprites';
import { getSimulation, getWorld } from '@/features/world-data';
import styles from './mdx.module.css';

export function Callout({ icon = '✦', children }: { icon?: string; children: ReactNode }) {
  return (
    <aside className={`${styles.callout} glass`}>
      <span className={styles.calloutIcon} aria-hidden="true">
        {icon}
      </span>
      <div>{children}</div>
    </aside>
  );
}

/** The README picture of the real island (or a day of the simulated year). */
export function IslandFigure({
  day,
  simulated = false,
  caption,
}: {
  day?: number;
  simulated?: boolean;
  caption?: string;
}) {
  const base: World = simulated ? getSimulation() : getWorld();
  const shown = day === undefined ? base : worldAt(base, day);
  const svg = renderIsleSvg(shown, { caption: true });
  const last = shown.days[shown.days.length - 1];
  return (
    <figure className={styles.figure}>
      <div className={`${styles.figureFrame} glass`} dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>
        {caption ??
          (simulated
            ? `Day ${last?.day ?? 0} of the simulated year – messages in a bottle only.`
            : `The island on day ${last?.day ?? 0} – straight from world/world.json.`)}
      </figcaption>
    </figure>
  );
}

/** The six kinds and their room, generated from the rules the code enforces. */
export function KindTable() {
  return (
    <div className={`${styles.tableWrap} glass`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Kind</th>
            <th scope="col">Where and how many</th>
            <th scope="col">For example</th>
          </tr>
        </thead>
        <tbody>
          {KINDS.map((k) => (
            <tr key={k}>
              <td>
                <strong>{KIND_INFO[k].label}</strong>
              </td>
              <td>{KIND_INFO[k].rule}</td>
              <td className="muted">{KIND_INFO[k].examples}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The fifteen colours of the sprite palette, with their letters. */
export function Palette() {
  return (
    <ul className={styles.palette}>
      {PALETTE_CHARS.map((c) => (
        <li key={c} className={styles.swatch}>
          <span className={styles.chip} style={{ background: SPRITE_PALETTE[c] }} aria-hidden="true" />
          <code className="mono">{c}</code>
          <span>{PALETTE_NAMES[c]}</span>
          {GLOWING.includes(c) && <span className={styles.glows}>glows</span>}
        </li>
      ))}
    </ul>
  );
}

/** A sprite next to the sixteen lines of text it is made of. */
export function SpriteSource({ bottle = 'lantern' }: { bottle?: string }) {
  const sprite = bottleSprite(
    (BOTTLE_WISHES.find((b) => b.key === bottle)?.key ?? 'lantern') as Parameters<typeof bottleSprite>[0],
  );
  return (
    <figure className={`${styles.source} glass`}>
      <pre className={styles.sourceText}>{sprite.join('\n')}</pre>
      <div className={styles.sourceSprite}>
        <Sprite rows={sprite} size={176} label="The same sprite, drawn" />
      </div>
      <figcaption>Sixteen lines of sixteen characters – that is the whole drawing.</figcaption>
    </figure>
  );
}

/** The islanders' own wishes: every message in a bottle the director can pick. */
export function Bottles() {
  return (
    <ul className={`${styles.sprites} glass`}>
      {BOTTLE_WISHES.map((b) => (
        <li key={b.key} className={styles.sprite}>
          <Sprite rows={bottleSprite(b.key)} size={64} label={b.name} />
          <span>{b.name}</span>
        </li>
      ))}
    </ul>
  );
}

/** The numbers behind "the island never locks up". */
export function GrowthNumbers() {
  const rates = KINDS.filter((k) => KIND_INFO[k].ground !== 'coast').map((k) => {
    const info = KIND_INFO[k];
    const per = info.limit(600, 0) - info.limit(0, 0);
    return { kind: info.plural, rate: per / 600 };
  });
  const total = rates.reduce((s, r) => s + r.rate, 0);
  return (
    <div className={`${styles.tableWrap} glass`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Per tile of land</th>
            <th scope="col">room</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((r) => (
            <tr key={r.kind}>
              <td>{r.kind}</td>
              <td className="mono">{r.rate.toFixed(3)}</td>
            </tr>
          ))}
          <tr>
            <td>
              <strong>together</strong>
            </td>
            <td className="mono">
              <strong>{total.toFixed(3)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <p className={styles.tableNote}>
        The sea raises {GROWTH.tiles} tiles every dawn, one wish comes true per day, and water wishes keep {HARBOUR}{' '}
        tiles of open sea around them.
      </p>
    </div>
  );
}
