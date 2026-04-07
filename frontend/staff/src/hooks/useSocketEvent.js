import { useEffect, useCallback, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';

/**
 * useSocketEvent — registers a Socket.IO event handler for the life of
 * the component (or until deps change), and automatically unregisters it.
 *
 * @param {string} eventName - Name of the Socket.IO event to listen for
 * @param {Function} handler - Callback to invoke when the event fires
 * @param {Array} [deps=[]] - Additional dependencies that should trigger re-registration
 */
const useSocketEvent = (eventName, handler, deps = []) => {
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();

  // Keep handler in a ref so the effect below doesn't need to re-run when
  // the consumer passes an inline function that is recreated every render
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Stable wrapper that always calls the latest handler
  const stableHandler = useCallback((data) => {
    handlerRef.current(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isConnected || !eventName) return;

    registerHandler(eventName, stableHandler);

    return () => {
      unregisterHandler(eventName, stableHandler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, eventName, stableHandler, registerHandler, unregisterHandler, ...deps]);
};

export default useSocketEvent;
