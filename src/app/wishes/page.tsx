import type { Metadata } from 'next';
import { WishGallery } from '@/features/gallery';
import { SceneDirective } from '@/features/scene';
import { getStats, getWishes, SITE } from '@/features/world-data';
import pageStyles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Every wish',
  description: 'Everything on the island, each one a 16 × 16 sprite – who wished for it, and when it came true.',
  alternates: { canonical: '/wishes' },
};

export default function WishesPage() {
  const stats = getStats();
  return (
    <div className={`container ${pageStyles.page}`}>
      <SceneDirective camera="low" dim={0.75} />
      <header className={pageStyles.head}>
        <p className="eyebrow">Every wish</p>
        <h1 className="h2">
          Everything here <em>was wished for.</em>
        </h1>
        <p className="lede">
          {stats.wishes} {stats.wishes === 1 ? 'wish' : 'wishes'} from {stats.wishers}{' '}
          {stats.wishers === 1 ? 'person' : 'people'}, {stats.bottles} {stats.bottles === 1 ? 'message' : 'messages'} in
          a bottle – and the well that started it all.
        </p>
        <p>
          <a href={SITE.wishUrl} className="btn btn-accent">
            Add yours <span className="arrow">→</span>
          </a>
        </p>
      </header>
      <WishGallery items={getWishes()} />
    </div>
  );
}
