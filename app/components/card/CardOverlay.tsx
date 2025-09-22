'use client';

import Image from 'next/image';
import { forwardRef, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { CardSpec } from '../../data/cardSpec';
import layoutStyles from './CardShowcase.module.css';
import styles from './CardOverlay.module.css';

export type CardOverlayProps = {
  spec: CardSpec;
};

const normalizeWebsite = (value?: string) => {
  if (!value) return undefined;
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
};

export const CardOverlay = forwardRef<HTMLDivElement, CardOverlayProps>(({ spec }, ref) => {
  const { front, back } = spec;
  const [xProfileQr, setXProfileQr] = useState<string | null>(null);
  const [websiteQr, setWebsiteQr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setXProfileQr(null);
    setWebsiteQr(null);

    const generateQrCodes = async () => {
      const xUrl = `https://x.com/${front.username}`;
      try {
        const dataUrl = await QRCode.toDataURL(xUrl, { width: 160, margin: 1 });
        if (!cancelled) {
          setXProfileQr(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate X profile QR code', error);
        if (!cancelled) {
          setXProfileQr(null);
        }
      }

      const websiteUrl = normalizeWebsite(back.website ?? front.website);
      if (!websiteUrl) {
        if (!cancelled) {
          setWebsiteQr(null);
        }
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(websiteUrl, { width: 160, margin: 1 });
        if (!cancelled) {
          setWebsiteQr(dataUrl);
        }
      } catch (error) {
        console.error('Failed to generate website QR code', error);
        if (!cancelled) {
          setWebsiteQr(null);
        }
      }
    };

    generateQrCodes();

    return () => {
      cancelled = true;
    };
  }, [front.username, front.website, back.website]);

  return (
    <div ref={ref} className={layoutStyles.overlay}>
      <div className={styles.previewStack}>
        <article className={`${styles.card}`} aria-label="名刺の表面プレビュー">
          <div className={styles.frontHeader}>
            <Image
              src={front.headerImage}
              alt="プロフィールのヘッダー画像"
              className={styles.headerImage}
              width={1200}
              height={450}
              unoptimized
            />
          </div>
          <div className={styles.avatarRing}>
            <Image
              src={front.profileImage}
              alt={`${front.name}のプロフィール画像`}
              className={styles.profileImage}
              width={512}
              height={512}
              unoptimized
            />
          </div>
          <div className={styles.frontBody}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{front.name}</span>
              {front.emoji ? <span className={styles.emoji}>{front.emoji}</span> : null}
              <span className={styles.username}>@{front.username}</span>
            </div>
            <p className={styles.bio}>{front.bio}</p>
            {front.website ? (
              <div className={styles.websiteRow}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.websiteIcon}>
                  <path
                    d="M10.59 13.41a1 1 0 0 1 0-1.41l2.83-2.83a1 1 0 0 1 1.41 1.41l-2.83 2.83a1 1 0 0 1-1.41 0Z"
                  />
                  <path
                    d="M12.71 5.29a1 1 0 0 1 1.41 0l2.59 2.59a1 1 0 0 1 0 1.41l-.88.88a1 1 0 1 1-1.41-1.41l.18-.18-1.18-1.18-1.18 1.18a1 1 0 0 1-1.41-1.41l2-2Z"
                  />
                  <path
                    d="M8.71 9.29a1 1 0 0 1 1.41 0l1.59 1.59-1.41 1.41-1.59-1.59a1 1 0 0 1 0-1.41Z"
                  />
                  <path
                    d="M7.29 12.71a1 1 0 0 1 0-1.41l.88-.88a1 1 0 0 1 1.41 1.41l-.18.18 1.18 1.18 1.18-1.18a1 1 0 0 1 1.41 1.41l-2 2a1 1 0 0 1-1.41 0l-2.59-2.59Z"
                  />
                  <path d="M8 5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 19a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className={styles.websiteText}>{front.website}</span>
              </div>
            ) : null}
          </div>
        </article>

        <article className={`${styles.card} ${styles.backCard}`} aria-label="名刺の裏面プレビュー">
          <div className={styles.qrRow}>
            <div className={styles.qrBlock}>
              {xProfileQr ? (
                <Image
                  src={xProfileQr}
                  alt={`@${front.username} のXプロフィールへのQRコード`}
                  className={styles.qrImage}
                  width={160}
                  height={160}
                  unoptimized
                />
              ) : (
                <div className={styles.qrPlaceholder}>QR生成中…</div>
              )}
              <p className={styles.qrLabel}>X Profile</p>
              <p className={styles.qrValue}>@{front.username}</p>
            </div>

            {(back.website ?? front.website) ? (
              <div className={styles.qrBlock}>
                {websiteQr ? (
                  <Image
                    src={websiteQr}
                    alt={`ウェブサイト${back.website ?? front.website}へのQRコード`}
                    className={styles.qrImage}
                    width={160}
                    height={160}
                    unoptimized
                  />
                ) : (
                  <div className={styles.qrPlaceholder}>QR生成中…</div>
                )}
                <p className={styles.qrLabel}>Website</p>
                <p className={styles.qrValue}>{back.website ?? front.website}</p>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </div>
  );
});

CardOverlay.displayName = 'CardOverlay';
