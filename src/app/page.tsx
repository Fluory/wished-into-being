import { ChapterCards } from '@/features/chapters';
import {
  Archipelago,
  daysLite,
  GalleryTeaser,
  Hero,
  HowItWorks,
  LogbookPreview,
  RoutineSection,
  SceneSection,
  SectionHead,
  Timelapse,
  WishStars,
} from '@/features/story';
import { getElement, getLatest, getStars, getStats, getWishes, getWorld, repoUrl, SITE } from '@/features/world-data';

export default function HomePage() {
  const world = getWorld();
  const latest = getLatest();
  const stats = getStats();
  const wishes = getWishes();
  const element = getElement(latest.element) ?? world.elements[0];
  if (!element) throw new Error('the island has no elements');

  return (
    <>
      <Hero latest={latest} element={element} stats={stats} wishUrl={SITE.wishUrl} />
      <HowItWorks wishUrl={SITE.wishUrl} />
      <WishStars stars={getStars()} wishUrl={SITE.wishUrl} />
      <Timelapse real={daysLite(world)} />
      <GalleryTeaser items={wishes.slice(0, 8)} total={wishes.length} />
      <RoutineSection routineUrl={repoUrl('blob/main/ROUTINE.md')} />
      <LogbookPreview entries={wishes.slice(0, 5)} />
      <SceneSection className="section" camera="hero" dim={0.35} labelledBy="chapters-title">
        <div className="container">
          <SectionHead eyebrow="Chapters" title="How it works, in four short stories." id="chapters-title" />
          <ChapterCards />
        </div>
      </SceneSection>
      <Archipelago />
    </>
  );
}
