import { describe, expect, it } from 'vitest';
import { buildProjectMemberRows } from './transforms';
import type { ProjectMemberWithAssignments } from './types';

const makeProjectMember = (
  overrides: Partial<ProjectMemberWithAssignments> = {},
): ProjectMemberWithAssignments => ({
  id: 'pm-1',
  project_id: 'p-1',
  member_id: 'm-1',
  name: '田中',
  role: 'SWE',
  note: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  members: {
    id: 'm-1',
    name: '田中',
    category: '社員',
    role: 'SWE',
  },
  project_member_skills: [
    {
      skill_id: 's-1',
      skills: {
        id: 's-1',
        name: 'TypeScript',
      },
    },
  ],
  assignments: [
    {
      id: 'a-1',
      project_member_id: 'pm-1',
      month: '2026-03-01',
      percentage: 100,
      note: null,
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    },
  ],
  ...overrides,
});

describe('buildProjectMemberRows', () => {
  it('PJメンバーごとに role, skills, 月別セルを行へ展開する', () => {
    const rows = buildProjectMemberRows([
      makeProjectMember({
        assignments: [
          {
            id: 'a-1',
            project_member_id: 'pm-1',
            month: '2026-03-01',
            percentage: 100,
            note: null,
            created_at: '2026-03-01T00:00:00Z',
            updated_at: '2026-03-01T00:00:00Z',
          },
          {
            id: 'a-2',
            project_member_id: 'pm-1',
            month: '2026-04-01',
            percentage: 60,
            note: null,
            created_at: '2026-03-01T00:00:00Z',
            updated_at: '2026-03-01T00:00:00Z',
          },
        ],
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      projectMemberId: 'pm-1',
      memberId: 'm-1',
      memberName: '田中',
      role: 'SWE',
      isUnconfirmed: false,
      skillNames: ['TypeScript'],
    });
    expect(rows[0].cells.get('2026-03-01')).toEqual({
      assignmentId: 'a-1',
      percentage: 100,
    });
    expect(rows[0].cells.get('2026-04-01')).toEqual({
      assignmentId: 'a-2',
      percentage: 60,
    });
  });

  it('未確定PJメンバーは専用行として扱う', () => {
    const rows = buildProjectMemberRows([
      makeProjectMember({
        id: 'pm-unconfirmed',
        member_id: null,
        name: '未定要員(PM)',
        role: 'PM',
        members: null,
        project_member_skills: [
          {
            skill_id: 's-2',
            skills: {
              id: 's-2',
              name: '進行管理',
            },
          },
        ],
      }),
    ]);

    expect(rows[0]).toMatchObject({
      projectMemberId: 'pm-unconfirmed',
      memberId: null,
      memberName: '未定要員(PM)',
      role: 'PM',
      isUnconfirmed: true,
      skillNames: ['進行管理'],
    });
  });

  it('legacy な未定枠 member を参照していても未確定行として扱う', () => {
    const rows = buildProjectMemberRows([
      makeProjectMember({
        id: 'pm-legacy',
        member_id: 'legacy-placeholder',
        name: 'AIE要員',
        role: 'AIE',
        members: {
          id: 'legacy-placeholder',
          name: 'AIE要員',
          category: '未定枠',
          role: 'AIE',
        },
      }),
    ]);

    expect(rows[0]).toMatchObject({
      projectMemberId: 'pm-legacy',
      memberId: null,
      memberName: 'AIE要員',
      role: 'AIE',
      isUnconfirmed: true,
    });
  });
});
