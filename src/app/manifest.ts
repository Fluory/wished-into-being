import type { MetadataRoute } from 'next';
import { SITE } from '@/features/world-data';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: 'Wished',
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0b29',
    theme_color: '#0d0b29',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
