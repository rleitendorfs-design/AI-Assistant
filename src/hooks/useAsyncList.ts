import { useCallback, useEffect, useState } from 'react';

type LoadState = 'loading' | 'ready' | 'error';

export function useAsyncList<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadState('loading');
    setLoadError(null);

    load()
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        setLoadState('ready');
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Something went wrong.');
        setLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return { items, loadState, loadError, reload };
}
