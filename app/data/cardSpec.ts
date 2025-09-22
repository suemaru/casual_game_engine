export type BusinessCardFrontSpec = {
  name: string;
  username: string;
  emoji?: string;
  bio: string;
  website?: string;
  headerImage: string;
  profileImage: string;
};

export type BusinessCardBackSpec = {
  username: string;
  website?: string;
};

export type CardTextureSpec = {
  front: string;
  back: string;
  hologram?: string;
};

export type CardSpec = {
  front: BusinessCardFrontSpec;
  back: BusinessCardBackSpec;
  textures: CardTextureSpec;
};

export const cardSpec: CardSpec = {
  front: {
    name: '優花 悠凪',
    username: 'yuuka_dev',
    emoji: '🌌',
    bio: 'AIと小さなソーシャルゲームで世界をほんの少しだけ楽しくする制作中。猫とシンセ音源がエネルギー。',
    website: 'https://yuuka.dev',
    headerImage: '/assets/business-card/banner-default.svg',
    profileImage: '/assets/business-card/profile-default.svg',
  },
  back: {
    username: 'yuuka_dev',
    website: 'https://yuuka.dev',
  },
  textures: {
    front: '/assets/card/main.png',
    back: '/assets/card/background.png',
    hologram: '/assets/card/subject.png',
  },
};
