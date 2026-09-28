'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { hashCell } from '@/features/island';
import { NIGHT } from '@/features/render';
import { appear, clock, easeOutBack } from './clock';
import { GROUND, type Tile } from './model';

const SKIRT = 0.9;

/**
 * The land: one block per tile, rising from the sea on the day the sea raised it. Beach tiles are
 * lower than grass; a tile turns green (and a little taller) on the day it becomes inland.
 */
export function Island({ tiles, instant }: { tiles: readonly Tile[]; instant: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const last = useRef(Number.NaN);
  const colors = useMemo(() => {
    const sand = new THREE.Color(NIGHT.sand1);
    const wet = new THREE.Color(NIGHT.sand0);
    const grass = new THREE.Color(NIGHT.grass2);
    return tiles.map((t) => {
      const jitter = ((hashCell(t.x, t.y, 7) % 100) / 100 - 0.5) * 0.06;
      return {
        sand: sand.clone().lerp(wet, 0.25).offsetHSL(0, 0, jitter),
        grass: grass.clone().offsetHSL(0, 0, jitter * 0.8),
      };
    });
  }, [tiles]);
  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      c: new THREE.Color(),
      s: new THREE.Vector3(),
      p: new THREE.Vector3(),
      q: new THREE.Quaternion(),
    }),
    [],
  );

  useEffect(() => {
    last.current = Number.NaN;
  }, [tiles]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const day = clock.day;
    if (Math.abs(day - last.current) < 0.0005) return;
    last.current = day;
    tiles.forEach((t, i) => {
      const rise = instant ? (day >= t.rose ? 1 : 0) : appear(day, t.rose);
      const green = t.grass === null ? 0 : instant ? (day >= t.grass ? 1 : 0) : appear(day, t.grass);
      const top = rise <= 0 ? -SKIRT : GROUND.sand + (GROUND.grass - GROUND.sand) * green;
      const k = rise <= 0 ? 0.0001 : Math.max(0.0001, easeOutBack(rise));
      const height = (top + SKIRT) * k;
      tmp.p.set(t.x + 0.5, -SKIRT + height / 2, t.y + 0.5);
      tmp.s.set(0.999, Math.max(0.0001, height), 0.999);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      mesh.setMatrixAt(i, tmp.m);
      const pal = colors[i];
      if (pal) mesh.setColorAt(i, tmp.c.copy(pal.sand).lerp(pal.grass, green));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={tiles.length}
      ref={ref}
      args={[undefined, undefined, tiles.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}
