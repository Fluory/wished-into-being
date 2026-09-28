import Link from 'next/link';
import { Sprite, WELL_ICON } from '@/features/sprites';
import styles from './chrome.module.css';
import { Countdown } from './Countdown';

interface Props {
  day: number;
  repo: string;
  wishUrl: string;
  siblings: readonly { name: string; repo: string; site?: string }[];
}

export function SiteFooter({ day, repo, wishUrl, siblings }: Props) {
  const gh = (path = '') => `https://github.com/${repo}${path}`;
  return (
    <footer className={styles.footer}>
      <div className={styles.footerSky} aria-hidden="true" />
      <div className={styles.footerBody}>
        <div className={`container ${styles.footerGrid}`}>
          <div className={styles.footerIntro}>
            <Sprite rows={WELL_ICON} size={56} className={styles.footerWell} />
            <p className={styles.footerTitle}>
              Day {day}.<br />
              <em>Tomorrow, one more wish.</em>
            </p>
            <p className={styles.footerLead}>
              The next wish comes true in <Countdown className="mono" /> – every day at 08:59 in Heilbronn.
            </p>
            <a className="btn btn-accent" href={wishUrl}>
              Make a wish <span className="arrow">→</span>
            </a>
          </div>
          <div className={styles.footerCol}>
            <h2>The island</h2>
            <ul>
              <li>
                <Link href="/">Story</Link>
              </li>
              <li>
                <Link href="/map">Island &amp; timeline</Link>
              </li>
              <li>
                <Link href="/wishes">Every wish</Link>
              </li>
              <li>
                <Link href="/logbook">Logbook</Link>
              </li>
              <li>
                <Link href="/chapters">Chapters</Link>
              </li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h2>Open source</h2>
            <ul>
              <li>
                <a href={gh()}>Repository</a>
              </li>
              <li>
                <a href={gh('/blob/main/ROUTINE.md')}>The daily routine</a>
              </li>
              <li>
                <a href={gh('/blob/main/RULES.md')}>Rules of the island</a>
              </li>
              <li>
                <a href={gh('/blob/main/world/world.json')}>world.json</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h2>Archipelago</h2>
            <ul>
              {siblings.map((s) => (
                <li key={s.repo}>
                  <a href={s.site ?? `https://github.com/${s.repo}`}>{s.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className={`container ${styles.footerBottom}`}>
          <span className={styles.aiBadge}>AI-MAINTAINED · ONE WISH A DAY</span>
          <span>
            Code MIT · island and sprites CC BY 4.0 · <Link href="/impressum">Impressum</Link> ·{' '}
            <Link href="/datenschutz">Datenschutz</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
