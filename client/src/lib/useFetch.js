import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(() => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path).then((data) => setState({ data, loading: false, error: null })).catch((error) => setState({ data: null, loading: false, error }));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
