'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { KIND_INFO, KINDS, type DayEntry, type Element, type Kind } from '@/features/island';
import { Sprite } from '@/features/sprites';
import styles from './WishGallery.module.css';

type Filter = 'all' | 'wishes' | 'bottles' | Kind;

interface Item {
  entry: DayEntry;
  element: Element;
}

/** Every thing on the island as a sprite card, filterable by kind and by who wished it. */
export function WishGallery({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const counts = useMemo(() => {
    const out: Record<string, number> = { all: items.length, wishes: 0, bottles: 0 };
    for (const { entry, element } of items) {
      if (entry.action === 'wish') out.wishes = (out.wishes ?? 0) + 1;
      if (entry.action === 'bottle') out.bottles = (out.bottles ?? 0) + 1;
      out[element.kind] = (out[element.kind] ?? 0) + 1;
    }
    return out;
  }, [items]);
  const shown = items.filter(({ entry, element }) =>
    filter === 'all'
      ? true
      : filter === 'wishes'
        ? entry.action === 'wish'
        : filter === 'bottles'
          ? entry.action === 'bottle'
          : element.kind === filter,
  );
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Everything' },
    { id: 'wishes', label: 'Wished by people' },
    { id: 'bottles', label: 'Messages in a bottle' },
    ...KINDS.map((k) => ({ id: k as Filter, label: KIND_INFO[k].plural.replace(/^./, (c) => c.toUpperCase()) })),
  ];
  return (
    <div className={styles.gallery}>
      <div className={styles.filters} role="group" aria-label="Filter the wishes">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={styles.filter}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            disabled={(counts[f.id] ?? 0) === 0}
          >
            {f.label} <span className={styles.count}>{counts[f.id] ?? 0}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="muted">Nothing of this kind yet – it could be your wish.</p>
      ) : (
        <ul className={styles.grid}>
          {shown.map(({ entry, element }) => (
            <li key={element.id}>
              <Link href={`/day/${entry.day}`} className={`${styles.card} glass`}>
                <span className={styles.sprite}>
                  <Sprite rows={element.sprite} size={88} />
                </span>
                <span className={styles.day}>DAY {String(entry.day).padStart(3, '0')}</span>
                <span className={styles.name}>{element.name}</span>
                <span className={styles.credit}>
                  {entry.action === 'wish'
                    ? `@${entry.wisher} · ${entry.votes ?? 0} 👍`
                    : entry.action === 'bottle'
                      ? 'message in a bottle'
                      : 'the beginning'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
