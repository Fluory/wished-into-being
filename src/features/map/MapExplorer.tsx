'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, KIND_INFO, worldAt, type DayEntry, type Element, type World } from '@/features/island';
import { chooseFrame, NIGHT, paintIsland, TILE, toRgba } from '@/features/render';
import { useScene } from '@/features/scene';
import { Sprite } from '@/features/sprites';
import { Credit } from '@/features/story';
import styles from './map.module.css';

interface Hover {
  x: number;
  y: number;
  px: number;
  py: number;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

function elementAt(world: World, x: number, y: number): { element: Element; entry: DayEntry } | null {
  const element = world.elements.find((e) => e.x === x && e.y === y);
  const entry = element ? world.days.find((d) => d.element === element.id) : undefined;
  return element && entry ? { element, entry } : null;
}

/**
 * The interactive pixel map: zoom, pan, hover for the wish on a tile, and a timeline that
 * rebuilds the island for any day. The 3D scene behind follows the slider.
 */
export function MapExplorer({ world }: { world: World }) {
  const last = world.days[world.days.length - 1]?.day ?? 0;
  const frame = useMemo(() => {
    const f = chooseFrame(world);
    const min = 20;
    if (f.size >= min || world.width < min) return f;
    const grow = min - f.size;
    const clamp = (v: number) => Math.max(0, Math.min(world.width - min, v));
    return { x: clamp(f.x - Math.floor(grow / 2)), y: clamp(f.y - Math.floor(grow / 2)), size: min };
  }, [world]);
  const [day, setDay] = useState(last);
  const [zoom, setZoom] = useState(3);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<Hover | null>(null);
  const [pinned, setPinned] = useState<{ x: number; y: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bitmap = useRef<HTMLCanvasElement | null>(null);
  const seaColor = useRef<string>(NIGHT.sea0);
  const tight = useMemo(() => chooseFrame(world).size * TILE, [world]);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  const shown = useMemo(() => worldAt(world, day), [world, day]);
  const size = frame.size * TILE;

  const draw = useCallback(() => {
    const c = canvas.current;
    const off = bitmap.current;
    if (!c || !off) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = seaColor.current;
    ctx.fillRect(0, 0, c.width, c.height);
    const scale = zoom * dpr;
    const ox = Math.round(c.width / 2 - (size * scale) / 2 + pan.x * dpr);
    const oy = Math.round(c.height / 2 - (size * scale) / 2 + pan.y * dpr);
    ctx.drawImage(off, ox, oy, size * scale, size * scale);
  }, [zoom, pan, size]);

  const pinnedElement = pinned ? elementAt(shown, pinned.x, pinned.y)?.element.id : undefined;

  // Paint the island for the chosen day into an offscreen bitmap (1 pixel = 1 art pixel).
  useEffect(() => {
    const painted = paintIsland(shown, { frame, sky: false, highlight: pinnedElement ?? null });
    const rgba = toRgba(
      [painted.base, painted.overlays.waveA, painted.overlays.glow, painted.overlays.mark],
      NIGHT.sea0,
    );
    const off = document.createElement('canvas');
    off.width = painted.width;
    off.height = painted.height;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), painted.width, painted.height), 0, 0);
    bitmap.current = off;
    seaColor.current = NIGHT.sea0;
    draw();
  }, [shown, frame, pinnedElement, draw]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  // Start with the whole island in view.
  useEffect(() => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect) return;
    const fit = (Math.min(rect.width, rect.height) / tight) * 0.92;
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fit)));
  }, [tight]);

  // The 3D island behind the glass follows the timeline.
  useEffect(() => {
    useScene
      .getState()
      .set({ day, source: 'real', camera: 'top', dim: 0.55, orbit: false, shift: 0, shiftY: 0, focus: null });
  }, [day]);
  useEffect(() => () => useScene.getState().set({ day: Infinity, dim: 0, orbit: true, camera: 'hero' }), []);

  // Playback: a day every ~120 ms.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setDay((d) => {
        if (d >= last) {
          setPlaying(false);
          return last;
        }
        return d + 1;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [playing, last]);

  const tileAt = (clientX: number, clientY: number) => {
    const c = canvas.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const ox = rect.width / 2 - (size * zoom) / 2 + pan.x;
    const oy = rect.height / 2 - (size * zoom) / 2 + pan.y;
    const tx = Math.floor((clientX - rect.left - ox) / (zoom * TILE)) + frame.x;
    const ty = Math.floor((clientY - rect.top - oy) / (zoom * TILE)) + frame.y;
    if (tx < frame.x || ty < frame.y || tx >= frame.x + frame.size || ty >= frame.y + frame.size) return null;
    return { x: tx, y: ty, px: clientX - rect.left, py: clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, moved: false };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      if (d.moved) setPan({ x: d.panX + dx, y: d.panY + dy });
      return;
    }
    setHover(tileAt(e.clientX, e.clientY));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d && !d.moved) {
      const t = tileAt(e.clientX, e.clientY);
      setPinned(t ? { x: t.x, y: t.y } : null);
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 40;
    if (e.key === 'ArrowLeft') setPan((p) => ({ ...p, x: p.x + step }));
    else if (e.key === 'ArrowRight') setPan((p) => ({ ...p, x: p.x - step }));
    else if (e.key === 'ArrowUp') setPan((p) => ({ ...p, y: p.y + step }));
    else if (e.key === 'ArrowDown') setPan((p) => ({ ...p, y: p.y - step }));
    else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(MAX_ZOOM, z * 1.2));
    else if (e.key === '-') setZoom((z) => Math.max(MIN_ZOOM, z / 1.2));
    else return;
    e.preventDefault();
  };

  const current = world.days.find((d) => d.day === day) ?? [...world.days].reverse().find((d) => d.day <= day);
  const currentElement = current ? world.elements.find((e) => e.id === current.element) : undefined;
  const focusTile = pinned ?? (hover ? { x: hover.x, y: hover.y } : null);
  const focus = focusTile ? elementAt(shown, focusTile.x, focusTile.y) : null;
  const terrain = focusTile ? shown.terrain[focusTile.y]?.[focusTile.x] : undefined;
  const terrainName = terrain === '~' ? 'open sea' : terrain === '.' ? 'beach' : terrain === ',' ? 'meadow' : '';

  return (
    <div className={styles.explorer}>
      <div className={`${styles.stage} glass`}>
        <canvas
          ref={canvas}
          className={styles.canvas}
          tabIndex={0}
          role="img"
          aria-label={`Pixel map of the island on day ${day}. Drag to pan, scroll or +/- to zoom, click a tile to see the wish on it.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setHover(null)}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        />
        {hover && !dragging && (
          <div
            className={`${styles.tooltip} glass glass-strong`}
            style={{ left: hover.px + 16, top: hover.py + 16 }}
            aria-hidden="true"
          >
            <span className="pixel">
              {hover.x},{hover.y}
            </span>{' '}
            {elementAt(shown, hover.x, hover.y)?.element.name ?? (terrain === '~' ? 'open sea' : 'free land')}
          </div>
        )}
        <div className={styles.zoom}>
          <button type="button" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))} aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25))} aria-label="Zoom out">
            −
          </button>
          <button
            type="button"
            onClick={() => {
              const rect = canvas.current?.getBoundingClientRect();
              setZoom(
                rect ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (Math.min(rect.width, rect.height) / tight) * 0.92)) : 3,
              );
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Reset view"
          >
            ⟲
          </button>
        </div>
      </div>

      <div className={`${styles.timeline} glass`}>
        <button
          type="button"
          className={styles.play}
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
          aria-label={playing ? 'Pause' : 'Play the island from the well'}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <label className={styles.slider}>
          <span className="visually-hidden">Day</span>
          <input
            type="range"
            min={0}
            max={last}
            step={1}
            value={day}
            onChange={(e) => {
              setPlaying(false);
              setDay(Number(e.target.value));
            }}
            aria-valuetext={`Day ${day}${current ? `: ${current.title}` : ''}`}
            disabled={last === 0}
          />
        </label>
        <div className={styles.dayLabel} aria-live="polite">
          <span className="pixel">DAY {String(day).padStart(3, '0')}</span>
          <span className="muted">{current ? formatDate(current.date) : ''}</span>
        </div>
      </div>

      <aside className={`${styles.panel} glass`} aria-label="Tile details">
        {focusTile ? (
          <>
            <p className="eyebrow">
              Tile {focusTile.x}, {focusTile.y} · {terrainName}
            </p>
            {focus ? (
              <Link href={`/day/${focus.entry.day}`} className={styles.wish}>
                <Sprite rows={focus.element.sprite} size={72} />
                <span>
                  <span className={styles.panelTitle}>{focus.element.name}</span>
                  <span className="muted">
                    Day {focus.entry.day} · {KIND_INFO[focus.element.kind].label} ·{' '}
                    <Credit entry={focus.entry} short links={false} />
                  </span>
                  <span className={styles.wishLore}>{focus.entry.lore}</span>
                </span>
              </Link>
            ) : (
              <p className="muted">
                {terrain === '~' ? 'Open sea – for now.' : 'Free land – room for a wish.'}
                {day < last ? ' (on this day)' : ''}
              </p>
            )}
            {pinned && (
              <button type="button" className="btn btn-ghost" onClick={() => setPinned(null)}>
                Unpin tile
              </button>
            )}
          </>
        ) : current ? (
          <>
            <p className="eyebrow">Day {current.day}</p>
            <div className={styles.wish}>
              {currentElement && <Sprite rows={currentElement.sprite} size={72} />}
              <span>
                <span className={styles.panelTitle}>{current.title}</span>
                <span className="muted">
                  <Credit entry={current} short links={false} />
                </span>
                <span className={styles.wishLore}>{current.lore}</span>
              </span>
            </div>
            <p className="muted" style={{ fontSize: 'var(--step--1)' }}>
              Hover or click a tile to see the wish on it.
            </p>
          </>
        ) : null}
      </aside>
    </div>
  );
}
