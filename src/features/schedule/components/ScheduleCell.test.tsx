import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScheduleCellComponent from './ScheduleCell';

// TableCell は table 構造内でないと警告が出るので wrap
function renderInTable(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>,
  );
}

describe('ScheduleCell', () => {
  it('cell が undefined の場合は空表示', () => {
    renderInTable(<ScheduleCellComponent cell={undefined} month="2026-03-01" onClick={vi.fn()} />);
    const cell = screen.getByRole('cell');
    expect(cell.textContent).toBe('');
  });

  it('totalPercentage が 0 の場合は空表示', () => {
    renderInTable(
      <ScheduleCellComponent
        cell={{ confirmedPercentage: 0, totalPercentage: 0, assignments: [] }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('cell').textContent).toBe('');
  });

  it('稼働%を表示する', () => {
    renderInTable(
      <ScheduleCellComponent
        cell={{ confirmedPercentage: 80, totalPercentage: 80, assignments: [] }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('cell').textContent).toBe('80%');
  });

  it('100%超を表示する', () => {
    renderInTable(
      <ScheduleCellComponent
        cell={{ confirmedPercentage: 120, totalPercentage: 120, assignments: [] }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('cell').textContent).toBe('120%');
  });

  it('提案中案件を含む場合は confirmed と total を分けて表示する', () => {
    renderInTable(
      <ScheduleCellComponent
        cell={{ confirmedPercentage: 50, totalPercentage: 80, assignments: [] }}
        month="2026-03-01"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole('cell').textContent).toBe('50%(80%)');
  });
});
