import React from 'react';
import { ChevronDown, Filter } from 'lucide-react';

interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  icon?: boolean;
}

export function FilterDropdown({ label, options, value, onChange, icon = true }: FilterDropdownProps) {
  return (
    <div className="relative group">
      <div className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--text-main)] cursor-pointer hover:border-[var(--primary)] transition-colors">
        {icon && <Filter size={16} className="text-[var(--text-muted)]" />}
        <span>{value || label}</span>
        <ChevronDown size={16} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
      </div>

      <div className="absolute top-full mt-2 w-48 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 overflow-hidden glass">
        <div className="py-1">
          <div 
            className={`px-4 py-2 text-sm cursor-pointer hover:bg-[var(--primary-glow)] hover:text-[var(--primary)] transition-colors ${!value ? 'bg-[var(--primary-glow)]/50 text-[var(--primary)]' : 'text-[var(--text-main)]'}`}
            onClick={() => onChange('')}
          >
            All {label}
          </div>
          {options.map((option) => (
            <div 
              key={option}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-[var(--primary-glow)] hover:text-[var(--primary)] transition-colors ${value === option ? 'bg-[var(--primary-glow)]/50 text-[var(--primary)]' : 'text-[var(--text-main)]'}`}
              onClick={() => onChange(option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
