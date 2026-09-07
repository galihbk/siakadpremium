'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

const maxWidthMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'xl',
  children,
  className = '',
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  const maxWidthClass = maxWidthMap[maxWidth] || 'max-w-xl';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] w-screen h-screen min-h-screen bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl ${maxWidthClass} w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto animate-fade-in relative ${className}`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {typeof title === 'string' ? (
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {title}
                  </h2>
                ) : (
                  title
                )}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

// Re-export as ModalPortal for compatibility
export { Modal as ModalPortal };
