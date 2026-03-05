import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isAllowedEmail, signOut } from '../lib/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // 既存セッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email ?? '';
        if (!isAllowedEmail(email)) {
          void signOut();
          setState({ user: null, session: null, loading: false });
          return;
        }
      }
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    // Auth 状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const email = session.user.email ?? '';
          if (!isAllowedEmail(email)) {
            void signOut();
            setState({ user: null, session: null, loading: false });
            return;
          }
        }
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
