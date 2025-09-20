'use client';

import { Canvas } from '@react-three/fiber';
import { GradientTexture, Sparkles } from '@react-three/drei';
import styles from './CardShowcase.module.css';

type SceneBackgroundProps = {
  reducedMotion: boolean;
  isMobile: boolean;
};

export function SceneBackground({ reducedMotion, isMobile }: SceneBackgroundProps) {
  if (isMobile) {
    return <div className={styles.backgroundFallback} aria-hidden />;
  }

  return (
    <Canvas
      gl={{
        powerPreference: 'high-performance',
        antialias: false,
      }}
      dpr={[1, reducedMotion ? 1.2 : 1.6]}
      camera={{ position: [0, 0, 3.2], fov: 32 }}
    >
      <color attach="background" args={["#03050b"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[2.5, 3, 4]} intensity={0.6} />
      <directionalLight position={[-3, -2, -1]} intensity={0.25} />

      <mesh rotation={[-0.2, 0.2, 0]} position={[0, 0, -1.1]} scale={[6.2, 4.8, 1]}>
        <planeGeometry args={[2, 2, 1, 1]} />
        <meshBasicMaterial toneMapped={false} opacity={0.95} transparent>
          <GradientTexture
            stops={[0, 0.45, 1]}
            colors={['#050b16', '#14254a', '#050910']}
            size={1024}
          />
        </meshBasicMaterial>
      </mesh>

      <Sparkles
        color="#8bbdff"
        count={reducedMotion ? 180 : 360}
        size={reducedMotion ? 1.8 : 3.1}
        speed={reducedMotion ? 0 : 0.32}
        opacity={0.55}
        scale={[8, 5.5, 3]}
      />
      <Sparkles
        color="#a8d7ff"
        count={reducedMotion ? 90 : 220}
        size={reducedMotion ? 1.4 : 2.2}
        speed={reducedMotion ? 0 : 0.45}
        opacity={0.42}
        scale={[6, 4, 2]}
        position={[0.6, -0.4, 0]}
        noise={1.4}
      />
    </Canvas>
  );
}
