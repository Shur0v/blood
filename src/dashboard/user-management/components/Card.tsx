import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`glass rounded-2xl p-6 border border-[var(--glass-border)] shadow-[var(--shadow-card)] transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-[var(--shadow-hover)] hover:-translate-y-1' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
