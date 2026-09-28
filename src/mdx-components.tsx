import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import {
  Bottles,
  Callout,
  GrowthNumbers,
  IslandFigure,
  KindTable,
  Palette,
  SpriteSource,
} from '@/features/chapters/mdx/components';

const components: MDXComponents = {
  a: ({ href = '', children, ...rest }) =>
    href.startsWith('/') ? (
      <Link href={href} className="link" {...rest}>
        {children}
      </Link>
    ) : (
      <a href={href} className="link" {...rest}>
        {children}
      </a>
    ),
  Bottles,
  Callout,
  GrowthNumbers,
  IslandFigure,
  KindTable,
  Palette,
  SpriteSource,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
