'use client';

import { useEffect, useRef, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { BusinessCardSpec } from '../data/businessCardSpec';
import { generateBusinessCardCanvases } from '../renderer/businessCardRenderer';

export type BusinessCardRenderResult = {
  frontCanvas: HTMLCanvasElement;
  backCanvas: HTMLCanvasElement;
  frontTexture: CanvasTexture;
  backTexture: CanvasTexture;
};

export function useBusinessCardRender(spec: BusinessCardSpec) {
  const [result, setResult] = useState<BusinessCardRenderResult | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const resultRef = useRef<BusinessCardRenderResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsRendering(true);

    generateBusinessCardCanvases(spec)
      .then(({ frontCanvas, backCanvas }) => {
        if (cancelled) return;
        const frontTexture = new CanvasTexture(frontCanvas);
        frontTexture.colorSpace = SRGBColorSpace;
        frontTexture.anisotropy = 4;
        frontTexture.needsUpdate = true;

        const backTexture = new CanvasTexture(backCanvas);
        backTexture.colorSpace = SRGBColorSpace;
        backTexture.anisotropy = 4;
        backTexture.needsUpdate = true;

        setResult((prev) => {
          if (prev) {
            prev.frontTexture.dispose();
            prev.backTexture.dispose();
          }
          const next = { frontCanvas, backCanvas, frontTexture, backTexture };
          resultRef.current = next;
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) {
          setIsRendering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [spec]);

  useEffect(
    () => () => {
      if (resultRef.current) {
        resultRef.current.frontTexture.dispose();
        resultRef.current.backTexture.dispose();
        resultRef.current = null;
      }
    },
    [],
  );

  return { result, isRendering };
}
