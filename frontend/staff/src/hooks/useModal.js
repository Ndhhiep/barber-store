import { useState, useCallback, useEffect } from 'react';

/**
 * useModal — manages single modal open/close state
 * Automatically toggles document.body overflow when modal is open
 *
 * @param {boolean} [initialOpen=false]
 * @returns {{ isOpen, open, close, toggle }}
 */
const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
};

export default useModal;
