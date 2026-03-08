import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProjectList from './ProjectList';

vi.mock('../hooks', () => ({
  useProjects: vi.fn(() => ({
    data: [
      {
        id: 'p-1',
        name: '案件A',
        category: 'その他',
        monthly_revenue: 100,
        start_month: '2026-04-01',
        end_month: null,
        status: '確定',
        staffing_targets: [],
        description: null,
        note: null,
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
      },
      {
        id: 'p-2',
        name: '案件B',
        category: 'その他',
        monthly_revenue: 200,
        start_month: '2026-02-01',
        end_month: null,
        status: '提案済',
        staffing_targets: [],
        description: null,
        note: null,
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
      },
    ],
    isLoading: false,
  })),
}));

describe('ProjectList', () => {
  it('開始時期順に並び替えできる', () => {
    render(
      <MemoryRouter>
        <ProjectList />
      </MemoryRouter>,
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: '並び順' }));
    fireEvent.click(screen.getByRole('option', { name: '開始時期が早い順' }));

    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('案件B')).toBeInTheDocument();
    expect(within(rows[1]).getByText('案件A')).toBeInTheDocument();
  });
});
