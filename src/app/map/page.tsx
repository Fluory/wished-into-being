import type { Metadata } from 'next';
import { MapExplorer } from '@/features/map';
import { getWorld } from '@/features/world-data';
import pageStyles from '../page.module.css';

export const metadata: Metadata = {
  title: 'The island',
  description:
    'The pixel island tile by tile: zoom in, scrub through every day since the well and see who wished for what.',
  alternates: { canonical: '/map' },
};

export default function MapPage() {
  return (
    <div className={`container ${pageStyles.page}`}>
      <header className={pageStyles.head}>
        <p className="eyebrow">The island</p>
        <h1 className="h2">
          Every tile has <em>a wish.</em>
        </h1>
        <p className="lede">
          Drag the timeline back to the well or press play. Click any tile to see what was wished for there.
        </p>
      </header>
      <MapExplorer world={getWorld()} />
    </div>
  );
}
