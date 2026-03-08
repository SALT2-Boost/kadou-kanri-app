import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  UnsavedChangesProvider,
  useRegisterUnsavedChanges,
} from '@/shared/hooks/useUnsavedChanges';
import GuardedLink from './GuardedLink';

function Harness({ dirty = true }: { dirty?: boolean }) {
  useRegisterUnsavedChanges(dirty);

  return <GuardedLink to="/projects/1">案件詳細</GuardedLink>;
}

describe('GuardedLink', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dirty なときは confirm を通さないと遷移しない', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <MemoryRouter>
        <UnsavedChangesProvider>
          <Harness />
        </UnsavedChangesProvider>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: '案件詳細' });
    fireEvent.click(link);

    expect(confirmSpy).toHaveBeenCalled();
  });
});
