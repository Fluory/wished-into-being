'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clock } from './clock';
import type { Voxels } from './model';

const vertex = /* glsl */ `
  attribute vec3 aAnchor;
  attribute vec2 aPixel;
  attribute vec3 aColor;
  attribute vec4 aInfo;
  uniform float uDay;
  uniform float uTime;
  uniform float uVoxel;
  uniform float uMotion;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying float vGlow;
  varying float vDepth;
  varying float vHeight;

  void main() {
    float t = clamp(uDay - aInfo.x + 1.0, 0.0, 1.0);
    float c1 = 1.70158;
    float grow = t <= 0.0 ? 0.0 : 1.0 + (c1 + 1.0) * pow(t - 1.0, 3.0) + c1 * pow(t - 1.0, 2.0);

    // paper-cut sprites: every wish turns to face the camera around its own vertical axis
    vec2 toCam = cameraPosition.xz - aAnchor.xy;
    float len = length(toCam);
    vec2 f = len > 0.0001 ? toCam / len : vec2(0.0, 1.0);
    vec2 r = vec2(f.y, -f.x);

    float bob = aInfo.z > 0.5 ? sin(uTime * 1.4 + aInfo.w * 6.2831) * 0.035 * uMotion : 0.0;
    float sway = aInfo.z < 0.5 ? sin(uTime * 0.9 + aInfo.w * 6.2831) * 0.012 * uMotion * (15.5 - aPixel.y) / 16.0 : 0.0;
    vec3 cube = position * uVoxel * vec3(1.0, 1.0, 1.6);
    vec3 local = vec3((aPixel.x - 7.5) * uVoxel + cube.x + sway, (15.5 - aPixel.y) * uVoxel + cube.y, cube.z) * grow;
    vec3 world = vec3(aAnchor.x, aAnchor.z + bob, aAnchor.y)
      + vec3(r.x * local.x + f.x * local.z, local.y, r.y * local.x + f.y * local.z);

    vNormal = normalize(vec3(r.x * normal.x + f.x * normal.z, normal.y, r.y * normal.x + f.y * normal.z));
    vColor = pow(aColor, vec3(2.2));
    vGlow = aInfo.y * (0.85 + 0.15 * sin(uTime * 2.3 + aInfo.w * 40.0) * uMotion);
    vHeight = local.y;
    vec4 mv = viewMatrix * vec4(world, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uMoonDir;
  uniform vec3 uMoon;
  uniform vec3 uAmbient;
  uniform vec3 uFog;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying float vGlow;
  varying float vDepth;
  varying float vHeight;

  void main() {
    float diffuse = max(dot(normalize(vNormal), normalize(uMoonDir)), 0.0);
    float rim = 0.25 + 0.75 * clamp(vNormal.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 lit = vColor * (uAmbient * rim + uMoon * diffuse);
    lit = mix(lit, vColor * 1.9, vGlow);
    float f = smoothstep(uFogNear, uFogFar, vDepth);
    gl_FragColor = vec4(mix(lit, uFog, f * (1.0 - vGlow * 0.6)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface Lighting {
  moonDir: THREE.Vector3;
  fog: string;
  fogNear: number;
  fogFar: number;
}

/**
 * Every wish as its own little voxel figure – one cube per sprite pixel, all of them in a single
 * instanced draw call. The figures turn to face the camera like paper theatre, pop up on the day
 * their wish came true, and whatever is gold or cream in them glows.
 */
export function Wishes({ voxels, lighting, still }: { voxels: Voxels; lighting: Lighting; still: boolean }) {
  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = box.index;
    g.setAttribute('position', box.getAttribute('position'));
    g.setAttribute('normal', box.getAttribute('normal'));
    g.setAttribute('aAnchor', new THREE.InstancedBufferAttribute(voxels.anchor, 3));
    g.setAttribute('aPixel', new THREE.InstancedBufferAttribute(voxels.pixel, 2));
    g.setAttribute('aColor', new THREE.InstancedBufferAttribute(voxels.color, 3));
    g.setAttribute('aInfo', new THREE.InstancedBufferAttribute(voxels.info, 4));
    g.instanceCount = voxels.count;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(32, 0, 32), 200);
    return g;
  }, [voxels]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uDay: { value: 0 },
          uTime: { value: 0 },
          uVoxel: { value: 0.94 / 16 },
          uMotion: { value: 1 },
          uMoonDir: { value: new THREE.Vector3() },
          uMoon: { value: new THREE.Color('#d4dbff').multiplyScalar(1.25) },
          uAmbient: { value: new THREE.Color('#7a78c8').multiplyScalar(0.95) },
          uFog: { value: new THREE.Color() },
          uFogNear: { value: 60 },
          uFogFar: { value: 260 },
        },
      }),
    [],
  );

  useEffect(() => {
    const u = material.uniforms;
    (u.uMoonDir?.value as THREE.Vector3).copy(lighting.moonDir);
    (u.uFog?.value as THREE.Color).set(lighting.fog);
    if (u.uFogNear) u.uFogNear.value = lighting.fogNear;
    if (u.uFogFar) u.uFogFar.value = lighting.fogFar;
    if (u.uMotion) u.uMotion.value = still ? 0 : 1;
  }, [material, lighting, still]);

  useFrame((_, delta) => {
    const u = material.uniforms;
    if (u.uDay) u.uDay.value = clock.day;
    if (u.uTime && !still) u.uTime.value += Math.min(delta, 0.1);
  });

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
