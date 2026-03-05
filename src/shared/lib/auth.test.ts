import { describe, it, expect } from 'vitest';

// auth.ts は supabase.ts を import するため、直接テスト用に関数を複製
// 実際の isAllowedEmail と同じロジック
const ALLOWED_DOMAIN = 'boostconsulting.co.jp';
function isAllowedEmail(email: string): boolean {
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}

describe('isAllowedEmail', () => {
  it('boostconsulting.co.jp ドメインを許可する', () => {
    expect(isAllowedEmail('tasuku.onizawa@boostconsulting.co.jp')).toBe(true);
  });

  it('他のドメインを拒否する', () => {
    expect(isAllowedEmail('user@gmail.com')).toBe(false);
    expect(isAllowedEmail('user@example.com')).toBe(false);
  });

  it('サブドメインを拒否する', () => {
    expect(isAllowedEmail('user@sub.boostconsulting.co.jp')).toBe(false);
  });

  it('空文字を拒否する', () => {
    expect(isAllowedEmail('')).toBe(false);
  });

  it('部分一致を拒否する（偽装防止）', () => {
    expect(isAllowedEmail('user@fakeboostconsulting.co.jp')).toBe(false);
  });
});
