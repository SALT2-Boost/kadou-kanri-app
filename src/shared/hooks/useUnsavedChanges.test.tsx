import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_UNSAVED_CHANGES_MESSAGE,
  UnsavedChangesProvider,
  useRegisterUnsavedChanges,
  useUnsavedChanges,
  useUnsavedChangesDialogGuard,
} from './useUnsavedChanges';

function DirtyHarness({ dirty = true }: { dirty?: boolean }) {
  useRegisterUnsavedChanges(dirty);
  const { confirmIfNeeded, hasUnsavedChanges } = useUnsavedChanges();

  return (
    <>
      <button type="button" onClick={() => confirmIfNeeded()}>
        confirm
      </button>
      <div data-testid="dirty-flag">{String(hasUnsavedChanges)}</div>
    </>
  );
}

function DialogHarness({ dirty = true }: { dirty?: boolean }) {
  const [closeCount, setCloseCount] = useState(0);
  const onClose = () => setCloseCount((prev) => prev + 1);
  const { requestClose, dialogProps } = useUnsavedChangesDialogGuard(dirty, onClose);

  return (
    <>
      <button type="button" onClick={requestClose}>
        close
      </button>
      <button type="button" onClick={() => dialogProps.onClose({} as Event, 'backdropClick')}>
        backdrop
      </button>
      <div data-testid="close-count">{closeCount}</div>
    </>
  );
}

describe('useUnsavedChanges', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dirty なときだけ confirm を出す', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <MemoryRouter>
        <UnsavedChangesProvider>
          <DirtyHarness />
        </UnsavedChangesProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('dirty-flag')).toHaveTextContent('true');
    fireEvent.click(screen.getByText('confirm'));

    expect(confirmSpy).toHaveBeenCalledWith(DEFAULT_UNSAVED_CHANGES_MESSAGE);
  });

  it('beforeunload と popstate を guard する', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const goSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <UnsavedChangesProvider>
          <DirtyHarness />
        </UnsavedChangesProvider>
      </MemoryRouter>,
    );

    const beforeUnload = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
    Object.defineProperty(beforeUnload, 'returnValue', {
      writable: true,
      value: undefined,
    });

    window.dispatchEvent(beforeUnload);
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(beforeUnload.defaultPrevented).toBe(true);
    expect(confirmSpy).toHaveBeenCalledWith(DEFAULT_UNSAVED_CHANGES_MESSAGE);
    expect(goSpy).toHaveBeenCalledWith(1);
  });

  it('dialog guard は backdrop click で閉じない', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <UnsavedChangesProvider>
          <DialogHarness />
        </UnsavedChangesProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('backdrop'));
    expect(screen.getByTestId('close-count')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('close'));
    expect(confirmSpy).toHaveBeenCalledWith(DEFAULT_UNSAVED_CHANGES_MESSAGE);
    expect(screen.getByTestId('close-count')).toHaveTextContent('1');
  });
});
