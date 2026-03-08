import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AssignmentTable from './AssignmentTable';

vi.mock('../hooks', () => ({
  useAssignmentsByProject: vi.fn(() => ({
    data: [
      {
        id: 'pm-1',
        project_id: 'p-1',
        member_id: 'm-1',
        name: '田中',
        role: 'PM',
        note: null,
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
        members: {
          id: 'm-1',
          name: '田中',
          category: '社員',
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
            member_id: 'm-1',
            project_id: 'p-1',
            month: '2026-03-01',
            percentage: 80,
            note: null,
            created_at: '2026-03-01T00:00:00Z',
            updated_at: '2026-03-01T00:00:00Z',
          },
        ],
      },
    ],
    isLoading: false,
  })),
  useDeleteProjectMember: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpsertAssignment: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

describe('AssignmentTable', () => {
  it('左側のメンバー情報列を固定し、確定メンバー名をリンク化する', () => {
    render(
      <MemoryRouter>
        <AssignmentTable projectId="p-1" startMonth="2026-03-01" endMonth="2026-04-01" />
      </MemoryRouter>,
    );

    const memberHeader = screen.getByText('メンバー').closest('th');
    const roleHeader = screen.getByText('role').closest('th');
    const skillsHeader = screen.getByText('skills').closest('th');

    expect(memberHeader).toHaveStyle({ position: 'sticky', left: '0px' });
    expect(roleHeader).toHaveStyle({ position: 'sticky' });
    expect(skillsHeader).toHaveStyle({ position: 'sticky' });
    expect(screen.getByText('田中').closest('a')).toHaveAttribute('href', '/members/m-1');
  });
});
