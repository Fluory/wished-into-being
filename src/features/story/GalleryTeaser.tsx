import Link from 'next/link';
import type { DayEntry, Element } from '@/features/island';
import { Sprite } from '@/features/sprites';
import { Reveal } from '@/shared/motion';
import { Credit } from './Credit';
import styles from './GalleryTeaser.module.css';
import { SceneSection } from './SceneSection';
import { SectionHead } from './SectionHead';

/** The newest things on the island as a shelf of sprites. */
export function GalleryTeaser({ items, total }: { items: { entry: DayEntry; element: Element }[]; total: number }) {
  return (
    <SceneSection className="section" camera="low" dim={0.25} labelledBy="gallery-title">
      <div className="container">
        <SectionHead eyebrow="Wished into being" title="Sixteen by sixteen pixels, and a name." id="gallery-title">
          Every wish is drawn as a tiny sprite in a palette of fifteen colours – by the wisher, or by Claude from their
          words. On the island they turn to face you like paper theatre.
        </SectionHead>
        <Reveal as="ul" className={styles.shelf} stagger="li">
          {items.map(({ entry, element }) => (
            <li key={element.id}>
              <Link href={`/day/${entry.day}`} className={`${styles.card} glass`}>
                <span className={styles.sprite}>
                  <Sprite rows={element.sprite} size={80} />
                </span>
                <span className={styles.name}>{element.name}</span>
                <span className={styles.credit}>
                  <Credit entry={entry} short links={false} />
                </span>
              </Link>
            </li>
          ))}
        </Reveal>
        <p className={styles.more}>
          <Link href="/wishes" className="btn btn-ghost">
            All {total} {total === 1 ? 'wish' : 'wishes'} <span className="arrow">→</span>
          </Link>
        </p>
      </div>
    </SceneSection>
  );
}
