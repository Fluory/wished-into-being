import Link from 'next/link';
import { ViewTransition } from 'react';
import { formatDate, type DayEntry, type Element } from '@/features/island';
import { Sprite } from '@/features/sprites';
import { Reveal } from '@/shared/motion';
import { Credit } from './Credit';
import styles from './LogbookPreview.module.css';
import { SceneSection } from './SceneSection';
import { SectionHead } from './SectionHead';

export function LogbookPreview({ entries }: { entries: { entry: DayEntry; element: Element }[] }) {
  return (
    <SceneSection className="section" camera="overview" dim={0.35} labelledBy="log-title">
      <div className="container">
        <SectionHead eyebrow="Logbook" title="A chronicle of wishes, one per day." id="log-title">
          Every wish that came true keeps its line of lore and the name of whoever wished it. Read backwards, it is the
          island&apos;s history.
        </SectionHead>
        <Reveal as="ul" className={styles.entries} stagger="li">
          {entries.map(({ entry: e, element }) => (
            <li key={e.day}>
              <Link href={`/day/${e.day}`} className={`${styles.entry} glass`} transitionTypes={['nav-forward']}>
                <span className={styles.entryDay}>DAY {String(e.day).padStart(3, '0')}</span>
                <Sprite rows={element.sprite} size={40} className={styles.entrySprite} />
                <span>
                  <ViewTransition name={`day-title-${e.day}`} share="morph" default="none">
                    <span className={styles.entryTitle}>{e.title}</span>
                  </ViewTransition>
                  <br />
                  <span className={styles.entryLore}>
                    {formatDate(e.date)} · <Credit entry={e} short links={false} /> · {e.lore}
                  </span>
                </span>
                <span className={styles.entryArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </Reveal>
        <p style={{ marginTop: 'var(--s-6)' }}>
          <Link href="/logbook" className="btn btn-ghost">
            The full logbook <span className="arrow">→</span>
          </Link>
        </p>
      </div>
    </SceneSection>
  );
}
