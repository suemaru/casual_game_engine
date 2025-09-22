'use client';

import { useMemo, useState } from 'react';
import { BusinessCardSpec, DEFAULT_BUSINESS_CARD_SPEC } from '../data/businessCardSpec';
import { useBusinessCardRender } from '../hooks/useBusinessCardRender';
import { BusinessCardForm } from './BusinessCardForm';
import { BusinessCardPreviewPanel } from './BusinessCardPreviewPanel';
import { BusinessCardStage } from './BusinessCardStage';
import styles from './BusinessCardEditor.module.css';

type PreviewSide = 'front' | 'back';

export function BusinessCardEditor() {
  const [spec, setSpec] = useState<BusinessCardSpec>(DEFAULT_BUSINESS_CARD_SPEC);
  const [previewSide, setPreviewSide] = useState<PreviewSide>('front');

  const specForRender = useMemo(() => ({ ...spec }), [spec]);
  const { result, isRendering } = useBusinessCardRender(specForRender);

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.title}>KiraYourCard（仮）ビルダー</div>
          <div className={styles.subtitle}>Xプロフィール風の名刺を編集しながら3Dホログラムで確認</div>
        </div>
        <div className={styles.actionHint}>ステップ: 情報入力 → 2D確認 → 3Dプレビュー</div>
      </div>
      <aside className={styles.sidebar}>
        <BusinessCardForm spec={spec} onChange={setSpec} />
      </aside>
      <section className={styles.previewColumn}>
        <div className={styles.stageContainer}>
          <BusinessCardStage spec={spec} renderResult={result} isRendering={isRendering} />
        </div>
        <BusinessCardPreviewPanel
          renderResult={result}
          isRendering={isRendering}
          side={previewSide}
          onSideChange={setPreviewSide}
        />
      </section>
    </div>
  );
}
