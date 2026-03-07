import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusChip from './StatusChip';

describe('StatusChip', () => {
  it('ステータスラベルを表示する', () => {
    render(<StatusChip status="確定" />);
    expect(screen.getByText('確定')).toBeInTheDocument();
  });

  it.each(['確定', '提案済', '提案予定'])('ステータス "%s" を表示できる', (status) => {
    render(<StatusChip status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it('未知のステータスでもデフォルト表示する', () => {
    render(<StatusChip status="不明" />);
    expect(screen.getByText('不明')).toBeInTheDocument();
  });
});
