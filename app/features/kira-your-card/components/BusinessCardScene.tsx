'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Color, Group, MeshStandardMaterial, PlaneGeometry, Vector2 } from 'three';
import { CardController } from '../../../components/card/CardController';
import { HologramMaterialImpl } from '../../../components/card/HologramMaterial';

const CARD_HEIGHT = 0.86;
const CARD_WIDTH = CARD_HEIGHT * (91 / 55);
const CARD_THICKNESS = 0.004;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export type BusinessCardSceneProps = {
  controller: CardController;
  frontTexture: CanvasTexture;
  backTexture: CanvasTexture;
  burstSignal: number;
  kickSignal: number;
  reducedMotion: boolean;
  isMobile: boolean;
};

export function BusinessCardScene({
  controller,
  frontTexture,
  backTexture,
  burstSignal,
  kickSignal,
  reducedMotion,
  isMobile,
}: BusinessCardSceneProps) {
  const groupRef = useRef<Group>(null);
  const burstRef = useRef(0);
  const kickRef = useRef(0);
  const holoParallax = useRef(new Vector2());

  const baseGeometry = useMemo(() => new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT), []);

  useEffect(() => () => baseGeometry.dispose(), [baseGeometry]);

  useEffect(() => {
    burstRef.current = 0;
    kickRef.current = 0;
  }, [frontTexture, backTexture]);

  useEffect(() => {
    burstRef.current = 1;
  }, [burstSignal]);

  useEffect(() => {
    kickRef.current = 1;
  }, [kickSignal]);

  useEffect(() => {
    const onBlur = () => controller.handlePointerLeave();
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [controller]);

  const frontMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      metalness: 0.18,
      roughness: 0.32,
    });
    material.transparent = false;
    return material;
  }, []);

  const backMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      metalness: 0.12,
      roughness: 0.38,
    });
    material.transparent = false;
    return material;
  }, []);

  const frontHolo = useMemo(() => {
    const material = new HologramMaterialImpl();
    material.uniforms.uTint.value = new Color('#75c8ff');
    material.uniforms.uOpacity.value = 0.82;
    material.uniforms.uMaskPower.value = 1.28;
    material.depthWrite = false;
    material.transparent = true;
    return material;
  }, []);

  const backHolo = useMemo(() => {
    const material = new HologramMaterialImpl();
    material.uniforms.uTint.value = new Color('#5b6dff');
    material.uniforms.uOpacity.value = 0.68;
    material.uniforms.uMaskPower.value = 1.12;
    material.depthWrite = false;
    material.transparent = true;
    return material;
  }, []);

  useEffect(() => () => {
    frontMaterial.dispose();
    backMaterial.dispose();
    frontHolo.dispose();
    backHolo.dispose();
  }, [frontMaterial, backMaterial, frontHolo, backHolo]);

  useEffect(() => {
    frontMaterial.map = frontTexture;
    frontTexture.needsUpdate = true;
    frontHolo.uniforms.uTexture.value = frontTexture;
  }, [frontMaterial, frontHolo, frontTexture]);

  useEffect(() => {
    backMaterial.map = backTexture;
    backTexture.needsUpdate = true;
    backHolo.uniforms.uTexture.value = backTexture;
  }, [backMaterial, backHolo, backTexture]);

  useFrame((state, delta) => {
    const { rotation, introProgress } = controller.update(delta);

    const introEase = easeOutCubic(clamp01(introProgress));

    if (groupRef.current) {
      const wobbleBase = Math.sin(state.clock.elapsedTime * 1.4) * 0.0035;
      const wobble = reducedMotion || isMobile ? wobbleBase * 0.4 : wobbleBase;
      groupRef.current.rotation.set(-rotation.x, rotation.y, wobble);

      const lift = 0.02 + easeOutCubic(clamp01((introProgress - 0.2) / 0.6)) * (isMobile ? 0.05 : 0.075);
      groupRef.current.position.z = lift;
      const scaleBoost = easeOutCubic(clamp01((introProgress - 0.25) / 0.5));
      const scale = 1 + (isMobile ? 0.04 : 0.055) * scaleBoost;
      groupRef.current.scale.setScalar(scale);
    }

    burstRef.current = Math.max(0, burstRef.current - delta * 3.4);
    kickRef.current = Math.max(0, kickRef.current - delta * 4.6);

    const motionFactor = (reducedMotion ? 0.55 : 1) * (isMobile ? 0.85 : 1);
    const parallaxFactor = 0.032 * motionFactor;
    holoParallax.current.set(rotation.y * parallaxFactor, rotation.x * parallaxFactor);

    frontHolo.uniforms.uTime.value = state.clock.elapsedTime;
    frontHolo.uniforms.uBurst.value = burstRef.current * (reducedMotion ? 0.6 : 1);
    frontHolo.uniforms.uKick.value = kickRef.current * (reducedMotion ? 0.7 : 1);
    frontHolo.uniforms.uParallax.value.copy(holoParallax.current).multiplyScalar(0.45);
    frontHolo.uniforms.uIntensity.value = reducedMotion ? 0.8 : 1.15;
    frontHolo.uniforms.uOpacity.value = 0.55 + 0.35 * introEase;

    backHolo.uniforms.uTime.value = state.clock.elapsedTime * 0.9;
    backHolo.uniforms.uBurst.value = burstRef.current * 0.5 * (reducedMotion ? 0.7 : 1);
    backHolo.uniforms.uKick.value = kickRef.current * 0.35 * (reducedMotion ? 0.7 : 1);
    backHolo.uniforms.uParallax.value.copy(holoParallax.current).multiplyScalar(0.38);
    backHolo.uniforms.uIntensity.value = reducedMotion ? 0.65 : 0.95;
    backHolo.uniforms.uOpacity.value = 0.48 + 0.28 * introEase;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, -CARD_THICKNESS]} geometry={baseGeometry}>
        <meshStandardMaterial color={0x090c16} metalness={0.2} roughness={0.6} />
      </mesh>

      <mesh geometry={baseGeometry} position={[0, 0, 0]}>
        <primitive attach="material" object={frontMaterial} />
      </mesh>
      <mesh geometry={baseGeometry} position={[0, 0, CARD_THICKNESS]} rotation={[0, Math.PI, 0]}>
        <primitive attach="material" object={backMaterial} />
      </mesh>

      <mesh geometry={baseGeometry} position={[0, 0, CARD_THICKNESS * 0.32]}>
        <primitive attach="material" object={frontHolo} />
      </mesh>
      <mesh geometry={baseGeometry} position={[0, 0, CARD_THICKNESS * 0.24]} rotation={[0, Math.PI, 0]}>
        <primitive attach="material" object={backHolo} />
      </mesh>
    </group>
  );
}
