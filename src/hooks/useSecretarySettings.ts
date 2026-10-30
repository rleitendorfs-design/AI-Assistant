import { useCallback, useEffect, useState } from 'react';
import { fetchSecretarySettings, updateSecretarySettings, type SecretarySettingsPatch } from '@/lib/secretaryApi';
import type { SecretarySettings } from '@/types/secretary';

type LoadState = 'loading' | 'ready' | 'error';

export function useSecretarySettings() {
  const [settings, setSettings] = useState<SecretarySettings | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadState('loading');
    setLoadError(null);

    fetchSecretarySettings()
      .then((row) => {
        if (!active) return;
        if (!row) {
          setLoadError('Your secretary settings could not be found. Please refresh.');
          setLoadState('error');
          return;
        }
        setSettings(row);
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
  }, [version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  const save = useCallback(async (patch: SecretarySettingsPatch) => {
    const updated = await updateSecretarySettings(patch);
    setSettings(updated);
    return updated;
  }, []);

  return { settings, loadState, loadError, reload, save };
}
