'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { hashCell } from '@/features/island';

const vertex = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uRadius;
  uniform vec3 uCenter;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    float t = uTime * (0.12 + aSeed.w * 0.1) + aSeed.x * 6.2831;
    float r = uRadius * (0.25 + 0.75 * aSeed.y);
    vec3 p = uCenter + vec3(cos(t) * r + sin(t * 2.3 + aSeed.z * 9.0) * 0.8, 0.8 + aSeed.z * 2.2 + sin(t * 1.7) * 0.4, sin(t * 0.8) * r + cos(t * 1.9) * 0.8);
    vAlpha = smoothstep(0.1, 0.9, 0.5 + 0.5 * sin(uTime * (1.5 + aSeed.w * 2.0) + aSeed.x * 30.0));
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_PointSize = uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const fragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = pow(max(0.0, 1.0 - d), 3.0) * vAlpha;
    gl_FragColor = vec4(vec3(1.0, 0.9, 0.5) * a, a);
  }
`;

/** A few fireflies drifting over the island – the only thing on it nobody wished for. */
export function Fireflies({ center, radius }: { center: THREE.Vector3; radius: number }) {
  const geometry = useMemo(() => {
    const count = 64;
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++)
      seeds.set(
        [0, 1, 2, 3].map((k) => (hashCell(i, k, 77) % 1000) / 1000),
        i * 4,
      );
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uRadius: { value: 4 },
          uCenter: { value: new THREE.Vector3() },
          uScale: { value: 200 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        premultipliedAlpha: true,
      }),
    [],
  );
  useFrame(({ size }, delta) => {
    const u = material.uniforms;
    if (u.uTime) u.uTime.value += Math.min(delta, 0.1);
    if (u.uRadius) u.uRadius.value += (radius * 0.8 - (u.uRadius.value as number)) * 0.05;
    (u.uCenter?.value as THREE.Vector3).lerp(center, 0.05);
    if (u.uScale) u.uScale.value = size.height * 0.35;
  });
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={4} />;
}
