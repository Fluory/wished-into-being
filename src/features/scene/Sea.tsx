'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { NIGHT } from '@/features/render';
import { clock } from './clock';
import { distanceAt, type Tile } from './model';

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uWaves;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    world.y += (sin(world.x * 0.5 + uTime * 0.8) * 0.03 + cos(world.z * 0.4 - uTime * 0.6) * 0.03) * uWaves;
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uDist;
  uniform vec2 uGrid;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform vec3 uGlint;
  uniform vec3 uFog;
  uniform vec3 uMoonDir;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uTime;
  varying vec3 vWorld;
  varying float vDepth;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 uv = vWorld.xz / uGrid;
    float d = texture2D(uDist, uv).r * 16.0 - 0.5;
    vec3 col = mix(uShallow, uMid, smoothstep(0.1, 2.4, d));
    col = mix(col, uDeep, smoothstep(2.4, 12.0, d));

    float n = noise(vWorld.xz * 1.6 + uTime * 0.2);
    float foam = 1.0 - smoothstep(0.02, 0.15 + n * 0.14, d);
    float band = abs(fract(d * 0.7 - uTime * 0.1) - 0.5);
    float ring = (1.0 - smoothstep(0.0, 0.05, band - 0.45)) * (1.0 - smoothstep(0.2, 1.4, d)) * 0.12;
    col = mix(col, uFoam, clamp(foam * 0.7 + ring, 0.0, 1.0));

    // moonlight glitter: a sparkling path on the water towards the moon
    vec3 view = normalize(cameraPosition - vWorld);
    vec2 wobble = vec2(noise(vWorld.xz * 2.3 + uTime * 0.5), noise(vWorld.zx * 2.1 - uTime * 0.4)) - 0.5;
    vec3 normal = normalize(vec3(wobble.x * 0.14, 1.0, wobble.y * 0.14));
    float spec = pow(max(dot(reflect(-view, normal), normalize(uMoonDir)), 0.0), 320.0);
    float sparkle = step(0.82, noise(vWorld.xz * 16.0 + uTime * 1.6));
    col += uGlint * spec * (0.12 + sparkle * 0.45);

    float f = smoothstep(uFogNear, uFogFar, vDepth);
    gl_FragColor = vec4(mix(col, uFog, f), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface Props {
  width: number;
  height: number;
  tiles: readonly Tile[];
  moonDir: THREE.Vector3;
  fog: string;
  fogNear: number;
  fogFar: number;
  still: boolean;
}

/** The night sea: darker the farther from shore, a foam line along the coast, and the moon's glitter path. */
export function Sea({ width, height, tiles, moonDir, fog, fogNear, fogFar, still }: Props) {
  const texture = useMemo(() => {
    const tex = new THREE.DataTexture(
      new Uint8Array(width * height),
      width,
      height,
      THREE.RedFormat,
      THREE.UnsignedByteType,
    );
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [width, height]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uDist: { value: texture },
          uGrid: { value: new THREE.Vector2(width, height) },
          uDeep: { value: new THREE.Color(NIGHT.sea0) },
          uMid: { value: new THREE.Color(NIGHT.sea1) },
          uShallow: { value: new THREE.Color(NIGHT.sea3) },
          uFoam: { value: new THREE.Color('#7d8cd0') },
          uGlint: { value: new THREE.Color('#e6ecff') },
          uFog: { value: new THREE.Color() },
          uMoonDir: { value: new THREE.Vector3() },
          uFogNear: { value: 60 },
          uFogFar: { value: 260 },
          uTime: { value: 0 },
          uWaves: { value: 1 },
        },
      }),
    [texture, width, height],
  );

  useEffect(() => {
    const u = material.uniforms;
    (u.uFog?.value as THREE.Color).set(fog);
    (u.uMoonDir?.value as THREE.Vector3).copy(moonDir);
    if (u.uFogNear) u.uFogNear.value = fogNear;
    if (u.uFogFar) u.uFogFar.value = fogFar;
    if (u.uWaves) u.uWaves.value = still ? 0 : 1;
  }, [material, fog, fogNear, fogFar, moonDir, still]);

  const lastDay = useMemo(() => ({ value: Number.NaN }), []);
  useEffect(() => {
    lastDay.value = Number.NaN;
  }, [tiles, lastDay]);

  useFrame((_, delta) => {
    const u = material.uniforms;
    if (u.uTime && !still) u.uTime.value += Math.min(delta, 0.1);
    const day = Math.round(clock.day);
    if (day !== lastDay.value) {
      const dist = distanceAt(tiles, day, width, height);
      const data = texture.image.data as Uint8Array;
      for (let i = 0; i < dist.length; i++) data[i] = Math.round((Math.min(16, dist[i] as number) / 16) * 255);
      texture.needsUpdate = true;
      lastDay.value = day;
    }
  });

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, height / 2]} receiveShadow>
      <planeGeometry args={[720, 720, 200, 200]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
