'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Info,
  X,
  Loader2,
} from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  isAlert?: boolean; // If true, only shows 1 acknowledge button (like alert)
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Batal',
  type = 'danger',
  isLoading = false,
  isAlert = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, mounted, isLoading, onClose]);

  if (!isOpen || !mounted) return null;

  const getTheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-rose-600" />,
          iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
          defaultConfirmText: 'Ya, Hapus Data',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
          confirmBtn:
            'bg-amber-600 hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500',
          defaultConfirmText: 'Ya, Lanjutkan',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
          confirmBtn:
            'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500',
          defaultConfirmText: 'Selesai',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-[#1E3A8A]" />,
          iconBg: 'bg-blue-50 border-blue-200 text-[#1E3A8A]',
          confirmBtn:
            'bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-sm focus:ring-blue-500',
          defaultConfirmText: 'Mengerti',
        };
    }
  };

  const theme = getTheme();
  const finalConfirmText = confirmText || (isAlert ? 'Mengerti' : theme.defaultConfirmText);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 space-y-5 animate-in zoom-in-95 duration-150 relative"
      >
        {/* Close Icon Button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Content Body */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${theme.iconBg}`}
          >
            {theme.icon}
          </div>
          <div className="flex-1 pt-1 space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {title}
            </h3>
            <div className="text-xs text-slate-600 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          {!isAlert && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              if (onConfirm) {
                await onConfirm();
              } else {
                onClose();
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-60 cursor-pointer ${theme.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{finalConfirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
