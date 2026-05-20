'use client';

import { useEffect, useState } from 'react';

export interface Me {
  authenticated: boolean;
  user: { id: string; email: string; name: string | null } | null;
  isFounder: boolean;
}

export interface UseMeState extends Me {
  loading: boolean;
}

const ANON: Me = { authenticated: false, user: null, isFounder: false };

export function useMe(): UseMeState {
  const [state, setState] = useState<UseMeState>({ ...ANON, loading: true });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : ANON))
      .then((data: Me) => {
        if (!cancelled) setState({ ...data, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ ...ANON, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
