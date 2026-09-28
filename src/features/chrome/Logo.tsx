import { Sprite, STAR } from '@/features/sprites';

/** The brand mark: a wish-star in the sprite palette. */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return <Sprite rows={STAR} size={size} className={className} />;
}
