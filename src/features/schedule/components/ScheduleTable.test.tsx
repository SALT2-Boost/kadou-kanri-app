import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
    render(<ScheduleTable rows={rows} months={months} />);

    expect(screen.getByText('メンバー名')).toBeInTheDocument();
    expect(screen.getByText('スキル')).toBeInTheDocument();
    expect(screen.queryByText('role')).not.toBeInTheDocument();
  });

  it('左側の member 情報列を sticky で固定する', () => {
    render(<ScheduleTable rows={rows} months={months} />);

    const nameHeader = screen.getByText('メンバー名').closest('th');
    const skillsHeader = screen.getByText('スキル').closest('th');

    expect(nameHeader).toHaveStyle({ position: 'sticky', left: '0px' });
    expect(skillsHeader).toHaveStyle({ position: 'sticky', left: '220px' });
  });
});
