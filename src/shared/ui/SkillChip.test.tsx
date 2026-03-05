import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillChip from './SkillChip';

describe('SkillChip', () => {
  it('スキル名を表示する', () => {
    render(<SkillChip name="SWE" />);
    expect(screen.getByText('SWE')).toBeInTheDocument();
  });

  it('クリックハンドラが呼ばれる', () => {
    const handleClick = vi.fn();
    render(<SkillChip name="SWE" onClick={handleClick} />);
    fireEvent.click(screen.getByText('SWE'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('onClick がない場合はクリックしてもエラーにならない', () => {
    render(<SkillChip name="SWE" />);
    expect(() => fireEvent.click(screen.getByText('SWE'))).not.toThrow();
  });
});
