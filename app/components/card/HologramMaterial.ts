'use client';

import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { Color, Vector2 } from 'three';

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying float vViewAngle;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
    vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
    vViewAngle = 1.0 - max(dot(worldNormal, viewDir), 0.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying float vViewAngle;

  uniform sampler2D uTexture;
  uniform vec3 uTint;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uMaskPower;
  uniform float uBurst;
  uniform float uKick;
  uniform vec2 uParallax;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  vec3 iridescence(float x) {
    return mix(
      vec3(0.2, 0.5, 0.95),
      vec3(0.95, 0.35, 0.85),
      clamp(x, 0.0, 1.0)
    );
  }

  void main() {
    vec2 uv = vUv + uParallax;
    vec4 base = texture(uTexture, uv);

    float angleMask = pow(clamp(vViewAngle * 1.4, 0.0, 1.0), uMaskPower);
    float wave = sin((uv.x + uv.y) * 22.0 + uTime * 2.6);
    float grain = noise(uv * 130.0 + uTime * 0.4) * 0.35;
    vec3 holo = iridescence(0.5 + 0.5 * wave) + grain;

    float boost = uBurst * 0.6 + uKick * 0.35;
    float energy = uIntensity * (angleMask + boost * (0.6 + angleMask));
    vec3 color = base.rgb + (holo * energy + uTint * (angleMask * 0.25 + boost * 0.35));

    float alpha = base.a * uOpacity;
    if (alpha <= 0.001) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

export const HologramMaterialImpl = shaderMaterial(
  {
    uTexture: null,
    uTint: new Color('#6ab9ff'),
    uTime: 0,
    uIntensity: 1,
    uOpacity: 1,
    uMaskPower: 1.35,
    uBurst: 0,
    uKick: 0,
    uParallax: new Vector2(),
  },
  vertex,
  fragment,
);

extend({ HologramMaterialImpl });

export type HologramMaterialInstance = InstanceType<typeof HologramMaterialImpl>;
