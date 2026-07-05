import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom polling hook — calls `fetchFn` immediately on mount,
 * then repeats every `intervalMs` milliseconds.
 *
 * An optional `refreshSignal` parameter can be passed: whenever its value
 * changes the hook immediately re-fetches, acting as a "nudge" from
 * Socket.IO events without replacing the polling loop.
 *
 * @param {() => Promise<any>} fetchFn       — async function that returns data
 * @param {number}             intervalMs    — polling interval in ms
 * @param {any}                refreshSignal — changing this value triggers an immediate fetch
 * @returns {{ data: any, loading: boolean, error: Error|null, refresh: () => void }}
 */
export default function usePolling(fetchFn, intervalMs, refreshSignal) {
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

  // Standard polling interval
  useEffect(() => {
    execute(); // call immediately
    const id = setInterval(execute, intervalMs);
    return () => clearInterval(id);
  }, [execute, intervalMs]);

  // Re-fetch when refreshSignal changes (socket nudge)
  useEffect(() => {
    if (refreshSignal !== undefined && refreshSignal !== 0) {
      execute();
    }
  }, [refreshSignal, execute]);

  return { data, loading, error, refresh: execute };
}
