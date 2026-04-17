import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export function Table({ headers, children }: TableProps) {
  // API Integration Note: Should accept generic data arrays and render rows dynamically based on column configurations
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1b23]">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-200 dark:border-gray-800">
            {headers.map((header, index) => (
              <th 
                key={index} 
                className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableCell({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <td className={`py-4 px-6 text-sm text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  );
}

export function TableRow({ children, className = '', onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  return (
    <tr 
      onClick={onClick}
      className={`transition-colors duration-150 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'} ${className}`}
    >
      {children}
    </tr>
  );
}
