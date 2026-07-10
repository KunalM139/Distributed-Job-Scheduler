import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Custom polling hook — calls `fetchFn` immediately on mount,
 * then repeats every `intervalMs` milliseconds.
 *
 * @param {() => Promise<any>} fetchFn   — async function that returns data
 * @param {number}             intervalMs — polling interval in ms
 * @param {string[]}           socketEvents — optional array of socket.io events to trigger instant refresh
 * @returns {{ data: any, loading: boolean, error: Error|null }}
 */
export default function usePolling(fetchFn, intervalMs, socketEvents = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safely grab socket context
  const { socket } = useSocket();

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

  // ─── Socket.IO Real-Time Triggers ───────────────────────────────────────
  // Re-run execute() instantly whenever a relevant socket event is fired
  useEffect(() => {
    if (!socket || socketEvents.length === 0) return;

    // We can debounce or throttle here if necessary, but for now we just fire execute
    const handleEvent = () => execute();

    socketEvents.forEach((evt) => socket.on(evt, handleEvent));

    return () => {
      socketEvents.forEach((evt) => socket.off(evt, handleEvent));
    };
  }, [socket, socketEvents, execute]);

  return { data, loading, error };
}
