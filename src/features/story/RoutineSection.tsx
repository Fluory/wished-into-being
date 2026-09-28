import type { ReactNode } from 'react';
import { Reveal } from '@/shared/motion';
import styles from './RoutineSection.module.css';
import { SceneSection } from './SceneSection';
import { SectionHead } from './SectionHead';

const STEPS: { time: string; text: ReactNode }[] = [
  { time: '08:59', text: 'A scheduled Claude routine wakes up in the cloud with a fresh copy of the repository.' },
  {
    time: '+0:01',
    text: 'A read-only helper lists the open wishes and their 👍 and hands back plain data – nothing else.',
  },
  {
    time: '+0:03',
    text: (
      <>
        The most-wanted wish that fits is drawn, checked and placed with <code className="mono">npm run day</code> – the
        code enforces every rule.
      </>
    ),
  },
  {
    time: '+0:06',
    text: 'Exactly one commit: the world, the picture, the sprite and a line in the logbook. The wisher is its co-author.',
  },
  {
    time: '+0:12',
    text: 'CI checks it; if it only touches the island, it merges by itself. The wish issue closes with a thank-you.',
  },
];

const GUARDS = [
  {
    title: 'Words are not orders',
    text: 'Wishes are read by a helper that can only read issues and must answer in a fixed format. “Ignore your instructions” in an issue is just a strange wish.',
  },
  {
    title: 'The code has the last word',
    text: 'Room, ground, sprite, name and lore are checked by the island engine. A wish that breaks a rule cannot be written, however it is asked.',
  },
  {
    title: 'A kind island',
    text: 'Nothing hurtful, no politics, no real people, no brands or links. Declined wishes get one friendly comment saying why.',
  },
  {
    title: 'One day, one commit',
    text: 'The routine refuses a second wish on the same day. A day that fails stays empty – a missing day is better than a broken one.',
  },
];

export function RoutineSection({ routineUrl }: { routineUrl: string }) {
  return (
    <SceneSection className="section" camera="far" dim={0.45} labelledBy="routine-title">
      <div className="container">
        <SectionHead eyebrow="The routine" title="Every morning at 08:59, one wish comes true." id="routine-title">
          No server, no database: a scheduled Claude session, a command-line tool that knows the rules, and GitHub.
        </SectionHead>
        <div className={styles.layout}>
          <Reveal as="ol" className={styles.timeline} stagger="li">
            {STEPS.map((s) => (
              <li key={s.time} className={styles.step}>
                <span className={styles.time}>{s.time}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </Reveal>
          <Reveal className={styles.guards} stagger="article">
            {GUARDS.map((g) => (
              <article key={g.title} className={`${styles.guard} glass`}>
                <h3 className={styles.guardTitle}>{g.title}</h3>
                <p className={styles.guardText}>{g.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
        <p className={styles.more}>
          <a href={routineUrl} className="btn btn-ghost">
            Read ROUTINE.md <span className="arrow">→</span>
          </a>
        </p>
      </div>
    </SceneSection>
  );
}
