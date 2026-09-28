'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clock } from './clock';
import type { Glow } from './model';

const haloVertex = /* glsl */ `
  attribute float aStrength;
  attribute vec2 aInfo;
  uniform float uDay;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    float on = clamp(uDay - aInfo.x + 1.0, 0.0, 1.0);
    float flicker = 0.82 + 0.18 * sin(uTime * 2.1 + aInfo.y * 40.0) * sin(uTime * 3.7 + aInfo.y * 13.0);
    vAlpha = on * aStrength * flicker;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uScale * (0.8 + aStrength * 1.8) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const haloFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = pow(max(0.0, 1.0 - d), 2.4) * vAlpha;
    gl_FragColor = vec4(vec3(1.0, 0.78, 0.38) * a, a);
  }
`;

const poolVertex = /* glsl */ `
  attribute vec3 aCenter;
  attribute vec3 aInfo;
  uniform float uDay;
  uniform float uTime;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    float on = clamp(uDay - aInfo.x + 1.0, 0.0, 1.0);
    vAlpha = on * aInfo.y * (0.9 + 0.1 * sin(uTime * 1.7 + aInfo.z * 30.0));
    vUv = uv;
    float radius = 0.9 + aInfo.y * 1.9;
    vec3 world = aCenter + vec3(position.x * radius, 0.0, position.y * radius);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const poolFragment = /* glsl */ `
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(max(0.0, 1.0 - d), 1.8) * vAlpha * 0.55;
    gl_FragColor = vec4(vec3(1.0, 0.72, 0.32) * a, a);
  }
`;

/** Warm light at night: a soft halo around every light, and a pool of light on the ground below it. */
export function Glows({ glows, still }: { glows: readonly Glow[]; still: boolean }) {
  const halo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        glows.flatMap((l) => [l.x, l.y, l.z]),
        3,
      ),
    );
    g.setAttribute(
      'aStrength',
      new THREE.Float32BufferAttribute(
        glows.map((l) => l.strength),
        1,
      ),
    );
    g.setAttribute(
      'aInfo',
      new THREE.Float32BufferAttribute(
        glows.flatMap((l) => [l.day, l.seed]),
        2,
      ),
    );
    return g;
  }, [glows]);
  const pools = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = plane.index;
    g.setAttribute('position', plane.getAttribute('position'));
    g.setAttribute('uv', plane.getAttribute('uv'));
    const lights = glows.filter((l) => l.strength > 0.3);
    g.setAttribute(
      'aCenter',
      new THREE.InstancedBufferAttribute(new Float32Array(lights.flatMap((l) => [l.x, 0.53, l.z])), 3),
    );
    g.setAttribute(
      'aInfo',
      new THREE.InstancedBufferAttribute(new Float32Array(lights.flatMap((l) => [l.day, l.strength, l.seed])), 3),
    );
    g.instanceCount = lights.length;
    return g;
  }, [glows]);

  const materials = useMemo(() => {
    const common = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true };
    return {
      halo: new THREE.ShaderMaterial({
        vertexShader: haloVertex,
        fragmentShader: haloFragment,
        uniforms: { uDay: { value: 0 }, uTime: { value: 0 }, uScale: { value: 900 } },
        ...common,
      }),
      pool: new THREE.ShaderMaterial({
        vertexShader: poolVertex,
        fragmentShader: poolFragment,
        uniforms: { uDay: { value: 0 }, uTime: { value: 0 } },
        ...common,
      }),
    };
  }, []);

  useFrame(({ size }, delta) => {
    for (const m of [materials.halo, materials.pool]) {
      const u = m.uniforms;
      if (u.uDay) u.uDay.value = clock.day;
      if (u.uTime && !still) u.uTime.value += Math.min(delta, 0.1);
    }
    const scale = materials.halo.uniforms.uScale;
    if (scale) scale.value = size.height * 1.15;
  });

  useEffect(
    () => () => {
      halo.dispose();
      pools.dispose();
    },
    [halo, pools],
  );
  useEffect(
    () => () => {
      materials.halo.dispose();
      materials.pool.dispose();
    },
    [materials],
  );

  return (
    <>
      <mesh geometry={pools} material={materials.pool} frustumCulled={false} renderOrder={2} />
      <points geometry={halo} material={materials.halo} frustumCulled={false} renderOrder={3} />
    </>
  );
}
