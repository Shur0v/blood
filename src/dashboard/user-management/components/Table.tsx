import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl glass border border-[var(--border-main)] shadow-sm">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-[var(--border-main)] bg-[var(--bg-app)]/50">
            {headers.map((header, index) => (
              <th 
                key={index} 
                className="py-4 px-6 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-main)] bg-[var(--bg-app)]/30">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// Table cell utility component
export function TableCell({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <td className={`py-4 px-6 text-sm text-[var(--text-main)] ${className}`}>
      {children}
    </td>
  );
}

// Table row utility component
export function TableRow({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <tr className={`hover:bg-[var(--primary-glow)]/20 transition-colors duration-150 group ${className}`}>
      {children}
    </tr>
  );
}
