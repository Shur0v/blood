import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export function Card({ children, className = '', onClick, title }: CardProps) {
  // API Integration Note: Cards can be populated from any data fetching hook (useQuery, etc.)
  return (
    <div 
      className={`bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
