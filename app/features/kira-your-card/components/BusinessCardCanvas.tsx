'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerformanceMonitor } from '@react-three/drei';
import { ACESFilmicToneMapping, CanvasTexture, CineonToneMapping, SRGBColorSpace } from 'three';
import { CardController } from '../../../components/card/CardController';
import { BusinessCardScene } from './BusinessCardScene';

export type RenderTextures = {
  frontTexture: CanvasTexture;
  backTexture: CanvasTexture;
};

type Quality = 'high' | 'medium' | 'low';

type BusinessCardCanvasProps = {
  controller: CardController;
  textures: RenderTextures;
  burstSignal: number;
  kickSignal: number;
  reducedMotion: boolean;
  isMobile: boolean;
};

export function BusinessCardCanvas({
  controller,
  textures,
  burstSignal,
  kickSignal,
  reducedMotion,
  isMobile,
}: BusinessCardCanvasProps) {
  const [quality, setQuality] = useState<Quality>(isMobile ? 'medium' : 'high');

  useEffect(() => {
    setQuality(isMobile ? 'medium' : 'high');
  }, [isMobile]);

  const handlePerformance = useCallback(({ factor }: { factor: number }) => {
    if (isMobile) {
      if (factor > 0.8) {
        setQuality('medium');
      } else {
        setQuality('low');
      }
      return;
    }

    if (factor > 0.85) {
      setQuality('high');
    } else if (factor > 0.65) {
      setQuality('medium');
    } else {
      setQuality('low');
    }
  }, [isMobile]);

  return (
    <Canvas
      flat
      gl={{
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
        toneMapping: reducedMotion ? CineonToneMapping : ACESFilmicToneMapping,
        outputColorSpace: SRGBColorSpace,
      }}
      camera={{ position: [0, 0, 3.1], fov: 28 }}
      dpr={isMobile ? [1, 1.25] : [1, 2]}
    >
      <PerformanceMonitor onChange={handlePerformance} />
      <Environment preset="studio" resolution={quality === 'high' ? 256 : 128} />
      <ambientLight intensity={quality === 'low' ? 0.4 : 0.56} />
      <directionalLight position={[1.6, 2.2, 3]} intensity={1.05} />
      <directionalLight position={[-2.6, -1.4, 2]} intensity={0.32} />
      <Suspense fallback={null}>
        <BusinessCardScene
          controller={controller}
          frontTexture={textures.frontTexture}
          backTexture={textures.backTexture}
          burstSignal={burstSignal}
          kickSignal={kickSignal}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
        />
      </Suspense>
    </Canvas>
  );
}
