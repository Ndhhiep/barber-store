import { useState, useCallback } from 'react';

/**
 * usePagination — manages client-side pagination state
 *
 * @param {number} [itemsPerPage=10] - Number of items per page
 * @returns {{ currentPage, totalPages, setTotalPages, handlePageChange, resetPage, getPageSlice }}
 */
const usePagination = (itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Slice an array to only return items for the current page
   * @param {Array} items
   * @returns {Array}
   */
  const getPageSlice = useCallback(
    (items) => {
      if (!Array.isArray(items)) return [];
      const start = (currentPage - 1) * itemsPerPage;
      return items.slice(start, start + itemsPerPage);
    },
    [currentPage, itemsPerPage]
  );

  /**
   * Compute total pages from an array length and optionally update state
   * @param {number} totalItems
   */
  const updateTotalPages = useCallback(
    (totalItems) => {
      const pages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      setTotalPages(pages);
    },
    [itemsPerPage]
  );

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    setTotalPages,
    handlePageChange,
    resetPage,
    getPageSlice,
    updateTotalPages,
  };
};

export default usePagination;
