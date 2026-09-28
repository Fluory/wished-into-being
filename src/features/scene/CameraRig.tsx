'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clock } from './clock';
import { boundsAt, type Tile } from './model';
import { useScene } from './store';

interface Props {
  tiles: readonly Tile[];
  moonDir: THREE.Vector3;
  still: boolean;
}

interface Shot {
  dist: number;
  polar: number;
  /** Target offset in units of the island radius (x, y, z). */
  lift: number;
  /** Absolute target height above the island. */
  look: number;
}

/**
 * The camera follows shots (hero, overview, top, focus, far, sky, low) instead of free controls –
 * pages direct it, the rig eases between shots. A slow orbit and a little pointer parallax keep
 * it alive; on portrait screens it steps back so the island fits.
 */
export function CameraRig({ tiles, moonDir, still }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const azimuth = useRef(0.9);
  const current = useRef({ pos: new THREE.Vector3(60, 20, 70), target: new THREE.Vector3(32, 0, 32), ready: false });
  const bounds = useRef({ day: Number.NaN, cx: 32, cz: 32, radius: 3 });
  const shift = useRef({ x: 0, y: 0 });
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3() }), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    bounds.current.day = Number.NaN;
  }, [tiles]);

  useFrame((_, delta) => {
    const { camera: preset, focus, orbit, shift: wantShift, shiftY: wantShiftY } = useScene.getState();
    const dt = Math.min(delta, 0.1);
    const day = Math.round(clock.day);
    if (day !== bounds.current.day) bounds.current = { day, ...boundsAt(tiles, day) };
    const { cx, cz, radius } = bounds.current;
    if (orbit && !still) azimuth.current += dt * 0.035;
    const p = pointer.current;
    p.x += (p.tx - p.x) * (1 - Math.exp(-dt * 3));
    p.y += (p.ty - p.y) * (1 - Math.exp(-dt * 3));

    const portrait = size.width / size.height < 0.9;
    const r = Math.max(4, radius);
    const shots: Record<string, Shot> = {
      hero: { dist: r * 2.5 + 8, polar: 1.16, lift: 0, look: 1.1 },
      overview: { dist: r * 3 + 9, polar: 0.98, lift: 0, look: 0.4 },
      top: { dist: r * 3.6 + 12, polar: 0.28, lift: 0, look: 0 },
      far: { dist: r * 7 + 26, polar: 1.3, lift: 0, look: 3 },
      sky: { dist: r * 2.2 + 8, polar: 1.42, lift: 0, look: r * 1.9 + 9 },
      low: { dist: r * 2.1 + 6, polar: 1.38, lift: 0, look: 2.2 },
      focus: { dist: 7.5, polar: 1.08, lift: 0, look: 0.7 },
    };
    const shot = shots[preset] ?? (shots.hero as Shot);
    tmp.target.set(cx, shot.look, cz);
    if (preset === 'focus' && focus) tmp.target.set(focus.x + 0.5, shot.look, focus.y + 0.5);
    const dist = shot.dist * (portrait ? 1.45 : 1);
    // the sky shot looks towards the moon, which sits to the upper right of the picture
    const skyward = Math.atan2(-moonDir.z, -moonDir.x) - 0.5;
    const az = (preset === 'sky' ? skyward : azimuth.current) + (still ? 0 : p.x * 0.16);
    const po = THREE.MathUtils.clamp(shot.polar + (still ? 0 : p.y * 0.04), 0.1, 1.5);
    const base = preset === 'sky' ? tmp.target.clone().setY(1.2) : tmp.target;
    tmp.pos.set(
      base.x + dist * Math.sin(po) * Math.cos(az),
      base.y + dist * Math.cos(po),
      base.z + dist * Math.sin(po) * Math.sin(az),
    );

    const c = current.current;
    const k = c.ready ? 1 - Math.exp(-dt * (still ? 20 : 2.2)) : 1;
    c.pos.lerp(tmp.pos, k);
    c.target.lerp(tmp.target, k);
    c.ready = true;
    camera.position.copy(c.pos);
    camera.lookAt(c.target);

    const sh = shift.current;
    sh.x += (wantShift - sh.x) * (1 - Math.exp(-dt * 3));
    sh.y += (wantShiftY - sh.y) * (1 - Math.exp(-dt * 3));
    if (Math.abs(sh.x) > 0.001 || Math.abs(sh.y) > 0.001) {
      camera.setViewOffset(size.width, size.height, -sh.x * size.width, -sh.y * size.height, size.width, size.height);
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }
  });

  return null;
}
