/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { useLocation } from 'react-router-dom';

export const DEFAULT_UNSAVED_CHANGES_MESSAGE =
  '保存されていない変更があります。破棄して移動しますか？';

type GuardEntry = {
  when: boolean;
  message: string;
};

type UnsavedChangesContextValue = {
  hasUnsavedChanges: boolean;
  confirmIfNeeded: () => boolean;
  setGuard: (id: string, entry: GuardEntry | null) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

function getActiveGuard(guards: Map<string, GuardEntry>) {
  return Array.from(guards.values())
    .reverse()
    .find((guard) => guard.when);
}

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [guards, setGuards] = useState<Map<string, GuardEntry>>(new Map());
  const ignoreNextPopStateRef = useRef(false);
  const currentHistoryIndexRef = useRef<number>(window.history.state?.idx ?? 0);
  const location = useLocation();

  const setGuard = useCallback((id: string, entry: GuardEntry | null) => {
    setGuards((prev) => {
      const next = new Map(prev);
      next.delete(id);
      if (entry) {
        next.set(id, entry);
      }
      return next;
    });
  }, []);

  const activeGuard = useMemo(() => getActiveGuard(guards), [guards]);

  useEffect(() => {
    currentHistoryIndexRef.current = window.history.state?.idx ?? currentHistoryIndexRef.current;
  }, [location]);

  const confirmIfNeeded = useCallback(() => {
    if (!activeGuard) return true;
    return window.confirm(activeGuard.message);
  }, [activeGuard]);

  useEffect(() => {
    if (!activeGuard) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeGuard]);

  useEffect(() => {
    if (!activeGuard) return;

    const handlePopState = () => {
      const nextIndex = window.history.state?.idx ?? currentHistoryIndexRef.current;
      const delta = nextIndex - currentHistoryIndexRef.current;
      currentHistoryIndexRef.current = nextIndex;

      if (ignoreNextPopStateRef.current) {
        ignoreNextPopStateRef.current = false;
        return;
      }

      const shouldDiscard = window.confirm(activeGuard.message);
      if (!shouldDiscard) {
        ignoreNextPopStateRef.current = true;
        window.history.go(delta === 0 ? 1 : delta * -1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeGuard]);

  const value = useMemo(
    () => ({
      hasUnsavedChanges: Boolean(activeGuard),
      confirmIfNeeded,
      setGuard,
    }),
    [activeGuard, confirmIfNeeded, setGuard],
  );

  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>;
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider');
  }
  return context;
}

export function useRegisterUnsavedChanges(
  when: boolean,
  message: string = DEFAULT_UNSAVED_CHANGES_MESSAGE,
) {
  const id = useId();
  const { setGuard } = useUnsavedChanges();

  useEffect(() => {
    setGuard(id, { when, message });
    return () => setGuard(id, null);
  }, [id, message, setGuard, when]);
}

type DialogCloseReason = 'backdropClick' | 'escapeKeyDown';

export function useUnsavedChangesDialogGuard(
  when: boolean,
  onClose: () => void,
  message: string = DEFAULT_UNSAVED_CHANGES_MESSAGE,
) {
  const { confirmIfNeeded } = useUnsavedChanges();

  useRegisterUnsavedChanges(when, message);

  const requestClose = useCallback(() => {
    if (!when || confirmIfNeeded()) {
      onClose();
      return true;
    }
    return false;
  }, [confirmIfNeeded, onClose, when]);

  const handleDialogClose = useCallback(
    (_event: SyntheticEvent | object, reason: DialogCloseReason) => {
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        return;
      }
      void requestClose();
    },
    [requestClose],
  );

  return {
    requestClose,
    dialogProps: {
      onClose: handleDialogClose,
      disableEscapeKeyDown: true,
    },
  };
}
