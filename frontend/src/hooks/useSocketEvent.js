import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Subscribe to a Socket.IO event. The callback is called with the event
 * payload whenever the server emits the named event.
 *
 * Automatically cleans up on unmount. Safe to call when socket is null
 * (no-op until the connection is established).
 *
 * @param {string}   eventName — Socket.IO event name (e.g. 'stats:refresh')
 * @param {Function} callback  — handler called with the event payload
 */
export default function useSocketEvent(eventName, callback) {
  const socket = useSocket();
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => cbRef.current(data);
    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName]);
}
