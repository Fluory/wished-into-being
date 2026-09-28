import { ICONS, Sprite, type IconName } from '@/features/sprites';
import { Reveal } from '@/shared/motion';
import styles from './HowItWorks.module.css';
import { SceneSection } from './SceneSection';
import { SectionHead } from './SectionHead';

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'issue',
    title: 'Wish',
    text: 'Open an issue with the wish form: one thing for the island, a name, a line about it. Draw it if you like – sixteen by sixteen pixels.',
  },
  {
    icon: 'thumb',
    title: 'Vote',
    text: 'Everyone can add a 👍. Every open wish shines as a star above the island; the more thumbs, the brighter.',
  },
  {
    icon: 'lantern',
    title: 'Come true',
    text: 'At 08:59 Claude grants the most-wanted wish that fits the rules, draws it, finds it a place and writes it into the logbook – with your name.',
  },
  {
    icon: 'bottle',
    title: 'Or a bottle',
    text: 'On days when no wish fits, the islanders send a message in a bottle and wish for something themselves.',
  },
];

export function HowItWorks({ wishUrl }: { wishUrl: string }) {
  return (
    <SceneSection
      className="section"
      camera="overview"
      shift={-0.2}
      dim={0.1}
      mobileShiftY={-0.1}
      labelledBy="how-title"
    >
      <div className={`container ${styles.layout}`}>
        <div className={styles.copy}>
          <SectionHead
            eyebrow="How a wish comes true"
            title="Anyone can wish. The island decides what fits."
            id="how-title"
          >
            One wish becomes real every day – the one most people want, as long as the island has room for it.
            Everything else waits as a star.
          </SectionHead>
          <Reveal className={styles.steps} stagger="a">
            {STEPS.map((step, i) => (
              <article key={step.title} className={`${styles.step} glass`}>
                <span className={styles.icon}>
                  <Sprite rows={ICONS[step.icon]} size={48} />
                </span>
                <span className={styles.number}>0{i + 1}</span>
                <h3 className={styles.title}>{step.title}</h3>
                <p className={styles.text}>{step.text}</p>
              </article>
            ))}
          </Reveal>
          <p className={styles.more}>
            <a href={wishUrl} className="btn btn-accent">
              Open a wish <span className="arrow">→</span>
            </a>
          </p>
        </div>
      </div>
    </SceneSection>
  );
}
