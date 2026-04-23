import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 20,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems && totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems && totalItems > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;
  const summaryTotal = totalItems ?? safeTotalPages * pageSize;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-app)]/50 border-t border-[var(--border-main)] rounded-b-2xl">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-[var(--border-main)] bg-[var(--bg-app)] px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--primary-glow)] hover:text-[var(--primary)] disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-[var(--border-main)] bg-[var(--bg-app)] px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-[var(--primary-glow)] hover:text-[var(--primary)] disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">
            Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{summaryTotal}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[var(--text-muted)] ring-1 ring-inset ring-[var(--border-main)] hover:bg-[var(--primary-glow)] hover:text-[var(--primary)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            
            {/* Simple pagination logic for UI purposes */}
            {[...Array(safeTotalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => onPageChange(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ring-1 ring-inset ring-[var(--border-main)] focus:z-20 focus:outline-offset-0 ${
                  currentPage === i + 1 
                    ? 'z-10 bg-[var(--primary)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]' 
                    : 'text-[var(--text-main)] hover:bg-[var(--primary-glow)] hover:text-[var(--primary)]'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
              disabled={currentPage === safeTotalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[var(--text-muted)] ring-1 ring-inset ring-[var(--border-main)] hover:bg-[var(--primary-glow)] hover:text-[var(--primary)] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
