import React from 'react';

type BadgeType = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  type?: BadgeType;
  className?: string;
}

export function Badge({ children, type = 'default', className = '' }: BadgeProps) {
  let typeStyles = '';
  switch (type) {
    case 'success':
      typeStyles = 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      break;
    case 'warning':
      typeStyles = 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      break;
    case 'danger':
      typeStyles = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      break;
    case 'info':
      typeStyles = 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      break;
    default:
      typeStyles = 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }

  // API Integration Note: Status labels from API should be mapped to these visual types (e.g., 'active' -> 'success')
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeStyles} ${className}`}>
      {children}
    </span>
  );
}
