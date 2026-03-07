import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
  role: 'SWE',
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
  role: 'SWE',
  isUnconfirmed: true,
  skills: ['SWE'],
  projects: { 'p-1': 60 },
  totalPercentage: 60,
};

describe('MonthlyScheduleTable', () => {
  it('データがない場合は空状態を表示する', () => {
    render(<MonthlyScheduleTable rows={[]} projects={[]} />);

    expect(screen.getByText('対象月の稼働データがありません')).toBeInTheDocument();
  });

  it('未確定行をわかりやすく表示する', () => {
    render(<MonthlyScheduleTable rows={[confirmedRow, unconfirmedRow]} projects={projects} />);

    expect(screen.getByText('未確定')).toBeInTheDocument();
    expect(screen.getByText('未定要員(SWE)')).toBeInTheDocument();
    expect(screen.getAllByText('60%')[0]).toBeInTheDocument();
  });

  it('案件列ヘッダーと合計列を表示する', () => {
    render(<MonthlyScheduleTable rows={[confirmedRow]} projects={projects} />);

    expect(screen.getByText('合計')).toBeInTheDocument();
    expect(screen.getByText('非常に長い案件名でも見切れずに表示したい案件A')).toBeInTheDocument();
    expect(screen.getAllByText('80%')[0]).toBeInTheDocument();
  });
});
