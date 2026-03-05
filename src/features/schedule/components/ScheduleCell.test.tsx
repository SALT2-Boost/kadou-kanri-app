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
    renderInTable(<ScheduleCellComponent cell={undefined} onClick={vi.fn()} />);
    const cell = screen.getByRole('cell');
    expect(cell.textContent).toBe('');
  });

  it('totalPercentage が 0 の場合は空表示', () => {
    renderInTable(
      <ScheduleCellComponent
        cell={{ totalPercentage: 0, assignments: [] }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('cell').textContent).toBe('');
  });

  it('稼働%を表示する', () => {
    renderInTable(
      <ScheduleCellComponent
        cell={{ totalPercentage: 80, assignments: [] }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('cell').textContent).toBe('80%');
  });

  it('100%超を表示する', () => {
    renderInTable(
      <ScheduleCellComponent
        cell={{ totalPercentage: 120, assignments: [] }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByRole('cell').textContent).toBe('120%');
  });
});
