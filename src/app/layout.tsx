import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Figtree, JetBrains_Mono, Silkscreen } from 'next/font/google';
import { ViewTransition } from 'react';
import { SiteFooter, SiteHeader } from '@/features/chrome';
import { SceneRoot } from '@/features/scene';
import { getLatest, getStats, SITE, siteUrl } from '@/features/world-data';
import { SmoothScroll } from '@/shared/motion';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });
const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-silkscreen',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const latest = getLatest();
  const stats = getStats();
  return {
    metadataBase: siteUrl(),
    title: { default: `${SITE.name} – an island made of wishes`, template: `%s · ${SITE.name}` },
    description: SITE.description,
    applicationName: SITE.name,
    authors: [{ name: 'Florian Hein', url: 'https://github.com/Fluory' }],
    keywords: [
      'pixel art',
      'community',
      'wishes',
      'GitHub issues',
      'Claude',
      'routine',
      'one commit a day',
      'open source',
    ],
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: `${SITE.name} · Day ${latest.day}: ${latest.title}`,
      description: `${latest.lore} – ${stats.wishes} wishes granted, ${stats.open} stars still waiting.`,
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: '/' },
  };
}

export const viewport: Viewport = {
  themeColor: '#0d0b29',
  colorScheme: 'dark',
};

const JS_SCRIPT = `document.documentElement.classList.add('js');`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const latest = getLatest();
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${figtree.variable} ${silkscreen.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SceneRoot />
        <SmoothScroll>
          <SiteHeader day={latest.day} repo={SITE.repo} wishUrl={SITE.wishUrl} />
          <ViewTransition default="page">
            <main id="main" style={{ position: 'relative', zIndex: 1 }}>
              {children}
            </main>
          </ViewTransition>
          <SiteFooter day={latest.day} repo={SITE.repo} wishUrl={SITE.wishUrl} siblings={SITE.siblings} />
        </SmoothScroll>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
