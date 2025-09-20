export type CardParameter = {
  label: string;
  value: number;
};

export type CardSpec = {
  title: string;
  serial: string;
  story: string;
  tone: 'Warm' | 'Neutral' | 'Cool';
  parameters: CardParameter[];
  assets: {
    main: string;
    subject?: string;
    background: string;
  };
};

export const cardSpec: CardSpec = {
  title: 'ノクターン・サーヴァント',
  serial: 'No.0001 / 4197',
  story:
    '遥かな戦場で生まれた。持ち主の心臓に共鳴し、静かな夜に真価を発揮する。',
  tone: 'Cool',
  parameters: [
    { label: 'ATK', value: 342 },
    { label: 'DEF', value: 287 },
    { label: 'TEC', value: 406 },
    { label: 'SPD', value: 318 },
  ],
  assets: {
    main: '/assets/card/main.png',
    subject: '/assets/card/subject.png',
    background: '/assets/card/background.png',
  },
};
