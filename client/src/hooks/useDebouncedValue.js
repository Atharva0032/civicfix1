import { useEffect, useState } from 'react';

/** Debounces a rapidly changing value (search boxes, filter inputs). */
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
