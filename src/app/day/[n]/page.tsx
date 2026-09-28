import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ViewTransition } from 'react';
import { formatDate, islandStats, KIND_INFO, worldAt } from '@/features/island';
import { renderIsleSvg } from '@/features/render';
import { SceneDirective } from '@/features/scene';
import { Sprite } from '@/features/sprites';
import { Credit } from '@/features/story';
import { getDay, getElement, getWorld, repoUrl } from '@/features/world-data';
import pageStyles from '../../page.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return getWorld().days.map((d) => ({ n: String(d.day) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const entry = getDay(Number(n));
  if (!entry) return {};
  return {
    title: `Day ${entry.day}: ${entry.title}`,
    description: entry.lore,
    alternates: { canonical: `/day/${entry.day}` },
  };
}

export default async function DayPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const entry = getDay(Number(n));
  if (!entry) notFound();
  const element = getElement(entry.element);
  if (!element) notFound();
  const world = getWorld();
  const then = worldAt(world, entry.day);
  const stats = islandStats(then);
  const svg = renderIsleSvg(then, { caption: false });
  const index = world.days.findIndex((d) => d.day === entry.day);
  const prev = world.days[index - 1];
  const next = world.days[index + 1];
  const kind = entry.action === 'genesis' ? 'the beginning' : KIND_INFO[element.kind].label;

  return (
    <div className={`container ${pageStyles.page}`}>
      <SceneDirective camera="focus" focus={{ x: element.x, y: element.y }} day={entry.day} dim={0.4} orbit={false} />
      <div className={pageStyles.dayHero}>
        <header className={pageStyles.head}>
          <p className="eyebrow">
            Day {entry.day} · {formatDate(entry.date)} · {kind}
          </p>
          <div className={pageStyles.daySprite}>
            <Sprite rows={element.sprite} size={128} label={element.name} />
          </div>
          <ViewTransition name={`day-title-${entry.day}`} share="morph" default="none">
            <h1 className="h2">{entry.title}</h1>
          </ViewTransition>
          <p className={pageStyles.dayCredit}>
            <Credit entry={entry} />
          </p>
          <p className="lede">{entry.lore}</p>
          <div className={pageStyles.stats}>
            <span className="pill">
              tile {element.x}, {element.y}
            </span>
            <span className="pill">{stats.land} tiles of land that day</span>
            {entry.land && <span className="pill">the sea raised {entry.land.length} tiles</span>}
            <span className="pill">
              {entry.source === 'director'
                ? 'picked by the director'
                : entry.source === 'claude'
                  ? 'drawn by Claude'
                  : 'genesis'}
            </span>
          </div>
          <p>
            <a className="btn btn-ghost" href={repoUrl(`blob/main/world/sprites/${element.id}.svg`)}>
              The sprite on GitHub <span className="arrow">→</span>
            </a>
          </p>
        </header>
        <div className={`${pageStyles.dayImage} glass`} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      <nav className={pageStyles.dayNav} aria-label="Neighbouring days">
        {prev ? (
          <Link className="btn btn-ghost" href={`/day/${prev.day}`} transitionTypes={['nav-back']}>
            ← Day {prev.day}
          </Link>
        ) : (
          <span />
        )}
        <Link className="btn btn-ghost" href="/logbook">
          Logbook
        </Link>
        {next ? (
          <Link className="btn btn-ghost" href={`/day/${next.day}`} transitionTypes={['nav-forward']}>
            Day {next.day} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
