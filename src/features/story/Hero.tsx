import Link from 'next/link';
import { Countdown } from '@/features/chrome';
import { formatDate, type DayEntry, type Element, type IslandStats } from '@/features/island';
import { Sprite } from '@/features/sprites';
import { Magnetic, SplitReveal } from '@/shared/motion';
import { Credit } from './Credit';
import styles from './Hero.module.css';
import { SceneSection } from './SceneSection';

export function Hero({
  latest,
  element,
  stats,
  wishUrl,
}: {
  latest: DayEntry;
  element: Element;
  stats: IslandStats;
  wishUrl: string;
}) {
  return (
    <SceneSection className={styles.hero} camera="hero" shift={0.16} mobileShiftY={0.24} labelledBy="hero-title">
      <div className={`container ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <p className="eyebrow">
            Day {latest.day} · {formatDate(latest.date)} · {stats.wishes} {stats.wishes === 1 ? 'wish' : 'wishes'}{' '}
            granted
          </p>
          <SplitReveal as="h1" id="hero-title" className={styles.heroTitle} by="chars" immediate>
            Wished <em>into&nbsp;Being.</em>
          </SplitReveal>
          <SplitReveal as="p" className="lede" by="lines" immediate delay={0.5}>
            An island in a public GitHub repository where everything was wished for by someone. Open a wish, gather
            thumbs-ups – every morning at 08:59 a Claude routine draws the most-wanted one as pixel art and places it on
            the island. One commit a day.
          </SplitReveal>
          <div className={styles.heroActions}>
            <Magnetic>
              <a href={wishUrl} className="btn btn-accent">
                Make a wish <span className="arrow">→</span>
              </a>
            </Magnetic>
            <Magnetic>
              <Link href="/map" className="btn btn-ghost">
                Walk the island
              </Link>
            </Magnetic>
          </div>
        </div>
        <aside className={`${styles.today} glass`} aria-label="Tonight on the island">
          <div className={styles.todayHead}>
            <span className="eyebrow">Tonight · Day {latest.day}</span>
            <span className="pill">
              <span className="dot" aria-hidden="true" /> live
            </span>
          </div>
          <div className={styles.todayBody}>
            <Link
              href={`/day/${latest.day}`}
              className={styles.todaySprite}
              aria-label={`Day ${latest.day}: ${latest.title}`}
            >
              <Sprite rows={element.sprite} size={88} />
            </Link>
            <div>
              <p className={styles.todayTitle}>{latest.title}</p>
              <p className={styles.todayCredit}>
                <Credit entry={latest} />
              </p>
            </div>
          </div>
          <p className={styles.todayLore}>{latest.lore}</p>
          <div className={styles.todayMeta}>
            <span>
              {stats.open} {stats.open === 1 ? 'star' : 'stars'} waiting
            </span>
            <span>
              next wish in <Countdown />
            </span>
          </div>
        </aside>
      </div>
      <div className={styles.scrollCue} aria-hidden="true">
        SCROLL
        <span />
      </div>
    </SceneSection>
  );
}
