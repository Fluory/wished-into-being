'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { hashCell, type Star } from '@/features/island';
import { NIGHT } from '@/features/render';
import { starPlacement } from './model';

const DOME = 320;

const domeVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const domeFragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uMoonDir;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, -0.2, 1.0);
    vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.22, h));
    col = mix(col, uZenith, smoothstep(0.22, 0.85, h));
    float moon = max(dot(normalize(vDir), normalize(uMoonDir)), 0.0);
    col += vec3(0.16, 0.15, 0.26) * pow(moon, 60.0) + vec3(0.035, 0.03, 0.07) * pow(moon, 6.0);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const pointVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uScale;
  varying float vTwinkle;
  varying float vSeed;
  void main() {
    vTwinkle = 0.65 + 0.35 * sin(uTime * (1.2 + aSeed * 2.4) + aSeed * 60.0);
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale;
    gl_Position = projectionMatrix * mv;
  }
`;
const dustFragment = /* glsl */ `
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.1, d) * vTwinkle;
    gl_FragColor = vec4(vec3(0.82, 0.8, 1.0) * a, a);
  }
`;
const wishFragment = /* glsl */ `
  varying float vTwinkle;
  void main() {
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float core = exp(-dot(p, p) * 26.0);
    float rays = exp(-abs(p.x) * 30.0) * exp(-abs(p.y) * 2.6) + exp(-abs(p.y) * 30.0) * exp(-abs(p.x) * 2.6);
    float halo = exp(-dot(p, p) * 5.0) * 0.35;
    float a = clamp(core + rays * vTwinkle * 0.9 + halo, 0.0, 1.0);
    gl_FragColor = vec4(vec3(1.0, 0.86, 0.52) * a, a);
  }
`;

const moonFragment = /* glsl */ `
  uniform float uPhase;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float disc = smoothstep(0.5, 0.47, r);
    float glow = exp(-r * r * 3.2) * 0.35;
    // lit part on the unit disc: waxing lights the right side first, waning keeps the left
    vec2 q = p / 0.5;
    float k = cos(6.2831853 * uPhase);
    float w = sqrt(max(0.0, 1.0 - q.y * q.y));
    float lit = uPhase < 0.5 ? step(k * w, q.x) : step(q.x, -k * w);
    vec3 surface = mix(vec3(0.16, 0.15, 0.3), vec3(1.0, 0.93, 0.74), lit);
    float crater = 0.06 * sin(p.x * 17.0) * sin(p.y * 13.0);
    vec3 col = surface * (1.0 - crater) * disc + vec3(0.55, 0.55, 0.8) * glow;
    float a = max(disc, glow);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;
const moonVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface Props {
  center: THREE.Vector3;
  moonDir: THREE.Vector3;
  phase: number;
  stars: readonly Star[];
  still: boolean;
}

/** The night sky: a gradient dome, star dust, the moon in tonight's phase – and a golden star for every waiting wish. */
export function Sky({ center, moonDir, phase, stars, still }: Props) {
  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: domeVertex,
        fragmentShader: domeFragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uZenith: { value: new THREE.Color(NIGHT.sky0) },
          uMid: { value: new THREE.Color(NIGHT.sky2) },
          uHorizon: { value: new THREE.Color(NIGHT.horizon) },
          uMoonDir: { value: moonDir.clone() },
        },
      }),
    [moonDir],
  );

  const dust = useMemo(() => {
    const count = 1100;
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = (hashCell(i, 1, 90) % 10000) / 10000;
      const v = (hashCell(i, 2, 91) % 10000) / 10000;
      const theta = u * Math.PI * 2;
      const y = 0.04 + v * 0.96;
      const r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(theta) * r * 0.97, y, Math.sin(theta) * r * 0.97], i * 3);
      size[i] = 0.6 + ((hashCell(i, 3, 92) % 100) / 100) ** 3 * 2.2;
      seed[i] = (hashCell(i, 4, 93) % 1000) / 1000;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const wishes = useMemo(() => {
    const placed = starPlacement(stars);
    const pos = new Float32Array(placed.length * 3);
    const size = new Float32Array(placed.length);
    const seed = new Float32Array(placed.length);
    placed.forEach((s, i) => {
      const r = Math.cos(s.elevation);
      pos.set([Math.cos(s.azimuth) * r * 0.9, Math.sin(s.elevation) * 0.9, Math.sin(s.azimuth) * r * 0.9], i * 3);
      size[i] = 9 + s.size * 11;
      seed[i] = (s.issue % 97) / 97;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [stars]);

  const materials = useMemo(() => {
    const common = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, premultipliedAlpha: true };
    return {
      dust: new THREE.ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: dustFragment,
        uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
        ...common,
      }),
      wish: new THREE.ShaderMaterial({
        vertexShader: pointVertex,
        fragmentShader: wishFragment,
        uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
        ...common,
      }),
      moon: new THREE.ShaderMaterial({
        vertexShader: moonVertex,
        fragmentShader: moonFragment,
        uniforms: { uPhase: { value: phase } },
        transparent: true,
        depthWrite: false,
      }),
    };
  }, [phase]);

  useFrame(({ size }, delta) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const m of [materials.dust, materials.wish]) {
      const u = m.uniforms;
      if (u.uTime && !still) u.uTime.value += Math.min(delta, 0.1);
      if (u.uScale) u.uScale.value = dpr * Math.max(0.8, Math.min(1.4, size.height / 900));
    }
  });

  useEffect(
    () => () => {
      dome.dispose();
      dust.dispose();
      wishes.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    },
    [dome, dust, wishes, materials],
  );

  const moonPos = useMemo(
    () =>
      moonDir
        .clone()
        .normalize()
        .multiplyScalar(DOME * 0.8),
    [moonDir],
  );

  return (
    <group position={[center.x, 0, center.z]}>
      <mesh material={dome} renderOrder={-10}>
        <sphereGeometry args={[DOME, 32, 16]} />
      </mesh>
      <points geometry={dust} material={materials.dust} scale={DOME * 0.95} renderOrder={-9} frustumCulled={false} />
      <points geometry={wishes} material={materials.wish} scale={DOME * 0.9} renderOrder={-8} frustumCulled={false} />
      <mesh
        position={moonPos}
        material={materials.moon}
        renderOrder={-7}
        onUpdate={(m) => m.lookAt(center.x, 0, center.z)}
      >
        <planeGeometry args={[24, 24]} />
      </mesh>
    </group>
  );
}
