'use client';

import { KeyboardEvent, PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { MathUtils } from 'three';
import { CardController } from '../../../components/card/CardController';
import { useReducedMotion } from '../../../components/hooks/useReducedMotion';
import { useIsMobile } from '../../../components/hooks/useIsMobile';
import { BusinessCardSpec } from '../data/businessCardSpec';
import { BusinessCardRenderResult } from '../hooks/useBusinessCardRender';
import { BusinessCardBackground } from './BusinessCardBackground';
import { BusinessCardCanvas } from './BusinessCardCanvas';
import styles from './BusinessCardStage.module.css';

type BusinessCardStageProps = {
  spec: BusinessCardSpec;
  renderResult: BusinessCardRenderResult | null;
  isRendering: boolean;
};

export function BusinessCardStage({ spec, renderResult, isRendering }: BusinessCardStageProps) {
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();

  const controllerRef = useRef<CardController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new CardController();
  }
  const controller = controllerRef.current;

  const containerRef = useRef<HTMLDivElement>(null);
  const [burstSignal, setBurstSignal] = useState(0);
  const [kickSignal, setKickSignal] = useState(0);

  const pressedKeysRef = useRef<Set<string>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateKeyboardTilt = useCallback(() => {
    const keys = pressedKeysRef.current;
    let pitch = 0;
    if (keys.has('ArrowUp') && !keys.has('ArrowDown')) {
      pitch = 1;
    } else if (keys.has('ArrowDown') && !keys.has('ArrowUp')) {
      pitch = -1;
    }

    let yaw = 0;
    if (keys.has('ArrowRight') && !keys.has('ArrowLeft')) {
      yaw = 1;
    } else if (keys.has('ArrowLeft') && !keys.has('ArrowRight')) {
      yaw = -1;
    }

    controller.setKeyboardTilt(pitch, yaw);
  }, [controller]);

  useEffect(() => {
    controller.setMotionScale(reduced ? 0.5 : isMobile ? 0.85 : 1);
    updateKeyboardTilt();
  }, [controller, reduced, isMobile, updateKeyboardTilt]);

  useEffect(() => {
    controller.onBurst = () => setBurstSignal((prev) => prev + 1);
    controller.onKick = () => setKickSignal((prev) => prev + 1);
    controller.resetIntro();
  }, [controller, spec]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const overlay = overlayRef.current;
      if (overlay) {
        const rotateX = MathUtils.radToDeg(controller.rotation.x);
        const rotateY = MathUtils.radToDeg(controller.rotation.y);
        overlay.style.setProperty('--overlay-tilt', `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [controller]);

  const getRect = () => containerRef.current?.getBoundingClientRect();

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rect = getRect();
    if (!rect) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore if unsupported
    }
    controller.handlePointerDown(event.clientX, event.clientY, rect, event.timeStamp);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = getRect();
    if (!rect) return;
    controller.handlePointerMove(event.clientX, event.clientY, rect);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    controller.handlePointerUp(event.clientX, event.clientY, event.timeStamp);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerLeave = () => {
    controller.handlePointerLeave();
  };

  const onPointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    controller.handlePointerEnter();
    const rect = getRect();
    if (!rect) return;
    controller.handlePointerMove(event.clientX, event.clientY, rect);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      const keys = pressedKeysRef.current;
      if (!keys.has(key)) {
        keys.add(key);
        updateKeyboardTilt();
      }
    }
  };

  const onKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      const keys = pressedKeysRef.current;
      if (keys.delete(key)) {
        updateKeyboardTilt();
      }
    }
  };

  const onBlur = () => {
    pressedKeysRef.current.clear();
    controller.setKeyboardTilt(0, 0);
  };

  return (
    <div className={styles.stage}>
      <div className={styles.background}>
        <BusinessCardBackground environment={spec.environment} reducedMotion={reduced} isMobile={isMobile} />
      </div>
      <div className={styles.content}>
        <div className={styles.canvasWrap}>
          <div
            ref={containerRef}
            className={styles.canvasInner}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerLeave}
            onPointerLeave={onPointerLeave}
            onPointerEnter={onPointerEnter}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={onBlur}
            role="presentation"
          >
            {renderResult ? (
              <BusinessCardCanvas
                controller={controller}
                textures={{
                  frontTexture: renderResult.frontTexture,
                  backTexture: renderResult.backTexture,
                }}
                burstSignal={burstSignal}
                kickSignal={kickSignal}
                reducedMotion={reduced}
                isMobile={isMobile}
              />
            ) : null}
            {isRendering && <div className={styles.loadingOverlay}>Rendering card…</div>}
            <div ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
