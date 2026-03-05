import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssignmentCell from './AssignmentCell';

describe('AssignmentCell', () => {
  it('値がある場合は %付きで表示する', () => {
    render(<AssignmentCell value={80} onChange={vi.fn()} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('値が null の場合は空表示', () => {
    const { container } = render(<AssignmentCell value={null} onChange={vi.fn()} />);
    const text = container.querySelector('p');
    expect(text?.textContent).toBe('');
  });

  it('クリックで編集モードに入る', () => {
    render(<AssignmentCell value={80} onChange={vi.fn()} />);
    fireEvent.click(screen.getByText('80%'));
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('Enter で値がコミットされる', () => {
    const onChange = vi.fn();
    render(<AssignmentCell value={80} onChange={onChange} />);

    fireEvent.click(screen.getByText('80%'));
    const input = screen.getByRole('spinbutton');

    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('空文字でコミットすると null を渡す', () => {
    const onChange = vi.fn();
    render(<AssignmentCell value={80} onChange={onChange} />);

    fireEvent.click(screen.getByText('80%'));
    const input = screen.getByRole('spinbutton');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('200 を超える値はコミットされない', () => {
    const onChange = vi.fn();
    render(<AssignmentCell value={80} onChange={onChange} />);

    fireEvent.click(screen.getByText('80%'));
    const input = screen.getByRole('spinbutton');

    fireEvent.change(input, { target: { value: '201' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('Escape で編集をキャンセルする', () => {
    const onChange = vi.fn();
    render(<AssignmentCell value={80} onChange={onChange} />);

    fireEvent.click(screen.getByText('80%'));
    const input = screen.getByRole('spinbutton');

    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});
