import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MemberUpcomingScheduleTable from './MemberUpcomingScheduleTable';

describe('MemberUpcomingScheduleTable', () => {
  it('案件を縦、月を横で表示し、案件名をリンク化する', () => {
    render(
      <MemoryRouter>
        <MemberUpcomingScheduleTable
          months={['2026-03-01', '2026-04-01']}
          rows={[
            {
              projectId: 'p-1',
              projectName: '案件A',
              months: {
                '2026-03-01': 60,
                '2026-04-01': 40,
              },
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('案件')).toBeInTheDocument();
    expect(screen.getByText('2026/03')).toBeInTheDocument();
    expect(screen.getByText('案件A').closest('a')).toHaveAttribute('href', '/projects/p-1');
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});
