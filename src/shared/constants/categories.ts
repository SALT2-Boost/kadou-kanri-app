export const MEMBER_CATEGORIES = ['社員', '入社予定', 'インターン', '未定枠'] as const;
export type MemberCategory = (typeof MEMBER_CATEGORIES)[number];
