import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ScheduleTable from './ScheduleTable';
import type { ScheduleRow } from '../types';

const months = ['2026-03-01'];

const rows: ScheduleRow[] = [
  {
    rowId: 'm-1',
    memberId: 'm-1',
    memberName: '田中',
    category: '社員',
    isUnconfirmed: false,
    skills: ['TypeScript'],
    months: {
      '2026-03-01': {
        totalPercentage: 80,
        assignments: [
          {
            projectId: 'p-1',
            projectName: '案件A',
            percentage: 80,
          },
        ],
      },
    },
  },
];

describe('ScheduleTable', () => {
  it('member 集約ビューでは role 列を表示しない', () => {
    render(
      <MemoryRouter>
        <ScheduleTable rows={rows} months={months} />
      </MemoryRouter>,
    );

    expect(screen.getByText('メンバー名')).toBeInTheDocument();
    expect(screen.getByText('スキル')).toBeInTheDocument();
    expect(screen.queryByText('role')).not.toBeInTheDocument();
  });

  it('左側の member 情報列と区分見出しを sticky で固定する', () => {
    render(
      <MemoryRouter>
        <ScheduleTable rows={rows} months={months} />
      </MemoryRouter>,
    );

    const nameHeader = screen.getByText('メンバー名').closest('th');
    const skillsHeader = screen.getByText('スキル').closest('th');
    const categoryHeader = screen.getByText('社員').closest('td');

    expect(nameHeader).toHaveStyle({ position: 'sticky', left: '0px' });
    expect(skillsHeader).toHaveStyle({ position: 'sticky', left: '220px' });
    expect(categoryHeader).toHaveStyle({ position: 'sticky', left: '0px' });
  });

  it('メンバー名と案件名から詳細画面へ遷移できるリンクを表示する', () => {
    render(
      <MemoryRouter>
        <ScheduleTable rows={rows} months={months} />
      </MemoryRouter>,
    );

    const memberLink = screen.getByText('田中').closest('a');
    expect(memberLink).toHaveAttribute('href', '/members/m-1');

    fireEvent.click(screen.getByText('80%'));

    const projectLink = screen.getByText('案件A').closest('a');
    expect(projectLink).toHaveAttribute('href', '/projects/p-1');
  });
});
