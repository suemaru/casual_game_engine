export type BusinessCardStat = {
  label: string;
  value: number;
};

export type BusinessCardProfile = {
  name: string;
  username: string;
  pronouns?: string;
  accentEmoji?: string;
  bio: string;
  location?: string;
  website?: string;
  joinDate?: string;
  isVerified: boolean;
};

export type BusinessCardFrontSpec = {
  bannerImage: string;
  profileImage: string;
  themeColor: string;
  stats: BusinessCardStat[];
};

export type BusinessCardBackSpec = {
  headline: string;
  summary: string;
  highlights: string[];
  contact: { label: string; value: string }[];
  footerNote?: string;
};

export type BusinessCardEnvironmentSpec = {
  gradientStops: [string, string, string];
  sparkles: {
    colors: string[];
    count: number;
    size: number;
    speed: number;
    opacity: number;
  };
};

export type BusinessCardSizeSpec = {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  dpi: number;
};

export type BusinessCardSpec = {
  id: string;
  size: BusinessCardSizeSpec;
  profile: BusinessCardProfile;
  front: BusinessCardFrontSpec;
  back: BusinessCardBackSpec;
  environment: BusinessCardEnvironmentSpec;
};

export const DEFAULT_BUSINESS_CARD_SPEC: BusinessCardSpec = {
  id: 'kira-your-card-mvp',
  size: {
    widthMm: 91,
    heightMm: 55,
    bleedMm: 3,
    safeMarginMm: 3,
    dpi: 350,
  },
  profile: {
    name: '霧ヶ峰 きらら',
    username: 'kirakira',
    pronouns: 'she / her',
    accentEmoji: '✨',
    bio: '触れると光が走るホログラム名刺を個人開発中。小さなコミュニティを育てるのが大好き。',
    location: 'Tokyo, Japan',
    website: 'kirayourcard.example',
    joinDate: 'Apr 2021',
    isVerified: true,
  },
  front: {
    bannerImage: '/assets/business-card/banner-default.svg',
    profileImage: '/assets/business-card/profile-default.svg',
    themeColor: '#1d9bf0',
    stats: [
      { label: 'Posts', value: 328 },
      { label: 'Following', value: 412 },
      { label: 'Followers', value: 1950 },
    ],
  },
  back: {
    headline: '「シェアしたくなる一枚」',
    summary: 'SNSプロフィールと3Dホログラムをひとつにまとめた名刺サービス。好きな画像とテキストで印象をデザインできます。',
    highlights: [
      'ワンクリックで3Dプレビュー',
      'URL共有でオンライン配布',
      'ホログラム演出をプリセットで調整',
    ],
    contact: [
      { label: 'Mail', value: 'hello@kirayourcard.example' },
      { label: 'X', value: '@kirakira' },
      { label: 'Web', value: 'kirayourcard.example' },
    ],
    footerNote: '© 2025 KiraYourCard. All rights reserved.',
  },
  environment: {
    gradientStops: ['#020314', '#0b1c3f', '#251238'],
    sparkles: {
      colors: ['#79c0ff', '#b394ff', '#ffe66d'],
      count: 140,
      size: 4.5,
      speed: 0.65,
      opacity: 0.75,
    },
  },
};
