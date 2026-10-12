import React, { useState, useEffect } from 'react';

/**
 * WordPress-style pagination component — shows "X items  « ‹ [input] of Y › »"
 * Renders both above and below the table when used in a list page.
 */
const Pagination = ({ currentPage = 1, totalPages = 1, total = 0, onPageChange }) => {
  const [inputValue, setInputValue] = useState(String(currentPage));

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  if (totalPages <= 1 && total <= 0) return null;

  const goTo = (p) => {
    const page = Math.max(1, Math.min(totalPages, p));
    if (page !== currentPage) onPageChange(page);
  };

  const handleInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(inputValue, 10);
      if (!isNaN(val)) goTo(val);
    }
  };

  const handleInputBlur = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val !== currentPage) {
      goTo(val);
    } else {
      setInputValue(String(currentPage));
    }
  };

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const navBtn = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontWeight: 500,
    lineHeight: 1,
    padding: 0,
  };

  const navBtnDisabled = {
    ...navBtn,
    opacity: 0.35,
    cursor: 'default',
    pointerEvents: 'none',
  };

  const navBtnActive = {
    ...navBtn,
    borderColor: 'var(--primary-color, #2271b1)',
    color: 'var(--primary-color, #2271b1)',
  };

  return (
    <div
      className="wp-pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0',
        gap: '6px',
        flexWrap: 'wrap',
      }}
    >
      {/* Total items count */}
      <span style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginRight: '6px',
        whiteSpace: 'nowrap',
      }}>
        {total} items
      </span>

      {/* First page «  */}
      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={isFirst}
        style={isFirst ? navBtnDisabled : navBtnActive}
        title="First page"
      >
        «
      </button>

      {/* Previous page ‹ */}
      <button
        type="button"
        onClick={() => goTo(currentPage - 1)}
        disabled={isFirst}
        style={isFirst ? navBtnDisabled : navBtnActive}
        title="Previous page"
      >
        ‹
      </button>

      {/* Page input */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputSubmit}
        onBlur={handleInputBlur}
        style={{
          width: '42px',
          height: '30px',
          textAlign: 'center',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: 600,
          outline: 'none',
          padding: '0 4px',
        }}
        title="Current page"
      />

      {/* of X */}
      <span style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
      }}>
        of {totalPages}
      </span>

      {/* Next page › */}
      <button
        type="button"
        onClick={() => goTo(currentPage + 1)}
        disabled={isLast}
        style={isLast ? navBtnDisabled : navBtnActive}
        title="Next page"
      >
        ›
      </button>

      {/* Last page » */}
      <button
        type="button"
        onClick={() => goTo(totalPages)}
        disabled={isLast}
        style={isLast ? navBtnDisabled : navBtnActive}
        title="Last page"
      >
        »
      </button>
    </div>
  );
};

export default Pagination;
