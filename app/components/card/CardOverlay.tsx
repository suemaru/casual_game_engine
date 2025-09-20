'use client';

import clsx from 'clsx';
import { forwardRef, useEffect, useState } from 'react';
import { CardSpec } from '../../data/cardSpec';
import styles from './CardShowcase.module.css';

export type CardOverlayProps = {
  spec: CardSpec;
  burstSignal: number;
  kickSignal: number;
};

export const CardOverlay = forwardRef<HTMLDivElement, CardOverlayProps>(
  ({ spec, burstSignal, kickSignal }, ref) => {
    const [burstActive, setBurstActive] = useState(false);
    const [kickActive, setKickActive] = useState(false);

    useEffect(() => {
      if (!burstSignal) return;
      setBurstActive(true);
      const timer = setTimeout(() => setBurstActive(false), 260);
      return () => clearTimeout(timer);
    }, [burstSignal]);

    useEffect(() => {
      if (!kickSignal) return;
      setKickActive(true);
      const timer = setTimeout(() => setKickActive(false), 300);
      return () => clearTimeout(timer);
    }, [kickSignal]);

    return (
      <div ref={ref} className={styles.overlay}>
        {/* タイトルブロック：文字サイズや影は styles.title で調整 */}
        <h1 className={clsx(styles.title, burstActive && styles.burstPulse)}>{spec.title}</h1>

        {/* detailSection 内でステータス／フレーバー／シリアルの余白と並びを制御 */}
        <div className={clsx(styles.detailSection, kickActive && styles.haneFlash)}>
          {/* statsRow をいじるとフォントや列数を変更できる */}
          <div className={styles.statsRow}>
            {spec.parameters.map((param) => (
              <div key={param.label} className={styles.stat}>
                <span>{param.label}</span>
                <span>{param.value}</span>
              </div>
            ))}
          </div>
          {/* story は背景付きのフレーバー枠。影やぼかしは CSS 側で管理 */}
          <p className={styles.story}>{spec.story}</p>
          {/* serial の位置や字間も CSS 側の styles.serial をいじれば調整可能 */}
          <p className={styles.serial}>{spec.serial}</p>
        </div>
      </div>
    );
  },
);

CardOverlay.displayName = 'CardOverlay';
