'use client';

import { ChangeEvent } from 'react';
import { BusinessCardSpec } from '../data/businessCardSpec';
import styles from './BusinessCardForm.module.css';

type BusinessCardFormProps = {
  spec: BusinessCardSpec;
  onChange: (next: BusinessCardSpec) => void;
};

export function BusinessCardForm({ spec, onChange }: BusinessCardFormProps) {
  const updateProfile = <K extends keyof BusinessCardSpec['profile']>(key: K, value: BusinessCardSpec['profile'][K]) => {
    onChange({ ...spec, profile: { ...spec.profile, [key]: value } });
  };

  const updateFront = <K extends keyof BusinessCardSpec['front']>(key: K, value: BusinessCardSpec['front'][K]) => {
    onChange({ ...spec, front: { ...spec.front, [key]: value } });
  };

  const updateBack = <K extends keyof BusinessCardSpec['back']>(key: K, value: BusinessCardSpec['back'][K]) => {
    onChange({ ...spec, back: { ...spec.back, [key]: value } });
  };

  const onStatChange = (index: number, value: number) => {
    const stats = spec.front.stats.map((stat, i) => (i === index ? { ...stat, value } : stat));
    updateFront('stats', stats);
  };

  const onHighlightChange = (index: number, text: string) => {
    const highlights = spec.back.highlights.map((item, i) => (i === index ? text : item));
    updateBack('highlights', highlights);
  };

  const onContactChange = (index: number, key: 'label' | 'value', value: string) => {
    const contact = spec.back.contact.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry));
    updateBack('contact', contact);
  };

  const handleNumberInput = (event: ChangeEvent<HTMLInputElement>, index: number) => {
    const raw = event.target.value;
    const numeric = Number(raw.replace(/[^0-9]/g, ''));
    onStatChange(index, Number.isNaN(numeric) ? 0 : numeric);
  };

  return (
    <form className={styles.form}>
      <section className={styles.section}>
        <div>
          <div className={styles.sectionHeader}>プロフィール</div>
          <div className={styles.sectionSub}>名刺のメイン情報を入力します</div>
        </div>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-name">表示名</label>
            <input
              id="card-name"
              className={styles.input}
              value={spec.profile.name}
              onChange={(event) => updateProfile('name', event.target.value)}
              placeholder="例: 霧ヶ峰 きらら"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-emoji">アクセント</label>
            <input
              id="card-emoji"
              className={styles.input}
              value={spec.profile.accentEmoji ?? ''}
              onChange={(event) => updateProfile('accentEmoji', event.target.value)}
              placeholder="例: ✨"
              maxLength={4}
            />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-username">ユーザー名</label>
            <input
              id="card-username"
              className={styles.input}
              value={spec.profile.username}
              onChange={(event) => updateProfile('username', event.target.value)}
              placeholder="例: kirakira"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-pronouns">代名詞</label>
            <input
              id="card-pronouns"
              className={styles.input}
              value={spec.profile.pronouns ?? ''}
              onChange={(event) => updateProfile('pronouns', event.target.value)}
              placeholder="例: she / her"
            />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-location">所在地</label>
            <input
              id="card-location"
              className={styles.input}
              value={spec.profile.location ?? ''}
              onChange={(event) => updateProfile('location', event.target.value)}
              placeholder="例: Tokyo, Japan"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-website">ウェブサイト</label>
            <input
              id="card-website"
              className={styles.input}
              value={spec.profile.website ?? ''}
              onChange={(event) => updateProfile('website', event.target.value)}
              placeholder="例: kirayourcard.example"
            />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-join">参加日</label>
            <input
              id="card-join"
              className={styles.input}
              value={spec.profile.joinDate ?? ''}
              onChange={(event) => updateProfile('joinDate', event.target.value)}
              placeholder="例: Apr 2021"
            />
          </div>
          <div className={`${styles.field} ${styles.toggleRow}`}>
            <label className={styles.label} htmlFor="card-verified">認証バッジ</label>
            <input
              id="card-verified"
              type="checkbox"
              className={styles.checkbox}
              checked={spec.profile.isVerified}
              onChange={(event) => updateProfile('isVerified', event.target.checked)}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="card-bio">自己紹介</label>
          <textarea
            id="card-bio"
            className={styles.textarea}
            value={spec.profile.bio}
            onChange={(event) => updateProfile('bio', event.target.value)}
            maxLength={220}
            placeholder="180文字程度でキャッチコピーを伝えましょう"
          />
          <div className={styles.smallHint}>{spec.profile.bio.length} / 220</div>
        </div>
      </section>

      <section className={styles.section}>
        <div>
          <div className={styles.sectionHeader}>ビジュアル</div>
          <div className={styles.sectionSub}>画像とカラーはURLで差し替え可能です</div>
        </div>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-banner">バナー画像URL</label>
            <input
              id="card-banner"
              className={styles.input}
              value={spec.front.bannerImage}
              onChange={(event) => updateFront('bannerImage', event.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-avatar">プロフィール画像URL</label>
            <input
              id="card-avatar"
              className={styles.input}
              value={spec.front.profileImage}
              onChange={(event) => updateFront('profileImage', event.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="card-theme">テーマカラー</label>
            <input
              id="card-theme"
              className={styles.input}
              value={spec.front.themeColor}
              onChange={(event) => updateFront('themeColor', event.target.value)}
              placeholder="#1d9bf0"
            />
          </div>
        </div>
        <div>
          <div className={styles.label}>統計</div>
          <div className={styles.fieldGroup}>
            {spec.front.stats.map((stat, index) => (
              <div key={stat.label} className={styles.field}>
                <label className={styles.label}>{stat.label}</label>
                <input
                  className={styles.input}
                  value={stat.value.toString()}
                  onChange={(event) => handleNumberInput(event, index)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div>
          <div className={styles.sectionHeader}>裏面コンテンツ</div>
          <div className={styles.sectionSub}>サービス説明や連絡先をまとめましょう</div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="card-headline">見出し</label>
          <input
            id="card-headline"
            className={styles.input}
            value={spec.back.headline}
            onChange={(event) => updateBack('headline', event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="card-summary">概要</label>
          <textarea
            id="card-summary"
            className={styles.textarea}
            value={spec.back.summary}
            onChange={(event) => updateBack('summary', event.target.value)}
            maxLength={360}
            placeholder="サービスの価値や特徴を簡潔に"
          />
          <div className={styles.smallHint}>{spec.back.summary.length} / 360</div>
        </div>
        <div>
          <div className={styles.label}>ハイライト</div>
          {spec.back.highlights.map((item, index) => (
            <div key={index} className={styles.field}>
              <input
                className={styles.input}
                value={item}
                onChange={(event) => onHighlightChange(index, event.target.value)}
                placeholder="例: 3Dプレビューですぐ共有"
              />
            </div>
          ))}
        </div>
        <div>
          <div className={styles.label}>連絡先</div>
          {spec.back.contact.map((entry, index) => (
            <div key={index} className={styles.fieldGroup}>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  value={entry.label}
                  onChange={(event) => onContactChange(index, 'label', event.target.value)}
                  placeholder="Mail"
                />
              </div>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  value={entry.value}
                  onChange={(event) => onContactChange(index, 'value', event.target.value)}
                  placeholder="hello@kirayourcard.example"
                />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="card-footer">フッターノート</label>
          <input
            id="card-footer"
            className={styles.input}
            value={spec.back.footerNote ?? ''}
            onChange={(event) => updateBack('footerNote', event.target.value)}
            placeholder="© 2025 KiraYourCard"
          />
        </div>
      </section>
    </form>
  );
}
