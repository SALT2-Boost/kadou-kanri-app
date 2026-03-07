import { describe, it, expect } from 'vitest';
import {
  transformRevenueData,
  transformOverloadAlerts,
  transformUnassignedMembers,
} from './transforms';

describe('transformRevenueData', () => {
  it('空データの場合は空配列を返す', () => {
    expect(transformRevenueData([])).toEqual([]);
  });

  it('ステータス別に売上を集計する', () => {
    const data = [
      {
        month: '2026-03-01',
        project_id: 'p1',
        projects: { monthly_revenue: 100, status: '確定' as const },
      },
      {
        month: '2026-03-01',
        project_id: 'p2',
        projects: { monthly_revenue: 50, status: '提案済' as const },
      },
      {
        month: '2026-03-01',
        project_id: 'p3',
        projects: { monthly_revenue: 30, status: '提案予定' as const },
      },
    ];

    const result = transformRevenueData(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      month: '2026-03-01',
      confirmed: 100,
      proposed: 50,
      draft: 30,
    });
  });

  it('同一 month+project_id の重複を排除する', () => {
    const data = [
      {
        month: '2026-03-01',
        project_id: 'p1',
        projects: { monthly_revenue: 100, status: '確定' as const },
      },
      {
        month: '2026-03-01',
        project_id: 'p1',
        projects: { monthly_revenue: 100, status: '確定' as const },
      },
    ];

    const result = transformRevenueData(data);
    expect(result[0].confirmed).toBe(100); // 重複カウントしない
  });

  it('月ごとにソートされる', () => {
    const data = [
      {
        month: '2026-05-01',
        project_id: 'p1',
        projects: { monthly_revenue: 50, status: '確定' as const },
      },
      {
        month: '2026-03-01',
        project_id: 'p2',
        projects: { monthly_revenue: 100, status: '確定' as const },
      },
    ];

    const result = transformRevenueData(data);
    expect(result[0].month).toBe('2026-03-01');
    expect(result[1].month).toBe('2026-05-01');
  });

  it('projects が null の場合は売上 0 として扱う', () => {
    const data = [{ month: '2026-03-01', project_id: 'p1', projects: null }];

    const result = transformRevenueData(data);
    expect(result[0]).toEqual({
      month: '2026-03-01',
      confirmed: 0,
      proposed: 0,
      draft: 0,
    });
  });

  it('monthly_revenue が null の場合は 0 として扱う', () => {
    const data = [
      {
        month: '2026-03-01',
        project_id: 'p1',
        projects: { monthly_revenue: null, status: '確定' as const },
      },
    ];

    const result = transformRevenueData(data);
    expect(result[0].confirmed).toBe(0);
  });
});

describe('transformOverloadAlerts', () => {
  it('空データの場合は空配列を返す', () => {
    expect(transformOverloadAlerts([])).toEqual([]);
  });

  it('100%以下のメンバーはフィルタされる', () => {
    const data = [
      {
        member_id: 'm1',
        month: '2026-03-01',
        percentage: 80,
        member_name: '田中',
        is_unconfirmed: false,
      },
    ];

    const result = transformOverloadAlerts(data);
    expect(result).toHaveLength(0);
  });

  it('100%ちょうどのメンバーはフィルタされる', () => {
    const data = [
      {
        member_id: 'm1',
        month: '2026-03-01',
        percentage: 100,
        member_name: '田中',
        is_unconfirmed: false,
      },
    ];

    const result = transformOverloadAlerts(data);
    expect(result).toHaveLength(0);
  });

  it('同一メンバー・月の複数アサインを合計して 100% 超を検出する', () => {
    const data = [
      {
        member_id: 'm1',
        month: '2026-03-01',
        percentage: 60,
        member_name: '田中',
        is_unconfirmed: false,
      },
      {
        member_id: 'm1',
        month: '2026-03-01',
        percentage: 50,
        member_name: '田中',
        is_unconfirmed: false,
      },
    ];

    const result = transformOverloadAlerts(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      memberName: '田中',
      month: '2026-03-01',
      totalPercentage: 110,
    });
  });

  it('月 → メンバー名でソートされる', () => {
    const data = [
      {
        member_id: 'm2',
        month: '2026-04-01',
        percentage: 120,
        member_name: '鈴木',
        is_unconfirmed: false,
      },
      {
        member_id: 'm1',
        month: '2026-03-01',
        percentage: 120,
        member_name: '田中',
        is_unconfirmed: false,
      },
      {
        member_id: 'm1',
        month: '2026-04-01',
        percentage: 110,
        member_name: '田中',
        is_unconfirmed: false,
      },
    ];

    const result = transformOverloadAlerts(data);
    expect(result[0].month).toBe('2026-03-01');
    expect(result[1].memberName).toBe('田中');
    expect(result[2].memberName).toBe('鈴木');
  });

  it('members が null の場合は「不明」と表示する', () => {
    const data = [
      {
        member_id: 'm1',
        month: '2026-03-01',
        percentage: 120,
        member_name: '不明',
        is_unconfirmed: false,
      },
    ];

    const result = transformOverloadAlerts(data);
    expect(result[0].memberName).toBe('不明');
  });

  it('percentage が null の場合は 0 として扱う', () => {
    const data = [
      {
        member_id: 'm1',
        month: '2026-03-01',
        percentage: null,
        member_name: '田中',
        is_unconfirmed: false,
      },
    ];

    const result = transformOverloadAlerts(data);
    expect(result).toHaveLength(0);
  });

  it('未確定PJメンバーは過負荷判定から除外する', () => {
    const data = [
      {
        member_id: null,
        month: '2026-03-01',
        percentage: 150,
        member_name: '未定要員(PM)',
        is_unconfirmed: true,
      },
    ];

    const result = transformOverloadAlerts(data);
    expect(result).toEqual([]);
  });
});

describe('transformUnassignedMembers', () => {
  it('全員にアサインがある場合は空配列を返す', () => {
    const result = transformUnassignedMembers({
      members: [{ id: 'm1', name: '田中', category: '社員' }],
      assignments: [{ member_id: 'm1' }],
    });

    expect(result).toHaveLength(0);
  });

  it('アサインがないメンバーを返す', () => {
    const result = transformUnassignedMembers({
      members: [
        { id: 'm1', name: '田中', category: '社員' },
        { id: 'm2', name: '鈴木', category: '社員' },
      ],
      assignments: [{ member_id: 'm1' }],
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('鈴木');
  });

  it('アサインが空の場合は全メンバーを返す', () => {
    const result = transformUnassignedMembers({
      members: [
        { id: 'm1', name: '田中', category: '社員' },
        { id: 'm2', name: '鈴木', category: '社員' },
      ],
      assignments: [],
    });

    expect(result).toHaveLength(2);
  });

  it('メンバーが空の場合は空配列を返す', () => {
    const result = transformUnassignedMembers({
      members: [],
      assignments: [{ member_id: 'm1' }],
    });

    expect(result).toHaveLength(0);
  });
});
