'use client';

import { KeyboardEvent, PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { MathUtils } from 'three';
import { CardSpec } from '../../data/cardSpec';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';
import { CardController } from './CardController';
import styles from './CardShowcase.module.css';
import { CardCanvas } from './CardCanvas';
import { CardOverlay } from './CardOverlay';
import { SceneBackground } from './SceneBackground';

export type CardShowcaseProps = {
  spec: CardSpec;
};

export function CardShowcase({ spec }: CardShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CardController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new CardController();
  }
  const controller = controllerRef.current!;

  const overlayRef = useRef<HTMLDivElement>(null);

  const reduced = useReducedMotion();
  const isMobile = useIsMobile();

  const pressedKeysRef = useRef<Set<string>>(new Set());

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
    controller.setKeyboardTilt(0, 0);
  }, [controller]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const overlay = overlayRef.current;
      if (overlay) {
        const rotateX = MathUtils.radToDeg(controller.rotation.x);
        const rotateY = MathUtils.radToDeg(controller.rotation.y);
        overlay.style.setProperty(
          '--overlay-tilt',
          `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        );
        // depth を変えるとUIカードの浮き具合を調整できる
        const depth = 0;
        overlay.style.setProperty('--overlay-z', `${depth}`);
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [controller]);

  const [burstSignal, setBurstSignal] = useState(0);
  const [kickSignal, setKickSignal] = useState(0);

  useEffect(() => {
    controller.onBurst = () => setBurstSignal((prev) => prev + 1);
    controller.onKick = () => setKickSignal((prev) => prev + 1);
    controller.resetIntro();
  }, [controller]);

  const getRect = () => containerRef.current?.getBoundingClientRect();

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rect = getRect();
    if (!rect) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some mobile browsers lack pointer capture; ignore safely.
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
    <section className={styles.wrapper}>
      <div className={styles.backgroundCanvas}>
        <SceneBackground reducedMotion={reduced} isMobile={isMobile} />
      </div>
      <div
        ref={containerRef}
        className={styles.cardContainer}
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
      >
        <div className={styles.canvasWrapper}>
          <CardCanvas
            spec={spec}
            controller={controller}
            burstSignal={burstSignal}
            kickSignal={kickSignal}
            reducedMotion={reduced}
            isMobile={isMobile}
          />
        </div>
        <CardOverlay
          ref={overlayRef}
          spec={spec}
          burstSignal={burstSignal}
          kickSignal={kickSignal}
        />
      </div>
    </section>
  );
}
