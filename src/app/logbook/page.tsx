import type { Metadata } from 'next';
import Link from 'next/link';
import { ViewTransition } from 'react';
import { formatDate, formatMonth, type DayEntry, type Element } from '@/features/island';
import { SceneDirective } from '@/features/scene';
import { Sprite } from '@/features/sprites';
import { Credit } from '@/features/story';
import { getStats, getWishes, repoUrl } from '@/features/world-data';
import pageStyles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Logbook',
  description:
    'The chronicle of the island – every wish that came true, with its sprite, its line of lore and the name of whoever wished it.',
  alternates: { canonical: '/logbook' },
};

export default function LogbookPage() {
  const stats = getStats();
  const months = new Map<string, { entry: DayEntry; element: Element }[]>();
  for (const item of getWishes()) {
    const key = formatMonth(item.entry.date);
    months.set(key, [...(months.get(key) ?? []), item]);
  }
  return (
    <div className={`${pageStyles.narrow} ${pageStyles.page}`}>
      <SceneDirective camera="far" dim={0.6} />
      <header className={pageStyles.head}>
        <p className="eyebrow">Logbook</p>
        <h1 className="h2">
          One wish, <em>one line.</em>
        </h1>
        <p className="lede">
          The island&apos;s chronicle, newest day first. It is generated from{' '}
          <a className="link" href={repoUrl('blob/main/world/world.json')}>
            world.json
          </a>{' '}
          and lives in the repository as{' '}
          <a className="link" href={repoUrl('blob/main/LOGBOOK.md')}>
            LOGBOOK.md
          </a>
          .
        </p>
        <div className={pageStyles.stats}>
          <span className="pill">Day {stats.day}</span>
          <span className="pill">
            {stats.wishes} {stats.wishes === 1 ? 'wish' : 'wishes'} for {stats.wishers}{' '}
            {stats.wishers === 1 ? 'person' : 'people'}
          </span>
          <span className="pill">{stats.bottles} bottles</span>
          <span className="pill">{stats.land} tiles of land</span>
        </div>
      </header>
      <div className={`${pageStyles.panel} glass ${pageStyles.months}`}>
        {[...months.entries()].map(([month, items]) => (
          <section key={month} className={pageStyles.month} aria-label={month}>
            <h2>{month}</h2>
            <ol className={pageStyles.list} reversed>
              {items.map(({ entry: e, element }) => (
                <li key={e.day}>
                  <Link href={`/day/${e.day}`} className={pageStyles.item} transitionTypes={['nav-forward']}>
                    <span className={pageStyles.itemDay}>DAY {String(e.day).padStart(3, '0')}</span>
                    <Sprite rows={element.sprite} size={36} />
                    <span>
                      <ViewTransition name={`day-title-${e.day}`} share="morph" default="none">
                        <strong>{e.title}</strong>
                      </ViewTransition>{' '}
                      <span className="muted">
                        – {e.lore}{' '}
                        <span style={{ whiteSpace: 'nowrap' }}>
                          ({formatDate(e.date)} · <Credit entry={e} short links={false} />)
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
