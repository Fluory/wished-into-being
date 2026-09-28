'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { World } from '@/features/island';
import { moonPhase, NIGHT } from '@/features/render';
import { useReducedMotion } from '@/shared/motion';
import { CameraRig } from './CameraRig';
import { clock } from './clock';
import { Fireflies } from './Fireflies';
import { Glows } from './Glows';
import { Island } from './Island';
import { boundsAt, glowsOf, tileTimeline, voxelsOf } from './model';
import { Sea } from './Sea';
import { Sky } from './Sky';
import { activeWorld, useScene } from './store';
import { Wishes } from './Wishes';

const FOG = { color: NIGHT.sky2, near: 70, far: 280 };
/** The moon hangs in the north-west, a little above the horizon. */
const MOON_DIR = new THREE.Vector3(-0.6, 0.62, -0.62).normalize();

/** Eases the displayed day towards the requested one – the island grows instead of jumping. */
function DayDirector({ world, still }: { world: World; still: boolean }) {
  const shown = useRef<World | null>(null);
  useFrame((_, delta) => {
    const last = world.days[world.days.length - 1]?.day ?? 0;
    const wanted = useScene.getState().day;
    const target = Math.max(0, Math.min(Number.isFinite(wanted) ? wanted : last, last));
    clock.target = target;
    // a different world (real ↔ simulation) is shown as it is – no easing through unrelated days
    if (shown.current !== world) {
      shown.current = world;
      clock.day = target;
      return;
    }
    const gap = target - clock.day;
    if (still || Math.abs(gap) < 0.0005) {
      clock.day = target;
    } else {
      const dt = Math.min(delta, 0.1);
      const eased = gap * (1 - Math.exp(-dt * 3.5));
      const minimum = Math.sign(gap) * Math.min(Math.abs(gap), dt * 2.5);
      clock.day += Math.abs(eased) > Math.abs(minimum) ? eased : minimum;
    }
  }, -1);
  return null;
}

function Night({ world, still }: { world: World; still: boolean }) {
  const tiles = useMemo(() => tileTimeline(world), [world]);
  const voxels = useMemo(() => voxelsOf(world, tiles), [world, tiles]);
  const glows = useMemo(() => glowsOf(world), [world]);
  const latest = world.days[world.days.length - 1];
  const stars = useMemo(() => latest?.stars ?? [], [latest]);
  const phase = useMemo(() => moonPhase(latest?.date ?? world.genesis), [latest, world.genesis]);
  const bounds = useMemo(() => boundsAt(tiles, latest?.day ?? 0), [tiles, latest]);
  const center = useMemo(() => new THREE.Vector3(bounds.cx, 0, bounds.cz), [bounds]);
  const lighting = useMemo(() => ({ moonDir: MOON_DIR, fog: FOG.color, fogNear: FOG.near, fogFar: FOG.far }), []);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    target.position.copy(center);
    target.updateMatrixWorld();
  }, [center, target]);
  const r = bounds.radius + 6;

  return (
    <>
      <DayDirector world={world} still={still} />
      <primitive object={target} />
      <hemisphereLight args={['#9a9ee8', '#1c1846', 2.1]} />
      <directionalLight
        color="#d4dbff"
        intensity={2.6}
        position={[center.x + MOON_DIR.x * 40, MOON_DIR.y * 40, center.z + MOON_DIR.z * 40]}
        target={target}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-r}
        shadow-camera-right={r}
        shadow-camera-top={r}
        shadow-camera-bottom={-r}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
      <Island tiles={tiles} instant={still} />
      <Wishes voxels={voxels} lighting={lighting} still={still} />
      <Glows glows={glows} still={still} />
      <Sea
        width={world.width}
        height={world.height}
        tiles={tiles}
        moonDir={MOON_DIR}
        fog={FOG.color}
        fogNear={FOG.near}
        fogFar={FOG.far}
        still={still}
      />
      <Sky center={center} moonDir={MOON_DIR} phase={phase} stars={stars} still={still} />
      {!still && <Fireflies center={center} radius={bounds.radius} />}
      <CameraRig tiles={tiles} moonDir={MOON_DIR} still={still} />
    </>
  );
}

export default function SceneCanvas() {
  const world = useScene((s) => activeWorld(s));
  const source = useScene((s) => s.source);
  const dim = useScene((s) => s.dim);
  const still = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (useScene.getState().real) return;
    let cancelled = false;
    fetch('/data/world.json')
      .then((r) => r.json() as Promise<World>)
      .then((w) => {
        if (!cancelled) useScene.getState().set({ real: w });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (source !== 'simulation' || useScene.getState().simulation) return;
    let cancelled = false;
    fetch('/data/simulation.json')
      .then((r) => r.json() as Promise<World>)
      .then((w) => {
        if (!cancelled) useScene.getState().set({ simulation: w });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: ready ? 1 - dim * 0.62 : 0,
        transform: `scale(${1 + dim * 0.03})`,
        transition: 'opacity 900ms cubic-bezier(.22,1,.36,1), transform 900ms cubic-bezier(.22,1,.36,1)',
      }}
    >
      {world && (
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 36, near: 0.1, far: 900, position: [60, 20, 70] }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
            gl.setClearColor(0x000000, 0);
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            requestAnimationFrame(() => setReady(true));
          }}
        >
          <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />
          <Night world={world} still={still} />
        </Canvas>
      )}
    </div>
  );
}
