'use client';

import { useEffect, useRef } from 'react';
import { BusinessCardRenderResult } from '../hooks/useBusinessCardRender';
import styles from './BusinessCardPreviewPanel.module.css';

type PreviewSide = 'front' | 'back';

type BusinessCardPreviewPanelProps = {
  renderResult: BusinessCardRenderResult | null;
  isRendering: boolean;
  side: PreviewSide;
  onSideChange: (side: PreviewSide) => void;
};

export function BusinessCardPreviewPanel({ renderResult, isRendering, side, onSideChange }: BusinessCardPreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const targetCanvas = canvasRef.current;
    if (!targetCanvas || !renderResult) return;

    const source = side === 'front' ? renderResult.frontCanvas : renderResult.backCanvas;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    targetCanvas.width = source.width;
    targetCanvas.height = source.height;
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(source, 0, 0, targetCanvas.width, targetCanvas.height);
  }, [renderResult, side]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>2Dプレビュー</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>出力レイアウトの確認</div>
        </div>
        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={`${styles.toggleButton} ${side === 'front' ? styles.toggleButtonActive : ''}`}
            onClick={() => onSideChange('front')}
          >
            表面
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${side === 'back' ? styles.toggleButtonActive : ''}`}
            onClick={() => onSideChange('back')}
          >
            裏面
          </button>
        </div>
      </div>
      <div className={styles.canvasFrame}>
        {renderResult ? (
          <canvas ref={canvasRef} aria-label={`Business card ${side}`} />
        ) : (
          <div className={styles.placeholder}>{isRendering ? 'レンダリング中…' : 'カードを編集中…'}</div>
        )}
      </div>
    </div>
  );
}
