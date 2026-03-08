import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MemberList from './MemberList';

vi.mock('../hooks', () => ({
  useMembers: vi.fn(() => ({
    data: [
      {
        id: 'm-1',
        name: 'マーク若竹',
        category: '入社予定',
        company: 'ブーストコンサルティング',
        join_date: '2026-04-01',
        note: 'EY',
        member_skills: [{ skill_id: 's-1', skills: { id: 's-1', name: '総合コンサル' } }],
      },
      {
        id: 'm-2',
        name: 'Salt2インターン(A)',
        category: 'インターン',
        company: 'SALT2',
        join_date: null,
        note: null,
        member_skills: [{ skill_id: 's-2', skills: { id: 's-2', name: 'DS' } }],
      },
    ],
    isLoading: false,
  })),
  useSkills: vi.fn(() => ({
    data: [
      { id: 's-1', name: '総合コンサル' },
      { id: 's-2', name: 'DS' },
    ],
  })),
}));

describe('MemberList', () => {
  it('所属会社列と会社フィルタを表示し、入社予定のみ入社時期を表示する', () => {
    render(
      <MemoryRouter>
        <MemberList />
      </MemoryRouter>,
    );

    expect(screen.getByRole('columnheader', { name: '所属会社' })).toBeInTheDocument();
    expect(screen.getByLabelText('SALT2')).toBeInTheDocument();
    expect(screen.getByLabelText('ブーストコンサルティング')).toBeInTheDocument();
    expect(screen.getByText('入社: 2026/04')).toBeInTheDocument();
    expect(screen.queryByText('入社: 2026/04', { selector: 'span' })).toBeInTheDocument();
  });

  it('所属会社フィルタでメンバーを絞り込める', () => {
    render(
      <MemoryRouter>
        <MemberList />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('ブーストコンサルティング'));

    expect(screen.queryByText('マーク若竹')).not.toBeInTheDocument();
    expect(screen.getByText('Salt2インターン(A)')).toBeInTheDocument();
  });

  it('区分セルを折り返さず、名前列は過剰に広げすぎない', () => {
    render(
      <MemoryRouter>
        <MemberList />
      </MemoryRouter>,
    );

    const nameHeader = screen.getByText('名前').closest('th');
    const categoryCell =
      screen.getByText('Salt2インターン(A)').closest('tr')?.querySelectorAll('td')[1] ?? null;

    expect(nameHeader).toHaveStyle({ maxWidth: '260px' });
    expect(categoryCell).toHaveStyle({ whiteSpace: 'nowrap' });
  });
});
