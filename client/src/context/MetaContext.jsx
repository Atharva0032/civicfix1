import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_DEPARTMENTS,
  FALLBACK_PRIORITIES,
  FALLBACK_STATUSES,
} from '../lib/constants';

const MetaContext = createContext(null);

/**
 * Loads `GET /api/meta` once so categories, statuses, priorities and
 * departments are never duplicated as hardcoded lists in the UI. The fallbacks
 * mirror the backend enums and are only used if the API is unreachable.
 */
export function MetaProvider({ children }) {
  const [meta, setMeta] = useState({
    categories: FALLBACK_CATEGORIES,
    statuses: FALLBACK_STATUSES,
    priorities: FALLBACK_PRIORITIES,
    departments: FALLBACK_DEPARTMENTS,
    statusFlow: ['submitted', 'acknowledged', 'in_progress', 'resolved'],
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    api
      .get('/meta')
      .then(({ data }) => {
        if (cancelled) return;
        setMeta({ ...data.data, loaded: true });
      })
      .catch(() => {
        if (!cancelled) setMeta((current) => ({ ...current, loaded: true }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    const categoryMap = Object.fromEntries(
      meta.categories.map((entry) => [entry.value, entry]),
    );
    const statusMap = Object.fromEntries(meta.statuses.map((entry) => [entry.value, entry]));
    const priorityMap = Object.fromEntries(
      meta.priorities.map((entry) => [entry.value, entry]),
    );

    return {
      ...meta,
      categoryMap,
      statusMap,
      priorityMap,
      categoryLabel: (value) => categoryMap[value]?.label ?? value,
      statusLabel: (value) => statusMap[value]?.label ?? value,
      priorityLabel: (value) => priorityMap[value]?.label ?? value,
    };
  }, [meta]);

  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>;
}

export function useMeta() {
  const context = useContext(MetaContext);
  if (!context) throw new Error('useMeta must be used inside <MetaProvider>.');
  return context;
}

export default MetaContext;
