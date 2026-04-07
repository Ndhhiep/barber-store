import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useSuccessMessage — manages a success (or error) message that auto-hides
 *
 * @param {number} [duration=3000] - Auto-hide delay in milliseconds
 * @returns {{ message, type, showSuccess, showError, clearMessage }}
 */
const useSuccessMessage = (duration = 3000) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success'); // 'success' | 'error'
  const timerRef = useRef(null);

  const show = useCallback(
    (text, msgType = 'success') => {
      setMessage(text);
      setType(msgType);

      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Auto-hide after duration
      timerRef.current = setTimeout(() => {
        setMessage('');
      }, duration);
    },
    [duration]
  );

  const showSuccess = useCallback((text) => show(text, 'success'), [show]);
  const showError = useCallback((text) => show(text, 'error'), [show]);

  const clearMessage = useCallback(() => {
    setMessage('');
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { message, type, showSuccess, showError, clearMessage };
};

export default useSuccessMessage;
