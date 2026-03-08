export const MEMBER_CATEGORIES = ['社員', '入社予定', 'インターン', '未定枠'] as const;
export type MemberCategory = (typeof MEMBER_CATEGORIES)[number];

export const MEMBER_COMPANIES = ['SALT2', 'ブーストコンサルティング'] as const;
export type MemberCompany = (typeof MEMBER_COMPANIES)[number];

export const PROJECT_CATEGORIES = [
  '戦コン',
  'AIエージェント',
  'システムリプレイス',
  'データサイエンス',
  'その他',
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
