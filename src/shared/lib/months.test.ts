import { describe, expect, it } from 'vitest';
import {
  addMonthsToMonthStart,
  addMonthsToMonthValue,
  buildInclusiveMonthStartRange,
  buildMonthStartRange,
  getCurrentMonthStart,
  getCurrentMonthValue,
} from './months';

describe('months helpers', () => {
  it('現在月を YYYY-MM と YYYY-MM-01 で返せる', () => {
    const now = new Date('2026-03-15T12:34:56+09:00');

    expect(getCurrentMonthValue(now)).toBe('2026-03');
    expect(getCurrentMonthStart(now)).toBe('2026-03-01');
  });

  it('month 文字列をブラウザ依存の Date parse なしで加算できる', () => {
    expect(addMonthsToMonthValue('2026-11', 3)).toBe('2027-02');
    expect(addMonthsToMonthStart('2026-11-01', 3)).toBe('2027-02-01');
  });

  it('期間ビュー用の月レンジを安定して生成する', () => {
    expect(buildMonthStartRange('2026-03-01', 6)).toEqual([
      '2026-03-01',
      '2026-04-01',
      '2026-05-01',
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
    ]);
  });

  it('案件詳細用の開始月-終了月レンジを安定して生成する', () => {
    expect(buildInclusiveMonthStartRange('2026-11-01', '2027-02-01')).toEqual([
      '2026-11-01',
      '2026-12-01',
      '2027-01-01',
      '2027-02-01',
    ]);
  });

  it('不正な month 文字列では空や null を返し NaN を作らない', () => {
    expect(addMonthsToMonthStart('invalid', 1)).toBeNull();
    expect(buildMonthStartRange('invalid', 6)).toEqual([]);
    expect(buildInclusiveMonthStartRange('2026-03-01', 'invalid')).toEqual([]);
  });
});
