import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api';

/**
 * Small data-fetching helper used by every page: handles loading, error and
 * cancellation so components stay declarative.
 *
 *   const { data, isLoading, error, refetch } = useApi('/issues?limit=6');
 */
export function useApi(url, { params, enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const paramsKey = params ? JSON.stringify(params) : '';

  const run = useCallback(
    async ({ signal } = {}) => {
      if (!enabled || !url) {
        setIsLoading(false);
        return;
      }

      const id = requestId.current + 1;
      requestId.current = id;
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(url, {
          params: paramsKey ? JSON.parse(paramsKey) : undefined,
          signal,
        });
        if (requestId.current !== id) return;
        setData(response.data.data);
        setMeta(response.data.meta ?? null);
      } catch (caught) {
        if (caught?.code === 'ERR_CANCELED' || requestId.current !== id) return;
        setError(caught);
      } finally {
        if (requestId.current === id) setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, paramsKey, enabled, ...deps],
  );

  useEffect(() => {
    const controller = new AbortController();
    run({ signal: controller.signal });
    return () => controller.abort();
  }, [run]);

  return { data, meta, isLoading, error, refetch: run, setData };
}

export default useApi;
