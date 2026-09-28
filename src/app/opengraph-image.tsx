import { ImageResponse } from 'next/og';
import { renderIsleSvg } from '@/features/render';
import { getLatest, getStats, getWorld } from '@/features/world-data';

export const alt = 'Tonight on Wished into Being – an island where everything was wished for by someone';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social preview: tonight's island next to the day's wish. Regenerated with every deployment. */
export default function OpenGraphImage() {
  const latest = getLatest();
  const stats = getStats();
  const svg = renderIsleSvg(getWorld(), { caption: false, animated: false });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  const [, w = '1024', h = '1024'] = /viewBox="0 0 (\d+) (\d+)"/.exec(svg) ?? [];
  const height = 534;
  const width = Math.round((height * Number(w)) / Number(h));
  const credit =
    latest.action === 'wish'
      ? `wished by @${latest.wisher}`
      : latest.action === 'bottle'
        ? 'a message in a bottle'
        : 'the well is waiting for the first wish';
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: 'linear-gradient(160deg, #07061a 0%, #161339 55%, #2e2763 100%)',
        padding: 48,
        gap: 56,
        alignItems: 'center',
        fontFamily: 'serif',
      }}
    >
      <img
        src={src}
        width={width}
        height={height}
        alt=""
        style={{ borderRadius: 24, boxShadow: '0 30px 70px rgba(0,0,0,.55)' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        <div
          style={{ fontSize: 24, letterSpacing: 4, color: '#ffd45e', fontFamily: 'monospace' }}
        >{`DAY ${latest.day}`}</div>
        <div style={{ fontSize: 80, lineHeight: 0.92, color: '#f4ead0', fontWeight: 600 }}>Wished into Being.</div>
        <div style={{ fontSize: 38, lineHeight: 1.15, color: '#f4ead0' }}>{latest.title}</div>
        <div style={{ fontSize: 26, color: '#ffd45e' }}>{credit}</div>
        <div
          style={{ fontSize: 22, color: '#a79fd0' }}
        >{`${stats.wishes} wishes granted · ${stats.open} stars waiting · one commit a day`}</div>
      </div>
    </div>,
    size,
  );
}
