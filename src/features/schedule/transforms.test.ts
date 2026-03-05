import { describe, it, expect } from 'vitest';
import { transformToScheduleRows, transformToMonthlyView } from './transforms';
import type { MemberWithSkills, AssignmentWithProject, MonthlyAssignmentWithProject } from './api';

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

describe('transformToScheduleRows', () => {
  it('メンバーにアサインがない場合、months は空オブジェクト', () => {
    const members = [makeMember('m1', '田中')];
    const result = transformToScheduleRows(members, []);

    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBe('m1');
    expect(result[0].memberName).toBe('田中');
    expect(result[0].months).toEqual({});
  });

  it('単一アサインを正しくマッピングする', () => {
    const members = [makeMember('m1', '田中')];
    const assignments: AssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', month: '2026-03-01', percentage: 50, project_name: '案件A' },
    ];

    const result = transformToScheduleRows(members, assignments);
    const cell = result[0].months['2026-03-01'];

    expect(cell.totalPercentage).toBe(50);
    expect(cell.assignments).toHaveLength(1);
    expect(cell.assignments[0]).toEqual({
      projectId: 'p1',
      projectName: '案件A',
      percentage: 50,
    });
  });

  it('同じ月に複数案件のアサインがある場合、合計を計算する', () => {
    const members = [makeMember('m1', '田中')];
    const assignments: AssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', month: '2026-03-01', percentage: 60, project_name: '案件A' },
      { member_id: 'm1', project_id: 'p2', month: '2026-03-01', percentage: 50, project_name: '案件B' },
    ];

    const result = transformToScheduleRows(members, assignments);
    const cell = result[0].months['2026-03-01'];

    expect(cell.totalPercentage).toBe(110);
    expect(cell.assignments).toHaveLength(2);
  });

  it('percentage が null の場合は 0 として扱う', () => {
    const members = [makeMember('m1', '田中')];
    const assignments: AssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', month: '2026-03-01', percentage: null, project_name: '案件A' },
    ];

    const result = transformToScheduleRows(members, assignments);
    expect(result[0].months['2026-03-01'].totalPercentage).toBe(0);
  });

  it('スキル情報を正しく抽出する', () => {
    const members = [makeMember('m1', '田中', '社員', ['SWE', 'AIE'])];
    const result = transformToScheduleRows(members, []);

    expect(result[0].skills).toEqual(['SWE', 'AIE']);
  });

  it('複数メンバーのデータを正しく分離する', () => {
    const members = [
      makeMember('m1', '田中'),
      makeMember('m2', '鈴木'),
    ];
    const assignments: AssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', month: '2026-03-01', percentage: 100, project_name: '案件A' },
      { member_id: 'm2', project_id: 'p1', month: '2026-03-01', percentage: 50, project_name: '案件A' },
    ];

    const result = transformToScheduleRows(members, assignments);

    expect(result[0].months['2026-03-01'].totalPercentage).toBe(100);
    expect(result[1].months['2026-03-01'].totalPercentage).toBe(50);
  });

  it('複数月にまたがるアサインを正しく分類する', () => {
    const members = [makeMember('m1', '田中')];
    const assignments: AssignmentWithProject[] = [
      { member_id: 'm1', project_id: 'p1', month: '2026-03-01', percentage: 80, project_name: '案件A' },
      { member_id: 'm1', project_id: 'p1', month: '2026-04-01', percentage: 60, project_name: '案件A' },
    ];

    const result = transformToScheduleRows(members, assignments);

    expect(result[0].months['2026-03-01'].totalPercentage).toBe(80);
    expect(result[0].months['2026-04-01'].totalPercentage).toBe(60);
  });
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
