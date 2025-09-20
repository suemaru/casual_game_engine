'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, Environment } from '@react-three/drei';
import { ACESFilmicToneMapping, CineonToneMapping, SRGBColorSpace } from 'three';
import { CardSpec } from '../../data/cardSpec';
import { CardController } from './CardController';
import { CardScene } from './CardScene';

type Quality = 'high' | 'medium' | 'low';

type CardCanvasProps = {
  spec: CardSpec;
  controller: CardController;
  burstSignal: number;
  kickSignal: number;
  reducedMotion: boolean;
  isMobile: boolean;
};

export function CardCanvas({
  spec,
  controller,
  burstSignal,
  kickSignal,
  reducedMotion,
  isMobile,
}: CardCanvasProps) {
  const [quality, setQuality] = useState<Quality>(isMobile ? 'medium' : 'high');

  useEffect(() => {
    setQuality(isMobile ? 'medium' : 'high');
  }, [isMobile]);

  const handlePerformance = useCallback(({ factor }: { factor: number }) => {
    if (isMobile) {
      if (factor > 0.75) {
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
      camera={{ position: [0, 0, 3], fov: 28 }}
      dpr={isMobile ? [1, 1.2] : [1, 2]}
    >
      <PerformanceMonitor onChange={handlePerformance} />
      <Environment preset="studio" resolution={256} />
      <ambientLight intensity={0.56} />
      <directionalLight position={[1.5, 2.2, 3]} intensity={1.05} />
      <directionalLight position={[-2.5, -1.5, 2]} intensity={0.36} />
      <Suspense fallback={null}>
        <CardScene
          spec={spec}
          controller={controller}
          burstSignal={burstSignal}
          kickSignal={kickSignal}
          quality={quality}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
        />
      </Suspense>
    </Canvas>
  );
}
