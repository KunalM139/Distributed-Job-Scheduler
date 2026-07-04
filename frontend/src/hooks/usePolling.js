import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom polling hook — calls `fetchFn` immediately on mount,
 * then repeats every `intervalMs` milliseconds.
 *
 * @param {() => Promise<any>} fetchFn   — async function that returns data
 * @param {number}             intervalMs — polling interval in ms
 * @returns {{ data: any, loading: boolean, error: Error|null }}
 */
export default function usePolling(fetchFn, intervalMs) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep fetchFn ref stable so interval doesn't re-create on every render
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  const execute = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    execute(); // call immediately
    const id = setInterval(execute, intervalMs);
    return () => clearInterval(id);
  }, [execute, intervalMs]);

  return { data, loading, error };
}
