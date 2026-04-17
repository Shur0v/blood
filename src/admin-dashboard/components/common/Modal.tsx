import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', footer }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div 
        className={`bg-white dark:bg-[#1a1b23] text-gray-900 dark:text-gray-100 w-full ${maxWidth} rounded-2xl shadow-xl relative z-10 flex flex-col max-h-[90vh] border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10">
          <h2 className="text-lg font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 flex justify-end gap-3">
             {footer}
          </div>
        )}
      </div>
    </div>
  );
}
