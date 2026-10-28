import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick, ...props }: CardProps) {
  return (
    <div {...props}
      className={`glass rounded-2xl p-6 border border-[var(--glass-border)] shadow-[var(--shadow-card)] transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-[var(--shadow-hover)] hover:-translate-y-1' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
