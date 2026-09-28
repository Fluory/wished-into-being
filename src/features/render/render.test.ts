import { unzlibSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { applyDay, BOTTLE_SPRITES, createGenesis, simulateBottles } from '@/features/island';
import { wish } from '@/features/island/testing';
import { PixelCanvas } from './canvas';
import { renderElementSvg } from './element-svg';
import { chooseFrame, paintIsland } from './paint';
import { encodePng } from './png';
import { moonPhase } from './sky';
import { renderSpriteSvg } from './sprite-svg';
import { renderIsleSvg } from './svg';

const stars = [
  { issue: 12, votes: 9 },
  { issue: 15, votes: 4 },
  { issue: 18, votes: 0 },
];
const world = applyDay(simulateBottles(createGenesis('2026-09-28'), 30), wish({ stars }), '2026-10-29').world;

describe('the README picture', () => {
  it('is deterministic and describes the day', () => {
    const svg = renderIsleSvg(world);
    expect(renderIsleSvg(world)).toBe(svg);
    expect(svg).toContain('<title id="t">Wished into Being – Day 31: A glass lantern</title>');
    expect(svg).toContain('data:image/png;base64,');
    expect(svg.length).toBeLessThan(200_000);
  });

  it('frames the whole island with open sea around it', () => {
    const frame = chooseFrame(world);
    for (const e of world.elements) {
      expect(e.x).toBeGreaterThanOrEqual(frame.x + 3);
      expect(e.x).toBeLessThan(frame.x + frame.size - 3);
    }
  });

  it('puts one star in the sky for every waiting wish, the most wanted one biggest', () => {
    const painted = paintIsland(world);
    expect(painted.stars).toHaveLength(3);
    expect(painted.stars.find((s) => s.issue === 12)).toMatchObject({ rank: 0, size: 3 });
    expect(painted.stars.find((s) => s.issue === 18)).toMatchObject({ size: 1 });
    for (const s of painted.stars) expect(s.y).toBeLessThan(painted.sky);
  });

  it('knows the phase of the moon', () => {
    expect(moonPhase('2024-01-25')).toBeCloseTo(0.5, 1);
    expect(Math.min(moonPhase('2024-01-11'), 1 - moonPhase('2024-01-11'))).toBeLessThan(0.04);
  });
});

describe('PNG layers', () => {
  it('encode palette indices losslessly', () => {
    const canvas = new PixelCanvas(5, 3);
    canvas.put(0, 0, '#ff0000');
    canvas.put(4, 2, '#00ff0080');
    const png = encodePng(canvas);
    expect([...png.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const text = new TextDecoder('latin1').decode(png);
    const at = text.indexOf('IDAT');
    const length = new DataView(png.buffer).getUint32(at - 4);
    const raw = unzlibSync(png.slice(at + 4, at + 4 + length));
    expect(raw).toHaveLength((5 + 1) * 3);
    expect(raw[1]).toBe(1);
    expect(raw[2 * 6 + 5]).toBe(2);
    expect(raw[1 * 6 + 3]).toBe(0);
  });
});

describe('sprites on their own', () => {
  const lantern = BOTTLE_SPRITES.lantern ?? [];
  it('render large with numbered rows for review', () => {
    const svg = renderSpriteSvg(lantern);
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('#ffd45e');
  });
  it('render small in true colours for the logbook', () => {
    const svg = renderElementSvg(lantern, 'A "lantern" <for> the path');
    expect(svg).toContain('viewBox="0 0 16 16"');
    expect(svg).toContain('aria-label="A &quot;lantern&quot; &lt;for&gt; the path"');
  });
});
