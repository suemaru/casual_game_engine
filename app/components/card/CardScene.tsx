'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  Color,
  Group,
  PlaneGeometry,
  SRGBColorSpace,
  Vector2,
} from 'three';
import type { CardSpec } from '../../data/cardSpec';
import type { CardController } from './CardController';
import { HologramMaterialImpl } from './HologramMaterial';

const CARD_HEIGHT = 0.86;
const CARD_WIDTH = (5 / 7) * CARD_HEIGHT;
const IMAGE_DEPTH = 0.0015;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

type Quality = 'high' | 'medium' | 'low';

type CardSceneProps = {
  spec: CardSpec;
  controller: CardController;
  burstSignal: number;
  kickSignal: number;
  quality: Quality;
  reducedMotion: boolean;
  isMobile: boolean;
};

export function CardScene({
  spec,
  controller,
  burstSignal,
  kickSignal,
  quality,
  reducedMotion,
  isMobile,
}: CardSceneProps) {
  const groupRef = useRef<Group>(null);
  const burstRef = useRef(0);
  const kickRef = useRef(0);
  const holoParallax = useRef(new Vector2());

  const textures = useTexture({
    main: spec.assets.main,
    background: spec.assets.background,
    subject: spec.assets.subject ?? spec.assets.main,
    frame: '/assets/card/frame.png',
  });

  useEffect(() => {
    Object.values(textures).forEach((tex) => {
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = isMobile ? 4 : 8;
    });
  }, [isMobile, textures]);

  const subjectTexture = spec.assets.subject ? textures.subject : undefined;

  const frontMaterial = useMemo(() => {
    const material = new HologramMaterialImpl();
    material.transparent = true;
    material.depthWrite = false;
    material.uniforms.uMaskPower.value = 1.65;
    material.uniforms.uOpacity.value = 0.9;
    material.uniforms.uTint.value = new Color('#75c8ff');
    return material;
  }, []);

  const backMaterial = useMemo(() => {
    const material = new HologramMaterialImpl();
    material.transparent = true;
    material.depthWrite = false;
    material.uniforms.uMaskPower.value = 1.15;
    material.uniforms.uOpacity.value = 1;
    material.uniforms.uTint.value = new Color('#365082');
    return material;
  }, []);

  useEffect(() => {
    frontMaterial.uniforms.uTexture.value = subjectTexture ?? textures.main;
    backMaterial.uniforms.uTexture.value = textures.background;
  }, [frontMaterial, backMaterial, subjectTexture, textures.background, textures.main]);

  useEffect(() => () => frontMaterial.dispose(), [frontMaterial]);
  useEffect(() => () => backMaterial.dispose(), [backMaterial]);

  const baseGeometry = useMemo(() => new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT), []);

  useEffect(() => () => baseGeometry.dispose(), [baseGeometry]);

  useEffect(() => {
    burstRef.current = 0;
    kickRef.current = 0;
  }, [spec]);

  useEffect(() => {
    burstRef.current = 1;
  }, [burstSignal]);

  useEffect(() => {
    kickRef.current = 1;
  }, [kickSignal]);

  useEffect(() => {
    const event = () => controller.handlePointerLeave();
    window.addEventListener('blur', event);
    return () => window.removeEventListener('blur', event);
  }, [controller]);

  useFrame((state, delta) => {
    const { rotation, introProgress } = controller.update(delta);

    const introEase = easeOutCubic(clamp01(introProgress));

    if (groupRef.current) {
      const wobbleBase = Math.sin(state.clock.elapsedTime * 1.4) * 0.003;
      const wobble = reducedMotion || isMobile ? wobbleBase * 0.4 : wobbleBase;
      groupRef.current.rotation.set(-rotation.x, rotation.y, wobble);

      const lift = 0.02 + easeOutCubic(clamp01((introProgress - 0.2) / 0.6)) * (isMobile ? 0.055 : 0.08);
      groupRef.current.position.z = lift;
      const scaleBoost = easeOutCubic(clamp01((introProgress - 0.2) / 0.5));
      const scale = 1 + (isMobile ? 0.045 : 0.06) * scaleBoost;
      groupRef.current.scale.setScalar(scale);
    }

    burstRef.current = Math.max(0, burstRef.current - delta * 3.6);
    kickRef.current = Math.max(0, kickRef.current - delta * 4.8);

    const motionFactor = (reducedMotion ? 0.5 : 1) * (isMobile ? 0.85 : 1);
    const parallaxFactor = (quality === 'high' ? 0.04 : quality === 'medium' ? 0.024 : 0.015) * motionFactor;
    holoParallax.current.set(rotation.y * parallaxFactor, rotation.x * parallaxFactor);

    const intensityBase =
      (quality === 'high' ? 1 : quality === 'medium' ? 0.8 : 0.55) * (reducedMotion ? 0.75 : 1) * (isMobile ? 0.85 : 1);

    frontMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    frontMaterial.uniforms.uBurst.value = burstRef.current * (reducedMotion ? 0.65 : 1);
    frontMaterial.uniforms.uKick.value = kickRef.current * (reducedMotion ? 0.7 : 1);
    frontMaterial.uniforms.uIntensity.value = 1.3 * intensityBase;
    frontMaterial.uniforms.uParallax.value.copy(holoParallax.current).multiplyScalar(0.4);
    frontMaterial.uniforms.uOpacity.value = 0.65 + 0.3 * introEase;

    backMaterial.uniforms.uTime.value = state.clock.elapsedTime * 0.8;
    backMaterial.uniforms.uBurst.value = burstRef.current * 0.6 * (reducedMotion ? 0.7 : 1);
    backMaterial.uniforms.uKick.value = kickRef.current * 0.4 * (reducedMotion ? 0.7 : 1);
    backMaterial.uniforms.uIntensity.value = 0.85 * intensityBase;
    backMaterial.uniforms.uParallax.value.copy(holoParallax.current);
    backMaterial.uniforms.uOpacity.value = 0.55 + 0.35 * introEase;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -0.08]} geometry={baseGeometry}>
        <meshBasicMaterial color={0x07090f} opacity={0.78} transparent />
      </mesh>

        <mesh position={[0, 0, -0.012]} geometry={baseGeometry}>
        <primitive object={backMaterial} attach="material" />
      </mesh>

      <mesh position={[0, 0, 0]} geometry={baseGeometry}>
        <meshStandardMaterial map={textures.main} roughness={0.45} metalness={0.15} />
      </mesh>

      {subjectTexture && (
        <mesh position={[0, 0, IMAGE_DEPTH]} geometry={baseGeometry}>
          <meshStandardMaterial
            map={subjectTexture}
            transparent
            roughness={0.3}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
      )}

      <mesh position={[0, 0, IMAGE_DEPTH * 1.2]} geometry={baseGeometry}>
        <primitive object={frontMaterial} attach="material" />
      </mesh>

        <mesh position={[0, 0, IMAGE_DEPTH * 1.36]} geometry={baseGeometry}>
          <meshPhysicalMaterial
            map={textures.frame}
            transparent
            depthWrite={false}
            metalness={1}
            roughness={0.16}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            emissive={0x1a1305}
            emissiveIntensity={0.18}
            alphaTest={0.02}
          />
        </mesh>

      
    </group>
  );
}
