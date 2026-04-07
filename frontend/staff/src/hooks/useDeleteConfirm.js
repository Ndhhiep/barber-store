import { useState, useCallback } from 'react';

/**
 * useDeleteConfirm — manages the delete confirmation flow
 *
 * @param {Function} deleteFn  - async (id) => void — service call to delete
 * @param {Function} [onSuccess] - called after successful delete
 * @returns {{
 *   isOpen, itemToDelete, displayName, isDeleting,
 *   openDelete, closeDelete, confirmDelete
 * }}
 */
const useDeleteConfirm = (deleteFn, onSuccess) => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Open the confirmation modal for a given item
   * @param {string} id - The _id of the item to delete
   * @param {string} [name=''] - Human-readable identifier shown in modal
   */
  const openDelete = useCallback((id, name = '') => {
    setItemToDelete(id);
    setDisplayName(name);
    setIsOpen(true);
  }, []);

  const closeDelete = useCallback(() => {
    setIsOpen(false);
    setItemToDelete(null);
    setDisplayName('');
  }, []);

  /**
   * Execute the delete and call onSuccess on completion
   */
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFn(itemToDelete);
      setIsOpen(false);
      setItemToDelete(null);
      setDisplayName('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteFn, itemToDelete, onSuccess]);

  return {
    isOpen,
    itemToDelete,
    displayName,
    isDeleting,
    openDelete,
    closeDelete,
    confirmDelete,
  };
};

export default useDeleteConfirm;
