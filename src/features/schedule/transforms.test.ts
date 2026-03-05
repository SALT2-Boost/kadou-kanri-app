import { describe, it, expect } from 'vitest';
import { transformToMonthlyView } from './transforms';
import type { MemberWithSkills, MonthlyAssignmentWithProject } from './api';

const makeMember = (
  id: string,
  name: string,
  category: '社員' | '入社予定' | 'インターン' | '未定枠' = '社員',
  skills: string[] = [],
): MemberWithSkills => ({
  id,
  name,
  category,
  skills: skills.map((s, i) => ({ skill_id: `s${i}`, name: s })),
});

describe('transformToMonthlyView', () => {
  it('アサインがない場合、空のプロジェクト配列と 0% の行を返す', () => {
    const members = [makeMember('m1', '田中')];
    const result = transformToMonthlyView(members, []);

    expect(result.projects).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].totalPercentage).toBe(0);
    expect(result.rows[0].projects).toEqual({});
  });

  it('一意な案件リストを抽出する', () => {
    const members = [makeMember('m1', '田中'), makeMember('m2', '鈴木')];
    const assignments: MonthlyAssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', percentage: 50, project_name: '案件A' },
      { member_id: 'm2', project_id: 'p1', percentage: 30, project_name: '案件A' },
      { member_id: 'm1', project_id: 'p2', percentage: 50, project_name: '案件B' },
    ];

    const result = transformToMonthlyView(members, assignments);

    expect(result.projects).toHaveLength(2);
    expect(result.projects.map((p) => p.name).sort()).toEqual(['案件A', '案件B']);
  });

  it('メンバーごとの合計稼働%を正しく計算する', () => {
    const members = [makeMember('m1', '田中')];
    const assignments: MonthlyAssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', percentage: 60, project_name: '案件A' },
      { member_id: 'm1', project_id: 'p2', percentage: 50, project_name: '案件B' },
    ];

    const result = transformToMonthlyView(members, assignments);

    expect(result.rows[0].totalPercentage).toBe(110);
    expect(result.rows[0].projects['p1']).toBe(60);
    expect(result.rows[0].projects['p2']).toBe(50);
  });

  it('percentage が null の場合は 0 として扱う', () => {
    const members = [makeMember('m1', '田中')];
    const assignments: MonthlyAssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', percentage: null, project_name: '案件A' },
    ];

    const result = transformToMonthlyView(members, assignments);
    expect(result.rows[0].totalPercentage).toBe(0);
  });
});
