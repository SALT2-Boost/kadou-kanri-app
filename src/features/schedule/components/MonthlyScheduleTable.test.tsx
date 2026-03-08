import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MonthlyScheduleTable from './MonthlyScheduleTable';
import type { MonthlyViewProject, MonthlyViewRow } from '../types';

const projects: MonthlyViewProject[] = [
  { id: 'p-1', name: '非常に長い案件名でも見切れずに表示したい案件A' },
];

const confirmedRow: MonthlyViewRow = {
  rowId: 'm-1',
  memberId: 'm-1',
  memberName: '田中',
  category: '社員',
  isUnconfirmed: false,
  skills: ['TypeScript'],
  projects: { 'p-1': 80 },
  totalPercentage: 80,
};

const unconfirmedRow: MonthlyViewRow = {
  rowId: 'pm-1',
  memberId: null,
  memberName: '未定要員(SWE)',
  category: '未定枠',
  isUnconfirmed: true,
  skills: ['SWE'],
  projects: { 'p-1': 60 },
  totalPercentage: 60,
};

describe('MonthlyScheduleTable', () => {
  it('データがない場合は空状態を表示する', () => {
    render(
      <MemoryRouter>
        <MonthlyScheduleTable rows={[]} projects={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('対象月の稼働データがありません')).toBeInTheDocument();
  });

  it('未確定行をわかりやすく表示する', () => {
    render(
      <MemoryRouter>
        <MonthlyScheduleTable rows={[confirmedRow, unconfirmedRow]} projects={projects} />
      </MemoryRouter>,
    );

    expect(screen.getByText('未確定')).toBeInTheDocument();
    expect(screen.getByText('未定要員(SWE)')).toBeInTheDocument();
    expect(screen.getAllByText('60%')[0]).toBeInTheDocument();
  });

  it('案件列ヘッダーと合計列を表示する', () => {
    render(
      <MemoryRouter>
        <MonthlyScheduleTable rows={[confirmedRow]} projects={projects} />
      </MemoryRouter>,
    );

    expect(screen.getByText('合計')).toBeInTheDocument();
    expect(screen.getByText('非常に長い案件名でも見切れずに表示したい案件A')).toBeInTheDocument();
    expect(screen.getAllByText('80%')[0]).toBeInTheDocument();
  });

  it('member 集約ビューでは role 列を表示せず、左側の人情報列を sticky で固定する', () => {
    render(
      <MemoryRouter>
        <MonthlyScheduleTable rows={[confirmedRow]} projects={projects} />
      </MemoryRouter>,
    );

    const nameHeader = screen.getByText('メンバー名').closest('th');
    const skillsHeader = screen.getByText('スキル').closest('th');
    const projectHeader = screen
      .getByText('非常に長い案件名でも見切れずに表示したい案件A')
      .closest('th');
    const groupHeader = screen.getByText('社員').closest('td');

    expect(nameHeader).toHaveStyle({ position: 'sticky', left: '0px' });
    expect(skillsHeader).toHaveStyle({ position: 'sticky', left: '220px' });
    expect(nameHeader).toHaveStyle({ zIndex: '4' });
    expect(projectHeader).toHaveStyle({ zIndex: '1' });
    expect(groupHeader).toHaveStyle({ position: 'sticky', left: '0px' });
    expect(screen.queryByText('role')).not.toBeInTheDocument();
  });

  it('メンバー名と案件名から詳細画面へ遷移できるリンクを表示する', () => {
    render(
      <MemoryRouter>
        <MonthlyScheduleTable rows={[confirmedRow]} projects={projects} />
      </MemoryRouter>,
    );

    expect(screen.getByText('田中').closest('a')).toHaveAttribute('href', '/members/m-1');
    expect(
      screen.getByText('非常に長い案件名でも見切れずに表示したい案件A').closest('a'),
    ).toHaveAttribute('href', '/projects/p-1');
  });
});
