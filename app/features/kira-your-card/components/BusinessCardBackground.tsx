'use client';

import { Canvas } from '@react-three/fiber';
import { GradientTexture, Sparkles } from '@react-three/drei';
import { BusinessCardEnvironmentSpec } from '../data/businessCardSpec';
import styles from './BusinessCardBackground.module.css';

type BusinessCardBackgroundProps = {
  environment: BusinessCardEnvironmentSpec;
  reducedMotion: boolean;
  isMobile: boolean;
};

export function BusinessCardBackground({ environment, reducedMotion, isMobile }: BusinessCardBackgroundProps) {
  if (isMobile) {
    return <div className={styles.backgroundFallback} aria-hidden />;
  }

  const [c0, c1, c2] = environment.gradientStops;
  const { colors, count, size, speed, opacity } = environment.sparkles;

  return (
    <Canvas
      gl={{ powerPreference: 'high-performance', antialias: false }}
      dpr={[1, reducedMotion ? 1.2 : 1.6]}
      camera={{ position: [0, 0, 3.1], fov: 30 }}
    >
      <color attach="background" args={[c0]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[2.4, 3.1, 4.2]} intensity={0.62} />
      <directionalLight position={[-2.6, -2, -1]} intensity={0.28} />

      <mesh rotation={[-0.2, 0.2, 0]} position={[0, 0, -1.2]} scale={[6.8, 4.9, 1]}>
        <planeGeometry args={[2, 2, 1, 1]} />
        <meshBasicMaterial toneMapped={false} opacity={0.94} transparent>
          <GradientTexture stops={[0, 0.5, 1]} colors={[c0, c1, c2]} size={1024} />
        </meshBasicMaterial>
      </mesh>

      <Sparkles
        color={colors[0] ?? '#8bbdff'}
        count={reducedMotion ? Math.round(count * 0.6) : count}
        size={reducedMotion ? size * 0.6 : size}
        speed={reducedMotion ? 0 : speed}
        opacity={opacity}
        scale={[8, 5.5, 3]}
      />
      <Sparkles
        color={colors[1] ?? '#ffe1a6'}
        count={reducedMotion ? Math.round(count * 0.35) : Math.round(count * 0.6)}
        size={reducedMotion ? size * 0.45 : size * 0.7}
        speed={reducedMotion ? 0 : speed * 1.2}
        opacity={opacity * 0.8}
        scale={[6, 4, 2]}
        position={[0.5, -0.5, 0]}
        noise={1.35}
      />
      <Sparkles
        color={colors[2] ?? '#fff4cf'}
        count={reducedMotion ? Math.round(count * 0.25) : Math.round(count * 0.4)}
        size={reducedMotion ? size * 0.35 : size * 0.55}
        speed={reducedMotion ? 0 : speed * 1.6}
        opacity={opacity * 0.65}
        scale={[7, 3, 2]}
        position={[-0.4, 0.3, 0.2]}
        noise={1.6}
      />
    </Canvas>
  );
}
