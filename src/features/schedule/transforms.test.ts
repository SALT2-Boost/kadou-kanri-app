import { describe, expect, it } from 'vitest';
import { buildPeriodRows, filterScheduleRows, transformToMonthlyView } from './transforms';
import type { MemberWithSkills, ProjectMemberWithAssignments } from './api';

const makeMember = (overrides: Partial<MemberWithSkills> = {}): MemberWithSkills => ({
  id: 'm-1',
  name: '田中',
  category: '社員',
  role: 'SWE',
  skills: [
    {
      skill_id: 's-1',
      name: 'TypeScript',
    },
  ],
  ...overrides,
});

const makeProjectMember = (
  overrides: Partial<ProjectMemberWithAssignments> = {},
): ProjectMemberWithAssignments => ({
  id: 'pm-1',
  project_id: 'p-1',
  member_id: 'm-1',
  name: '田中',
  role: 'SWE',
  projects: {
    id: 'p-1',
    name: '案件A',
  },
  members: {
    id: 'm-1',
    name: '田中',
    category: '社員',
  },
  project_member_skills: [
    {
      skill_id: 's-2',
      skills: {
        id: 's-2',
        name: 'React',
      },
    },
  ],
  assignments: [
    {
      id: 'a-1',
      project_member_id: 'pm-1',
      month: '2026-03-01',
      percentage: 50,
      note: null,
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    },
  ],
  ...overrides,
});

describe('transformToMonthlyView', () => {
  it('確定PJメンバーは member 単位で集約し、PJ側skillsをunionする', () => {
    const result = transformToMonthlyView(
      [
        makeMember({
          skills: [{ skill_id: 's-1', name: 'TypeScript' }],
        }),
      ],
      [
        makeProjectMember({
          project_member_skills: [{ skill_id: 's-2', skills: { id: 's-2', name: 'React' } }],
        }),
      ],
    );

    expect(result.projects).toEqual([{ id: 'p-1', name: '案件A' }]);
    expect(result.rows[0]).toMatchObject({
      rowId: 'm-1',
      memberId: 'm-1',
      memberName: '田中',
      role: 'SWE',
      isUnconfirmed: false,
      totalPercentage: 50,
    });
    expect(result.rows[0].skills.sort()).toEqual(['React', 'TypeScript']);
    expect(result.rows[0].projects['p-1']).toBe(50);
  });

  it('未確定PJメンバーは独立した行で返す', () => {
    const result = transformToMonthlyView(
      [],
      [
        makeProjectMember({
          id: 'pm-2',
          member_id: null,
          name: '未定要員(PM)',
          role: 'PM',
          members: null,
          project_member_skills: [
            {
              skill_id: 's-3',
              skills: {
                id: 's-3',
                name: '進行管理',
              },
            },
          ],
          assignments: [
            {
              id: 'a-2',
              project_member_id: 'pm-2',
              month: '2026-03-01',
              percentage: 80,
              note: null,
              created_at: '2026-03-01T00:00:00Z',
              updated_at: '2026-03-01T00:00:00Z',
            },
          ],
        }),
      ],
    );

    expect(result.rows[0]).toMatchObject({
      rowId: 'pm-2',
      memberId: null,
      memberName: '未定要員(PM)',
      role: 'PM',
      isUnconfirmed: true,
      category: '未定枠',
      totalPercentage: 80,
    });
    expect(result.rows[0].skills).toEqual(['進行管理']);
  });
});

describe('buildPeriodRows', () => {
  it('期間ビューでは確定memberと未確定PJメンバーを同じ行型へ正規化する', () => {
    const rows = buildPeriodRows(
      [makeMember()],
      [
        makeProjectMember({
          assignments: [
            {
              id: 'a-1',
              project_member_id: 'pm-1',
              month: '2026-03-01',
              percentage: 50,
              note: null,
              created_at: '2026-03-01T00:00:00Z',
              updated_at: '2026-03-01T00:00:00Z',
            },
            {
              id: 'a-2',
              project_member_id: 'pm-1',
              month: '2026-04-01',
              percentage: 30,
              note: null,
              created_at: '2026-03-01T00:00:00Z',
              updated_at: '2026-03-01T00:00:00Z',
            },
          ],
        }),
        makeProjectMember({
          id: 'pm-2',
          member_id: null,
          name: '未定要員(QA)',
          role: 'QA',
          members: null,
          assignments: [
            {
              id: 'a-3',
              project_member_id: 'pm-2',
              month: '2026-04-01',
              percentage: 40,
              note: null,
              created_at: '2026-03-01T00:00:00Z',
              updated_at: '2026-03-01T00:00:00Z',
            },
          ],
        }),
      ],
    );

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.rowId === 'm-1')?.months['2026-03-01']).toMatchObject({
      totalPercentage: 50,
    });
    expect(rows.find((row) => row.rowId === 'pm-2')).toMatchObject({
      memberName: '未定要員(QA)',
      role: 'QA',
      isUnconfirmed: true,
      category: '未定枠',
    });
  });
});

describe('filterScheduleRows', () => {
  it('未確定のみフィルタを適用できる', () => {
    const rows = [
      {
        rowId: 'm-1',
        memberId: 'm-1',
        memberName: '田中',
        category: '社員' as const,
        role: 'SWE',
        isUnconfirmed: false,
        skills: ['TypeScript'],
        months: {},
      },
      {
        rowId: 'pm-1',
        memberId: null,
        memberName: '未定要員(PM)',
        category: '未定枠' as const,
        role: 'PM',
        isUnconfirmed: true,
        skills: ['進行管理'],
        months: {},
      },
    ];

    expect(
      filterScheduleRows(rows, {
        categories: ['社員', '未定枠'],
        selectedSkills: [],
        searchText: '',
        onlyUnconfirmed: true,
      }),
    ).toEqual([rows[1]]);
  });
});
