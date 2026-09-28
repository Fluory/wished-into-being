import type { Star } from '@/features/island';
import { Reveal } from '@/shared/motion';
import { issueUrl } from '@/shared/repo';
import { SceneSection } from './SceneSection';
import { SectionHead } from './SectionHead';
import styles from './WishStars.module.css';

/** The sky above the island: every open wish, brightest first. */
export function WishStars({ stars, wishUrl }: { stars: readonly Star[]; wishUrl: string }) {
  const max = Math.max(1, ...stars.map((s) => s.votes));
  return (
    <SceneSection className="section" camera="sky" dim={0} labelledBy="stars-title">
      <div className="container">
        <SectionHead eyebrow="The sky" title="Every star is a wish that has not come true yet." id="stars-title">
          The brightest one – the wish with the most 👍 that fits the island – comes true next morning. Add your thumb
          to the ones you want to see.
        </SectionHead>
        {stars.length > 0 ? (
          <Reveal as="ol" className={styles.stars} stagger="a">
            {stars.map((s, i) => (
              <li key={s.issue}>
                <a className={`${styles.star} glass`} href={issueUrl(s.issue)}>
                  <span
                    className={styles.glyph}
                    style={{ '--size': `${14 + (s.votes / max) * 22}px` } as React.CSSProperties}
                    aria-hidden="true"
                  />
                  <span className={styles.issue}>#{s.issue}</span>
                  <span className={styles.votes}>
                    {s.votes} {s.votes === 1 ? 'vote' : 'votes'}
                  </span>
                  {i === 0 && <span className={styles.next}>next</span>}
                </a>
              </li>
            ))}
          </Reveal>
        ) : (
          <div className={`${styles.empty} glass`}>
            <p className={styles.emptyTitle}>The sky is still empty.</p>
            <p className="muted">No wish is waiting right now – yours would be the brightest star tonight.</p>
            <a href={wishUrl} className="btn btn-accent">
              Make the first wish <span className="arrow">→</span>
            </a>
          </div>
        )}
      </div>
    </SceneSection>
  );
}
